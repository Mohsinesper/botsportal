
import type { CallCenter, User, UserRole } from "@/types";

export const MOCK_GLOBAL_CALL_CENTERS: CallCenter[] = [
  { id: "cc1", name: "Main Call Center HQ", location: "New York" },
  { id: "cc2", name: "West Coast Operations", location: "California" },
  { id: "cc3", name: "EMEA Support Hub", location: "London" },
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
