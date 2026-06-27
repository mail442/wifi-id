import { Database } from "./types";

export const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const MONTH_SHORT_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MEI", "JUN",
  "JUL", "AGU", "SEP", "OKT", "NOV", "DES"
];

export const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatATMDate = (dateString?: string) => {
  const date = dateString ? new Date(dateString) : new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayName = days[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${dayName}, ${day} ${month} ${year} | ${hours}:${minutes}:${seconds} WIB`;
};

export const defaultPackages = [
  { id: "pkg-hemat", name: "Paket Hemat", speed: "10 Mbps", price: 125000, ispCost: 110000 },
  { id: "pkg-standar", name: "Paket Standar", speed: "20 Mbps", price: 175000, ispCost: 150000 },
  { id: "pkg-premium", name: "Paket Turbo", speed: "50 Mbps", price: 250000, ispCost: 200000 }
];

export const getSeedExpenses = (year: string) => [
  { id: "exp-1", date: `${year}-06-01`, description: "Sewa Bandwidth ISP Indihome", amount: 150000, category: "SETORAN_ISP" as any },
  { id: "exp-2", date: `${year}-06-10`, description: "Beli Connector RJ45 1 Pack", amount: 35000, category: "OPERASIONAL" as any }
];

export const generateWhatsAppReportText = (activeYear: string, db: Database, rate: number): string => {
  const yearObj = db[activeYear] || { members: [], monthlyRate: 20000 };
  const members = yearObj.members || [];
  const pkgs = yearObj.packages || defaultPackages;

  if (members.length === 0) {
    return "";
  }

  let text = `*LAPORAN IURAN WIFI - TAHUN ${activeYear}*\n`;
  text += `📶 *Kecepatan WiFi Berbagi*\n`;
  text += `💵 *Tarif Standar:* ${formatRupiah(rate)} / bulan\n`;
  text += `📅 *Tanggal Laporan:* ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}\n`;
  text += `==================================\n\n`;

  members.forEach((m, idx) => {
    const matchedPkg = pkgs.find(p => p.id === m.packageId);
    const memberRate = matchedPkg ? matchedPkg.price : rate;
    const totalPaid = Object.values(m.payments || {}).filter(Boolean).length;
    const totalOwed = (12 - totalPaid) * memberRate;

    let statusMsg = "";
    if (totalPaid === 12) {
      statusMsg = `✅ *LUNAS PENUH* s.d. Desember`;
    } else if (totalPaid === 0) {
      statusMsg = `❌ *BELUM BAYAR* (Tunggakan: ${formatRupiah(totalOwed)})`;
    } else {
      const paidMonthsList: string[] = [];
      MONTH_NAMES.forEach((mn, index) => {
        if (m.payments?.[index]) paidMonthsList.push(mn.slice(0, 3));
      });
      statusMsg = `⏳ *Lunas ${totalPaid}/12 Bulan* (${paidMonthsList.join(", ")})\n    (Tunggakan: ${formatRupiah(totalOwed)})`;
    }

    const memberNotesList: string[] = [];
    MONTH_NAMES.forEach((mn, index) => {
      if (m.notes?.[index]) {
        memberNotesList.push(`${mn.slice(0, 3)}: "${m.notes[index]}"`);
      }
    });
    const notesMsg = memberNotesList.length > 0 ? `\n    📝 *Catatan:* ${memberNotesList.join(", ")}` : "";

    text += `${idx + 1}. *${m.name}*\n    ${statusMsg}${notesMsg}\n\n`;
  });

  let totalPaymentsCount = 0;
  let grandTotalCash = 0;
  members.forEach(m => {
    const matchedPkg = pkgs.find(p => p.id === m.packageId);
    const memberRate = matchedPkg ? matchedPkg.price : rate;
    for (let i = 0; i < 12; i++) {
      if (m.payments?.[i]) {
        totalPaymentsCount++;
        grandTotalCash += memberRate;
      }
    }
  });

  const customIncomesVal = yearObj.customIncomes?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const totalIncomesCombined = grandTotalCash + customIncomesVal;

  text += `==================================\n`;
  text += `💰 *Lunas Iuran Member:* ${formatRupiah(grandTotalCash)}\n`;
  if (customIncomesVal > 0) {
    text += `➕ *Pendapatan Lain:* ${formatRupiah(customIncomesVal)}\n`;
  }
  text += `⭐️ *Total Kas Terkumpul:* ${formatRupiah(totalIncomesCombined)}\n\n`;
  text += `_Terima kasih atas kerja sama Anda untuk kelancaran koneksi WiFi bersama!_ 🙏✨`;

  return text;
};
