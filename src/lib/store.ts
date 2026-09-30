// Resilient In-Memory, Disk-Cached & Serverless Storage Layer for TechVision Careers
import fs from "fs";
import path from "path";
import { ENGINEERING_COURSES } from "./courses-data";
import { generateCertNo, generateOrderId } from "./cert-id";
import { getEmailConfig, saveEmailConfig } from "./email-config";
import { OFFICIAL_ISSUED_ENROLLMENTS } from "./ledger-data";

export interface StoredEnrollment {
  id: string;
  orderId: string;
  userId: string;
  courseId: string;
  userName: string;
  userEmail: string;
  college?: string | null;
  startDate: string;
  endDate: string;
  issueDate: string;
  mode: string;
  amountINR: number;
  paymentId?: string | null;
  utrNumber?: string | null;
  paymentLink?: string | null;
  paymentScreenshot?: string | null;
  lor: boolean;
  paymentStatus: "PENDING" | "SUBMITTED" | "PAID" | "REJECTED";
  course: {
    id: string;
    slug: string;
    title: string;
    category: string;
    priceINR: number;
  };
  certificate?: {
    id: string;
    certNo: string;
    enrollmentId: string;
    pdfUrl: string;
    qrPayload: string;
    issuedAt: string;
    revoked: boolean;
  } | null;
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  type: "ENROLLMENT" | "PAYMENT_PROOF" | "SYSTEM";
  title: string;
  message: string;
  orderId?: string;
  userName?: string;
  userEmail?: string;
  courseTitle?: string;
  amountINR?: number;
  utrNumber?: string | null;
  timestamp: string;
  read: boolean;
}

// Global in-memory cache preserved across warm lambdas
const globalStore = globalThis as unknown as {
  tv_enrollments: Map<string, StoredEnrollment>;
  tv_notifications: AdminNotification[];
};

// Disk cache path: /tmp on Linux/Vercel, project dir on Windows
const CACHE_FILE =
  process.platform === "win32"
    ? path.join(process.cwd(), ".tmp_enrollments.json")
    : "/tmp/tv_enrollments_cache.json";

function loadFromDisk(): Map<string, StoredEnrollment> {
  const map = new Map<string, StoredEnrollment>();
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && item.orderId) {
            map.set(item.orderId, item);
          }
        }
      }
    }
  } catch (e) {
    // Non-critical, ignore disk read failures
  }
  return map;
}

function saveToDisk(map: Map<string, StoredEnrollment>) {
  try {
    const list = Array.from(map.values());
    fs.writeFileSync(CACHE_FILE, JSON.stringify(list), "utf-8");
  } catch (e) {
    // Non-critical, ignore disk write failures
  }
}

// Cloud Storage Sync Endpoints (Persistent across all Vercel Serverless instances)
export const PRIMARY_CLOUD_BIN = "https://extendsclass.com/api/json-storage/bin/cfbafaa";
export const BACKUP_CLOUD_BIN = "https://extendsclass.com/api/json-storage/bin/dcaaaba";
export const TERTIARY_CLOUD_BIN = "https://extendsclass.com/api/json-storage/bin/abbffec";
export const ALL_CLOUD_BINS = [PRIMARY_CLOUD_BIN, BACKUP_CLOUD_BIN, TERTIARY_CLOUD_BIN];

let lastCloudSyncTime = 0;
const CLOUD_SYNC_MIN_INTERVAL_MS = 2000;

function mergeEnrollmentIntoMemory(item: StoredEnrollment) {
  if (!item || !item.orderId) return;
  const existing = globalStore.tv_enrollments.get(item.orderId);
  if (!existing) {
    globalStore.tv_enrollments.set(item.orderId, item);
  } else {
    // Preserve PAID status, cert data, and payment proofs
    const isExistingPaid = existing.paymentStatus === "PAID" || !!existing.certificate;
    const isIncomingPaid = item.paymentStatus === "PAID" || !!item.certificate;
    if (!isExistingPaid && isIncomingPaid) {
      globalStore.tv_enrollments.set(item.orderId, item);
    } else if (!existing.certificate && item.certificate) {
      existing.certificate = item.certificate;
    }
    if (item.paymentStatus === "PAID") existing.paymentStatus = "PAID";
    if (!existing.utrNumber && item.utrNumber) existing.utrNumber = item.utrNumber;
    if (!existing.paymentScreenshot && item.paymentScreenshot) existing.paymentScreenshot = item.paymentScreenshot;
    if (!existing.paymentLink && item.paymentLink) existing.paymentLink = item.paymentLink;
  }
}

