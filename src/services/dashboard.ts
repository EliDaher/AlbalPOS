import { DashboardSummary, DataAuditReport } from "@/Types/POSTypes";
import apiClient from "@/lib/axios";

export async function getDashboardSummary(params?: {
  from?: string;
  to?: string;
}): Promise<DashboardSummary> {
  const response = await apiClient.get("/api/dashboard/summary", { params });
  return response.data;
}

export async function getDataAuditReport(): Promise<DataAuditReport> {
  const response = await apiClient.get("/api/dashboard/audit");
  return response.data;
}
