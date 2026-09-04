import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  return (
    <div className="app-shell">
      {/* ── Topbar ── */}
      <header className="topbar">
        <Link href="/dashboard" className="logo">
          <div className="logo-icon">⚓</div>
          Portway
        </Link>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            {session.user?.email}
          </span>
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
        <span className="nav-section-label">Navigation</span>
        <Link href="/dashboard" className="nav-item">
          <span className="nav-icon">⬡</span> Overview
        </Link>
        <Link href="/dashboard/projects" className="nav-item">
          <span className="nav-icon">◫</span> Projects
        </Link>

        <span className="nav-section-label" style={{ marginTop: "8px" }}>
          Workspace
        </span>
        <Link href="/dashboard/settings" className="nav-item">
          <span className="nav-icon">⚙</span> Settings
        </Link>
        <Link href="/dashboard/members" className="nav-item">
          <span className="nav-icon">◎</span> Members
        </Link>
        <Link href="/dashboard/usage" className="nav-item">
          <span className="nav-icon">⬟</span> Usage &amp; Billing
        </Link>
        <Link href="/dashboard/audit" className="nav-item">
          <span className="nav-icon">⊟</span> Audit Log
        </Link>
      </nav>

      {/* ── Main ── */}
      <main className="main-content">{children}</main>
    </div>
  );
}
