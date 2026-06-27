import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Home, 
  History, 
  QrCode, 
  Wallet, 
  User, 
  X, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Database,
  Plus,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Member, YearData, WifiPackage, Database as DBType, AuditLog, ExpenseCategory, AuditAction, ExpenseRecord } from "./types";
import { 
  MONTH_NAMES, 
  MONTH_SHORT_NAMES, 
  formatRupiah, 
  defaultPackages, 
  getSeedExpenses, 
  generateWhatsAppReportText 
} from "./utils";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db as firestore } from "./firebase";

// Sub-components import
import { DanaHome } from "./components/DanaHome";
import { PelangganView } from "./components/PelangganView";
import { PaketView } from "./components/PaketView";
import { TagihanView } from "./components/TagihanView";
import { KeuanganView } from "./components/KeuanganView";
import { RiwayatView } from "./components/RiwayatView";
import { SayaView } from "./components/SayaView";
import { ScannerView } from "./components/ScannerView";
import { AuthScreen } from "./components/AuthScreen";
import { GangguanView } from "./components/GangguanView";
import { PingToolsView } from "./components/PingToolsView";
import { KasAdminView } from "./components/KasAdminView";
import { TiketGangguanView } from "./components/TiketGangguanView";
import { BillingOtomatisView } from "./components/BillingOtomatisView";
import { RekapSetoranISP } from "./components/RekapSetoranISP";
import { SignaturePad } from "./components/SignaturePad";
import { AdminUser, TroubleTicket } from "./types";

