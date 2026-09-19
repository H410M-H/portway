"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Sanitizes a redirect URL to prevent Open Redirect vulnerabilities.
 * Ensures the destination is strictly an internal relative path starting with a single "/".
 * Protocol-relative ("//"), backslash bypasses ("/\\"), and external absolute URLs fall back to defaultPath.
 */
export function getSafeCallbackUrl(
  raw: string | null | undefined,
  defaultPath: string = "/dashboard"
): string {
  if (!raw || typeof raw !== "string") {
    return defaultPath;
  }
  const trimmed = raw.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\")
  ) {
    return trimmed;
  }
  return defaultPath;
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);

  const displayError =
    error ||
    (urlError === "OAuthSignin"
      ? "Could not start GitHub login. Please check GitHub OAuth App credentials."
      : urlError === "OAuthCallback"
      ? "Error receiving response from GitHub. Please try again."
      : urlError === "OAuthAccountNotLinked"
      ? "An account with this email already exists with different sign-in credentials."
      : urlError === "AccessDenied"
      ? "Access was denied by GitHub."
      : urlError
      ? `Authentication error: ${urlError}`
      : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError("Invalid email or password. Please check your credentials.");
      } else if (res?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHub = async () => {
    setIsGitHubLoading(true);
    await signIn("github", { callbackUrl });
  };

  return (
    <div>
      {/* GitHub OAuth */}
      <button
        type="button"
        onClick={handleGitHub}
        disabled={isGitHubLoading}
        className="btn btn-secondary"
        style={{ width: "100%", justifyContent: "center" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
        {isGitHubLoading ? "Connecting to GitHub..." : "Continue with GitHub"}
      </button>

      <div className="divider-or">or</div>

      {displayError && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#fca5a5",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "16px",
            fontSize: "0.85rem",
          }}
        >
          {displayError}
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ justifyContent: "center" }}
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in with Email"}
        </button>
      </form>
    </div>
  );
}

