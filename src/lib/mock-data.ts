
import type { CallCenter, User, UserRole, Invoice, InvoiceLineItem, InvoiceStatus, BillingRateType, Campaign, ScriptVariant, Voice, Agent, Bot } from "@/types";

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


export const MOCK_SCRIPT_VARIANTS: ScriptVariant[] = [
  { id: "sv1-c1", name: "Summer Sale Variant 1", content: "Hello! Check out our summer sale..." },
  { id: "sv2-c1", name: "Summer Sale Variant 2 (Urgent)", content: "Don't miss out! Summer sale ends soon..." },
  { id: "sv1-c2", name: "Feedback Variant Polite", content: "We'd love your feedback on our new product." },
  { id: "sv1-c3", name: "Winter Variant Early Bird", content: "Early bird specials for winter!" },
  { id: "sv1-c4", name: "Support Check-in", content: "Hello, this is a follow-up on your recent support request..." },
  { id: "sv1-c5", name: "EMEA V1", content: "EMEA specific outreach version 1..." },
  { id: "sv2-c5", name: "EMEA V2", content: "EMEA specific outreach version 2, more direct." },
  { id: "sv-default-generic", name: "Generic Script", content: "Hello, this is a call from our company." },
  { id: "sv-leadgen-v1", name: "Lead Gen V1", content: "Hi, are you interested in our new service?" },
  { id: "sv-survey-v1", name: "Survey V1", content: "We are conducting a short survey." },
  { id: "sv-spring-v1", name: "Spring V1", content: "Get ready for spring with our special offers." }
];


export const MOCK_CAMPAIGNS: Campaign[] = [
    { id: "c1", name: "Summer Sale Promo CC1", status: "active", targetAudience: "Existing customers aged 25-40 interested in tech.", callObjective: "Promote new summer discounts and drive sales.", createdDate: new Date().toISOString(), callCenterId: "cc1", conversionRate: 22.5, masterScript: "Hello [Customer Name], this is a call about our amazing Summer Sale!", scriptVariants: MOCK_SCRIPT_VARIANTS.filter(sv => ["sv1-c1", "sv2-c1"].includes(sv.id))},
    { id: "c2", name: "New Product Launch CC1", status: "paused", targetAudience: "New leads from recent marketing campaign.", callObjective: "Introduce new product and generate qualified leads.", createdDate: new Date(Date.now() - 86400000 * 5).toISOString(), callCenterId: "cc1", conversionRate: 15.2, masterScript: "Master script for new product launch.", scriptVariants: MOCK_SCRIPT_VARIANTS.filter(sv => ["sv1-c2"].includes(sv.id)) },
    { id: "c3", name: "Customer Feedback Drive CC2", status: "draft", targetAudience: "Customers who purchased in the last 3 months.", callObjective: "Gather feedback on recent purchases and identify areas for improvement.", createdDate: new Date(Date.now() - 86400000 * 10).toISOString(), callCenterId: "cc2", masterScript: "Master script for feedback drive.", scriptVariants: MOCK_SCRIPT_VARIANTS.filter(sv => ["sv1-c3"].includes(sv.id)) },
    { id: "c4", name: "Winter Special CC1", status: "archived", targetAudience: "All subscribers in cold regions.", callObjective: "Promote winter heating solutions.", createdDate: new Date(Date.now() - 86400000 * 20).toISOString(), callCenterId: "cc1", masterScript: "Stay warm this winter with our new heaters!", scriptVariants: [] },
    { id: "c5", name: "Spring Cleaning Deals CC2", status: "active", targetAudience: "Homeowners in suburban areas.", callObjective: "Offer special discounts on cleaning services.", createdDate: new Date().toISOString(), callCenterId: "cc2", masterScript: "Get your home sparkling for spring!", scriptVariants: MOCK_SCRIPT_VARIANTS.filter(sv => ["sv-spring-v1"].includes(sv.id))},
    { id: "c6", name: "Tech Support Outreach CC3", status: "draft", targetAudience: "Users of Product X.", callObjective: "Proactively offer tech support and gather feedback.", createdDate: new Date().toISOString(), callCenterId: "cc3", masterScript: "Hello, we're calling from tech support for Product X.", scriptVariants: MOCK_SCRIPT_VARIANTS.filter(sv => ["sv1-c4"].includes(sv.id))},
    { id: "c7-emea", name: "EMEA Outreach (CC3)", status: "active", scriptVariants: MOCK_SCRIPT_VARIANTS.filter(sv => ["sv1-c5", "sv2-c5"].includes(sv.id)), targetAudience: "EMEA Customers", callObjective: "Expand EMEA presence", createdDate: new Date().toISOString(), callCenterId: "cc3" },
    { id: "c8-leadgen", name: "Lead Gen Q1 (CC1)", status: "active", scriptVariants: MOCK_SCRIPT_VARIANTS.filter(sv => ["sv-leadgen-v1"].includes(sv.id)), targetAudience: "New Prospects", callObjective: "Generate Leads", createdDate: new Date().toISOString(), callCenterId: "cc1" },
    { id: "c9-survey", name: "Customer Survey (CC2)", status: "paused", scriptVariants: MOCK_SCRIPT_VARIANTS.filter(sv => ["sv-survey-v1"].includes(sv.id)), targetAudience: "Recent Customers", callObjective: "Collect Feedback", createdDate: new Date().toISOString(), callCenterId: "cc2" },
];


