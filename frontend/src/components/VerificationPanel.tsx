/**
 * Human review, provenance inspection, and PI decision form.
 */
import { AlertTriangle, Bot, CheckCircle2, Clock3, Fingerprint, LockKeyhole, UserCheck } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { lockStudy, verifyStudy } from "../api";
import { DoiMeasure, DplPhase, ExtractedEffect, IcrvRegime, PerformanceMeasure, StudyDatabaseEntry } from "../types";

interface FieldRowProps {
  label: string;
  fieldKey: keyof ExtractedEffect;
  original: unknown;
  machine: unknown;
  override: unknown;
  onOverride: (key: keyof ExtractedEffect, value: unknown) => void;
  inputType?: "text" | "number" | "select";
  selectOptions?: string[];
  locked?: boolean;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function FieldRow({ label, fieldKey, original, machine, override, onOverride, inputType = "text", selectOptions, locked = false }: FieldRowProps) {
  const display = override !== undefined ? override : original;
  const isDirty = override !== undefined && override !== original;
  const differsFromMachine = machine !== undefined && machine !== null && formatValue(machine) !== formatValue(display);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const raw = event.target.value;
    const coerced = inputType === "number" && raw !== "" ? Number(raw) : raw === "" ? null : raw;
    onOverride(fieldKey, coerced);
  };
  return (
    <tr className={`field-row ${isDirty ? "dirty" : ""} ${differsFromMachine ? "human-adjusted" : ""}`}>
      <td className="field-label">{label}</td>
      <td className="field-machine">{formatValue(machine)}</td>
      <td className="field-original">{formatValue(original)}</td>
      <td className="field-override">
        {inputType === "select" && selectOptions ? (
          <select className="form-input form-input-sm" value={String(display ?? "")} onChange={handleChange} disabled={locked}>
            <option value="">—</option>
            {selectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : (
          <input className="form-input form-input-sm" type={inputType} value={display !== null && display !== undefined ? String(display) : ""} onChange={handleChange} step={inputType === "number" ? "any" : undefined} disabled={locked} />
        )}
      </td>
    </tr>
  );
}

interface VerificationPanelProps {
  study: StudyDatabaseEntry;
  onClose: () => void;
  onUpdated: (updated: StudyDatabaseEntry) => void;
}

export default function VerificationPanel({ study, onClose, onUpdated }: VerificationPanelProps) {
  const [overrides, setOverrides] = useState<Partial<ExtractedEffect>>({});
  const [piNotes, setPiNotes] = useState(study.pi_notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);
  const machine = study.machine_proposal ?? {};
  const warningCount = Number(study.df_imputed) + Number(study.beta_outside_pb_domain);
  const humanChangeCount = useMemo(() => Object.keys(overrides).length, [overrides]);

  const setOverride = useCallback((key: keyof ExtractedEffect, value: unknown) => {
    setOverrides((previous) => ({ ...previous, [key]: value }));
  }, []);

  const handleApproveAndLock = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const verified = await verifyStudy(study.study_id, { study_id: study.study_id, field_overrides: overrides, pi_approved: true, pi_notes: piNotes });
      const locked = await lockStudy(verified.study_id);
      onUpdated(locked); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Operation failed."); }
    finally { setLoading(false); }
  }, [study.study_id, overrides, piNotes, onUpdated, onClose]);

