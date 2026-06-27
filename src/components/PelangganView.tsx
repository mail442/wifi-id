import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Phone, 
  Wifi, 
  X,
  Check,
  import { Check, X, Search, Plus, Edit2, Trash2, Eye, Download, FileSpreadsheet, RefreshCw, AlertCircle, FileText, Upload, Globe } from "lucide-react";
// @ts-ignore
import { utils, writeFile } from "xlsx";
// @ts-ignore
import * as XLSX from "xlsx";
// @ts-ignore
import { motion, AnimatePresence } from "motion/react";
import { FixedSizeList as List } from "react-window";
import { Member, WifiPackage } from "../types";
import { formatRupiah } from "../utils";

interface PelangganViewProps {
  members: Member[];
  packages: WifiPackage[];
  onBack: () => void;
  onAddMember: (name: string, phone: string, packageId: string, dueDateDay?: number, routerIp?: string) => void;
  onEditMember: (memberId: string, name: string, phone: string, packageId: string, dueDateDay?: number, routerIp?: string) => void;
  onDeleteMember: (memberId: string) => void;
  onImportMembers?: (newMembers: Array<{ name: string; phone?: string; packageId?: string; dueDateDay?: number }>) => void;
}

export const PelangganView: React.FC<PelangganViewProps> = ({
  members,
  packages,
  onBack,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onImportMembers,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pkgId, setPkgId] = useState("");
  const [dueDateDay, setDueDateDay] = useState<number>(10);
  const [routerIp, setRouterIp] = useState("");
  const [smartPasteText, setSmartPasteText] = useState("");
  const [showSmartFormat, setShowSmartFormat] = useState(false);

  // States for importing from Excel
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [bulkPackageId, setBulkPackageId] = useState("");
  const [excelData, setExcelData] = useState<Array<{ name: string; phone?: string; packageName?: string; packageId?: string; dueDateDay: number }> | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState("");

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportFeedback(null);
    setExcelData(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setImportFeedback("File Excel tidak memiliki worksheet yang valid.");
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json<any>(sheet);
        if (rawJson.length === 0) {
          setImportFeedback("Tidak ada baris data atau baris kosong dalam sheet.");
          return;
        }

        const parsedMembersList = rawJson.map((row) => {
          // Detect name column
          let memberName = "";
          const nameKey = Object.keys(row).find(k => 
            /nama|name|pelanggan/i.test(k)
          );
          if (nameKey) {
            memberName = String(row[nameKey]).trim();
          } else {
            memberName = String(row[Object.keys(row)[0]]).trim();
          }

          // Detect phone column
          let memberPhone = "";
          const phoneKey = Object.keys(row).find(k => 
            /phone|wa|hp|telp|telepon|whatsapp|kontak/i.test(k)
          );
          if (phoneKey) {
            memberPhone = String(row[phoneKey]).trim();
          }

          // Detect package column
          let pNameInput = "";
          const pkgKey = Object.keys(row).find(k => 
            /paket|package|layanan|speed|tarif/i.test(k)
          );
          if (pkgKey) {
            pNameInput = String(row[pkgKey]).trim();
          }

          let matchedPkgId = "";
          if (pNameInput) {
            const match = packages.find(p => 
              p.name.toLowerCase().includes(pNameInput.toLowerCase()) ||
              pNameInput.toLowerCase().includes(p.name.toLowerCase()) ||
              p.speed.toLowerCase().includes(pNameInput.toLowerCase())
            );
            if (match) {
              matchedPkgId = match.id;
            }
          }

          // Detect due date
          let dueDay = 10;
          const dueKey = Object.keys(row).find(k => 
            /tempo|due|tanggal|day/i.test(k)
          );
          if (dueKey) {
            const parsedDay = parseInt(row[dueKey]);
            if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
              dueDay = parsedDay;
            }
          }

          return {
            name: memberName,
            phone: memberPhone || undefined,
            packageName: pNameInput || undefined,
            packageId: matchedPkgId || undefined,
            dueDateDay: dueDay
          };
        }).filter(item => item.name && item.name !== "undefined" && item.name.trim().length > 0);

        if (parsedMembersList.length === 0) {
          setImportFeedback("Gagal mendeteksi nama pelanggan yang valid dari file Excel.");
        } else {
          setExcelData(parsedMembersList);
        }
      } catch (err) {
        console.error("Excel upload parsing error:", err);
        setImportFeedback("Gagal membaca dokumen Excel. Silakan gunakan template resmi.");
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleDownloadTemplate = () => {
    const headers = [
      {
        "Nama Pelanggan": "Alexander Graham",
        "No WhatsApp": "081234567890",
        "Nama Paket": packages[0]?.name || "Standard",
        "Tanggal Jatuh Tempo": 15
      },
      {
        "Nama Pelanggan": "Cut Nyak Dhien",
        "No WhatsApp": "628234567812",
        "Nama Paket": "Tarif Iuran Gabungan Standar",
        "Tanggal Jatuh Tempo": 10
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Template_Excel_Pelanggan.xlsx");
  };

  const handleExecuteImport = () => {
    if (!excelData || excelData.length === 0) return;
    if (onImportMembers) {
      onImportMembers(excelData);
    }
    // Clean states and close modal
    setExcelData(null);
    setImportFileName("");
    setShowImportModal(false);
  };


  const handleStartEdit = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setPhone(member.phone || "");
    setPkgId(member.packageId || "");
    setDueDateDay(member.dueDateDay || 10);
    setRouterIp(member.routerIp || "");
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setName("");
    setPhone("");
    setPkgId("");
    setDueDateDay(10);
    setRouterIp("");
    setShowForm(false);
  };

  const handleSmartFormat = () => {
    if (!smartPasteText.trim()) return;

    const text = smartPasteText;
    
    // 1. Try to find name
    // Common patterns: "Nama: Budi", "Pelanggan: Budi", "An. Budi"
    let detectedName = "";
    const nameMatch = text.match(/(?:Nama|Pelanggan|An\.?)\s*[:\-]?\s*([^\n\r]+)/i);
    if (nameMatch) {
      detectedName = nameMatch[1].trim();
    } else {
      // Fallback: use the first line if it's short
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 0 && lines[0].length < 30) {
        detectedName = lines[0].trim();
      }
    }

    // 2. Try to find phone
    // Pattern: sequences of 10-15 digits starting with 08, 62, or +62
    let detectedPhone = "";
    const phoneMatch = text.match(/(?:\+?62|08)\d{8,13}/);
    if (phoneMatch) {
      detectedPhone = phoneMatch[0].replace(/[^0-9]/g, "");
      if (detectedPhone.startsWith("08")) {
        detectedPhone = "628" + detectedPhone.substring(2);
      } else if (detectedPhone.startsWith("8")) {
        detectedPhone = "628" + detectedPhone.substring(1);
      }
    }

    // 3. Try to find package
    let detectedPkgId = "";
    const lowerText = text.toLowerCase();
    for (const pkg of packages) {
      if (lowerText.includes(pkg.name.toLowerCase()) || lowerText.includes(pkg.speed.toLowerCase())) {
        detectedPkgId = pkg.id;
        break;
      }
    }

    // 4. Try to find due date
    let detectedDueDay = 10;
    const dueMatch = text.match(/(?:Tempo|Tanggal|Tgl|Jatuh Tempo)\s*[:\-]?\s*(\d{1,2})/i);
    if (dueMatch) {
      const day = parseInt(dueMatch[1]);
      if (day >= 1 && day <= 31) {
        detectedDueDay = day;
      }
    }

    // Update states
    if (detectedName) setName(detectedName);
    if (detectedPhone) setPhone(detectedPhone);
    if (detectedPkgId) setPkgId(detectedPkgId);
    setDueDateDay(detectedDueDay);
    
    setSmartPasteText("");
    setShowSmartFormat(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingMember) {
      onEditMember(editingMember.id, name, phone, pkgId, dueDateDay, routerIp);
      setEditingMember(null);
    } else {
      onAddMember(name, phone, pkgId, dueDateDay, routerIp);
    }
    setName("");
    setPhone("");
    setPkgId("");
    setDueDateDay(10);
    setRouterIp("");
    setShowForm(false);
  };

  // Filter lists
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return members;
    return members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.phone && m.phone.includes(searchQuery))
    );
  }, [members, searchQuery]);

  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = () => {
    if (!bulkPackageId) return;
    
    selectedMemberIds.forEach(id => {
      const member = members.find(m => m.id === id);
      if (member) {
        onEditMember(
          id, 
          member.name, 
          member.phone || "", 
          bulkPackageId, 
          member.dueDateDay, 
          member.routerIp
        );
      }
    });

    setSelectedMemberIds([]);
    setShowBulkEditModal(false);
    setBulkPackageId("");
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="min-h-screen bg-[#F5F9FC] dark:bg-slate-950 transition-colors duration-200 font-sans">
      {/* Blue App bar Header */}
      <div className="bg-slate-900 text-white pt-12 pb-10 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting blobs */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">Kelola Pelanggan</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              {members.length} Orang Terdaftar
            </p>
          </div>
        </div>
      </div>

      {/* Grid wrapper for view spacing */}
      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Collapsible Form & Import Excel Toggle Buttons */}
        <div className="flex space-x-2">
          {/* Collapsible Form Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (editingMember) {
                handleCancelEdit();
              } else {
                setShowForm(!showForm);
              }
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-95 border ${
              showForm
                ? "bg-slate-100 hover:bg-slate-150 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-150/45 dark:border-emerald-900/30"
            }`}
          >
            {showForm ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span className="truncate">{editingMember ? "Sesi Batal" : "Tutup Form"}</span>
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" />
                <span className="truncate">Tambah Baru</span>
              </>
            )}
          </button>

          {/* Import Excel Button */}
          <button
            type="button"
            onClick={() => {
              setShowImportModal(true);
              // reset excel file and states
              setExcelData(null);
              setImportFileName("");
              setImportFeedback(null);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-95 border bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/20 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-150/45 dark:border-sky-900/30"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span className="truncate">Impor Excel</span>
          </button>
        </div>

        {/* Form panel to Add / Edit customer (Collapsible & Animated) */}
        <AnimatePresence initial={false}>
          {showForm && (
            <motion.section
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors mt-1">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {editingMember ? "📝 Edit Data Pelanggan" : "🆕 Tambah Pelanggan Baru"}
                    </h3>
                  </div>
                  {!editingMember && (
                    <button
                      type="button"
                      onClick={() => setShowSmartFormat(!showSmartFormat)}
                      className={`p-1.5 rounded-lg transition-all active:scale-90 flex items-center space-x-1.5 border ${
                        showSmartFormat 
                          ? "bg-amber-100 border-amber-200 text-amber-600" 
                          : "bg-slate-50 border-slate-100 text-slate-400"
                      }`}
                      title="Gunakan Format Pintar"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-tight">Format Pintar</span>
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showSmartFormat && !editingMember && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-3 space-y-2 mb-2"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>Tempel Chat WhatsApp di Sini</span>
                        </label>
                        <button 
                          type="button"
                          onClick={() => setShowSmartFormat(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <textarea
                        value={smartPasteText}
                        onChange={(e) => setSmartPasteText(e.target.value)}
                        placeholder="Contoh: Nama: Agus, No WA: 0812..., Paket: 20 Mbps"
                        className="w-full bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30 rounded-lg p-2 text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400 h-20 text-slate-700 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleSmartFormat}
                        disabled={!smartPasteText.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-sm"
                      >
                        Terapkan Format Otomatis
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="p-name" className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      Nama Lengkap Pelanggan *
                    </label>
                    <input
                      id="p-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full bg-[#F3F6F9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA] text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="p-phone" className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      No HP / WhatsApp (Opsional)
                    </label>
                    <input
                      id="p-phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full bg-[#F3F6F9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA] text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="p-pkg" className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      Alokasi Paket Wifi *
                    </label>
                    <select
                      id="p-pkg"
                      value={pkgId}
                      onChange={(e) => setPkgId(e.target.value)}
                      className="w-full bg-[#F3F6F9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA] text-slate-800 dark:text-slate-100"
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Tarif Iuran Gabungan Standar</option>
                      {packages.map(p => (
                        <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                          {p.name} ({p.speed}) - {formatRupiah(p.price)}/bln
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="p-due" className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      Tanggal Jatuh Tempo Bulanan (1 - 31) *
                    </label>
                    <input
                      id="p-due"
                      type="number"
                      min={1}
                      max={31}
                      required
                      value={dueDateDay}
                      onChange={(e) => setDueDateDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 10)))}
                      placeholder="Misal: 10"
                      className="w-full bg-[#F3F6F9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#118EEA] text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="p-ip" className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      IP Address Router Pelanggan (Opsional)
                    </label>
                    <div className="relative">
                      <input
                        id="p-ip"
                        type="text"
                        value={routerIp}
                        onChange={(e) => setRouterIp(e.target.value)}
                        placeholder="Contoh: 192.168.1.10"
                        className="w-full bg-[#F3F6F9] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800 dark:text-slate-100 pl-8"
                      />
                      <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    {editingMember && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl py-2.5 text-xs font-extrabold text-slate-500 dark:text-slate-300 transition cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>{editingMember ? "Simpan Perubahan" : "Simpan Pelanggan"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Action Bar & Search Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Daftar Pelanggan</h2>
            <AnimatePresence>
              {selectedMemberIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center space-x-2"
                >
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                    {selectedMemberIds.length} Terpilih
                  </span>
                  <button
                    onClick={() => setShowBulkEditModal(true)}
                    className="flex items-center space-x-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit Massal</span>
                  </button>
                  <button
                    onClick={() => setSelectedMemberIds([])}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <input
              id="pelanggan-search-bar"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau nomor telepon..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-slate-800 dark:text-slate-100 h-[42px] shadow-sm transition-all"
            />
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")} 
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Month Selection Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar scrollbar-hide">
            {monthNames.map((mName, idx) => (
              <button
                key={mName}
                onClick={() => setSelectedMonth(idx)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 border ${
                  selectedMonth === idx 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" 
                    : "bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-indigo-200"
                }`}
              >
                {mName}
              </button>
            ))}
          </div>
        </div>

        {/* Searching & Listings */}
        <section className="space-y-2">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 transition-colors">
                <p className="text-xs font-bold">Pelanggan Tidak Ditemukan</p>
                <p className="text-[10px] mt-0.5">Cek kata kunci atau tambahkan pelanggan baru.</p>
              </div>
            ) : (
              <List
                height={500}
                itemCount={filtered.length}
                itemSize={116}
                width="100%"
                className="no-scrollbar scrollbar-hide"
                itemData={{
                  members: filtered,
                  packages,
                  handleStartEdit,
                  onDeleteMember,
                  selectedMemberIds,
                  toggleSelectMember,
                  selectedMonth
                }}
              >
                {({ index, style, data }: any) => {
                  const member = data.members[index];
                  const pkg = data.packages.find((p: WifiPackage) => p.id === member.packageId);
                  const isSelected = data.selectedMemberIds.includes(member.id);
                  const dueDay = member.dueDateDay || 10;
                  
                  // Calculate due status based on selected month
                  const today = new Date();
                  const curYear = today.getFullYear();
                  const curMonthIdx = today.getMonth();
                  const isPaidForMonth = !!member.payments?.[data.selectedMonth];
                  
                  let statusBadge = null;
                  
                  if (isPaidForMonth) {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] px-2 py-0.5 border border-emerald-200/50 dark:border-emerald-900/30 rounded-lg shrink-0">
                        <Check className="h-3 w-3" />
                        <span>Sudah Bayar</span>
                      </span>
                    );
                  } else {
                    // Only show time-sensitive warnings for current or past months
                    if (data.selectedMonth <= curMonthIdx) {
                      const todayDay = today.getDate();
                      const daysLeft = dueDay - todayDay;

                      if (data.selectedMonth < curMonthIdx) {
                        // Past month unpaid
                        statusBadge = (
                          <span className="inline-flex items-center space-x-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold text-[9px] px-2 py-0.5 border border-rose-200/50 dark:border-rose-900/30 rounded-lg shrink-0">
                            <AlertCircle className="h-3 w-3" />
                            <span>Tunggakan Bulan Ini</span>
                          </span>
                        );
                      } else {
                        // Current month unpaid
                        if (daysLeft >= 0 && daysLeft <= 3) {
                          statusBadge = (
                            <span className="inline-flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-extrabold text-[9px] px-2 py-0.5 border border-amber-200/50 dark:border-amber-900/30 rounded-lg shrink-0 animate-pulse">
                              <AlertCircle className="h-3 w-3" />
                              <span>{daysLeft === 0 ? "Jatuh Tempo Hari Ini!" : `Tempo ${daysLeft} Hari Lagi`}</span>
                            </span>
                          );
                        } else if (daysLeft < 0) {
                          statusBadge = (
                            <span className="inline-flex items-center space-x-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold text-[9px] px-2 py-0.5 border border-rose-200/50 dark:border-rose-900/30 rounded-lg shrink-0">
                              <AlertCircle className="h-3 w-3" />
                              <span>Lewat Jatuh Tempo ({Math.abs(daysLeft)} Hari)</span>
                            </span>
                          );
                        } else {
                          statusBadge = (
                            <span className="inline-flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 text-slate-500 font-extrabold text-[9px] px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded-lg shrink-0">
                              <span>Belum Bayar</span>
                            </span>
                          );
                        }
                      }
                    } else {
                      // Future month
                      statusBadge = (
                        <span className="inline-flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 text-slate-400 font-extrabold text-[9px] px-2 py-0.5 border border-slate-100 dark:border-slate-750 rounded-lg shrink-0">
                          <span>Belum Bayar</span>
                        </span>
                      );
                    }
                  }

                  return (
                    <div style={style} className="px-3 pt-2">
                      <div 
                        onClick={() => data.toggleSelectMember(member.id)}
                        className={`bg-[#F8FAFC] dark:bg-slate-900/50 p-3.5 rounded-2xl border flex flex-col space-y-2 shadow-xs transition-all cursor-pointer ${
                          isSelected 
                            ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-md" 
                            : "border-slate-100 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 min-w-0 flex-1">
                            <div className={`mt-0.5 h-4 w-4 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected ? "bg-indigo-600 border-indigo-600" : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 block truncate">{member.name}</span>
                                {statusBadge}
                              </div>
                              <div className="flex items-center space-x-3 text-[10px] text-slate-405 dark:text-slate-550 font-bold">
                                <span className="text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                                  <Wifi className="h-3 w-3 shrink-0" />
                                  <span>{pkg ? `${pkg.name} (${pkg.speed})` : "Iuran Gabungan Standar"}</span>
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 font-medium font-sans">
                                  Jatuh tempo tgl {dueDay}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0 pl-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => data.handleStartEdit(member)}
                              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg transition"
                              title="Ubah data"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => data.onDeleteMember(member.id)}
                              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-lg transition"
                              title="Hapus pelanggan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Footer bar of item */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-450 dark:text-slate-400 font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-750 text-slate-600 dark:text-slate-350 font-mono">
                              <Phone className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                              <span>{member.phone || "Tidak ada No. WA"}</span>
                            </div>
                            {member.routerIp && (
                              <button
                                onClick={() => {
                                  const url = member.routerIp?.startsWith('http') ? member.routerIp : `http://${member.routerIp}`;
                                  window.open(url, '_blank');
                                }}
                                className="flex items-center space-x-1 bg-sky-50 dark:bg-sky-950/30 px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/40 text-sky-600 dark:text-sky-400 font-bold hover:bg-sky-100 transition active:scale-95"
                              >
                                <Globe className="h-3 w-3" />
                                <span>Remote Router</span>
                              </button>
                            )}
                          </div>
                          
                          {member.phone && (
                            <a
                              href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center space-x-0.5"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Kirim Chat</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }}
              </List>
            )}
          </div>
        </section>
      </div>

      {/* Bulk Edit Modal */}
      <AnimatePresence>
        {showBulkEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl max-w-sm w-full space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="h-14 w-14 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Edit2 className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Edit Massal Paket</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Ubah paket untuk <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedMemberIds.length} pelanggan</span> terpilih sekaligus.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Pilih Paket Baru</label>
                  <select
                    value={bulkPackageId}
                    onChange={(e) => setBulkPackageId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                  >
                    <option value="">Pilih Paket...</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.speed}) - {formatRupiah(pkg.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setShowBulkEditModal(false)}
                    className="flex-1 py-3.5 rounded-2xl text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleBulkUpdate}
                    disabled={!bulkPackageId}
                    className="flex-1 py-3.5 bg-indigo-600 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Excel Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xl max-w-sm w-full relative space-y-4 text-slate-800 dark:text-slate-100 max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-650 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-850 dark:text-white tracking-tight uppercase">Impor Pelanggan Excel</h3>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                      Batch Loader WiFi RT Net
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowImportModal(false);
                    setExcelData(null);
                    setImportFileName("");
                    setImportFeedback(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 rounded-lg transition shrink-0 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Step 1: Explanation & Download Template */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                  Unggah file spreadsheet Anda. Pastikan baris pertama memiliki nama kolom seperti <strong>Nama</strong>, <strong>No WA</strong>, <strong>Paket</strong>, atau <strong>Jatuh Tempo</strong>.
                </p>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] py-2 px-3 border border-slate-200/60 dark:border-slate-800 rounded-xl transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Unduh Template Excel Resmi</span>
                </button>
              </div>

              {/* Step 2: Drop Zone File Upload */}
              <div className="space-y-2">
                <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Unggah Dokumen</span>
                
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-5 px-3 hover:bg-slate-50 dark:hover:bg-slate-950/20 hover:border-slate-300 transition cursor-pointer">
                  <Upload className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-1.5" />
                  <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 text-center">
                    {importFileName ? importFileName : "Klik untuk pilih file Excel / CSV"}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">(.xlsx, .xls, .csv)</span>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleExcelUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Validation Feedbacks */}
              {importFeedback && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/35 p-2.5 rounded-xl flex items-start space-x-2 text-[9.5px] font-bold text-rose-600 dark:text-rose-400 leading-normal">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{importFeedback}</span>
                </div>
              )}

              {/* Preview Parsed Data */}
              {excelData && excelData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-md">
                    <span>Preview Data Terdeteksi</span>
                    <span className="text-emerald-500">{excelData.length} Pelanggan</span>
                  </div>

                  <div className="max-h-[140px] overflow-y-auto space-y-1.5 border border-slate-100 dark:border-slate-850 rounded-xl p-1.5 bg-slate-50 dark:bg-slate-950/20">
                    {excelData.map((item, idx) => {
                      const matchedPkg = packages.find(p => p.id === item.packageId);
                      return (
                        <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-2 rounded-lg flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                            <div className="flex items-center space-x-1.5 text-[8.5px] text-slate-400 font-bold mt-0.5">
                              {item.phone && <span>{item.phone}</span>}
                              {item.phone && <span>•</span>}
                              <span>Tempo tgl {item.dueDateDay}</span>
                            </div>
                          </div>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                            item.packageId 
                              ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" 
                              : "bg-slate-50 dark:bg-slate-800 text-slate-500"
                          } max-w-[100px] truncate`}>
                            {matchedPkg ? matchedPkg.name : "Tarif Standar"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setExcelData(null);
                    setImportFileName("");
                    setImportFeedback(null);
                  }}
                  className="flex-1 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!excelData || excelData.length === 0}
                  onClick={handleExecuteImport}
                  className={`flex-1 font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 ${
                    excelData && excelData.length > 0
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-200 dark:bg-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Impor Sekarang</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
