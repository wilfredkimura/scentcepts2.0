"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Global Navbar Component.
 * Responsive glassmorphism header offering links to landing, catalog collections,
 * admin dashboards, and signup panels based on client JWT states.
 */
export default function Navbar() {
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(null);

  // Sync authentication states from localStorage on component mount
  useEffect(() => {
    function syncAuth() {
      const savedToken = localStorage.getItem("token");
      const savedEmail = localStorage.getItem("email");
      const savedRole = localStorage.getItem("role");
      setToken(savedToken);
      setEmail(savedEmail);
      setRole(savedRole);
    }
    
    syncAuth();

    // Listen for storage events (e.g. when logging in from /auth page)
    window.addEventListener("storage", syncAuth);
    // Custom trigger to sync state within the same window
    window.addEventListener("local-auth-change", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("local-auth-change", syncAuth);
    };
  }, []);

  // Wipes token credentials and redirects to storefront root
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    setToken(null);
    setEmail("");
    setRole(null);
    
    // Dispatch local event to notify other components
    window.dispatchEvent(new Event("local-auth-change"));
    
    window.location.href = "/";
  }

  return (
    <header className="header" style={{ position: "sticky", top: "1rem", zIndex: 100, marginBottom: "2rem" }}>
      {/* Brand Logo Link */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <div className="logo">Scentcepts</div>
      </Link>

      {/* Center Nav Links */}
      <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        <Link href="/catalog" style={{ textDecoration: "none", color: "var(--text-main)", fontWeight: 500, fontSize: "0.95rem" }} className="nav-link-hover">
          🛍️ Catalog
        </Link>
      </nav>

      {/* User Login/Dashboard Navigation */}
      <div className="nav-user">
        {token ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="user-email" style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              {email}
            </span>
            {role === "ROLE_ADMIN" && (
              <Link id="navbar-admin-link" href="/admin" className="btn-secondary" style={{ textDecoration: "none", color: "var(--primary)", borderColor: "var(--primary)" }}>
                👑 Admin Panel
              </Link>
            )}
            <button id="navbar-logout-btn" className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <Link id="navbar-signin-link" href="/auth" className="btn-primary" style={{ textDecoration: "none", padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}>
            Sign In
          </Link>
        )}
      </div>

      <style jsx>{`
        .nav-link-hover:hover {
          color: var(--primary) !important;
          transition: var(--transition-smooth);
        }
      `}</style>
    </header>
  );
}
