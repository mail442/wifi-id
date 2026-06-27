import React, { useState } from "react";
import { 
  ChevronLeft, 
  Plus, 
  Send, 
  Clock, 
  Play, 
  CheckCircle2, 
  AlertTriangle,
  User,
  Wifi,
  FileText,
  X,
  MessageSquare
} from "lucide-react";
import { Member, TroubleTicket } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface TiketGangguanViewProps {
  members: Member[];
  tickets: TroubleTicket[];
  onBack: () => void;
  onAddTicket: (ticket: Omit<TroubleTicket, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateStatus: (ticketId: string, newStatus: "Pending" | "Diproses" | "Selesai") => void;
  techPhone: string;
}

export const TiketGangguanView: React.FC<TiketGangguanViewProps> = ({
  members,
  tickets,
  onBack,
  onAddTicket,
  onUpdateStatus,
  techPhone
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [smartInput, setSmartInput] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Semua" | "Pending" | "Diproses" | "Selesai">("Semua");
  const [formData, setFormData] = useState({
    memberId: "",
    type: "WiFi Lemot" as TroubleTicket["type"],
    description: "",
    urgency: "Biasa" as TroubleTicket["urgency"]
  });

  const handleSmartDecrypt = () => {
    if (!smartInput.trim()) return;

    let text = smartInput.toLowerCase();
    
    // Auto-Correct Dictionary
    const dictionary: Record<string, string> = {
      "wf": "Koneksi WiFi",
      "wifi": "Koneksi WiFi",
      "wipi": "Koneksi WiFi",
      "lemot": "Mengalami Penurunan Kecepatan (Sangat Lambat)",
      "lola": "Mengalami Penurunan Kecepatan (Sangat Lambat)",
      "lemat": "Mengalami Penurunan Kecepatan (Sangat Lambat)",
      "lambat": "Mengalami Penurunan Kecepatan (Sangat Lambat)",
      "lelet": "Mengalami Penurunan Kecepatan (Sangat Lambat)",
      "dr pg": "sejak pagi hari",
      "dari pagi": "sejak pagi hari",
      "tlong": "mohon segera dicek",
      "tlng": "mohon segera dicek",
      "plis": "mohon segera dicek",
      "p": "mohon segera dicek",
      "tolong": "mohon segera dicek",
      "los": "Lampu Indikator LOS Merah (Kabel Putus / Redaman Tinggi)",
      "merah": "Lampu Indikator LOS Merah (Kabel Putus / Redaman Tinggi)",
      "los merah": "Lampu Indikator LOS Merah (Kabel Putus / Redaman Tinggi)",
      "kedip merah": "Lampu Indikator LOS Merah (Kabel Putus / Redaman Tinggi)",
      "mati": "Terputus Total / Tidak Dapat Diakses",
      "g bs": "Terputus Total / Tidak Dapat Diakses",
      "ga bisa": "Terputus Total / Tidak Dapat Diakses",
      "modem mati": "Terputus Total / Tidak Dapat Diakses"
    };

    // Logical Auto-Fill detection
    let detectedType: TroubleTicket["type"] = "WiFi Lemot";
    let detectedUrgency: TroubleTicket["urgency"] = "Biasa";

    if (text.includes("los") || text.includes("merah") || text.includes("putus")) {
      detectedType = "LOS Merah/Kabel Putus";
      detectedUrgency = "Darurat";
    } else if (text.includes("lemot") || text.includes("lola") || text.includes("lelet")) {
      detectedType = "WiFi Lemot";
      detectedUrgency = "Biasa";
    } else if (text.includes("mati") || text.includes("padam")) {
      detectedType = "Router Mati";
      detectedUrgency = "Darurat";
    }

    // Apply normalization to the description
    let normalizedDesc = smartInput;
    Object.keys(dictionary).forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, "gi");
      normalizedDesc = normalizedDesc.replace(regex, dictionary[key]);
    });

    // Update Form Data
    setFormData(prev => ({
      ...prev,
      description: normalizedDesc.trim(),
      type: detectedType,
      urgency: detectedUrgency
    }));

    // Clear smart input with feedback
    setSmartInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.description) return;

    const member = members.find(m => m.id === formData.memberId);
    onAddTicket({
      memberId: formData.memberId,
      memberName: member?.name || "Unknown",
      type: formData.type,
      description: formData.description,
      urgency: formData.urgency,
      status: "Pending"
    });

    setShowAddModal(false);
    setFormData({
      memberId: "",
      type: "WiFi Lemot",
      description: "",
      urgency: "Biasa"
    });
  };

  const handleSendToTech = (ticket: TroubleTicket) => {
    const member = members.find(m => m.id === ticket.memberId);
    const message = `*LAPORAN GANGGUAN WIFI ELDRIME_Net*\n\n` +
      `📌 *ID Tiket:* ${ticket.id}\n` +
      `👤 *Pelanggan:* ${ticket.memberName}\n` +
      `📞 *No. HP:* ${member?.phone || "-"}\n` +
      `🛠️ *Jenis:* ${ticket.type}\n` +
      `🚨 *Urgensi:* ${ticket.urgency}\n` +
      `📝 *Detail:* ${ticket.description}\n\n` +
      `_Mohon segera ditindaklanjuti. Terima kasih._`;

    const whatsappUrl = `https://wa.me/${techPhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const getStatusConfig = (status: TroubleTicket["status"]) => {
    switch (status) {
      case "Pending": return { color: "bg-amber-500", text: "text-amber-500", bg: "bg-amber-50", label: "Pending", icon: Clock };
      case "Diproses": return { color: "bg-indigo-600", text: "text-indigo-600", bg: "bg-indigo-50", label: "Diproses", icon: Play };
      case "Selesai": return { color: "bg-emerald-500", text: "text-emerald-500", bg: "bg-emerald-50", label: "Selesai", icon: CheckCircle2 };
    }
  };

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
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">Tiket Gangguan</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              Manajemen Keluhan & Perbaikan
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition active:scale-95 relative z-10"
        >
          <Plus className="h-5 w-5 text-white" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Filter Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {(["Semua", "Pending", "Diproses", "Selesai"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex-shrink-0 border ${
                filterStatus === status 
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" 
                  : "bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-indigo-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        {tickets.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] text-center border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 mt-8">
            <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto">
              <MessageSquare className="h-8 w-8 text-slate-300" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Belum Ada Tiket</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Semua sistem berjalan normal. Tidak ada keluhan pelanggan saat ini.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets
              .filter(t => filterStatus === "Semua" || t.status === filterStatus)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(ticket => {
              const config = getStatusConfig(ticket.status);
              const StatusIcon = config.icon;

              return (
                <motion.div 
                  layout
                  key={ticket.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 group hover:border-indigo-200 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <motion.div 
                          animate={ticket.status === "Diproses" ? {
                            backgroundColor: [
                              "rgba(238, 242, 255, 1)", // indigo-50
                              "rgba(224, 231, 255, 1)", // indigo-100
                              "rgba(238, 242, 255, 1)"
                            ],
                            scale: [1, 1.02, 1],
                            boxShadow: [
                              "0 0 0px rgba(79, 70, 229, 0)",
                              "0 0 8px rgba(79, 70, 229, 0.2)",
                              "0 0 0px rgba(79, 70, 229, 0)"
                            ]
                          } : {}}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg ${config.bg} border border-transparent ${ticket.status === "Diproses" ? "border-indigo-100 dark:border-indigo-900/30" : ""}`}
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            {ticket.status === "Diproses" && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.color}`}></span>
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${config.text}`}>
                            {config.label}
                          </span>
                        </motion.div>
                      </div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-white">{ticket.memberName}</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                      ticket.urgency === "Darurat" ? "bg-rose-50 text-rose-500 border-rose-100" :
                      ticket.urgency === "Penting" ? "bg-amber-50 text-amber-500 border-amber-100" :
                      "bg-slate-50 text-slate-500 border-slate-100"
                    }`}>
                      {ticket.urgency}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-2 text-slate-500">
                      <Wifi className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold">{ticket.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex space-x-2">
                      {ticket.status !== "Selesai" && (
                        <button 
                          onClick={() => handleSendToTech(ticket)}
                          className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition active:scale-95 shadow-md shadow-emerald-500/20"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Kirim Teknisi</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex space-x-1.5">
                      {ticket.status === "Pending" && (
                        <button 
                          onClick={() => onUpdateStatus(ticket.id, "Diproses")}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition"
                          title="Proses"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {ticket.status === "Diproses" && (
                        <button 
                          onClick={() => onUpdateStatus(ticket.id, "Selesai")}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition"
                          title="Selesaikan"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 pb-0 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Buat Tiket Baru</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Input Laporan Gangguan</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                {/* SMART AI DECRYPTION AREA */}
                <div className="bg-slate-800/50 p-4 rounded-3xl border border-indigo-500/20 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center space-x-2">
                      <MessageSquare className="h-3 w-3" />
                      <span>🤖 Dekripsi Pintar (Paste Chat WA)</span>
                    </label>
                    <textarea 
                      value={smartInput}
                      onChange={(e) => setSmartInput(e.target.value)}
                      placeholder="Contoh: p wifi lemot dr pg tlong..."
                      rows={2}
                      className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-600 transition resize-none placeholder:text-slate-600"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleSmartDecrypt}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition active:scale-95 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
                  >
                    <span>Dekripsi & Sinkronkan Formulir</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                    <User className="h-3 w-3" />
                    <span>Pilih Pelanggan</span>
                  </label>
                  <select 
                    required
                    value={formData.memberId}
                    onChange={(e) => setFormData(prev => ({ ...prev, memberId: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 transition appearance-none"
                  >
                    <option value="">Pilih Member...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <Wifi className="h-3 w-3" />
                      <span>Jenis Gangguan</span>
                    </label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                    >
                      <option>WiFi Lemot</option>
                      <option>LOS Merah/Kabel Putus</option>
                      <option>Router Mati</option>
                      <option>Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Urgensi</span>
                    </label>
                    <select 
                      value={formData.urgency}
                      onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                    >
                      <option>Biasa</option>
                      <option>Penting</option>
                      <option>Darurat</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                    <FileText className="h-3 w-3" />
                    <span>Deskripsi Detail</span>
                  </label>
                  <textarea 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Jelaskan masalah secara detail..."
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 transition resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition active:scale-95"
                >
                  Terbitkan Tiket Sekarang
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
