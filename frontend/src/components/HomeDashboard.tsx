import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Database,
  Download,
  FileSearch,
  LockKeyhole,
  Network,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchHealth, fetchStudies } from "../api";
import type { HealthResponse, StudyDatabaseEntry } from "../types";

type Locale = "vi" | "en";
type Destination = "extract" | "review" | "intelligence" | "export";

interface HomeDashboardProps {
  locale: Locale;
  onNavigate: (destination: Destination) => void;
}

const copy = {
  vi: {
    eyebrow: "M-AIDA Research Intelligence",
    title: "Từ PDF đến dữ liệu phân tích có thể kiểm chứng.",
    intro: "Một không gian thống nhất để nhận diện thống kê, theo dõi chuyển đổi, kiểm chứng bằng con người, khóa quyết định và xuất dữ liệu.",
    refresh: "Làm mới",
    newExtraction: "Trích xuất tài liệu",
    openReview: "Mở hàng đợi kiểm chứng",
    records: "Bản ghi nghiên cứu",
    review: "Cần PI kiểm chứng",
    locked: "Đã khóa",
    ready: "Sẵn sàng xuất",
    workflow: "Dòng công việc có kiểm soát",
    workflowHelp: "Mỗi bước giữ rõ ranh giới giữa đề xuất của máy và quyết định của PI.",
    recent: "Bản ghi gần đây",
    noRecent: "Chưa có bản ghi. Bắt đầu bằng một PDF nghiên cứu.",
    atlas: "Mở Evidence Atlas",
    export: "Đến trung tâm xuất dữ liệu",
    backend: "Backend",
    storage: "Lưu trữ",
    extraction: "Trích xuất",
    online: "Sẵn sàng",
    offline: "Chưa kết nối",
    persistent: "SQLite bền vững",
    unknown: "Đang kiểm tra",
    needsReview: "Cần kiểm chứng",
    piLocked: "PI đã khóa",
    approved: "Đã duyệt",
  },
  en: {
    eyebrow: "M-AIDA Research Intelligence",
    title: "From PDF to analysis-ready evidence with an audit trail.",
    intro: "One coherent workspace to identify statistics, trace conversions, verify with a human, lock decisions, and export evidence.",
    refresh: "Refresh",
    newExtraction: "Extract a paper",
    openReview: "Open verification queue",
    records: "Research records",
    review: "Needs PI review",
    locked: "PI locked",
    ready: "Ready to export",
    workflow: "Controlled evidence workflow",
    workflowHelp: "Each stage preserves the boundary between machine proposals and PI decisions.",
    recent: "Recent records",
    noRecent: "No records yet. Start with a research PDF.",
    atlas: "Open Evidence Atlas",
    export: "Go to export center",
    backend: "Backend",
    storage: "Storage",
    extraction: "Extraction",
    online: "Ready",
    offline: "Disconnected",
    persistent: "Persistent SQLite",
    unknown: "Checking",
    needsReview: "Needs review",
    piLocked: "PI locked",
    approved: "Approved",
  },
} satisfies Record<Locale, Record<string, string>>;

function statusFor(study: StudyDatabaseEntry, locale: Locale) {
  const labels = copy[locale];
  if (study.pi_locked) return { label: labels.piLocked, tone: "success" };
  if (study.requires_verification) return { label: labels.needsReview, tone: "warn" };
  return { label: labels.approved, tone: "info" };
}

