import { apiFetch } from './api';

export interface ReportsSummary {
  dailyRevenue: number;
  monthlyRevenue: number;
  totalSales: number;
  dailyChart: Array<{ date: string; revenue: number }>;
}

export async function getReportsSummary(): Promise<ReportsSummary> {
  return apiFetch<ReportsSummary>('/reports/summary');
}
