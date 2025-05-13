
export type UserRole = "SUPER_ADMIN" | "CALL_CENTER_ADMIN" | "DESIGN_ADMIN";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  assignedCallCenterIds?: string[]; // Relevant for CALL_CENTER_ADMIN and DESIGN_ADMIN
}

export interface CallCenter {
  id: string;
  name: string;
  location?: string; // Optional: location of the call center
  // createdByUserId?: string; // Optional: if tracking who created it
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
  // createdByUserId?: string;
}

export interface Voice {
  id: string;
  name: string;
  provider?: string; 
  settings?: Record<string, any>; 
  callCenterId: string; 
  // createdByUserId?: string;
}

export interface Agent {
  id: string;
  name: string; 
  campaignId: string;
  scriptVariantId: string; 
  voiceId: string;
  callCenterId: string; 
  performanceMetric?: number;
  // createdByUserId?: string;
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
  // createdByUserId?: string;
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

