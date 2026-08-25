import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "../../../..");
const protocolPath = resolve(repoRoot, "docs/sprint-blueprint.md");
const skillPath = resolve(repoRoot, ".agents/skills/halo-sprint/SKILL.md");
const sprintRecordPath = resolve(
  repoRoot,
  ".agents/skills/halo-sprint/references/sprint-record-template.md",
);
const pilotScorecardPath = resolve(
  repoRoot,
  ".agents/skills/halo-sprint/references/pilot-scorecard-template.md",
);
const gstackBaselinePath = resolve(
  repoRoot,
  ".agents/skills/halo-sprint/references/gstack-v1.60.1.0-baseline.md",
);
const interfacePath = resolve(
  repoRoot,
  ".agents/skills/halo-sprint/agents/openai.yaml",
);

const requiredFiles = [
  protocolPath,
  skillPath,
  sprintRecordPath,
  pilotScorecardPath,
  gstackBaselinePath,
  interfacePath,
];

const readArtifacts = () =>
  requiredFiles.map((path) => readFileSync(path, "utf8")).join("\n");

describe("HALO sprint workflow contract", () => {
  test("publishes the operator artifacts and templates", () => {
    // Arrange
    const paths = requiredFiles;

    // Act
    const missing = paths.filter((path) => !existsSync(path));

    // Assert
    expect(missing).toEqual([]);
  });

  test("marks the protocol and skill as canonical repository context", () => {
    // Arrange
    const artifacts = [protocolPath, skillPath].map((path) =>
      readFileSync(path, "utf8"),
    );
    const requiredMetadata = [
      "owner: engineering",
      "authority: canonical",
      "scope: repository",
    ];

    // Act
    const missing = artifacts.flatMap((artifact, artifactIndex) =>
      requiredMetadata
        .filter((entry) => !artifact.includes(entry))
        .map((entry) => `${artifactIndex}:${entry}`),
    );

    // Assert
    expect(missing).toEqual([]);
  });

  test("declares the stable operator and sprint-record interface", () => {
    // Arrange
    const content = readArtifacts();
    const requiredTokens = [
      "name: halo-sprint",
      "$halo-sprint <goal>",
      "$halo-sprint status",
      "$halo-sprint resume",
      "/halo-sprint <goal>",
      "/halo-sprint status",
      "/halo-sprint resume",
      "halo.sprint/v1",
      "StageResult",
      "sprint manifest",
      "a3259400a366593e0c909dd9ac3e59752efd2488",
      "SKILL.md.tmpl",
      "Installed Codex Runtime Hashes",
      "MODEL_OVERLAY: claude",
      ".notes/sprints/",
      "not_started",
      "in_progress",
      "passed",
      "blocked",
      "needs_decision",
      "skipped",
    ];

    // Act
    const missing = requiredTokens.filter((token) => !content.includes(token));

    // Assert
    expect(missing).toEqual([]);
  });

  test("pins risk, authority, approval, and verification boundaries", () => {
    // Arrange
    const content = readArtifacts();
    const requiredTokens = [
      "R0",
      "R1",
      "R2",
      "R3",
      "Dan",
      "Fred",
      "Taylor",
      "action",
      "SHA",
      "environment",
      "target",
      "origin/main",
      "bun run verify",
      "bun run verify:full",
      "/ship",
      "/land-and-deploy",
      "three repair cycles",
    ];

    // Act
    const missing = requiredTokens.filter((token) => !content.includes(token));

    // Assert
    expect(missing).toEqual([]);
  });
});
