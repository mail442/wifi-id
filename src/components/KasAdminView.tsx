import React from "react";
import { 
  ChevronLeft, 
  Wallet, 
  TrendingUp, 
  Info,
  DollarSign,
  Briefcase
} from "lucide-react";
import { Member, WifiPackage } from "../types";
import { formatRupiah } from "../utils";

interface KasAdminViewProps {
  members: Member[];
  packages: WifiPackage[];
  onBack: () => void;
  activeYear: string;
}

export const KasAdminView: React.FC<KasAdminViewProps> = ({
  members,
  packages,
  onBack,
  activeYear
}) => {
  // Hitung detail Kas per Pelanggan
  const kasDetails = members.map(member => {
    const pkg = packages.find(p => p.id === member.packageId);
    const totalIuran = pkg ? pkg.price : 0;
    const setoranIsp = pkg ? (pkg.ispCost || 0) : 0;
    const kasBersih = totalIuran - setoranIsp;

    return {
      id: member.id,
      nama: member.name,
      paket: pkg ? `${pkg.name} (${pkg.speed})` : "N/A",
      totalIuran,
      setoranIsp,
      kasBersih
    };
  });

  // Hitung Ringkasan Total
  const totalPotensiIuran = kasDetails.reduce((acc, curr) => acc + curr.totalIuran, 0);
  const totalEstimasiSetoran = kasDetails.reduce((acc, curr) => acc + curr.setoranIsp, 0);
  const totalKasBersihAdmin = kasDetails.reduce((acc, curr) => acc + curr.kasBersih, 0);

  return (
    <div className="min-h-screen bg-[#F5F9FC] dark:bg-slate-950 font-sans">
      {/* Header bar */}
      <div className="bg-slate-900 text-white pt-12 pb-10 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting blobs */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">Kas Admin ELDRIME_Net</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              Analisis Keuntungan Bersih • {activeYear}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Ringkasan Dashboard Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
          <div className="absolute right-[-20px] top-[-20px] opacity-10">
            <Briefcase className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                <Wallet className="h-5 w-5 text-indigo-200" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Total Kas Bersih Admin</span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-3xl font-black tracking-tighter">
                {formatRupiah(totalKasBersihAdmin)}
              </h3>
              <p className="text-[10px] text-indigo-300/80 font-bold uppercase tracking-wider">Potensi per Bulan</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-300/60">Total Iuran</span>
                <p className="text-xs font-black">{formatRupiah(totalPotensiIuran)}</p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[8px] font-black uppercase tracking-widest text-rose-300/60">Total Setoran ISP</span>
                <p className="text-xs font-black">{formatRupiah(totalEstimasiSetoran)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-2xl flex items-start space-x-3">
          <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-200">Logika Kalkulasi</h4>
            <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium leading-relaxed">
              Kas Bersih Admin dihitung dari <span className="font-bold">Total Iuran Pelanggan</span> dikurangi <span className="font-bold">Biaya Setoran ISP</span> per paket. Data ini bersifat dinamis mengikuti daftar paket dan pelanggan Anda.
            </p>
          </div>
        </div>

        {/* Tabel Rincian */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rincian per Pelanggan</h4>
            <div className="bg-slate-200 dark:bg-slate-800 h-[1px] flex-1 mx-3"></div>
            <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
          </div>

          <div className="space-y-2">
            {kasDetails.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400">Belum ada data pelanggan.</p>
              </div>
            ) : (
              kasDetails.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition">
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{item.nama}</h5>
                    <div className="flex items-center space-x-2">
                      <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        {item.paket}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400">
                         {formatRupiah(item.totalIuran)} - {formatRupiah(item.setoranIsp)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">Bersih</span>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      +{formatRupiah(item.kasBersih)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 pb-8 text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">ELDRIME_Net Financial Engine</p>
        </div>
      </div>
    </div>
  );
};
