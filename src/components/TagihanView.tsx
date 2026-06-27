import React, { useState, useMemo, useEffect } from "react";
import { 
  ChevronLeft, 
  Search, 
  Info, 
  Check, 
  X, 
  Share2, 
  FileText,
  Calendar,
  MessageCircle,
  AlertTriangle,
  Settings,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Member, WifiPackage } from "../types";
import { MONTH_NAMES, MONTH_SHORT_NAMES, formatRupiah, formatATMDate } from "../utils";
import { jsPDF } from "jspdf";

interface TagihanViewProps {
  activeYear: string;
  members: Member[];
  packages: WifiPackage[];
  fallbackRate: number;
  onBack: () => void;
  onTogglePayment: (memberId: string, monthIndex: number) => void;
  onOpenNoteModal: (member: Member, monthIndex: number) => void;
  onCopyReport: () => void;
  onBulkSetPaid: (memberIds: string[], monthIndex: number) => void;
}

export const TagihanView: React.FC<TagihanViewProps> = ({
  activeYear,
  members,
  packages,
  fallbackRate,
  onBack,
  onTogglePayment,
  onOpenNoteModal,
  onCopyReport,
  onBulkSetPaid,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<"sopan" | "santai" | "tegas" | "custom">(() => {
    return (localStorage.getItem("wifi_wa_template_type") as any) || "sopan";
  });
  const [customTemplateText, setCustomTemplateText] = useState(() => {
    return localStorage.getItem("wifi_wa_template_text") || "";
  });
  const [isCustomizingTemplates, setIsCustomizingTemplates] = useState(false);

  useEffect(() => {
    localStorage.setItem("wifi_wa_template_type", selectedTemplate);
    localStorage.setItem("wifi_wa_template_text", customTemplateText);
  }, [selectedTemplate, customTemplateText]);

  const [searchQuery, setSearchQuery] = useState("");
  const [subView, setSubView] = useState<"matriks" | "tunggakan">("matriks");
  const [waFilter, setWaFilter] = useState<"belum_lunas" | "lunas">("belum_lunas");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // State to custom select which months to include in the WhatsApp bill reminder
  const [selectedMonthsPerMember, setSelectedMonthsPerMember] = useState<{ [memberId: string]: number[] }>({});

  const toggleMonthSelection = (memberId: string, monthIndex: number, defaultUnpaidMonths: number[]) => {
    setSelectedMonthsPerMember(prev => {
      const currentList = prev[memberId] ?? defaultUnpaidMonths;
      const isSelected = currentList.includes(monthIndex);
      let newList: number[];
      if (isSelected) {
        newList = currentList.filter(m => m !== monthIndex);
      } else {
        newList = [...currentList, monthIndex].sort((a, b) => a - b);
      }
      return { ...prev, [memberId]: newList };
    });
  };

  // Automatically select the current month for bulk payment
  const currentMonthIndex = new Date().getMonth();
  const [selectedMonthForBulk, setSelectedMonthForBulk] = useState<number>(currentMonthIndex);
  const [sentWaList, setSentWaList] = useState<string[]>([]); // Track sent messages in current session

  // States for month PDF Export Selection
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedMonthForExport, setSelectedMonthForExport] = useState<number>(currentMonthIndex);
  const [showReadMode, setShowReadMode] = useState(false);
  const [readModeData, setReadModeData] = useState<{ member: Member; monthIndex: number } | null>(null);

  const handleOpenReadMode = (member: Member, monthIndex: number) => {
    if (!member.payments?.[monthIndex]) return;
    setReadModeData({ member, monthIndex });
    setShowReadMode(true);
  };

  // Helper to determine if member has 2 or more consecutive unpaid months
  const hasConsecutiveUnpaid = useMemo(() => {
    return (payments: { [monthIndex: number]: boolean } = {}) => {
      const currentYearStr = new Date().getFullYear().toString();
      const maxMonthToCheck = activeYear === currentYearStr ? new Date().getMonth() : 11;
      let count = 0;
      for (let m = 0; m <= maxMonthToCheck; m++) {
        if (!payments[m]) {
          count++;
          if (count >= 2) return true;
        } else {
          count = 0;
        }
      }
      return false;
    };
  }, [activeYear]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return members;
    return members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [members, searchQuery]);

  // Calculations for current month completion ratios
  const currentMonthName = MONTH_NAMES[currentMonthIndex];

  // Raw count of members with outstanding payments
  const totalUnpaidRawCount = useMemo(() => {
    return members.filter(member => {
      for (let m = 0; m < 12; m++) {
        if (!member.payments?.[m]) return true;
      }
      return false;
    }).length;
  }, [members]);

  // All members with status, paid months, and formatted WhatsApp message templates
  const whatsappMembersList = useMemo(() => {
    return members.map(member => {
      const pkg = packages.find(p => p.id === member.packageId);
      const rate = pkg ? pkg.price : fallbackRate;
      
      const unpaidMonths: number[] = [];
      const paidMonths: number[] = [];
      for (let m = 0; m < 12; m++) {
        if (!member.payments?.[m]) {
          unpaidMonths.push(m);
        } else {
          paidMonths.push(m);
        }
      }

      const totalOwed = unpaidMonths.length * rate;
      const totalPaid = paidMonths.length * rate;
      const unpaidMonthsStr = unpaidMonths.map((idx: number) => MONTH_NAMES[idx]).join(", ");
      const paidMonthsStr = paidMonths.map((idx: number) => MONTH_NAMES[idx]).join(", ");
      const isPaidThisMonth = !!member.payments?.[currentMonthIndex];
      
      let messageText = "";
      if (isPaidThisMonth) {
        messageText = `Halo *${member.name}*,\n\nTerima kasih! Pembayaran iuran WiFi Anda untuk bulan *${MONTH_NAMES[currentMonthIndex]} ${activeYear}* telah kami terima dengan status: *LUNAS*.\n\nTerima kasih atas dukungannya dalam menjaga layanan internet RT Net tetap lancar! 🙏✨`;
      } else {
        let baseTemplate = "";
        const cleanType = String(selectedTemplate).split(" ")[0]; // handle any transition classes in state
        if (cleanType === "sopan") {
          baseTemplate = "Halo *{nama}*,\n\nMohon maaf mengganggu waktunya. Kami ingin mengingatkan mengenai pembayaran iuran bulanan WiFi ELDRIME_Net untuk bulan *{bulan}*.\n\nTotal tagihan Anda sebesar: *{tagihan}*.\n\nPembayaran dapat ditransfer via bank atau disetor tunai. Jika sudah melakukan pembayaran, mohon kirimkan konfirmasi atau bukti transfernya ya.\n\nTerima kasih banyak atas kerja samanya! 🙏✨";
        } else if (cleanType === "santai") {
          baseTemplate = "Halo *{nama}*! 😊\n\nSemoga sehat selalu ya. Sekadar mengingatkan untuk iuran WiFi ELDRIME_Net bulan *{bulan}* nih.\n\nTotalnya: *{tagihan}*.\n\nPembayaran bisa ditransfer atau langsung disetor tunai ya. Kalau sudah bayar, kabari atau kirim bukti bayar ke nomor ini.\n\nMatur nuwun! 🚀🙌";
        } else if (cleanType === "tegas") {
          baseTemplate = "Pemberitahuan Penting\nKepada: *{nama}*\n\nKami menginformasikan bahwa koneksi WiFi ELDRIME_Net Anda memiliki tunggakan pembayaran untuk bulan *{bulan}*.\n\nTotal Tagihan: *{tagihan}*\n\nHarap segera melakukan pembayaran agar layanan internet tetap aktif dan tidak mengalami pemutusan sementara. Jika sudah melunasi, harap segera mengirimkan bukti pembayaran.\n\nTerima kasih atas perhatiannya.";
        } else {
          // custom
          baseTemplate = customTemplateText || "Halo *{nama}*, tagihan Anda untuk bulan *{bulan}* sebesar *{tagihan}* belum lunas.";
        }

        messageText = baseTemplate
          .replace(/{nama}/gi, member.name)
          .replace(/{bulan}/gi, unpaidMonthsStr)
          .replace(/{tagihan}/gi, formatRupiah(totalOwed))
          .replace(/{tahun}/gi, activeYear);
      }
      
      let cleanedPhone = member.phone || "";
      cleanedPhone = cleanedPhone.replace(/\D/g, "");
      if (cleanedPhone.startsWith("0")) {
        cleanedPhone = "62" + cleanedPhone.slice(1);
      }

      const waUrl = cleanedPhone 
        ? `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(messageText)}`
        : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

      const resiText = `*RT NET - RESI TAGIHAN IURAN WIFI* 🧾\n` +
             `----------------------------------------\n` +
             `Yth. *${member.name}*\n\n` +
             `Pemberitahuan resmi mengenai iuran bulanan WiFi RT Net Anda untuk tahun *${activeYear}*.\n\n` +
             `*Rincian Tagihan:*\n` +
             `• *Pelanggan :* ${member.name}\n` +
             `• *Tunggakan :* ${unpaidMonthsStr}\n` +
             `• *Tarif Plafond :* ${formatRupiah(rate)} / bulan\n` +
             `• *Total Tagihan :* *${formatRupiah(totalOwed)}*\n` +
             `• *Status    :* BELUM LUNAS ⚠️\n` +
             `----------------------------------------\n` +
             `Mohon kesediaannya untuk menyelesaikan pembayaran secara langsung ke pengurus RT atau via Transfer.\n\n` +
             `_Harap simpan resi tagihan resmi ini._\n` +
             `_Sistem WiFi RT Net_ 🙏🏼`;

      const resiWaUrl = cleanedPhone 
        ? `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(resiText)}`
        : `https://wa.me/?text=${encodeURIComponent(resiText)}`;

      const isFullyPaid = unpaidMonths.length === 0;
      
      return {
        ...member,
        rate,
        pkg,
        unpaidMonths,
        paidMonths,
        totalOwed,
        totalPaid,
        unpaidMonthsStr,
        paidMonthsStr,
        isFullyPaid,
        waUrl,
        resiWaUrl
      };
    });
  }, [members, packages, fallbackRate, activeYear, selectedTemplate, customTemplateText]);

  const filteredWhatsAppList = useMemo(() => {
    let result = whatsappMembersList;
    if (waFilter === "belum_lunas") {
      result = result.filter(m => !m.isFullyPaid);
    } else {
      result = result.filter(m => m.isFullyPaid);
    }

    if (!searchQuery.trim()) return result;
    return result.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [whatsappMembersList, waFilter, searchQuery]);

  // Monthly stats list: how many paid in each month
  const monthlyRatios = useMemo(() => {
    const ratios: { [index: number]: { paid: number; pct: number } } = {};
    for (let mIndex = 0; mIndex < 12; mIndex++) {
      let paidCount = 0;
      members.forEach(m => {
        if (m.payments?.[mIndex]) paidCount++;
      });
      const pct = members.length > 0 ? Math.round((paidCount / members.length) * 105) : 0; // scaled
      const realPct = members.length > 0 ? Math.round((paidCount / members.length) * 100) : 0;
      ratios[mIndex] = { paid: paidCount, pct: realPct };
    }
    return ratios;
  }, [members]);

  const getPersonalizedMessage = (
    name: string,
    monthsStr: string,
    tagihanStr: string,
    year: string,
    rateStr: string,
    isPaidThisMonth: boolean
  ) => {
    if (isPaidThisMonth) {
      return `Halo *${name}*,\n\nTerima kasih! Pembayaran iuran WiFi Anda untuk bulan *${MONTH_NAMES[currentMonthIndex]} ${year}* telah kami terima dengan status: *LUNAS*.\n\nTerima kasih atas dukungannya dalam menjaga layanan internet RT Net tetap lancar! 🙏✨`;
    }

    let template = "";
    const cleanType = String(selectedTemplate).split(" ")[0];
    if (cleanType === "sopan") {
      template = "Halo *{nama}*,\n\nMohon maaf mengganggu waktunya. Kami ingin mengingatkan mengenai pembayaran iuran bulanan WiFi ELDRIME_Net untuk bulan *{bulan}*.\n\nTotal tagihan Anda sebesar: *{tagihan}*.\n\nPembayaran dapat ditransfer via bank atau disetor tunai. Jika sudah melakukan pembayaran, mohon kirimkan konfirmasi atau bukti transfernya ya.\n\nTerima kasih banyak atas kerja samanya! 🙏✨";
    } else if (cleanType === "santai") {
      template = "Halo *{nama}*! 😊\n\nSemoga sehat selalu ya. Sekadar mengingatkan untuk iuran WiFi ELDRIME_Net bulan *{bulan}* nih.\n\nTotalnya: *{tagihan}*.\n\nPembayaran bisa ditransfer atau langsung disetor tunai ya. Kalau sudah bayar, kabari atau kirim bukti bayar ke nomor ini.\n\nMatur nuwun! 🚀🙌";
    } else if (cleanType === "tegas") {
      template = "Pemberitahuan Penting\nKepada: *{nama}*\n\nKami menginformasikan bahwa koneksi WiFi ELDRIME_Net Anda memiliki tunggakan pembayaran untuk bulan *{bulan}*.\n\nTotal Tagihan: *{tagihan}*\n\nHarap segera melakukan pembayaran agar layanan internet tetap aktif dan tidak mengalami pemutusan sementara. Jika sudah melunasi, harap segera mengirimkan bukti pembayaran.\n\nTerima kasih atas perhatiannya.";
    } else {
      template = customTemplateText || "Halo *{nama}*, tagihan Anda untuk bulan *{bulan}* sebesar *{tagihan}* belum lunas.";
    }

    return template
      .replace(/{nama}/gi, name)
      .replace(/{bulan}/gi, monthsStr)
      .replace(/{tagihan}/gi, tagihanStr)
      .replace(/{tahun}/gi, year);
  };

  const handleExportPDF = (monthIdx: number) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const currentMonthIdx = monthIdx;
      const currentMonthName = MONTH_NAMES[currentMonthIdx];
      const todayDate = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      // Colors
      const primaryColor = [17, 142, 234]; // #118EEA
      const textColor = [51, 65, 85];     // Slate-700
      const borderCol = [226, 232, 240];   // Slate-200
      const dangerColor = [220, 38, 38];   // Red-600
      const successColor = [5, 150, 105];  // Emerald-600

      // Header Banner
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("RT NET WIFI • LAPORAN KETERANGAN IURAN", 14, 18);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text("Sistem Pengelolaan Kas dan Tagihan Internet Mandiri Komunitas RT Net", 14, 23);
      
      // Divider line
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.setLineWidth(0.4);
      doc.line(14, 26, 196, 26);

      // Report Period Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text("BERITA ACARA BULAN BERJALAN", 14, 33);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Periode Penagihan : ${currentMonthName} ${activeYear}`, 14, 38);
      doc.text(`Waktu Pengumpulan : s.d. Hari Ini`, 14, 42);
      doc.text(`Tanggal Cetak     : ${todayDate}`, 14, 46);

      // Calculate aggregates for current month (index 0 - 11)
      let totalPaidM = 0;
      let totalUnpaidM = 0;
      let collectedCash = 0;
      let outstandingCash = 0;

      const items = members.map(m => {
        const pkg = packages.find(p => p.id === m.packageId);
        const rate = pkg ? pkg.price : fallbackRate;
        const isPaid = !!m.payments?.[currentMonthIdx];
        const due = m.dueDateDay || 10;
        const note = m.notes?.[currentMonthIdx] || "-";

        if (isPaid) {
          totalPaidM++;
          collectedCash += rate;
        } else {
          totalUnpaidM++;
          outstandingCash += rate;
        }

        return {
          name: m.name,
          pkgName: pkg ? `${pkg.name} (${pkg.speed})` : "Tarif Standar",
          rate,
          status: isPaid ? "LUNAS" : "BELUM BAYAR",
          due,
          note
        };
      });

      const totalTarget = collectedCash + outstandingCash;

      // Draw Summary Statistics Card in PDF
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(14, 51, 182, 23, "F");
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.rect(14, 51, 182, 23, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("RINGKASAN STATUS KAS WIFI RT BULAN INI", 18, 56);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Total Pelanggan : ${members.length} Jiwa / Rumah`, 18, 61);
      doc.text(`Sudah Membayar : ${totalPaidM} Rumah (${formatRupiah(collectedCash)})`, 18, 65);
      doc.text(`Belum Membayar : ${totalUnpaidM} Rumah (${formatRupiah(outstandingCash)})`, 18, 69);

      doc.text(`Total Iuran Terkumpul : ${formatRupiah(collectedCash)}`, 112, 61);
      doc.text(`Sisa Belum Ditagih    : ${formatRupiah(outstandingCash)}`, 112, 65);
      doc.text(`Potensi Maksimal      : ${formatRupiah(totalTarget)}`, 112, 69);

      // Table Header Row
      let y = 80;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(14, y, 182, 7.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.text("No", 17, y + 5);
      doc.text("Nama Anggota Pelanggan", 26, y + 5);
      doc.text("Paket Internet WiFi", 72, y + 5);
      doc.text("Jt Tempo", 112, y + 5);
      doc.text("Nominal", 132, y + 5);
      doc.text("Status", 154, y + 5);
      doc.text("Keterangan", 175, y + 5);

      y += 7.5;

      // Draw Customer Rows
      items.forEach((item, index) => {
        // Handle pagination overflow safely
        if (y > 270) {
          doc.addPage();
          y = 15;

          // Redraw table header on new page
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(14, y, 182, 7.5, "F");

          doc.setTextColor(255, 255, 255);
          doc.text("No", 17, y + 5);
          doc.text("Nama Anggota Pelanggan", 26, y + 5);
          doc.text("Paket Internet WiFi", 72, y + 5);
          doc.text("Jt Tempo", 112, y + 5);
          doc.text("Nominal", 132, y + 5);
          doc.text("Status", 154, y + 5);
          doc.text("Keterangan", 175, y + 5);

          y += 7.5;
        }

        // Alternating row background for optimal reading
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, 182, 6.5, "F");
        }

        // Cell border line
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(14, y + 6.5, 196, y + 6.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        // Print row text cell by cell
        doc.text((index + 1).toString(), 17, y + 4.2);
        
        let trunkName = item.name;
        if (trunkName.length > 22) {
          trunkName = trunkName.substring(0, 20) + "..";
        }
        doc.text(trunkName, 26, y + 4.2);

        let trunkPkg = item.pkgName;
        if (trunkPkg.length > 22) {
          trunkPkg = trunkPkg.substring(0, 20) + "..";
        }
        doc.text(trunkPkg, 72, y + 4.2);

        doc.text(`Tgl ${item.due}`, 112, y + 4.2);
        doc.text(formatRupiah(item.rate), 132, y + 4.2);

        // Colored status label
        doc.setFont("helvetica", "bold");
        if (item.status === "LUNAS") {
          doc.setTextColor(successColor[0], successColor[1], successColor[2]);
        } else {
          doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
        }
        doc.text(item.status, 154, y + 4.2);

        // Notes text
        doc.setFont("helvetica", "normal");
        doc.setTextColor(112, 128, 144);
        let trunkNote = item.note;
        if (trunkNote.length > 13) {
          trunkNote = trunkNote.substring(0, 11) + "..";
        }
        doc.text(trunkNote, 175, y + 4.2);

        y += 6.5;
      });

      // Bottom Signature block
      y += 12;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Legal notice line
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.setLineWidth(0.4);
      doc.line(14, y, 196, y);
      y += 6;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text("* Bukti cetak ini dikeluarkan mandiri dari data lokal aplikasi Manajemen Iuran WiFi secara sah.", 14, y);
      doc.text("* Transparansi anggaran dipelihara bersama demi kelancaran prasarana internet RT.", 14, y + 3.5);

      // Sign block
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("Disiapkan oleh,", 145, y);
      doc.text("Bendahara / Pengurus RT Net", 145, y + 4);

      doc.setFont("helvetica", "bold");
      doc.text("___________________________", 145, y + 17);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.text("Sistem Pengurus RT Net", 145, y + 21);

      // Save PDF to download trigger
      doc.save(`Laporan_Bulan_${currentMonthName}_${activeYear}.pdf`);
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("Gagal melakukan ekspor PDF karena masalah internal browser.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9FC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 font-sans">
      {/* Header bar */}
      <div className="bg-slate-900 text-white pt-12 pb-10 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting blobs */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">Matriks Iuran WiFi</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              Tahun {activeYear} • {members.length} Pelanggan
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 relative z-10">
          <button 
            onClick={() => setShowExportModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 border border-emerald-500/20 p-2.5 rounded-xl flex items-center space-x-1.5 transition text-[10px] font-black active:scale-95 text-white cursor-pointer shadow-lg shadow-emerald-600/20 uppercase tracking-widest"
            title="Ekspor PDF"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Ekspor PDF</span>
          </button>
          <button 
            onClick={onCopyReport}
            className="bg-indigo-600 hover:bg-indigo-700 border border-indigo-500/20 p-2.5 rounded-xl flex items-center space-x-1.5 transition text-[10px] font-black active:scale-95 text-white cursor-pointer shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
            title="Salin Laporan"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Rekap WA</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-full overflow-hidden">
        {/* Search filter row */}
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pelanggan..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800 dark:text-slate-105 h-[38px] shadow-xs"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-200/60 dark:bg-slate-900 border border-transparent dark:border-slate-850 p-1 rounded-xl flex max-w-md mx-auto">
          <button
            onClick={() => {
              setSubView("matriks");
              setSelectedMemberIds([]); // clear selection when switching tabs
            }}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              subView === "matriks"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Matriks Iuran
          </button>
          <button
            onClick={() => {
              setSubView("tunggakan");
              setSelectedMemberIds([]); // clear selection when switching tabs
            }}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              subView === "tunggakan"
                ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Belum Lunas ({totalUnpaidRawCount})
          </button>
        </div>

        {/* Rendering Content Views based on active subView tab */}
        <AnimatePresence mode="wait">
          {subView === "matriks" ? (
            <motion.div
              key="matriks"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
            {/* Swipe instruction tooltip banner */}
            <div className="max-w-md mx-auto bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-3 rounded-2xl flex items-start space-x-2 text-[11px] text-indigo-800 dark:text-indigo-300 font-medium">
              <Info className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-extrabold uppercase tracking-wide block text-[10px]">Panduan Centang Iuran:</span>
                <p>1. <span className="font-bold text-slate-900 dark:text-slate-100">Ketuk Centang</span> untuk langsung mengubah Lunas / Belum Lunas.</p>
                <p>2. <span className="font-bold text-slate-900 dark:text-slate-100">Mode Baca:</span> Ketuk status <span className="font-bold text-emerald-600">"Lunas"</span> untuk melihat detail catatan & tanda tangan.</p>
                <p>3. <span className="font-bold text-slate-900 dark:text-slate-100">Bayar Massal:</span> Klik checkbox di sebelah nama pelanggan, lalu gunakan panel aksi di bawah untuk melakukan pelunasan sekaligus.</p>
                <p className="italic text-indigo-600 dark:text-indigo-400 animate-pulse mt-1">👉 Geser tabel matriks iuran ke kanan untuk melihat s.d Desember.</p>
              </div>
            </div>

            {/* Bulk Update Dynamic Control Card */}
            {selectedMemberIds.length > 0 && (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-lg p-4 space-y-3 transition duration-200 animate-in fade-in-50 slide-in-from-bottom-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-400 block font-mono">⚡ Aksi Bayar Massal</span>
                    <span className="text-xs font-bold text-slate-300">
                      {selectedMemberIds.length} pelanggan dipilih
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedMemberIds([])}
                    className="text-slate-400 hover:text-slate-200 text-[10px] font-bold border border-slate-700 transition active:scale-95 px-2.5 py-1 rounded-xl hover:bg-slate-800 cursor-pointer"
                  >
                    Batal Pilih
                  </button>
                </div>
                
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Pilih Bulan Pembayaran:
                    </label>
                    <select
                      value={selectedMonthForBulk}
                      onChange={(e) => setSelectedMonthForBulk(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                    >
                      {MONTH_NAMES.map((mName, mIdx) => (
                        <option key={mIdx} value={mIdx}>
                          {mName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onBulkSetPaid(selectedMemberIds, selectedMonthForBulk);
                      setSelectedMemberIds([]); // Clear selection upon execution
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs px-4 py-2 rounded-xl transition duration-150 active:scale-95 flex items-center space-x-1 cursor-pointer h-[36px] shadow-sm text-white"
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>Lunas Massal</span>
                  </button>
                </div>
              </div>
            )}

            {/* Matrix spreadsheet-style horizontal scroll block */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden max-w-full">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-[1240px]">
                  <colgroup>
                    <col className="w-[200px]" />
                    {Array.from({ length: 12 }).map((_, i) => (
                      <col key={i} className="w-[88px]" />
                    ))}
                  </colgroup>

                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 font-sans border-r border-slate-100 dark:border-slate-800 sticky left-0 bg-slate-50 dark:bg-slate-950 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            checked={filtered.length > 0 && selectedMemberIds.length === filtered.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMemberIds(filtered.map(m => m.id));
                              } else {
                                setSelectedMemberIds([]);
                              }
                            }}
                            className="rounded border-slate-350 dark:border-slate-700 text-[#118EEA] focus:ring-[#118EEA] h-4 w-4 cursor-pointer accent-[#118EEA]"
                            title="Pilih semua pelanggan untuk bayar massal"
                          />
                          <span>Pelanggan WiFi</span>
                        </div>
                      </th>
                      {MONTH_SHORT_NAMES.map((mn, idx) => (
                        <th 
                          key={mn} 
                          className={`px-2 py-4 text-center text-[10px] uppercase tracking-widest font-black font-sans border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${
                            idx === currentMonthIndex 
                              ? "bg-sky-50/80 dark:bg-sky-950/20 text-[#118EEA] dark:text-sky-400" 
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {mn}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                          <div className="flex flex-col items-center space-y-2 opacity-50">
                            <Info className="h-8 w-8" />
                            <p className="font-bold">Tidak ada data pelanggan terdaftar.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map(member => {
                        const pkg = packages.find(p => p.id === member.packageId);
                        const rate = pkg ? pkg.price : fallbackRate;
                        const isSelected = selectedMemberIds.includes(member.id);
                        const dueDay = member.dueDateDay || 10;
                        const isPastDueCurrentMonth = 
                          activeYear === new Date().getFullYear().toString() &&
                          !member.payments?.[currentMonthIndex] &&
                          new Date().getDate() > dueDay;
                        
                        // Count months paid
                        const paidMonthsCount = Object.values(member.payments || {}).filter(v => v === true).length;
                        
                        return (
                          <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition group">
                            {/* Member title column sticky on scroll left */}
                            <td className="px-3 py-4 border-r border-slate-100 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[4px_0_10px_rgba(0,0,0,0.02)] text-left min-w-[180px] max-w-[220px]">
                              <div className="flex items-center space-x-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedMemberIds(prev => [...prev, member.id]);
                                    } else {
                                      setSelectedMemberIds(prev => prev.filter(id => id !== member.id));
                                    }
                                  }}
                                  className="rounded-[6px] border-slate-350 dark:border-slate-700 text-[#118EEA] focus:ring-[#118EEA] h-4.5 w-4.5 shrink-0 cursor-pointer accent-[#118EEA]"
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center space-x-1.5 min-w-0">
                                    <span className="font-black text-slate-800 dark:text-slate-100 truncate text-[11px]" title={member.name}>{member.name}</span>
                                    {isPastDueCurrentMonth && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1.5 mt-0.5 mb-1.5">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                      {pkg ? pkg.speed : "Standar"} • Tgl {dueDay}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                                    <span className="text-[8px] font-black text-[#118EEA] uppercase tracking-tighter">
                                      {paidMonthsCount}/12 Bln
                                    </span>
                                  </div>
                                  
                                  {/* Compact 12-month matrix */}
                                  <div className="flex items-center space-x-[3px] mt-1.5">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                      <div 
                                        key={i} 
                                        className={`w-2.5 h-2.5 rounded-[3px] border ${
                                          member.payments?.[i] 
                                            ? "bg-emerald-500 border-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]" 
                                            : i === currentMonthIndex && new Date().getDate() > dueDay
                                              ? "bg-rose-50 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800 animate-pulse"
                                              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                        }`}
                                        title={`${MONTH_SHORT_NAMES[i]}: ${member.payments?.[i] ? "Lunas" : "Belum"}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Month block columns */}
                            {Array.from({ length: 12 }).map((_, mIndex) => {
                              const isPaid = !!member.payments?.[mIndex];
                              const hasNote = !!member.notes?.[mIndex];
                              const noteText = member.notes?.[mIndex] || "";
                              const isMonthActive = mIndex === currentMonthIndex;

                              return (
                                <td 
                                  key={mIndex} 
                                  className={`p-1 border-r border-slate-50 dark:border-slate-800/40 text-center relative ${
                                    isMonthActive ? "bg-sky-50/10 dark:bg-sky-950/5" : ""
                                  }`}
                                >
                                  <div className="flex flex-col items-center justify-center space-y-1">
                                    {/* Checklist Button */}
                                    <button
                                      type="button"
                                      onClick={() => isPaid ? handleOpenReadMode(member, mIndex) : onTogglePayment(member.id, mIndex)}
                                      onContextMenu={(e) => {
                                        e.preventDefault();
                                        onTogglePayment(member.id, mIndex);
                                      }}
                                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center border transition-all duration-200 relative active:scale-90 cursor-pointer ${
                                        isPaid 
                                          ? "bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-100 dark:shadow-none hover:bg-emerald-600" 
                                          : isMonthActive && new Date().getDate() > dueDay
                                            ? "bg-rose-50 border-rose-200 text-rose-400 hover:bg-rose-100 animate-pulse-slow"
                                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/60 text-slate-300 dark:text-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                                      }`}
                                      title={`${MONTH_NAMES[mIndex]} - ${isPaid ? 'Lunas (Klik untuk Detail)' : 'Belum Lunas'}`}
                                    >
                                      {isPaid ? (
                                        <Check className="h-5 w-5 stroke-[4]" />
                                      ) : (
                                        <span className="text-[10px] font-black opacity-30 select-none">
                                          {MONTH_SHORT_NAMES[mIndex].charAt(0)}
                                        </span>
                                      )}
                                    </button>

                                    {/* Mini Note display button */}
                                    <button
                                      type="button"
                                      onClick={() => onOpenNoteModal(member, mIndex)}
                                      className={`text-[8px] px-1.5 py-0.5 rounded-lg flex items-center justify-center space-x-1 border cursor-pointer select-none w-10 transition-colors ${
                                        hasNote 
                                          ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40 text-indigo-600 font-black" 
                                          : "bg-transparent border-transparent text-slate-200 dark:text-slate-800 hover:text-slate-400 dark:hover:text-slate-600"
                                      }`}
                                    >
                                      <FileText className="h-2.5 w-2.5 shrink-0" />
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>

                  {/* Monthly stats ratios summary row block */}
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 font-sans text-[10px] font-black text-slate-500 dark:text-slate-400">
                      <td className="px-4 py-6 border-r border-slate-100 dark:border-slate-800 sticky left-0 bg-slate-50 dark:bg-slate-955 z-10 shadow-[4px_0_10px_rgba(0,0,0,0.03)] text-left uppercase tracking-widest leading-tight">
                        Ringkasan<br/>Persentase
                      </td>
                      {Array.from({ length: 12 }).map((_, mIdx) => {
                        const stat = monthlyRatios[mIdx] || { paid: 0, pct: 0 };
                        const isCurrent = mIdx === currentMonthIndex;

                        return (
                          <td key={mIdx} className={`px-1 py-3 border-r border-slate-50 dark:border-slate-800/50 text-center font-mono ${isCurrent ? "bg-sky-50/10" : ""}`}>
                            <span className={`block font-black mb-1 ${stat.pct === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                              {stat.paid} Lunas
                            </span>
                            <div className="mx-auto w-10 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${stat.pct === 100 ? "bg-emerald-500" : stat.pct >= 50 ? "bg-indigo-600" : "bg-amber-500"}`} 
                                style={{ width: `${stat.pct}%` }} 
                              />
                            </div>
                            <span className="block mt-1 text-[8px] font-black opacity-60">{stat.pct}%</span>
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Subtab Unpaid & Paid outstanding balances list + WhatsApp reminders */
          <motion.div
            key="tunggakan"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 max-w-md mx-auto"
          >
            {/* Filter buttons inside the WA tab */}
            <div className="flex space-x-2 bg-slate-200/50 p-1 rounded-xl border border-slate-100">
              <button
                type="button"
                onClick={() => setWaFilter("belum_lunas")}
                className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  waFilter === "belum_lunas"
                    ? "bg-white text-rose-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-705"
                }`}
              >
                <span>Tunggakan</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans font-extrabold ${
                  waFilter === "belum_lunas" ? "bg-rose-100 text-rose-800" : "bg-slate-200 text-slate-600"
                }`}>
                  {whatsappMembersList.filter(m => !m.isFullyPaid).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setWaFilter("lunas")}
                className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  waFilter === "lunas"
                    ? "bg-white text-emerald-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-705"
                }`}
              >
                <span>Lunas</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans font-extrabold ${
                  waFilter === "lunas" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                }`}>
                  {whatsappMembersList.filter(m => m.isFullyPaid).length}
                </span>
              </button>
            </div>

            {/* Bulk Action Tagihan Otomatis */}
            {waFilter === "belum_lunas" && filteredWhatsAppList.length > 0 && (
              <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-4 rounded-2xl text-white shadow-lg space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-tight">Kirim Tagihan Otomatis</h3>
                    <p className="text-[10px] font-bold text-white/80">Terdapat {filteredWhatsAppList.length} pelanggan belum lunas.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      const firstUnsent = filteredWhatsAppList.find(m => !sentWaList.includes(m.id));
                      if (firstUnsent) {
                        window.open(firstUnsent.waUrl, "_blank");
                        setSentWaList(prev => [...prev, firstUnsent.id]);
                      } else {
                        alert("Semua pelanggan di daftar ini sudah dikirimi pesan dalam sesi ini.");
                      }
                    }}
                    className="flex-1 bg-white text-rose-600 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Tagih Berikutnya</span>
                  </button>
                  <button 
                    onClick={() => setSentWaList([])}
                    className="bg-rose-700/40 p-2.5 rounded-xl border border-white/20 text-white hover:bg-rose-700/60 transition active:scale-95"
                    title="Reset Status Terkirim"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <div className="bg-black/10 rounded-lg p-1.5">
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-500" 
                      style={{ width: `${(sentWaList.length / filteredWhatsAppList.length) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] font-bold text-white/70 uppercase">
                    <span>Progres Pengiriman</span>
                    <span>{sentWaList.length} / {filteredWhatsAppList.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Template Customizer Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-850 dark:text-slate-150 uppercase tracking-wide">Kustomisasi Pesan WA</h3>
                    <p className="text-[9.5px] text-slate-400 dark:text-slate-500 font-bold">Sesuaikan format template pengingat</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomizingTemplates(!isCustomizingTemplates)}
                  className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 px-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700 transition active:scale-95 cursor-pointer text-[10px] font-black text-[#118EEA] dark:text-sky-400 flex items-center space-x-1"
                >
                  <span>{isCustomizingTemplates ? "Selesai" : "Atur Template"}</span>
                </button>
              </div>

              {isCustomizingTemplates && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Gaya Bahasa / Vibe:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["sopan", "santai", "tegas", "custom"] as const).map((tType) => (
                        <button
                          key={tType}
                          type="button"
                          onClick={() => setSelectedTemplate(tType)}
                          className={`py-1 rounded-xl text-[10px] font-extrabold text-center uppercase tracking-wider border cursor-pointer transition-all ${
                            selectedTemplate === tType
                              ? "bg-[#118EEA] text-white border-[#118EEA] shadow-xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-550 dark:text-slate-400 border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                          }`}
                        >
                          {tType === "sopan" ? "Sopan" : tType === "santai" ? "Santai" : tType === "tegas" ? "Tegas" : "Kustom"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedTemplate === "custom" && (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Tulis Template Pesan:
                        </label>
                        <textarea
                          rows={4}
                          value={customTemplateText}
                          onChange={(e) => setCustomTemplateText(e.target.value)}
                          placeholder="Tulis pesan Anda disini..."
                          className="w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-[10.5px] font-semibold text-slate-800 dark:text-slate-105 placeholder-slate-400 focus:ring-1 focus:ring-[#118EEA] focus:outline-none focus:border-[#118EEA] font-mono leading-relaxed resize-y"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[8px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-500">
                          Variabel (Klik untuk masukkan):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { tag: "{nama}", desc: "Nama Pelanggan" },
                            { tag: "{bulan}", desc: "Bulan Tunggakan" },
                            { tag: "{tagihan}", desc: "Total Tagihan" },
                            { tag: "{tahun}", desc: "Tahun" },
                          ].map((v) => (
                            <button
                              key={v.tag}
                              type="button"
                              onClick={() => setCustomTemplateText(prev => prev + v.tag)}
                              className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-150/40 dark:border-emerald-900/30 font-mono text-[9px] px-2 py-0.5 rounded-lg cursor-pointer transition font-extrabold"
                              title={v.desc}
                            >
                              {v.tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-2.5 border border-slate-100 dark:border-slate-850 space-y-1">
                    <span className="block text-[8px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">Pratinjau Pesan WA:</span>
                    <p className="text-[10px] text-slate-600 dark:text-slate-350 font-medium whitespace-pre-wrap leading-relaxed">
                      {selectedTemplate === "custom" && !customTemplateText ? (
                        <span className="italic text-slate-400">Silakan mulailah mengetik pesan kustom Anda...</span>
                      ) : (
                        getPersonalizedMessage(
                          "Budi Santoso", 
                          "Januari, Februari", 
                          formatRupiah(100000), 
                          activeYear, 
                          formatRupiah(50000), 
                          false
                        )
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1 pt-1">
              {waFilter === "belum_lunas" ? "⚠️ Daftar Pelanggan WiFi dengan Tunggakan" : "✅ Daftar Pelanggan WiFi Lunas Sepenuhnya"}
            </span>

            {filteredWhatsAppList.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 space-y-2 animate-fade-in">
                <Check className="h-8 w-8 mx-auto text-emerald-500 bg-emerald-50 p-1.5 rounded-full" />
                <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Tidak Ada Pelanggan</p>
                <p className="text-[10px]">Silakan sesuaikan kata kunci pencarian atau status filter iuran.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredWhatsAppList.map(m => {
                  const dueDay = m.dueDateDay || 10;
                  const isPastDueCurrentMonth = 
                    activeYear === new Date().getFullYear().toString() &&
                    !m.payments?.[currentMonthIndex] &&
                    new Date().getDate() > dueDay;

                  // Calculate dynamically selected months for unpaid reminders
                  const currentChosenMonths = !m.isFullyPaid 
                    ? (selectedMonthsPerMember[m.id] ?? m.unpaidMonths)
                    : m.unpaidMonths;
                  const chosenTotalOwed = currentChosenMonths.length * m.rate;
                  const chosenMonthsStr = currentChosenMonths.map((idx: number) => MONTH_NAMES[idx]).join(", ");

                  const dynamicResiText = `*RT NET - RESI TAGIHAN IURAN WIFI* 🧾\n` +
                         `----------------------------------------\n` +
                         `Yth. *${m.name}*\n\n` +
                         `Pemberitahuan resmi mengenai iuran bulanan WiFi RT Net Anda untuk tahun *${activeYear}*.\n\n` +
                         `*Rincian Tagihan:*\n` +
                         `• *Pelanggan  :* ${m.name}\n` +
                         `• *Bulan Iuran :* ${chosenMonthsStr || "(Belum ada bulan terpilih)"}\n` +
                         `• *Tarif Iuran :* ${formatRupiah(m.rate)} / bulan\n` +
                         `• *Total Iuran :* *${formatRupiah(chosenTotalOwed)}*\n` +
                         `• *Status     :* BELUM LUNAS ⚠️\n` +
                         `----------------------------------------\n` +
                         `Mohon kesediaannya untuk menyelesaikan pembayaran secara langsung ke pengurus RT atau via Transfer.\n\n` +
                         `_Harap simpan resi tagihan resmi ini._\n` +
                         `_Sistem WiFi RT Net_ 🙏🏼`;

                  let cleanedPhone = m.phone || "";
                  cleanedPhone = cleanedPhone.replace(/\D/g, "");
                  if (cleanedPhone.startsWith("0")) {
                    cleanedPhone = "62" + cleanedPhone.slice(1);
                  }

                  const dynamicResiWaUrl = cleanedPhone 
                    ? `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(dynamicResiText)}`
                    : `https://wa.me/?text=${encodeURIComponent(dynamicResiText)}`;

                  const isSent = sentWaList.includes(m.id);

                  return (
                    <div key={m.id} className={`bg-white p-4 rounded-2xl border shadow-xs space-y-3 transition-opacity ${isSent ? 'opacity-60 grayscale-[0.3]' : 'border-slate-150'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-slate-800 text-xs tracking-tight">{m.name}</h3>
                            {isPastDueCurrentMonth && (
                              <span className="inline-flex items-center gap-0.5 text-[8.5px] bg-rose-50 border border-rose-100 text-rose-600 px-1.5 py-0.2 rounded font-black animate-pulse" title={`Jatuh tempo (tgl ${dueDay}) terlampaui!`}>
                                <AlertCircle className="h-2.5 w-2.5" />
                                <span>Jatuh Tempo (Tgl {dueDay})</span>
                              </span>
                            )}
                            {hasConsecutiveUnpaid(m.payments) && (
                              <span className="inline-flex items-center gap-0.5 text-[8.5px] bg-rose-50 border border-rose-100 text-rose-600 px-1.5 py-0.2 rounded font-black animate-pulse" title="Tunggakan 2+ bulan berturut-turut!">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                <span>2+ Bln</span>
                              </span>
                            )}
                          </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded">
                            {m.pkg ? m.pkg.speed : "Standar"} ({formatRupiah(m.rate)})
                          </span>
                          {m.phone ? (
                            <span className="text-[9px] text-[#118EEA] font-extrabold">{m.phone}</span>
                          ) : (
                            <span className="text-[8px] text-amber-600 bg-amber-50 px-1 py-0.2 rounded font-extrabold">No HP Kosong</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right font-sans">
                        {m.isFullyPaid ? (
                          <button 
                            onClick={() => handleOpenReadMode(m as unknown as Member, currentMonthIndex)}
                            className="text-right focus:outline-none group/status"
                          >
                            <span className="block text-[8px] font-bold text-emerald-500 uppercase tracking-wider group-hover/status:text-sky-500 transition-colors">STATUS (KETUK DETAIL)</span>
                            <span className="text-emerald-600 font-black text-xs leading-none group-hover/status:text-sky-600 transition-colors">Lunas (12 Bln)</span>
                          </button>
                        ) : (
                          <>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">TOTAL TAGIHAN</span>
                            <span className="text-rose-600 font-black text-xs leading-none">{formatRupiah(m.totalOwed)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        {m.isFullyPaid ? "RINCIAN KONTRIBUSI TAHUNAN" : `TUNGGAKAN BULANAN (${m.unpaidMonths.length} Bulan)`}
                      </span>
                      {m.isFullyPaid ? (
                        <div className="text-[11px] font-extrabold text-slate-600 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl flex items-center justify-between cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => handleOpenReadMode(m as unknown as Member, currentMonthIndex)}>
                          <span>Donasi / Tarif Total:</span>
                          <span className="text-emerald-700 font-mono font-black">{formatRupiah(m.totalPaid)}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1 font-sans">
                            {m.unpaidMonths.map((monthIndex) => {
                              const hasNote = !!m.notes?.[monthIndex];
                              return (
                                <span 
                                  key={monthIndex} 
                                  className="text-[8.5px] font-black tracking-wide px-2 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-700 uppercase flex items-center gap-1"
                                  title={hasNote ? `Catatan: ${m.notes[monthIndex]}` : undefined}
                                >
                                  {MONTH_SHORT_NAMES[monthIndex]}
                                  {hasNote && <FileText className="h-2.5 w-2.5 text-rose-400 shrink-0" />}
                                </span>
                              );
                            })}
                          </div>
                          
                          {/* Paid months in current year (if any) for quick read mode access */}
                          {m.paidMonths.length > 0 && (
                            <div className="flex flex-wrap gap-1 font-sans">
                              {m.paidMonths.map((monthIndex) => (
                                <button 
                                  key={monthIndex} 
                                  onClick={() => handleOpenReadMode(m as unknown as Member, monthIndex)}
                                  className="text-[8.5px] font-black tracking-wide px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 uppercase flex items-center gap-1 hover:bg-emerald-100 transition-colors active:scale-90 cursor-pointer"
                                  title="Lihat Detail Pembayaran"
                                >
                                  {MONTH_SHORT_NAMES[monthIndex]}
                                  <Check className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dynamic Month Selector Panel - ONLY for unpaid customers so they can configure which months to remind */}
                      {!m.isFullyPaid && (
                        <div className="bg-slate-55/80 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 mt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8.5px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                              Pilih Bulan yang Ingin Diingatkan (Jan-Des):
                            </span>
                            <span className="text-[8.5px] font-black text-[#118EEA]">
                              {currentChosenMonths.length} Terpilih
                            </span>
                          </div>
                          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                            {MONTH_SHORT_NAMES.map((mShort, index) => {
                              const isSelected = currentChosenMonths.includes(index);
                              const isActuallyUnpaid = m.unpaidMonths.includes(index);
                              return (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => toggleMonthSelection(m.id, index, m.unpaidMonths)}
                                  className={`py-1 text-[8.5px] font-bold uppercase text-center rounded-lg border transition cursor-pointer select-none relative ${
                                    isSelected
                                      ? "bg-emerald-500 border-emerald-500 text-white font-extrabold shadow-2xs"
                                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-705"
                                  }`}
                                  title={`${isActuallyUnpaid ? "Belum Lunas" : "Lunas"}`}
                                >
                                  {mShort}
                                  {isActuallyUnpaid && !isSelected && (
                                    <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-rose-500 rounded-full" title="Ada Tunggakan" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                      <span className="text-[9.5px] text-slate-400 font-medium">
                        {m.phone 
                          ? m.isFullyPaid ? "Kirim ucapan terima kasih & nota lunas." : `Kirim resi tagihan resmi WiFi untuk ${currentChosenMonths.length} bulan.` 
                          : "⚠️ Kirim manual (pilih kontak Anda sendiri di WhatsApp)"}
                      </span>

                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {!m.payments?.[currentMonthIndex] ? (
                             <a
                               href={dynamicResiWaUrl}
                               target="_blank"
                               rel="noopener noreferrer"
                               onClick={() => setSentWaList(prev => [...prev, m.id])}
                               className={`inline-flex items-center justify-center space-x-1.5 text-white font-black text-[10px] py-1.5 px-3.5 rounded-xl transition shadow-xs active:scale-95 text-center cursor-pointer ${
                                 currentChosenMonths.length > 0
                                   ? isSent ? "bg-slate-500 hover:bg-slate-600" : "bg-emerald-600 hover:bg-emerald-700"
                                   : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 pointer-events-none cursor-not-allowed"
                               }`}
                               title="Kirim pemberitahuan resmi berbentuk kwitansi atau resi tagihan WiFi"
                             >
                               <MessageCircle className="h-3.5 w-3.5 text-white animate-pulse" />
                               <span>{isSent ? "Kirim Ulang" : "Kirim Tagihan"}</span>
                             </a>
                        ) : (
                          <a
                            href={m.waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center space-x-1.5 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-xl transition shadow-xs active:scale-95 text-center bg-emerald-600 hover:bg-emerald-750"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>Kirim Nota Terima Kasih</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monthly PDF Export Selection Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xl max-w-md w-full relative space-y-4 text-slate-800 dark:text-slate-100"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                    <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-850 dark:text-white tracking-tight uppercase">Pilih Bulan Laporan PDF</h3>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                      Tahun {activeYear} • Format Cetak A4
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 rounded-lg transition shrink-0 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Informative description */}
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                Laporan PDF akan memuat rekapitulasi data iuran seluruh pelanggan, rincian pembayaran kas, sisa tunggakan, serta berita pengesahan resmi bulanan.
              </div>

              {/* Grid of 12 Months selection */}
              <div>
                <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Pilih Bulan Pengesahan</span>
                <div className="grid grid-cols-3 gap-2">
                  {MONTH_NAMES.map((name, index) => {
                    const isSelected = selectedMonthForExport === index;
                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedMonthForExport(index)}
                        className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold transition-all border outline-none cursor-pointer flex flex-col justify-center items-center ${
                          isSelected
                            ? "bg-[#118EEA] border-[#118EEA] text-white shadow-xs scale-102"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-100/60 dark:border-slate-850 hover:bg-slate-100/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="text-[9px] font-extrabold uppercase opacity-80">{MONTH_SHORT_NAMES[index]}</span>
                        <span className="text-[10px] truncate max-w-full font-bold">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportPDF(selectedMonthForExport);
                    setShowExportModal(false);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Ekspor Bulan {MONTH_NAMES[selectedMonthForExport]}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mode Baca / Detail Pembayaran Modal */}
      <AnimatePresence>
        {showReadMode && readModeData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 shadow-2xl max-w-sm w-full relative space-y-5 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl">
                    <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850 dark:text-white tracking-tight uppercase leading-none">Detail Pembayaran</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">Mode Baca Saja</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReadMode(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                  <div>
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Nama Pelanggan</span>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase">{readModeData.member.name}</p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Bulan Tagihan</span>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{MONTH_NAMES[readModeData.monthIndex]} {activeYear}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Status</span>
                      <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-lg uppercase tracking-tighter shadow-sm shadow-emerald-200 dark:shadow-none">LUNAS</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Waktu Pembayaran</span>
                    <p className="text-[10px] font-medium text-slate-800 dark:text-slate-100 uppercase font-mono tracking-tighter">
                      {formatATMDate(readModeData.member.paymentTimestamps?.[readModeData.monthIndex] || `${activeYear}-${String(readModeData.monthIndex + 1).padStart(2, '0')}-10`)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center space-x-1.5">
                    <FileText className="h-3 w-3" />
                    <span>Catatan Pembayaran:</span>
                  </span>
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl min-h-[60px] text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    {readModeData.member.notes?.[readModeData.monthIndex] || "Tidak ada catatan untuk pembayaran ini."}
                  </div>
                </div>

                {readModeData.member.signatures?.[readModeData.monthIndex] && (
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center space-x-1.5">
                      <Check className="h-3 w-3" />
                      <span>Bukti Tanda Tangan:</span>
                    </span>
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl p-2 flex items-center justify-center overflow-hidden">
                      <img 
                        src={readModeData.member.signatures[readModeData.monthIndex]} 
                        alt="Tanda Tangan" 
                        className="max-h-24 dark:invert opacity-80"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowReadMode(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
              >
                Tutup Detail
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
};

