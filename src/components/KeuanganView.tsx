import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar as CalendarIcon, 
  ArrowUpRight, 
  Coins,
  Tag
} from "lucide-react";
import { IncomeRecord, ExpenseRecord, ExpenseCategory } from "../types";
import { formatRupiah } from "../utils";

interface KeuanganViewProps {
  activeYear: string;
  customIncomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  autoRevenue: number; // Member payments
  onBack: () => void;
  onAddIncome: (description: string, amount: number, date: string) => void;
  onDeleteIncome: (incomeId: string) => void;
  onAddExpense: (description: string, amount: number, date: string, category: ExpenseCategory) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const KeuanganView: React.FC<KeuanganViewProps> = ({
  activeYear,
  customIncomes,
  expenses,
  autoRevenue,
  onBack,
  onAddIncome,
  onDeleteIncome,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [subTab, setSubTab] = useState<"pemasukan" | "pengeluaran">("pemasukan");

  // Custom additional incomes form states
  const [incDesc, setIncDesc] = useState("");
  const [incAmount, setIncAmount] = useState("");
  const [incDate, setIncDate] = useState(new Date().toISOString().split('T')[0]);

  // Expenses form states
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>("OPERASIONAL");

  // Financial calculations
  const totalCustomIncome = customIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncomeCombined = autoRevenue + totalCustomIncome;
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const unspentKas = totalIncomeCombined - totalExpense;

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDesc.trim() || !incAmount) return;
    const amountNum = parseInt(incAmount) || 0;
    onAddIncome(incDesc.trim(), amountNum, incDate);
    setIncDesc("");
    setIncAmount("");
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || !expAmount) return;
    const amountNum = parseInt(expAmount) || 0;
    onAddExpense(expDesc.trim(), amountNum, expDate, expCategory);
    setExpDesc("");
    setExpAmount("");
  };

  return (
    <div className="min-h-screen bg-[#F5F9FC] font-sans">
      {/* Blue Header bar */}
      <div className="bg-slate-900 text-white pt-12 pb-10 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting blobs */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">Buku Arus Kas WiFi</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              Realisasi Anggaran Tahun {activeYear}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Ledger Overview Net Cards */}
        <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">SISA SALDO KAS WIFI</span>
            <span className={`text-xl font-black font-sans ${unspentKas >= 0 ? "text-slate-800" : "text-rose-600 animate-pulse"}`}>
              {formatRupiah(unspentKas)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100 text-[11px] font-semibold">
            <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-50/80">
              <span className="block text-[9px] text-emerald-600 font-bold uppercase mb-0.5">TOTAL MASUK (+):</span>
              <span className="text-emerald-700 font-mono font-bold leading-tight block">
                {formatRupiah(totalIncomeCombined)}
              </span>
              <span className="text-[8px] text-slate-450 block font-normal leading-tight mt-0.5">
                (Member: +{formatRupiah(autoRevenue)})
              </span>
            </div>

            <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-55/80">
              <span className="block text-[9px] text-rose-500 font-bold uppercase mb-0.5">TOTAL KELUAR (-):</span>
              <span className="text-rose-600 font-mono font-bold leading-tight block">
                {formatRupiah(totalExpense)}
              </span>
              <span className="text-[8px] text-slate-450 block font-normal leading-tight mt-0.5">
                (Sewa ISP, Kabel, dll)
              </span>
            </div>
          </div>
        </section>

        {/* Form sub-toggling tab bar */}
        <div className="bg-slate-200/60 p-1 rounded-xl flex">
          <button
            onClick={() => setSubTab("pemasukan")}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
              subTab === "pemasukan" 
                ? "bg-white text-indigo-600 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pemasukan Tambahan
          </button>
          <button
            onClick={() => setSubTab("pengeluaran")}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
              subTab === "pengeluaran" 
                ? "bg-white text-rose-600 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pengeluaran Rutin
          </button>
        </div>

        {/* Subtab Pemasukan Panel */}
        {subTab === "pemasukan" && (
          <div className="space-y-4">
            {/* Income Add Form */}
            <form onSubmit={handleIncomeSubmit} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-50 pb-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                  Catat Kas Masuk Tambahan
                </h3>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase">Deskripsi Pemasukan</label>
                <input
                  type="text"
                  required
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  placeholder="Contoh: Dana Iuran Alat Baru, Donasi Kas"
                  className="w-full bg-[#F3F6F9] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={incAmount}
                    onChange={(e) => setIncAmount(e.target.value)}
                    placeholder="Nilai Rupiah"
                    className="w-full bg-[#F3F6F9] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA] h-[38px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase">Tanggal Catat</label>
                  <input
                    type="date"
                    required
                    value={incDate}
                    onChange={(e) => setIncDate(e.target.value)}
                    className="w-full bg-[#F3F6F9] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA] h-[38px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-extrabold transition mt-2 flex items-center justify-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Simpan Pemasukan</span>
              </button>
            </form>

            {/* Custom Incomes list */}
            <section className="space-y-2">
              <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
                📊 History Pemasukan Sebelah Member
              </span>

              {customIncomes.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-400">
                  <p className="text-xs font-bold">Belum ada pemasukan tambahan</p>
                  <p className="text-[10px] mt-0.5">Semua pendapatan murni berasal dari iuran bulanan pelanggan.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {customIncomes.map(inc => (
                    <div key={inc.id} className="bg-white p-3 rounded-2xl border border-slate-50 flex items-center justify-between shadow-xs">
                      <div className="min-w-0">
                        <span className="text-[9px] font-semibold text-slate-400 block font-mono">{inc.date}</span>
                        <span className="text-xs font-extrabold text-slate-800 truncate block">{inc.description}</span>
                      </div>
                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
                          + {formatRupiah(inc.amount)}
                        </span>
                        <button
                          onClick={() => onDeleteIncome(inc.id)}
                          className="p-1 hover:bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Subtab Pengeluaran Panel */}
        {subTab === "pengeluaran" && (
          <div className="space-y-4">
            {/* Expense Add Form */}
            <form onSubmit={handleExpenseSubmit} className="bg-white p-4 rounded-2xl border border-[#FCE3E6] shadow-xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-50 pb-2">
                <TrendingDown className="h-5 w-5 text-rose-500 animate-bounce" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                  Catat Pengeluaran Operasional
                </h3>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase">Deskripsi Operasional</label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Contoh: Pembayaran Bulanan ISP Indihome"
                  className="w-full bg-[#F3F6F9] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="Nilai Rupiah"
                    className="w-full bg-[#F3F6F9] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 h-[38px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase">Kategori</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-[#F3F6F9] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 h-[38px]"
                  >
                    <option value="OPERASIONAL">OPERASIONAL</option>
                    <option value="SETORAN_ISP">SETORAN ISP</option>
                    <option value="PERBAIKAN">PERBAIKAN</option>
                    <option value="LAIN_LAIN">LAIN-LAIN</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase">Tanggal Catat</label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full bg-[#F3F6F9] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 h-[38px]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-extrabold transition mt-2 flex items-center justify-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Simpan Pengeluaran</span>
              </button>
            </form>

            {/* Expenses lists */}
            <section className="space-y-2">
              <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
                📊 History Pengeluaran Operasional
              </span>

              {expenses.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-400">
                  <p className="text-xs font-bold">Tidak ada pengeluaran operasional</p>
                  <p className="text-[10px] mt-0.5">Sangat rapi! Belum ada kas keluar yang dilaporkan.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {expenses.map(exp => (
                    <div key={exp.id} className="bg-white p-3.5 rounded-2xl border border-slate-50 flex flex-col space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 font-mono">
                            <span className="text-[9px] font-semibold text-slate-400">{exp.date}</span>
                            <span className="text-[7.5px] font-black uppercase bg-red-50 text-red-600 px-1.5 py-0.2 rounded">
                              {exp.category}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-slate-800 truncate block mt-0.5">{exp.description}</span>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl">
                            - {formatRupiah(exp.amount)}
                          </span>
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 hover:bg-slate-50 text-slate-400 hover:text-[#d33] rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
