
import type { CallCenter, User, UserRole, Invoice, InvoiceLineItem, InvoiceStatus, BillingRateType } from "@/types";

export const MOCK_GLOBAL_CALL_CENTERS: CallCenter[] = [
  { 
    id: "cc1", 
    name: "Main Call Center HQ", 
    location: "New York",
    status: "active",
    billingConfig: {
      rateType: "per_month",
      amount: 5, // $5 per bot per month
      currency: "USD"
    }
  },
  { 
    id: "cc2", 
    name: "West Coast Operations", 
    location: "California",
    status: "active",
    billingConfig: {
      rateType: "per_call",
      amount: 0.02, // $0.02 per call
      currency: "USD"
    }
  },
  { 
    id: "cc3", 
    name: "EMEA Support Hub", 
    location: "London",
    status: "inactive",
    billingConfig: {
      rateType: "per_hour",
      amount: 0.5, // $0.50 per bot active hour
      currency: "USD"
    }
  },
];

export const MOCK_USERS: User[] = [
  {
    id: "user-super-admin",
    email: "super@example.com",
    name: "Super Admin",
    role: "SUPER_ADMIN",
  },
  {
    id: "user-cc-admin-1",
    email: "ccadmin1@example.com",
    name: "CC Admin (HQ)",
    role: "CALL_CENTER_ADMIN",
    assignedCallCenterIds: ["cc1"],
  },
  {
    id: "user-cc-admin-2",
    email: "ccadmin2@example.com",
    name: "CC Admin (West + EMEA)",
    role: "CALL_CENTER_ADMIN",
    assignedCallCenterIds: ["cc2", "cc3"],
  },
  {
    id: "user-design-admin-1",
    email: "design1@example.com",
    name: "Design Admin (HQ)",
    role: "DESIGN_ADMIN",
    assignedCallCenterIds: ["cc1"],
  },
  {
    id: "user-design-admin-2",
    email: "design2@example.com",
    name: "Design Admin (West)",
    role: "DESIGN_ADMIN",
    assignedCallCenterIds: ["cc2"],
  },
];

const generateMockLineItems = (basePrice: number): InvoiceLineItem[] => {
  const quantity = Math.floor(Math.random() * 50) + 100; // 100-149 units
  const unitPrice = basePrice;
  return [
    {
      id: `li-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      description: "Bot Usage Charges (Details approximated for mock)",
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: quantity * unitPrice,
    }
  ];
};

const calculateTotals = (items: InvoiceLineItem[], taxRate: number = 0.05) => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
};


const createInvoice = (id: string, callCenterId: string, invoiceNumber: string, issueDate: Date, dueDate: Date, status: InvoiceStatus, baseLineItemPrice: number, notes?: string): Invoice => {
  const items = generateMockLineItems(baseLineItemPrice);
  const { subtotal, taxAmount, total } = calculateTotals(items);
  return {
    id,
    callCenterId,
    invoiceNumber,
    issueDate: issueDate.toISOString(),
    dueDate: dueDate.toISOString(),
    items,
    subtotal,
    taxRate: 0.05,
    taxAmount,
    total,
    status,
    paidDate: status === "paid" ? new Date(issueDate.getTime() + Math.random() * (dueDate.getTime() - issueDate.getTime())).toISOString() : undefined,
    notes,
  };
};

export let MOCK_INVOICES: Invoice[] = [
  createInvoice("inv1", "cc1", "INV-2024-001", new Date("2024-07-01"), new Date("2024-07-31"), "paid", 5, "Payment for July 2024 services."),
  createInvoice("inv2", "cc1", "INV-2024-002", new Date("2024-08-01"), new Date("2024-08-31"), "pending", 5, "Payment for August 2024 services."),
  createInvoice("inv3", "cc2", "INV-2024-003", new Date("2024-07-05"), new Date("2024-08-04"), "paid", 0.02, "Usage charges for July."),
  createInvoice("inv4", "cc2", "INV-2024-004", new Date("2024-08-05"), new Date("2024-09-04"), "pending", 0.02),
  createInvoice("inv5", "cc3", "INV-2024-005", new Date("2024-06-15"), new Date("2024-07-15"), "overdue", 0.5, "Urgent: Payment overdue."),
  createInvoice("inv6", "cc3", "INV-2024-006", new Date("2024-07-15"), new Date("2024-08-15"), "draft", 0.5),
];
