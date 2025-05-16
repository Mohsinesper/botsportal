
import type { CallCenter, User, UserRole, Invoice, InvoiceLineItem, InvoiceStatus, BillingRateType, Campaign, ScriptVariant, Voice, Agent, Bot, CallFlow, CallLog, DNCRecord, CallResult, AuditLogEntry } from "@/types";

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

export const AVAILABLE_BACKGROUND_NOISES = [
  { id: "none", name: "None" },
  { id: "cafe", name: "Cafe Ambience" },
  { id: "office", name: "Office Hum" },
  { id: "street", name: "Street Sounds" },
  { id: "rain_light", name: "Light Rain" },
  { id: "call_center", name: "Subtle Call Center Murmur" },
];


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

// Updated MOCK_SCRIPT_VARIANTS to include campaignId
export const MOCK_SCRIPT_VARIANTS: ScriptVariant[] = [
  { id: "sv1-c1", campaignId: "c1", name: "Medicare Welcome v1", content: "Hello, this is [Agent Name] from Medicare services. We have new plans..." },
  { id: "sv2-c1", campaignId: "c1", name: "Medicare Welcome v2 (Friendly)", content: "Hi there! It's [Agent Name] from the Medicare team. Got a sec to talk about some great new plans?" },
  { id: "sv1-c2", campaignId: "c2", name: "Product X Feedback Intro", content: "Hi, we're calling about Product X. Could you share your experience?" },
  { id: "sv1-c3", campaignId: "c3", name: "Solar Lead Gen Main", content: "Interested in solar? We can help you save money!" },
];


export const MOCK_CAMPAIGNS: Campaign[] = [
    { id: "c1", callCenterId: "cc1", name: "Medicare Outreach CC1", status: "active", targetAudience: "Seniors eligible for Medicare", callObjective: "Qualify for Medicare benefits and schedule follow-up.", createdDate: new Date().toISOString(), conversionRate: 22.5, userMasterScript: "Hello, this is [Agent Name] from the Medicare department. I'm calling about your Medicare benefits. Do you have Medicare Part A and Part B?", callFlows: [exampleMasterCallFlow], scriptVariants: MOCK_SCRIPT_VARIANTS.filter(sv => sv.campaignId === 'c1') },
    { id: "c2", callCenterId: "cc1", name: "Product Feedback CC1", status: "paused", targetAudience: "Recent purchasers of Product X", callObjective: "Gather feedback on Product X.", createdDate: new Date(Date.now() - 86400000 * 5).toISOString(), conversionRate: 15.2, userMasterScript: "Hi, we're calling to get your feedback on your recent purchase of Product X. Do you have a few minutes?", scriptVariants: MOCK_SCRIPT_VARIANTS.filter(sv => sv.campaignId === 'c2') },
    { id: "c3", callCenterId: "cc2", name: "Lead Gen Solar CC2", status: "draft", targetAudience: "Homeowners in sunny states", callObjective: "Generate leads for solar panel installations.", createdDate: new Date(Date.now() - 86400000 * 10).toISOString(), userMasterScript: "Hello, are you interested in saving money on your electricity bill with solar panels?", scriptVariants: MOCK_SCRIPT_VARIANTS.filter(sv => sv.campaignId === 'c3') },
];

export const MOCK_VOICES: Voice[] = [
  { id: "v1", name: "Ava - Friendly Female (CC1)", provider: "ElevenLabs", settings: { stability: 0.7, clarity: 0.8 }, callCenterId: "cc1" },
  { id: "v2", name: "John - Professional Male (CC1)", provider: "GoogleTTS", settings: { pitch: -2, speed: 1.0 }, callCenterId: "cc1" },
  { id: "v3", name: "Mia - Empathetic Female (CC2)", provider: "ElevenLabs", settings: { stability: 0.6, clarity: 0.75, style_exaggeration: 0.2 }, callCenterId: "cc2" },
  { id: "v4", name: "Noah - Calm Male (CC3)", provider: "CustomAPI", settings: { "voice-model": "calm-pro" }, callCenterId: "cc3" },
];

