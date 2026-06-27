import React, { useState, useMemo } from "react";
import { 
  Bell, 
  Search, 
  MessageSquare, 
  Eye, 
  EyeOff, 
  Plus, 
  ArrowUpRight, 
  Share2, 
  Users, 
  Wifi, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Upload, 
  ChevronRight, 
  QrCode,
  ShieldCheck,
  Zap,
  Info,
  MessageCircle,
  Check,
  AlertCircle,
  LogOut,
  Wrench,
  Activity,
  Globe,
  Router,
  X,
  ExternalLink,
  FileText
} from "lucide-react";
import { MONTH_NAMES, formatRupiah } from "../utils";
import { Member, WifiPackage } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface DanaHomeProps {
  activeYear: string;
  netProfit: number;
  totalRevenue: number;
  totalExpenses: number;
  numMembers: number;
  completionRate: number;
  recentTransactions: Array<{
    id: string;
    type: "payment" | "income" | "expense";
    date: string;
    title: string;
    amount: number;
    badge?: string;
  }>;
  onNavigate: (view: "home" | "pelanggan" | "paket" | "tagihan" | "pemasukan" | "pengeluaran" | "riwayat" | "saya" | "scanner" | "gangguan" | "ping" | "kas_admin" | "tiket_gangguan" | "billing_otomatis" | "rekap_isp") => void;
  onCopyReport: () => void;
  members: Member[];
  packages: WifiPackage[];
  fallbackRate: number;
  onLogout: () => void;
  onOpenTransaction?: (type: "income" | "expense") => void;
}

