import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.join(__dirname, "../scripts/release-changelog.mjs");

test("releases and reads the unreleased changelog section", (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "release-changelog-"));
  const changelogPath = path.join(tempDir, "CHANGELOG.md");
  const outputPath = path.join(tempDir, "github-output");
  const version = "v1.1.0";
  const unreleasedNotes = "### Added\n- Supports CSS aliases\n";

  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));
  fs.writeFileSync(
    changelogPath,
    `# Changelog\n\n## Unreleased\n\n${unreleasedNotes}\n## v1.0.0 - 2026-01-01\n`,
  );

  execFileSync(process.execPath, [scriptPath, "release", version, changelogPath]);

  const releasedChangelog = fs.readFileSync(changelogPath, "utf8");
  assert.match(
    releasedChangelog,
    new RegExp(`## ${version} - \\d{4}-\\d{2}-\\d{2}\\n\\n${unreleasedNotes}`),
  );
  assert.match(releasedChangelog, /## Unreleased\n\n## v1\.1\.0/);

  execFileSync(process.execPath, [scriptPath, "read", version, changelogPath], {
    env: { ...process.env, GITHUB_OUTPUT: outputPath },
  });

  const output = fs.readFileSync(outputPath, "utf8");
  const match = /^changelog<<([^\n]+)\n([\s\S]+)\n\1\n$/.exec(output);
  assert.ok(match);
  assert.match(match[2], new RegExp(`^## ${version} - \\d{4}-\\d{2}-\\d{2}`));
  assert.ok(match[2].includes(unreleasedNotes.trimEnd()));
  assert.ok(!match[2].includes("v1.0.0"));
});
