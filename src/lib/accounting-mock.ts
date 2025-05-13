import { MOCK_INVOICES as initialInvoices, MOCK_GLOBAL_CALL_CENTERS } from './mock-data';
import type { Invoice, InvoiceStatus, CallCenter, BillingRateType, InvoiceLineItem } from '@/types';

let invoices: Invoice[] = [...initialInvoices]; // Make a mutable copy

export const getAllInvoices = (): Invoice[] => {
  return [...invoices];
};

export const getInvoicesByCallCenterId = (callCenterId: string): Invoice[] => {
  return invoices.filter(inv => inv.callCenterId === callCenterId);
};

export const getInvoiceById = (invoiceId: string): Invoice | undefined => {
  return invoices.find(inv => inv.id === invoiceId);
};

export const updateInvoiceStatus = (invoiceId: string, status: InvoiceStatus): Invoice | undefined => {
  const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
  if (invoiceIndex > -1) {
    invoices[invoiceIndex].status = status;
    if (status === 'paid') {
      invoices[invoiceIndex].paidDate = new Date().toISOString();
    } else {
      invoices[invoiceIndex].paidDate = undefined;
    }
    return invoices[invoiceIndex];
  }
  return undefined;
};

// Simplified mock usage calculation
const calculateMockUsage = (callCenter: CallCenter, periodStart: Date, periodEnd: Date): InvoiceLineItem[] => {
  const { billingConfig } = callCenter;
  if (!billingConfig) return [];

  // Simulate bot count - in a real app, this would come from bot tracking data
  const mockBotCount = Math.floor(Math.random() * 50) + 10; // 10-59 bots
  let quantity = 0;
  let description = "";
  const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 3600 * 24));

  switch (billingConfig.rateType) {
    case "per_call":
      quantity = mockBotCount * (Math.floor(Math.random() * 500) + 1000); // 1000-1499 calls per bot
      description = `Per Call Usage (${quantity} calls at ${billingConfig.amount} ${billingConfig.currency} each)`;
      break;
    case "per_hour":
      quantity = mockBotCount * daysInPeriod * (Math.floor(Math.random() * 4) + 4); // 4-7 active hours per day per bot
      description = `Per Hour Usage (${quantity} hours at ${billingConfig.amount} ${billingConfig.currency} each)`;
      break;
    case "per_day":
      quantity = mockBotCount * daysInPeriod;
      description = `Per Day Usage (${quantity} bot-days at ${billingConfig.amount} ${billingConfig.currency} each)`;
      break;
    case "per_month":
      // Assuming period is roughly a month for simplicity
      quantity = mockBotCount; 
      description = `Per Month Usage (${quantity} bots at ${billingConfig.amount} ${billingConfig.currency} each)`;
      break;
    default:
      return [];
  }

  const unitPrice = billingConfig.amount;
  return [{
    id: `li-gen-${Date.now()}`,
    description,
    quantity,
    unitPrice,
    totalPrice: quantity * unitPrice,
  }];
};

const calculateTotals = (items: InvoiceLineItem[], taxRate: number = 0.05) => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
};

export const generateNewInvoice = (callCenterId: string, issueDate: Date, dueDate: Date, notes?: string): Invoice | { error: string } => {
  const callCenter = MOCK_GLOBAL_CALL_CENTERS.find(cc => cc.id === callCenterId);
  if (!callCenter) return { error: "Call center not found." };
  if (!callCenter.billingConfig) return { error: "Call center has no billing configuration."};

  const periodStart = new Date(issueDate);
  periodStart.setDate(1); // Assume invoice is for the month of the issueDate

  const items = calculateMockUsage(callCenter, periodStart, issueDate); // issueDate acts as periodEnd for simplicity
  if (items.length === 0) return { error: "Could not calculate usage for invoice."};
  
  const { subtotal, taxAmount, total } = calculateTotals(items);

  const newInvoice: Invoice = {
    id: `inv-${Date.now()}`,
    callCenterId,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
    issueDate: issueDate.toISOString(),
    dueDate: dueDate.toISOString(),
    items,
    subtotal,
    taxRate: 0.05,
    taxAmount,
    total,
    status: "pending",
    notes,
  };
  invoices.push(newInvoice);
  return newInvoice;
};

// Function to update billing config for a call center (mock)
export const updateCallCenterBillingConfigInMock = (
  callCenterId: string, 
  config: CallCenter['billingConfig']
): CallCenter | undefined => {
  const ccIndex = MOCK_GLOBAL_CALL_CENTERS.findIndex(cc => cc.id === callCenterId);
  if (ccIndex > -1) {
    MOCK_GLOBAL_CALL_CENTERS[ccIndex].billingConfig = config;
    // In a real app, this would also update the CallCenterContext's source of truth
    // For now, we assume CallCenterContext will re-fetch or use this mock data.
    return MOCK_GLOBAL_CALL_CENTERS[ccIndex];
  }
  return undefined;
};