export const DanaHome: React.FC<DanaHomeProps> = ({
  activeYear,
  netProfit,
  totalRevenue,
  totalExpenses,
  numMembers,
  completionRate,
  recentTransactions,
  onNavigate,
  onCopyReport,
  members,
  packages,
  fallbackRate,
  onLogout,
  onOpenTransaction,
}) => {
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [showRouterModal, setShowRouterModal] = useState<boolean>(false);
  const [customRouterIp, setCustomRouterIp] = useState<string>("");

  const commonRouterIps = [
    { label: "Default (192.168.1.1)", ip: "192.168.1.1" },
    { label: "Alternative (192.168.0.1)", ip: "192.168.0.1" },
    { label: "TP-Link (192.168.1.254)", ip: "192.168.1.254" },
    { label: "Huawei/ZTE (192.168.100.1)", ip: "192.168.100.1" },
  ];

  const handleOpenRouter = (ip: string) => {
    let target = ip.trim();
    if (!target) return;
    
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = "http://" + target;
    }
    window.open(target, "_blank");
    setShowRouterModal(false);
  };

  // Calculate unpaid members for the running month
  const currentMonthIndex = useMemo(() => new Date().getMonth(), []);
  const currentMonthName = useMemo(() => MONTH_NAMES[currentMonthIndex], [currentMonthIndex]);

  const unpaidThisMonth = useMemo(() => {
    if (!members) return [];
    
    return members.map(member => {
      const pkg = packages.find(p => p.id === member.packageId);
      const rate = pkg ? pkg.price : fallbackRate;
      const isPaid = !!member.payments?.[currentMonthIndex];

      // Format WhatsApp Message
      const messageText = `Halo *${member.name}*,\n\nMohon maaf mengganggu waktunya. Kami ingin mengingatkan mengenai pembayaran iuran bulanan WiFi ELDRIME_Net untuk bulan *${currentMonthName} ${activeYear}*.\n\nTagihan Anda sebesar: *${formatRupiah(rate)}*.\n\nPembayaran dapat ditransfer via bank atau disetor tunai. Jika sudah melakukan pembayaran, mohon kirimkan konfirmasi atau bukti transfernya ya.\n\nTerima kasih banyak atas kerja samanya! 🙏✨`;
      
      let cleanedPhone = member.phone || "";
      cleanedPhone = cleanedPhone.replace(/\D/g, "");
      if (cleanedPhone.startsWith("0")) {
        cleanedPhone = "62" + cleanedPhone.slice(1);
      }

      const waUrl = cleanedPhone 
        ? `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(messageText)}`
        : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

      return {
        ...member,
        rate,
        pkg,
        isPaid,
        waUrl
      };
    }).filter(m => !m.isPaid);
  }, [members, packages, fallbackRate, currentMonthIndex, currentMonthName, activeYear]);

  // Fake promos for RT/RW Net
  const promos = [
    { title: "Bagi-Bagi Voucher WiFi", desc: "Voucher internet cepat untuk warga telat membayar berkurang!", color: "from-sky-500 to-indigo-600", tag: "PROMO" },
    { title: "Internet Stabil 24 Jam", desc: "Tips router awet: Matikan router 5 menit seminggu sekali.", color: "from-amber-400 to-orange-500", tag: "TIPS" },
    { title: "Kas Tertib, WiFi Lancar", desc: "Batas jatuh tempo iuran bulanan adalah tanggal 10 awal bulan.", color: "from-emerald-400 to-teal-600", tag: "INFO" }
  ];

  return (
    <div className="space-y-4">
      {/* 1. ENTERPRISE TOP STATUS BAR & HEADER */}
      <div className="bg-slate-900 text-white pt-4 pb-10 px-4 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting blobs */}
        <div className="absolute right-[-40px] top-[-30px] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute left-[-20px] bottom-[-45px] w-48 h-48 bg-slate-800/20 rounded-full blur-2xl"></div>

        {/* Header Row */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Router className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter uppercase font-sans block leading-none">
                ELDRIME<span className="text-indigo-400">_Net</span>
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">jadikan satu!</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate("saya")}
              className="p-1 px-3 rounded-xl bg-slate-800 border border-slate-700 text-[10px] font-bold tracking-tight hover:bg-slate-700 transition"
            >
              {activeYear}
            </button>
            <button 
              onClick={() => onNavigate("riwayat")} 
              className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700 transition"
              title="Notifikasi Riwayat"
            >
              <Bell className="h-4 w-4 text-slate-300" />
            </button>
            <button 
              onClick={onLogout} 
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition active:scale-95 text-rose-400 flex items-center justify-center cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ENTERPRISE SALDO BOARD */}
        <div className="bg-indigo-600 p-6 rounded-[32px] border border-white/10 relative z-10 shadow-2xl shadow-indigo-600/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-indigo-100 text-[10px] font-black uppercase tracking-widest opacity-80">
                <span>Total Saldo Kas Operasional</span>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-0.5 opacity-80 hover:opacity-100 transition"
                >
                  {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="text-3xl font-black tracking-tighter font-sans">
                {showBalance ? formatRupiah(netProfit) : "Rp •••••••"}
              </div>
            </div>

            <button 
              onClick={() => onNavigate("scanner")}
              className="bg-white/20 p-3 rounded-2xl flex items-center justify-center border border-white/20 active:scale-95 transition shadow-lg"
              title="Pindai QR"
            >
              <QrCode className="h-7 w-7 text-white" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10 text-[10px] text-indigo-50">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
              </div>
              <div>
                <span className="block opacity-75 uppercase font-black tracking-tighter">Pemasukan</span>
                <span className="font-black text-[12px] text-white">
                  {formatRupiah(totalRevenue)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-rose-500/20 rounded-lg">
                <TrendingDown className="h-3.5 w-3.5 text-rose-300" />
              </div>
              <div>
                <span className="block opacity-75 uppercase font-black tracking-tighter">Pengeluaran</span>
                <span className="font-black text-[12px] text-white">
                  {formatRupiah(totalExpenses)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DANA QUICK ACTION SLIDER PILLS */}
        <div className="grid grid-cols-4 gap-1 mt-5 pt-1 relative z-10 text-center">
          <button 
            onClick={() => onOpenTransaction ? onOpenTransaction("income") : onNavigate("pemasukan")}
            className="flex flex-col items-center space-y-1.5 focus:outline-none group"
          >
            <div className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 group-active:scale-95 transition border border-white/10">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-bold text-sky-50">Isi Kas</span>
          </button>
 
          <button 
            onClick={() => onOpenTransaction ? onOpenTransaction("expense") : onNavigate("pengeluaran")}
            className="flex flex-col items-center space-y-1.5 focus:outline-none group"
          >
            <div className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 group-active:scale-95 transition border border-white/10">
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-bold text-sky-50">Kirim / Keluar</span>
          </button>

          <button 
            onClick={() => onNavigate("tagihan")}
            className="flex flex-col items-center space-y-1.5 focus:outline-none group"
          >
            <div className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 group-active:scale-95 transition border border-white/10">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-bold text-sky-50">Minta Iuran</span>
          </button>

          <button 
            onClick={onCopyReport}
            className="flex flex-col items-center space-y-1.5 focus:outline-none group"
          >
            <div className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 group-active:scale-95 transition border border-white/10">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-bold text-sky-50">Kirim WA</span>
          </button>
        </div>
      </div>

      {/* 2. SERVICES ICON GRID (PILIHAN LAYANAN) */}
      <section className="bg-white dark:bg-slate-900 p-5 mx-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none relative -mt-8 z-20">
        <div className="flex items-center justify-between mb-5 px-1">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center space-x-2">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            <span>Layanan ELDRIME_Net</span>
          </span>
          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">Menu Utama</span>
        </div>

        <div className="grid grid-cols-4 gap-y-6 gap-x-2 text-center pt-1">
          {/* Item 1: Pelanggan */}
          <button 
            onClick={() => onNavigate("pelanggan")}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-2xl transition group-active:scale-95 shadow-sm border border-indigo-100/30 dark:border-indigo-900/30">
              <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">Pelanggan</span>
          </button>

          {/* Item 2: Paket */}
          <button 
            onClick={() => onNavigate("paket")}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-2xl transition group-active:scale-95 shadow-sm border border-orange-100/30 dark:border-orange-900/30">
              <Wifi className="h-6 w-6 text-orange-500 dark:text-orange-400" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">Paket WiFi</span>
          </button>

          {/* Item 3: Matriks Tagihan */}
          <button 
            onClick={() => onNavigate("tagihan")}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-2xl transition group-active:scale-95 shadow-sm border border-emerald-100/30 dark:border-emerald-900/30">
              <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">Matriks</span>
          </button>

          {/* Item 4: Pemasukan */}
          <button 
            onClick={() => onNavigate("pemasukan")}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-2xl transition group-active:scale-95 shadow-sm border border-indigo-100/30 dark:border-indigo-900/30">
              <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">Pemasukan</span>
          </button>

          {/* Item 5: Pengeluaran */}
          <button 
            onClick={() => onNavigate("pengeluaran")}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-2xl transition group-active:scale-95 shadow-sm border border-rose-100/30 dark:border-rose-900/30">
              <TrendingDown className="h-6 w-6 text-rose-500 dark:text-rose-400" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">Pengeluaran</span>
          </button>

          {/* Item 6: WhatsApp Broadcast link */}
          <button 
            onClick={onCopyReport}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/40 rounded-2xl transition group-active:scale-95 shadow-sm border border-teal-100/30 dark:border-teal-900/30">
              <Share2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">Salin WA</span>
          </button>

          {/* Item 7: Riwayat Ledger */}
          <button 
            onClick={() => onNavigate("riwayat")}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-2xl transition group-active:scale-95 shadow-sm border border-slate-100 dark:border-slate-700">
              <Bell className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">Riwayat</span>
          </button>

          {/* Item 8: Ping Tools */}
          <button 
            onClick={() => onNavigate("ping")}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-2xl transition group-active:scale-95 shadow-sm border border-purple-100/30 dark:border-purple-900/30">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight text-center">Ping Tools</span>
          </button>

          {/* Item 9: Profile Saya */}
          <button 
            onClick={() => onNavigate("saya")}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-2xl transition group-active:scale-95 shadow-sm border border-amber-100/30 dark:border-amber-900/30">
              <QrCode className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">Setelan</span>
          </button>

          {/* Item 10: Router */}
          <button 
            onClick={() => setShowRouterModal(true)}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-slate-900 hover:bg-slate-800 rounded-2xl transition group-active:scale-95 shadow-sm border border-slate-700">
              <Router className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">Router</span>
          </button>

          {/* Item 11: Kas Admin */}
          <button 
            onClick={() => onNavigate("kas_admin")}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition group-active:scale-95 shadow-lg shadow-indigo-600/20 border border-indigo-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight">Kas Admin</span>
          </button>

          {/* Item 12: Billing Otomatis */}
          <button 
            onClick={() => onNavigate("billing_otomatis")}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-2xl transition group-active:scale-95 shadow-sm border border-slate-100 dark:border-slate-700">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight text-center">Billing</span>
          </button>

          {/* Item 13: Rekap ISP */}
          <button 
            onClick={() => onNavigate("rekap_isp")}
            className="flex flex-col items-center space-y-2 focus:outline-none group"
          >
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-2xl transition group-active:scale-95 shadow-sm border border-rose-100/30 dark:border-rose-900/30">
              <ShieldCheck className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 leading-tight text-center">Rekap ISP</span>
          </button>
        </div>
      </section>

      {/* Modal Kelola Router */}
      <AnimatePresence>
        {showRouterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRouterModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Router className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight">Kelola Router</h3>
                    <p className="text-[10px] font-bold text-sky-100">Pilih atau Masukkan IP Router</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRouterModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Common IPs Grid */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Router Umum</label>
                  <div className="grid grid-cols-1 gap-2">
                    {commonRouterIps.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOpenRouter(item.ip)}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-200 dark:hover:border-sky-900 transition text-left group"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">{item.label}</p>
                          <p className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">{item.ip}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-sky-500 transition" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Masukkan IP Manual</label>
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Globe className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="text"
                        value={customRouterIp}
                        onChange={(e) => setCustomRouterIp(e.target.value)}
                        placeholder="Contoh: 192.168.1.1"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold font-mono text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                      />
                    </div>

                    <button 
                      onClick={() => handleOpenRouter(customRouterIp)}
                      disabled={!customRouterIp.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition flex items-center justify-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Buka Pengaturan Router</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lapor Gangguan & Kendala Banner */}
      <section className="mx-4">
        <button
          onClick={() => onNavigate("tiket_gangguan")}
          className="w-full bg-gradient-to-r from-rose-500/90 to-rose-600/95 dark:from-rose-600 dark:to-rose-700 text-white p-3.5 rounded-2xl border border-rose-400/40 dark:border-rose-900/40 shadow-xs flex items-center justify-between group active:scale-[0.98] transition cursor-pointer"
        >
          <div className="flex items-center space-x-3 text-left">
            <div className="p-2 bg-white/10 dark:bg-black/10 rounded-xl">
              <Wrench className="h-4.5 w-4.5 text-white animate-pulse" />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-rose-100">WiFi Ada Kendala?</h4>
              <p className="text-[11px] font-bold text-white leading-tight">Hubungkan ke Teknisi Lewat WhatsApp</p>
            </div>
          </div>
          <div className="p-1 px-1.5 bg-white/20 dark:bg-black/20 rounded-lg text-[8px] font-black tracking-wide shrink-0">
            LAPOR CS
          </div>
        </button>
      </section>

      {/* NOTIFIKASI IURAN JATUH TEMPO BULAN BERJALAN */}
      <section id="notifikasi-iuran-berjalan" className="mx-4 bg-white p-4 rounded-2xl border border-amber-100/70 shadow-xs bg-gradient-to-b from-amber-50/25 to-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Bell className="h-4.5 w-4.5 text-amber-500 animate-bounce" />
              {unpaidThisMonth.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              )}
            </div>
            <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
              Notifikasi Pembayaran {currentMonthName}
            </span>
          </div>
          <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            Jatuh Tempo tgl 10
          </span>
        </div>

        {unpaidThisMonth.length === 0 ? (
          <div className="flex items-center space-x-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <div className="p-2 bg-emerald-100 rounded-lg shrink-0 text-emerald-600">
              <Check className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wide font-black text-emerald-800">Semua Tagihan Lunas!</p>
              <p className="text-[10px] font-bold text-slate-500">Luar biasa! Seluruh pelanggan telah melunasi iuran bulan berjalan.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              ⚠️ {unpaidThisMonth.length} Pelanggan Belum Bayar:
            </p>
            <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
              {unpaidThisMonth.map((m) => {
                const dueDay = m.dueDateDay || 10;
                const today = new Date();
                const todayDay = today.getDate();
                const daysLeft = dueDay - todayDay;
                
                let warningBadge = null;
                if (daysLeft >= 0 && daysLeft <= 3) {
                  warningBadge = (
                    <span className="inline-flex items-center space-x-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-extrabold text-[8px] px-1.5 py-0.5 border border-amber-200/50 dark:border-amber-900/30 rounded-md shrink-0 animate-pulse">
                      <AlertCircle className="h-2.5 w-2.5" />
                      <span>{daysLeft === 0 ? "Hari Ini" : `${daysLeft} H lagi`}</span>
                    </span>
                  );
                } else if (daysLeft < 0) {
                  warningBadge = (
                    <span className="inline-flex items-center space-x-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold text-[8px] px-1.5 py-0.5 border border-rose-200/50 dark:border-rose-900/30 rounded-md shrink-0">
                      <AlertCircle className="h-2.5 w-2.5" />
                      <span>Lewat ({Math.abs(daysLeft)} H)</span>
                    </span>
                  );
                }

                return (
                  <div 
                    key={m.id}
                    className="p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/85 rounded-xl flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-slate-850/50 transition duration-150"
                  >
                    <div className="min-w-0 pr-2 flex-1 text-left">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                        <p className="text-[11.5px] font-black text-slate-800 dark:text-slate-200 truncate leading-snug">{m.name}</p>
                        {warningBadge}
                      </div>
                      <p className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 font-sans mt-0.5">
                        {m.pkg ? `${m.pkg.speed} • ${formatRupiah(m.rate)}` : `Standar • ${formatRupiah(m.rate)}`}
                        {" • Tgl " + dueDay}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center space-x-1.5">
                      {m.phone && (
                        <a
                          href={m.waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs active:scale-95 transition"
                          title="Ingatkan via WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                        <button 
                        onClick={() => onNavigate("tagihan")}
                        className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-indigo-600 shadow-xs active:scale-95 transition"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3. DANA NEWS AND CONVENIENCE CARDS */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
            📢 Informasi & Tips WiFi-mu
          </span>
          <span className="text-xs text-sky-600 font-bold">Terbaru</span>
        </div>

        {/* Scrollable Container of cards */}
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none snap-x scroll-smooth">
          {promos.map((p, i) => (
            <div 
              key={i}
              className={`w-72 shrink-0 snap-center rounded-2xl bg-gradient-to-br ${p.color} text-white p-4.5 relative overflow-hidden shadow-xs flex flex-col justify-between h-40`}
            >
              <div className="absolute top-2 right-2 bg-white/20 rounded px-2 py-0.5 text-[8px] font-black uppercase">
                {p.tag}
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

              <div>
                <h4 className="text-sm font-extrabold tracking-tight mb-1">{p.title}</h4>
                <p className="text-[11px] text-white/85 font-medium leading-relaxed">{p.desc}</p>
              </div>

              <div className="flex items-center space-x-1.5 text-[9px] font-extrabold text-white/90">
                <span>Selengkapnya</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. TOTAL MEMBERS MATRIX CARD */}
      <section className="mx-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
            <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
              Status Ketuntasan Iuran
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
            Tingkat: {completionRate}%
          </span>
        </div>

        <div className="relative w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center text-xs font-semibold text-slate-600 pt-1">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="block text-[9px] text-slate-400 font-bold uppercase">PELANGGAN AKTIF</span>
            <span className="text-sm font-black text-slate-800">{numMembers}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="block text-[9px] text-slate-400 font-bold uppercase">SISA UNTUK REKAP</span>
            <span className="text-sm font-black text-slate-800">12 Bulan</span>
          </div>
        </div>
      </section>

      {/* 5. RECENT TRANSACTION LOGS */}
      <section className="mx-4 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
            ⏳ Aktivitas Buku Kas Terbaru
          </span>
          <button 
            onClick={() => onNavigate("riwayat")}
            className="text-[10px] font-bold text-indigo-600 flex items-center space-x-0.5 hover:underline"
          >
            <span>Seluruhnya</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-400 space-y-1">
            <Info className="h-5 w-5 mx-auto text-slate-300" />
            <p className="text-xs font-bold uppercase">Belum ada transaksi</p>
            <p className="text-[10px]">Lakukan checklist iuran atau catat pengeluaran baru.</p>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            className="space-y-2 pb-2"
          >
            {recentTransactions.map((tx) => (
              <motion.div 
                key={tx.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      type: "spring",
                      stiffness: 350,
                      damping: 25
                    }
                  }
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.995 }}
                onClick={() => onNavigate("riwayat")}
                className="bg-white p-3 rounded-2xl border border-slate-50 flex items-center justify-between hover:border-slate-200 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    tx.type === "payment" 
                      ? "bg-emerald-50 text-emerald-600" 
                      : tx.type === "income" 
                      ? "bg-indigo-50 text-indigo-600" 
                      : "bg-rose-50 text-rose-500"
                  }`}>
                    {tx.type === "payment" && <Calendar className="h-4 w-4" />}
                    {tx.type === "income" && <TrendingUp className="h-4 w-4" />}
                    {tx.type === "expense" && <TrendingDown className="h-4 w-4" />}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate leading-snug">{tx.title}</p>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium font-mono">
                      <span>{tx.date}</span>
                      {tx.badge && (
                        <>
                          <span>•</span>
                          <span className={`px-1 py-0.2 rounded uppercase text-[8px] font-black ${
                            tx.type === "payment" ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                          }`}>{tx.badge}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`text-xs font-extrabold shrink-0 pl-2 ${
                  tx.type === "expense" ? "text-rose-600" : "text-emerald-600"
                }`}>
                  {tx.type === "expense" ? "-" : "+"} {formatRupiah(tx.amount)}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};
