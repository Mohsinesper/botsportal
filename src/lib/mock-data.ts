
import type { CallCenter, User, UserRole, Invoice, InvoiceLineItem, InvoiceStatus, BillingRateType, Campaign, ScriptVariant, Voice, Agent, Bot, CallFlow } from "@/types";

// Example Call Flow (Master)
const exampleMasterCallFlow: CallFlow = {
  name: "Medicare Inquiry Master",
  description: "Master call flow for Medicare benefits qualification.",
  default_exit: "graceful_exit_step",
  steps: {
    "greeting_step": {
      description: "Initial greeting to the customer.",
      audio_file: "greeting.wav",
      wait_for_response: true,
      timeout: 10,
      next: "ask_medicare_parts_step",
      text: "Hello, this is {Name_Placeholder} from the Medicare department. I'm calling about your Medicare benefits. Do you have a moment to talk?",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    },
    "ask_medicare_parts_step": {
      description: "Ask if the customer has Medicare Part A and B.",
      audio_file: "medicare_question.wav",
      wait_for_response: true,
      timeout: 10,
      conditions: [
        { type: "contains", keywords: ["yes", "yeah", "correct", "i do"], next: "qualification_confirmed_step" },
        { type: "contains", keywords: ["no", "don't", "do not"], next: "not_qualified_step" },
        { type: "default", next: "clarification_needed_step" }
      ],
      text: "We have some updated Medicare plans that could help you save money. Do you currently have Medicare Part A and Part B?",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    },
    "qualification_confirmed_step": {
      description: "Customer confirms they have Part A and B.",
      audio_file: "qualify.wav",
      wait_for_response: false, 
      next: "offer_program_step",
      text: "That's great! Since you have Medicare Part A and Part B, you may qualify for our benefits program.",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    },
     "offer_program_step": {
      description: "Offer to tell them about the program.",
      audio_file: "offer_program.wav",
      wait_for_response: true,
      timeout: 10,
      conditions: [
        { type: "contains", keywords: ["yes", "okay", "sure", "tell me more"], next: "transfer_to_agent_step" }, 
        { type: "default", next: "graceful_exit_step" }
      ],
      text: "Would you like to hear about the available plans that could help you save on your healthcare costs?",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    },
    "not_qualified_step": {
      description: "Customer does not have Part A and B.",
      audio_file: "not_qualify.wav",
      wait_for_response: false,
      next: "graceful_exit_step",
      text: "I understand. Since you don't have Medicare Part A and Part B, you don't qualify for our program at this time. If your situation changes, please call us back.",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    },
    "clarification_needed_step": {
      description: "Response to Medicare question was unclear.",
      audio_file: "clarify.wav",
      wait_for_response: true,
      timeout: 10,
      conditions: [
        { type: "contains", keywords: ["yes", "yeah", "correct", "i do"], next: "qualification_confirmed_step" },
        { type: "contains", keywords: ["no", "don't", "do not"], next: "not_qualified_step" },
        { type: "default", next: "graceful_exit_step" }
      ],
      text: "I'm sorry, I didn't quite catch that. Do you have Medicare Part A and Part B?",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    },
     "transfer_to_agent_step": {
      description: "Transferring to an agent.",
      audio_file: "transfer.wav",
      wait_for_response: false,
      next: "final_exit_step",
      text: "Great, I'll connect you with a licensed agent now. Please hold.",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    },
    "graceful_exit_step": {
      description: "Graceful exit if user is not interested or not qualified.",
      audio_file: "graceful_exit.wav",
      wait_for_response: false,
      next: "final_exit_step",
      text: "Alright, I understand. Thank you for your time. Have a great day!",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    },
    "voicemail_message_step": {
      description: "Message to leave on voicemail.",
      audio_file: "voicemail.wav",
      wait_for_response: false,
      next: "final_exit_step",
      text: "Hello, this is {Name_Placeholder} from the Medicare department regarding your benefits. Please call us back at 1-800-555-1212. Thank you.",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    },
    "final_exit_step": {
      description: "Final mandatory exit point of the call.",
      audio_file: "exit.wav",
      wait_for_response: false,
      text: "Goodbye.", 
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    }
  }
};


