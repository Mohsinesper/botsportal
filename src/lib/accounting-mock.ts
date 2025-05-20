
import { MOCK_INVOICES as initialInvoices, MOCK_GLOBAL_CALL_CENTERS } from './mock-data';
import type { Invoice, InvoiceStatus, CallCenter, BillingRateType, InvoiceLineItem } from '@/types';
import { format, getMonth, getYear, startOfMonth, endOfDay, differenceInCalendarDays } from 'date-fns';

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
  // Calculate days in period, ensuring it's at least 1
  const daysInPeriod = Math.max(1, differenceInCalendarDays(endOfDay(periodEnd), startOfMonth(periodStart)) + 1);
  const periodFormatted = format(periodStart, "MMMM yyyy");


  switch (billingConfig.rateType) {
    case "per_call":
      quantity = mockBotCount * (Math.floor(Math.random() * 500) + 1000); // 1000-1499 calls per bot for the period
      description = `Per Call Usage (${quantity} calls at ${billingConfig.amount} ${billingConfig.currency} each for ${periodFormatted})`;
      break;
    case "per_hour":
      quantity = mockBotCount * daysInPeriod * (Math.floor(Math.random() * 4) + 4); // 4-7 active hours per day per bot
      description = `Per Hour Usage (${quantity} hours at ${billingConfig.amount} ${billingConfig.currency} each for ${periodFormatted})`;
      break;
    case "per_day":
      quantity = mockBotCount * daysInPeriod;
      description = `Per Day Usage (${quantity} bot-days at ${billingConfig.amount} ${billingConfig.currency} each for ${periodFormatted})`;
      break;
    case "per_month":
      // Assuming period is roughly a month for simplicity
      quantity = mockBotCount; 
      description = `Monthly Service Fee for ${mockBotCount} Bots (${billingConfig.amount} ${billingConfig.currency}/bot) for ${periodFormatted}`;
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

  const issueMonth = getMonth(issueDate);
  const issueYear = getYear(issueDate);

  const existingInvoiceForPeriod = invoices.find(inv => {
    if (inv.callCenterId !== callCenterId) return false;
    const existingIssueDate = new Date(inv.issueDate);
    return getMonth(existingIssueDate) === issueMonth && getYear(existingIssueDate) === issueYear;
  });

  if (existingInvoiceForPeriod) {
    return { error: `An invoice for ${format(issueDate, "MMMM yyyy")} already exists for ${callCenter.name}. Invoice #: ${existingInvoiceForPeriod.invoiceNumber}` };
  }

  const periodStart = startOfMonth(issueDate);
  const periodEnd = endOfDay(new Date(issueYear, issueMonth + 1, 0)); // Last day of the issue month


  const items = calculateMockUsage(callCenter, periodStart, periodEnd); 
  if (items.length === 0) return { error: "Could not calculate usage for invoice."};
  
  const { subtotal, taxAmount, total } = calculateTotals(items);

  const invoicesForMonthAndYear = invoices.filter(inv => 
    inv.callCenterId === callCenterId && 
    getYear(new Date(inv.issueDate)) === issueYear &&
    getMonth(new Date(inv.issueDate)) === issueMonth
  ).length;
  const sequentialNumber = String(invoicesForMonthAndYear + 1).padStart(3, '0'); // Pad to 3 digits e.g., 001

  const newInvoice: Invoice = {
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
    callCenterId,
    invoiceNumber: `INV-${issueYear}-${String(issueMonth + 1).padStart(2, '0')}-${sequentialNumber}`,
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
    // For this mock setup, CallCenterContext will re-fetch or use this mock data.
    return MOCK_GLOBAL_CALL_CENTERS[ccIndex];
  }
  return undefined;
};
