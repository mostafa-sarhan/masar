import type { AccessRequestInput } from "@masar/shared";
import { api } from "@/lib/api-client";

export const submitAccessRequest = (body: AccessRequestInput) => api<{ received: true }>("/access-requests", { method: "POST", body });
