import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const webRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repoRoot = resolve(webRoot, "..");
const distDir = join(webRoot, "dist");
const deployDir = join(tmpdir(), "tolstoy-cli-gh-pages-worktree");

function run(command, args, cwd = repoRoot, options = {}) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    ...options
  });
}

function tryRun(command, args, cwd = repoRoot) {
  try {
    run(command, args, cwd);
    return true;
  } catch {
    return false;
  }
}

function copyDirectory(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const source = join(from, entry);
    const target = join(to, entry);
    if (statSync(source).isDirectory()) {
      copyDirectory(source, target);
    } else {
      copyFileSync(source, target);
    }
  }
}

if (!existsSync(distDir)) {
  throw new Error("dist directory is missing. Run npm run build before deploy.");
}

if (existsSync(deployDir)) {
  rmSync(deployDir, { recursive: true, force: true });
}

tryRun("git", ["fetch", "origin", "gh-pages"]);

if (!tryRun("git", ["worktree", "add", "-B", "gh-pages", deployDir, "origin/gh-pages"])) {
  run("git", ["worktree", "add", "-B", "gh-pages", deployDir, "HEAD"]);
}

for (const entry of readdirSync(deployDir)) {
  if (entry !== ".git") {
    rmSync(join(deployDir, entry), { recursive: true, force: true });
  }
}

copyDirectory(distDir, deployDir);
copyFileSync(join(webRoot, "public", ".nojekyll"), join(deployDir, ".nojekyll"));

run("git", ["add", "-A"], deployDir);

const hasChanges = !tryRun("git", ["diff", "--cached", "--quiet"], deployDir);
if (hasChanges) {
  run("git", ["commit", "-m", "Деплой лендинга на gh-pages"], deployDir);
} else {
  console.log("No gh-pages changes to commit.");
}

run("git", ["push", "origin", "gh-pages", "--force-with-lease"], deployDir);
run("git", ["worktree", "remove", deployDir, "--force"], repoRoot);
