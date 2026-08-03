/**
 * TypeScript interfaces matching the M-AIDA v7.2 release-candidate backend
 * models. Keep in sync with backend/models.py.
 */

export type DoiMeasure = "FSTS" | "GEO" | "EXP" | "FDI" | "COMP" | "OTH";
export type PerformanceMeasure = "ACC" | "MKT" | "LAB" | "MIX";
export type IcrvRegime = "I" | "II" | "III" | "FR" | "MX";
export type DplPhase = "PRE" | "SPN" | "FOL";

export interface ExtractedEffect {
  study_id: string;
  paper_title: string;
  authors: string;
  year: number;
  country: string;

  sample_n: number | null;
  sample_start: number | null;
  sample_end: number | null;

  effect_r: number | null;
  effect_t: number | null;
  effect_beta: number | null;
  effect_df: number | null;
  p_value: number | null;
  ci_lower: number | null;
  ci_upper: number | null;

  doi_measure: DoiMeasure | null;
  performance_measure: PerformanceMeasure | null;
  icrv_regime: IcrvRegime | null;
  cdai_score: number | null;
  dpl_phase: DplPhase | null;

  extraction_confidence: number;
  df_imputed: boolean;
  beta_outside_pb_domain: boolean;
  requires_verification: boolean;
  pi_locked: boolean;
  extracted_at: string;
  locked_at: string | null;
}

export interface StudyDatabaseEntry extends ExtractedEffect {
  notion_page_id: string | null;
  pi_notes: string;
  /**
   * Immutable snapshot captured when the model first proposed the record.
   * This must remain distinct from PI overrides and the current editable view.
   */
  machine_proposal: Record<string, unknown> | null;
}

export interface ExtractionRequest {
  pdf_content: string;
  paper_metadata: PaperMetadata;
}

export interface PaperMetadata {
  title?: string;
  authors?: string;
  year?: number;
  country?: string;
  doi?: string;
  [key: string]: string | number | undefined;
}

export interface VerificationDecision {
  study_id: string;
  field_overrides: Partial<ExtractedEffect>;
  pi_approved: boolean;
  pi_notes: string;
}

export type ConfidenceTier = "high" | "medium" | "low";

export function getConfidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 0.9) return "high";
  if (confidence >= 0.7) return "medium";
  return "low";
}

export interface StudyFilters {
  icrv?: IcrvRegime | "";
  dpl?: DplPhase | "";
  verified?: boolean | null;
  locked?: boolean | null;
}

export type ExtractionMode = "live" | "rehearsed_fallback" | "unavailable";

export interface HealthResponse {
  status: string;
  version: string;
  study_count: number;
  llm_configured?: boolean;
  anthropic_configured?: boolean;
  notion_configured: boolean;
  storage?: string;
  storage_path?: string;
  llm_ready?: boolean;
  demo_mode?: boolean;
  extraction_mode?: ExtractionMode;
}

export interface NotionSyncResponse {
  synced: number;
  failed: number;
  errors: string[];
  message: string;
}
