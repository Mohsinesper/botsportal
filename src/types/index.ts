
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
  settings?: Record<string, any>; // e.g. { "stability": 0.7, "clarity": 0.8 }
  callCenterId: string;
}

export interface Agent {
  id: string;
  name: string;
  campaignId: string; 
  scriptVariantId?: string; 
  voiceId: string;
  backgroundNoise?: string; 
  backgroundNoiseVolume?: number; 
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
  successfulCalls?: number;
  failedCalls?: number;
  busyCalls?: number;
  totalCalls?: number;
  activeDutyStartTime?: string; // e.g., "09:00"
  activeDutyEndTime?: string;   // e.g., "17:00"
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

// New Types for Call Logs and DNC
export type CallResult = 
  | "answered_success" // Lead answered, positive outcome from script
  | "answered_dnc_requested" // Lead answered, requested DNC
  | "answered_declined" // Lead answered, declined offer/service
  | "busy"
  | "failed_technical" // e.g. invalid number, network error
  | "voicemail_left"
  | "voicemail_full"
  | "no_answer"
  | "blocked_by_dnc"; // Call was not initiated due to DNC

export interface CallLog {
  id: string;
  callCenterId: string;
  botId: string;
  botName: string; // Denormalized for easier display
  campaignId: string;
  campaignName: string; // Denormalized
  leadId: string; // Assuming leads have IDs
  leadName: string;
  leadPhoneNumber: string;
  leadCity?: string;
  leadAge?: number;
  callStartTime: string; // ISO string
  callEndTime?: string;  // ISO string, optional if call didn't connect
  callDurationSeconds?: number; // Calculated if start and end time exist
  callResult: CallResult;
  recordingUrl?: string; // Placeholder for mock recording link
  notes?: string; // Any notes from the call, e.g., reason for DNC
  markedDNC: boolean; // True if this call resulted in the number being added to DNC
}

export interface DNCRecord {
  phoneNumber: string; // Primary key
  reason?: string;
  addedDate: string; // ISO string
  sourceCallLogId?: string; // If added as a result of a call
  addedByBotId?: string;
  addedByUserId?: string; // For manual additions later
  callCenterIdSource?: string; // Which call center's interaction led to DNC
}

// For Agent Call Analysis
export interface CallFlowStepAnalysis {
  stepKey: string;
  stepDescription: string;
  callsReached: number;
  callsDropped: number;
  dropRate: number;
}

export interface CampaignDropAnalysis {
  campaignName: string;
  totalInitialCalls: number;
  stepsAnalysis: CallFlowStepAnalysis[];
}

// New type for Audit Log Entries
export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO date string
  userId: string;
  userName: string; // Denormalized for display
  action: string; // e.g., "User Login", "Campaign Created"
  details?: string | Record<string, any>; // Can be a simple string or a structured object
  ipAddress?: string;
  location?: string; // e.g., "New York, USA" (mocked)
  callCenterId?: string; // Optional: ID of the call center context if applicable
  callCenterName?: string; // Optional: Name of the call center context
}
