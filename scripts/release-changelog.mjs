import fs from "node:fs";
import { randomUUID } from "node:crypto";

const [operation, version, changelogPath = "CHANGELOG.md"] = process.argv.slice(2);

if (!version || !["read", "release"].includes(operation)) {
  throw new Error(
    "Usage: node scripts/release-changelog.mjs <read|release> <version> [changelog-path]",
  );
}

const changelog = fs.readFileSync(changelogPath, "utf8");

function findNextHeading(content, startIndex) {
  const heading = /^## /gm;
  heading.lastIndex = startIndex;
  return heading.exec(content)?.index ?? content.length;
}

function findVersionHeading(content, targetVersion) {
  const heading = /^## (v?\d+\.\d+\.\d+(?:-[^\s]+)?)\b.*$/gm;
  let match;

  while ((match = heading.exec(content))) {
    if (match[1] === targetVersion) {
      return match;
    }
  }

  throw new Error(`Version ${targetVersion} was not found in ${changelogPath}`);
}

if (operation === "release") {
  const unreleased = /^## Unreleased[^\S\r\n]*$/m.exec(changelog);

  if (!unreleased) {
    throw new Error(`An "Unreleased" heading was not found in ${changelogPath}`);
  }

  const date = new Date().toISOString().slice(0, 10);
  const insertionPoint = unreleased.index + unreleased[0].length;
  const updatedChangelog = `${changelog.slice(0, insertionPoint)}\n\n## ${version} - ${date}${changelog.slice(insertionPoint)}`;
  fs.writeFileSync(changelogPath, updatedChangelog);
} else {
  const heading = findVersionHeading(changelog, version);
  const changelogSection = changelog
    .slice(heading.index, findNextHeading(changelog, heading.index + heading[0].length))
    .trimEnd();
  const delimiter = `CHANGELOG_${randomUUID()}`;

  if (!process.env.GITHUB_OUTPUT) {
    throw new Error("GITHUB_OUTPUT must be set when reading a changelog section");
  }

  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `changelog<<${delimiter}\n${changelogSection}\n${delimiter}\n`,
  );
}
