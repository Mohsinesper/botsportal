
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
  status?: "active" | "inactive"; 
  billingConfig?: {
    rateType: BillingRateType;
    amount: number; 
    currency: string; 
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
}

export interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "archived" | "draft";
  targetAudience: string; // Kept for metadata
  callObjective: string;  // Kept for metadata
  createdDate: string;
  callCenterId: string;
  conversionRate?: number;
  
  userMasterScript?: string; // User's initial raw master script text
  callFlows?: CallFlow[];    // Array of generated/approved call flow JSONs

  // Previous script fields - to be reviewed if still needed
  masterScript?: string; // This was plain text master script
  scriptVariants?: ScriptVariant[]; // This was plain text variants
  tone?: string; // Kept for metadata, might guide AI if user doesn't provide full structured script initially
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
  // Agent might now be associated with a campaign, and implicitly one of its CallFlows (e.g. the master, or a specific variant by index/name)
  // scriptVariantId: string; // This might change if variants are part of CallFlow
  voiceId: string;
  callCenterId: string;
  performanceMetric?: number;
}

export interface Bot {
  id: string;
  name: string;
  campaignId: string;
  agentId: string; // Agent now implies a specific call flow and voice
  status: "active" | "inactive" | "error";
  creationDate: string;
  callCenterId: string;
  lastActivity?: string;
  successfulCalls?: number;
  failedCalls?: number;
  busyCalls?: number;
  totalCalls?: number;
}

export interface Script { // This seems like a more generic script type, might not be used for call flows
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