export const MOCK_GLOBAL_CALL_CENTERS: CallCenter[] = [
  { 
    id: "cc1", 
    name: "Main Call Center HQ", 
    location: "New York",
    status: "active",
    billingConfig: { rateType: "per_month", amount: 5, currency: "USD" }
  },
  { 
    id: "cc2", 
    name: "West Coast Operations", 
    location: "California",
    status: "active",
    billingConfig: { rateType: "per_call", amount: 0.02, currency: "USD" }
  },
  { 
    id: "cc3", 
    name: "EMEA Support Hub", 
    location: "London",
    status: "inactive",
    billingConfig: { rateType: "per_hour", amount: 0.5, currency: "USD" }
  },
];

export const MOCK_USERS: User[] = [
  { id: "user-super-admin", email: "super@example.com", name: "Super Admin", role: "SUPER_ADMIN", is2FAEnabled: true },
  { id: "user-cc-admin-1", email: "ccadmin1@example.com", name: "CC Admin (HQ)", role: "CALL_CENTER_ADMIN", assignedCallCenterIds: ["cc1"], is2FAEnabled: false },
  { id: "user-cc-admin-2", email: "ccadmin2@example.com", name: "CC Admin (West + EMEA)", role: "CALL_CENTER_ADMIN", assignedCallCenterIds: ["cc2", "cc3"], is2FAEnabled: true },
  { id: "user-design-admin-1", email: "design1@example.com", name: "Design Admin (HQ)", role: "DESIGN_ADMIN", assignedCallCenterIds: ["cc1"], is2FAEnabled: false },
  { id: "user-design-admin-2", email: "design2@example.com", name: "Design Admin (West)", role: "DESIGN_ADMIN", assignedCallCenterIds: ["cc2"], is2FAEnabled: false },
];

