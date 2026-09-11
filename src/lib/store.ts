// Resilient In-Memory, Disk-Cached & Serverless Storage Layer for TechVision Careers
import fs from "fs";
import path from "path";
import { ENGINEERING_COURSES } from "./courses-data";
import { generateCertNo, generateOrderId } from "./cert-id";
import { getEmailConfig, saveEmailConfig } from "./email-config";

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

let lastCloudSyncTime = 0;
const CLOUD_SYNC_MIN_INTERVAL_MS = 2500;

export async function syncFromCloud(): Promise<boolean> {
  const now = Date.now();
  if (
    now - lastCloudSyncTime < CLOUD_SYNC_MIN_INTERVAL_MS &&
    globalStore.tv_enrollments &&
    globalStore.tv_enrollments.size > 0
  ) {
    return true;
  }

  const fetchWithTimeout = async (url: string, ms = 9000) => {
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

  let remoteData: any = null;
  try {
    remoteData = await fetchWithTimeout(PRIMARY_CLOUD_BIN);
  } catch (err1) {
    try {
      remoteData = await fetchWithTimeout(BACKUP_CLOUD_BIN);
    } catch (err2) {
      return false;
    }
  }

  if (remoteData && Array.isArray(remoteData.enrollments)) {
    lastCloudSyncTime = Date.now();
    for (const item of remoteData.enrollments) {
      if (!item || !item.orderId) continue;
      const existing = globalStore.tv_enrollments.get(item.orderId);
      if (!existing) {
        globalStore.tv_enrollments.set(item.orderId, item);
      } else {
        // Merge & update state: preserve PAID status, cert data, and payment proofs
        const isExistingPaid = existing.paymentStatus === "PAID" || !!existing.certificate;
        const isIncomingPaid = item.paymentStatus === "PAID" || !!item.certificate;
        if (!isExistingPaid && isIncomingPaid) {
          globalStore.tv_enrollments.set(item.orderId, item);
        } else if (!existing.certificate && item.certificate) {
          existing.certificate = item.certificate;
        }
        if (!existing.utrNumber && item.utrNumber) existing.utrNumber = item.utrNumber;
        if (!existing.paymentScreenshot && item.paymentScreenshot) existing.paymentScreenshot = item.paymentScreenshot;
        if (!existing.paymentLink && item.paymentLink) existing.paymentLink = item.paymentLink;
      }
    }
    if (remoteData && remoteData.notificationConfig) {
      saveEmailConfig(remoteData.notificationConfig);
    }
    saveToDisk(globalStore.tv_enrollments);
    return true;
  }
  return false;
}

export async function syncToCloud(): Promise<boolean> {
  try {
    saveToDisk(globalStore.tv_enrollments);
    const list = Array.from(globalStore.tv_enrollments.values());
    const emailConfig = getEmailConfig();
    const payload = JSON.stringify({
      appName: "TechVision Careers Global Ledger",
      updatedAt: new Date().toISOString(),
      enrollments: list,
      notificationConfig: emailConfig,
    });

    const putWithTimeout = async (url: string, ms = 9000) => {
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

    const [ok1, ok2] = await Promise.allSettled([
      putWithTimeout(PRIMARY_CLOUD_BIN),
      putWithTimeout(BACKUP_CLOUD_BIN),
    ]);

    return (
      (ok1.status === "fulfilled" && ok1.value) ||
      (ok2.status === "fulfilled" && ok2.value) ||
      false
    );
  } catch (e) {
    return false;
  }
}

if (!globalStore.tv_enrollments) {
  globalStore.tv_enrollments = new Map<string, StoredEnrollment>();

  // 1. Pre-seed Pooja Patel
  const poojaCertNo = "TVC-IN-2026-2128";
  const poojaOrderId = "ORD-TVC-2026-POOJA";
  globalStore.tv_enrollments.set(poojaOrderId, {
    id: "enr_pooja_1",
    orderId: poojaOrderId,
    userId: "usr_pooja",
    userName: "Pooja Patel",
    userEmail: "pooja.patel@example.com",
    college: "Government engineering college Azamgarh",
    courseId: "course_python_ml",
    startDate: new Date("2026-09-07").toISOString(),
    endDate: new Date("2026-10-22").toISOString(),
    issueDate: new Date("2026-09-08").toISOString(),
    mode: "Hybrid",
    amountINR: 149,
    paymentStatus: "PAID",
    lor: true,
    course: {
      id: "course_python_ml",
      slug: "python-for-machine-learning",
      title: "Python for Machine Learning",
      category: "AI/ML",
      priceINR: 149,
    },
    certificate: {
      id: "cert_pooja_1",
      certNo: poojaCertNo,
      enrollmentId: "enr_pooja_1",
      pdfUrl: `/api/certificates/${poojaCertNo}/pdf`,
      qrPayload: `https://techvision-careers.vercel.app/verify/${poojaCertNo}`,
      issuedAt: new Date("2026-09-08").toISOString(),
      revoked: false,
    },
    createdAt: new Date().toISOString(),
  });

  // 2. Pre-seed Roshan Singh
  const roshanCertNo = "TVC-IN-2026-0142";
  const roshanOrderId = "ORD-TVC-2026-DEMO";
  globalStore.tv_enrollments.set(roshanOrderId, {
    id: "enr_demo_1",
    orderId: roshanOrderId,
    userId: "usr_demo_1",
    userName: "Roshan Singh",
    userEmail: "roshan.singh@example.com",
    college: "Indian Institute of Technology",
    courseId: "course_web_dev",
    startDate: new Date("2026-06-12").toISOString(),
    endDate: new Date("2026-07-12").toISOString(),
    issueDate: new Date("2026-06-12").toISOString(),
    mode: "Online",
    amountINR: 149,
    paymentStatus: "PAID",
    lor: true,
    course: {
      id: "course_web_dev",
      slug: "full-stack-web-development-react-node",
      title: "Full-Stack Web Development with React & Node",
      category: "Web",
      priceINR: 149,
    },
    certificate: {
      id: "cert_demo_1",
      certNo: roshanCertNo,
      enrollmentId: "enr_demo_1",
      pdfUrl: `/api/certificates/${roshanCertNo}/pdf`,
      qrPayload: `https://techvision-careers.vercel.app/verify/${roshanCertNo}`,
      issuedAt: new Date("2026-06-12").toISOString(),
      revoked: false,
    },
    createdAt: "2026-08-22T14:39:46.419Z",
  });

  // 3. Pre-seed Roshan Patel
  const roshanPatelCertNo = "TVC-IN-2026-4847";
  const roshanPatelOrderId = "ORD-MT4LQ67E-FN3J";
  globalStore.tv_enrollments.set(roshanPatelOrderId, {
    id: "enr_roshan_patel_1",
    orderId: roshanPatelOrderId,
    userId: "usr_roshan_patel",
    userName: "Roshan Patel",
    userEmail: "patelroshansingh7@gmail.com",
    college: "REC Azamgarh",
    courseId: "course_genai",
    startDate: new Date("2026-08-22").toISOString(),
    endDate: new Date("2026-10-06").toISOString(),
    issueDate: new Date("2026-08-22").toISOString(),
    mode: "Hybrid",
    amountINR: 149,
    paymentStatus: "PAID",
    lor: true,
    course: {
      id: "course_genai",
      slug: "generative-ai-llm-apps-openai-langchain",
      title: "Generative AI & LLM Apps (OpenAI / LangChain)",
      category: "AI/ML",
      priceINR: 149,
    },
    certificate: {
      id: "cert_roshan_patel_1",
      certNo: roshanPatelCertNo,
      enrollmentId: "enr_roshan_patel_1",
      pdfUrl: `/api/certificates/${roshanPatelCertNo}/pdf`,
      qrPayload: `https://techvision-careers.vercel.app/verify/${roshanPatelCertNo}`,
      issuedAt: "2026-08-22T16:37:50.207Z",
      revoked: false,
    },
    createdAt: "2026-08-22T16:37:35.596Z",
  });

  // 4. Pre-seed ram
  const ramCertNo = "TVC-IN-2026-4417";
  const ramOrderId = "ORD-MT4MBESN-OMVR";
  globalStore.tv_enrollments.set(ramOrderId, {
    id: "enr_ram_1",
    orderId: ramOrderId,
    userId: "usr_ram",
    userName: "ram",
    userEmail: "pahsdghyehdhj@gmail.com",
    college: "REC Azamgarh",
    courseId: "course_web_dev",
    startDate: new Date("2026-08-12").toISOString(),
    endDate: new Date("2026-09-11").toISOString(),
    issueDate: new Date("2026-08-22").toISOString(),
    mode: "Hybrid",
    amountINR: 149,
    paymentStatus: "PAID",
    lor: true,
    course: {
      id: "course_web_dev",
      slug: "full-stack-web-development-react-node",
      title: "Full-Stack Web Development with React & Node",
      category: "Web",
      priceINR: 149,
    },
    certificate: {
      id: "cert_ram_1",
      certNo: ramCertNo,
      enrollmentId: "enr_ram_1",
      pdfUrl: `/api/certificates/${ramCertNo}/pdf`,
      qrPayload: `https://techvision-careers.vercel.app/verify/${ramCertNo}`,
      issuedAt: "2026-08-22T16:54:06.507Z",
      revoked: false,
    },
    createdAt: "2026-08-22T16:54:06.507Z",
  });

  // 5. Pre-seed Ritesh kushwaha
  const riteshCertNo = "TVC-IN-2026-1982";
  const riteshOrderId = "ORD-MT4NKGYN-9JQ6";
  globalStore.tv_enrollments.set(riteshOrderId, {
    id: "enr_ritesh_1",
    orderId: riteshOrderId,
    userId: "usr_ritesh",
    userName: "Ritesh kushwaha",
    userEmail: "riteshkushwaha@gmail.com",
    college: "REC Azamgarh",
    courseId: "course_python_ml",
    startDate: new Date("2026-08-22").toISOString(),
    endDate: new Date("2026-10-06").toISOString(),
    issueDate: new Date("2026-08-22").toISOString(),
    mode: "Online",
    amountINR: 149,
    utrNumber: "6543654335",
    paymentStatus: "PAID",
    lor: true,
    course: {
      id: "course_python_ml",
      slug: "python-for-machine-learning",
      title: "Python for Machine Learning",
      category: "AI/ML",
      priceINR: 149,
    },
    certificate: {
      id: "cert_ritesh_1",
      certNo: riteshCertNo,
      enrollmentId: "enr_ritesh_1",
      pdfUrl: `/api/certificates/${riteshCertNo}/pdf`,
      qrPayload: `https://techvision-careers.vercel.app/verify/${riteshCertNo}`,
      issuedAt: "2026-08-22T17:31:24.372Z",
      revoked: false,
    },
    createdAt: "2026-08-22T17:29:08.834Z",
  });

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
    for (const enr of globalStore.tv_enrollments.values()) {
      if (enr.certificate && enr.certificate.certNo === certNo) {
        return enr;
      }
    }
    // Re-check disk
    const diskEntries = loadFromDisk();
    for (const enr of diskEntries.values()) {
      if (enr.certificate && enr.certificate.certNo === certNo) {
        globalStore.tv_enrollments.set(enr.orderId, enr);
        return enr;
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

    enr.utrNumber = proof.utrNumber || enr.utrNumber;
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
    syncToCloud().catch(() => {});
    return enr;
  },

  rejectPayment: (orderId: string): StoredEnrollment | undefined => {
    let enr = memoryStore.getEnrollmentByOrderId(orderId);
    if (!enr) return undefined;

    enr.paymentStatus = "REJECTED";
    globalStore.tv_enrollments.set(orderId, enr);
    saveToDisk(globalStore.tv_enrollments);
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
        syncToCloud().catch(() => {});
        return enr;
      }
    }
    return undefined;
  },

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