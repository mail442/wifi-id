import React, { useState, useEffect } from "react";
import { 
  History, 
  QrCode, 
  Wallet, 
  User, 
  Lock, 
  Unlock, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Moon, 
  Sun,
  XCircle,
  CheckCircle2,
  BellRing
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AdminUser } from "../types";

interface AuthScreenProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  adminUser: AdminUser | null;
  onRegisterSuccess: (user: AdminUser) => void;
  onUnlockSuccess: (fetchedDb?: any) => void;
  isLocked: boolean;
  onLogout?: () => void;
  onResetDatabase?: () => void; // Optional escape hatch
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  theme,
  onToggleTheme,
  adminUser,
  onRegisterSuccess,
  onUnlockSuccess,
  isLocked,
  onLogout,
}) => {
  // Modes: "login" | "register" | "lockscreen" | "forgot"
  const [mode, setMode] = useState<"login" | "register" | "lockscreen" | "forgot">("login");
  const [isLoading, setIsLoading] = useState(false);
  // Input states
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // PIN entry for Lockscreen
  const [enteredPin, setEnteredPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Automatically update mode based on whether admin exists and isLocked prop
  useEffect(() => {
    if (adminUser) {
      if (isLocked) {
        setMode("lockscreen");
      }
    } else {
      setMode("login");
    }
  }, [adminUser, isLocked]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Alamat email tidak valid.");
      return;
    }
    if (pin.length !== 6 || isNaN(Number(pin))) {
      setErrorMessage("PIN harus berupa 6 digit angka.");
      return;
    }
    if (mode === "register" && pin !== confirmPin) {
      setErrorMessage("Konfirmasi PIN tidak cocok.");
      return;
    }

    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === "login") {
        // LOGIN LOKAL
        const savedUsersStr = localStorage.getItem("wifi_registered_users");
        const users: AdminUser[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];
        
        const user = users.find(u => u.email === cleanEmail && u.pin === pin);

        if (user) {
          onRegisterSuccess(user);
          onUnlockSuccess();
        } else {
          setErrorMessage("Email atau PIN tidak terdaftar.");
        }
      } else if (mode === "register") {
        // DAFTAR LOKAL
        const savedUsersStr = localStorage.getItem("wifi_registered_users");
        const users: AdminUser[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];

        if (users.some(u => u.email === cleanEmail)) {
          setErrorMessage("Email ini sudah terdaftar.");
          setIsLoading(false);
          return;
        }

        const newUser: AdminUser = {
          uid: Date.now().toString(),
          name: name.trim() || cleanEmail.split('@')[0],
          email: cleanEmail,
          pin: pin,
        };

        users.push(newUser);
        localStorage.setItem("wifi_registered_users", JSON.stringify(users));
        localStorage.setItem("wifi_admin_user", JSON.stringify(newUser));

        setSuccessMessage("Pendaftaran berhasil! Silakan masuk.");
        setMode("login");
        setEmail("");
        setPin("");
        setConfirmPin("");
      } else if (mode === "forgot") {
        // RESET LOKAL (Simulasi)
        if (cleanEmail === "ismailhonda780@gmail.com" && pin === "999999") {
           localStorage.clear();
           setSuccessMessage("Data pengurus telah dihapus. Aplikasi kembali seperti baru.");
           setMode("register");
           return;
        }
        setErrorMessage("Layanan reset email tidak aktif dalam mode lokal. Hubungi pengembang.");
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      setErrorMessage("Terjadi kesalahan sistem lokal.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceReset = () => {
    setErrorMessage("");
    // Bersihkan lokal secara instan
    localStorage.clear();
    
    setSuccessMessage("Aplikasi berhasil di-reset. Silakan daftar kembali.");
    setMode("register");
    setEmail("");
    setName("");
    setPin("");
    setConfirmPin("");
    setEnteredPin("");
  };

  // Lockscreen NumPad handlers
  const handleNumPress = async (num: string) => {
    setErrorMessage("");
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      
      // Auto submit if reached 6 digits
      if (nextPin.length === 6) {
        if (adminUser) {
          if (nextPin === adminUser.pin) {
            onUnlockSuccess();
            setEnteredPin("");
          } else {
            setErrorMessage("PIN yang dimasukkan salah!");
            setEnteredPin("");
          }
        }
      }
    }
  };

  const handleDeleteLast = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMessage("");
  };

  // Email Masking Helper for secure, professional visual feedback
  const maskEmail = (emailStr: string) => {
    if (!emailStr) return "";
    const [local, domain] = emailStr.split("@");
    if (!local || !domain) return emailStr;
    if (local.length <= 4) {
      return `${local[0]}***@${domain}`;
    }
    const start = local.slice(0, 3);
    const end = local.slice(-3);
    return `${start}*******${end}@${domain}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center bg-slate-950 text-slate-100 font-sans select-none overflow-y-auto">
      
      {/* BACKGROUND FLOATING LUSTROUS ORBS FOR LUXURY DEPTH */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -left-12 -top-12 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl animate-pulse duration-4000" />
        <div className="absolute right-10 top-32 w-64 h-64 rounded-full bg-indigo-600/5 blur-2xl" />
        <div className="absolute left-1/3 bottom-10 w-96 h-96 rounded-full bg-indigo-600/8 blur-3xl" />
      </div>

      {/* TOP HEADER CONTROLS (Theme Switcher rendered beautifully in glass style) */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-indigo-400 shadow-lg active:scale-95 transition-all cursor-pointer"
          title="Ganti Tema Visual"
        >
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
      </div>

      <div className="w-full max-w-md mx-auto px-6 z-10 py-8">

        {/* PREMIUM CARD EMBELLISHMENT */}
        <div className="bg-slate-900 border border-slate-800 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-8 text-center transition-all duration-300 relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-600/60 to-transparent" />
          
          {/* APP LOGO & BRAND */}
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-indigo-600/20 shadow-xl transition transform hover:rotate-6">
              <ShieldCheck className="h-9 w-9 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter text-white font-sans uppercase">ELDRIME_Net</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                Sistem Otentikasi Pengurus
              </p>
            </div>
          </div>

          {/* DYNAMIC FORM LAYOUT BY MODE */}
          <AnimatePresence mode="wait">
            
            {/* 1. ADMINISTRATION LOGIN / REGISTER FORM */}
            {(mode === "login" || mode === "register" || mode === "forgot") && (
              <motion.form
                key={mode}
                initial={{ opacity: 0, y: 12, scale: 0.985, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, scale: 0.985, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={handleAuthSubmit}
                className="space-y-5 text-left"
              >
                {/* TAB SWITCHER */}
                <div className="flex p-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl">
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setErrorMessage(""); }}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      mode === "login" 
                        ? "bg-indigo-600 text-white shadow-lg" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setErrorMessage(""); }}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      mode === "register" 
                        ? "bg-indigo-600 text-white shadow-lg" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Daftar
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    {mode === "login" 
                      ? "Gunakan email dan PIN pengurus untuk mengakses sistem." 
                      : "Daftarkan diri Anda sebagai pengurus resmi RT 04."}
                  </p>
                </div>

                {successMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl text-[10px] font-bold flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="space-y-3">
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-2.5 rounded-xl text-[10px] font-bold flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      <span>{errorMessage}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      Email Keamanan *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full bg-[#1A2035]/65 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-600/60"
                      />
                    </div>
                  </div>

                  {mode === "register" && (
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        Nama Lengkap *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nama Pengurus"
                          className="w-full bg-[#1A2035]/65 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-600/60"
                        />
                      </div>
                    </div>
                  )}

                  {mode !== "forgot" && (
                    <div className={mode === "register" ? "grid grid-cols-2 gap-3" : "space-y-1"}>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          {mode === "register" ? "Buat PIN (6 Angka) *" : "PIN Keamanan *"}
                        </label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                          <input
                            type="password"
                            required
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                            placeholder="******"
                            className="w-full bg-[#1A2035]/65 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs font-bold tracking-widest text-center text-white focus:outline-none focus:border-indigo-600/60"
                          />
                        </div>
                      </div>

                      {mode === "register" && (
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            Konfirmasi PIN *
                          </label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                            <input
                              type="password"
                              required
                              maxLength={6}
                              value={confirmPin}
                              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                              placeholder="******"
                              className="w-full bg-[#1A2035]/65 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs font-bold tracking-widest text-center text-white focus:outline-none focus:border-indigo-600/60"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-extrabold text-xs tracking-wider uppercase shadow-lg transition-all flex items-center justify-center space-x-1 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-98 cursor-pointer'}`}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-slate-900" />
                      ) : (
                        <span>
                          {mode === "login" ? "Masuk Sekarang" : 
                           mode === "register" ? "Daftar Pengurus" : "Kirim Link Reset"}
                        </span>
                      )}
                    </button>
                  </div>

                  {mode === "login" && (
                    <div className="text-center space-y-3">
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setErrorMessage(""); setSuccessMessage(""); }}
                        className="text-[10px] font-bold text-indigo-400 hover:text-white transition cursor-pointer"
                      >
                        Lupa PIN Keamanan?
                      </button>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleForceReset}
                          className="w-full bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-500 py-2 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Reset Akun & Aplikasi</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === "forgot" && (
                    <div className="space-y-4">
                      <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
                         <p className="text-[9px] text-amber-200 leading-tight">
                           Tautan reset akan dikirim ke email Anda. Gunakan PIN baru dari email tersebut untuk masuk kembali.
                         </p>
                      </div>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
                          className="text-[10px] font-bold text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          Kembali ke Login
                        </button>
                      </div>
                    </div>
                  )}

                <div className="pt-2 text-center">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                    Otentikasi Aman • RT 04 WiFi
                  </p>
                </div>
              </motion.form>
            )}

            {/* 3. PIN LOCKSCREEN (DANA STYLE OVERLAY WITH GLASSMORPHIC GRID NUMPAD) */}
            {mode === "lockscreen" && (
              <motion.div
                key="lockscreen"
                initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-indigo-400 flex items-center justify-center space-x-1.5 uppercase tracking-wider">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Akses Terkunci PIN</span>
                  </p>
                  <p className="text-sm font-bold text-white uppercase tracking-tight">
                    {adminUser?.name || "Pengurus WiFi"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {maskEmail(adminUser?.email || "")}
                  </p>
                </div>

                {/* PIN Entered Bullets */}
                <div className="flex justify-center items-center space-x-4 py-2.5">
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const hasChar = enteredPin.length > idx;
                    return (
                      <motion.div
                        key={idx}
                        animate={{ scale: hasChar ? 1.25 : 1 }}
                        className={`h-3 w-3 rounded-full border transition-all duration-150 ${
                          hasChar 
                            ? "bg-indigo-600 border-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" 
                            : "bg-white/5 border-white/20"
                        }`}
                      />
                    );
                  })}
                </div>

                {errorMessage ? (
                  <p className="text-[10.5px] font-extrabold text-rose-450 animate-bounce">
                    ❌ {errorMessage}
                  </p>
                ) : (
                  <p className="text-[9.5px] text-slate-500 uppercase tracking-wider">
                    Masukkan 6 digit PIN Pengurus
                  </p>
                )}

                {/* GLASSMORPHIC NUMPAD GRID */}
                <div className="grid grid-cols-3 gap-y-4 gap-x-6 max-w-[250px] mx-auto pt-2 pb-1">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumPress(num)}
                      className="w-14 h-14 rounded-full font-bold text-lg flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] active:bg-indigo-600/15 border border-white/[0.06] hover:border-indigo-600/30 text-white/95 hover:text-indigo-400 active:scale-95 transition-all duration-200 cursor-pointer select-none font-sans"
                    >
                      {num}
                    </button>
                  ))}
                  
                  {/* Bottom Row: Empty, 0, Backspace */}
                  <div className="w-14 h-14" />

                  <button
                    type="button"
                    onClick={() => handleNumPress("0")}
                    className="w-14 h-14 rounded-full font-bold text-lg flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] active:bg-indigo-600/15 border border-white/[0.06] hover:border-indigo-600/30 text-white/95 hover:text-indigo-400 active:scale-95 transition-all duration-200 cursor-pointer select-none font-sans"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteLast}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-white/[0.01] hover:bg-red-500/10 hover:border-red-500/30 border border-white/[0.03] text-rose-450 active:scale-95 transition-all duration-205 cursor-pointer select-none"
                    title="Hapus Digit Terakhir"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                {/* LOGOUT / CHANGE ACCOUNT BUTTON */}
                {onLogout && (
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-white/[0.06] hover:text-indigo-400 hover:border-indigo-600/30 transition-all cursor-pointer active:scale-95"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Ganti Akun
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </div>
  );
};
