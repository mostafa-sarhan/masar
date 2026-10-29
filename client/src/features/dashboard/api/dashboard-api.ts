import type { DashboardOverview } from "@masar/shared";
import { api } from "@/lib/api-client";

export const getDashboard = () => api<DashboardOverview>("/dashboard");
