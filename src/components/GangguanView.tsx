import React, { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeft, 
  Wrench, 
  MessageSquare, 
  AlertTriangle, 
  Phone, 
  Send, 
  User, 
  WifiOff, 
  Activity, 
  Clock, 
  Sliders, 
  HelpCircle,
  FileText
} from "lucide-react";
import { motion } from "motion/react";
import { Member, WifiPackage } from "../types";
import { formatRupiah } from "../utils";

interface GangguanViewProps {
  members: Member[];
  packages: WifiPackage[];
  fallbackRate: number;
  onBack: () => void;
}

export const GangguanView: React.FC<GangguanViewProps> = ({
  members,
  packages,
  fallbackRate,
  onBack
}) => {
  // Technician info with LocalStorage persistence
  const [techName, setTechName] = useState<string>(() => {
    return localStorage.getItem("wifi_tech_name") || "Mas Budi (Teknisi RT Net)";
  });
  const [techPhone, setTechPhone] = useState<string>(() => {
    return localStorage.getItem("wifi_tech_phone") || "081234567890";
  });
  const [isEditingTech, setIsEditingTech] = useState<boolean>(false);

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [reporterName, setReporterName] = useState<string>("");
  const [reporterPhone, setReporterPhone] = useState<string>("");
  const [category, setCategory] = useState<string>("Indikator LOS Merah (Kabel Putus)");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [description, setDescription] = useState<string>("");

  // Persist technician info when saved
  const handleSaveTech = () => {
    localStorage.setItem("wifi_tech_name", techName);
    localStorage.setItem("wifi_tech_phone", techPhone);
    setIsEditingTech(false);
  };

  // Sync selected member to fill details
  useEffect(() => {
    if (selectedMemberId && selectedMemberId !== "custom") {
      const found = members.find(m => m.id === selectedMemberId);
      if (found) {
        setReporterName(found.name);
        setReporterPhone(found.phone || "");
      }
    } else if (selectedMemberId === "custom") {
      setReporterName("");
      setReporterPhone("");
    }
  }, [selectedMemberId, members]);

  // Get active package speed/price for report meta
  const selectedMemberPackageText = useMemo(() => {
    if (!selectedMemberId || selectedMemberId === "custom") return "Kustom / Umum";
    const found = members.find(m => m.id === selectedMemberId);
    if (!found) return "Tarif Standar";
    const pkg = packages.find(p => p.id === found.packageId);
    return pkg ? `${pkg.name} (${pkg.speed}) - ${formatRupiah(pkg.price)}` : `Standar (${formatRupiah(fallbackRate)})`;
  }, [selectedMemberId, members, packages, fallbackRate]);

  // Format WhatsApp Message Text
  const messageText = useMemo(() => {
    const formattedPhone = techPhone.replace(/\D/g, "");
    
    // Severity indicator emoji
    const severityEmoji = severity === "HIGH" ? "🔴 TINGGI (Urgent)" : severity === "MEDIUM" ? "🟡 SEDANG" : "🟢 RENDAH";
    const timeString = new Date().toLocaleString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    });

    const reportNameClean = reporterName || "Anonim / Warga";
    const reportPhoneClean = reporterPhone || "Tidak dilampirkan";

    return (
      `🔧 *FORMULIR LAPORAN GANGGUAN INTERNET RT NET* 🔧\n\n` +
      `Kepada Yth. Teknisi Pintar (*${techName}*)\n\n` +
      `*DATA PELAPOR/PELANGGAN:*\n` +
      `- Nama Pelapor : *${reportNameClean}*\n` +
      `- No. Telp/WA  : ${reportPhoneClean}\n` +
      `- Paket WiFi   : ${selectedMemberPackageText}\n\n` +
      `*DETIL KELUHAN/GANGGUAN:*\n` +
      `- Kategori     : *${category}*\n` +
      `- Prioritas    : ${severityEmoji}\n` +
      `- Deskripsi    : "${description || "Tidak ada rincian tambahan."}"\n\n` +
      `*WAKTU PENGADUAN:*\n` +
      `- Waktu Cetak  : ${timeString}\n\n` +
      `Mohon tanggapan dan bantuannya di lokasi kediaman pelapor. Terima kasih banyak atas kerjasamanya! 🙏✨`
    );
  }, [techName, techPhone, reporterName, reporterPhone, selectedMemberPackageText, category, severity, description]);

  // WhatsApp click link
  const whatsappUrl = useMemo(() => {
    let cleanPhone = techPhone.replace(/\D/g, "");
    // Convert 08... to 628... Indonesian format
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.substring(1);
    }
    // Default safe fallback if invalid length
    if (!cleanPhone) cleanPhone = "6281234567890";
    
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`;
  }, [techPhone, messageText]);

  return (
    <div className="min-h-screen bg-[#F5F9FC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 font-sans">
      {/* App Bar Page Header */}
      <div className="bg-slate-900 text-white pt-12 pb-10 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting blobs */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">Layanan Gangguan</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              Komplain & Hubungi Teknisi
            </p>
          </div>
        </div>
        <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700 text-[10px] font-black uppercase tracking-wider relative z-10">
          RT NET TECH
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
        {/* SECTION 1: TECHNICIAN SETTINGS (Persistent & Configurable) */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-2 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Wrench className="h-4.5 w-4.5 text-indigo-600" />
              <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Profil Kontak Teknisi WiFi
              </h3>
            </div>
            <button
              onClick={() => {
                if (isEditingTech) {
                  handleSaveTech();
                } else {
                  setIsEditingTech(true);
                }
              }}
              className="text-[10px] font-black uppercase text-indigo-600 hover:underline"
            >
              {isEditingTech ? "Terapkan" : "Ubah Kontak"}
            </button>
          </div>

          {isEditingTech ? (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 dark:text-slate-505 uppercase">
                  Nama Teknisi Mandiri
                </label>
                <input
                  type="text"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  className="w-full bg-[#F3F6F9] dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA] text-slate-800 dark:text-slate-100"
                  placeholder="Contoh: Budi Santoso (Teknisi RT Net)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 dark:text-slate-505 uppercase">
                  No HP/WhatsApp Teknisi (Misal: 081234567890)
                </label>
                <input
                  type="text"
                  value={techPhone}
                  onChange={(e) => setTechPhone(e.target.value)}
                  className="w-full bg-[#F3F6F9] dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA] text-slate-800 dark:text-slate-100"
                  placeholder="081234567890"
                />
              </div>
              
              <button
                type="button"
                onClick={handleSaveTech}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-extrabold transition cursor-pointer"
              >
                Simpan Kontak Baru
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-slate-850 dark:text-slate-150">
                  {techName}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center space-x-1">
                  <Phone className="h-3 w-3 text-indigo-600 shrink-0" />
                  <span>WhatsApp: {techPhone}</span>
                </p>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Ready / Aktif"></div>
            </div>
          )}
        </section>

        {/* SECTION 2: ADUAN GANGGUAN FORM */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2">
            <Activity className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
            <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Buat Formulir Keluhan Pelanggan
            </h3>
          </div>

          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            {/* Choose Member list */}
            <div className="space-y-1">
              <label htmlFor="comp-member" className="block text-[8.5px] font-black text-slate-400 uppercase">
                Pilih Member Pelapor *
              </label>
              <select
                id="comp-member"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-[#F3F6F9] dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA] text-slate-800 dark:text-slate-150"
              >
                <option value="">-- Pilih Anggota / Rumah Terdaftar --</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.phone ? `(${m.phone})` : ""}
                  </option>
                ))}
                <option value="custom">✍️ Tulis Kustom (Anggota Baru/Sewa Khusus)</option>
              </select>
            </div>

            {/* Custom inputs if not selected, or fallback selection */}
            {(!selectedMemberId || selectedMemberId === "custom") && (
              <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                <div className="space-y-1">
                  <label htmlFor="comp-name" className="block text-[8.5px] font-black text-slate-400 uppercase">
                    Nama Kustom *
                  </label>
                  <input
                    id="comp-name"
                    type="text"
                    required
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Contoh: Pak RT"
                    className="w-full bg-[#F3F6F9] dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="comp-phone" className="block text-[8.5px] font-black text-slate-400 uppercase">
                    No. WA Pelapor *
                  </label>
                  <input
                    id="comp-phone"
                    type="text"
                    required
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="08..."
                    className="w-full bg-[#F3F6F9] dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Category selection */}
            <div className="space-y-1">
              <label htmlFor="comp-cat" className="block text-[8.5px] font-black text-slate-400 uppercase">
                Jenis Masalah / Gangguan *
              </label>
              <select
                id="comp-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F3F6F9] dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA] text-slate-800 dark:text-slate-150"
              >
                <option value="Indikator LOS Merah (Kabel Putus)">🔴 Indikator LOS Merah (Kabel Putus/Terganggu Fisik)</option>
                <option value="Koneksi Lambat / Lemot (LOLA)">🟡 Koneksi Lambat / Lemot (LOLA)</option>
                <option value="Sinyal Sering Hilang / Putus-putus">⚪ Sinyal Sering Hilang / Putus-putus</option>
                <option value="Router Mati Total / Tidak Menyala">🔌 Router Mati Total / Tidak Menyala</option>
                <option value="Instalasi Ulang / Kabel Baru">🟢 Permintaan Instalasi Ulang / Pemindahan Kabel</option>
                <option value="Kendala Pembayaran / Iuran Kas">💵 Kendala Rekonsiliasi Iuran atau Salah Input Kas</option>
                <option value="Keluhan Lain (Kelebihan Beban)">⚙️ Masalah Lainnya (Isi Rincian di Bawah)</option>
              </select>
            </div>

            {/* Prioritas (Severity) Button slider */}
            <div className="space-y-1">
              <label className="block text-[8.5px] font-black text-slate-400 uppercase">
                Tingkat Keparahan / Urgensi
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["LOW", "MEDIUM", "HIGH"] as const).map(lev => (
                  <button
                    key={lev}
                    type="button"
                    onClick={() => setSeverity(lev)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition border cursor-pointer active:scale-95 ${
                      severity === lev
                        ? lev === "HIGH"
                          ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 font-black"
                          : lev === "MEDIUM"
                          ? "bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/60 font-black"
                          : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-150/45 dark:border-emerald-900/60 font-black"
                        : "bg-slate-50 dark:bg-slate-850/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {lev === "HIGH" ? "🔴 Tinggi" : lev === "MEDIUM" ? "🟡 Sedang" : "🟢 Rendah"}
                  </button>
                ))}
              </div>
            </div>

            {/* Description textarea */}
            <div className="space-y-1">
              <label htmlFor="comp-desc" className="block text-[8.5px] font-black text-slate-400 uppercase">
                Deskripsi Kendala (Rincian Lokasi/Kronologi)
              </label>
              <textarea
                id="comp-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Sejak tadi malam pukul 22.00, lampu router berkedip merah kedip-kedip, internet tidak tersambung di lantai 2..."
                className="w-full bg-[#F3F6F9] dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-550 resize-none"
              />
            </div>
          </form>
        </section>

        {/* SECTION 3: LIVE MESSAGE PREVIEW */}
        <section className="bg-slate-900 text-slate-300 p-4 rounded-2xl border border-slate-855 shadow-md space-y-2.5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
              Live Preview Pesan WhatsApp ke Teknisi
            </span>
          </div>

          <div className="bg-slate-850 dark:bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono leading-relaxed max-h-[180px] overflow-y-auto whitespace-pre-wrap select-text text-emerald-300">
            {messageText}
          </div>

          <div className="flex items-center space-x-1.5 text-[8.5px] text-slate-400">
            <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span>Pesan akan secara otomatis tersalin & terkirim ke WhatsApp teknisi.</span>
          </div>
        </section>

        {/* COMPLAIN EXECUTE ACTION BUTTON */}
        <div className="pt-2">
          <button
            onClick={() => window.open(whatsappUrl, "_blank")}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 dark:shadow-none hover:shadow-indigo-200 transition-all cursor-pointer active:scale-95"
          >
            <Send className="h-4.5 w-4.5 animate-pulse" />
            <span>KIRIM LAPORAN KE WHATSAPP TEKNISI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
