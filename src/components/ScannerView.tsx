import React from "react";
import { ChevronLeft, QrCode, Shield, Zap, AlertCircle } from "lucide-react";

interface ScannerViewProps {
  onBack: () => void;
  onSimulateScan: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  onBack,
  onSimulateScan,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      
      {/* Dark semi-transparent header */}
      <div className="bg-slate-900 pt-12 pb-10 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting blobs */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">Pindai QR WiFi</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              Validasi Anggota & Pembayaran
            </p>
          </div>
        </div>
      </div>

      {/* Simulated camera capture view wrapper */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Background dark matrix dots */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-15"></div>

        {/* Viewfinder scanner box */}
        <div className="w-64 h-64 border-2 border-dashed border-white/35 rounded-3xl relative flex items-center justify-center bg-slate-900/40 backdrop-blur-xs overflow-hidden shadow-[0_0_50px_rgba(17,142,234,0.15)]">
          
          {/* Animated red laser beam scanner line */}
          <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-[pulse_2s_infinite] top-1/2 -translate-y-1/2"></div>
          
          {/* Neon corners for a camera scan effect */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-indigo-600 rounded-tl-lg"></div>
          <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-indigo-600 rounded-tr-lg"></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-indigo-600 rounded-bl-lg"></div>
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-indigo-600 rounded-br-lg"></div>

          {/* QR vector logo placeholder in center */}
          <QrCode className="h-20 w-20 text-indigo-600 opacity-25 animate-pulse" />
        </div>

        {/* Informative advice text below viewfinder */}
        <div className="mt-8 text-center max-w-xs space-y-2 relative z-10">
          <p className="text-xs font-semibold text-slate-300">
            Posisikan Kode QR atau Kode QRIS WiFi RT/RW Net di dalam bingkai kamera
          </p>
          <p className="text-[10px] text-slate-500">
            Sistem memindai sandi router, slip setoran, atau barcode kartu anggota digital secara otomatis
          </p>
        </div>
      </div>

      {/* Instant quick-simulated scan handler button action in footer */}
      <div className="p-6 bg-slate-900 border-t border-white/5 space-y-4 text-center">
        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-indigo-600 font-bold">
          <Shield className="h-4 w-4" />
          <span>Keamanan Terjamin oleh DANA Protection®</span>
        </div>

        <button 
          onClick={onSimulateScan}
          className="w-full bg-indigo-600 hover:bg-indigo-700 font-extrabold text-xs py-3 rounded-2xl transition tracking-wide active:scale-95 flex items-center justify-center space-x-1"
        >
          <Zap className="h-4 w-4 fill-amber-300 stroke-none" />
          <span>Simpan Simulasi Bayar Iuran Kilat</span>
        </button>

        <p className="text-[10px] text-slate-500 leading-tight">
          Pemindaian ini merupakan pelengkap mock-up interface untuk menyimulasikan kelancaran workflow iuran nirkabel warga setempat.
        </p>
      </div>

    </div>
  );
};
