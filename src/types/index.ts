
export interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "archived" | "draft";
  scriptVariants: string[]; // IDs or names of script variants
  targetAudience: string;
  callObjective: string;
  createdDate: string;
  conversionRate?: number; // Optional: for display
}

export interface Agent {
  id: string;
  name: string;
  scriptVariantId: string;
  voice: string; // Voice ID or name
  performanceMetric?: number; // e.g., conversion rate
}

export interface Bot {
  id: string;
  name: string;
  campaignId: string;
  agentId: string; // The AI agent configuration used by this bot
  status: "active" | "inactive" | "error";
  creationDate: string;
  lastActivity?: string;
}

export interface Script {
  id: string;
  name: string;
  content: string;
  isMaster: boolean;
  parentId?: string; // For variants, linking to master
  createdDate: string;
}
