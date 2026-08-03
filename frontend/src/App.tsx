/**
 * M-AIDA v7.2 UI integration shell.
 *
 * This branch keeps the registered v7.1.1 research baseline unchanged while
 * unifying the internal web/mobile release-candidate experience.
 */

import { App as CapacitorApp } from "@capacitor/app";
import { Share } from "@capacitor/share";
import {
  BookOpen,
  CheckSquare2,
  Download,
  ExternalLink,
  FileSearch,
  Home,
  Languages,
  Menu,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ExportPanel from "./components/ExportPanel";
import ExtractionPanel from "./components/ExtractionPanel";
import HomeDashboard from "./components/HomeDashboard";
import ResearchIntelligence from "./components/ResearchIntelligence";
import StatusBanner from "./components/StatusBanner";
import VerificationDashboard from "./components/VerificationDashboard";
import { runtimeConfig } from "./config";
import type { StudyDatabaseEntry } from "./types";
import "./index.css";
import "./ui-system.css";

type AppSection = "home" | "extract" | "review" | "intelligence" | "export";
type Locale = "vi" | "en";

const shellCopy = {
  vi: {
    product: "Không gian nghiên cứu",
    home: "Tổng quan",
    extract: "Trích xuất",
    review: "Kiểm chứng",
    intelligence: "Evidence Atlas",
    export: "Xuất dữ liệu",
    share: "Chia sẻ",
    menu: "Điều hướng",
    internal: "Bản đánh giá nội bộ",
    gate:
      "Chưa được phép phát hành lên cửa hàng cho đến khi hoàn tất thỏa thuận sở hữu trí tuệ CTU và các cổng phê duyệt.",
    openWebsite: "Mở website học thuật",
    human: "Human-in-the-loop · PI verification required",
  },
  en: {
    product: "Research workspace",
    home: "Overview",
    extract: "Extract",
    review: "Verify",
    intelligence: "Evidence Atlas",
    export: "Export",
    share: "Share",
    menu: "Navigation",
    internal: "Internal evaluation build",
    gate:
      "Store publication remains blocked until the CTU intellectual-property agreement and release gates are approved.",
    openWebsite: "Open academic website",
    human: "Human-in-the-loop · PI verification required",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>("home");
  const [extractionCount, setExtractionCount] = useState(0);
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "vi";
    return window.localStorage.getItem("maida-locale") === "en" ? "en" : "vi";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copy = shellCopy[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("maida-locale", locale);
  }, [locale]);

  const handleExtracted = useCallback((_entry: StudyDatabaseEntry) => {
    setExtractionCount((current) => current + 1);
  }, []);

  const shareApp = useCallback(async () => {
    await Share.share({
      title: "M-AIDA Research",
      text:
        locale === "vi"
          ? "M-AIDA hỗ trợ trích xuất dữ liệu nghiên cứu có kiểm chứng của con người."
          : "M-AIDA supports human-verified data extraction for meta-analysis research.",
      url: runtimeConfig.supportUrl,
      dialogTitle: copy.share,
    });
  }, [copy.share, locale]);

  useEffect(() => {
    if (!runtimeConfig.isNative || runtimeConfig.platform !== "android") return;
    let removeListener: (() => Promise<void>) | undefined;
    void CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (mobileMenuOpen) setMobileMenuOpen(false);
      else if (activeSection !== "home") setActiveSection("home");
      else if (canGoBack) window.history.back();
      else void CapacitorApp.minimizeApp();
    }).then((handle) => {
      removeListener = () => handle.remove();
    });
    return () => {
      if (removeListener) void removeListener();
    };
  }, [activeSection, mobileMenuOpen]);

  const canShare =
    runtimeConfig.isNative ||
    (typeof navigator !== "undefined" && typeof navigator.share === "function");

  const navigation = useMemo(
    () => [
      { id: "home" as const, label: copy.home, icon: Home },
      { id: "extract" as const, label: copy.extract, icon: FileSearch },
      {
        id: "review" as const,
        label: copy.review,
        icon: CheckSquare2,
        badge: extractionCount,
      },
      { id: "intelligence" as const, label: copy.intelligence, icon: Network },
      { id: "export" as const, label: copy.export, icon: Download },
    ],
    [copy, extractionCount]
  );

  const navigate = useCallback((section: AppSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const activeLabel =
    navigation.find((item) => item.id === activeSection)?.label ?? copy.home;

  return (
    <div className={`workspace-shell ${sidebarCollapsed ? "is-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        {locale === "vi" ? "Bỏ qua đến nội dung chính" : "Skip to main content"}
      </a>

      <aside className="workspace-sidebar" aria-label={copy.menu}>
        <div className="workspace-brand">
          <div className="brand-mark" aria-hidden="true">
            M
          </div>
          <div className="brand-copy">
            <strong>M-AIDA</strong>
            <span>{copy.product}</span>
          </div>
        </div>

        <nav className="workspace-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`workspace-nav-item ${
                  activeSection === item.id ? "is-active" : ""
                }`}
                aria-current={activeSection === item.id ? "page" : undefined}
                onClick={() => navigate(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{item.label}</span>
                {!!item.badge && <b>{item.badge}</b>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-context">
          <div className="context-label">M-AIDA v{runtimeConfig.appVersion}</div>
          <p>{copy.human}</p>
          <a
            href={runtimeConfig.supportUrl}
            target="_blank"
            rel="noreferrer"
            className="context-link"
          >
            <BookOpen size={15} aria-hidden="true" />
            {copy.openWebsite}
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          className="sidebar-collapse"
          onClick={() => setSidebarCollapsed((current) => !current)}
          aria-label={
            sidebarCollapsed
              ? locale === "vi"
                ? "Mở rộng thanh điều hướng"
                : "Expand navigation"
              : locale === "vi"
              ? "Thu gọn thanh điều hướng"
              : "Collapse navigation"
          }
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={18} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={18} aria-hidden="true" />
          )}
        </button>
      </aside>

      <div className="workspace-body">
        <header className="workspace-topbar">
          <button
            className="mobile-menu-trigger"
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-expanded={mobileMenuOpen}
            aria-label={copy.menu}
          >
            <Menu size={21} aria-hidden="true" />
          </button>

          <div className="topbar-title">
            <span>{copy.product}</span>
            <h1>{activeLabel}</h1>
          </div>

          <div className="topbar-actions">
            <button
              className="utility-button"
              type="button"
              onClick={() => setLocale((current) => (current === "vi" ? "en" : "vi"))}
              aria-label={
                locale === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"
              }
            >
              <Languages size={17} aria-hidden="true" />
              <span>{locale === "vi" ? "VI" : "EN"}</span>
            </button>
            {canShare && (
              <button
                className="utility-button"
                type="button"
                onClick={() => void shareApp()}
              >
                <Share2 size={17} aria-hidden="true" />
                <span>{copy.share}</span>
              </button>
            )}
          </div>
        </header>

        {mobileMenuOpen && (
          <nav className="mobile-drawer" aria-label={copy.menu}>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={activeSection === item.id ? "is-active" : ""}
                  onClick={() => navigate(item.id)}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {!runtimeConfig.storePublicationAllowed && (
          <aside className="release-gate" aria-label="Release status">
            <strong>{copy.internal}.</strong> {copy.gate}
          </aside>
        )}

        <StatusBanner />

        <main className="workspace-main" id="main-content">
          {activeSection === "home" && (
            <HomeDashboard locale={locale} onNavigate={navigate} />
          )}

          {activeSection === "extract" && (
            <section className="workspace-page">
              <header className="page-heading">
                <span className="page-kicker">01 · Identify & Extract</span>
                <h2>
                  {locale === "vi"
                    ? "Đưa tài liệu vào quy trình có kiểm chứng"
                    : "Bring evidence into a verifiable workflow"}
                </h2>
                <p>
                  {locale === "vi"
                    ? "PDF được trích xuất thành đề xuất của máy; mọi quyết định phân tích vẫn phải qua PI."
                    : "PDFs become machine proposals; every analysis decision still requires PI review."}
                </p>
              </header>
              <ExtractionPanel onExtracted={handleExtracted} />
              {extractionCount > 0 && (
                <div className="next-step-card">
                  <div>
                    <span>
                      {locale === "vi" ? "Bước kế tiếp" : "Next step"}
                    </span>
                    <strong>
                      {extractionCount}{" 