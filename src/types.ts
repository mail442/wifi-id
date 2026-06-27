export interface WifiPackage {
  id: string;
  name: string;
  price: number;
  speed: string; // e.g., "20 Mbps"
  ispCost?: number; // Added: Cost paid to ISP for this package
}

export interface IncomeRecord {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
}

export type ExpenseCategory = 'OPERASIONAL' | 'SETORAN_ISP' | 'PERBAIKAN' | 'LAIN_LAIN';

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: ExpenseCategory;
}

export interface Member {
  id: string;
  name: string;
  phone?: string;
  packageId?: string; // Links to WifiPackage.id
  payments: { [monthIndex: number]: boolean }; // monthIndex (0..11) mapped to boolean
  paymentTimestamps?: { [monthIndex: number]: string }; // Added: ISO timestamp of payment
  notes?: { [monthIndex: number]: string }; // monthIndex (0..11) mapped to custom note string
  signatures?: { [monthIndex: number]: string }; // monthIndex (0..11) mapped to base64 signature string
  routerIp?: string; // Optional Router IP Address
  dueDateDay?: number; // Optional custom due date day of the month (1-31), defaults to 10.
  status?: "AKTIF" | "TERISOLIR" | "NONAKTIF"; // Added: Connection status
  setoranIsp?: number; // Added: ISP deposit burden per member
}

export interface TroubleTicket {
  id: string;
  memberId: string;
  memberName: string;
  type: "WiFi Lemot" | "LOS Merah/Kabel Putus" | "Router Mati" | "Lainnya";
  description: string;
  urgency: "Biasa" | "Penting" | "Darurat";
  status: "Pending" | "Diproses" | "Selesai";
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

export type AuditAction = 'PAYMENT_CONFIRMED' | 'PAYMENT_CANCELLED' | 'BULK_PAYMENT' | 'ISP_DEPOSIT';

export interface AuditLog {
  id: string;
  timestamp: string; // ISO String
  action: AuditAction;
  details: string;
}

export interface YearData {
  members: Member[];
  monthlyRate: number; // e.g., 20000
  packages?: WifiPackage[];
  customIncomes?: IncomeRecord[];
  expenses?: ExpenseRecord[];
  tickets?: TroubleTicket[];
  paymentLogs?: AuditLog[]; // Added: History log for payment changes
  autoBillingEnabled?: boolean; // Added: Auto-billing master switch
}

export interface Database {
  [year: string]: YearData;
}

export interface AdminUser {
  uid?: string;
  name: string;
  email: string;
  pin: string;
  address?: string;
  photoUrl?: string;
}