  const handleFlag = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const updated = await verifyStudy(study.study_id, { study_id: study.study_id, field_overrides: {}, pi_approved: false, pi_notes: `[Flagged for re-extraction] ${piNotes}`.trim() });
      setFlagged(true); onUpdated(updated);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Flag operation failed."); }
    finally { setLoading(false); }
  }, [study.study_id, piNotes, onUpdated]);

  if (flagged) return <div className="panel verification-panel"><div className="verification-success"><CheckCircle2 size={22} aria-hidden="true" /><div><strong>Study flagged for re-extraction</strong><p>The PI decision was saved without locking this record.</p></div></div><button className="btn btn-secondary" type="button" onClick={onClose}>Close</button></div>;

  const rows: Array<{label:string; key:keyof ExtractedEffect; type?:"text"|"number"|"select"; options?:string[]}> = [
    { label: "Effect r", key: "effect_r", type: "number" },
    { label: "t-statistic", key: "effect_t", type: "number" },
    { label: "Beta (β)", key: "effect_beta", type: "number" },
    { label: "df", key: "effect_df", type: "number" },
    { label: "N (sample size)", key: "sample_n", type: "number" },
    { label: "p-value", key: "p_value", type: "number" },
    { label: "CI lower", key: "ci_lower", type: "number" },
    { label: "CI upper", key: "ci_upper", type: "number" },
    { label: "DOI measure", key: "doi_measure", type: "select", options: ["FSTS", "GEO", "EXP", "FDI", "COMP", "OTH"] satisfies DoiMeasure[] },
    { label: "Performance measure", key: "performance_measure", type: "select", options: ["ACC", "MKT", "LAB", "MIX"] satisfies PerformanceMeasure[] },
    { label: "ICRV regime (PI-assigned)", key: "icrv_regime", type: "select", options: ["I", "II", "III", "FR", "MX"] satisfies IcrvRegime[] },
    { label: "DPL phase (PI-derived)", key: "dpl_phase", type: "select", options: ["PRE", "SPN", "FOL"] satisfies DplPhase[] },
    { label: "cDAI 0–1 (PI-assigned)", key: "cdai_score", type: "number" },
  ];

  return (
    <div className="panel verification-panel">
      <div className="panel-header verification-panel-header"><div><span className="panel-eyebrow">Human verification</span><h2 className="panel-title">Machine proposal → PI decision</h2></div><button className="btn-icon" type="button" onClick={onClose} aria-label="Close panel">✕</button></div>
      <p className="study-subtitle"><strong>{study.paper_title}</strong><span>{study.authors} · {study.year} · {study.country || "Unspecified"}</span></p>
      <div className="provenance-strip" aria-label="Record provenance">
        <div><Bot size={18} aria-hidden="true" /><span>Machine proposal</span><strong>{study.machine_proposal ? "Preserved" : "Legacy record"}</strong></div>
        <div><Fingerprint size={18} aria-hidden="true" /><span>Confidence</span><strong>{(study.extraction_confidence * 100).toFixed(0)}%</strong></div>
        <div className={warningCount ? "has-warning" : ""}><AlertTriangle size={18} aria-hidden="true" /><span>Conversion warnings</span><strong>{warningCount}</strong></div>
        <div><UserCheck size={18} aria-hidden="true" /><span>PI changes this session</span><strong>{humanChangeCount}</strong></div>
      </div>
      {(study.df_imputed || study.beta_outside_pb_domain) && <div className="conversion-warning-stack">
        {study.df_imputed && <div className="conversion-warning"><AlertTriangle size={17} aria-hidden="true" /><div><strong>Degrees of freedom were imputed</strong><p>The extraction pipeline used df = N − 2 because the source did not report degrees of freedom. Verify the source statistic before locking.</p></div></div>}
        {study.beta_outside_pb_domain && <div className="conversion-warning"><AlertTriangle size={17} aria-hidden="true" /><div><strong>β is outside the Peterson–Brown derivation domain</strong><p>|β| exceeds 0.5. The converted effect requires explicit PI judgement.</p></div></div>}
      </div>}
      {study.pi_locked && <div className="alert alert-success lock-banner"><LockKeyhole size={17} aria-hidden="true" /><div><strong>This record is permanently locked.</strong><span>{study.locked_at ? ` Locked ${new Date(study.locked_at).toLocaleString()}.` : " Read-only view."}</span></div></div>}
      <div className="verification-legend"><span><Bot size={14} aria-hidden="true" />Machine = immutable first proposal</span><span><Clock3 size={14} aria-hidden="true" />Current = saved record</span><span><UserCheck size={14} aria-hidden="true" />PI decision = editable until lock</span></div>
      <div className="field-table-wrap"><table className="field-table field-table-provenance"><thead><tr><th>Field</th><th>Machine</th><th>Current</th><th>PI decision</th></tr></thead><tbody>
        {rows.map((row) => <FieldRow key={row.key} label={row.label} fieldKey={row.key} machine={machine[row.key]} original={study[row.key]} override={overrides[row.key]} onOverride={setOverride} inputType={row.type} selectOptions={row.options} locked={study.pi_locked} />)}
      </tbody></table></div>
      <div className="form-row pi-notes-field"><label className="form-label" htmlFor="vp-notes">PI notes and decision rationale</label><textarea id="vp-notes" className="form-input form-textarea" value={piNotes} onChange={(event) => setPiNotes(event.target.value)} placeholder="Record ambiguity, source-page evidence, correction rationale, or exclusion decision…" rows={4} disabled={study.pi_locked} /></div>
      {error && <p className="error-message">{error}</p>}
      {!study.pi_locked && <div className="action-row verification-actions"><button className="btn btn-danger" type="button" onClick={handleFlag} disabled={loading}>Flag for re-extraction</button><button className="btn btn-primary" type="button" onClick={handleApproveAndLock} disabled={loading}><LockKeyhole size={16} aria-hidden="true" />{loading ? "Saving…" : "Approve & permanently lock"}</button></div>}
    </div>
  );
}
