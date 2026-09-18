import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInForm } from "./signin-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <main className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="logo-icon-lg">⚓</div>
          <div>
            <h1 style={{ fontSize: "1.75rem", marginBottom: "4px" }}>
              Welcome to Portway
            </h1>
            <p style={{ fontSize: "0.9rem", margin: 0 }}>
              Sign in to your account to continue
            </p>
          </div>
        </div>

        <Suspense fallback={<div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem", padding: "16px" }}>Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}

