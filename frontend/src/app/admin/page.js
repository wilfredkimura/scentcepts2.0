"use client";

import { useState, useEffect } from "react";
import { 
  getAdminUsers, 
  getAdminOrders, 
  getAdminTransactions, 
  getPerfumes,
  adminCreatePerfume, 
  adminUpdatePerfume, 
  adminDeletePerfume,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser 
} from "../api";
import Link from "next/link";

/**
 * AdminDashboard Component.
 * Supports sidebar navigation categorizing Dashboard metrics, Perfume catalog, User management, Orders, and Transactions.
 * Facilitates complete CRUD modal interfaces for Catalog and User datasets.
 */
export default function AdminDashboard() {
  // Navigation categories: dashboard, perfumes, orders, users, transactions
  const [activeTab, setActiveTab] = useState("dashboard");

  // Authorization verification
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  // Datasets
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [perfumes, setPerfumes] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // UI state managers
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // CRUD Modals state variables
  const [perfumeModal, setPerfumeModal] = useState(null); // null, { mode: 'create' } or { mode: 'edit', data: perfume }
  const [userModal, setUserModal] = useState(null);       // null, { mode: 'create' } or { mode: 'edit', data: user }

  // Perfume Modal form fields
  const [perfumeName, setPerfumeName] = useState("");
  const [perfumeBrand, setPerfumeBrand] = useState("");
  const [perfumePrice, setPerfumePrice] = useState(0.0);
  const [perfumeStock, setPerfumeStock] = useState(0);
  const [perfumeDesc, setPerfumeDesc] = useState("");

  // User Modal form fields
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("ROLE_CUSTOMER");
  const [userPassword, setUserPassword] = useState(""); // optional for updates, required for create

  // Check auth privilege on page boot
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
   * Fetches all admin datasets concurrently (users, orders, transactions, perfumes).
   */
  async function fetchDashboardData() {
    try {
      setLoading(true);
      setErrorMsg("");
      
      const [usersData, ordersData, transactionsData, perfumesData] = await Promise.all([
        getAdminUsers(),
        getAdminOrders(),
        getAdminTransactions(),
        getPerfumes()
      ]);
      
      setUsers(usersData);
      setOrders(ordersData);
      setTransactions(transactionsData);
      setPerfumes(perfumesData);
    } catch (err) {
      setErrorMsg(err.message || "Failed to sync management database.");
      
      // If endpoint returns 401/403 (unauthorized/admin required), clear state and redirect to login
      if (err.message && (err.message.includes("Unauthorized") || err.message.includes("Admins only"))) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        localStorage.removeItem("role");
        setIsAdmin(false);
        alert("Session expired or unauthorized. Returning to login.");
        window.location.href = "/";
      }
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  }

  // Calculate high-level totals
  const totalOrdersCount = orders.length;
  const completedOrders = orders.filter(o => o.status === "COMPLETED");
  const totalRevenueUSD = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalRevenueKES = totalRevenueUSD * 130;
  const registeredUsersCount = users.length;
  const totalPerfumesCount = perfumes.length;
  const totalTransactionsCount = transactions.length;

  // --- CRUD FUNCTIONS FOR PERFUMES ---

  function openCreatePerfumeModal() {
    setPerfumeName("");
    setPerfumeBrand("");
    setPerfumePrice(49.99);
    setPerfumeStock(10);
    setPerfumeDesc("");
    setPerfumeModal({ mode: "create" });
  }

  function openEditPerfumeModal(perfume) {
    setPerfumeName(perfume.name);
    setPerfumeBrand(perfume.brand);
    setPerfumePrice(perfume.price);
    setPerfumeStock(perfume.stockCount);
    setPerfumeDesc(perfume.description || "");
    setPerfumeModal({ mode: "edit", data: perfume });
  }

  async function handlePerfumeSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    const payload = {
      name: perfumeName,
      brand: perfumeBrand,
      price: parseFloat(perfumePrice) || 0.0,
      stockCount: parseInt(perfumeStock) || 0,
      description: perfumeDesc
    };

    try {
      if (perfumeModal.mode === "create") {
        await adminCreatePerfume(payload);
        setSuccessMsg(`Perfume "${perfumeName}" added to catalog.`);
      } else {
        await adminUpdatePerfume(perfumeModal.data.id, payload);
        setSuccessMsg(`Perfume "${perfumeName}" updated.`);
      }
      setPerfumeModal(null);
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to process perfume CRUD request.");
    }
  }

  async function handlePerfumeDelete(id, name) {
    if (!confirm(`Are you sure you want to delete perfume "${name}"?`)) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await adminDeletePerfume(id);
      setSuccessMsg(`Perfume "${name}" deleted.`);
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to delete perfume catalog item.");
    }
  }

  // --- CRUD FUNCTIONS FOR USERS ---

  function openCreateUserModal() {
    setUserEmail("");
    setUserRole("ROLE_CUSTOMER");
    setUserPassword("");
    setUserModal({ mode: "create" });
  }

  function openEditUserModal(user) {
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserPassword(""); // password optional on update
    setUserModal({ mode: "edit", data: user });
  }

  async function handleUserSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      email: userEmail,
      role: userRole,
    };

    if (userPassword && userPassword.trim() !== "") {
      payload.password = userPassword;
    }

    try {
      if (userModal.mode === "create") {
        if (!userPassword) {
          setErrorMsg("Password is required for new user profiles.");
          return;
        }
        await adminCreateUser(payload);
        setSuccessMsg(`User "${userEmail}" created successfully.`);
      } else {
        await adminUpdateUser(userModal.data.id, payload);
        setSuccessMsg(`User "${userEmail}" updated.`);
      }
      setUserModal(null);
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to process user CRUD request.");
    }
  }

  async function handleUserDelete(id, email) {
    if (email === adminEmail) {
      alert("You cannot delete your own administrative account.");
      return;
    }
    if (!confirm(`Are you sure you want to delete user account "${email}"?`)) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await adminDeleteUser(id);
      setSuccessMsg(`User account "${email}" deleted.`);
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to delete user account.");
    }
  }

  // 1. LOADING SCREEN
  if (isCheckingAuth || (isAdmin && loading && users.length === 0)) {
    return (
      <main className="app-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
          ⏳ Accessing secure admin console...
        </div>
      </main>
    );
  }

  // 2. UNAUTHORIZED / ACCESS DENIED SCREEN
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
    <main className="app-container" style={{ maxWidth: "1400px" }}>
      {/* Header and User Navigation */}
      <header className="header" style={{ marginBottom: "2rem" }}>
        <div className="logo">Scentcepts Admin</div>
        <div className="nav-user">
          <span className="user-email" style={{ color: "var(--primary)" }}>👑 {adminEmail} (Admin)</span>
          <Link href="/" className="btn-secondary" style={{ textDecoration: "none" }}>
            Storefront
          </Link>
        </div>
      </header>

      {/* Main Title Section */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "0.25rem" }}>Management Console</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Overview of system catalog items, users, and transactions</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="btn-secondary" onClick={fetchDashboardData} disabled={loading}>
            {loading ? "Syncing..." : "🔄 Sync Data"}
          </button>
        </div>
      </div>

      {errorMsg && <p className="error-message" style={{ marginBottom: "1.5rem" }}>⚠️ {errorMsg}</p>}
      {successMsg && <p style={{ color: "#4ade80", fontSize: "0.95rem", padding: "0.75rem 1rem", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "8px", marginBottom: "1.5rem" }}>✓ {successMsg}</p>}

      {/* MAIN TWO-COLUMN LAYOUT: Sidebar (Tabs selector) + Content Area */}
      <div style={{ display: "flex", gap: "2rem", minHeight: "65vh", flexWrap: "wrap" }}>
        
        {/* Sidebar Nav */}
        <aside style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button 
            className={`auth-tab ${activeTab === "dashboard" ? "active" : ""}`}
            style={{ textAlign: "left", padding: "1rem", borderRadius: "12px", width: "100%", display: "flex", alignItems: "center", gap: "0.75rem" }}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard Overview
          </button>
          <button 
            className={`auth-tab ${activeTab === "perfumes" ? "active" : ""}`}
            style={{ textAlign: "left", padding: "1rem", borderRadius: "12px", width: "100%", display: "flex", alignItems: "center", gap: "0.75rem" }}
            onClick={() => setActiveTab("perfumes")}
          >
            🛍️ Catalog (Perfumes)
          </button>
          <button 
            className={`auth-tab ${activeTab === "orders" ? "active" : ""}`}
            style={{ textAlign: "left", padding: "1rem", borderRadius: "12px", width: "100%", display: "flex", alignItems: "center", gap: "0.75rem" }}
            onClick={() => setActiveTab("orders")}
          >
            🛒 Orders List
          </button>
          <button 
            className={`auth-tab ${activeTab === "users" ? "active" : ""}`}
            style={{ textAlign: "left", padding: "1rem", borderRadius: "12px", width: "100%", display: "flex", alignItems: "center", gap: "0.75rem" }}
            onClick={() => setActiveTab("users")}
          >
            👥 User Accounts
          </button>
          <button 
            className={`auth-tab ${activeTab === "transactions" ? "active" : ""}`}
            style={{ textAlign: "left", padding: "1rem", borderRadius: "12px", width: "100%", display: "flex", alignItems: "center", gap: "0.75rem" }}
            onClick={() => setActiveTab("transactions")}
          >
            💳 Transactions (M-Pesa)
          </button>
        </aside>

        {/* Content Panel */}
        <div style={{ flex: "3 3 800px", minWidth: "300px" }}>
          
          {/* TAB A: DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <section className="catalog-grid">
                <div className="glass-panel perfume-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Total Revenue</span>
                  <h3 style={{ fontSize: "2rem", fontWeight: 700 }}>KES {totalRevenueKES.toLocaleString()}</h3>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>${totalRevenueUSD.toLocaleString()} USD cleared</span>
                </div>
                <div className="glass-panel perfume-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Total Orders</span>
                  <h3 style={{ fontSize: "2rem", fontWeight: 700 }}>{totalOrdersCount}</h3>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{completedOrders.length} payments cleared</span>
                </div>
                <div className="glass-panel perfume-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Catalog Perfumes</span>
                  <h3 style={{ fontSize: "2rem", fontWeight: 700 }}>{totalPerfumesCount}</h3>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Active luxury options listed</span>
                </div>
              </section>

              <section className="catalog-grid">
                <div className="glass-panel perfume-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Registered Users</span>
                  <h3 style={{ fontSize: "2rem", fontWeight: 700 }}>{registeredUsersCount}</h3>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Customers and Administrators</span>
                </div>
                <div className="glass-panel perfume-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>M-Pesa Webhooks</span>
                  <h3 style={{ fontSize: "2rem", fontWeight: 700 }}>{totalTransactionsCount}</h3>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Initiated STK push requests</span>
                </div>
              </section>
            </div>
          )}

          {/* TAB B: PERFUME CATALOG CRUD */}
          {activeTab === "perfumes" && (
            <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--primary)" }}>Perfume Catalog Management</h3>
                <button className="btn-primary" onClick={openCreatePerfumeModal}>➕ Add Perfume</button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                      <th style={{ padding: "0.75rem" }}>ID</th>
                      <th style={{ padding: "0.75rem" }}>Name</th>
                      <th style={{ padding: "0.75rem" }}>Brand</th>
                      <th style={{ padding: "0.75rem" }}>Price (USD)</th>
                      <th style={{ padding: "0.75rem" }}>Stock Level</th>
                      <th style={{ padding: "0.75rem", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfumes.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "0.75rem" }}>{p.id}</td>
                        <td style={{ padding: "0.75rem", fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: "0.75rem" }}>{p.brand}</td>
                        <td style={{ padding: "0.75rem" }}>${p.price.toFixed(2)}</td>
                        <td style={{ padding: "0.75rem" }}>
                          <span className={`stock-tag ${p.stockCount > 0 ? "stock-ok" : "stock-low"}`}>
                            {p.stockCount} left
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "right" }}>
                          <button className="btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", marginRight: "0.5rem" }} onClick={() => openEditPerfumeModal(p)}>Edit</button>
                          <button className="btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", color: "#ff4a4a", borderColor: "rgba(255,74,74,0.2)" }} onClick={() => handlePerfumeDelete(p.id, p.name)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB C: ORDERS LOG */}
          {activeTab === "orders" && (
            <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px", overflowX: "auto" }}>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.5rem", color: "var(--primary)" }}>Customer Order Logs</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "0.75rem" }}>Order ID</th>
                    <th style={{ padding: "0.75rem" }}>Customer Phone</th>
                    <th style={{ padding: "0.75rem" }}>Quantity</th>
                    <th style={{ padding: "0.75rem" }}>Amount (USD)</th>
                    <th style={{ padding: "0.75rem" }}>User ID</th>
                    <th style={{ padding: "0.75rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "0.75rem", fontFamily: "monospace", fontSize: "0.85rem" }}>{order.id}</td>
                      <td style={{ padding: "0.75rem" }}>{order.phone}</td>
                      <td style={{ padding: "0.75rem" }}>{order.quantity}</td>
                      <td style={{ padding: "0.75rem" }}>${order.amount.toFixed(2)}</td>
                      <td style={{ padding: "0.75rem" }}>{order.userId || "Guest"}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span className="stock-tag" style={{
                          background: order.status === "COMPLETED" ? "rgba(34,197,94,0.1)" : order.status === "FAILED" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)",
                          color: order.status === "COMPLETED" ? "#4ade80" : order.status === "FAILED" ? "#f87171" : "#facc15"
                        }}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB D: SYSTEM USERS CRUD */}
          {activeTab === "users" && (
            <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--primary)" }}>Registered Accounts Management</h3>
                <button className="btn-primary" onClick={openCreateUserModal}>➕ Add Account</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                {users.map((u) => (
                  <div key={u.id} style={{
                    background: "rgba(255,255,255,0.01)",
                    padding: "1.25rem",
                    borderRadius: "16px",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Account ID: {u.id}</span>
                      <span className="stock-tag" style={{
                        background: u.role === "ROLE_ADMIN" ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.05)",
                        color: u.role === "ROLE_ADMIN" ? "#c084fc" : "var(--text-muted)"
                      }}>
                        {u.role.replace("ROLE_", "")}
                      </span>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.email}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                      <button className="btn-secondary" style={{ flex: 1, padding: "0.35rem", fontSize: "0.8rem" }} onClick={() => openEditUserModal(u)}>Edit</button>
                      <button className="btn-secondary" style={{ flex: 1, padding: "0.35rem", fontSize: "0.8rem", color: "#ff4a4a", borderColor: "rgba(255,74,74,0.1)" }} onClick={() => handleUserDelete(u.id, u.email)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB E: PAYMENT TRANSACTIONS LOG */}
          {activeTab === "transactions" && (
            <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px", overflowX: "auto" }}>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.5rem", color: "var(--primary)" }}>M-Pesa Gateway Payment Transactions</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "0.75rem" }}>ID</th>
                    <th style={{ padding: "0.75rem" }}>Checkout Request ID</th>
                    <th style={{ padding: "0.75rem" }}>Order ID</th>
                    <th style={{ padding: "0.75rem" }}>Perfume ID</th>
                    <th style={{ padding: "0.75rem" }}>Qty</th>
                    <th style={{ padding: "0.75rem" }}>Customer ID</th>
                    <th style={{ padding: "0.75rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "0.75rem" }}>{tx.id}</td>
                      <td style={{ padding: "0.75rem", fontFamily: "monospace", fontSize: "0.85rem" }}>{tx.checkoutRequestId}</td>
                      <td style={{ padding: "0.75rem", fontFamily: "monospace", fontSize: "0.85rem" }}>{tx.orderId}</td>
                      <td style={{ padding: "0.75rem" }}>{tx.perfumeId}</td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>{tx.quantity}</td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>{tx.userId || "N/A"}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span className="stock-tag" style={{
                          background: tx.status === "COMPLETED" ? "rgba(34,197,94,0.1)" : tx.status === "FAILED" ? "rgba(239,68,68,0.1)" : "rgba(234,179,8,0.1)",
                          color: tx.status === "COMPLETED" ? "#4ade80" : tx.status === "FAILED" ? "#f87171" : "#facc15"
                        }}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                        No payment transactions logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* --- CRUD MODAL OVERLAYS --- */}

      {/* 1. PERFUME CRUD MODAL */}
      {perfumeModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: "550px" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--primary)" }}>
              {perfumeModal.mode === "create" ? "➕ Add Perfume to Catalog" : "✏️ Edit Perfume Catalog Details"}
            </h3>

            <form onSubmit={handlePerfumeSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Perfume Name</label>
                <input type="text" className="form-input" value={perfumeName} onChange={(e) => setPerfumeName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Brand</label>
                <input type="text" className="form-input" value={perfumeBrand} onChange={(e) => setPerfumeBrand(e.target.value)} required />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Price (USD)</label>
                  <input type="number" step="0.01" className="form-input" value={perfumePrice} onChange={(e) => setPerfumePrice(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Stock Count</label>
                  <input type="number" className="form-input" value={perfumeStock} onChange={(e) => setPerfumeStock(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" style={{ minHeight: "80px", resize: "vertical" }} value={perfumeDesc} onChange={(e) => setPerfumeDesc(e.target.value)} required />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setPerfumeModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>Save Perfume</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. USER CRUD MODAL */}
      {userModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: "450px" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--primary)" }}>
              {userModal.mode === "create" ? "➕ Register User Profile" : "✏️ Edit Account Credentials"}
            </h3>

            <form onSubmit={handleUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Role Authority</label>
                <select className="form-input" style={{ background: "var(--bg-input)" }} value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                  <option value="ROLE_CUSTOMER">CUSTOMER</option>
                  <option value="ROLE_ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password {userModal.mode === "edit" && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>(Leave blank to keep current)</span>}
                </label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder={userModal.mode === "edit" ? "••••••••" : "Enter password"} 
                  value={userPassword} 
                  onChange={(e) => setUserPassword(e.target.value)} 
                  required={userModal.mode === "create"} 
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setUserModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
