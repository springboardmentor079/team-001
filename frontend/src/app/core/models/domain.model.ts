export interface Project {
  id: number;
  name: string;
  description: string | null;
  category: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  manager_id: number | null;
  created_at: string;
}

export interface Milestone {
  id: number;
  project_id: number;
  title: string;
  category: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
}

export interface ResourceItem {
  id: number;
  name: string;
  category: string;
  project_id: number | null;
  status: string;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  project_id: number | null;
  material_name: string;
  category: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  updated_at: string;
}

export interface Worker {
  id: number;
  full_name: string;
  category: string;
  project_id: number | null;
  contact_number: string | null;
  daily_wage: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  worker_id: number;
  project_id: number;
  date: string;
  status: string;
  created_at: string;
}

export interface ProcurementRequest {
  id: number;
  requested_by?: number | null;
  invoice_number?: string | null;
  invoice_paid?: boolean;
  project_id: number | null;
  item_name: string;
  category: string;
  vendor_name: string | null;
  quantity: number;
  cost: number;
  status: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface ReportSummary {
  total_projects: number;
  active_projects: number;
  total_budget: number;
  total_spent: number;
  total_workers: number;
  present_attendance_records: number;
  low_stock_items: number;
  pending_procurement_requests: number;
  projects_by_status: Record<string, number>;
}

export interface DocumentItem {
  id: number;
  project_id: number | null;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  uploaded_by: number;
  created_at: string;
}

export interface Expense {
  id: number;
  project_id: number;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  created_by: number | null;
  created_at: string;
}

export interface ProjectBudget {
  project_id: number;
  project_name: string;
  status: string;
  budget: number;
  spent: number;
  remaining: number;
  utilisation_pct: number;
  spent_by_category: Record<string, number>;
}

export interface Analytics {
  projects_by_status: Record<string, number>;
  projects_by_category: Record<string, number>;
  budget_vs_spent: { project: string; budget: number; spent: number }[];
  expenses_by_category: Record<string, number>;
  inventory_by_category: Record<string, number>;
  procurement_by_status: Record<string, number>;
  attendance_by_status: Record<string, number>;
  resources_by_status: Record<string, number>;
  milestones_by_status: Record<string, number>;
  workers_by_category: Record<string, number>;
}

export interface ReportHistoryItem {
  id: number;
  report_type: string;
  file_name: string;
  generated_by: string;
  created_at: string;
}

export interface DirectoryUser {
  id: number;
  full_name: string;
  role: string;
}

export interface ForgotPasswordResult {
  message: string;
  reset_token: string | null;
  email_sent: boolean;
}

export interface Vendor {
  id: number;
  name: string;
  category: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface VendorSummary {
  vendor_id: number;
  vendor_name: string;
  orders: number;
  total_cost: number;
  unpaid_invoices: number;
}

export interface Shift {
  id: number;
  worker_id: number;
  project_id: number;
  shift_date: string;
  shift_type: string;
  created_at: string;
}

export interface PayrollLine {
  worker_id: number;
  worker_name: string;
  category: string;
  daily_wage: number;
  present_days: number;
  half_days: number;
  absent_days: number;
  leave_days: number;
  payable_days: number;
  amount: number;
}

export interface PayrollReport {
  start: string;
  end: string;
  total_amount: number;
  lines: PayrollLine[];
}