const generateMockLineItems = (basePrice: number): InvoiceLineItem[] => {
  const quantity = Math.floor(Math.random() * 50) + 100; 
  const unitPrice = basePrice;
  return [{ id: `li-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, description: "Bot Usage Charges (Mocked)", quantity, unitPrice, totalPrice: quantity * unitPrice }];
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
  return { id, callCenterId, invoiceNumber, issueDate: issueDate.toISOString(), dueDate: dueDate.toISOString(), items, subtotal, taxRate: 0.05, taxAmount, total, status, paidDate: status === "paid" ? new Date(issueDate.getTime() + Math.random() * (dueDate.getTime() - issueDate.getTime())).toISOString() : undefined, notes };
};

export let MOCK_INVOICES: Invoice[] = [
  createInvoice("inv1", "cc1", "INV-2024-001", new Date("2024-07-01"), new Date("2024-07-31"), "paid", 5, "July 2024 services."),
  createInvoice("inv2", "cc1", "INV-2024-002", new Date("2024-08-01"), new Date("2024-08-31"), "pending", 5, "August 2024 services."),
  createInvoice("inv3", "cc2", "INV-2024-003", new Date("2024-07-05"), new Date("2024-08-04"), "paid", 0.02, "July usage."),
  createInvoice("inv4", "cc2", "INV-2024-004", new Date("2024-08-05"), new Date("2024-09-04"), "pending", 0.02),
  createInvoice("inv5", "cc3", "INV-2024-005", new Date("2024-06-15"), new Date("2024-07-15"), "overdue", 0.5, "Urgent: Overdue."),
  createInvoice("inv6", "cc3", "INV-2024-006", new Date("2024-07-15"), new Date("2024-08-15"), "draft", 0.5),
];

export const MOCK_SCRIPT_VARIANTS: ScriptVariant[] = [ /* This might be deprecated or used for temp storage */ ];

export const MOCK_CAMPAIGNS: Campaign[] = [
    { id: "c1", name: "Medicare Outreach CC1", status: "active", targetAudience: "Seniors eligible for Medicare", callObjective: "Qualify for Medicare benefits and schedule follow-up.", createdDate: new Date().toISOString(), callCenterId: "cc1", conversionRate: 22.5, userMasterScript: "Hello, this is [Agent Name] from the Medicare department. I'm calling about your Medicare benefits. Do you have Medicare Part A and Part B?", callFlows: [exampleMasterCallFlow] },
    { id: "c2", name: "Product Feedback CC1", status: "paused", targetAudience: "Recent purchasers of Product X", callObjective: "Gather feedback on Product X.", createdDate: new Date(Date.now() - 86400000 * 5).toISOString(), callCenterId: "cc1", conversionRate: 15.2, userMasterScript: "Hi, we're calling to get your feedback on your recent purchase of Product X. Do you have a few minutes?" },
    { id: "c3", name: "Lead Gen Solar CC2", status: "draft", targetAudience: "Homeowners in sunny states", callObjective: "Generate leads for solar panel installations.", createdDate: new Date(Date.now() - 86400000 * 10).toISOString(), callCenterId: "cc2", userMasterScript: "Hello, are you interested in saving money on your electricity bill with solar panels?" },
];

export const MOCK_VOICES: Voice[] = [
  { id: "v1", name: "Ava - Friendly Female (CC1)", provider: "ElevenLabs", settings: { stability: 0.7, clarity: 0.8 }, callCenterId: "cc1", backgroundNoise: "Cafe Ambience", backgroundNoiseVolume: 30 },
  { id: "v2", name: "John - Professional Male (CC1)", provider: "GoogleTTS", settings: { pitch: -2, speed: 1.0 }, callCenterId: "cc1", backgroundNoise: "None" },
  { id: "v3", name: "Mia - Empathetic Female (CC2)", provider: "ElevenLabs", settings: { stability: 0.6, clarity: 0.75, style_exaggeration: 0.2 }, callCenterId: "cc2", backgroundNoise: "Office Hum", backgroundNoiseVolume: 15 },
  { id: "v4", name: "Noah - Calm Male (CC3)", provider: "CustomAPI", settings: { "voice-model": "calm-pro" }, callCenterId: "cc3", backgroundNoise: "Rainfall", backgroundNoiseVolume: 50 },
];

export const MOCK_AGENTS: Agent[] = [
  { id: "agent1", name: "Medicare Agent Default (CC1)", campaignId: "c1", voiceId: "v1", callCenterId: "cc1" },
  { id: "agent2", name: "Product Feedback Agent (CC1)", campaignId: "c2", voiceId: "v2", callCenterId: "cc1" },
  { id: "agent3", name: "Solar Lead Gen Agent (CC2)", campaignId: "c3", voiceId: "v3", callCenterId: "cc2" },
  { id: "agent4", name: "Support Agent EMEA (CC3)", campaignId: "c1", voiceId: "v4", callCenterId: "cc3"}, // Example agent for CC3
];

export const MOCK_BOTS: Bot[] = Array.from({ length: 25 }, (_, i) => {
    const ccIds = ["cc1", "cc2", "cc3"];
    const currentCcId = ccIds[i % ccIds.length];
    const ccAgents = MOCK_AGENTS.filter(ag => ag.callCenterId === currentCcId);
    
    // Ensure agent exists for the CC, otherwise pick any agent as a fallback
    const agent = ccAgents.length > 0 ? ccAgents[i % ccAgents.length] : MOCK_AGENTS[i % MOCK_AGENTS.length]; 
    
    // Ensure campaign exists for the agent, otherwise pick any campaign as a fallback
    const campaign = MOCK_CAMPAIGNS.find(c => c.id === agent.campaignId) || MOCK_CAMPAIGNS[i % MOCK_CAMPAIGNS.length];

    const totalCalls = Math.floor(Math.random() * 200) + 50;
    const successfulCalls = Math.floor(totalCalls * (Math.random() * 0.5 + 0.2));
    const failedCalls = Math.floor((totalCalls - successfulCalls) * (Math.random() * 0.4 + 0.1));
    const busyCalls = totalCalls - successfulCalls - failedCalls;

    return {
        id: `bot-${i}`, name: `Bot ${String(i+1).padStart(2,'0')} (${currentCcId})`,
        campaignId: campaign.id, agentId: agent.id,
        status: (["active", "inactive", "error"] as Bot["status"][])[i % 3],
        creationDate: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
        lastActivity: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
        callCenterId: currentCcId, totalCalls, successfulCalls, failedCalls, busyCalls,
    };
});
