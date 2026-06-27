import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  Search, 
  X, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Info,
  DollarSign,
  Send,
  Share2,
  ArrowUpDown,
  ArrowUpWideNarrow,
  ArrowDownWideNarrow,
  Tags,
  Check,
  Smartphone,
  Download,
  ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatRupiah, formatATMDate } from "../utils";

interface TimelineItem {
  id: string;
  type: "payment" | "income" | "expense";
  date: string;
  title: string;
  amount: number;
  badge?: string;
  category?: string;
  note?: string;
  phone?: string;
}

interface RiwayatViewProps {
  timeline: TimelineItem[];
  onBack: () => void;
}

type SortOption = "terbaru" | "terlama" | "nominal_besar" | "nominal_kecil" | "kategori";

export const RiwayatView: React.FC<RiwayatViewProps> = ({
  timeline,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"semua" | "payment" | "income" | "expense">("semua");
  const [sortBy, setSortBy] = useState<SortOption>("terbaru");
  const [selectedReceipt, setSelectedReceipt] = useState<TimelineItem | null>(null);
  const [lastTap, setLastTap] = useState<{ id: string; time: number }>({ id: "", time: 0 });

  const handleDoubleTap = (item: TimelineItem) => {
    const now = Date.now();
    if (lastTap.id === item.id && now - lastTap.time < 300) {
      setSelectedReceipt(item);
      setLastTap({ id: "", time: 0 });
    } else {
      setLastTap({ id: item.id, time: now });
    }
  };

  const filtered = useMemo(() => {
    let result = [...timeline];

    // Filter by type
    if (filterType !== "semua") {
      result = result.filter(item => item.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.badge && t.badge.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.note && t.note.toLowerCase().includes(q))
      );
    }

    // Sort result
    return result.sort((a, b) => {
      switch (sortBy) {
        case "nominal_besar":
          return b.amount - a.amount;
        case "nominal_kecil":
          return a.amount - b.amount;
        case "kategori":
          const catA = a.category || a.badge || "";
          const catB = b.category || b.badge || "";
          return catA.localeCompare(catB);
        case "terlama":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "terbaru":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [timeline, filterType, searchQuery, sortBy]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach(item => {
      if (item.type === "expense") {
        expense += item.amount;
      } else {
        income += item.amount;
      }
    });
    return { income, expense };
  }, [filtered]);

  const handleShareWhatsApp = (item: TimelineItem) => {
    let text = "";
    if (item.type === "payment") {
      const customerName = item.title.replace("Iuran WiFi:", "").trim();
      text = `*RT NET - BUKTI PEMBAYARAN RESMI* 🧾\n` +
             `----------------------------------------\n` +
             `Yth. *${customerName}*\n\n` +
             `Terima kasih, pembayaran iuran bulanan WiFi Anda telah kami terima dan berhasil dicatat dalam sistem kas RT Net.\n\n` +
             `*Rincian Transaksi:*\n` +
             `• *Pelanggan :* ${customerName}\n` +
             `• *Iuran Bulan:* ${item.badge || ""}\n` +
             `• *Waktu Lunas:* ${formatATMDate(item.date)}\n` +
             `• *Jumlah :* ${formatRupiah(item.amount)}\n` +
             `• *Status :* LUNAS (Verified) ✅\n` +
             (item.note ? `• *Keterangan :* "${item.note}"\n` : "") +
             `----------------------------------------\n` +
             `_Simpan resi elektrik ini sebagai bukti pembayaran resmi._\n` +
             `_Sistem Aplikasi Pengurus RT Net WiFi_ 🙏🏼`;
    } else if (item.type === "income") {
      text = `*RT NET - BUKTI PEMASUKAN KAS* 📈\n` +
             `----------------------------------------\n` +
             `*Detail Transaksi:*\n` +
             `• *Nama Penerimaan:* ${item.title}\n` +
             `• *Waktu Buku :* ${formatATMDate(item.date)}\n` +
             `• *Nilai Transaksi:* ${formatRupiah(item.amount)}\n` +
             `• *Kategori Kas :* ${item.badge || "Pemasukan Lain"}\n` +
             `• *Verifikasi Status:* SELESAI ✅\n` +
             (item.note ? `• *Keterangan :* "${item.note}"\n` : "") +
             `----------------------------------------\n` +
             `_Sistem Keuangan RT Net WiFi_`;
    } else {
      text = `*RT NET - BUKTI PENGELUARAN KAS* 📉\n` +
             `----------------------------------------\n` +
             `*Detail Transaksi:*\n` +
             `• *Kegiatan/Operasional:* ${item.title}\n` +
             `• *Waktu Pengeluaran:* ${formatATMDate(item.date)}\n` +
             `• *Anggaran Keluar :* -${formatRupiah(item.amount)}\n` +
             `• *Kategori Alokasi :* ${item.category || "Umum"}\n` +
             `• *Status Pencatatan :* FINAL ✅\n` +
             (item.note ? `• *Keterangan :* "${item.note}"\n` : "") +
             `----------------------------------------\n` +
             `_Sistem Keuangan RT Net WiFi_`;
    }

    const encodedText = encodeURIComponent(text);
    let phoneNum = item.phone || "";
    if (phoneNum) {
      phoneNum = phoneNum.replace(/\D/g, "");
      if (phoneNum.startsWith("0")) {
        phoneNum = "62" + phoneNum.slice(1);
      }
    }

    const url = phoneNum 
      ? `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F5F9FC] dark:bg-slate-950 font-sans">
      {/* Blue App Header */}
      <div className="bg-slate-900 text-white pt-12 pb-10 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting blobs */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">Riwayat Buku Kas</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              {timeline.length} Transaksi Tercatat
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 max-w-md mx-auto">
        {/* Search Input for Transactions */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi (nama, iuran, kategori)..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800 dark:text-slate-100 h-[38px] shadow-xs"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Filters Pills */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setFilterType("semua")}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black shrink-0 transition-all ${
              filterType === "semua"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
            }`}
          >
            Semua ({timeline.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("payment")}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black shrink-0 transition-all flex items-center space-x-1 ${
              filterType === "payment"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-500 hover:text-emerald-700 border border-slate-100"
            }`}
          >
            <span>Iuran WiFi</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans font-extrabold ${
              filterType === "payment" ? "bg-emerald-750 text-emerald-100" : "bg-emerald-50 text-emerald-700"
            }`}>
              {timeline.filter(t => t.type === "payment").length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("income")}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black shrink-0 transition-all flex items-center space-x-1 ${
              filterType === "income"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-white text-slate-500 hover:text-sky-700 border border-slate-100"
            }`}
          >
            <span>Pemasukan Lain</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans font-extrabold ${
              filterType === "income" ? "bg-sky-750 text-sky-100" : "bg-sky-50 text-sky-700"
            }`}>
              {timeline.filter(t => t.type === "income").length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("expense")}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black shrink-0 transition-all flex items-center space-x-1 ${
              filterType === "expense"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-slate-500 hover:text-rose-750 border border-slate-100"
            }`}
          >
            <span>Pengeluaran</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans font-extrabold ${
              filterType === "expense" ? "bg-rose-750 text-rose-100" : "bg-rose-50 text-rose-700"
            }`}>
              {timeline.filter(t => t.type === "expense").length}
            </span>
          </button>
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          <div className="flex items-center space-x-1 shrink-0 bg-slate-200/50 p-1 rounded-xl">
            <button
              onClick={() => setSortBy("terbaru")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                sortBy === "terbaru" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Terbaru
            </button>
            <button
              onClick={() => setSortBy("nominal_besar")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 ${
                sortBy === "nominal_besar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              <ArrowDownWideNarrow className="h-3 w-3" />
              <span>Nominal ↓</span>
            </button>
            <button
              onClick={() => setSortBy("kategori")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 ${
                sortBy === "kategori" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              <Tags className="h-3 w-3" />
              <span>Kategori</span>
            </button>
          </div>
          <button
            onClick={() => setSortBy(sortBy === "terlama" ? "terbaru" : "terlama")}
            className={`p-2 rounded-xl border transition-all ${
              sortBy === "terlama" ? "bg-sky-50 border-sky-200 text-sky-600" : "bg-white border-slate-100 text-slate-400"
            }`}
            title="Urutkan Waktu"
          >
            <Calendar className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setSortBy(sortBy === "nominal_kecil" ? "nominal_besar" : "nominal_kecil")}
            className={`p-2 rounded-xl border transition-all ${
              sortBy === "nominal_kecil" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white border-slate-100 text-slate-400"
            }`}
            title="Urutkan Nominal"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Filter Summary Mini Card */}
        <div className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-xs flex items-center justify-between text-xs font-sans">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Pemasukan</span>
            <span className="block font-black text-emerald-600 text-sm">{formatRupiah(totals.income)}</span>
          </div>
          <div className="h-6 w-px bg-slate-100" />
          <div className="space-y-0.5 text-right">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Pengeluaran</span>
            <span className="block font-black text-rose-600 text-sm">{formatRupiah(totals.expense)}</span>
          </div>
        </div>

        {/* Timeline item list */}
        <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 space-y-1">
              <Info className="h-6 w-6 mx-auto text-slate-300" />
              <p className="text-xs font-bold uppercase">Tidak ada transaksi ditemukan</p>
              <p className="text-[10px]">Coba ubah filter pencarian Anda atau isi iuran baru.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleDoubleTap(item)}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-xs flex flex-col space-y-2 hover:border-indigo-600/30 transition-all active:scale-[0.98] cursor-pointer select-none relative group"
              >
                {/* Tooltip hint on hover (desktop only) */}
                <div className="absolute -top-2 right-4 bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                  Ketuk 2x untuk Resi
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      item.badge === "LOG"
                        ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                        : item.type === "payment" 
                        ? "bg-emerald-50 text-emerald-600" 
                        : item.type === "income" 
                        ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" 
                        : "bg-rose-50 text-rose-500"
                    }`}>
                      {item.badge === "LOG" && <ClipboardList className="h-4.5 w-4.5" />}
                      {item.type === "payment" && item.badge !== "LOG" && <Calendar className="h-4.5 w-4.5" />}
                      {item.type === "income" && <TrendingUp className="h-4.5 w-4.5" />}
                      {item.type === "expense" && <TrendingDown className="h-4.5 w-4.5" />}
                    </div>

                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-800 block truncate leading-snug">
                        {item.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5 font-mono text-[9px] font-bold text-slate-450">
                        <span>{item.date}</span>
                        {item.badge && (
                          <>
                            <span>•</span>
                            <span className="bg-slate-100 px-1 py-0.2 rounded uppercase text-[7.5px] font-black text-slate-500">
                              {item.badge}
                            </span>
                          </>
                        )}
                        {item.category && (
                          <>
                            <span>•</span>
                            <span className="bg-rose-50 text-rose-700 px-1 py-0.2 rounded uppercase text-[7.5px] font-black">
                              {item.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`text-sm font-black shrink-0 ${
                    item.amount === 0 
                      ? "text-slate-400"
                      : item.type === "expense" 
                      ? "text-rose-600" 
                      : "text-emerald-600"
                  }`}>
                    {item.amount === 0 ? "INFO" : (item.type === "expense" ? "-" : "+")} {item.amount !== 0 && formatRupiah(item.amount)}
                  </div>
                </div>

                {/* Optional note description */}
                {item.note && (
                  <div className="bg-slate-50 p-2 rounded-xl text-[10px] text-slate-500 border border-slate-100 flex items-start space-x-1.5 leading-snug">
                    <Info className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
                    <span>Catatan: <strong className="text-slate-700">"{item.note}"</strong></span>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Modern DANA-Style Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm relative"
            >
              {/* Receipt Body */}
              <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Header Section */}
                <div className="bg-slate-900 p-6 text-white text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-indigo-600 p-3 rounded-full shadow-lg shadow-indigo-500/20">
                      <Check className="h-10 w-10 text-white stroke-[4]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter leading-none">Transaksi Berhasil</h3>
                    <p className="text-[10px] font-bold text-white/70 mt-1 uppercase tracking-widest">Detail Bukti Pembayaran</p>
                  </div>
                </div>

                {/* Receipt Main Info */}
                <div className="p-6 space-y-6">
                  {/* Amount Section */}
                  <div className="text-center border-b border-slate-100 pb-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Transaksi</span>
                    <h2 className="text-3xl font-black text-slate-850 mt-1">{formatRupiah(selectedReceipt.amount)}</h2>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Transaksi</span>
                      <span className="text-[11px] font-black text-slate-800 text-right w-2/3 uppercase">{selectedReceipt.title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metode</span>
                      <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        Saldo Kas WiFi
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu</span>
                      <span className="text-[11px] font-medium text-slate-800 uppercase font-mono tracking-tighter">
                        {formatATMDate(selectedReceipt.date)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor Resi</span>
                      <span className="text-[11px] font-black text-slate-600 font-mono">RTN-{selectedReceipt.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-600 uppercase">
                        {selectedReceipt.badge || selectedReceipt.category || "LAIN-LAIN"}
                      </span>
                    </div>
                  </div>

                  {/* Cut-off Line Visual Effect */}
                  <div className="relative h-4 my-2">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-slate-100" />
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F5F9FC] rounded-full shadow-inner" />
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F5F9FC] rounded-full shadow-inner" />
                  </div>

                  {/* Closing Note */}
                  <div className="text-center space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                      Terima kasih telah berkontribusi menjaga kelancaran koneksi internet warga.
                    </p>
                    <p className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                      Powered by Sistem Kas RT Net WiFi
                    </p>
                  </div>
                </div>

                {/* Receipt Footer Actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col space-y-3">
                  <button
                    onClick={() => handleShareWhatsApp(selectedReceipt)}
                    className="w-full bg-[#11C92C] hover:bg-[#0EB024] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Bagikan Resi ke WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="w-full bg-white border border-slate-200 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition active:scale-95"
                  >
                    Tutup Bukti
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
