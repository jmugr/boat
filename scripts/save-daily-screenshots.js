#!/usr/bin/env node

const { execFileSync, spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const args = parseArgs(process.argv.slice(2));
const outputDir = path.resolve(args.out || "screenshots/history");
const viewport = {
  width: Number(args.width || 1440),
  height: Number(args.height || 1200)
};

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const { chromium } = require("playwright");
  const repoRoot = git(["rev-parse", "--show-toplevel"]).trim();
  const commitsByDay = getLastCommitByDay(repoRoot);
  const browserExecutable = findBrowserExecutable(args.browser);

  if (!commitsByDay.length) {
    console.log("No commits found.");
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch(
    browserExecutable ? { executablePath: browserExecutable } : undefined
  );
  try {
    for (const { date, sha } of commitsByDay) {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "site-shot-"));
      try {
        await extractCommit(repoRoot, sha, tempDir);
        const pages = args.path ? [args.path] : findHtmlPages(tempDir);
        const server = await startStaticServer(tempDir);
        const page = await browser.newPage({ viewport });

        try {
          for (const pagePath of pages) {
            await page.goto(`http://127.0.0.1:${server.port}${pagePath}`, {
              waitUntil: "networkidle"
            });

            const file = path.join(
              outputDir,
              `${date}-${sha.slice(0, 7)}-${pageName(pagePath)}.png`
            );
            await page.screenshot({ path: file, fullPage: true });
            console.log(`${date} ${sha.slice(0, 7)} ${pagePath} -> ${file}`);
          }
        } finally {
          await page.close();
          await new Promise((resolve) => server.instance.close(resolve));
        }
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } finally {
    await browser.close();
  }
}

function getLastCommitByDay(repoRoot) {
  const log = git(
    ["log", "--date=short", "--pretty=format:%cd%x09%H"],
    repoRoot
  );

  const byDay = new Map();
  for (const line of log.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [date, sha] = line.split("\t");
    if (!byDay.has(date)) byDay.set(date, sha);
  }

  return [...byDay.entries()]
    .map(([date, sha]) => ({ date, sha }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function findHtmlPages(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => (entry.name === "index.html" ? "/" : `/${entry.name}`))
    .sort((a, b) => {
      if (a === "/") return -1;
      if (b === "/") return 1;
      return a.localeCompare(b);
    });
}

function pageName(pagePath) {
  if (pagePath === "/") return "index";
  return pagePath
    .replace(/^\//, "")
    .replace(/\.html$/, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .toLowerCase();
}

function startStaticServer(root) {
  const instance = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, "http://127.0.0.1");
    const pathname = decodeURIComponent(requestUrl.pathname);
    const normalizedPath = pathname === "/" ? "/index.html" : pathname;
    const filePath = path.normalize(path.join(root, normalizedPath));

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream"
      });
      res.end(data);
    });
  });

  return new Promise((resolve, reject) => {
    instance.on("error", reject);
    instance.listen(0, "127.0.0.1", () => {
      resolve({ instance, port: instance.address().port });
    });
  });
}

function extractCommit(repoRoot, sha, targetDir) {
  return new Promise((resolve, reject) => {
    const archive = spawn("git", ["archive", "--format=tar", sha], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const tar = spawn("tar", ["-xf", "-", "-C", targetDir], {
      stdio: ["pipe", "ignore", "pipe"]
    });
    const errors = [];

    archive.stderr.on("data", (chunk) => errors.push(chunk));
    tar.stderr.on("data", (chunk) => errors.push(chunk));
    archive.stdout.pipe(tar.stdin);

    archive.on("error", reject);
    tar.on("error", reject);
    tar.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(Buffer.concat(errors).toString("utf8") || `tar exited with ${code}`));
    });
  });
}

function git(args, cwd = process.cwd(), options = {}) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    ...options
  });
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (const arg of rawArgs) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) parsed[match[1]] = match[2];
  }
  return parsed;
}

function findBrowserExecutable(requestedPath) {
  const candidates = [
    requestedPath,
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
}
