/** Searchable Study Library and PI review workspace. */
import { CheckCircle2, Filter, LockKeyhole, RefreshCw, Search, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStudies } from "../api";
import { DplPhase, getConfidenceTier, IcrvRegime, StudyDatabaseEntry, StudyFilters } from "../types";
import VerificationPanel from "./VerificationPanel";

type SortMode = "newest" | "oldest" | "year-desc" | "confidence-asc";

function StatusBadge({ study }: { study: StudyDatabaseEntry }) {
  if (study.pi_locked) return <span className="badge badge-success"><LockKeyhole size={12} aria-hidden="true" /> Locked</span>;
  if (!study.requires_verification) return <span className="badge badge-medium"><CheckCircle2 size={12} aria-hidden="true" /> Approved</span>;
  return <span className="badge badge-warn">Needs review</span>;
}

function FilterBar({ filters, onChange }: { filters: StudyFilters; onChange: (filters: StudyFilters) => void }) {
  return <div className="filter-bar">
    <span className="filter-bar-label"><Filter size={14} aria-hidden="true" />Filters</span>
    <select className="filter-select" value={filters.icrv ?? ""} onChange={(event) => onChange({ ...filters, icrv: (event.target.value as IcrvRegime) || undefined })} aria-label="Filter by ICRV regime"><option value="">All ICRV</option>{(["I", "II", "III", "FR", "MX"] as IcrvRegime[]).map((regime) => <option key={regime} value={regime}>Regime {regime}</option>)}</select>
    <select className="filter-select" value={filters.dpl ?? ""} onChange={(event) => onChange({ ...filters, dpl: (event.target.value as DplPhase) || undefined })} aria-label="Filter by DPL phase"><option value="">All DPL</option>{(["PRE", "SPN", "FOL"] as DplPhase[]).map((phase) => <option key={phase} value={phase}>{phase}</option>)}</select>
    <select className="filter-select" value={filters.verified === true ? "true" : filters.verified === false ? "false" : ""} onChange={(event) => onChange({ ...filters, verified: event.target.value === "true" ? true : event.target.value === "false" ? false : null })} aria-label="Filter by verification status"><option value="">All verification</option><option value="true">Verified</option><option value="false">Needs review</option></select>
    <select className="filter-select" value={filters.locked === true ? "true" : filters.locked === false ? "false" : ""} onChange={(event) => onChange({ ...filters, locked: event.target.value === "true" ? true : event.target.value === "false" ? false : null })} aria-label="Filter by lock status"><option value="">All lock status</option><option value="true">Locked</option><option value="false">Unlocked</option></select>
  </div>;
}

