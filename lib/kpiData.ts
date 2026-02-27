/**
 * lib/kpiData.ts — Single source of truth for annual company KPIs.
 *
 * Update numbers here and both the Dashboard UI and the AI Analysis API
 * will automatically reflect the change.
 */

export interface AnnualKpi {
  id:        string;
  label:     string;
  current:   number;
  target:    number;
  unit:      string;
  color:     string;
  clickable: boolean;
}

export const ANNUAL_KPIS: AnnualKpi[] = [
  { id: "k1", label: "Dự án triển khai",    current: 8,     target: 30,     unit: "dự án",      color: "#888888", clickable: true  },
  { id: "k2", label: "Thành viên nền tảng", current: 12400, target: 100000, unit: "thành viên", color: "#999999", clickable: true  },
  { id: "k3", label: "Đối tác ký kết",      current: 41,    target: 136,    unit: "đối tác",    color: "#aaaaaa", clickable: true  },
  { id: "k5", label: "GMV năm",             current: 8.2,   target: 50,     unit: "tỷ VND",     color: "#999999", clickable: true  },
  { id: "k4", label: "Doanh thu năm",       current: 1.4,   target: 10,     unit: "tỷ VND",     color: "#cccccc", clickable: true  },
];
