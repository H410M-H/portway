"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { useState, useRef, useEffect, createContext, useContext } from "react";

export interface DashboardContextType {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
  workspaces: any[] | undefined;
  currentWorkspace: any | undefined;
  setCurrentWorkspaceId: (id: string) => void;
  refetchWorkspaces: () => Promise<any>;
}

export const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  return useContext(DashboardContext);
}

interface DashboardShellProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: workspaces, refetch: refetchWorkspaces } = trpc.workspace.list.useQuery();

  const [topbarDropdownOpen, setTopbarDropdownOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsSlug, setNewWsSlug] = useState("");
  const [creatingWs, setCreatingWs] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const topbarDropdownRef = useRef<HTMLDivElement>(null);
  const sidebarDropdownRef = useRef<HTMLDivElement>(null);

  const createWorkspaceMutation = trpc.workspace.create.useMutation();

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        topbarDropdownRef.current &&
        !topbarDropdownRef.current.contains(e.target as Node)
      ) {
        setTopbarDropdownOpen(false);
      }
      if (
        sidebarDropdownRef.current &&
        !sidebarDropdownRef.current.contains(e.target as Node)
      ) {
        setSidebarDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine current active workspace from path e.g. /dashboard/[slug]
  const pathSegments = pathname.split("/").filter(Boolean);
  const slugInPath =
    pathSegments.length === 2 &&
    pathSegments[0] === "dashboard" &&
    ![
      "projects",
      "settings",
      "members",
      "usage",
      "audit",
      "services",
      "databases",
      "buckets",
    ].includes(pathSegments[1])
      ? pathSegments[1]
      : null;

  const [explicitWsId, setExplicitWsId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("syncbay_active_ws");
      if (stored) setExplicitWsId(stored);
    }
  }, []);

  const currentWorkspace =
    (slugInPath ? workspaces?.find((w) => w.slug === slugInPath) : null) ||
    (explicitWsId ? workspaces?.find((w) => w.id === explicitWsId) : null) ||
    workspaces?.[0];

  const handleSelectWorkspace = (ws: any) => {
    setTopbarDropdownOpen(false);
    setSidebarDropdownOpen(false);
    setExplicitWsId(ws.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("syncbay_active_ws", ws.id);
    }

    if (pathname === "/dashboard" || slugInPath) {
      router.push(`/dashboard/${ws.slug}`);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !newWsSlug.trim()) return;
    setErrorMsg("");
    setCreatingWs(true);
    try {
      const created = await createWorkspaceMutation.mutateAsync({
        name: newWsName.trim(),
        slug: newWsSlug.trim().toLowerCase(),
      });
      await refetchWorkspaces();
      setCreateModalOpen(false);
      setNewWsName("");
      setNewWsSlug("");
      setExplicitWsId(created.id);
      if (typeof window !== "undefined") {
        localStorage.setItem("syncbay_active_ws", created.id);
      }
      router.push(`/dashboard/${created.slug}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create workspace");
    } finally {
      setCreatingWs(false);
    }
  };

  const isNavActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || !!slugInPath;
    }
    return pathname.startsWith(href);
  };

  return (
    <DashboardContext.Provider
      value={{
        user,
        workspaces,
        currentWorkspace,
        setCurrentWorkspaceId: (id: string) => {
          setExplicitWsId(id);
          if (typeof window !== "undefined") {
            localStorage.setItem("syncbay_active_ws", id);
          }
        },
        refetchWorkspaces,
      }}
    >
      <div className="app-shell">
        {/* ── Topbar ── */}
        <header className="topbar">
          <Link href="/dashboard" className="logo">
            <div className="logo-icon">⚓</div>
            Syncbay
          </Link>

          {/* Dynamic Workspace Switcher Dropdown in Topbar */}
          <div style={{ position: "relative" }} ref={topbarDropdownRef}>
            <button
              onClick={() => setTopbarDropdownOpen(!topbarDropdownOpen)}
              className="btn btn-secondary btn-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                background: "var(--bg-card)",
                borderColor: topbarDropdownOpen ? "var(--brand-primary)" : "var(--border-default)",
              }}
              aria-label="Switch Workspace"
            >
              <span style={{ fontSize: "14px" }}>
                {currentWorkspace?.isPersonal ? "👤" : "🏢"}
              </span>
              <span style={{ fontWeight: 600, maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentWorkspace?.name || "Select Workspace"}
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>▼</span>
            </button>

            {topbarDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  width: "240px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "8px",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    padding: "4px 8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Workspaces
                </div>

                {workspaces?.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: ws.id === currentWorkspace?.id ? "rgba(99,102,241,0.15)" : "transparent",
                      color: ws.id === currentWorkspace?.id ? "var(--brand-primary)" : "var(--text-primary)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <span>{ws.isPersonal ? "👤" : "🏢"}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ws.name}
                      </span>
                    </div>
                    {ws.id === currentWorkspace?.id && (
                      <span style={{ fontSize: "12px", color: "var(--brand-primary)" }}>✓</span>
                    )}
                  </button>
                ))}

                <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "4px 0" }} />

                <button
                  onClick={() => {
                    setTopbarDropdownOpen(false);
                    setCreateModalOpen(true);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--brand-primary)",
                    justifyContent: "flex-start",
                    padding: "8px 10px",
                  }}
                >
                  <span>＋</span> Create Team Workspace
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* User profile & sign out */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {user.name ? user.name.slice(0, 1).toUpperCase() : user.email?.slice(0, 1).toUpperCase() || "U"}
              </div>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                {user.email}
              </span>
            </div>

            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="btn btn-ghost btn-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {/* ── Sidebar ── */}
        <nav className="sidebar">
          {/* Dynamic Workspace Switcher Dropdown in Sidebar */}
          <div style={{ position: "relative", marginBottom: "12px" }} ref={sidebarDropdownRef}>
            <button
              onClick={() => setSidebarDropdownOpen(!sidebarDropdownOpen)}
              className="btn btn-secondary"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-overlay)",
                border: sidebarDropdownOpen ? "1px solid var(--brand-primary)" : "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "left",
                cursor: "pointer",
              }}
              aria-label="Switch Workspace"
            >
              <div style={{ overflow: "hidden", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>{currentWorkspace?.isPersonal ? "👤" : "🏢"}</span>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Workspace
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>
                    {currentWorkspace?.name || "Personal"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="badge badge-queued" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
                  {currentWorkspace?.isPersonal ? "Personal" : "Team"}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>▼</span>
              </div>
            </button>

            {sidebarDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "8px",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    padding: "4px 8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Select Workspace
                </div>

                {workspaces?.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: ws.id === currentWorkspace?.id ? "rgba(99,102,241,0.15)" : "transparent",
                      color: ws.id === currentWorkspace?.id ? "var(--brand-primary)" : "var(--text-primary)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <span>{ws.isPersonal ? "👤" : "🏢"}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ws.name}
                      </span>
                    </div>
                    {ws.id === currentWorkspace?.id && (
                      <span style={{ fontSize: "12px", color: "var(--brand-primary)" }}>✓</span>
                    )}
                  </button>
                ))}

                <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "4px 0" }} />

                <button
                  onClick={() => {
                    setSidebarDropdownOpen(false);
                    setCreateModalOpen(true);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--brand-primary)",
                    justifyContent: "flex-start",
                    padding: "8px 10px",
                  }}
                >
                  <span>＋</span> Create Team Workspace
                </button>
              </div>
            )}
          </div>

          <span className="nav-section-label">Navigation</span>
          <Link
            href="/dashboard"
            className={`nav-item ${isNavActive("/dashboard") ? "active" : ""}`}
          >
            <span className="nav-icon">⬡</span> Overview
          </Link>
          <Link
            href="/dashboard/projects"
            className={`nav-item ${isNavActive("/dashboard/projects") ? "active" : ""}`}
          >
            <span className="nav-icon">◫</span> Projects
          </Link>

          <span className="nav-section-label" style={{ marginTop: "12px" }}>
            Workspace
          </span>
          <Link
            href="/dashboard/settings"
            className={`nav-item ${isNavActive("/dashboard/settings") ? "active" : ""}`}
          >
            <span className="nav-icon">⚙</span> Settings
          </Link>
          <Link
            href="/dashboard/members"
            className={`nav-item ${isNavActive("/dashboard/members") ? "active" : ""}`}
          >
            <span className="nav-icon">◎</span> Members
          </Link>
          <Link
            href="/dashboard/usage"
            className={`nav-item ${isNavActive("/dashboard/usage") ? "active" : ""}`}
          >
            <span className="nav-icon">⬟</span> Usage &amp; Billing
          </Link>
          <Link
            href="/dashboard/audit"
            className={`nav-item ${isNavActive("/dashboard/audit") ? "active" : ""}`}
          >
            <span className="nav-icon">⊟</span> Audit Log
          </Link>

          <span className="nav-section-label" style={{ marginTop: "12px" }}>
            Create
          </span>
          <Link href="/dashboard/projects/new" className="nav-item">
            <span className="nav-icon">＋</span> New Project
          </Link>
          <Link href="/dashboard/services/new" className="nav-item">
            <span className="nav-icon">⚡</span> New Service
          </Link>
          <Link href="/dashboard/databases/new" className="nav-item">
            <span className="nav-icon">🐘</span> New Database
          </Link>
          <Link href="/dashboard/buckets/new" className="nav-item">
            <span className="nav-icon">🪣</span> New Bucket
          </Link>
        </nav>

        {/* ── Main Content ── */}
        <main className="main-content">{children}</main>

        {/* Create Workspace Modal */}
        {createModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
              display: "grid",
              placeItems: "center",
              zIndex: 9999,
              padding: "20px",
            }}
            onClick={() => setCreateModalOpen(false)}
          >
            <div
              className="card"
              style={{ width: "100%", maxWidth: "440px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: "8px" }}>Create Team Workspace</h3>
              <p style={{ fontSize: "0.875rem", marginBottom: "20px" }}>
                Collaborate on projects, databases, and deployments with your team.
              </p>

              {errorMsg && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(239,68,68,0.15)",
                    color: "#f87171",
                    fontSize: "0.8125rem",
                    marginBottom: "16px",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateWorkspace} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="field">
                  <label>Workspace Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Acme Corp"
                    value={newWsName}
                    onChange={(e) => {
                      setNewWsName(e.target.value);
                      if (!newWsSlug) {
                        setNewWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                      }
                    }}
                    required
                  />
                </div>

                <div className="field">
                  <label>Workspace Slug (URL identifier)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="acme-corp"
                    value={newWsSlug}
                    onChange={(e) => setNewWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    required
                  />
                  <span className="field-hint">
                    Your workspace will be accessible at /dashboard/{newWsSlug || "slug"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCreateModalOpen(false)}
                    disabled={creatingWs}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingWs || !newWsName || !newWsSlug}
                  >
                    {creatingWs ? "Creating..." : "Create Workspace"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
}