export default function VerificationDashboard() {
  const [studies, setStudies] = useState<StudyDatabaseEntry[]>([]);
  const [filters, setFilters] = useState<StudyFilters>({});
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StudyDatabaseEntry | null>(null);

  const loadStudies = useCallback(async (activeFilters: StudyFilters) => {
    setLoading(true); setError(null);
    try { setStudies(await fetchStudies(activeFilters)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to load studies."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadStudies(filters); }, [filters, loadStudies]);

  const visibleStudies = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = normalizedQuery ? studies.filter((study) => [study.paper_title, study.authors, study.country, String(study.year), study.doi_measure ?? "", study.performance_measure ?? ""].join(" ").toLocaleLowerCase().includes(normalizedQuery)) : [...studies];
    return filtered.sort((first, second) => {
      if (sortMode === "oldest") return new Date(first.extracted_at).getTime() - new Date(second.extracted_at).getTime();
      if (sortMode === "year-desc") return second.year - first.year;
      if (sortMode === "confidence-asc") return first.extraction_confidence - second.extraction_confidence;
      return new Date(second.extracted_at).getTime() - new Date(first.extracted_at).getTime();
    });
  }, [query, sortMode, studies]);

  const summary = useMemo(() => ({
    total: studies.length,
    needsReview: studies.filter((study) => study.requires_verification).length,
    locked: studies.filter((study) => study.pi_locked).length,
    warnings: studies.filter((study) => study.df_imputed || study.beta_outside_pb_domain).length,
  }), [studies]);

  const handleUpdated = useCallback((updated: StudyDatabaseEntry) => {
    setStudies((previous) => previous.map((study) => study.study_id === updated.study_id ? updated : study));
    setSelected(updated);
  }, []);

  const filtersActive = Boolean(filters.icrv) || Boolean(filters.dpl) || (filters.verified !== null && filters.verified !== undefined) || (filters.locked !== null && filters.locked !== undefined) || Boolean(query);
  const clearFilters = useCallback(() => { setFilters({}); setQuery(""); }, []);

  return <div className="study-library">
    <section className="library-toolbar panel">
      <div className="library-summary"><div><span>Records</span><strong>{summary.total}</strong></div><div><span>Needs review</span><strong>{summary.needsReview}</strong></div><div><span>Locked</span><strong>{summary.locked}</strong></div><div><span>Warnings</span><strong>{summary.warnings}</strong></div></div>
      <div className="library-search-row">
        <label className="library-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search studies</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, author, country, year, measure…" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} aria-hidden="true" /></button>}</label>
        <select className="library-sort" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="Sort studies"><option value="newest">Newest extracted</option><option value="oldest">Oldest extracted</option><option value="year-desc">Publication year</option><option value="confidence-asc">Lowest confidence first</option></select>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void loadStudies(filters)} disabled={loading}><RefreshCw size={15} className={loading ? "is-spinning" : ""} aria-hidden="true" />Refresh</button>
      </div>
      <FilterBar filters={filters} onChange={setFilters} />
      {filtersActive && <button type="button" className="clear-filter-button" onClick={clearFilters}><X size={14} aria-hidden="true" /> Clear search and filters</button>}
    </section>

    <div className="dashboard-layout">
      <div className="studies-pane">
        <div className="library-list-heading"><div><span>Study Library</span><h2 className="panel-title">{visibleStudies.length} visible record{visibleStudies.length === 1 ? "" : "s"}</h2></div><span className="library-hint">Select a row to inspect machine proposal and PI decision</span></div>
        {loading && <p className="loading-text">Loading studies…</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && visibleStudies.length === 0 && <div className="empty-state library-empty"><Search size={28} aria-hidden="true" /><p>{studies.length ? "No studies match the current search and filters." : "No studies have been extracted yet."}</p></div>}
        {visibleStudies.length > 0 && <div className="table-container"><table className="studies-table"><thead><tr><th>Title</th><th>Year</th><th>Country</th><th>r</th><th>N</th><th>Confidence</th><th>Warnings</th><th>Status</th></tr></thead><tbody>
          {visibleStudies.map((study) => {
            const tier = getConfidenceTier(study.extraction_confidence);
            const warningCount = Number(study.df_imputed) + Number(study.beta_outside_pb_domain);
            return <tr key={study.study_id} className={`study-row ${selected?.study_id === study.study_id ? "selected" : ""}`} onClick={() => setSelected(study)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setSelected(study)} aria-label={`Open study: ${study.paper_title}`}>
              <td className="title-cell" title={study.paper_title}><strong>{study.paper_title.length > 64 ? `${study.paper_title.slice(0, 61)}…` : study.paper_title}</strong><span>{study.authors || "—"}</span></td><td>{study.year}</td><td>{study.country || "—"}</td><td className="mono">{study.effect_r !== null ? study.effect_r.toFixed(3) : "—"}</td><td className="mono">{study.sample_n ?? "—"}</td><td><span className={`badge badge-${tier === "high" ? "success" : tier === "medium" ? "medium" : "low"}`}>{(study.extraction_confidence * 100).toFixed(0)}%</span></td><td>{warningCount ? <span className="warning-count">{warningCount}</span> : <span className="muted-dash">—</span>}</td><td><StatusBadge study={study} /></td>
            </tr>;
          })}
        </tbody></table></div>}
      </div>
      {selected && <div className="detail-pane"><VerificationPanel study={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} /></div>}
    </div>
  </div>;
}
