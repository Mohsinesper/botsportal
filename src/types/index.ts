
export type UserRole = "SUPER_ADMIN" | "CALL_CENTER_ADMIN" | "DESIGN_ADMIN";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  assignedCallCenterIds?: string[]; // Relevant for CALL_CENTER_ADMIN and DESIGN_ADMIN
  is2FAEnabled?: boolean;
}

export type BillingRateType = "per_call" | "per_hour" | "per_day" | "per_month";
export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled";

export interface CallCenter {
  id: string;
  name: string;
  location?: string;
  status?: "active" | "inactive"; 
  billingConfig?: {
    rateType: BillingRateType;
    amount: number; 
    currency: "USD" | "EUR" | "GBP"; 
  };
}

// New types for structured Call Flows
export interface CallFlowStepCondition {
  type: string; // "contains", "default", etc.
  keywords?: string[];
  next: string;
}

export interface CallFlowVoiceSettings {
  stability: number;
  similarity_boost: number;
}

export interface CallFlowStep {
  description: string;
  audio_file: string; // Placeholder like "greeting.wav"
  wait_for_response: boolean;
  timeout?: number;
  next?: string;
  conditions?: CallFlowStepCondition[];
  text: string;
  voice_settings?: CallFlowVoiceSettings;
}

export interface CallFlow {
  name: string; // e.g., "medicare" or "medicare - variant - 1"
  description: string;
  default_exit: string;
  steps: Record<string, CallFlowStep>; // Key is the step name
}
// End of new Call Flow types

export interface ScriptVariant { // This might be deprecated or used differently
  id: string;
  name: string;
  content: string; // Plain text content
  campaignId: string; // Added to ensure script variant is linked to a campaign
}

export interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "archived" | "draft";
  targetAudience?: string; 
  callObjective?: string;  
  createdDate: string;
  callCenterId: string;
  conversionRate?: number;
  
  userMasterScript?: string; 
  callFlows?: CallFlow[];    

  masterScript?: string; 
  scriptVariants?: ScriptVariant[]; 
  tone?: string; 
}

export interface Voice {
  id: string;
  name: string;
  provider?: string;
  settings?: Record<string, any>;
  callCenterId: string;
  // backgroundNoise?: string; // Removed as per reversal request
  // backgroundNoiseVolume?: number; // Removed as per reversal request
}

export interface Agent {
  id: string;
  name: string;
  campaignId: string; 
  voiceId: string;
  callCenterId: string;
  performanceMetric?: number;
  scriptVariantId?: string; 
  backgroundNoise?: string; // e.g., "None", "Cafe Ambience", "Office Hum"
  backgroundNoiseVolume?: number; // e.g., 0-100
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
  successfulCalls?: number;
  failedCalls?: number;
  busyCalls?: number;
  totalCalls?: number;
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
  issueDate: string; // ISO string
  dueDate: string;   // ISO string
  items: InvoiceLineItem[];
  subtotal: number;
  taxRate?: number; 
  taxAmount?: number;
  total: number;
  status: InvoiceStatus;
  paidDate?: string;  // ISO string
  notes?: string;
}

