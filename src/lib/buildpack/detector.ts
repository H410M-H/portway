/**
 * Syncbay PaaS — Buildpack Runtime Auto-Detection Engine (R2 Core)
 * Analyzes repository structure, file manifests, and lockfiles to identify
 * programming languages, frameworks, and optimal build/run commands.
 */

export type SupportedLanguage =
  | "dockerfile"
  | "nodejs"
  | "python"
  | "go"
  | "rust"
  | "ruby"
  | "unknown";

export interface DetectedRuntime {
  language: SupportedLanguage;
  framework?: string;
  packageManager?: string;
  installCommand: string;
  buildCommand: string;
  startCommand: string;
  defaultPort: number;
  dockerfile?: string;
  detectedFiles: string[];
  systemPackages: string[];
}

export interface DetectionOptions {
  rootDir?: string;
  fileContents?: Record<string, string>;
}

/**
 * Normalizes file path to lowercase relative posix style for matching
 */
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase();
}

/**
 * Checks if any file in the list matches the target name or pattern
 */
function hasFile(files: string[], target: string): boolean {
  const normTarget = normalizePath(target);
  return files.some((f) => {
    const norm = normalizePath(f);
    return norm === normTarget || norm.endsWith("/" + normTarget);
  });
}

/**
 * Finds exact relative file match
 */
function findFile(files: string[], target: string): string | undefined {
  const normTarget = normalizePath(target);
  return files.find((f) => {
    const norm = normalizePath(f);
    return norm === normTarget || norm.endsWith("/" + normTarget);
  });
}

/**
 * Safely parses JSON content from fileContents dictionary
 */
function tryParseJson(contents: Record<string, string> | undefined, filename: string): any {
  if (!contents) return null;
  const matchKey = Object.keys(contents).find(
    (k) => normalizePath(k) === normalizePath(filename) || normalizePath(k).endsWith("/" + normalizePath(filename))
  );
  if (!matchKey) return null;
  try {
    return JSON.parse(contents[matchKey]);
  } catch {
    return null;
  }
}

/**
 * Retrieves raw text content from fileContents dictionary
 */
function getFileContent(contents: Record<string, string> | undefined, filename: string): string | null {
  if (!contents) return null;
  const matchKey = Object.keys(contents).find(
    (k) => normalizePath(k) === normalizePath(filename) || normalizePath(k).endsWith("/" + normalizePath(filename))
  );
  return matchKey ? contents[matchKey] : null;
}

/**
 * Detects the runtime, framework, and build/start commands from a list of files.
 * Satisfies PROJECT.md contract:
 * `detectRuntime(files: string[]): { language: string; framework?: string; buildCommand: string; startCommand: string; dockerfile?: string }`
 */