export const MOCK_AGENTS: Agent[] = [
  { id: "agent1", name: "Medicare Agent Default (CC1)", campaignId: "c1", scriptVariantId: "sv1-c1", voiceId: "v1", callCenterId: "cc1", backgroundNoise: "office", backgroundNoiseVolume: 30 },
  { id: "agent2", name: "Product Feedback Agent (CC1)", campaignId: "c2", scriptVariantId: "sv1-c2", voiceId: "v2", callCenterId: "cc1", backgroundNoise: "none", backgroundNoiseVolume: 0 },
  { id: "agent3", name: "Solar Lead Gen Agent (CC2)", campaignId: "c3", scriptVariantId: "sv1-c3", voiceId: "v3", callCenterId: "cc2", backgroundNoise: "cafe", backgroundNoiseVolume: 50 },
  { id: "agent4", name: "Support Agent EMEA (CC3)", campaignId: "c1", scriptVariantId: "sv2-c1", voiceId: "v4", callCenterId: "cc3", backgroundNoise: "rain_light", backgroundNoiseVolume: 65},
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
        activeDutyStartTime: (i % 5 === 0) ? "09:00" : undefined, // Add for some bots
        activeDutyEndTime: (i % 5 === 0) ? "17:00" : undefined,   // Add for some bots
    };
});

// Mock DNC List
export const MOCK_DNC_LIST: DNCRecord[] = [
  { phoneNumber: "555-0100-0000", reason: "User requested DNC", addedDate: new Date(Date.now() - 86400000 * 10).toISOString(), sourceCallLogId: "cl-dnc1", callCenterIdSource: "cc1" },
  { phoneNumber: "555-0101-0001", reason: "Repeatedly hung up", addedDate: new Date(Date.now() - 86400000 * 5).toISOString(), addedByBotId: MOCK_BOTS[2]?.id, callCenterIdSource: "cc2" },
  { phoneNumber: "555-0102-0002", addedDate: new Date(Date.now() - 86400000 * 2).toISOString(), callCenterIdSource: "cc1" },
];

// Mock Call Logs
const leadNames = ["Alice Johnson", "Bob Williams", "Charlie Brown", "Diana Miller", "Edward Davis", "Fiona Garcia", "George Rodriguez", "Helen Wilson", "Ian Martinez", "Julia Anderson"];
const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"];
const callResults: CallResult[] = ["answered_success", "answered_dnc_requested", "answered_declined", "busy", "failed_technical", "voicemail_left", "voicemail_full", "no_answer"];

export const MOCK_CALL_LOGS: CallLog[] = Array.from({ length: 50 }, (_, i) => {
  const bot = MOCK_BOTS[i % MOCK_BOTS.length];
  const campaign = MOCK_CAMPAIGNS.find(c => c.id === bot.campaignId) || MOCK_CAMPAIGNS[0];
  const callCenterId = bot.callCenterId;
  
  const leadPhoneNumberBase = 55501000000 + i * 10 + Math.floor(Math.random() * 10);
  const leadPhoneNumber = `${String(leadPhoneNumberBase).slice(0,3)}-${String(leadPhoneNumberBase).slice(3,7)}-${String(leadPhoneNumberBase).slice(7,11)}`;

  let callResult = callResults[i % callResults.length];
  let markedDNC = false;

  // Simulate DNC check
  const isOnDNC = MOCK_DNC_LIST.some(dnc => dnc.phoneNumber === leadPhoneNumber);
  if (isOnDNC && callResult !== "answered_dnc_requested") { // If already on DNC, call shouldn't proceed successfully
    callResult = "blocked_by_dnc";
  }

  if (callResult === "answered_dnc_requested") {
    markedDNC = true;
    // Ensure this number is on the DNC list if the call resulted in DNC
    if (!isOnDNC) {
      MOCK_DNC_LIST.push({
        phoneNumber: leadPhoneNumber,
        reason: "User requested during call",
        addedDate: new Date().toISOString(),
        sourceCallLogId: `cl-${i}`,
        addedByBotId: bot.id,
        callCenterIdSource: callCenterId,
      });
    }
  }

  const callStartTime = new Date(Date.now() - Math.random() * 60 * 86400000); // Within last 60 days
  let callEndTime: Date | undefined = undefined;
  let callDurationSeconds: number | undefined = undefined;

  if (callResult !== "blocked_by_dnc" && callResult !== "failed_technical" && callResult !== "busy") {
    callEndTime = new Date(callStartTime.getTime() + (Math.floor(Math.random() * 300) + 30) * 1000); // 30s to 5min
    callDurationSeconds = Math.round((callEndTime.getTime() - callStartTime.getTime()) / 1000);
  }

  return {
    id: `cl-${i}`,
    callCenterId,
    botId: bot.id,
    botName: bot.name,
    campaignId: campaign.id,
    campaignName: campaign.name,
    leadId: `lead-${i}`,
    leadName: leadNames[i % leadNames.length],
    leadPhoneNumber,
    leadCity: cities[i % cities.length],
    leadAge: Math.floor(Math.random() * 50) + 20, // Age 20-69
    callStartTime: callStartTime.toISOString(),
    callEndTime: callEndTime?.toISOString(),
    callDurationSeconds,
    callResult,
    recordingUrl: callResult !== "blocked_by_dnc" ? `/recordings/mock_rec_${i}.mp3` : undefined,
    notes: callResult === "answered_dnc_requested" ? "User explicitly asked to be put on DNC." : (Math.random() > 0.8 ? "User seemed interested." : undefined),
    markedDNC,
  };
});

