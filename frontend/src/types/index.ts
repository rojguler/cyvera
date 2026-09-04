export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational' | 'info';

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Target {
  id: string;
  user_id: string;
  name: string;
  url: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_scans?: number;
  latest_score?: number | null;
}

export interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
  total: number;
}

export interface Vulnerability {
  id: string;
  plugin_id: string;
  name: string;
  description?: string;
  solution?: string;
  reference?: string;
  owasp_category?: string;
  cwe_id?: number | null;
  wasc_id?: number | null;
  created_at: string;
}

export interface AIAnalysis {
  id: string;
  finding_id: string;
  explanation: string;
  why_it_matters: string;
  potential_impact: string;
  evidence_interpretation?: string;
  remediation: string;
  fix_guidance: string;
  model_version: string;
  created_at: string;
}

export interface ScanFinding {
  id: string;
  scan_id: string;
  vulnerability_id: string;
  vulnerability?: Vulnerability;
  severity: VulnerabilitySeverity;
  risk_score?: number;
  confidence?: string;
  affected_url: string;
  http_method: string;
  parameter?: string;
  attack?: string;
  evidence?: string;
  other_info?: string;
  created_at: string;
  ai_analysis?: AIAnalysis | null;
}

export interface Scan {
  id: string;
  target_id: string;
  user_id: string;
  target_name?: string;
  target_url?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  scan_type: 'passive' | 'active' | 'full';
  scan_engine?: 'zap' | 'fallback';
  progress: number;
  security_score?: number | null;
  severity_breakdown?: SeverityBreakdown;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  created_at: string;
  findings?: ScanFinding[];
}

export interface OWASPCategoryCount {
  category: string;
  count: number;
}

export interface ScoreTrendPoint {
  date: string;
  scan_id: string;
  target_name: string;
  score: number;
}

export interface DashboardStats {
  total_scans: number;
  total_targets: number;
  latest_security_score: number;
  average_security_score: number;
  severity_breakdown: SeverityBreakdown;
  owasp_distribution: OWASPCategoryCount[];
  recent_scans: Scan[];
  score_trends: ScoreTrendPoint[];
}

export interface ScanReport {
  scan_id: string;
  target_name: string;
  target_url: string;
  scan_type: string;
  status: string;
  security_score: number;
  started_at?: string;
  completed_at?: string;
  severity_breakdown: SeverityBreakdown;
  executive_summary: string;
  findings: ScanFinding[];
}
