"use client";

import { useState, useEffect } from "react";
import { signup, signin } from "../api";

/**
 * AuthPage Component.
 * Dedicated route (/auth) handles customer registration and signin.
 * Triggers state event sync for global Navbar.
 */
export default function AuthPage() {
  // Auth state
  const [authMode, setAuthMode] = useState("signin"); // signin or signup
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in; redirect if so
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      const savedRole = localStorage.getItem("role");
      window.location.href = savedRole === "ROLE_ADMIN" ? "/admin" : "/catalog";
    }
  }, []);

  // Submit login/signup requests
  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setLoading(true);

    if (!authEmail || !authPassword) {
      setAuthError("Email and Password are required.");
      setLoading(false);
      return;
    }

    try {
      if (authMode === "signup") {
        await signup(authEmail, authPassword);
        setAuthSuccess("Registration complete! You can now Sign In.");
        setAuthMode("signin");
        setAuthPassword("");
      } else {
        const data = await signin(authEmail, authPassword);
        
        // Save auth details in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);
        localStorage.setItem("role", data.role);
        
        // Dispatch local event to notify Navbar of auth state change
        window.dispatchEvent(new Event("local-auth-change"));

        // Redirect based on role
        if (data.role === "ROLE_ADMIN") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/catalog";
        }
      }
    } catch (err) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
      <div className="glass-panel auth-container" style={{ width: "100%", maxWidth: "450px", padding: "2.5rem", borderRadius: "24px" }}>
        <h1 className="auth-title" style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Scentcepts</h1>
        <p className="auth-subtitle" style={{ marginBottom: "2rem" }}>Discover your olfactory profile</p>

        {/* Tab Selection */}
        <div className="auth-tabs" style={{ marginBottom: "2rem" }}>
          <button
            id="tab-signin"
            className={`auth-tab ${authMode === "signin" ? "active" : ""}`}
            onClick={() => {
              setAuthMode("signin");
              setAuthError("");
              setAuthSuccess("");
            }}
          >
            Sign In
          </button>
          <button
            id="tab-signup"
            className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
            onClick={() => {
              setAuthMode("signup");
              setAuthError("");
              setAuthSuccess("");
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label htmlFor="email-input" className="form-label">Email Address</label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password-input" className="form-label">Password</label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
            />
          </div>

          <button id="auth-submit-btn" type="submit" className="btn-primary" style={{ marginTop: "0.5rem" }} disabled={loading}>
            {loading ? "Authenticating..." : authMode === "signin" ? "Sign In" : "Register"}
          </button>
        </form>

        {authError && <p className="error-message" id="auth-err-msg" style={{ marginTop: "1rem" }}>⚠️ {authError}</p>}
        {authSuccess && <p style={{ color: "#4ade80", fontSize: "0.9rem", marginTop: "1.25rem", textAlign: "center" }} id="auth-success-msg">✓ {authSuccess}</p>}
      </div>
    </main>
  );
}
