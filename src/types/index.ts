export type UserRole = "SUPER_ADMIN" | "CALL_CENTER_ADMIN" | "DESIGN_ADMIN";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  assignedCallCenterIds?: string[]; // Relevant for CALL_CENTER_ADMIN and DESIGN_ADMIN
}

export type BillingRateType = "per_call" | "per_hour" | "per_day" | "per_month";
export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled";

export interface CallCenter {
  id: string;
  name: string;
  location?: string;
  billingConfig?: {
    rateType: BillingRateType;
    amount: number; // e.g., 0.01 for per_call, 10 for per_hour
    currency: string; // e.g., "USD"
  };
}

export interface ScriptVariant {
  id: string;
  name: string;
  content: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "archived" | "draft";
  targetAudience: string;
  callObjective: string;
  createdDate: string;
  callCenterId: string;
  conversionRate?: number;
  masterScript?: string;
  scriptVariants?: ScriptVariant[];
}

export interface Voice {
  id: string;
  name: string;
  provider?: string;
  settings?: Record<string, any>;
  callCenterId: string;
}

export interface Agent {
  id: string;
  name: string;
  campaignId: string;
  scriptVariantId: string;
  voiceId: string;
  callCenterId: string;
  performanceMetric?: number;
}

export interface Bot {
  id: string;
  name: string;
  campaignId: string;
  agentId: string;
  status: "active" | "inactive" | "error";
  creationDate: string;
  callCenterId: string;
  lastActivity?: string;
}

export interface Script {
  id: string;
  name: string;
  content: string;
  isMaster: boolean;
  parentId?: string;
  createdDate: string;
  campaignId: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  callCenterId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxRate?: number; // Optional tax rate as a percentage (e.g., 0.07 for 7%)
  taxAmount?: number;
  total: number;
  status: InvoiceStatus;
  paidDate?: string;
  notes?: string;
  // paymentMethod?: string; // Example: "Credit Card ending in 1234"
  // transactionId?: string; // Example: Payment gateway transaction ID
}