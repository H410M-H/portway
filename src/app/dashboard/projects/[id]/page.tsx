"use client";

import { trpc } from "@/lib/trpc-client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Ideally we would fetch the project and its environments/services here
  // For now, we fetch just the project by ID to show basic info
  const { data: project, isLoading, error } = trpc.project.byId.useQuery({ projectId });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "64px" }}>
        <div className="loading-bar" style={{ width: "200px", margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--text-muted)" }}>Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Project not found</h3>
        <p>{error?.message || "This project may have been deleted."}</p>
        <Link href="/dashboard" className="btn btn-secondary" style={{ marginTop: "16px" }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: "12px" }}>
            ← Back
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "48px", height: "48px", 
              background: "linear-gradient(135deg, var(--bg-hover), var(--bg-overlay))", 
              borderRadius: "var(--radius-md)", 
              border: "1px solid var(--border-subtle)",
              display: "grid", placeItems: "center", fontSize: "20px"
            }}>
              📦
            </div>
            <div>
              <h1 className="page-title">{project.name}</h1>
              <p className="page-subtitle">Workspace ID: {project.workspaceId}</p>
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn btn-secondary">Settings</button>
          <button className="btn btn-primary">Deploy</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "16px" }}>Environments</h3>
        <div className="empty-state" style={{ padding: "32px 16px" }}>
          <p>Production environment is active.</p>
          <p style={{ fontSize: "0.8rem", marginTop: "8px" }}>
            (Services list UI will be implemented next)
          </p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h4 style={{ marginBottom: "12px" }}>Recent Deployments</h4>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>No recent deployments yet.</p>
        </div>
        <div className="card">
          <h4 style={{ marginBottom: "12px" }}>Resource Usage</h4>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Metrics will appear here once your services are running.</p>
        </div>
      </div>
    </div>
  );
}
