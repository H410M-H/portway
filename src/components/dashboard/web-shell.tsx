"use client";

import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";

interface WebShellProps {
  serviceId: string;
  serviceName: string;
}

interface ShellLine {
  id: string;
  type: "input" | "stdout" | "stderr" | "system";
  text: string;
}

/**
 * Converts ANSI color escape sequences to styled React elements
 */
function renderAnsi(text: string): React.ReactNode[] {
  // Simple ANSI color code tokenizer
  const parts = text.split(/(\x1b\[[0-9;]*m)/g);
  let currentColor = "#e2e8f0";
  let isBold = false;

  return parts.map((part, i) => {
    if (part.startsWith("\x1b[")) {
      if (part === "\x1b[0m") {
        currentColor = "#e2e8f0";
        isBold = false;
      } else if (part.includes("38;5;51m")) {
        currentColor = "#00ffff"; // Cyan
      } else if (part.includes("38;5;46m")) {
        currentColor = "#00ff66"; // Neon Green
      } else if (part.includes("38;5;201m")) {
        currentColor = "#ff007f"; // Magenta
      } else if (part.includes("38;5;220m")) {
        currentColor = "#ffd700"; // Gold
      } else if (part.includes("38;5;208m")) {
        currentColor = "#ff8800"; // Orange
      } else if (part.includes("31m")) {
        currentColor = "#ef4444"; // Red
      } else if (part.includes("32m")) {
        currentColor = "#22c55e"; // Green
      } else if (part.includes("36m")) {
        currentColor = "#06b6d4"; // Cyan
      } else if (part.includes("1m")) {
        isBold = true;
      }
      return null;
    }
    return (
      <span key={i} style={{ color: currentColor, fontWeight: isBold ? "bold" : "normal" }}>
        {part}
      </span>
    );
  });
}

export function WebShell({ serviceId, serviceName }: WebShellProps) {
  const [cwd, setCwd] = useState("/app");
  const [inputVal, setInputVal] = useState("");
  const [lines, setLines] = useState<ShellLine[]>([
    {
      id: "init-1",
      type: "system",
      text: `\x1b[38;5;51m== SYNCBAY CLOUD CONTAINER WEB SHELL ==\x1b[0m\nConnected to edge runtime: \x1b[38;5;46m${serviceName}\x1b[0m (Region: iad1 | Engine: Cloudflare Containers)\nType '\x1b[38;5;220mhelp\x1b[0m' or click diagnostic pills below.\n`,
    },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const execMutation = trpc.shell.exec.useMutation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleCommand = async (cmdToRun?: string) => {
    const command = (cmdToRun ?? inputVal).trim();
    if (!command) return;

    // Echo input line
    const promptPrefix = `syncbay@${serviceName}:${cwd === "/app" ? "~" : cwd}$ `;
    setLines((prev) => [
      ...prev,
      { id: Math.random().toString(), type: "input", text: `${promptPrefix}${command}` },
    ]);

    setHistory((prev) => [...prev, command]);
    setHistoryIdx(-1);
    setInputVal("");

    if (command === "clear") {
      setLines([]);
      return;
    }

    try {
      const result = await execMutation.mutateAsync({
        serviceId,
        command,
        cwd,
      });

      setCwd(result.cwd);

      if (result.stdout) {
        setLines((prev) => [
          ...prev,
          { id: Math.random().toString(), type: "stdout", text: result.stdout },
        ]);
      }
      if (result.stderr) {
        setLines((prev) => [
          ...prev,
          { id: Math.random().toString(), type: "stderr", text: result.stderr },
        ]);
      }
    } catch (err: any) {
      setLines((prev) => [
        ...prev,
        { id: Math.random().toString(), type: "stderr", text: `Error: ${err.message}\n` },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(history[nextIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setInputVal("");
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx] || "");
      }
    }
  };

  const quickActions = [
    { label: "Check Processes", cmd: "ps aux" },
    { label: "System Load", cmd: "top" },
    { label: "Disk Space", cmd: "df -h" },
    { label: "Memory", cmd: "free -m" },
    { label: "Env Vars", cmd: "env" },
    { label: "Health Probe", cmd: "curl http://localhost:3000/health" },
    { label: "Kernel Info", cmd: "uname -a" },
    { label: "Clear Buffer", cmd: "clear" },
  ];

  return (
    <div
      className={`flex flex-col border border-zinc-800 rounded-lg overflow-hidden bg-black text-white font-mono text-xs shadow-2xl transition-all ${
        isFullscreen ? "fixed inset-4 z-50 rounded-xl" : "h-[540px] w-full"
      }`}
    >
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 select-none">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-2 text-zinc-400 font-semibold text-xs flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            syncbay-shell: {serviceName} ({cwd})
          </span>
        </div>

        <div className="flex items-center space-x-3 text-zinc-400">
          <span className="text-[11px] text-zinc-500 hidden sm:inline">VT100 / xterm-256color</span>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hover:text-white px-2 py-1 bg-zinc-800 rounded text-[10px] uppercase font-bold"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Quick Diagnostic Actions Bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950/80 border-b border-zinc-800/80 overflow-x-auto scrollbar-none">
        <span className="text-[10px] text-zinc-500 uppercase font-semibold mr-1">Quick:</span>
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => handleCommand(action.cmd)}
            disabled={execMutation.isPending}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-cyan-950/60 hover:text-cyan-400 hover:border-cyan-800/50 border border-zinc-800 text-[10px] text-zinc-300 transition-colors whitespace-nowrap"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Terminal Output Area */}
      <div
        className="flex-1 p-4 overflow-y-auto space-y-1 select-text scrollbar-thin scrollbar-thumb-zinc-800"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line) => (
          <div key={line.id} className="whitespace-pre-wrap leading-relaxed">
            {renderAnsi(line.text)}
          </div>
        ))}

        {/* Active Input Line */}
        <div className="flex items-center whitespace-pre-wrap leading-relaxed pt-1">
          <span className="text-emerald-400 font-bold">syncbay</span>
          <span className="text-zinc-400">@</span>
          <span className="text-cyan-400 font-bold">{serviceName}</span>
          <span className="text-zinc-400">:</span>
          <span className="text-yellow-400 font-bold">{cwd === "/app" ? "~" : cwd}</span>
          <span className="text-zinc-400">$ </span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={execMutation.isPending}
            autoFocus
            className="flex-1 bg-transparent outline-none border-none text-white font-mono text-xs ml-1 p-0 focus:ring-0"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