export async function syncFromCloud(force = false): Promise<boolean> {
  const now = Date.now();
  if (
    !force &&
    now - lastCloudSyncTime < CLOUD_SYNC_MIN_INTERVAL_MS &&
    globalStore.tv_enrollments &&
    globalStore.tv_enrollments.size > 0
  ) {
    return true;
  }

  const fetchWithTimeout = async (url: string, ms = 7000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  };

  // Fetch all redundant cloud bins in parallel
  const results = await Promise.allSettled(
    ALL_CLOUD_BINS.map((bin) => fetchWithTimeout(bin, 7000))
  );

  let mergedCount = 0;
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const remoteData = r.value;

    // 1. Process enrollmentsMap (deeply merged object)
    if (remoteData.enrollmentsMap && typeof remoteData.enrollmentsMap === "object") {
      for (const item of Object.values(remoteData.enrollmentsMap) as any[]) {
        if (!item || !item.orderId) continue;
        mergeEnrollmentIntoMemory(item);
        mergedCount++;
      }
    }

    // 2. Process enrollments (list array)
    if (Array.isArray(remoteData.enrollments)) {
      for (const item of remoteData.enrollments) {
        if (!item || !item.orderId) continue;
        mergeEnrollmentIntoMemory(item);
        mergedCount++;
      }
    }

    // 3. Process certificatesMap
    if (remoteData.certificatesMap && typeof remoteData.certificatesMap === "object") {
      for (const [certNo, certObj] of Object.entries(remoteData.certificatesMap) as any[]) {
        if (!certNo || !certObj) continue;
        const enr = memoryStore.getEnrollmentByCertNo(certNo);
        if (enr && !enr.certificate) {
          enr.certificate = certObj as any;
        }
      }
    }

    if (remoteData.notificationConfig) {
      saveEmailConfig(remoteData.notificationConfig);
    }
  }

  // Ensure all 14 official pre-seeded enrollments are always in the map
  for (const off of OFFICIAL_ISSUED_ENROLLMENTS) {
    if (!globalStore.tv_enrollments.has(off.orderId)) {
      globalStore.tv_enrollments.set(off.orderId, off);
    }
  }

  if (mergedCount > 0) {
    lastCloudSyncTime = Date.now();
    saveToDisk(globalStore.tv_enrollments);
    return true;
  }
  return false;
}

export async function patchEnrollmentToCloud(enr: StoredEnrollment): Promise<boolean> {
  if (!enr || !enr.orderId) return false;
  try {
    const patchPayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
      enrollmentsMap: {
        [enr.orderId]: enr,
      },
    };

    if (enr.certificate && enr.certificate.certNo) {
      patchPayload.certificatesMap = {
        [enr.certificate.certNo]: {
          ...enr.certificate,
          internName: enr.userName,
          college: enr.college,
          courseTitle: enr.course?.title,
          startDate: enr.startDate,
          endDate: enr.endDate,
          orderId: enr.orderId,
        },
      };
    }

    const jsonBody = JSON.stringify(patchPayload);

    const patchWithTimeout = async (url: string, ms = 6000) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: jsonBody,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        return res.ok;
      } catch (e) {
        clearTimeout(timeout);
        return false;
      }
    };

    const results = await Promise.allSettled(
      ALL_CLOUD_BINS.map((bin) => patchWithTimeout(bin, 6000))
    );

    return results.some((r) => r.status === "fulfilled" && r.value === true);
  } catch (e) {
    return false;
  }
}