export const MOCK_VOICES: Voice[] = [
  { id: "v1", name: "Ava - Friendly Female (CC1)", provider: "ElevenLabs", settings: { stability: 0.7, clarity: 0.8 }, callCenterId: "cc1" },
  { id: "v2", name: "John - Professional Male (CC1)", provider: "GoogleTTS", settings: { pitch: -2, speed: 1.0 }, callCenterId: "cc1" },
  { id: "v3", name: "Mia - Empathetic Female (CC2)", provider: "ElevenLabs", settings: { stability: 0.6, clarity: 0.75, style_exaggeration: 0.2 }, callCenterId: "cc2" },
  { id: "v4", name: "Echo - Standard Male (CC2)", provider: "GoogleTTS", settings: { pitch: 0, speed: 1.0 }, callCenterId: "cc2" },
  { id: "v5", name: "Zoe - Clear Announcer (CC3)", provider: "AzureTTS", settings: { style: "newscast-formal" }, callCenterId: "cc3"},
];

export const MOCK_AGENTS: Agent[] = [
  { id: "agent1", name: "Summer Sale V1 - Ava (CC1)", campaignId: "c1", scriptVariantId: "sv1-c1", voiceId: "v1", callCenterId: "cc1" },
  { id: "agent2", name: "Summer Sale V2 - John (CC1)", campaignId: "c1", scriptVariantId: "sv2-c1", voiceId: "v2", callCenterId: "cc1" },
  { id: "agent3", name: "Feedback Polite - Ava (CC1)", campaignId: "c2", scriptVariantId: "sv1-c2", voiceId: "v1", callCenterId: "cc1" },
  { id: "agent4", name: "Winter Early - Mia (CC2)", campaignId: "c3", scriptVariantId: "sv1-c3", voiceId: "v3", callCenterId: "cc2" },
  { id: "agent5", name: "Support Check - Zoe (CC3)", campaignId: "c6", scriptVariantId: "sv1-c4", voiceId: "v5", callCenterId: "cc3"}, // Matched campaignId to c6 for CC3
  { id: "agent6", name: "Agent Smith (CC1)", campaignId: "c1", scriptVariantId: "sv1-c1", voiceId: "v1", callCenterId: "cc1" },
  { id: "agent7", name: "Agent Jones (CC1)", campaignId: "c8-leadgen", scriptVariantId: "sv-leadgen-v1", voiceId: "v2", callCenterId: "cc1" },
  { id: "agent8", name: "Agent Brown (CC2)", campaignId: "c9-survey", scriptVariantId: "sv-survey-v1", voiceId: "v3", callCenterId: "cc2" },
  { id: "agent9", name: "Agent White (CC2)", campaignId: "c5", scriptVariantId: "sv-spring-v1", voiceId: "v4", callCenterId: "cc2" },
  { id: "agent10", name: "Agent Zeta (CC1)", campaignId: "c1", scriptVariantId: "sv1-c1", voiceId: "v2", callCenterId: "cc1" },
  { id: "agent11", name: "Agent Gamma (CC3)", campaignId: "c7-emea", scriptVariantId: "sv1-c5", voiceId: "v5", callCenterId: "cc3"},
  { id: "agent12", name: "Agent Delta (CC3)", campaignId: "c7-emea", scriptVariantId: "sv2-c5", voiceId: "v5", callCenterId: "cc3"},
];


export const MOCK_BOTS: Bot[] = Array.from({ length: 75 }, (_, i) => {
    const callCenterIds = ["cc1", "cc2", "cc3"];
    const currentCcId = callCenterIds[i % callCenterIds.length];
    
    const ccAgents = MOCK_AGENTS.filter(ag => ag.callCenterId === currentCcId);
    let agentId = `a-fallback-${currentCcId}`;
    let campaignId = `c-fallback-${currentCcId}`;

    if (ccAgents.length > 0) {
      const randomAgent = ccAgents[i % ccAgents.length];
      agentId = randomAgent.id;
      campaignId = randomAgent.campaignId;
    } else {
      // Fallback if no agents for a CC (should not happen with current data structure if agents are defined for all ccs)
      const ccCampaigns = MOCK_CAMPAIGNS.filter(camp => camp.callCenterId === currentCcId);
      if (ccCampaigns.length > 0) {
        campaignId = ccCampaigns[i % ccCampaigns.length].id;
      }
    }

    const totalCalls = Math.floor(Math.random() * 451) + 50; // 50-500 calls
    const successfulCalls = Math.floor(totalCalls * (Math.random() * 0.6 + 0.2)); // 20-80% success
    const remainingAfterSuccess = totalCalls - successfulCalls;
    const failedCalls = Math.floor(remainingAfterSuccess * (Math.random() * 0.5 + 0.1)); // 10-60% of remaining are failed
    const busyCalls = remainingAfterSuccess - failedCalls;

    return {
        id: `bot-${i}`,
        name: `Bot ${String(i+1).padStart(3, '0')} (${currentCcId.toUpperCase()})`,
        campaignId,
        agentId,
        status: (["active", "inactive", "error"] as Bot["status"][])[i % 3],
        creationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        callCenterId: currentCcId,
        totalCalls,
        successfulCalls,
        failedCalls,
        busyCalls,
    };
});
