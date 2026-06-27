import React, { useRef, useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight,
  Trash2, 
  RotateCcw, 
  Download, 
  Upload, 
  Settings, 
  User, 
  Calendar, 
  Info, 
  QrCode, 
  Wifi,
  Coins,
  Bell,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  AlertCircle,
  Wrench
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatRupiah } from "../utils";
import { AdminUser } from "../types";

interface SayaViewProps {
  activeYear: string;
  yearsOptions: string[];
  fallbackRate: number;
  rateInputVal: string;
  onBack: () => void;
  onChangeYear: (year: string) => void;
  onChangeRateInput: (val: string) => void;
  onSaveRate: () => void;
  onResetPayments: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onWipeDatabase: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  browserRemindersEnabled: boolean;
  onToggleBrowserReminders: () => void;
  onSendTestNotification: () => void;
  adminUser: AdminUser | null;
  onLockScreen: () => void;
  onWipeAdmin: () => void;
  onNavigate?: (view: "home" | "pelanggan" | "paket" | "tagihan" | "pemasukan" | "pengeluaran" | "riwayat" | "saya" | "scanner" | "gangguan") => void;
  onUpdateAdminProfile?: (updatedUser: AdminUser) => void;
}

export const SayaView: React.FC<SayaViewProps> = ({
  activeYear,
  yearsOptions,
  fallbackRate,
  rateInputVal,
  onBack,
  onChangeYear,
  onChangeRateInput,
  onSaveRate,
  onResetPayments,
  onExportBackup,
  onImportBackup,
  onWipeDatabase,
  theme,
  onToggleTheme,
  browserRemindersEnabled,
  onToggleBrowserReminders,
  onSendTestNotification,
  adminUser,
  onLockScreen,
  onWipeAdmin,
  onNavigate,
  onUpdateAdminProfile
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // States for Profile Editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(adminUser?.name || "");
  const [editAddress, setEditAddress] = useState(adminUser?.address || "");
  const [editPhotoUrl, setEditPhotoUrl] = useState(adminUser?.photoUrl || "");

  const handleStartEdit = () => {
    if (adminUser) {
      setEditName(adminUser.name || "");
      setEditAddress(adminUser.address || "");
      setEditPhotoUrl(adminUser.photoUrl || "");
    }
    setIsEditingProfile(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar! Maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setEditPhotoUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      alert("Nama pengurus tidak boleh kosong!");
      return;
    }
    if (adminUser && onUpdateAdminProfile) {
      onUpdateAdminProfile({
        ...adminUser,
        name: editName.trim(),
        address: editAddress.trim(),
        photoUrl: editPhotoUrl
      });
      setIsEditingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9FC] dark:bg-slate-950 transition-colors duration-200 font-sans">
      {/* Cool Settings app bar header */}
      <div className="bg-slate-900 text-white pt-12 pb-10 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting blobs */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">Profil & Setelan</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              Manajemen RT/RW Net
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl hover:bg-slate-700 transition relative z-10 cursor-pointer"
        >
          <LogOut className="h-5 w-5 text-white" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto font-sans">
        
        {/* PROFILE ADMIN SECTION */}
        {adminUser && (
          <section className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 transition-all">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative group">
                <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-indigo-600 to-slate-800 p-1 shadow-lg">
                  <div className="h-full w-full rounded-[28px] bg-white dark:bg-slate-900 flex items-center justify-center border-2 border-white dark:border-slate-900 overflow-hidden">
                    {adminUser.photoUrl ? (
                      <img 
                        src={adminUser.photoUrl} 
                        alt={adminUser.name} 
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-sky-50 dark:bg-sky-950/30">
                        <User className="h-10 w-10 text-indigo-600" />
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleStartEdit}
                  className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 text-[#118EEA] transition active:scale-90"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{adminUser.name}</h3>
                <div className="flex items-center justify-center space-x-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full">Administrator</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3 pt-2">
              <div className="flex items-center space-x-3 p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-xs">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Email Terdaftar</span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{adminUser.email}</span>
                </div>
              </div>

              {adminUser.address && (
                <div className="flex items-center space-x-3 p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl shadow-xs">
                    <QrCode className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Alamat Operasional</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{adminUser.address}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manajemen Database</h4>
                <div className="flex items-center space-x-1.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[8px] font-black px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                  </span>
                  <span>Terhubung & Aman</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={onExportBackup}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 transition duration-150 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded-xl text-indigo-600">
                      <Download className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[11px] font-black text-slate-800 dark:text-white leading-tight">Backup Database JSON</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Simpan Semua Data Ke HP</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition" />
                </button>

                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 transition duration-150 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl text-amber-600">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[11px] font-black text-slate-800 dark:text-white leading-tight">Restore / Impor Data</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Pulihkan Dari File Backup</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition" />
                </button>
                <input 
                  type="file" 
                  ref={fileRef} 
                  onChange={onImportBackup} 
                  accept=".json" 
                  className="hidden" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onLockScreen}
                className="flex items-center justify-center space-x-2 py-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-[11px] font-black uppercase tracking-wider transition active:scale-95"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Kunci PIN</span>
              </button>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center justify-center space-x-2 py-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-[11px] font-black uppercase tracking-wider transition active:scale-95"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </section>
        )}


        {/* SIMULATED DANA DIGITAL WIFI ID CARD */}

        <section className="bg-gradient-to-tr from-slate-900 to-indigo-900 text-white p-4 rounded-3xl relative overflow-hidden shadow-md flex flex-col justify-between h-48 border border-white/10">
          <div className="absolute right-[-20px] top-[-10px] opacity-10">
            <QrCode className="w-40 h-40" />
          </div>
          
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase tracking-widest font-black text-sky-100">WADA - Wifi Arus Dana</span>
              <h3 className="text-lg font-black tracking-tight flex items-center space-x-1">
                <Wifi className="h-5 w-5 text-amber-300 animate-pulse" />
                <span>RT NET DIGITAL</span>
              </h3>
            </div>
            <div className="bg-white/20 p-2 rounded-xl text-xs font-bold border border-white/15 backdrop-blur">
              ID: RT04-WIFI
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[8px] font-bold text-sky-100 uppercase tracking-wider block">Kunci Sandi Router</span>
            <span className="text-sm font-semibold tracking-widest block font-mono">rt04_sinyal_kencang_ok</span>
          </div>

          <div className="flex justify-between items-center text-[10px] text-sky-100 pt-2 border-t border-white/10 font-mono">
            <span>Dikelola: Siskom RT 04</span>
            <span className="font-bold">STATUS: AKTIF</span>
          </div>
        </section>

        {/* TEMA APLIKASI CONFIG (DARK MODE) */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2">
            <Settings className="h-4.5 w-4.5 text-indigo-600" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">Tema Aplikasi</h3>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <span className="block text-xs font-extrabold text-slate-750 dark:text-slate-200">Mode Gelap (Dark Mode)</span>
              <p className="text-[10px] text-slate-400 dark:text-slate-550">Gunakan tema gelap yang nyaman untuk mata Anda.</p>
            </div>
            
            <button
              type="button"
              onClick={onToggleTheme}
              className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                theme === "dark" ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  theme === "dark" ? "translate-x-5.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        {/* NOTIFIKASI PENGINGAT (WEB NOTIFICATION API) */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2">
            <Bell className="h-4.5 w-4.5 text-indigo-600" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white font-sans">Sistem Notifikasi</h3>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5 min-w-0 pr-3 text-left">
              <span className="block text-xs font-extrabold text-slate-750 dark:text-slate-200">Pengingat Harian (Browser)</span>
              <p className="text-[10px] text-slate-400 dark:text-slate-550 leading-relaxed">
                Kirim notifikasi ke browser Anda setiap hari secara otomatis jika ada anggota yang belum bayar bulan ini.
              </p>
            </div>
            
            <button
              type="button"
              onClick={onToggleBrowserReminders}
              className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                browserRemindersEnabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  browserRemindersEnabled ? "translate-x-5.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {browserRemindersEnabled && (
            <div className="pt-2 border-t border-dashed border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest flex items-center space-x-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping mr-1" />
                <span>Pemantau Aktif</span>
              </span>
              <button
                type="button"
                onClick={onSendTestNotification}
                className="bg-sky-50 dark:bg-sky-950/20 text-[#118EEA] hover:bg-sky-100 dark:hover:bg-sky-950/40 text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg border border-sky-100 dark:border-sky-900/30 transition active:scale-95 cursor-pointer font-sans"
              >
                Uji Kirim Notifikasi
              </button>
            </div>
          )}
        </section>

        {/* YEAR SELECTION CONFIG */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2">
            <Calendar className="h-4.5 w-4.5 text-indigo-600" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">Pilih Tahun Siklus</h3>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="year-sel" className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Tahun Buku Laporan</label>
            <select
              id="year-sel"
              value={activeYear}
              onChange={(e) => onChangeYear(e.target.value)}
              className="w-full bg-[#F3F6F9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              {yearsOptions.map(yr => (
                <option key={yr} value={yr} className="dark:bg-slate-905">Tahun Buku {yr}</option>
              ))}
            </select>
          </div>
        </section>

        {/* DEFAULT MONTHLY RATE CONFIG */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2">
            <Coins className="h-4.5 w-4.5 text-amber-500" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">Tarif Iuran Gabungan</h3>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rate-inp" className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">
              Besaran Tarif Standar Bulanan (Rp)
            </label>
            <div className="flex space-x-2">
              <input
                id="rate-inp"
                type="number"
                value={rateInputVal}
                onChange={(e) => onChangeRateInput(e.target.value)}
                placeholder="Misal: 20000"
                className="flex-1 bg-[#F3F6F9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-600 h-[38px] text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={onSaveRate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl text-xs font-extrabold transition h-[38px]"
              >
                Simpan
              </button>
            </div>
            <span className="block text-[9.5px] text-slate-400 dark:text-slate-500 font-medium">
              *Ini adalah tarif default yang digunakan jika pelanggan tidak dikaitkan dengan paket khusus. Tarif saat ini: <strong className="text-slate-650 dark:text-slate-300">{formatRupiah(fallbackRate)}/bulan</strong>.
            </span>
          </div>
        </section>

        {/* BACKUP & RESTORE UTILITIES */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2">
            <Settings className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white font-sans">Cadangkan Dompet Kas</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center pt-1">
            <button
              onClick={onExportBackup}
              className="bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/55 text-indigo-600 dark:text-indigo-400 font-extrabold p-3 rounded-2xl flex flex-col items-center justify-center space-y-1 transition border border-indigo-100 dark:border-indigo-900/50 active:scale-95 cursor-pointer"
            >
              <Download className="h-5 w-5" />
              <span className="text-[10px] uppercase tracking-wider block">Ekspor Cadangan</span>
            </button>
            
            <button
              onClick={() => fileRef.current?.click()}
              className="bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-150 dark:hover:bg-indigo-950/55 text-indigo-700 dark:text-indigo-400 font-extrabold p-3 rounded-2xl flex flex-col items-center justify-center space-y-1 transition border border-indigo-100 dark:border-indigo-900/50 active:scale-95 cursor-pointer"
            >
              <Upload className="h-5 w-5" />
              <span className="text-[10px] uppercase tracking-wider block">Pulihkan Data</span>
            </button>
          </div>

          <input 
            type="file"
            ref={fileRef}
            onChange={onImportBackup}
            accept=".json"
            className="hidden"
          />

          <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-relaxed text-center font-medium">
            Sistem WiFi RT/RW Net ini menyimpan transaksi Anda secara otomatis di memori lokal. Selalu buat file cadangan secara berkala agar aman.
          </p>
        </section>

        {/* HELP & SUPPORT SECTION */}
        {onNavigate && (
          <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
            <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2">
              <Wrench className="h-4.5 w-4.5 text-rose-500" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">Layanan & Komplain</h3>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed text-left">
              Bila terjadi gangguan teknis jaringan, interferensi sinyal, router LOS merah, atau kendala iuran, Anda dapat mengisi form komplain untuk menghubungi teknisi langsung melalui WhatsApp.
            </p>
            <button
              onClick={() => onNavigate("gangguan")}
              className="w-full bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-150/50 dark:border-rose-900/40 rounded-xl py-2.5 text-xs font-extrabold transition active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Wrench className="h-4 w-4 text-rose-500 animate-pulse" />
              <span>FORM PENGADUAN & KOMPLAIN</span>
            </button>
          </section>
        )}

        {/* DANGER DESTRUCTION CONTROLS */}
        <section className="bg-red-50/40 dark:bg-red-950/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-xs space-y-3 text-center">
          <h3 className="text-[10px] font-black uppercase text-red-700 dark:text-red-400 tracking-wider font-sans">Setel Ulang Aplikasi</h3>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={onResetPayments}
              className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 font-extrabold text-xs py-2.5 rounded-xl transition border border-slate-200 dark:border-slate-850 flex items-center justify-center space-x-1.5 cursor-pointer h-[38px]"
            >
              <RotateCcw className="h-4 w-4 text-slate-450" />
              <span>Setel Ulang Pembayaran Belum Lunas</span>
            </button>

            <button
              onClick={onWipeAdmin}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer h-[38px] shadow-sm shadow-amber-100/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Setel Ulang Akun Pengurus WiFi</span>
            </button>

            <button
              onClick={onWipeDatabase}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer h-[38px] shadow-sm shadow-red-100/10"
            >
              <Trash2 className="h-4 w-4" />
              <span>Kosongkan Seluruh Database Kas</span>
            </button>
          </div>
        </section>

      </div>

      {/* DUAL-OPTION LOGOUT CONFIRMATION MODAL OVERLAY */}
      <AnimatePresence>
        {isEditingProfile && (
          <div key="edit-profile-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-xl"
            >
              <div className="flex flex-col items-center mb-6">
                <div className="bg-sky-100 dark:bg-sky-950/40 p-3 rounded-full mb-3">
                  <User className="h-6 w-6 text-[#118EEA]" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Edit Profil Admin</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#F3F6F9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#118EEA]"
                    placeholder="Nama Admin"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Alamat Operasional</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-[#F3F6F9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#118EEA]"
                    placeholder="Alamat Lengkap"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Foto Profil (Opsional)</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      Pilih Foto (Maks 2MB)
                    </button>
                    {editPhotoUrl && (
                      <button
                        onClick={() => setEditPhotoUrl("")}
                        className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl hover:bg-rose-100 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 bg-[#118EEA] hover:bg-[#008CE7] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
        
        {showLogoutConfirm && (
          <div key="logout-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[24px] shadow-2xl p-5 space-y-4 text-left border border-slate-100 dark:border-slate-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl text-rose-600 dark:text-rose-450">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850 dark:text-white tracking-tight">Pilih Metode Keluar / Logout</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">Konfirmasi penutupan pengelolaan kas WiFi</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span className="sr-only">Tutup</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-amber-50/50 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-100/50 dark:border-amber-900/20 text-left space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Sistem Pengaman Kas Aktif</span>
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Tentukan bagaimana Anda ingin mengamankan portal RT NET ini sebelum meninggalkan perangkat.
                </p>
              </div>

              <div className="flex flex-col space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onLockScreen();
                  }}
                  className="w-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-955/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 rounded-xl px-4 py-3 text-xs font-black text-left flex items-start space-x-3 transition active:scale-98 cursor-pointer shadow-xs"
                >
                  <Lock className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-xs">1. Kunci Sesi Sementara</span>
                    <span className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 mt-0.5 leading-normal normal-case font-normal font-sans">
                      Mengunci menu kas. Cukup masukkan 6 digit PIN terdaftar Anda untuk masuk kembali sewaktu-waktu.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onWipeAdmin();
                  }}
                  className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 rounded-xl px-4 py-3 text-xs font-black text-left flex items-start space-x-3 transition active:scale-98 cursor-pointer shadow-xs"
                >
                  <LogOut className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-xs">2. Keluar Akun (Full Logout)</span>
                    <span className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 mt-0.5 leading-normal normal-case font-normal font-sans">
                      Menghapus profil pengurus secara permanen dari browser ini. Anda harus mendaftar ulang nanti.
                    </span>
                  </div>
                </button>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-150 dark:hover:bg-slate-750 text-slate-550 dark:text-slate-300 py-2.5 rounded-xl text-xs font-black text-center uppercase tracking-wider transition active:scale-95 cursor-pointer border border-transparent dark:border-slate-700"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
