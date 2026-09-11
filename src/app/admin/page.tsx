"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Award,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  BookOpen,
  LogOut,
  Search,
  Eye,
  FileImage,
  Copy,
  Check,
  Clock,
  User,
  X,
  Download,
  Loader2,
  Lock,
  Mail,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Bell,
  BellRing,
  Smartphone,
  MessageSquare,
  Volume2,
  VolumeX,
  CheckCheck,
  UserPlus,
  PlusCircle,
  FileSpreadsheet,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { ENGINEERING_COURSES } from "@/lib/courses-data";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Notification Settings State
  const [activeNotifTab, setActiveNotifTab] = useState<"mobile" | "email">("mobile");
  const [adminPhone, setAdminPhone] = useState("9555593671");
  const [ntfyTopic, setNtfyTopic] = useState("techvision_admin_9555593671");
  const [subscribeUrl, setSubscribeUrl] = useState("https://ntfy.sh/techvision_admin_9555593671");
  const [whatsappPhone, setWhatsappPhone] = useState("919555593671");
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [fast2smsApiKey, setFast2smsApiKey] = useState("");
  const [showWhatsappGuide, setShowWhatsappGuide] = useState(false);

  const [adminEmail, setAdminEmail] = useState("patelroshansingh7@gmail.com");
  const [senderEmail, setSenderEmail] = useState("patelroshansingh7@gmail.com");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [mobileStatusMsg, setMobileStatusMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingMobile, setTestingMobile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showEmailGuide, setShowEmailGuide] = useState(false);

  // In-App Real-time Notifications & Sound
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopPerm, setDesktopPerm] = useState("default");
  const lastOrdersCountRef = useRef<number>(0);

  // Modal State for Viewing Payment Screenshot
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<any | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Modal State for Adding New Student Directly
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentCollege, setNewStudentCollege] = useState("");
  const [newStudentCourse, setNewStudentCourse] = useState("full-stack-web-development-react-node");
  const [newStudentMode, setNewStudentMode] = useState("Hybrid");
  const [newStudentStatus, setNewStudentStatus] = useState<"PAID" | "PENDING">("PAID");
  const [newStudentUtr, setNewStudentUtr] = useState("");
  const [creatingStudent, setCreatingStudent] = useState(false);

  // Web Audio Chime Synthesizer
  const playNotificationSound = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  };

  const requestDesktopNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setDesktopPerm(perm);
      if (perm === "granted") {
        new Notification("🔔 TechVision Alerts Enabled!", {
          body: "You will now receive desktop notifications whenever a student enrolls.",
          icon: "/icon.png",
        });
      }
    }
  };

  // Check Admin Authentication Guard & Hydrate Local Cache
  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("tv_admin_session");
      if (session !== "true") {
        router.replace("/admin/login");
        return;
      }
      setIsAuthorized(true);

      // Fast initial load from client local storage
      const cachedOrders = localStorage.getItem("tv_admin_orders_ledger_v2");
      if (cachedOrders) {
        try {
          const parsed = JSON.parse(cachedOrders);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
          }
        } catch (e) {}
      }

      fetchAdminData();
      if ("Notification" in window) {
        setDesktopPerm(Notification.permission);
      }
    }
  }, []);

  // Real-time background polling (every 8 seconds for instant enrollment detection)
  useEffect(() => {
    if (!isAuthorized) return;
    const interval = setInterval(async () => {
      try {
        const [ordersRes, emailRes] = await Promise.all([
          fetch("/api/admin/orders", { headers: { "x-admin-key": "tv_secret_admin_session_valid" } }),
          fetch("/api/admin/email-settings"),
        ]);
        const ordersData = await ordersRes.json();
        const emailData = await emailRes.json();

        if (ordersData.success && ordersData.enrollments) {
          const currentCount = ordersData.enrollments.length;
          const prevCount = lastOrdersCountRef.current;

          if (prevCount > 0 && currentCount > prevCount) {
            const newOrder = ordersData.enrollments[0];
            playNotificationSound();
            setActionMessage(`🔔 New Enrollment: ${newOrder.userName} enrolled in ${newOrder.course?.title || "Internship"}!`);
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("🎓 New Enrollment - TechVision Careers", {
                body: `${newOrder.userName} enrolled in ${newOrder.course?.title || "Internship"} (₹149)`,
                icon: "/icon.png",
              });
            }
          }
          lastOrdersCountRef.current = currentCount;
          setOrders(ordersData.enrollments);
          if (typeof window !== "undefined") {
            localStorage.setItem("tv_admin_orders_ledger_v2", JSON.stringify(ordersData.enrollments));
          }
        }

        if (emailData.success) {
          if (emailData.notifications) setNotifications(emailData.notifications);
          if (typeof emailData.unreadCount === "number") setUnreadCount(emailData.unreadCount);
        }
      } catch (err) {}
    }, 8000);

    return () => clearInterval(interval);
  }, [isAuthorized, soundEnabled]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, emailRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/orders", { headers: { "x-admin-key": "tv_secret_admin_session_valid" } }),
        fetch("/api/admin/email-settings"),
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      const emailData = await emailRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (ordersData.success && ordersData.enrollments) {
        setOrders(ordersData.enrollments);
        lastOrdersCountRef.current = ordersData.enrollments.length;
        if (typeof window !== "undefined") {
          localStorage.setItem("tv_admin_orders_ledger_v2", JSON.stringify(ordersData.enrollments));
        }
      }
      if (emailData.success) {
        if (emailData.settings) {
          if (emailData.settings.adminEmail) setAdminEmail(emailData.settings.adminEmail);
          if (emailData.settings.adminPhone) setAdminPhone(emailData.settings.adminPhone);
          if (emailData.settings.senderEmail) setSenderEmail(emailData.settings.senderEmail);
          if (emailData.settings.ntfyTopic) setNtfyTopic(emailData.settings.ntfyTopic);
          if (emailData.settings.subscribeUrl) setSubscribeUrl(emailData.settings.subscribeUrl);
          if (emailData.settings.whatsappPhone) setWhatsappPhone(emailData.settings.whatsappPhone);
          setEmailConfigured(emailData.settings.isConfigured);
        }
        if (emailData.notifications) setNotifications(emailData.notifications);
        if (typeof emailData.unreadCount === "number") setUnreadCount(emailData.unreadCount);
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllNotificationSettings = async () => {
    setSavingSettings(true);
    setEmailStatusMsg(null);
    setMobileStatusMsg(null);
    try {
      const res = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          adminPhone,
          senderEmail,
          gmailAppPassword,
          ntfyTopic,
          whatsappApiKey,
          whatsappPhone,
          fast2smsApiKey,
          action: "SAVE",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailConfigured(data.isConfigured);
        setEmailStatusMsg({ text: "Notification settings saved successfully! ✅", type: "success" });
        setMobileStatusMsg({ text: "Mobile settings saved successfully! ✅", type: "success" });
      } else {
        setEmailStatusMsg({ text: data.message || "Failed to save settings", type: "error" });
      }
    } catch (err: any) {
      setEmailStatusMsg({ text: err.message || "Error saving", type: "error" });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestMobile = async () => {
    setTestingMobile(true);
    setMobileStatusMsg({ text: `Sending live test alert to mobile phone (${adminPhone})...`, type: "info" });
    try {
      const res = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPhone,
          ntfyTopic,
          whatsappApiKey,
          whatsappPhone,
          fast2smsApiKey,
          action: "TEST_MOBILE",
        }),
      });
      const data = await res.json();
      if (data.success) {
        playNotificationSound();
        setMobileStatusMsg({
          text: `✅ Alert sent to your phone! Topic: "${data.topic}". Check your mobile screen.`,
          type: "success",
        });
      } else {
        setMobileStatusMsg({
          text: `❌ ${data.message || "Mobile alert failed"}`,
          type: "error",
        });
      }
    } catch (err: any) {
      setMobileStatusMsg({
        text: `❌ Error: ${err.message}`,
        type: "error",
      });
    } finally {
      setTestingMobile(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setEmailStatusMsg({ text: `Sending real test email to ${adminEmail}...`, type: "info" });
    try {
      const res = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          senderEmail,
          gmailAppPassword,
          action: "TEST_EMAIL",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailConfigured(true);
        setEmailStatusMsg({
          text: `✅ Success! Test email delivered to ${adminEmail}! Check your inbox (or Spam folder).`,
          type: "success",
        });
      } else {
        setEmailStatusMsg({
          text: `❌ ${data.message}`,
          type: "error",
        });
      }
    } catch (err: any) {
      setEmailStatusMsg({
        text: `❌ Connection error: ${err.message}`,
        type: "error",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_READ" }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {}
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tv_admin_session");
    }
    router.replace("/admin/login");
  };

  const handleApproveAndGenerate = async (orderId: string) => {
    try {
      const targetOrder = orders.find((o) => o.orderId === orderId);
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId
            ? {
                ...o,
                paymentStatus: "PAID",
                certificate: o.certificate || {
                  id: `cert_${Date.now()}`,
                  certNo: `TVC-IN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                  pdfUrl: "",
                  qrPayload: `https://techvision-careers.vercel.app/admin`,
                  issuedAt: new Date().toISOString(),
                  revoked: false,
                },
              }
            : o
        )
      );

      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "tv_secret_admin_session_valid",
        },
        body: JSON.stringify({
          orderId,
          action: "APPROVE_AND_GENERATE",
          order: targetOrder,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        if (previewOrder?.orderId === orderId) {
          setPreviewImage(null);
          setPreviewOrder(null);
        }

        // Update with real server cert if returned
        if (data.order?.certificate || data.certNo) {
          setOrders((prev) => {
            const updated = prev.map((o) =>
              o.orderId === orderId
                ? {
                    ...o,
                    paymentStatus: "PAID",
                    certificate: data.order?.certificate || {
                      id: `cert_${Date.now()}`,
                      certNo: data.certNo,
                      pdfUrl: `/api/certificates/${data.certNo}/pdf`,
                      qrPayload: `https://techvision-careers.vercel.app/verify/${data.certNo}`,
                      issuedAt: new Date().toISOString(),
                      revoked: false,
                    },
                  }
                : o
            );
            if (typeof window !== "undefined") {
              localStorage.setItem("tv_admin_orders_ledger_v2", JSON.stringify(updated));
            }
            return updated;
          });
        }

        fetchAdminData();
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!confirm("Are you sure you want to reject this payment proof?")) return;
    try {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, paymentStatus: "REJECTED" } : o))
      );

      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "tv_secret_admin_session_valid",
        },
        body: JSON.stringify({ orderId, action: "REJECT" }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        if (previewOrder?.orderId === orderId) {
          setPreviewImage(null);
          setPreviewOrder(null);
        }
        fetchAdminData();
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeToggle = async (certNo: string, currentRevoked: boolean) => {
    try {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.certificate?.certNo === certNo
            ? {
                ...o,
                certificate: {
                  ...o.certificate,
                  revoked: !currentRevoked,
                },
              }
            : o
        )
      );

      const res = await fetch("/api/admin/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certNo, revoke: !currentRevoked }),
      });
      const data = await res.json();
      setActionMessage(data.message);
      fetchAdminData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOrder = async (orderId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete order #${orderId} (${studentName})?`)) return;
    try {
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "tv_secret_admin_session_valid",
        },
        body: JSON.stringify({ orderId, action: "DELETE_ORDER" }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        fetchAdminData();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (e) {}
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) {
      alert("Please enter student name and email.");
      return;
    }

    setCreatingStudent(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "tv_secret_admin_session_valid",
        },
        body: JSON.stringify({
          action: "ADD_STUDENT",
          userName: newStudentName.trim(),
          userEmail: newStudentEmail.trim(),
          college: newStudentCollege.trim() || "Engineering Institute",
          courseSlug: newStudentCourse,
          mode: newStudentMode,
          amountINR: 149,
          paymentStatus: newStudentStatus,
          utrNumber: newStudentUtr.trim() || null,
          issueCertificate: newStudentStatus === "PAID",
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setActionMessage(data.message);
        setOrders((prev) => [data.order, ...prev]);
        setShowAddStudentModal(false);
        setNewStudentName("");
        setNewStudentEmail("");
        setNewStudentCollege("");
        setNewStudentUtr("");
        fetchAdminData();
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        alert(data.message || "Failed to add student.");
      }
    } catch (err: any) {
      alert("Error adding student: " + err.message);
    } finally {
      setCreatingStudent(false);
    }
  };

  const handleExportLedger = () => {
    try {
      const dataStr =
        "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `techvision_student_ledger_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setActionMessage("📥 Student credential ledger exported successfully as JSON backup!");
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {}
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 3000);
  };

  if (!isAuthorized) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <Lock className="w-10 h-10 text-brand-gold animate-bounce" />
        <h2 className="text-sm font-bold text-white">Verifying Admin Security Clearance...</h2>
        <p className="text-xs text-slate-400">Redirecting to administrator authentication</p>
      </div>
    );
  }

  // Dynamic Real-time Computed Metrics from active Ledger
  const paidOrders = orders.filter(
    (o) => o.paymentStatus === "PAID" || o.paymentStatus === "MANUAL_APPROVED"
  );
  const pendingOrders = orders.filter((o) => o.paymentStatus === "SUBMITTED");
  const activeCertificatesList = orders.filter((o) => o.certificate && !o.certificate.revoked);
  const revokedCertificatesList = orders.filter((o) => o.certificate && o.certificate.revoked);
  const totalRevenueINR = paidOrders.reduce((sum, o) => sum + (Number(o.amountINR) || 149), 0);
  const activeCertificatesCount = activeCertificatesList.length;
  const revokedCertificatesCount = revokedCertificatesList.length;

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    return (
      o.userName.toLowerCase().includes(term) ||
      o.orderId.toLowerCase().includes(term) ||
      (o.utrNumber || "").toLowerCase().includes(term) ||
      (o.certificate?.certNo || "").toLowerCase().includes(term) ||
      (o.course?.title || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-brand-gold/20 text-brand-gold-light border border-brand-gold/30 rounded-full text-xs font-bold">
              ADMIN CONTROL PANEL
            </span>
            <span className="text-xs text-slate-400">• Certificate Generation Authority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Payment Verification & Certificate Approval
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? "bg-slate-800 border-slate-700 text-brand-gold"
                : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
            title={soundEnabled ? "Audio chime alert: ON" : "Audio chime alert: MUTED"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Desktop Push Alert Opt-In */}
          {desktopPerm !== "granted" && (
            <button
              onClick={requestDesktopNotifications}
              className="py-2 px-3 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              title="Enable Desktop Push Notifications"
            >
              <BellRing className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
              <span className="hidden sm:inline">Enable Alerts</span>
            </button>
          )}

          {/* Live Notification Bell & Drawer */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDrawer(!showNotificationsDrawer)}
              className="relative p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer"
              title="View Live Student Alerts"
            >
              <Bell className="w-4 h-4 text-brand-gold" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center animate-pulse border-2 border-slate-900">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Drawer */}
            {showNotificationsDrawer && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-gold" />
                    <span className="text-sm font-bold text-white">Live Student Alerts</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-800/40 rounded text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleMarkNotificationsRead}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">
                      No alerts yet. When a student enrolls or uploads payment proof, it will appear here instantly!
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 transition ${
                          notif.read
                            ? "bg-slate-950/60 border-slate-800/60 text-slate-400"
                            : "bg-amber-950/30 border-amber-500/40 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-white">{notif.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={fetchAdminData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSignOut}
            className="py-2 px-3.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs rounded-2xl flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
            Total Revenue
          </span>
          <div className="text-2xl font-black text-brand-gold-light">
            {formatINR(totalRevenueINR)}
          </div>
          <span className="text-[10px] text-slate-500">Collected from ₹149 fees ({paidOrders.length} Paid)</span>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/40 p-5 rounded-2xl space-y-1">
          <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">
            Pending Verifications
          </span>
          <div className="text-2xl font-black text-amber-400">
            {pendingOrders.length}
          </div>
          <span className="text-[10px] text-slate-400">Waiting for Admin Approval</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
            Active Certificates
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {activeCertificatesCount}
          </div>
          <span className="text-[10px] text-slate-500">Verifiable via public QR</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
            Revoked Certificates
          </span>
          <div className="text-2xl font-black text-rose-400">
            {revokedCertificatesCount}
          </div>
          <span className="text-[10px] text-rose-500">Marked unverified</span>
        </div>
      </div>

      {/* =========================================================================
          SECTION: UNIFIED NOTIFICATION CENTER (MOBILE 9555593671 & EMAIL ALERTS)
          ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Admin Notification Center (मोबाइल व ईमेल सूचना सेटिंग्स)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-950 text-emerald-300 border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Mobile Push: LIVE</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                जब भी कोई छात्र एनरोल करेगा या पेमेंट प्रूफ अपलोड करेगा, तो आपके मोबाइल <strong>({adminPhone})</strong> और ईमेल पर तुरंत सूचना पहुंचेगी।
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveNotifTab("mobile")}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeNotifTab === "mobile"
                  ? "bg-brand-gold text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 Mobile (9555593671)</span>
            </button>
            <button
              onClick={() => setActiveNotifTab("email")}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeNotifTab === "email"
                  ? "bg-brand-gold text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>📧 Email (Gmail)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: MOBILE NOTIFICATIONS */}
        {activeNotifTab === "mobile" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Quick 1-Click Mobile Subscription Box */}
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-950 to-slate-950 border border-emerald-700/60 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-extrabold text-white text-sm">
                      1-Click Mobile Alert: अपने फोन पर लाइव नोटिफिकेशन शुरू करें
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300">
                    अपने मोबाइल नंबर <strong>{adminPhone}</strong> पर हर नए छात्र एनरोलमेंट की आवाज के साथ रिंग/नोटिफिकेशन पाने के लिए नीचे दिए गए बटन को दबाएं:
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={subscribeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>📲 अपने फोन में Subscribe करें (1-Click)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={handleTestMobile}
                    disabled={testingMobile}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {testingMobile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5 text-brand-gold" />}
                    <span>🔔 Ring My Phone (मोबाइल टेस्ट रिंग)</span>
                  </button>
                </div>
              </div>

              {mobileStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
                    mobileStatusMsg.type === "success"
                      ? "bg-emerald-950 border border-emerald-700 text-emerald-200"
                      : mobileStatusMsg.type === "error"
                      ? "bg-rose-950 border border-rose-800 text-rose-200"
                      : "bg-indigo-950 border border-indigo-800 text-indigo-200"
                  }`}
                >
                  {mobileStatusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                  <span>{mobileStatusMsg.text}</span>
                </div>
              )}
            </div>

            {/* Mobile Settings Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Admin Mobile Number
                </label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="9555593671"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
                <span className="text-[10px] text-slate-500 block">Your personal mobile for alerts</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Push Channel Topic
                </label>
                <input
                  type="text"
                  value={ntfyTopic}
                  onChange={(e) => setNtfyTopic(e.target.value)}
                  placeholder="techvision_admin_9555593671"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition font-mono"
                />
                <span className="text-[10px] text-slate-500 block">Instant push topic name</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    WhatsApp API Key (Optional)
                  </label>
                  <button
                    onClick={() => setShowWhatsappGuide(!showWhatsappGuide)}
                    className="text-[10px] text-brand-gold-light hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>How?</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={whatsappApiKey}
                  onChange={(e) => setWhatsappApiKey(e.target.value)}
                  placeholder="CallMeBot API Key (Optional)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
                <span className="text-[10px] text-slate-500 block">To receive WhatsApp messages directly</span>
              </div>
            </div>

            {/* WhatsApp Guide Drawer */}
            {showWhatsappGuide && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-2 animate-fadeIn">
                <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Alerts (10 Seconds Free Setup):</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>WhatsApp पर नंबर <strong>+34 941 83 23 88</strong> को &quot;CallMeBot&quot; नाम से सेव करें।</li>
                  <li>अपने WhatsApp से उस नंबर पर यह मैसेज भेजें: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">I allow callmebot to send me messages</code></li>
                  <li>CallMeBot आपको तुरंत आपकी API Key भेज देगा। उस Key को यहाँ पेस्ट करके Save दबाएं!</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EMAIL NOTIFICATIONS */}
        {activeNotifTab === "email" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-950 text-emerald-300 border-emerald-800">
                  🟢 Phone Email Alert: patelroshansingh7@gmail.com
                </span>
                <span className="text-[11px] text-slate-400">
                  (छात्र के एनरोल करते ही ईमेल तुरंत आपके फोन पर जाएगा)
                </span>
              </div>

              <button
                onClick={() => setShowEmailGuide(!showEmailGuide)}
                className="text-xs text-brand-gold-light hover:underline flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Optional: Custom Gmail SMTP Guide</span>
                {showEmailGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* 1-Minute Guide Drawer */}
            {showEmailGuide && (
              <div className="p-4 bg-indigo-950/40 border border-indigo-800/60 rounded-2xl text-xs text-indigo-200 space-y-2 animate-fadeIn">
                <h4 className="font-bold text-white text-sm">📌 1 Minute Guide: Get Free Google App Password</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Open your Google Account: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-brand-gold-light underline font-bold">myaccount.google.com/apppasswords</a></li>
                  <li>Make sure <strong>2-Step Verification</strong> is ON on your Google account.</li>
                  <li>In the App name field, type <strong>TechVision</strong> and click <strong>Create</strong>.</li>
                  <li>Google will show a 16-letter password (e.g. <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">xxxx xxxx xxxx xxxx</code>). Copy it and paste below!</li>
                </ol>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Admin Alert Email (Your Email)
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="patelroshansingh7@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
                <span className="text-[10px] text-slate-500 block">Where payment alerts are delivered</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Sender Gmail Address
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
                <span className="text-[10px] text-slate-500 block">From which emails are dispatched</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Google App Password (16 Letters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={gmailAppPassword}
                    onChange={(e) => setGmailAppPassword(e.target.value)}
                    placeholder="abcd efgh ijkl mnop"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block">myaccount.google.com/apppasswords</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-700 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{testingEmail ? "Sending Test..." : "🧪 Send Test Email to My Inbox"}</span>
              </button>

              {emailStatusMsg && (
                <div
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                    emailStatusMsg.type === "success"
                      ? "bg-emerald-950 border border-emerald-700 text-emerald-300"
                      : emailStatusMsg.type === "error"
                      ? "bg-rose-950 border border-rose-800 text-rose-300"
                      : "bg-indigo-950 border border-indigo-800 text-indigo-300"
                  }`}
                >
                  {emailStatusMsg.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{emailStatusMsg.text}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <button
            onClick={handleSaveAllNotificationSettings}
            disabled={savingSettings}
            className="py-2.5 px-6 bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-brand-navy-dark font-extrabold rounded-xl text-xs shadow-xl transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
            <span>{savingSettings ? "Saving Settings..." : "Save All Notification Settings"}</span>
          </button>

          <span className="text-[11px] text-slate-500">
            Real-time multi-channel alerts: Mobile Push • WhatsApp • SMS • Email
          </span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: PENDING PAYMENT VERIFICATIONS (ACTION QUEUE)
          ========================================================================= */}
      {pendingOrders.length > 0 && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="text-lg font-black text-white">
                  Pending Payment Verifications ({pendingOrders.length})
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Check the submitted UTR & payment screenshot. Click <strong>"Approve & Generate Certificate"</strong> once ₹149 is confirmed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 space-y-4 transition shadow-lg"
              >
                {/* Candidate & Course Info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold rounded-md uppercase">
                      {order.paymentStatus}
                    </span>
                    <h3 className="font-extrabold text-sm text-white mt-1.5 line-clamp-1">
                      {order.userName}
                    </h3>
                    <span className="text-xs text-slate-400 block">{order.user?.email}</span>
                    <span className="text-[11px] text-brand-gold-light block mt-0.5">
                      {order.course?.title}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-white">{formatINR(order.amountINR)}</span>
                    <span className="text-[10px] text-slate-500 block">{order.orderId}</span>
                  </div>
                </div>

                {/* Submitted Proof Details (UTR & Screenshot) */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Submitted UTR / Ref:</span>
                    <div className="flex items-center gap-1.5">
                      <code className="font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {order.utrNumber || "No UTR provided"}
                      </code>
                      {order.utrNumber && (
                        <button
                          onClick={() => copyUtr(order.utrNumber)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition"
                          title="Copy UTR"
                        >
                          {copiedUtr === order.utrNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400 font-medium">Screenshot Proof:</span>
                    {order.paymentScreenshot ? (
                      <button
                        onClick={() => {
                          setPreviewImage(order.paymentScreenshot);
                          setPreviewOrder(order);
                        }}
                        className="py-1 px-2.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/80 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View Screenshot</span>
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px]">No file uploaded</span>
                    )}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleApproveAndGenerate(order.orderId)}
                    className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Generate Certificate</span>
                  </button>

                  <button
                    onClick={() => handleReject(order.orderId)}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-800 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: ALL ORDERS & ISSUED CERTIFICATES REGISTRY
          ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-gold" />
              <span>Complete Credential Ledger ({orders.length} Verified Candidates)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Click on any <strong>CIN / Cert ID</strong> or <strong>"View / Download"</strong> to open and download the official certificate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Add Student Button */}
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="py-2 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Student (नया छात्र जोड़ें)</span>
            </button>

            {/* Export JSON Ledger Backup */}
            <button
              onClick={handleExportLedger}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Download full backup of all student records as JSON"
            >
              <Download className="w-3.5 h-3.5 text-brand-gold" />
              <span>Backup Data</span>
            </button>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by candidate, cert, UTR..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Candidate</th>
                <th className="p-3">Course Track</th>
                <th className="p-3">UTR / Proof</th>
                <th className="p-3">Status</th>
                <th className="p-3">CIN / Cert ID</th>
                <th className="p-3 text-right">View / Download & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.map((order) => {
                const cert = order.certificate;
                const isPaid = order.paymentStatus === "PAID" || order.paymentStatus === "MANUAL_APPROVED";

                return (
                  <tr key={order.id} className="hover:bg-slate-950/40 transition">
                    <td className="p-3">
                      <strong className="text-white block">{order.userName}</strong>
                      <span className="text-slate-500 text-[10px]">{order.user?.email}</span>
                      {order.college && (
                        <span className="text-slate-500 text-[10px] block truncate max-w-[160px]">
                          {order.college}
                        </span>
                      )}
                    </td>
                    <td className="p-3 max-w-[180px]">
                      <span className="truncate block font-medium">{order.course?.title}</span>
                      <span className="text-[10px] text-slate-500">{order.mode} • {formatINR(order.amountINR)}</span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {order.utrNumber ? (
                          <span className="font-mono text-[11px] text-amber-300 block">
                            {order.utrNumber}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">No UTR</span>
                        )}
                        {order.paymentScreenshot && (
                          <button
                            onClick={() => {
                              setPreviewImage(order.paymentScreenshot);
                              setPreviewOrder(order);
                            }}
                            className="text-[10px] text-indigo-400 hover:underline font-bold flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> View Receipt
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : order.paymentStatus === "SUBMITTED"
                            ? "bg-amber-950 text-amber-300 border border-amber-700"
                            : "bg-slate-950 text-slate-400 border border-slate-800"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      {cert ? (
                        <Link
                          href={`/verify/${cert.certNo}`}
                          target="_blank"
                          className="text-brand-gold-light hover:underline font-bold flex items-center gap-1"
                          title="Click to open Verification and PDF download"
                        >
                          <span>{cert.certNo}</span>
                          <ExternalLink className="w-3 h-3 text-brand-gold" />
                        </Link>
                      ) : (
                        <span className="text-slate-600">Pending Approval</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {cert && (
                        <Link
                          href={`/generate/${order.orderId}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-gold hover:bg-brand-gold-light text-brand-navy-dark rounded-lg text-[11px] font-bold transition shadow-sm"
                        >
                          <Download className="w-3 h-3" />
                          <span>View & Download PDF</span>
                        </Link>
                      )}

                      {!isPaid && (
                        <button
                          onClick={() => handleApproveAndGenerate(order.orderId)}
                          className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Approve & Issue
                        </button>
                      )}

                      {cert && (
                        <button
                          onClick={() => handleRevokeToggle(cert.certNo, cert.revoked)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            cert.revoked
                              ? "bg-emerald-900 text-emerald-200"
                              : "bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700"
                          }`}
                        >
                          {cert.revoked ? "Unrevoke" : "Revoke"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          SCREENSHOT PREVIEW MODAL
          ========================================================================= */}
      {previewImage && previewOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => {
                setPreviewImage(null);
                setPreviewOrder(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white">
                Payment Proof Receipt
              </h3>
              <p className="text-xs text-slate-400">
                Candidate: <strong className="text-white">{previewOrder.userName}</strong> ({previewOrder.orderId})
              </p>
              {previewOrder.utrNumber && (
                <div className="text-xs text-amber-300 mt-1 font-mono">
                  UTR: <strong>{previewOrder.utrNumber}</strong>
                </div>
              )}
            </div>

            {/* Image Container */}
            <div className="bg-black rounded-2xl p-2 max-h-[60vh] overflow-auto flex items-center justify-center border border-slate-800">
              <img
                src={previewImage}
                alt="Payment Screenshot"
                className="max-w-full max-h-[55vh] object-contain rounded-xl"
              />
            </div>

            {/* Approve Button in Modal */}
            {previewOrder.paymentStatus !== "PAID" && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleApproveAndGenerate(previewOrder.orderId)}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Confirm ₹149 & Generate Certificate Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD NEW STUDENT / ISSUE CERTIFICATE MODAL
          ========================================================================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddStudentModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">
                  Add Student & Issue Certificate (नया छात्र जोड़ें)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Register a candidate manually. If marked as <strong>PAID</strong>, a certified QR-verifiable credential will be generated automatically.
              </p>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Student Full Name (छात्र का पूरा नाम) *
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Ramesh Verma"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Student Email Address (ईमेल आईडी) *
                </label>
                <input
                  type="email"
                  required
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="e.g. ramesh.verma@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  College / University (कॉलेज का नाम)
                </label>
                <input
                  type="text"
                  value={newStudentCollege}
                  onChange={(e) => setNewStudentCollege(e.target.value)}
                  placeholder="e.g. REC Azamgarh / AKTU"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Course Track (कोर्स चुनें) *
                </label>
                <select
                  value={newStudentCourse}
                  onChange={(e) => setNewStudentCourse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                >
                  {ENGINEERING_COURSES.map((c) => (
                    <option key={c.slug} value={c.slug} className="bg-slate-900 text-white">
                      {c.title} ({c.category} • ₹{c.priceINR})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Mode (मोड)
                  </label>
                  <select
                    value={newStudentMode}
                    onChange={(e) => setNewStudentMode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Online">Online</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Fee Amount
                  </label>
                  <input
                    type="text"
                    disabled
                    value="₹149 (Standard Fee)"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-brand-gold font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Payment Status & Certificate
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStudentStatus("PAID")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      newStudentStatus === "PAID"
                        ? "bg-emerald-950 border-emerald-600 text-emerald-200 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PAID (Issue Cert)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStudentStatus("PENDING")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      newStudentStatus === "PENDING"
                        ? "bg-amber-950 border-amber-600 text-amber-200 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>PENDING (Verify Later)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  UTR / Transaction ID (वैकल्पिक)
                </label>
                <input
                  type="text"
                  value={newStudentUtr}
                  onChange={(e) => setNewStudentUtr(e.target.value)}
                  placeholder="e.g. UPI483920194820"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingStudent}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-brand-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-brand-navy-dark font-black text-xs rounded-xl shadow-xl transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {creatingStudent ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Student & Generating Credential...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Save & Issue Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}