export function detectRuntime(
  files: string[],
  options?: DetectionOptions | Record<string, string>
): DetectedRuntime {
  const opts: DetectionOptions =
    options && "fileContents" in options
      ? options
      : { fileContents: (options as Record<string, string>) ?? {} };

  const contents = opts.fileContents;
  const detectedFiles: string[] = [];

  // Filter files by rootDir if specified
  let scopedFiles = files;
  if (opts.rootDir) {
    const prefix = normalizePath(opts.rootDir).replace(/\/$/, "") + "/";
    scopedFiles = files
      .map((f) => normalizePath(f))
      .filter((f) => f.startsWith(prefix))
      .map((f) => f.slice(prefix.length));
  }

  // 1. Dockerfile / Containerfile (Priority 1)
  const dockerfileMatches = ["dockerfile", "containerfile", "dockerfile.prod", "dockerfile.web"];
  for (const df of dockerfileMatches) {
    const match = findFile(scopedFiles, df);
    if (match) {
      detectedFiles.push(match);
      const dfContent = getFileContent(contents, match);
      let exposePort = 8080;
      let startCmd = "docker run -p $PORT:$PORT app";

      if (dfContent) {
        const exposeMatch = dfContent.match(/EXPOSE\s+(\d+)/i);
        if (exposeMatch && exposeMatch[1]) {
          exposePort = parseInt(exposeMatch[1], 10);
        }
        const cmdMatch = dfContent.match(/CMD\s+\[?([^\]\n]+)\]?/i);
        if (cmdMatch && cmdMatch[1]) {
          startCmd = cmdMatch[1].replace(/["',]/g, " ").trim();
        }
      }

      return {
        language: "dockerfile",
        packageManager: "docker",
        installCommand: "",
        buildCommand: "docker build -t app .",
        startCommand: startCmd,
        defaultPort: exposePort,
        dockerfile: dfContent ?? "FROM scratch\n# User provided Dockerfile",
        detectedFiles,
        systemPackages: [],
      };
    }
  }

  // 2. Node.js (Priority 2)
  if (hasFile(scopedFiles, "package.json")) {
    const pkgJsonFile = findFile(scopedFiles, "package.json")!;
    detectedFiles.push(pkgJsonFile);
    const pkgJson = tryParseJson(contents, pkgJsonFile);

    // Package manager detection
    let packageManager = "npm";
    let installCmd = "npm install";
    if (hasFile(scopedFiles, "pnpm-lock.yaml") || hasFile(scopedFiles, "pnpm-lock.yml")) {
      packageManager = "pnpm";
      installCmd = "pnpm install --frozen-lockfile";
      detectedFiles.push("pnpm-lock.yaml");
    } else if (hasFile(scopedFiles, "yarn.lock")) {
      packageManager = "yarn";
      installCmd = "yarn install --frozen-lockfile";
      detectedFiles.push("yarn.lock");
    } else if (hasFile(scopedFiles, "bun.lockb") || hasFile(scopedFiles, "bun.lock")) {
      packageManager = "bun";
      installCmd = "bun install --frozen-lockfile";
      detectedFiles.push("bun.lockb");
    } else if (hasFile(scopedFiles, "package-lock.json")) {
      packageManager = "npm";
      installCmd = "npm ci";
      detectedFiles.push("package-lock.json");
    }

    // Framework detection via package.json dependencies
    let framework = "nodejs";
    let buildCmd = `${packageManager} run build`;
    let startCmd = `${packageManager} start`;
    let defaultPort = 3000;

    const allDeps = {
      ...(pkgJson?.dependencies || {}),
      ...(pkgJson?.devDependencies || {}),
    };

    if (allDeps["next"]) {
      framework = "nextjs";
      buildCmd = `${packageManager} run build`;
      startCmd = "npx next start -p ${PORT:-3000}";
      defaultPort = 3000;
    } else if (allDeps["@remix-run/node"] || allDeps["@remix-run/react"]) {
      framework = "remix";
      buildCmd = `${packageManager} run build`;
      startCmd = `${packageManager} run start`;
      defaultPort = 3000;
    } else if (allDeps["nuxt"] || allDeps["nuxt3"]) {
      framework = "nuxt";
      buildCmd = `${packageManager} run build`;
      startCmd = "node .output/server/index.mjs";
      defaultPort = 3000;
    } else if (allDeps["vite"]) {
      framework = "vite";
      buildCmd = `${packageManager} run build`;
      startCmd = "npx serve -s dist -l ${PORT:-3000}";
      defaultPort = 3000;
    } else if (allDeps["@nestjs/core"]) {
      framework = "nestjs";
      buildCmd = `${packageManager} run build`;
      startCmd = "node dist/main.js";
      defaultPort = 3000;
    } else if (allDeps["express"] || allDeps["fastify"] || allDeps["koa"]) {
      framework = allDeps["express"] ? "express" : allDeps["fastify"] ? "fastify" : "koa";
      const hasBuildScript = Boolean(pkgJson?.scripts?.build);
      buildCmd = hasBuildScript ? `${packageManager} run build` : "";
      startCmd = pkgJson?.scripts?.start ? `${packageManager} start` : "node index.js";
      defaultPort = 8080;
    } else {
      // Generic Node.js
      const hasBuildScript = Boolean(pkgJson?.scripts?.build);
      buildCmd = hasBuildScript ? `${packageManager} run build` : "";
      startCmd = pkgJson?.scripts?.start ? `${packageManager} start` : "node index.js";
      defaultPort = 3000;
    }

    return {
      language: "nodejs",
      framework,
      packageManager,
      installCommand: installCmd,
      buildCommand: buildCmd,
      startCommand: startCmd,
      defaultPort,
      detectedFiles,
      systemPackages: ["nodejs_20", packageManager],
    };
  }

  // 3. Python (Priority 3)
  const pythonIndicators = ["requirements.txt", "pipfile", "pyproject.toml", "setup.py"];
  const matchedPython = pythonIndicators.filter((pi) => hasFile(scopedFiles, pi));
  if (matchedPython.length > 0) {
    detectedFiles.push(...matchedPython.map((f) => findFile(scopedFiles, f)!));

    let packageManager = "pip";
    let installCmd = "pip install -r requirements.txt";

    if (hasFile(scopedFiles, "poetry.lock") || (hasFile(scopedFiles, "pyproject.toml") && !hasFile(scopedFiles, "requirements.txt"))) {
      packageManager = "poetry";
      installCmd = "poetry install --no-dev";
    } else if (hasFile(scopedFiles, "pipfile")) {
      packageManager = "pipenv";
      installCmd = "pipenv install --deploy";
    } else if (hasFile(scopedFiles, "setup.py") && !hasFile(scopedFiles, "requirements.txt")) {
      installCmd = "pip install .";
    }

    // Inspect content or files for framework
    const reqContent = getFileContent(contents, "requirements.txt") || "";
    const pyprojectContent = getFileContent(contents, "pyproject.toml") || "";
    const fullText = (reqContent + "\n" + pyprojectContent).toLowerCase();

    let framework = "python";
    let startCmd = "python main.py";
    let defaultPort = 8000;

    if (fullText.includes("fastapi") || hasFile(scopedFiles, "main.py")) {
      framework = "fastapi";
      startCmd = "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}";
      defaultPort = 8000;
    } else if (fullText.includes("django") || hasFile(scopedFiles, "manage.py")) {
      framework = "django";
      startCmd = "gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}";
      defaultPort = 8000;
    } else if (fullText.includes("flask") || hasFile(scopedFiles, "app.py")) {
      framework = "flask";
      startCmd = "gunicorn app:app --bind 0.0.0.0:${PORT:-5000}";
      defaultPort = 5000;
    }

    return {
      language: "python",
      framework,
      packageManager,
      installCommand: installCmd,
      buildCommand: "",
      startCommand: startCmd,
      defaultPort,
      detectedFiles,
      systemPackages: ["python311", "gcc", "libpq-dev"],
    };
  }

  // 4. Go (Priority 4)
  if (hasFile(scopedFiles, "go.mod") || hasFile(scopedFiles, "main.go")) {
    if (hasFile(scopedFiles, "go.mod")) detectedFiles.push("go.mod");
    if (hasFile(scopedFiles, "main.go")) detectedFiles.push("main.go");

    return {
      language: "go",
      framework: "go",
      packageManager: "go",
      installCommand: "go mod download",
      buildCommand: "go build -o /app/server .",
      startCommand: "/app/server",
      defaultPort: 8080,
      detectedFiles,
      systemPackages: ["go_1_22", "ca-certificates"],
    };
  }

  // 5. Rust (Priority 5)
  if (hasFile(scopedFiles, "cargo.toml")) {
    detectedFiles.push("cargo.toml");
    if (hasFile(scopedFiles, "cargo.lock")) detectedFiles.push("cargo.lock");

    const cargoContent = getFileContent(contents, "cargo.toml") || "";
    const nameMatch = cargoContent.match(/name\s*=\s*["']([^"']+)["']/);
    const binName = nameMatch && nameMatch[1] ? nameMatch[1] : "app";

    return {
      language: "rust",
      framework: "rust",
      packageManager: "cargo",
      installCommand: "cargo fetch",
      buildCommand: "cargo build --release",
      startCommand: `./target/release/${binName}`,
      defaultPort: 8080,
      detectedFiles,
      systemPackages: ["rustc", "cargo", "gcc", "openssl"],
    };
  }

  // 6. Ruby (Priority 6)
  if (hasFile(scopedFiles, "gemfile")) {
    detectedFiles.push("gemfile");
    if (hasFile(scopedFiles, "gemfile.lock")) detectedFiles.push("gemfile.lock");

    const gemContent = getFileContent(contents, "gemfile") || "";
    let framework = "ruby";
    let buildCmd = "";
    let startCmd = "bundle exec puma -p ${PORT:-9292}";
    let defaultPort = 9292;

    if (gemContent.toLowerCase().includes("rails") || hasFile(scopedFiles, "bin/rails")) {
      framework = "rails";
      buildCmd = "bundle exec rails assets:precompile";
      startCmd = "bundle exec rails server -b 0.0.0.0 -p ${PORT:-3000}";
      defaultPort = 3000;
    } else if (gemContent.toLowerCase().includes("sinatra")) {
      framework = "sinatra";
      startCmd = "bundle exec ruby app.rb -p ${PORT:-4567}";
      defaultPort = 4567;
    }

    return {
      language: "ruby",
      framework,
      packageManager: "bundler",
      installCommand: "bundle install",
      buildCommand: buildCmd,
      startCommand: startCmd,
      defaultPort,
      detectedFiles,
      systemPackages: ["ruby_3_2", "bundler", "libpq-dev"],
    };
  }

  // Unknown fallback
  return {
    language: "unknown",
    installCommand: "",
    buildCommand: "",
    startCommand: "node index.js",
    defaultPort: 8080,
    detectedFiles: [],
    systemPackages: [],
  };
}
