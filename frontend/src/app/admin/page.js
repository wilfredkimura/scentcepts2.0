"use client";

import { useState, useEffect } from "react";
import { getAdminUsers, getAdminOrders } from "../api";
import Link from "next/link";

/**
 * AdminDashboard Page component.
 * Displays key business metrics (revenue, orders, accounts) and listings of system data.
 * Restricts access to users holding the 'ROLE_ADMIN' authority.
 */
export default function AdminDashboard() {
  // Authentication states
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  // Dashboard dataset states
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Interface error and loading states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Verify access privileges on initial page render
  useEffect(() => {
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    
    if (role === "ROLE_ADMIN") {
      setIsAdmin(true);
      setAdminEmail(email || "Admin");
      fetchDashboardData();
    } else {
      setIsAdmin(false);
      setIsCheckingAuth(false);
      setLoading(false);
    }
  }, []);

  /**
   * Fetches users and orders data lists concurrently from the admin backend endpoints.
   */
  async function fetchDashboardData() {
    try {
      setLoading(true);
      setErrorMsg("");
      
      // Execute fetch calls in parallel
      const [usersData, ordersData] = await Promise.all([
        getAdminUsers(),
        getAdminOrders()
      ]);
      
      setUsers(usersData);
      setOrders(ordersData);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  }

  // Calculate summary metrics for the header cards
  const totalOrdersCount = orders.length;
  const completedOrders = orders.filter(o => o.status === "COMPLETED");
  
  // Calculate total revenue in USD and convert to KES (1 USD = 130 KES)
  const totalRevenueUSD = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalRevenueKES = totalRevenueUSD * 130;
  
  const registeredUsersCount = users.length;

  // 1. LOADING PANEL (DURING INITIAL DATA/AUTH FETCH)
  if (isCheckingAuth || (isAdmin && loading && users.length === 0)) {
    return (
      <main className="app-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
          ⏳ Loading secure admin environment...
        </div>
      </main>
    );
  }

  // 2. ACCESS DENIED PANEL (IF LOGGED-IN ROLE IS NOT ROLE_ADMIN)
  if (!isAdmin) {
    return (
      <main className="app-container">
        <div className="glass-panel auth-container" style={{ borderColor: "#ff4a4a" }}>
          <div style={{ fontSize: "3.5rem", color: "#ff4a4a", marginBottom: "1rem" }}>🔒</div>
          <h1 className="auth-title" style={{ color: "#ff4a4a", background: "none", WebkitTextFillColor: "initial" }}>
            Access Denied
          </h1>
          <p className="auth-subtitle">
            Admin privileges are required to view this panel.
          </p>
          <Link href="/" className="btn-secondary" style={{ display: "inline-block", textDecoration: "none", width: "100%", textAlign: "center", padding: "0.85rem" }}>
            Return to Storefront
          </Link>
        </div>
      </main>
    );
  }

  // 3. ADMIN PANEL SYSTEM RENDERING (IF PRIVILEGES VERIFIED)
  return (
    <main className="app-container">
      {/* Header and User Navigation */}
      <header className="header">
        <div className="logo">Scentcepts Admin</div>
        <div className="nav-user">
          <span className="user-email" style={{ color: "var(--primary)" }}>👑 {adminEmail} (Admin)</span>
          <Link href="/" className="btn-secondary" style={{ textDecoration: "none" }}>
            Storefront
          </Link>
        </div>
      </header>

      {/* Main Title Section */}
      <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "0.25rem" }}>Management Console</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Overview of system registration, orders, and sales performance</p>
        </div>
        <button className="btn-secondary" onClick={fetchDashboardData} disabled={loading}>
          {loading ? "Syncing..." : "🔄 Sync Data"}
        </button>
      </div>

      {errorMsg && <p className="error-message" style={{ marginBottom: "2rem" }}>{errorMsg}</p>}

      {/* Metric Summary Cards Grid */}
      <section className="catalog-grid" style={{ marginBottom: "3rem" }}>
        <div className="glass-panel perfume-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
            Total Revenue
          </span>
          <h3 style={{ fontSize: "2rem", fontWeight: 700 }}>KES {totalRevenueKES.toLocaleString()}</h3>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            ${totalRevenueUSD.toLocaleString()} USD total clearance
          </span>
        </div>

        <div className="glass-panel perfume-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
            Placed Orders
          </span>
          <h3 style={{ fontSize: "2rem", fontWeight: 700 }}>{totalOrdersCount}</h3>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {completedOrders.length} payments cleared successfully
          </span>
        </div>

        <div className="glass-panel perfume-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
            Registered Users
          </span>
          <h3 style={{ fontSize: "2rem", fontWeight: 700 }}>{registeredUsersCount}</h3>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Customers and administrative accounts
          </span>
        </div>
      </section>

      {/* Details Lists (Orders Table and Accounts List) */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2.5rem" }}>
        
        {/* Table 1: Placed Orders Logs */}
        <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px", overflowX: "auto" }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--primary)" }}>
            Transaction Logs
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                <th style={{ padding: "0.75rem 0.5rem" }}>Order ID</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Phone</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Quantity</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Amount (USD)</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>User ID</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace", fontSize: "0.85rem" }}>{order.id}</td>
                  <td style={{ padding: "0.75rem 0.5rem" }}>{order.phone}</td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>{order.quantity}</td>
                  <td style={{ padding: "0.75rem 0.5rem" }}>${order.amount.toFixed(2)}</td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>{order.userId || "N/A"}</td>
                  <td style={{ padding: "0.75rem 0.5rem" }}>
                    <span className="stock-tag" style={{
                      background: order.status === "COMPLETED" ? "rgba(34,197,94,0.1)" : order.status === "FAILED" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)",
                      color: order.status === "COMPLETED" ? "#4ade80" : order.status === "FAILED" ? "#f87171" : "#facc15"
                    }}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No checkout transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table 2: Registered User Accounts */}
        <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px" }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--primary)" }}>
            System Accounts
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {users.map((user) => (
              <div key={user.id} style={{
                background: "rgba(255,255,255,0.02)",
                padding: "1rem",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                    {user.email}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>User ID: {user.id}</div>
                </div>
                <span className="stock-tag" style={{
                  background: user.role === "ROLE_ADMIN" ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.05)",
                  color: user.role === "ROLE_ADMIN" ? "#c084fc" : "var(--text-muted)"
                }}>
                  {user.role.replace("ROLE_", "")}
                </span>
              </div>
            ))}
          </div>
        </div>

      </section>
    </main>
  );
}