// Ensure DNC list is populated by calls that marked DNC
MOCK_CALL_LOGS.forEach(log => {
    if (log.markedDNC && !MOCK_DNC_LIST.some(dnc => dnc.phoneNumber === log.leadPhoneNumber)) {
        MOCK_DNC_LIST.push({
            phoneNumber: log.leadPhoneNumber,
            reason: log.notes || "Marked DNC during call",
            addedDate: log.callEndTime || new Date().toISOString(),
            sourceCallLogId: log.id,
            addedByBotId: log.botId,
            callCenterIdSource: log.callCenterId
        });
    }
});

// Mock Audit Log Data
const auditLogActions = [
  "User Login", "User Logout", "Viewed Dashboard", "Created Campaign", "Updated Campaign Status", 
  "Generated Bots", "Updated Bot Status", "Viewed Call Logs", "Added User", "Edited User Permissions",
  "Accessed Agent Optimization", "Generated Invoice", "Marked Invoice Paid", "Updated Call Center Billing"
];
const mockIpAddresses = ["192.168.1.10", "10.0.0.5", "172.16.0.20", "203.0.113.45", "198.51.100.12"];
const mockLocations = ["New York, USA", "London, UK", "Tokyo, Japan", "Berlin, Germany", "Sydney, Australia"];

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = Array.from({ length: 50 }, (_, i) => {
  const user = MOCK_USERS[i % MOCK_USERS.length];
  const action = auditLogActions[i % auditLogActions.length];
  let details: string | Record<string, any> = `Performed action: ${action}`;
  let callCenterContext: { id: string, name: string } | undefined = undefined;

  if (action.toLowerCase().includes("campaign") || action.toLowerCase().includes("bot") || action.toLowerCase().includes("invoice") || action.toLowerCase().includes("billing") || action.toLowerCase().includes("agent")) {
    if (MOCK_GLOBAL_CALL_CENTERS.length > 0) {
      const cc = MOCK_GLOBAL_CALL_CENTERS[i % MOCK_GLOBAL_CALL_CENTERS.length];
      callCenterContext = { id: cc.id, name: cc.name };
    }
  }

  if (action === "Created Campaign") {
    details = { campaignName: MOCK_CAMPAIGNS[i % MOCK_CAMPAIGNS.length]?.name || `Campaign ${i}`, action: "create", callCenter: callCenterContext?.name };
  } else if (action === "Updated Bot Status") {
    details = { botName: MOCK_BOTS[i % MOCK_BOTS.length]?.name || `Bot ${i}`, newStatus: (["active", "inactive"] as Bot["status"][])[i%2], callCenter: callCenterContext?.name };
  } else if (action === "User Login") {
    details = "User successfully logged in.";
  } else if (callCenterContext) {
    // For other actions that might have a call center context
    details = { action, context: `Call Center: ${callCenterContext.name}` };
  }


  return {
    id: `audit-${Date.now()}-${i}`,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // within last 30 days
    userId: user.id,
    userName: user.name || user.email,
    action,
    details,
    ipAddress: mockIpAddresses[i % mockIpAddresses.length],
    location: mockLocations[i % mockLocations.length],
    callCenterId: callCenterContext?.id,
    callCenterName: callCenterContext?.name,
  };
});