export async function syncToCloud(): Promise<boolean> {
  try {
    // 1. Sync from remote first to prevent overwriting other lambdas' enrollments
    await syncFromCloud(true).catch(() => {});

    // 2. Ensure all official pre-seeded enrollments are always in the map
    for (const off of OFFICIAL_ISSUED_ENROLLMENTS) {
      if (!globalStore.tv_enrollments.has(off.orderId)) {
        globalStore.tv_enrollments.set(off.orderId, off);
      }
    }

    // Safety guard: never overwrite if map is unexpectedly empty
    if (globalStore.tv_enrollments.size < OFFICIAL_ISSUED_ENROLLMENTS.length) {
      return false;
    }

    saveToDisk(globalStore.tv_enrollments);
    const list = Array.from(globalStore.tv_enrollments.values());
    const enrollmentsMap: Record<string, StoredEnrollment> = {};
    const certificatesMap: Record<string, any> = {};

    for (const item of list) {
      if (item && item.orderId) {
        enrollmentsMap[item.orderId] = item;
        if (item.certificate?.certNo) {
          certificatesMap[item.certificate.certNo] = {
            ...item.certificate,
            internName: item.userName,
            college: item.college,
            courseTitle: item.course?.title,
            startDate: item.startDate,
            endDate: item.endDate,
            orderId: item.orderId,
          };
        }
      }
    }

    const emailConfig = getEmailConfig();
    const payload = JSON.stringify({
      appName: "TechVision Careers Global Ledger",
      updatedAt: new Date().toISOString(),
      enrollments: list,
      enrollmentsMap,
      certificatesMap,
      notificationConfig: emailConfig,
    });

    const putWithTimeout = async (url: string, ms = 7500) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: payload,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        return res.ok;
      } catch (e) {
        clearTimeout(timeout);
        return false;
      }
    };

    const results = await Promise.allSettled(
      ALL_CLOUD_BINS.map((bin) => putWithTimeout(bin, 7500))
    );

    return results.some((r) => r.status === "fulfilled" && r.value === true);
  } catch (e) {
    return false;
  }
}

if (!globalStore.tv_enrollments) {
  globalStore.tv_enrollments = new Map<string, StoredEnrollment>();

  // Pre-seed all official certified enrollments
  for (const enr of OFFICIAL_ISSUED_ENROLLMENTS) {
    globalStore.tv_enrollments.set(enr.orderId, enr);
  }

  // Hydrate with any saved disk entries
  const diskEntries = loadFromDisk();
  for (const [k, v] of diskEntries.entries()) {
    globalStore.tv_enrollments.set(k, v);
  }
}

