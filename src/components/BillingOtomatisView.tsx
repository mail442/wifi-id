import React from "react";
import { 
  ChevronLeft, 
  Settings, 
  FileText, 
  Zap, 
  Clock, 
  ShieldAlert, 
  Users, 
  CheckCircle2, 
  XCircle,
  Play
} from "lucide-react";
import { Member, WifiPackage } from "../types";
import { formatRupiah, MONTH_NAMES } from "../utils";

interface BillingOtomatisViewProps {
  members: Member[];
  packages: WifiPackage[];
  onBack: () => void;
  autoBillingEnabled: boolean;
  onToggleAutoBilling: (enabled: boolean) => void;
  onTriggerMassBilling: () => void;
  activeYear: string;
}

export const BillingOtomatisView: React.FC<BillingOtomatisViewProps> = ({
  members,
  packages,
  onBack,
  autoBillingEnabled,
  onToggleAutoBilling,
  onTriggerMassBilling,
  activeYear
}) => {
  const currentMonthIdx = new Date().getMonth();
  const currentDay = new Date().getDate();

  // Logic: Siap Isolir
  const membersToIsolate = members.filter(m => {
    const isPaid = m.payments?.[currentMonthIdx];
    const dueDate = m.dueDateDay || 10;
    const isLate = currentDay > (dueDate + 3);
    return !isPaid && isLate;
  });

  // Total tagihan terbuat otomatis (all members with no payment for current month)
  const pendingTagihan = members.filter(m => !m.payments?.[currentMonthIdx]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans pb-24">
      {/* Header bar */}
      <div className="bg-slate-900 text-white pt-12 pb-10 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">Billing Otomatis</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              ELDRIME NET • {activeYear}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Toggle Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${autoBillingEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                <Settings className={`h-5 w-5 ${autoBillingEnabled ? 'animate-spin-slow' : ''}`} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Auto-Billing</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sistem Otomatisasi</p>
              </div>
            </div>
            <button 
              onClick={() => onToggleAutoBilling(!autoBillingEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoBillingEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoBillingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Jika diaktifkan, sistem akan memindai pembayaran pelanggan setiap hari dan memperbarui status koneksi secara otomatis berdasarkan tanggal jatuh tempo.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-600 p-4 rounded-[2rem] text-white space-y-1 shadow-lg shadow-indigo-600/20">
            <div className="flex items-center space-x-2 opacity-80">
              <FileText className="h-3 w-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Tagihan Belum Bayar</span>
            </div>
            <p className="text-2xl font-black">{pendingTagihan.length}</p>
            <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest">{MONTH_NAMES[currentMonthIdx]}</p>
          </div>

          <div className="bg-rose-500 p-4 rounded-[2rem] text-white space-y-1 shadow-lg shadow-rose-500/20">
            <div className="flex items-center space-x-2 opacity-80">
              <ShieldAlert className="h-3 w-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Siap Isolir</span>
            </div>
            <p className="text-2xl font-black">{membersToIsolate.length}</p>
            <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest">Terlambat &gt; 3 Hari</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${autoBillingEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {autoBillingEnabled ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Status Sistem: {autoBillingEnabled ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <Zap className={`h-4 w-4 ${autoBillingEnabled ? 'text-indigo-600 animate-pulse' : 'text-slate-300'}`} />
        </div>

        {/* Mass Action */}
        <button 
          onClick={onTriggerMassBilling}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white p-5 rounded-[2.5rem] flex items-center justify-between group transition active:scale-95 shadow-xl"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600 rounded-2xl group-hover:rotate-12 transition">
              <Play className="h-5 w-5 fill-white" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-black uppercase tracking-tighter">Cetak Tagihan Massal</span>
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Eksekusi Seluruh Pelanggan</span>
            </div>
          </div>
          <Zap className="h-5 w-5 text-indigo-400 opacity-50" />
        </button>

        {/* Queue List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Antrean Billing Pelanggan</h4>
            <div className="bg-slate-200 dark:bg-slate-800 h-[1px] flex-1 mx-3"></div>
            <Users className="h-3.5 w-3.5 text-slate-300" />
          </div>

          <div className="space-y-2">
            {members.slice(0, 10).map(member => {
              const pkg = packages.find(p => p.id === member.packageId);
              const isPaid = member.payments?.[currentMonthIdx];
              const dueDate = member.dueDateDay || 10;
              
              return (
                <div key={member.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight">{member.name}</h5>
                    <div className="flex items-center space-x-2">
                      <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        {pkg?.name || 'No Package'}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        Jatuh Tempo: {dueDate} {MONTH_NAMES[currentMonthIdx]}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                      isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {isPaid ? 'Lunas' : 'Belum Bayar'}
                    </div>
                    {member.status === 'TERISOLIR' && (
                      <span className="block text-[7px] font-black text-rose-500 mt-1 uppercase tracking-tighter">Terisolir</span>
                    )}
                  </div>
                </div>
              );
            })}
            {members.length > 10 && (
              <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest pt-2">
                Menampilkan 10 dari {members.length} pelanggan
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
