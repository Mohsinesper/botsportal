
export interface CallCenter {
  id: string;
  name: string;
  location?: string; // Optional: location of the call center
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
  callCenterId: string; // Added for multi-tenancy
  conversionRate?: number; // Optional: for display
  masterScript?: string;
  scriptVariants?: ScriptVariant[];
  // The 'tone' could be part of campaign settings or prompted during script generation
}

export interface Voice {
  id: string;
  name: string;
  provider?: string; // e.g., "ElevenLabs", "GoogleTTS"
  settings?: Record<string, any>; // For voice-specific configurations
  callCenterId: string; // Added for multi-tenancy
}

export interface Agent {
  id: string;
  name: string; // e.g., "Summer Sale - Variant 1 - Ava Friendly"
  campaignId: string;
  scriptVariantId: string; // ID of the ScriptVariant from the campaign's scriptVariants array
  voiceId: string;
  callCenterId: string; // Added for multi-tenancy (derived from campaign)
  performanceMetric?: number; // e.g., conversion rate
}

export interface Bot {
  id: string;
  name: string;
  campaignId: string;
  agentId: string; // The AI agent configuration used by this bot
  status: "active" | "inactive" | "error";
  creationDate: string;
  callCenterId: string; // Added for multi-tenancy (derived from campaign)
  lastActivity?: string;
}

// This Script type can be used if scripts are managed as separate entities
// For now, masterScript (string) and ScriptVariant[] are directly on Campaign
export interface Script {
  id: string;
  name: string;
  content: string;
  isMaster: boolean;
  parentId?: string; // For variants, linking to master
  createdDate: string;
  campaignId: string; // Link script to a campaign
  // callCenterId would be implicitly through campaign
}