export default function App() {
  // 1. Core Navigation Hooks
  const [currentView, setCurrentView] = useState<"home" | "pelanggan" | "paket" | "tagihan" | "pemasukan" | "pengeluaran" | "riwayat" | "saya" | "scanner" | "gangguan" | "ping" | "kas_admin" | "tiket_gangguan" | "billing_otomatis" | "rekap_isp">("home");

  // Global error listener for debugging cryptic errors like "Script error."
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorDetails = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? (event.error.stack || event.error.message) : null
      };
      console.error("DEBUG - Captured Global Error:", JSON.stringify(errorDetails, null, 2));
      
      if (event.message === "Script error.") {
        console.warn("Dideteksi 'Script error.'. Ini biasanya terjadi karena script dari origin berbeda gagal atau diblokir. Pastikan semua script dimuat dari origin yang sama.");
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("DEBUG - Unhandled Rejection:", event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // 1.4 Admin credentials & screen locked state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem("wifi_admin_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {
        console.error("Failed to parse admin user:", e);
        localStorage.removeItem("wifi_admin_user");
      }
    }
    return null;
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return localStorage.getItem("wifi_admin_user") !== null;
  });

  // 1.5 Theme dark/light state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("wifi_iuran_theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("wifi_iuran_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  // Determine standard years
  const systemYear = new Date().getFullYear();
  const defaultYear = systemYear >= 2024 && systemYear <= 2035 ? systemYear.toString() : "2026";
  const [activeYear, setActiveYear] = useState<string>(defaultYear);

  // Notes Modal state
  const [activeNoteModal, setActiveNoteModal] = useState<{
    memberId: string;
    memberName: string;
    monthIndex: number;
    monthName: string;
    noteText: string;
    signature?: string;
    isPaid: boolean;
  } | null>(null);

  // Payment Confirmation state
  const [paymentConfirmModal, setPaymentConfirmModal] = useState<{
    memberId: string;
    memberName: string;
    monthIndex: number;
    monthName: string;
    amount: number;
  } | null>(null);

  // Transaction Modal state
  const [transactionModal, setTransactionModal] = useState<{
    show: boolean;
    type: "income" | "expense";
  }>({
    show: false,
    type: "income"
  });

  // Toast Notify state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "danger" | "info";
  }>({
    show: false,
    message: "",
    type: "success"
  });

  const showNotification = (message: string, type: "success" | "danger" | "info" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Backup Reminder state
  const [showBackupReminder, setShowBackupReminder] = useState(false);

  // Check for monthly backup reminder
  useEffect(() => {
    const lastBackupMonth = localStorage.getItem("last_backup_month");
    const currentMonth = new Date().getMonth();
    const currentDate = new Date().getDate();

    // Remind on the first week of a new month (1st-7th) if not backed up yet
    if (currentDate <= 7 && lastBackupMonth !== currentMonth.toString()) {
      const timer = setTimeout(() => {
        setShowBackupReminder(true);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, []);

  // 2. Persistent Database Setup
  const [db, setDb] = useState<DBType>(() => {
    const stored = localStorage.getItem("wifi_iuran_db");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          const finalDb = { ...parsed };
          const years = Array.from({ length: 12 }, (_, i) => (2024 + i).toString());
          let updated = false;

          years.forEach(yr => {
            if (!finalDb[yr]) {
              finalDb[yr] = { members: [], monthlyRate: 20000 };
              updated = true;
            }
            if (!finalDb[yr].packages) {
              finalDb[yr].packages = [...defaultPackages];
              updated = true;
            }
            if (!finalDb[yr].expenses) {
              finalDb[yr].expenses = getSeedExpenses(yr);
              updated = true;
            }
            if (!finalDb[yr].customIncomes) {
              finalDb[yr].customIncomes = [];
              updated = true;
            }
            if (!finalDb[yr].tickets) {
              finalDb[yr].tickets = [];
              updated = true;
            }
            if (!finalDb[yr].members) {
              finalDb[yr].members = [];
              updated = true;
            }
            
            // Fix Firestore/JSON sparse array to object conversion bugs
            if (finalDb[yr].members && !Array.isArray(finalDb[yr].members)) finalDb[yr].members = Object.values(finalDb[yr].members);
            if (finalDb[yr].packages && !Array.isArray(finalDb[yr].packages)) finalDb[yr].packages = Object.values(finalDb[yr].packages);
            if (finalDb[yr].expenses && !Array.isArray(finalDb[yr].expenses)) finalDb[yr].expenses = Object.values(finalDb[yr].expenses);
            if (finalDb[yr].customIncomes && !Array.isArray(finalDb[yr].customIncomes)) finalDb[yr].customIncomes = Object.values(finalDb[yr].customIncomes);
          });

          if (updated) {
            localStorage.setItem("wifi_iuran_db", JSON.stringify(finalDb));
          }
          return finalDb;
        }
      } catch (e) {
        console.error("Error loading saved wifi_iuran_db: ", e);
        localStorage.removeItem("wifi_iuran_db");
      }
    }

    // Default seeded structures for initial setup
    const initialDb: DBType = {};
    const years = Array.from({ length: 12 }, (_, i) => (2024 + i).toString());

    years.forEach(yr => {
      initialDb[yr] = {
        members: [
          {
            id: yr + "-m1",
            name: "Slamet Raharjo",
            phone: "081234567890",
            packageId: "pkg-hemat",
            dueDateDay: 5,
            setoranIsp: 110000,
            payments: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: false, 6: false, 7: false, 8: false, 9: false, 10: false, 11: false }
          },
          {
            id: yr + "-m2",
            name: "Dewi Lestari",
            phone: "085678901234",
            packageId: "pkg-standar",
            dueDateDay: 10,
            setoranIsp: 150000,
            payments: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: false, 8: false, 9: false, 10: false, 11: false }
          },
          {
            id: yr + "-m3",
            name: "Hendra Wijaya",
            phone: "087890123456",
            packageId: "pkg-premium",
            dueDateDay: 10,
            setoranIsp: 200000,
            payments: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true }
          },
          {
            id: yr + "-m4",
            name: "Rian Ardianto",
            phone: "089012345678",
            packageId: "pkg-hemat",
            dueDateDay: 15,
            setoranIsp: 110000,
            payments: { 0: true, 1: true, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false, 9: false, 10: false, 11: false }
          }
        ],
        monthlyRate: 20000,
        packages: [...defaultPackages],
        expenses: getSeedExpenses(yr),
        customIncomes: [],
        tickets: []
      };
    });

    localStorage.setItem("wifi_iuran_db", JSON.stringify(initialDb));
    return initialDb;
  });

  // Automatically save to local storage on modifications
  useEffect(() => {
    localStorage.setItem("wifi_iuran_db", JSON.stringify(db));
    
    // Cloud Backup Terintegrasi Email
    if (auth.currentUser) {
      setDoc(doc(firestore, "userDatabases", auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email,
        db: db
      }).catch(err => console.error("Cloud Backup Failed", err));
    }
  }, [db]);

  // 1.6 Web Notifications browser remind system
  const [browserRemindersEnabled, setBrowserRemindersEnabled] = useState<boolean>(() => {
    return localStorage.getItem("wifi_browser_reminders_enabled") === "true";
  });

  useEffect(() => {
    if (!browserRemindersEnabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const todayDateStr = new Date().toDateString();
    const lastNotificationDate = localStorage.getItem("wifi_last_notification_date");

    if (lastNotificationDate !== todayDateStr) {
      // Find members with unpaid payments for the current month
      const currentMonthIndex = new Date().getMonth();
      const currentYearStr = new Date().getFullYear().toString();
      const yearData = db[currentYearStr];
      if (yearData && yearData.members) {
        const arrMembers = (Array.isArray(yearData.members) ? yearData.members : Object.values(yearData.members)) as Member[];
        const unpaidMembers = arrMembers.filter(m => !m.payments?.[currentMonthIndex]);
        if (unpaidMembers.length > 0) {
          try {
            new Notification("Pengingat Iuran WiFi", {
              body: `Hari ini ada ${unpaidMembers.length} anggota belum melunasi iuran WiFi bulan ini. Silakan hubungi mereka!`,
              tag: "unpaid-reminder-daily",
            });
            localStorage.setItem("wifi_last_notification_date", todayDateStr);
          } catch (e) {
            console.error("Failed to show browser notification:", e);
          }
        }
      }
    }
  }, [browserRemindersEnabled, db]);

  const handleToggleBrowserReminders = async () => {
    if (!browserRemindersEnabled) {
      if (!("Notification" in window)) {
        showNotification("Browser Anda tidak mendukung notifikasi.", "danger");
        return;
      }
      
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setBrowserRemindersEnabled(true);
        localStorage.setItem("wifi_browser_reminders_enabled", "true");
        showNotification("Notifikasi pengingat harian berhasil diaktifkan!", "success");
        try {
          new Notification("Siskom RT 04 WiFi", {
            body: "Sistem notifikasi pengingat harian berhasil dihubungkan!",
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        showNotification("Izin notifikasi ditolak oleh browser.", "danger");
      }
    } else {
      setBrowserRemindersEnabled(false);
      localStorage.setItem("wifi_browser_reminders_enabled", "false");
      showNotification("Notifikasi pengingat dinonaktifkan.", "success");
    }
  };

  const handleSendTestNotification = () => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      showNotification("Izin notifikasi belum diberikan.", "danger");
      return;
    }
    const currentMonthIndex = new Date().getMonth();
    const currentMonthName = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ][currentMonthIndex];
    const currentYearStr = new Date().getFullYear().toString();
    const yearData = db[currentYearStr];
    const arrMembers = (yearData && yearData.members ? (Array.isArray(yearData.members) ? yearData.members : Object.values(yearData.members)) : []) as Member[];
    const unpaidCount = arrMembers.filter(m => !m.payments?.[currentMonthIndex]).length;

    try {
      new Notification("Uji Coba Pengingat WiFi", {
        body: `INFO: Ada ${unpaidCount} anggota belum melunasi iuran untuk periode bulan ${currentMonthName} ${currentYearStr}.`,
        tag: "unpaid-reminder-test",
      });
      showNotification("Notifikasi uji coba berhasil dikirim!", "success");
    } catch (e) {
      console.error(e);
      showNotification("Gagal meluncurkan notifikasi.", "danger");
    }
  };

  // Derived active year dataset
  const activeYearData = useMemo<YearData>(() => {
    const raw = (db[activeYear] || {}) as any;
    return {
      ...raw,
      monthlyRate: raw.monthlyRate || 20000,
      members: Array.isArray(raw.members) ? raw.members : Object.values(raw.members || {}),
      packages: Array.isArray(raw.packages) ? raw.packages : Object.values(raw.packages || defaultPackages),
      expenses: Array.isArray(raw.expenses) ? raw.expenses : Object.values(raw.expenses || {}),
      customIncomes: Array.isArray(raw.customIncomes) ? raw.customIncomes : Object.values(raw.customIncomes || {}),
      tickets: Array.isArray(raw.tickets) ? raw.tickets : Object.values(raw.tickets || {}),
      autoBillingEnabled: !!raw.autoBillingEnabled
    };
  }, [db, activeYear]);

  const currentYearTickets = activeYearData.tickets || [];

  // Sync edit monthly cost settings text values
  const [rateInputVal, setRateInputVal] = useState("");
  useEffect(() => {
    setRateInputVal(activeYearData.monthlyRate.toString());
  }, [activeYearData, activeYear]);

  const yearsOptions = Array.from({ length: 12 }, (_, i) => (2024 + i).toString());

  // 3. FINANCIAL CALCULATIONS (General timeline ledger & recent feeds)
  const autoRevenue = useMemo(() => {
    let rev = 0;
    const members = activeYearData.members || [];
    const pkgs = activeYearData.packages || defaultPackages;
    const rate = activeYearData.monthlyRate;

    members.forEach(m => {
      const match = pkgs.find(p => p.id === m.packageId);
      const memberRate = match ? match.price : rate;
      for (let i = 0; i < 12; i++) {
        if (m.payments?.[i]) {
          rev += memberRate;
        }
      }
    });
    return rev;
  }, [activeYearData]);

  // Generate sorting index based timeline list
  const generalHistoryTimeline = useMemo(() => {
    const list: Array<{
      id: string;
      type: "payment" | "income" | "expense";
      date: string;
      title: string;
      amount: number;
      badge?: string;
      category?: string;
      note?: string;
      phone?: string;
    }> = [];

    const pkgs = activeYearData.packages || defaultPackages;
    const members = activeYearData.members || [];
    const fallbackRate = activeYearData.monthlyRate;

    // A. Parse payments checklist as lunas credits
    members.forEach(m => {
      const match = pkgs.find(p => p.id === m.packageId);
      const memberRate = match ? match.price : fallbackRate;
      
      for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
        if (m.payments?.[monthIdx]) {
          const timestamp = m.paymentTimestamps?.[monthIdx];
          const dateStr = timestamp || `${activeYear}-${String(monthIdx + 1).padStart(2, '0')}-10`;
          const noteStr = m.notes?.[monthIdx] || "";

          list.push({
            id: `pay-${m.id}-${monthIdx}`,
            type: "payment",
            date: dateStr,
            title: `Iuran WiFi: ${m.name}`,
            amount: memberRate,
            badge: MONTH_NAMES[monthIdx].slice(0, 3),
            note: noteStr,
            phone: m.phone
          });
        }
      }
    });

    // B. Parse custom incomes
    const customIncomes = activeYearData.customIncomes || [];
    customIncomes.forEach(inc => {
      list.push({
        id: inc.id,
        type: "income",
        date: inc.date,
        title: inc.description,
        amount: inc.amount,
        badge: "KAS"
      });
    });

    // C. Parse expenses
    const expenses = activeYearData.expenses || [];
    expenses.forEach(exp => {
      list.push({
        id: exp.id,
        type: "expense",
        date: exp.date,
        title: exp.description,
        amount: exp.amount,
        category: exp.category
      });
    });

    // D. Parse audit logs (payment history)
    const paymentLogs = activeYearData.paymentLogs || [];
    paymentLogs.forEach(log => {
      list.push({
        id: log.id,
        type: "payment", // Map to payment type for display consistency
        date: log.timestamp,
        title: log.details,
        amount: 0, // Audit logs don't represent a direct cash flow amount here (already handled by m.payments parsing if needed)
        badge: "LOG"
      });
    });

    // Sort timeline DESC by date
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [activeYearData, activeYear]);

  // Recent 3 records for home dashboard
  const recentTransactions = useMemo(() => {
    return generalHistoryTimeline.slice(0, 3);
  }, [generalHistoryTimeline]);

  // Simple metrics sums
  const numMembers = activeYearData.members?.length || 0;
  const packagesLength = activeYearData.packages?.length || 0;
  
  const completionStatistics = useMemo(() => {
    const totalBlocks = numMembers * 12;
    if (totalBlocks === 0) return 0;
    
    let paidCount = 0;
    activeYearData.members?.forEach(m => {
      for (let i = 0; i < 12; i++) {
        if (m.payments?.[i]) {
          paidCount++;
        }
      }
    });
    return Math.round((paidCount / totalBlocks) * 100);
  }, [activeYearData, numMembers]);

  const customIncomeTotalVal = activeYearData.customIncomes?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const totalRevenueSum = autoRevenue + customIncomeTotalVal;
  const totalExpensesSum = activeYearData.expenses?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const netProfit = totalRevenueSum - totalExpensesSum;

  // 4. ACTION EVENT HANDLERS
  // Action: Copy WA format report text
  const handleCopyWhatsAppReportText = () => {
    const text = generateWhatsAppReportText(activeYear, db, activeYearData.monthlyRate);
    if (!text) {
      showNotification("Belum ada data anggota untuk disalin!", "danger");
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showNotification("Laporan WhatsApp disalin ke papan klip!", "success");
    }).catch(err => {
      console.error(err);
      showNotification("Gagal menyalin iuran otomatis.", "danger");
    });
  };

  // Action: Register member
  const handleAddMember = (name: string, phone: string, packageId: string, dueDateDay?: number, routerIp?: string) => {
    const checkDup = activeYearData.members.some(m => m.name.toLowerCase() === name.trim().toLowerCase());
    if (checkDup) {
      showNotification(`"${name}" sudah terdaftar!`, "danger");
      return;
    }

    const freshPayments: { [key: number]: boolean } = {};
    for (let i = 0; i < 12; i++) freshPayments[i] = false;

    const newM: Member = {
      id: `${activeYear}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      phone: phone.trim() || undefined,
      packageId: packageId || undefined,
      payments: freshPayments,
      dueDateDay: dueDateDay || 10,
      routerIp: routerIp?.trim() || undefined
    };

    setDb(prev => ({
      ...prev,
      [activeYear]: {
        ...prev[activeYear],
        members: [...prev[activeYear].members, newM]
      }
    }));
    showNotification(`Pelanggan "${name}" sukses ditambahkan!`, "success");
  };

  // Action: Edit member info
  const handleEditMember = (memberId: string, name: string, phone: string, packageId: string, dueDateDay?: number, routerIp?: string) => {
    setDb(prev => {
      const members = prev[activeYear].members.map(m => {
        if (m.id === memberId) {
          return {
            ...m,
            name: name.trim(),
            phone: phone.trim() || undefined,
            packageId: packageId || undefined,
            dueDateDay: dueDateDay || 10,
            routerIp: routerIp?.trim() || undefined
          };
        }
        return m;
      });
      return {
        ...prev,
        [activeYear]: { ...prev[activeYear], members }
      };
    });
    showNotification("Profil pelanggan diperbarui!", "success");
  };

  // Action: Delete member
  const handleDeleteMember = (memberId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pelanggan ini dari daftar wifi?")) return;
    setDb(prev => ({
      ...prev,
      [activeYear]: {
        ...prev[activeYear],
        members: prev[activeYear].members.filter(m => m.id !== memberId)
      }
    }));
    showNotification("Kelompok iuran pelanggan dihapus.", "info");
  };

  // Action: Import members from Excel
  const handleImportMembers = (newMembers: Array<{ name: string; phone?: string; packageId?: string; dueDateDay?: number }>) => {
    if (newMembers.length === 0) return;

    setDb(prev => {
      const currentList = prev[activeYear]?.members || [];
      const updatedMembers = [...currentList];
      let addedCount = 0;
      let duplicateCount = 0;

      newMembers.forEach(item => {
        const isDuplicate = updatedMembers.some(m => m.name.toLowerCase() === item.name.trim().toLowerCase());
        if (isDuplicate) {
          duplicateCount++;
          return;
        }

        const freshPayments: { [key: number]: boolean } = {};
        for (let i = 0; i < 12; i++) freshPayments[i] = false;

        const newM: Member = {
          id: `${activeYear}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${addedCount}`,
          name: item.name.trim(),
          phone: item.phone?.trim() || undefined,
          packageId: item.packageId || undefined,
          payments: freshPayments,
          dueDateDay: item.dueDateDay || 10
        };

        updatedMembers.push(newM);
        addedCount++;
      });

      if (addedCount > 0) {
        setTimeout(() => {
          showNotification(`Berhasil mengimpor ${addedCount} pelanggan baru!${duplicateCount > 0 ? ` (${duplicateCount} nama dilewati karena duplikasi)` : ""}`, "success");
        }, 50);
      } else {
        setTimeout(() => {
          showNotification(`Seluruh data (${duplicateCount}) dilewati karena nama sudah terdaftar.`, "info");
        }, 50);
      }

      return {
        ...prev,
        [activeYear]: {
          ...prev[activeYear],
          members: updatedMembers
        }
      };
    });
  };

  // Action: Add/Update Paket
  const handleAddPackage = (name: string, speed: string, price: number, ispCost: number) => {
    const pkg: WifiPackage = {
      id: `pkg-${Date.now()}`,
      name,
      speed,
      price,
      ispCost
    };
    setDb(prev => ({
      ...prev,
      [activeYear]: {
        ...prev[activeYear],
        packages: [...(prev[activeYear].packages || []), pkg]
      }
    }));
    showNotification("Paket WiFi baru disimpan!", "success");
  };

  const handleEditPackage = (pkgId: string, name: string, speed: string, price: number, ispCost: number) => {
    setDb(prev => {
      const packages = (prev[activeYear].packages || []).map(p => 
        p.id === pkgId ? { ...p, name, speed, price, ispCost } : p
      );
      return {
        ...prev,
        [activeYear]: { ...prev[activeYear], packages }
      };
    });
    showNotification("Setelan paket WiFi diubah!", "success");
  };

  const handleDeletePackage = (pkgId: string) => {
    if (!window.confirm("Hapus paket ini? Pelanggan berkait akan kembali ke iuran standar bulanan.")) return;
    setDb(prev => ({
      ...prev,
      [activeYear]: {
        ...prev[activeYear],
        packages: (prev[activeYear].packages || []).filter(p => p.id !== pkgId),
        members: prev[activeYear].members.map(m => m.packageId === pkgId ? { ...m, packageId: undefined } : m)
      }
    }));
    showNotification("Paket WiFi dieliminasi.", "info");
  };

  // Action: Toggle payment checklist directly
  const handleTogglePayment = (memberId: string, monthIndex: number) => {
    const member = activeYearData.members.find(m => m.id === memberId);
    if (!member) return;

    const isCurrentlyPaid = !!member.payments?.[monthIndex];

    if (!isCurrentlyPaid) {
      // If marking as PAID, show confirmation modal with signature
      const pkg = activeYearData.packages?.find(p => p.id === member.packageId);
      const amount = pkg ? pkg.price : activeYearData.monthlyRate;

      setPaymentConfirmModal({
        memberId,
        memberName: member.name,
        monthIndex,
        monthName: MONTH_NAMES[monthIndex],
        amount
      });
    } else {
      // If marking as UNPAID, confirm then toggle
      if (window.confirm(`Batalkan pelunasan iuran ${member.name} untuk bulan ${MONTH_NAMES[monthIndex]}?`)) {
        setDb(prev => {
          const yearData = prev[activeYear];
          const members = yearData.members.map(m => {
            if (m.id === memberId) {
              const freshPayments = { ...m.payments };
              freshPayments[monthIndex] = false;
              
              // Also clear signature if unpaid
              const freshSignatures = { ...(m.signatures || {}) };
              delete freshSignatures[monthIndex];
              
              return { ...m, payments: freshPayments, signatures: freshSignatures };
            }
            return m;
          });

          const newLog: AuditLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "PAYMENT_CANCELLED",
            details: `Pembayaran ${member.name} bulan ${MONTH_NAMES[monthIndex]} dibatalkan`
          };

          const paymentLogs = [newLog, ...(yearData.paymentLogs || [])].slice(0, 50); // Keep last 50 logs

          return {
            ...prev,
            [activeYear]: { ...yearData, members, paymentLogs }
          };
        });
        showNotification("Status iuran dibatalkan.", "info");
      }
    }
  };

  const handleConfirmPaymentWithSignature = (signatureData: string) => {
    if (!paymentConfirmModal) return;
    const { memberId, monthIndex, memberName, monthName } = paymentConfirmModal;

    setDb(prev => {
      const yearData = prev[activeYear];
      const members = yearData.members.map(m => {
        if (m.id === memberId) {
          const freshPayments = { ...m.payments };
          freshPayments[monthIndex] = true;
          
          const freshTimestamps = { ...(m.paymentTimestamps || {}), [monthIndex]: new Date().toISOString() };
          const freshSignatures = { ...(m.signatures || {}), [monthIndex]: signatureData };
          
          return { ...m, payments: freshPayments, signatures: freshSignatures, paymentTimestamps: freshTimestamps };
        }
        return m;
      });

      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "PAYMENT_CONFIRMED",
        details: `Pembayaran ${memberName} bulan ${monthName} dikonfirmasi`
      };

      const paymentLogs = [newLog, ...(yearData.paymentLogs || [])].slice(0, 50);

      return {
        ...prev,
        [activeYear]: { ...yearData, members, paymentLogs }
      };
    });

    setPaymentConfirmModal(null);
    showNotification(`Iuran ${memberName} bulan ${monthName} berhasil dilunasi!`, "success");
  };

  // Action: Set many members as paid simultaneously for a specific month
  const handleBulkSetPaid = (memberIds: string[], monthIndex: number) => {
    setDb(prev => {
      const yearData = prev[activeYear];
      const members = yearData.members.map(m => {
        if (memberIds.includes(m.id)) {
          const freshPayments = { ...m.payments };
          const freshTimestamps = { ...(m.paymentTimestamps || {}) };
          
          // Only set timestamp if it wasn't already paid
          if (!freshPayments[monthIndex]) {
            freshTimestamps[monthIndex] = new Date().toISOString();
          }
          
          freshPayments[monthIndex] = true; // explicitly set to Paid
          return { ...m, payments: freshPayments, paymentTimestamps: freshTimestamps };
        }
        return m;
      });

      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "BULK_PAYMENT",
        details: `Pelunasan massal ${memberIds.length} pelanggan (Bulan ${MONTH_NAMES[monthIndex]})`
      };

      const paymentLogs = [newLog, ...(yearData.paymentLogs || [])].slice(0, 50);

      return {
        ...prev,
        [activeYear]: { ...yearData, members, paymentLogs }
      };
    });
    showNotification(`Berhasil melunasi iuran ${memberIds.length} pelanggan sekaligus!`, "success");
  };

  // Note Modal Save Options
  const handleOpenNoteModal = (member: Member, monthIndex: number) => {
    setActiveNoteModal({
      memberId: member.id,
      memberName: member.name,
      monthIndex,
      monthName: MONTH_NAMES[monthIndex],
      noteText: member.notes?.[monthIndex] || "",
      signature: member.signatures?.[monthIndex] || "",
      isPaid: !!member.payments?.[monthIndex]
    });
  };

  const handleSaveNoteModal = () => {
    if (!activeNoteModal) return;
    const { memberId, monthIndex, noteText, isPaid } = activeNoteModal;

    setDb(prev => {
      const yearObj = prev[activeYear];
      const members = yearObj.members.map(m => {
        if (m.id === memberId) {
          const payments = { ...m.payments, [monthIndex]: isPaid };
          const timestamps = { ...(m.paymentTimestamps || {}) };
          
          if (isPaid && !m.payments[monthIndex]) {
            timestamps[monthIndex] = new Date().toISOString();
          } else if (!isPaid) {
            delete timestamps[monthIndex];
          }

          const notes = { ...(m.notes || {}), [monthIndex]: noteText.trim() };
          if (!noteText.trim()) {
            delete notes[monthIndex];
          }
          return { ...m, payments, notes, paymentTimestamps: timestamps };
        }
        return m;
      });
      return {
        ...prev,
        [activeYear]: { ...yearObj, members }
      };
    });

    setActiveNoteModal(null);
    showNotification("Catatan iuran bulanan disimpan!", "success");
  };

  // Additional income actions
  const handleAddCustomIncome = (description: string, amount: number, date: string) => {
    const inc = {
      id: `inc-${Date.now()}`,
      date,
      description,
      amount
    };
    setDb(prev => ({
      ...prev,
      [activeYear]: {
        ...prev[activeYear],
        customIncomes: [...(prev[activeYear].customIncomes || []), inc]
      }
    }));
    showNotification("Pemasukan tambahan dicatat!", "success");
  };

  const handleDeleteCustomIncome = (id: string) => {
    setDb(prev => ({
      ...prev,
      [activeYear]: {
        ...prev[activeYear],
        customIncomes: (prev[activeYear].customIncomes || []).filter(i => i.id !== id)
      }
    }));
    showNotification("Catatan pemasukan dihapus.", "info");
  };

  // Expenses operations actions
  const handleAddCustomExpense = (description: string, amount: number, date: string, category: ExpenseCategory) => {
    const exp = {
      id: `exp-${Date.now()}`,
      date,
      description,
      amount,
      category
    };
    setDb(prev => ({
      ...prev,
      [activeYear]: {
        ...prev[activeYear],
        expenses: [...(prev[activeYear].expenses || []), exp]
      }
    }));
    showNotification("Pengeluaran iuran tersimpan!", "success");
  };

  const handleDeleteCustomExpense = (id: string) => {
    setDb(prev => ({
      ...prev,
      [activeYear]: {
        ...prev[activeYear],
        expenses: (prev[activeYear].expenses || []).filter(e => e.id !== id)
      }
    }));
    showNotification("Catatan pengeluaran ditiadakan.", "info");
  };

  // Update fallbacks rate global
  const handleSaveStandardRate = () => {
    const val = parseInt(rateInputVal, 10);
    if (isNaN(val) || val <= 0) {
      showNotification("Masukkan besaran tarif yang valid!", "danger");
      return;
    }
    setDb(prev => ({
      ...prev,
      [activeYear]: {
        ...prev[activeYear],
        monthlyRate: val
      }
    }));
    showNotification(`Tarif standar bulanan menjadi ${formatRupiah(val)}!`, "success");
  };

  // Reset current payments
  const handleResetCurrentPayments = () => {
    if (!window.confirm("Beneran menyetel ulang iuran tahun buku saat ini ke Belum Lunas?")) return;
    setDb(prev => {
      const members = prev[activeYear].members.map(m => {
        const pay: { [key: number]: boolean } = {};
        for (let i = 0; i < 12; i++) pay[i] = false;
        return { ...m, payments: pay };
      });
      return {
        ...prev,
        [activeYear]: { ...prev[activeYear], members }
      };
    });
    showNotification("Semua member dikosongkan centang pelunasannya.", "info");
  };

  // Export database
  const handleExportBackup = () => {
    try {
      const dataStr = JSON.stringify(db, null, 2);
      const uri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const host = document.createElement("a");
      host.setAttribute("href", uri);
      host.setAttribute("download", `dana_wifi_rtnet_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(host);
      host.click();
      document.body.removeChild(host);
      
      localStorage.setItem("last_backup_month", new Date().getMonth().toString());
      setShowBackupReminder(false);
      showNotification("Ekspor database json file selesai!", "success");
    } catch (e) {
      console.error(e);
      showNotification("Gagal mengunduh backup.", "danger");
    }
  };

  // BILLING ACTIONS
  const handleToggleAutoBilling = (enabled: boolean) => {
    setDb(prev => {
      const yearData = prev[activeYear];
      if (!yearData) return prev;
      return {
        ...prev,
        [activeYear]: { ...yearData, autoBillingEnabled: enabled }
      };
    });
    showNotification(`Auto-Billing ${enabled ? 'Diaktifkan' : 'Dinonaktifkan'}`, "success");
  };

  const handleTriggerMassBilling = () => {
    const currentMonthIdx = new Date().getMonth();
    setDb(prev => {
      const yearData = prev[activeYear];
      if (!yearData) return prev;

      const updatedMembers = yearData.members.map(m => {
        const currentPayments = m.payments || {};
        if (currentPayments[currentMonthIdx] === undefined) {
          return { ...m, payments: { ...currentPayments, [currentMonthIdx]: false } };
        }
        return m;
      });

      return {
        ...prev,
        [activeYear]: { ...yearData, members: updatedMembers }
      };
    });
    showNotification("Tagihan massal bulan ini berhasil dicetak!", "success");
  };

  // Logic to auto-isolate members if auto-billing is enabled
  useEffect(() => {
    if (activeYearData.autoBillingEnabled) {
      const currentMonthIdx = new Date().getMonth();
      const currentDay = new Date().getDate();
      
      const needsUpdate = activeYearData.members.some(m => {
        const isPaid = m.payments?.[currentMonthIdx];
        const dueDate = m.dueDateDay || 10;
        const isLate = currentDay > (dueDate + 3);
        const shouldBeIsolir = !isPaid && isLate;
        return (shouldBeIsolir && m.status !== 'TERISOLIR') || (!shouldBeIsolir && m.status === 'TERISOLIR' && isPaid);
      });

      if (needsUpdate) {
        setDb(prev => {
          const yearData = prev[activeYear];
          if (!yearData) return prev;
          const updatedMembers = yearData.members.map(m => {
            const isPaid = m.payments?.[currentMonthIdx];
            const dueDate = m.dueDateDay || 10;
            const isLate = currentDay > (dueDate + 3);
            const shouldBeIsolir = !isPaid && isLate;
            
            if (shouldBeIsolir && m.status !== 'TERISOLIR') {
              return { ...m, status: 'TERISOLIR' as const };
            }
            if (!shouldBeIsolir && m.status === 'TERISOLIR' && isPaid) {
              return { ...m, status: 'AKTIF' as const };
            }
            return m;
          });
          return { ...prev, [activeYear]: { ...yearData, members: updatedMembers } };
        });
      }
    }
  }, [activeYearData.autoBillingEnabled, activeYearData.members, activeYear]);

  // TICKET ACTIONS
  const handleAddTicket = (ticketData: Omit<TroubleTicket, "id" | "createdAt" | "updatedAt">) => {
    const newTicket: TroubleTicket = {
      ...ticketData,
      id: `TKT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDb(prev => {
      const yearData = prev[activeYear] || { members: [], monthlyRate: 20000 };
      const currentTickets = yearData.tickets || [];
      return {
        ...prev,
        [activeYear]: {
          ...yearData,
          tickets: [...currentTickets, newTicket]
        }
      };
    });

    showNotification("Tiket Gangguan berhasil diterbitkan!");
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: "Pending" | "Diproses" | "Selesai") => {
    setDb(prev => {
      const yearData = prev[activeYear];
      if (!yearData || !yearData.tickets) return prev;

      const updatedTickets = yearData.tickets.map(t => 
        t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
      );

      return {
        ...prev,
        [activeYear]: {
          ...yearData,
          tickets: updatedTickets
        }
      };
    });

    showNotification(`Status tiket diperbarui ke: ${newStatus}`);
  };

  // Import database
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") {
          const years = Object.keys(parsed);
          const valids = years.filter(y => !isNaN(parseInt(y, 15)));
          if (valids.length === 0) {
            showNotification("Backup JSON tidak didukung!", "danger");
            return;
          }

          // Complete missing years
          const fullDb = { ...parsed };
          const range = Array.from({ length: 12 }, (_, i) => (2024 + i).toString());
          range.forEach(y => {
            if (!fullDb[y]) {
              fullDb[y] = { members: [], monthlyRate: 20000 };
            }
          });

          setDb(fullDb);
          showNotification("Pemulihan data iuran tuntas!", "success");
        }
      } catch (err) {
        console.error(err);
        showNotification("Format json tidak cocok.", "danger");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Sapu bersih database
  const handleWipeDatabase = () => {
    if (!window.confirm("Beneran menyapu bersih SELURUH database dari penyimpanan lokal?")) return;
    if (!window.confirm("Peringatan terakhir! Tombol ini akan menghapus semua tahun dan semua pelanggan.")) return;
    localStorage.removeItem("wifi_iuran_db");
    window.location.reload();
  };

  // Fast Simulate Pindai QR
  const handleSimulateScanPayment = () => {
    // Pick an unpaid month and member to clear as lunas dynamically
    const members = activeYearData.members || [];
    let modified = false;

    for (let mIdx = 0; mIdx < members.length; mIdx++) {
      const member = members[mIdx];
      for (let m = 0; m < 12; m++) {
        if (!member.payments?.[m]) {
          // Found an unpaid block, record a quick simulated QR payment
          setDb(prev => {
            const yearObj = prev[activeYear];
            const updatedMembers = yearObj.members.map(currentM => {
              if (currentM.id === member.id) {
                const updatedPayments = { ...currentM.payments, [m]: true };
                const updatedNotes = { ...(currentM.notes || {}), [m]: "Lunas Kilat QRIS" };
                return { ...currentM, payments: updatedPayments, notes: updatedNotes };
              }
              return currentM;
            });
            return {
              ...prev,
              [activeYear]: { ...yearObj, members: updatedMembers }
            };
          });
          modified = true;
          showNotification(`Simulasi Berhasil! QRIS: "${member.name}" - Bulan ${MONTH_NAMES[m].slice(0, 3)} diset Lunas!`, "success");
          setCurrentView("home");
          break;
        }
      }
      if (modified) break;
    }

    if (!modified) {
      showNotification("Seluruh iuran pelanggan sudah lunas! Tidak perlu memindai.", "info");
      setCurrentView("home");
    }
  };

  const handleLockScreen = () => {
    setIsLocked(true);
    showNotification("Akses pengurus berhasil dikunci!", "info");
  };

  const handleWipeAdminUser = () => {
    localStorage.removeItem("wifi_admin_user");
    setAdminUser(null);
    setIsLocked(false);
    showNotification("Profil pengurus berhasil disetel ulang!", "success");
  };

  const handleAddQuickTransaction = (data: { description: string; amount: number; date: string; category?: ExpenseCategory; type: "income" | "expense" }) => {
    if (data.type === "income") {
      handleAddCustomIncome(data.description, data.amount, data.date);
    } else {
      handleAddCustomExpense(data.description, data.amount, data.date, data.category || "LAIN_LAIN");
    }
    setTransactionModal({ show: false, type: "income" });
  };

  const handleEksekusiSetoranISPAutomatis = (totalSetoran: number) => {
    const yearObj = db[activeYear];
    if (!yearObj) return;

    const today = new Date().toISOString().split("T")[0];
    const timestamp = new Date().toISOString();
    const numMembers = yearObj.members.length;

    // 1. Record the expense
    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      date: today,
      description: `Setoran otomatis ISP untuk ${numMembers} pelanggan`,
      amount: totalSetoran,
      category: 'SETORAN_ISP'
    };

    // 2. Record the audit log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp,
      action: 'ISP_DEPOSIT',
      details: `Eksekusi setoran ISP otomatis sebesar ${formatRupiah(totalSetoran)} untuk ${numMembers} pelanggan.`
    };

    setDb(prev => {
      const yearData = prev[activeYear];
      return {
        ...prev,
        [activeYear]: {
          ...yearData,
          expenses: [newExpense, ...(yearData.expenses || [])],
          paymentLogs: [newLog, ...(yearData.paymentLogs || [])]
        }
      };
    });

    showNotification(`Kas berhasil dipotong ${formatRupiah(totalSetoran)} untuk setoran ISP!`, "success");
    setCurrentView("riwayat");
  };


  // 5. RENDERING SCENARIOS
  const renderCurrentSubView = () => {
    switch (currentView) {
      case "home":
        return (
          <DanaHome 
            activeYear={activeYear}
            netProfit={netProfit}
            totalRevenue={totalRevenueSum}
            totalExpenses={totalExpensesSum}
            numMembers={numMembers}
            completionRate={completionStatistics}
            recentTransactions={recentTransactions}
            onNavigate={setCurrentView}
            onCopyReport={handleCopyWhatsAppReportText}
            members={activeYearData.members || []}
            packages={activeYearData.packages || []}
            fallbackRate={activeYearData.monthlyRate}
            onLogout={handleWipeAdminUser}
            onOpenTransaction={(type) => setTransactionModal({ show: true, type })}
          />
        );
      case "tiket_gangguan":
        return (
          <TiketGangguanView 
            members={activeYearData.members || []}
            tickets={currentYearTickets}
            onBack={() => setCurrentView("home")}
            onAddTicket={handleAddTicket}
            onUpdateStatus={handleUpdateTicketStatus}
            techPhone="081234567890" // Default tech phone
          />
        );
      case "billing_otomatis":
        return (
          <BillingOtomatisView 
            members={activeYearData.members || []}
            packages={activeYearData.packages || []}
            onBack={() => setCurrentView("home")}
            autoBillingEnabled={activeYearData.autoBillingEnabled || false}
            onToggleAutoBilling={handleToggleAutoBilling}
            onTriggerMassBilling={handleTriggerMassBilling}
            activeYear={activeYear}
          />
        );
      case "pelanggan":
        return (
          <PelangganView 
            members={activeYearData.members || []}
            packages={activeYearData.packages || []}
            onBack={() => setCurrentView("home")}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onImportMembers={handleImportMembers}
          />
        );
      case "paket":
        return (
          <PaketView 
            packages={activeYearData.packages || []}
            onBack={() => setCurrentView("home")}
            onAddPackage={handleAddPackage}
            onEditPackage={handleEditPackage}
            onDeletePackage={handleDeletePackage}
          />
        );
      case "tagihan":
        return (
          <TagihanView 
            activeYear={activeYear}
            members={activeYearData.members || []}
            packages={activeYearData.packages || []}
            fallbackRate={activeYearData.monthlyRate}
            onBack={() => setCurrentView("home")}
            onTogglePayment={handleTogglePayment}
            onOpenNoteModal={handleOpenNoteModal}
            onCopyReport={handleCopyWhatsAppReportText}
            onBulkSetPaid={handleBulkSetPaid}
          />
        );
      case "pemasukan":
      case "pengeluaran":
        return (
          <KeuanganView 
            activeYear={activeYear}
            customIncomes={activeYearData.customIncomes || []}
            expenses={activeYearData.expenses || []}
            autoRevenue={autoRevenue}
            onBack={() => setCurrentView("home")}
            onAddIncome={handleAddCustomIncome}
            onDeleteIncome={handleDeleteCustomIncome}
            onAddExpense={handleAddCustomExpense}
            onDeleteExpense={handleDeleteCustomExpense}
          />
        );
      case "riwayat":
        return (
          <RiwayatView 
            timeline={generalHistoryTimeline}
            onBack={() => setCurrentView("home")}
          />
        );
      case "saya":
        return (
          <SayaView 
            activeYear={activeYear}
            yearsOptions={yearsOptions}
            fallbackRate={activeYearData.monthlyRate}
            rateInputVal={rateInputVal}
            onBack={() => setCurrentView("home")}
            onChangeYear={setActiveYear}
            onChangeRateInput={setRateInputVal}
            onSaveRate={handleSaveStandardRate}
            onResetPayments={handleResetCurrentPayments}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onWipeDatabase={handleWipeDatabase}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            browserRemindersEnabled={browserRemindersEnabled}
            onToggleBrowserReminders={handleToggleBrowserReminders}
            onSendTestNotification={handleSendTestNotification}
            adminUser={adminUser}
            onLockScreen={handleLockScreen}
            onWipeAdmin={handleWipeAdminUser}
            onNavigate={setCurrentView}
            onUpdateAdminProfile={(updatedUser: AdminUser) => {
              setAdminUser(updatedUser);
              localStorage.setItem("wifi_admin_user", JSON.stringify(updatedUser));
              showNotification("Profil pengurus berhasil diperbarui!", "success");
            }}
          />
        );
      case "scanner":
        return (
          <ScannerView 
            onBack={() => setCurrentView("home")}
            onSimulateScan={handleSimulateScanPayment}
          />
        );
      case "gangguan":
        return (
          <GangguanView 
            members={activeYearData.members || []}
            packages={activeYearData.packages || []}
            fallbackRate={activeYearData.monthlyRate}
            onBack={() => setCurrentView("home")}
          />
        );
      case "ping":
        return (
          <PingToolsView 
            onBack={() => setCurrentView("home")}
            onNavigateToGangguan={() => setCurrentView("gangguan")}
          />
        );
      case "kas_admin":
        return (
          <KasAdminView 
            members={activeYearData.members || []}
            packages={activeYearData.packages || []}
            onBack={() => setCurrentView("home")}
            activeYear={activeYear}
          />
        );
      case "rekap_isp":
        return (
          <RekapSetoranISP 
            members={activeYearData.members || []}
            packages={activeYearData.packages || []}
            totalSaldo={netProfit}
            onBack={() => setCurrentView("home")}
            onExecute={handleEksekusiSetoranISPAutomatis}
            onTogglePayment={handleTogglePayment}
            activeYear={activeYear}
          />
        );
      default:
        return <div>Sub-view Error.</div>;
    }
  };

  // Render Auth Guard Screen overlay if not registered or if locked
  if (!adminUser || isLocked) {
    return (
      <AuthScreen
        theme={theme}
        onToggleTheme={handleToggleTheme}
        adminUser={adminUser}
        isLocked={isLocked}
        onLogout={handleWipeAdminUser}
        onRegisterSuccess={(user) => {
          setAdminUser(user);
          localStorage.setItem("wifi_admin_user", JSON.stringify(user));
          showNotification(`Akun pengurus berhasil disimpan!`, "success");
        }}
        onUnlockSuccess={(fetchedDb?: any) => {
          setIsLocked(false);
          if (fetchedDb && typeof fetchedDb === "object") {
            try {
              const finalDb = { ...fetchedDb };
              const years = Array.from({ length: 12 }, (_, i) => (2024 + i).toString());
              years.forEach(yr => {
                if (!finalDb[yr]) {
                  finalDb[yr] = { members: [], monthlyRate: 20000, packages: [], expenses: [], customIncomes: [] };
                }
                
                // Ensure everything is an array
                const target = finalDb[yr];
                if (!target.members) target.members = [];
                if (!target.packages) target.packages = [...defaultPackages];
                if (!target.expenses) target.expenses = getSeedExpenses(yr);
                if (!target.customIncomes) target.customIncomes = [];
                
                if (!Array.isArray(target.members)) target.members = Object.values(target.members);
                if (!Array.isArray(target.packages)) target.packages = Object.values(target.packages);
                if (!Array.isArray(target.expenses)) target.expenses = Object.values(target.expenses);
                if (!Array.isArray(target.customIncomes)) target.customIncomes = Object.values(target.customIncomes);
              });
              setDb(finalDb);
              showNotification("Data disinkronkan dari Cloud!", "success");
            } catch (err) {
              console.error("Error processing cloud data:", err);
              showNotification("Gagal memproses data cloud, menggunakan data lokal.", "info");
            }
          } else {
            showNotification("Akses dibuka!", "success");
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-850 flex items-center justify-center p-0 sm:p-5 font-sans relative select-none antialiased">
      
      {/* Visual background decorations for browser views */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none hidden lg:block"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none hidden lg:block"></div>

      {/* PHONE WEBVIEW MOCKUP CONTAINER */}
      <div className="w-full max-w-sm sm:max-w-md min-h-screen sm:min-h-[824px] bg-[#F5F9FC] dark:bg-[#0B1528] sm:rounded-[40px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border-0 sm:border-[10px] sm:border-slate-800 dark:sm:border-slate-800 relative flex flex-col justify-between overflow-hidden transition-colors duration-205">
        
        {/* Dynamic viewport viewport */}
        <div className="flex-1 overflow-y-auto pb-24 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 12, scale: 0.985, filter: "blur(2px)" }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -12, scale: 0.985, filter: "blur(2px)" }}
              transition={{ 
                duration: 0.35, 
                ease: [0.16, 1, 0.3, 1] // Custom premium Quart Out easing
              }}
              className="w-full h-full"
            >
              {renderCurrentSubView()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* MODAL PENGINGAT BACKUP */}
        <AnimatePresence>
          {paymentConfirmModal && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 space-y-5 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Konfirmasi Bayar</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validasi Tanda Tangan</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPaymentConfirmModal(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pelanggan</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">{paymentConfirmModal.memberName}</span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Periode</span>
                      <span className="text-xs font-black text-sky-600 dark:text-sky-400">{paymentConfirmModal.monthName} {activeYear}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/40 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bayar:</span>
                    <span className="text-sm font-black text-emerald-600">{formatRupiah(paymentConfirmModal.amount)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    <Info className="h-3 w-3" />
                    <span>Tanda tangan digital pengurus</span>
                  </div>
                  <SignaturePad onSave={handleConfirmPaymentWithSignature} />
                </div>

                <p className="text-[9px] text-center text-slate-400 font-medium italic">
                  * Tanda tangan ini akan disimpan sebagai bukti validitas pembayaran yang sah di sistem.
                </p>
              </motion.div>
            </div>
          )}

          {showBackupReminder && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 text-center space-y-6 border border-slate-100 dark:border-slate-800 shadow-2xl"
              >
                <div className="mx-auto w-20 h-20 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Database className="h-10 w-10 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Jadwal Backup Data</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Halo Admin! Ini sudah awal bulan. Yuk, cadangkan data kas & pelanggan Anda agar aman jika terjadi masalah.</p>
                </div>
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleExportBackup}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-100 dark:shadow-none transition active:scale-95"
                  >
                    Download Backup Sekarang
                  </button>
                  <button
                    onClick={() => setShowBackupReminder(false)}
                    className="w-full py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-black uppercase tracking-widest"
                  >
                    Nanti Saja
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL TRANSAKSI CEPAT */}
        <AnimatePresence>
          {transactionModal.show && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/40 backdrop-blur-sm">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] sm:rounded-3xl shadow-2xl p-6 space-y-5 border-t sm:border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-2xl ${transactionModal.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                      {transactionModal.type === "income" ? <Plus className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-white">
                        Catat {transactionModal.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Saldo Kas Real-time</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTransactionModal({ show: false, type: "income" })}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    handleAddQuickTransaction({
                      description: formData.get("desc") as string,
                      amount: parseInt(formData.get("amount") as string) || 0,
                      date: formData.get("date") as string,
                      category: formData.get("category") as ExpenseCategory,
                      type: transactionModal.type
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Deskripsi / Catatan</label>
                    <input 
                      name="desc"
                      type="text" 
                      required
                      placeholder={transactionModal.type === "income" ? "Contoh: Iuran Alat Terkumpul" : "Contoh: Bayar Listrik Router"}
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#118EEA] outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nominal (Rp)</label>
                      <input 
                        name="amount"
                        type="number" 
                        required
                        placeholder="0"
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#118EEA] outline-none transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Tanggal</label>
                      <input 
                        name="date"
                        type="date" 
                        required
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#118EEA] outline-none transition"
                      />
                    </div>
                  </div>

                  {transactionModal.type === "expense" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Kategori</label>
                      <select 
                        name="category"
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#118EEA] outline-none transition"
                      >
                        <option value="OPERASIONAL">OPERASIONAL</option>
                        <option value="SETORAN_ISP">SETORAN ISP</option>
                        <option value="PERBAIKAN">PERBAIKAN</option>
                        <option value="LAIN_LAIN">LAIN-LAIN</option>
                      </select>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className={`w-full py-4 rounded-2xl text-white font-black text-sm shadow-lg transition active:scale-[0.98] mt-2 ${
                      transactionModal.type === "income" ? "bg-emerald-600 shadow-emerald-200 dark:shadow-none" : "bg-rose-600 shadow-rose-200 dark:shadow-none"
                    }`}
                  >
                    Simpan Transaksi Kas
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* STICKY BOTTOM NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-0 right-0 sm:absolute bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-2.5 px-4 flex items-center justify-between z-44 text-slate-400 dark:text-slate-500 font-sans shadow-[0_-5px_15px_rgba(0,0,0,0.02)] rounded-t-2xl sm:max-w-[428px] mx-auto transition-colors duration-200">
          <button 
            type="button" 
            onClick={() => setCurrentView("home")}
            className={`flex flex-col items-center flex-1 focus:outline-none ${currentView === "home" ? "text-indigo-600" : "hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[9px] font-bold mt-1">Beranda</span>
          </button>

          <button 
            type="button" 
            onClick={() => setCurrentView("riwayat")}
            className={`flex flex-col items-center flex-1 focus:outline-none ${currentView === "riwayat" ? "text-indigo-600" : "hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            <History className="h-5 w-5" />
            <span className="text-[9px] font-bold mt-1">Riwayat</span>
          </button>

          {/* DANA SCAN ROUND BUTTON EFFECT */}
          <div className="flex-1 flex justify-center -mt-6">
            <button 
              type="button"
              onClick={() => setCurrentView("scanner")}
              className="bg-indigo-600 hover:bg-indigo-700 border-[4px] border-white dark:border-slate-900 text-white p-3.5 rounded-full shadow-lg hover:shadow-indigo-200 focus:outline-none active:scale-95 transition-all z-50 flex items-center justify-center transform"
              title="Scanner Pindai QR"
            >
              <QrCode className="h-6 w-6 stroke-[2.5]" />
            </button>
          </div>

          <button 
            type="button" 
            onClick={() => setCurrentView("tagihan")}
            className={`flex flex-col items-center flex-1 focus:outline-none ${currentView === "tagihan" ? "text-indigo-600" : "hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            <Wallet className="h-5 w-5" />
            <span className="text-[9px] font-bold mt-1">Dompet</span>
          </button>

          <button 
            type="button" 
            onClick={() => setCurrentView("saya")}
            className={`flex flex-col items-center flex-1 focus:outline-none ${currentView === "saya" ? "text-indigo-600" : "hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            <User className="h-5 w-5" />
            <span className="text-[9px] font-bold mt-1">Saya</span>
          </button>
        </nav>

        {/* NOTE EDIT MODAL & TOAST NOTIFICATION OVERLAYS */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center space-x-3 border max-w-xs mx-auto ${
                toast.type === "success" 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100" 
                  : toast.type === "danger"
                  ? "bg-rose-50 border-rose-200 text-rose-800 shadow-rose-100"
                  : "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-indigo-100"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : toast.type === "danger" ? (
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              ) : (
                <Info className="h-5 w-5 text-indigo-600 shrink-0" />
              )}
              <span className="text-xs font-bold leading-snug">{toast.message}</span>
            </motion.div>
          )}

          {activeNoteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl shadow-2xl p-5 space-y-4 text-left text-slate-800 dark:text-slate-150 border border-transparent dark:border-slate-800 transition-colors duration-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">Setel Catatan Bulanan</h3>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                      {activeNoteModal.memberName} • {activeNoteModal.monthName} {activeYear}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setActiveNoteModal(null)}
                    className="p-1 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 rounded-lg transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Status Toggle Button in modal */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status Pembayaran</span>
                    <span className={`text-[11px] font-black mt-0.5 ${activeNoteModal.isPaid ? "text-emerald-500 animate-pulse" : "text-rose-500"}`}>
                      {activeNoteModal.isPaid ? "LUNAS KAS" : "BELUM LUNAS"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveNoteModal(prev => prev ? { ...prev, isPaid: !prev.isPaid } : null)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition border flex items-center space-x-1.5 ${
                      activeNoteModal.isPaid 
                        ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50" 
                        : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-[#10B981] dark:text-[#34D399] hover:bg-emerald-100/50"
                    }`}
                  >
                    {activeNoteModal.isPaid ? (
                      <>
                        <X className="h-3 w-3" />
                        <span>Batalkan Lunas</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Centang Lunas</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Custom Note input */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">Pesan Catatan Khas</label>
                  <input
                    type="text"
                    maxLength={20}
                    value={activeNoteModal.noteText}
                    onChange={(e) => setActiveNoteModal(prev => prev ? { ...prev, noteText: e.target.value } : null)}
                    placeholder="Contoh: Transfer BRI, Kurang 10K"
                    className="w-full bg-[#F3F6F9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600 h-[36px] text-slate-800 dark:text-slate-100"
                  />
                  <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                    <span>Maks. 20 huruf agar pas di tabel</span>
                    <span>{activeNoteModal.noteText.length}/20</span>
                  </div>
                </div>

                {/* Digital Signature Display */}
                {activeNoteModal.signature && (
                  <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center space-x-2 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                      <span>Validasi Tanda Tangan Pengurus</span>
                    </div>
                    <div className="bg-white dark:bg-white/10 rounded-lg p-2 flex justify-center">
                      <img 
                        src={activeNoteModal.signature} 
                        alt="Signature" 
                        className="h-20 object-contain dark:invert"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                {/* Suggested template messages tags */}
                <div className="space-y-1">
                  <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">Pilihan Cepat</span>
                  <div className="flex flex-wrap gap-1">
                    {["TF BRI", "TF Dana", "Bayar Tunai", "Titip Kas", "Kurang 10k"].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setActiveNoteModal(prev => prev ? { ...prev, noteText: tag } : null)}
                        className="text-[9px] font-semibold px-2 py-0.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 active:scale-95 transition cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex space-x-2 pt-2 border-t border-slate-55 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveNoteModal(null)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 text-slate-500 dark:text-slate-400 font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNoteModal}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
