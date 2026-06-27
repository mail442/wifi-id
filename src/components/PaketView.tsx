import React, { useState } from "react";
import { 
  ChevronLeft, 
  Wifi, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle 
} from "lucide-react";
import { WifiPackage } from "../types";
import { formatRupiah } from "../utils";

interface PaketViewProps {
  packages: WifiPackage[];
  onBack: () => void;
  onAddPackage: (name: string, speed: string, price: number, ispCost: number) => void;
  onEditPackage: (pkgId: string, name: string, speed: string, price: number, ispCost: number) => void;
  onDeletePackage: (pkgId: string) => void;
}

export const PaketView: React.FC<PaketViewProps> = ({
  packages,
  onBack,
  onAddPackage,
  onEditPackage,
  onDeletePackage,
}) => {
  const [editingPkg, setEditingPkg] = useState<WifiPackage | null>(null);

  // Form inputs
  const [name, setName] = useState("");
  const [speed, setSpeed] = useState("");
  const [price, setPrice] = useState("");
  const [ispCost, setIspCost] = useState("");

  const handleStartEdit = (pkg: WifiPackage) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setSpeed(pkg.speed);
    setPrice(pkg.price.toString());
    setIspCost(pkg.ispCost?.toString() || "");
  };

  const handleCancelEdit = () => {
    setEditingPkg(null);
    setName("");
    setSpeed("");
    setPrice("");
    setIspCost("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !speed.trim() || !price || !ispCost) return;
    const priceNum = parseInt(price) || 0;
    const ispCostNum = parseInt(ispCost) || 0;

    if (editingPkg) {
      onEditPackage(editingPkg.id, name, speed, priceNum, ispCostNum);
      setEditingPkg(null);
    } else {
      onAddPackage(name, speed, priceNum, ispCostNum);
    }
    
    setName("");
    setSpeed("");
    setPrice("");
    setIspCost("");
  };

  return (
    <div className="min-h-screen bg-[#F5F9FC] font-sans">
      {/* Deep blue header */}
      <div className="bg-slate-900 text-white pt-12 pb-10 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting blobs */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">Setelan Paket WiFi</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              Total {packages.length} Profil Tarif
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Form component */}
        <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Wifi className="h-5 w-5 text-orange-500 animate-pulse" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
              {editingPkg ? "📝 Edit Tarif Paket WiFi" : "🆕 Buat Opsi Paket WiFi"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="pkg-name" className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                Nama Model Paket WiFi
              </label>
              <input
                id="pkg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Paket Keluarga, Paket Kost"
                className="w-full bg-[#F3F6F9] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="pkg-speed" className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                Kecepatan Mbps
              </label>
              <input
                id="pkg-speed"
                type="text"
                required
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                placeholder="Contoh: 30 Mbps, 50 Mbps"
                className="w-full bg-[#F3F6F9] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="pkg-price" className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                Tarif Bulanan ke Pelanggan (Rp)
              </label>
              <input
                id="pkg-price"
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Contoh: 125000"
                className="w-full bg-[#F3F6F9] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="pkg-isp-cost" className="block text-[10px] uppercase tracking-wider font-extrabold text-rose-400">
                Biaya Setoran ke ISP (Rp)
              </label>
              <input
                id="pkg-isp-cost"
                type="number"
                required
                value={ispCost}
                onChange={(e) => setIspCost(e.target.value)}
                placeholder="Contoh: 110000"
                className="w-full bg-rose-50/30 border border-rose-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              {editingPkg && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 rounded-xl py-2.5 text-xs font-extrabold text-slate-500 transition"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-extrabold transition"
              >
                <span>{editingPkg ? "Simpan Paket" : "Tambahkan Paket"}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Available Packages Lists */}
        <section className="space-y-2">
          <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
            📋 Daftar Konfigurasi Tarif
          </span>

          <div className="space-y-2">
            {packages.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-400">
                <p className="text-xs font-bold">Belum Ada Paket WiFi</p>
                <p className="text-[10px] mt-0.5">Seluruh pelanggan saat ini menggunakan tarif dasar bulanan.</p>
              </div>
            ) : (
              packages.map(pkg => (
                <div key={pkg.id} className="bg-white p-3.5 rounded-2xl border border-slate-50 flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-extrabold text-slate-800">{pkg.name}</span>
                      <span className="bg-orange-50 text-orange-600 font-mono text-[8px] font-black uppercase px-1.5 py-0.5 rounded">
                        {pkg.speed}
                      </span>
                    </div>
                    <span className="text-xs font-black text-indigo-600 block">
                      {formatRupiah(pkg.price)} <span className="text-[9px] text-slate-400 font-semibold">/ iuran</span>
                    </span>
                    <span className="text-[9px] font-bold text-rose-500 block">
                      ISP: -{formatRupiah(pkg.ispCost || 0)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleStartEdit(pkg)}
                      className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition"
                      title="Edit paket"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeletePackage(pkg.id)}
                      className="p-2 hover:bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg transition"
                      title="Hapus paket"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
