import React, { useState } from "react";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Rocket,
  ShieldCheck,
  AlertCircle,
  Wallet,
  FileDown,
  Calendar
} from "lucide-react";
import { motion } from "motion/react";
import { Member, WifiPackage } from "../types";
import { formatRupiah, MONTH_NAMES } from "../utils";
import { jsPDF } from "jspdf";

interface RekapSetoranISPProps {
  members: Member[];
  packages: WifiPackage[];
  totalSaldo: number;
  onBack: () => void;
  onExecute: (totalSetoran: number) => void;
  onTogglePayment?: (memberId: string, monthIndex: number) => void;
  activeYear: string;
}

export const RekapSetoranISP: React.FC<RekapSetoranISPProps> = ({
  members,
  packages,
  totalSaldo,
  onBack,
  onExecute,
  onTogglePayment,
  activeYear
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(activeYear);

  // Years options
  const years = Array.from({ length: 12 }, (_, i) => (2024 + i).toString());

  // Calculations
  const rekapData = members.map(m => {
    const pkg = packages.find(p => p.id === m.packageId);
    const iuran = pkg ? pkg.price : 0;
    
    // Beban Setoran ISP: Prioritas data paket (ispCost), Fallback ke matriks nama paket
    let setoran = pkg?.ispCost || 0;
    
    if (setoran === 0) {
      const pkgNameUpper = (pkg?.name || "").toUpperCase();
      if (pkgNameUpper.includes("HEMAT")) {
        setoran = 80000;
      } else if (pkgNameUpper.includes("STANDAR")) {
        setoran = 120000;
      } else if (pkgNameUpper.includes("TURBO")) {
        setoran = 150000;
      } else {
        setoran = m.setoranIsp || 0;
      }
    }

    // Check payment status for selected month
    const isPaid = m.payments && m.payments[selectedMonth] === true;

    return {
      ...m,
      pkgName: pkg ? pkg.name : "Tanpa Paket",
      iuran,
      setoran,
      isPaid
    };
  });

  const totalIuranMasuk = rekapData.filter(m => m.isPaid).reduce((acc, curr) => acc + curr.iuran, 0);
  const totalWajibSetor = rekapData.filter(m => m.isPaid).reduce((acc, curr) => acc + curr.setoran, 0);
  const profitBersih = totalIuranMasuk - totalWajibSetor;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const monthName = MONTH_NAMES[selectedMonth];
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(33, 41, 54);
    doc.text("LAPORAN REKAP SETORAN ISP", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Periode: ${monthName} ${selectedYear}`, 105, 22, { align: "center" });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 28, 195, 28);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 35, 180, 25, "F");
    
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("TOTAL BEBAN SETOR ISP", 105, 45, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(225, 29, 72);
    doc.text(formatRupiah(totalWajibSetor), 105, 53, { align: "center" });

    // Table Header
    let y = 75;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 8, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text("NO", 20, y + 5);
    doc.text("NAMA PELANGGAN", 35, y + 5);
    doc.text("PAKET", 90, y + 5);
    doc.text("BEBAN ISP", 130, y + 5);
    doc.text("STATUS", 170, y + 5);
    
    y += 12;
    
    // Table Body
    rekapData.forEach((m, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const statusLabel = m.isPaid ? "Lunas" : "Belum Lunas";
      const setoranValue = m.isPaid ? m.setoran : 0;
      
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text((idx + 1).toString(), 20, y);
      doc.text(m.name, 35, y);
      doc.text(m.pkgName, 90, y);
      
      if (m.isPaid) {
        doc.setTextColor(225, 29, 72); // Rose 600
      } else {
        doc.setTextColor(148, 163, 184); // Slate 400
      }
      doc.text(formatRupiah(setoranValue), 130, y);
      
      // Status Color
      if (m.isPaid) {
        doc.setTextColor(5, 150, 105); // Emerald 600
      } else {
        doc.setTextColor(148, 163, 184); // Slate 400
      }
      doc.text(statusLabel, 170, y);
      doc.setTextColor(71, 85, 105);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 2, 195, y + 2);
      y += 8;
    });

    // Table Footer (Total Summary)
    y += 2;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 10, "F");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("TOTAL WAJIB SETOR ISP", 35, y + 6.5);
    doc.setTextColor(225, 29, 72);
    doc.text(formatRupiah(totalWajibSetor), 130, y + 6.5);

    // Footer
    const now = new Date();
    const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const date = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const fullTimestamp = `${time} - ${date}`;

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Dicetak: ${fullTimestamp}`, 15, 285);
    doc.text(`Aplikasi Dana WiFi v2.0`, 195, 285, { align: "right" });

    doc.save(`Rekap_ISP_${monthName}_${selectedYear}.pdf`);
  };

  const handleExecute = () => {
    if (window.confirm(`Konfirmasi eksekusi potong kas sebesar ${formatRupiah(totalWajibSetor)} untuk setoran ISP bulan ini?`)) {
      onExecute(totalWajibSetor);
    }
  };

  const handleSimulateSlamet = () => {
    const slamet = members.find(m => m.name.toLowerCase().includes("slamet"));
    if (slamet && onTogglePayment) {
      onTogglePayment(slamet.id, selectedMonth);
    } else {
      alert("Member 'Slamet' tidak ditemukan atau fungsi update tidak tersedia.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-950">
      {/* Header */}
      <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">Auto-Rekap Setoran ISP</h1>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Periode: {MONTH_NAMES[selectedMonth]} {selectedYear}</p>
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0"
        >
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
            <div className="pl-2">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-xs font-black text-slate-600 dark:text-slate-300 focus:outline-none pr-2 py-1 cursor-pointer border-r border-slate-200 dark:border-slate-700"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {name}
                </option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-600 dark:text-slate-300 focus:outline-none pr-2 py-1 cursor-pointer"
            >
              {years.map(year => (
                <option key={year} value={year} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-black transition-all border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden xs:inline uppercase tracking-widest">Unduh PDF</span>
          </button>

          <button
            onClick={handleExecute}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-600/20 active:scale-95 uppercase tracking-widest"
          >
            <Rocket className="h-4 w-4" />
            <span>Eksekusi</span>
          </button>

          <button
            onClick={handleSimulateSlamet}
            className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 rounded-xl text-xs font-black transition-all border border-indigo-100 dark:border-indigo-800 active:scale-95 uppercase tracking-widest"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden xs:inline">Simulasi Slamet</span>
          </button>
        </motion.div>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-24">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full uppercase">Kas Utama</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Saldo Kas</p>
            <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{formatRupiah(totalSaldo)}</h3>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full uppercase">Pemasukan</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Iuran Member</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatRupiah(totalIuranMasuk)}</h3>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full uppercase">Wajib Setor</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Wajib Setor ISP</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatRupiah(totalWajibSetor)}</h3>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full uppercase">Profit</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estimasi Profit Bersih</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatRupiah(profitBersih)}</h3>
          </motion.div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-4 rounded-2xl flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-tight">Catatan Sistem</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
              Data di bawah ini dihitung berdasarkan <span className="font-bold">beban setoran ISP per pelanggan</span> yang telah disetel. Pastikan semua tagihan pelanggan sudah terdata dengan benar sebelum melakukan eksekusi potong kas.
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nama Pelanggan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Paket</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Beban Setor ISP</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rekapData.map((m, idx) => {
                  return (
                    <motion.tr 
                      key={`${m.id}-${selectedMonth}-${selectedYear}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: idx * 0.03,
                        ease: "easeOut"
                      }}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                            {idx + 1}
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          {m.pkgName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <TrendingDown className={`h-3 w-3 ${m.isPaid ? 'text-rose-500' : 'text-slate-300'}`} />
                          <span className={`text-sm font-black ${m.isPaid ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-600'}`}>
                            {formatRupiah(m.setoran)}
                          </span>
                        </div>
                        {!m.isPaid && (
                          <p className="text-[9px] text-slate-400 italic mt-0.5">Belum masuk hitungan setor</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {m.isPaid ? (
                          <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Lunas</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Belum Lunas</span>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {rekapData.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <div className="inline-flex p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                <ShieldCheck className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum Ada Data Pelanggan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
