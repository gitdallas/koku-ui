import { OcpReportType } from 'api/reports/ocpReports';

export const ocpReportsStateKey = 'ocpReports';

export function getReportId(type: OcpReportType, query: string) {
  return `${type}--${query}`;
}
