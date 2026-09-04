"use client";

import { trpc } from "@/lib/trpc-client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  // Poll every 3 seconds to get live deployment updates
  const { data: project, isLoading, error, refetch } = trpc.project.byId.useQuery(
    { projectId },
    { refetchInterval: 3000 }
  );

  const triggerDeploy = trpc.deployment.trigger.useMutation({
    onSuccess: () => refetch(),
  });

  const handleManualDeploy = async (serviceId: string) => {
    try {
      await triggerDeploy.mutateAsync({ serviceId, commitMessage: "Manual deployment via UI" });
    } catch (e: any) {
      alert(`Failed to trigger deploy: ${e.message}`);
    }
  };

  if (isLoading && !project) {
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
        <Link href="/dashboard/projects" className="btn btn-secondary" style={{ marginTop: "16px" }}>
          Back to Projects
        </Link>
      </div>
    );
  }

  const defaultEnv = project.environments.find((env) => env.isDefault) || project.environments[0];

  return (
    <div className="fade-in" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div className="page-header" style={{ marginBottom: "32px" }}>
        <div>
          <Link href="/dashboard/projects" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: "12px" }}>
            ← Back to Projects
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span className="badge badge-active" style={{ fontSize: "0.6rem" }}>{defaultEnv.name}</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Project ID: {project.id}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn btn-secondary">Environment Variables</button>
          <button className="btn btn-secondary">Settings</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h3>Services</h3>
        <button className="btn btn-primary btn-sm">＋ Add Service</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
        {defaultEnv.services?.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">⚙️</div>
            <h3>No services running</h3>
            <p>Add a web service, worker, or database to this project.</p>
          </div>
        ) : (
          defaultEnv.services?.map(service => {
            const latestDeploy = service.deployments?.[0];
            const statusClass = latestDeploy?.status === "ACTIVE" ? "badge-active" :
                                latestDeploy?.status === "BUILDING" || latestDeploy?.status === "DEPLOYING" ? "badge-building" :
                                latestDeploy?.status === "FAILED" || latestDeploy?.status === "CRASHED" ? "badge-failed" :
                                latestDeploy?.status === "QUEUED" ? "badge-queued" : "badge-sleeping";
            
            const dotClass = latestDeploy?.status === "ACTIVE" ? "status-dot-active" :
                             latestDeploy?.status === "BUILDING" || latestDeploy?.status === "DEPLOYING" ? "status-dot-building" :
                             latestDeploy?.status === "FAILED" || latestDeploy?.status === "CRASHED" ? "status-dot-failed" :
                             latestDeploy?.status === "QUEUED" ? "status-dot-queued" : "status-dot-sleeping";

            return (
              <div key={service.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "24px", color: "var(--brand-primary)" }}>
                      {service.sourceType === "github" ? "🐙" : "🐳"}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>{service.name}</h4>
                      <a href={service.repoUrl || "#"} target="_blank" rel="noreferrer" style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        {service.repoUrl?.replace("https://github.com/", "")} ({service.branch})
                      </a>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {latestDeploy && (
                      <span className={`badge ${statusClass}`}>
                        <div className={`status-dot ${dotClass}`}></div>
                        {latestDeploy.status}
                      </span>
                    )}
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleManualDeploy(service.id)}
                      disabled={triggerDeploy.isPending}
                    >
                      {triggerDeploy.isPending ? "Triggering..." : "Deploy"}
                    </button>
                  </div>
                </div>

                {latestDeploy && (
                  <div style={{ 
                    padding: "12px", 
                    background: "var(--bg-overlay)", 
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.8125rem",
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--text-secondary)"
                  }}>
                    <span>
                      <strong style={{ color: "var(--text-primary)" }}>Commit: </strong> 
                      {latestDeploy.build?.commitSha?.substring(0, 7) || "unknown"} — {latestDeploy.build?.commitMessage}
                    </span>
                    <span>
                      {new Date(latestDeploy.createdAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <h4 style={{ marginBottom: "12px" }}>Databases</h4>
          {defaultEnv.databases?.length === 0 ? (
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>No databases attached to this environment.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {defaultEnv.databases?.map(db => (
                <div key={db.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span>🗄️ {db.name}</span>
                  <span className="badge badge-active">Ready</span>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: "16px", paddingLeft: 0 }}>
            ＋ Attach Database
          </button>
        </div>
        <div className="card">
          <h4 style={{ marginBottom: "12px" }}>Resource Usage</h4>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Metrics will appear here once your services are serving traffic.</p>
        </div>
      </div>
    </div>
  );
}
