"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  // Fetch workspaces (to know where to put the project)
  const { data: workspaces, isLoading: loadingWs } = trpc.workspace.list.useQuery();
  
  // Fetch user's GitHub repos
  const { data: repos, isLoading: loadingRepos, error: reposError } = trpc.github.listRepos.useQuery();

  // Mutations
  const createProject = trpc.project.create.useMutation();
  const setupWebhook = trpc.github.setupWebhook.useMutation();
  const createService = trpc.service.create.useMutation();
  const triggerDeploy = trpc.deployment.trigger.useMutation();

  const [workspaceId, setWorkspaceId] = useState<string>("");

  const handleDeploy = async (repoFullName: string) => {
    if (!workspaceId && workspaces?.length) {
      alert("Please select a workspace");
      return;
    }

    const targetWs = workspaceId || workspaces?.[0]?.id;
    if (!targetWs) return;

    const repo = repos?.find(r => r.fullName === repoFullName);
    if (!repo) return;

    try {
      setSelectedRepo(repoFullName);

      // 1. Create a Project
      const project = await createProject.mutateAsync({
        workspaceId: targetWs,
        name: repo.name,
      });

      // 2. Setup GitHub Webhook
      const [owner, repoName] = repo.fullName.split("/");
      await setupWebhook.mutateAsync({ owner, repo: repoName });

      // 3. Create the Service
      const service = await createService.mutateAsync({
        environmentId: project.environments[0].id, // Auto-created default env
        name: "web",
        sourceType: "github",
        repoUrl: repo.htmlUrl,
        branch: repo.defaultBranch || "main",
      });

      // 4. Trigger initial deployment
      await triggerDeploy.mutateAsync({
        serviceId: service.id,
        commitMessage: "Initial deployment from Portway",
      });

      // Redirect to the project page
      router.push(`/dashboard/projects/${project.id}`);

    } catch (error: any) {
      console.error(error);
      alert(`Failed to deploy: ${error.message}`);
      setSelectedRepo(null);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: "16px", paddingLeft: 0 }}>
          ← Back to Dashboard
        </Link>
        <h1 className="page-title">Deploy a new project</h1>
        <p className="page-subtitle">Select a repository from your GitHub account.</p>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="field">
          <label>Target Workspace</label>
          <select 
            className="input" 
            value={workspaceId} 
            onChange={(e) => setWorkspaceId(e.target.value)}
            disabled={loadingWs}
          >
            {loadingWs ? (
              <option>Loading workspaces...</option>
            ) : (
              workspaces?.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name} ({ws.slug})</option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          Import from GitHub
        </h3>

        {loadingRepos ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="loading-bar" style={{ width: "100px", margin: "0 auto 16px" }}></div>
            <p style={{ color: "var(--text-muted)" }}>Loading repositories...</p>
          </div>
        ) : reposError ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3>Failed to load repositories</h3>
            <p>{reposError.message}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>
              Make sure you have connected your GitHub account properly in the settings.
            </p>
          </div>
        ) : repos?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No repositories found</h3>
            <p>We couldn&apos;t find any repositories in your GitHub account.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {repos?.map((repo) => (
              <div 
                key={repo.id} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  padding: "16px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-overlay)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ color: "var(--text-secondary)" }}>
                    {repo.private ? "🔒" : "📖"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{repo.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      {repo.fullName} · branch: {repo.defaultBranch}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDeploy(repo.fullName)}
                  disabled={selectedRepo !== null}
                  className="btn btn-secondary btn-sm"
                  style={{ width: "90px", justifyContent: "center" }}
                >
                  {selectedRepo === repo.fullName ? (
                    <span className="loading-bar" style={{ width: "40px" }}></span>
                  ) : (
                    "Deploy"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
