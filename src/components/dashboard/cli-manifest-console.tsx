"use client";

import React, { useState } from "react";
import { generateStarterManifest, generateGitHubWorkflow } from "@/lib/manifest/parser";

interface CliManifestConsoleProps {
  projectName: string;
}

export function CliManifestConsole({ projectName }: CliManifestConsoleProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const manifestJson = JSON.stringify(generateStarterManifest(projectName), null, 2);
  const githubWorkflow = generateGitHubWorkflow(projectName);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* CLI Quickstart Banner */}
      <div className="border border-zinc-800 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-cyan-400 text-base">⚡</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Syncbay Developer CLI (`syncbay`)
              </h3>
            </div>
            <p className="text-zinc-400 text-xs mt-1">
              Deploy from any terminal, inspect container logs, and automate builds via CI/CD.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-300">
              <span className="text-zinc-500 mr-2">$</span>
              <code>npm install -g syncbay</code>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard("npm install -g syncbay", "npm")}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors"
            >
              {copiedSection === "npm" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Common Commands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-800/80">
          <div className="p-2.5 rounded bg-black/60 border border-zinc-800">
            <div className="text-cyan-400 font-bold mb-0.5">$ syncbay up</div>
            <div className="text-zinc-500 text-[11px]">Deploy current directory to edge</div>
          </div>
          <div className="p-2.5 rounded bg-black/60 border border-zinc-800">
            <div className="text-cyan-400 font-bold mb-0.5">$ syncbay logs web</div>
            <div className="text-zinc-500 text-[11px]">Stream real-time container logs</div>
          </div>
          <div className="p-2.5 rounded bg-black/60 border border-zinc-800">
            <div className="text-cyan-400 font-bold mb-0.5">$ syncbay init</div>
            <div className="text-zinc-500 text-[11px]">Generate syncbay.json manifest</div>
          </div>
        </div>
      </div>

      {/* Manifest & GitHub Actions Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* syncbay.json Manifest */}
        <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400">📄</span>
              <span className="font-bold text-white text-xs">syncbay.json Manifest</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(manifestJson, "manifest")}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] transition-colors"
            >
              {copiedSection === "manifest" ? "Copied!" : "Copy JSON"}
            </button>
          </div>
          <pre className="flex-1 bg-black border border-zinc-800/80 rounded-lg p-3 text-[11px] text-zinc-300 overflow-x-auto">
            {manifestJson}
          </pre>
        </div>

        {/* GitHub Actions CI/CD Workflow */}
        <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-purple-400">⚙️</span>
              <span className="font-bold text-white text-xs">.github/workflows/syncbay-deploy.yml</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(githubWorkflow, "workflow")}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] transition-colors"
            >
              {copiedSection === "workflow" ? "Copied!" : "Copy YAML"}
            </button>
          </div>
          <pre className="flex-1 bg-black border border-zinc-800/80 rounded-lg p-3 text-[11px] text-zinc-300 overflow-x-auto">
            {githubWorkflow}
          </pre>
        </div>
      </div>

      {/* OpenAPI Platform Link */}
      <div className="border border-zinc-800 rounded-xl bg-black p-4 flex items-center justify-between">
        <div>
          <span className="font-bold text-white text-xs">Syncbay Public OpenAPI 3.1 Platform</span>
          <p className="text-zinc-500 text-[11px]">
            Automate infrastructure via REST API with Workspace API Tokens
          </p>
        </div>
        <a
          href="/api/v1/openapi.json"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-400 rounded-lg text-xs font-bold transition-colors"
        >
          View openapi.json ↗
        </a>
      </div>
    </div>
  );
}