export default function HomeDashboard({ locale, onNavigate }: HomeDashboardProps) {
  const labels = copy[locale];
  const [studies, setStudies] = useState<StudyDatabaseEntry[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reachable, setReachable] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [studiesResult, healthResult] = await Promise.allSettled([fetchStudies(), fetchHealth()]);
    if (studiesResult.status === "fulfilled") setStudies(studiesResult.value);
    if (healthResult.status === "fulfilled") {
      setHealth(healthResult.value);
      setReachable(true);
    } else setReachable(false);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const summary = useMemo(() => ({
    total: studies.length,
    review: studies.filter((study) => study.requires_verification).length,
    locked: studies.filter((study) => study.pi_locked).length,
  }), [studies]);

  const recent = useMemo(() => [...studies]
    .sort((a, b) => new Date(b.extracted_at).getTime() - new Date(a.extracted_at).getTime())
    .slice(0, 5), [studies]);

  const workflow = [
    { label: locale === "vi" ? "Nhận diện" : "Identify", detail: "PDF + metadata", value: summary.total, icon: FileSearch, action: () => onNavigate("extract") },
    { label: locale === "vi" ? "Chuyển đổi" : "Convert", detail: locale === "vi" ? "r trực tiếp hoặc quy đổi có cảnh báo" : "direct or converted r with warnings", value: studies.filter((study) => study.effect_r !== null).length, icon: Sparkles, action: () => onNavigate("review") },
    { label: locale === "vi" ? "Kiểm chứng" : "Verify", detail: locale === "vi" ? "machine proposal và PI override" : "machine proposal and PI override", value: summary.review, icon: ShieldCheck, action: () => onNavigate("review") },
    { label: locale === "vi" ? "Khóa" : "Lock", detail: locale === "vi" ? "quyết định PI bất biến" : "immutable PI decision", value: summary.locked, icon: LockKeyhole, action: () => onNavigate("review") },
    { label: locale === "vi" ? "Xuất" : "Export", detail: locale === "vi" ? "chỉ dữ liệu đã khóa" : "locked evidence only", value: summary.locked, icon: Download, action: () => onNavigate("export") },
  ];

  const kpis = [
    { label: labels.records, value: summary.total, icon: Database, tone: "cyan" },
    { label: labels.review, value: summary.review, icon: CircleAlert, tone: "amber" },
    { label: labels.locked, value: summary.locked, icon: LockKeyhole, tone: "purple" },
    { label: labels.ready, value: summary.locked, icon: CheckCircle2, tone: "green" },
  ];

  return (
    <section className="home-dashboard">
      <header className="home-hero">
        <div className="home-hero-copy">
          <span className="page-kicker">{labels.eyebrow}</span>
          <h2>{labels.title}</h2>
          <p>{labels.intro}</p>
          <div className="home-hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate("extract")}><FileSearch size={17} aria-hidden="true" />{labels.newExtraction}</button>
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate("review")}><ShieldCheck size={17} aria-hidden="true" />{labels.openReview}</button>
          </div>
        </div>
        <div className="system-readiness-card">
          <div className="system-readiness-head">
            <div><span>{locale === "vi" ? "Trạng thái hệ thống" : "System readiness"}</span><strong>{reachable === false ? labels.offline : labels.online}</strong></div>
            <button type="button" className="icon-button" onClick={() => void load()} disabled={loading} aria-label={labels.refresh}><RefreshCw size={17} className={loading ? "is-spinning" : ""} aria-hidden="true" /></button>
          </div>
          <dl className="system-readiness-list">
            <div><dt>{labels.backend}</dt><dd className={reachable ? "is-ok" : "is-bad"}>{reachable ? `v${health?.version ?? "?"}` : reachable === false ? labels.offline : labels.unknown}</dd></div>
            <div><dt>{labels.storage}</dt><dd className={health?.storage === "sqlite" ? "is-ok" : ""}>{health?.storage === "sqlite" ? labels.persistent : health?.storage ?? labels.unknown}</dd></div>
            <div><dt>{labels.extraction}</dt><dd>{health?.extraction_mode === "live" ? "Live" : health?.extraction_mode === "rehearsed_fallback" ? "Rehearsed fallback" : health?.extraction_mode === "unavailable" ? labels.offline : labels.unknown}</dd></div>
          </dl>
        </div>
      </header>

      <div className="home-kpi-grid">
        {kpis.map((item) => { const Icon = item.icon; return <article className={`home-kpi-card tone-${item.tone}`} key={item.label}><div className="home-kpi-icon"><Icon size={19} aria-hidden="true" /></div><span>{item.label}</span><strong>{loading ? "…" : item.value}</strong></article>; })}
      </div>

      <article className="workflow-card">
        <div className="section-heading-row"><div><span className="section-label">Governed workflow</span><h3>{labels.workflow}</h3><p>{labels.workflowHelp}</p></div></div>
        <div className="workflow-steps">
          {workflow.map((step, index) => { const Icon = step.icon; return <React.Fragment key={step.label}><button type="button" className="workflow-step" onClick={step.action}><span className="workflow-index">{String(index + 1).padStart(2, "0")}</span><Icon size={20} aria-hidden="true" /><strong>{step.label}</strong><small>{step.detail}</small><b>{step.value}</b></button>{index < workflow.length - 1 && <ArrowRight className="workflow-arrow" size={18} aria-hidden="true" />}</React.Fragment>; })}
        </div>
      </article>

      <div className="home-lower-grid">
        <article className="recent-card">
          <div className="section-heading-row"><div><span className="section-label">Study Library</span><h3>{labels.recent}</h3></div><button type="button" className="text-button" onClick={() => onNavigate("review")}>{labels.openReview}<ArrowRight size={14} aria-hidden="true" /></button></div>
          {recent.length === 0 ? <div className="empty-state"><Database size={28} aria-hidden="true" /><p>{labels.noRecent}</p></div> : <div className="recent-list">{recent.map((study) => { const status = statusFor(study, locale); return <button type="button" className="recent-row" key={study.study_id} onClick={() => onNavigate("review")}><div><strong>{study.paper_title || "(untitled)"}</strong><span>{study.authors || "—"} · {study.year} · {study.country || "—"}</span></div><span className={`status-chip tone-${status.tone}`}>{status.label}</span></button>; })}</div>}
        </article>
        <article className="insight-shortcuts">
          <button type="button" className="shortcut-card shortcut-atlas" onClick={() => onNavigate("intelligence")}><Network size={24} aria-hidden="true" /><span>Evidence Atlas</span><strong>{locale === "vi" ? "Xem địa lý, landscape và khoảng trống mô tả" : "Explore geography, effect landscape, and descriptive gaps"}</strong><em>{labels.atlas}<ArrowRight size={14} aria-hidden="true" /></em></button>
          <button type="button" className="shortcut-card shortcut-export" onClick={() => onNavigate("export")}><Download size={24} aria-hidden="true" /><span>Export Center</span><strong>{locale === "vi" ? `${summary.locked} bản ghi đã khóa sẵn sàng` : `${summary.locked} locked record(s) ready`}</strong><em>{labels.export}<ArrowRight size={14} aria-hidden="true" /></em></button>
        </article>
      </div>
    </section>
  );
}