export const memoryStore = {
  createEnrollment: (data: {
    courseSlug: string;
    userName: string;
    email: string;
    college?: string | null;
    startDate: string;
    mode?: string;
    orderId?: string;
  }): StoredEnrollment => {
    const courseStatic =
      ENGINEERING_COURSES.find((c) => c.slug === data.courseSlug) ||
      ENGINEERING_COURSES[0];

    const orderId = data.orderId || generateOrderId();
    const start = new Date(data.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (courseStatic.durationDays || 30));

    const enrollment: StoredEnrollment = {
      id: `enr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId,
      userId: `usr_${Date.now()}`,
      courseId: `course_${courseStatic.slug}`,
      userName: data.userName.trim(),
      userEmail: data.email.toLowerCase().trim(),
      college: data.college ? data.college.trim() : null,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      issueDate: new Date().toISOString(),
      mode: data.mode || "Online",
      amountINR: courseStatic.priceINR || 149,
      paymentStatus: "PENDING",
      lor: true,
      course: {
        id: `course_${courseStatic.slug}`,
        slug: courseStatic.slug,
        title: courseStatic.title,
        category: courseStatic.category,
        priceINR: courseStatic.priceINR || 149,
      },
      certificate: null,
      createdAt: new Date().toISOString(),
    };

    globalStore.tv_enrollments.set(orderId, enrollment);
    saveToDisk(globalStore.tv_enrollments);
    patchEnrollmentToCloud(enrollment).catch(() => {});
    syncToCloud().catch(() => {});
    return enrollment;
  },

  registerExternalOrder: (data: {
    orderId: string;
    userName: string;
    userEmail: string;
    courseTitle?: string;
    courseSlug?: string;
    college?: string | null;
    amountINR?: number;
    startDate?: string;
    utrNumber?: string | null;
    paymentScreenshot?: string | null;
    paymentLink?: string | null;
    paymentStatus?: "PENDING" | "SUBMITTED" | "PAID";
  }): StoredEnrollment => {
    // Check if already in memory
    const existing = globalStore.tv_enrollments.get(data.orderId);
    if (existing) {
      if (data.utrNumber) existing.utrNumber = data.utrNumber;
      if (data.paymentScreenshot) existing.paymentScreenshot = data.paymentScreenshot;
      if (data.paymentLink) existing.paymentLink = data.paymentLink;
      if (data.paymentStatus) existing.paymentStatus = data.paymentStatus;
      saveToDisk(globalStore.tv_enrollments);
      patchEnrollmentToCloud(existing).catch(() => {});
      syncToCloud().catch(() => {});
      return existing;
    }

    const courseStatic =
      (data.courseSlug && ENGINEERING_COURSES.find((c) => c.slug === data.courseSlug)) ||
      (data.courseTitle && ENGINEERING_COURSES.find((c) => c.title.toLowerCase() === data.courseTitle?.toLowerCase())) ||
      ENGINEERING_COURSES[0];

    const start = data.startDate ? new Date(data.startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 30);

    const enrollment: StoredEnrollment = {
      id: `enr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId: data.orderId,
      userId: `usr_${Date.now()}`,
      courseId: `course_${courseStatic.slug}`,
      userName: (data.userName || "Candidate").trim(),
      userEmail: (data.userEmail || "candidate@gmail.com").toLowerCase().trim(),
      college: data.college ? data.college.trim() : null,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      issueDate: new Date().toISOString(),
      mode: "Online",
      amountINR: data.amountINR || courseStatic.priceINR || 149,
      paymentStatus: data.paymentStatus || "SUBMITTED",
      utrNumber: data.utrNumber || null,
      paymentScreenshot: data.paymentScreenshot || null,
      paymentLink: data.paymentLink || null,
      lor: true,
      course: {
        id: `course_${courseStatic.slug}`,
        slug: courseStatic.slug,
        title: data.courseTitle || courseStatic.title,
        category: courseStatic.category,
        priceINR: data.amountINR || courseStatic.priceINR || 149,
      },
      certificate: null,
      createdAt: new Date().toISOString(),
    };

    globalStore.tv_enrollments.set(data.orderId, enrollment);
    saveToDisk(globalStore.tv_enrollments);
    patchEnrollmentToCloud(enrollment).catch(() => {});
    syncToCloud().catch(() => {});
    return enrollment;
  },

  getEnrollmentByOrderId: (orderId: string): StoredEnrollment | undefined => {
    let enr = globalStore.tv_enrollments.get(orderId);
    if (!enr) {
      // Re-check disk cache in case written by another process
      const diskEntries = loadFromDisk();
      enr = diskEntries.get(orderId);
      if (enr) {
        globalStore.tv_enrollments.set(orderId, enr);
      }
    }
    return enr;
  },

  getEnrollmentByCertNo: (certNo: string): StoredEnrollment | undefined => {
    if (!certNo) return undefined;
    // Normalize dashes (standard hyphen, en-dash, em-dash, minus, etc.)
    const clean = certNo.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-").trim().toLowerCase();

    // 1. Direct search in memory
    for (const enr of globalStore.tv_enrollments.values()) {
      const enrCertNo = (enr.certificate?.certNo || "").replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-").trim().toLowerCase();
      if (enrCertNo && enrCertNo === clean) return enr;
      if (enr.orderId && enr.orderId.trim().toLowerCase() === clean) return enr;
    }

    // 2. Direct search in OFFICIAL_ISSUED_ENROLLMENTS
    for (const enr of OFFICIAL_ISSUED_ENROLLMENTS) {
      const enrCertNo = (enr.certificate?.certNo || "").replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-").trim().toLowerCase();
      if (enrCertNo && enrCertNo === clean) {
        globalStore.tv_enrollments.set(enr.orderId, enr);
        return enr;
      }
      if (enr.orderId && enr.orderId.trim().toLowerCase() === clean) {
        globalStore.tv_enrollments.set(enr.orderId, enr);
        return enr;
      }
    }

    // 3. Re-check disk
    const diskEntries = loadFromDisk();
    for (const enr of diskEntries.values()) {
      const enrCertNo = (enr.certificate?.certNo || "").replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-").trim().toLowerCase();
      if (enrCertNo && enrCertNo === clean) {
        globalStore.tv_enrollments.set(enr.orderId, enr);
        return enr;
      }
      if (enr.orderId && enr.orderId.trim().toLowerCase() === clean) {
        globalStore.tv_enrollments.set(enr.orderId, enr);
        return enr;
      }
    }

    // 4. Suffix match (e.g. searching '1054' matches 'TVC-IN-2026-1054')
    const matchSuffix = clean.replace(/[^0-9]/g, "");
    if (matchSuffix.length >= 4) {
      for (const enr of globalStore.tv_enrollments.values()) {
        const enrCertNo = (enr.certificate?.certNo || "").replace(/[^0-9]/g, "");
        if (enrCertNo.endsWith(matchSuffix)) return enr;
      }
      for (const enr of OFFICIAL_ISSUED_ENROLLMENTS) {
        const enrCertNo = (enr.certificate?.certNo || "").replace(/[^0-9]/g, "");
        if (enrCertNo.endsWith(matchSuffix)) {
          globalStore.tv_enrollments.set(enr.orderId, enr);
          return enr;
        }
      }
    }

    return undefined;
  },

  getAllEnrollments: (): StoredEnrollment[] => {
    const diskEntries = loadFromDisk();
    for (const [k, v] of diskEntries.entries()) {
      if (!globalStore.tv_enrollments.has(k)) {
        globalStore.tv_enrollments.set(k, v);
      }
    }
    // Refresh from cloud in background if cache is stale
    if (Date.now() - lastCloudSyncTime > 3500) {
      syncFromCloud().catch(() => {});
    }
    return Array.from(globalStore.tv_enrollments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  submitPaymentProof: (
    orderId: string,
    proof: {
      utrNumber?: string | null;
      paymentScreenshot?: string | null;
      paymentLink?: string | null;
      isSimulated?: boolean;
    }
  ): StoredEnrollment | undefined => {
    let enr = memoryStore.getEnrollmentByOrderId(orderId);
    if (!enr) return undefined;

    enr.utrNumber =
      proof.utrNumber ||
      enr.utrNumber ||
      (proof.paymentScreenshot ? "SCREENSHOT_PROOF" : null);
    enr.paymentScreenshot = proof.paymentScreenshot || enr.paymentScreenshot;
    enr.paymentLink = proof.paymentLink || enr.paymentLink;

    if (proof.isSimulated) {
      enr.paymentStatus = "PAID";
      if (!enr.certificate) {
        const certNo = generateCertNo();
        enr.certificate = {
          id: `cert_${Date.now()}`,
          certNo,
          enrollmentId: enr.id,
          pdfUrl: `/api/certificates/${certNo}/pdf`,
          qrPayload: `https://techvision-careers.vercel.app/verify/${certNo}`,
          issuedAt: new Date().toISOString(),
          revoked: false,
        };
      }
    } else {
      enr.paymentStatus = "SUBMITTED";
    }

    globalStore.tv_enrollments.set(orderId, enr);
    saveToDisk(globalStore.tv_enrollments);
    patchEnrollmentToCloud(enr).catch(() => {});
    syncToCloud().catch(() => {});
    return enr;
  },

  approveAndIssueCertificate: (orderId: string): StoredEnrollment | undefined => {
    let enr = memoryStore.getEnrollmentByOrderId(orderId);
    if (!enr) {
      for (const val of globalStore.tv_enrollments.values()) {
        if (val.orderId && val.orderId.toLowerCase() === (orderId || "").toLowerCase()) {
          enr = val;
          break;
        }
      }
    }
    if (!enr) return undefined;

    enr.paymentStatus = "PAID";
    if (!enr.certificate) {
      const certNo = generateCertNo();
      enr.certificate = {
        id: `cert_${Date.now()}`,
        certNo,
        enrollmentId: enr.id,
        pdfUrl: `/api/certificates/${certNo}/pdf`,
        qrPayload: `https://techvision-careers.vercel.app/verify/${certNo}`,
        issuedAt: new Date().toISOString(),
        revoked: false,
      };
    }

    globalStore.tv_enrollments.set(orderId, enr);
    saveToDisk(globalStore.tv_enrollments);
    patchEnrollmentToCloud(enr).catch(() => {});
    syncToCloud().catch(() => {});
    return enr;
  },

  rejectPayment: (orderId: string): StoredEnrollment | undefined => {
    let enr = memoryStore.getEnrollmentByOrderId(orderId);
    if (!enr) return undefined;

    enr.paymentStatus = "REJECTED";
    globalStore.tv_enrollments.set(orderId, enr);
    saveToDisk(globalStore.tv_enrollments);
    patchEnrollmentToCloud(enr).catch(() => {});
    syncToCloud().catch(() => {});
    return enr;
  },

  addStudentDirectly: (data: {
    userName: string;
    userEmail: string;
    college?: string | null;
    courseSlug: string;
    mode?: string;
    startDate?: string;
    amountINR?: number;
    paymentStatus?: "PAID" | "SUBMITTED" | "PENDING";
    utrNumber?: string | null;
    issueCertificate?: boolean;
  }): StoredEnrollment => {
    const courseStatic =
      ENGINEERING_COURSES.find((c) => c.slug === data.courseSlug) ||
      ENGINEERING_COURSES[0];

    const orderId = generateOrderId();
    const start = data.startDate ? new Date(data.startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + (courseStatic.durationDays || 30));

    const status = data.paymentStatus || (data.issueCertificate ? "PAID" : "PENDING");
    let certificate = null;

    if (status === "PAID" || data.issueCertificate) {
      const certNo = generateCertNo();
      certificate = {
        id: `cert_${Date.now()}`,
        certNo,
        enrollmentId: `enr_${Date.now()}`,
        pdfUrl: `/api/certificates/${certNo}/pdf`,
        qrPayload: `https://techvision-careers.vercel.app/verify/${certNo}`,
        issuedAt: new Date().toISOString(),
        revoked: false,
      };
    }

    const enrollment: StoredEnrollment = {
      id: `enr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId,
      userId: `usr_${Date.now()}`,
      courseId: `course_${courseStatic.slug}`,
      userName: data.userName.trim(),
      userEmail: data.userEmail.toLowerCase().trim(),
      college: data.college ? data.college.trim() : null,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      issueDate: new Date().toISOString(),
      mode: data.mode || "Hybrid",
      amountINR: data.amountINR || courseStatic.priceINR || 149,
      paymentStatus: status,
      utrNumber: data.utrNumber || null,
      lor: true,
      course: {
        id: `course_${courseStatic.slug}`,
        slug: courseStatic.slug,
        title: courseStatic.title,
        category: courseStatic.category,
        priceINR: data.amountINR || courseStatic.priceINR || 149,
      },
      certificate,
      createdAt: new Date().toISOString(),
    };

    globalStore.tv_enrollments.set(orderId, enrollment);
    saveToDisk(globalStore.tv_enrollments);
    patchEnrollmentToCloud(enrollment).catch(() => {});
    syncToCloud().catch(() => {});
    return enrollment;
  },

  deleteOrder: (orderId: string): boolean => {
    const deleted = globalStore.tv_enrollments.delete(orderId);
    if (deleted) {
      saveToDisk(globalStore.tv_enrollments);
      syncToCloud().catch(() => {});
    }
    return deleted;
  },

  toggleRevoke: (certNo: string, revoke: boolean): StoredEnrollment | undefined => {
    for (const enr of globalStore.tv_enrollments.values()) {
      if (enr.certificate && enr.certificate.certNo === certNo) {
        enr.certificate.revoked = revoke;
        globalStore.tv_enrollments.set(enr.orderId, enr);
        saveToDisk(globalStore.tv_enrollments);
        patchEnrollmentToCloud(enr).catch(() => {});
        syncToCloud().catch(() => {});
        return enr;
      }
    }
    return undefined;
  },

  patchEnrollmentToCloud,
  syncFromCloud,
  syncToCloud,

  getAllEnrollmentsAsync: async (): Promise<StoredEnrollment[]> => {
    await syncFromCloud();
    return memoryStore.getAllEnrollments();
  },

  getEnrollmentByOrderIdAsync: async (orderId: string): Promise<StoredEnrollment | undefined> => {
    let enr = memoryStore.getEnrollmentByOrderId(orderId);
    if (!enr) {
      await syncFromCloud();
      enr = memoryStore.getEnrollmentByOrderId(orderId);
    }
    return enr;
  },

  getEnrollmentByCertNoAsync: async (certNo: string): Promise<StoredEnrollment | undefined> => {
    let enr = memoryStore.getEnrollmentByCertNo(certNo);
    if (!enr) {
      await syncFromCloud();
      enr = memoryStore.getEnrollmentByCertNo(certNo);
    }
    return enr;
  },

  addNotification: (data: Omit<AdminNotification, "id" | "timestamp" | "read">): AdminNotification => {
    if (!globalStore.tv_notifications) globalStore.tv_notifications = [];
    const notif: AdminNotification = {
      ...data,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    globalStore.tv_notifications.unshift(notif);
    if (globalStore.tv_notifications.length > 100) {
      globalStore.tv_notifications = globalStore.tv_notifications.slice(0, 100);
    }
    return notif;
  },

  getNotifications: (): AdminNotification[] => {
    if (!globalStore.tv_notifications) globalStore.tv_notifications = [];
    return globalStore.tv_notifications;
  },

  markAllNotificationsRead: (): void => {
    if (globalStore.tv_notifications) {
      for (const n of globalStore.tv_notifications) {
        n.read = true;
      }
    }
  },
};