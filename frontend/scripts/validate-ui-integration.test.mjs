import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("unified shell exposes the five governed workspaces on desktop and mobile", async () => {
  const app = await read("src/App.tsx");
  for (const section of ["home", "extract", "review", "intelligence", "export"]) {
    assert.match(app, new RegExp(`id: "${section}"`));
  }
  assert.match(app, /ui-system\.css/);
  assert.match(app, /workspace-sidebar/);
  assert.match(app, /mobile-bottom-nav/);
});

test("home dashboard visualizes the controlled evidence workflow", async () => {
  const home = await read("src/components/HomeDashboard.tsx");
  for (const stage of ["Identify", "Convert", "Verify", "Lock", "Export"]) {
    assert.match(home, new RegExp(stage));
  }
  assert.match(home, /machine proposal/i);
  assert.match(home, /PI override/i);
});

test("verification UI preserves machine-human provenance and conversion warnings", async () => {
  const panel = await read("src/components/VerificationPanel.tsx");
  const types = await read("src/types.ts");
  assert.match(panel, /Machine proposal → PI decision/);
  assert.match(panel, /df = N − 2/);
  assert.match(panel, /Peterson–Brown/);
  assert.match(types, /machine_proposal: Record<string, unknown> \| null/);
  assert.match(types, /df_imputed: boolean/);
  assert.match(types, /beta_outside_pb_domain: boolean/);
});

test("study library includes search, sorting, filtering, and warning visibility", async () => {
  const dashboard = await read("src/components/VerificationDashboard.tsx");
  assert.match(dashboard, /Search title, author, country, year, measure/);
  assert.match(dashboard, /Lowest confidence first/);
  assert.match(dashboard, /Clear search and filters/);
  assert.match(dashboard, /warningCount/);
});

test("responsive design tokens include sidebar, rail, and mobile bottom navigation", async () => {
  const css = await read("src/ui-system.css");
  assert.match(css, /--maida-sidebar-width/);
  assert.match(css, /\.workspace-sidebar/);
  assert.match(css, /\.mobile-bottom-nav/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
