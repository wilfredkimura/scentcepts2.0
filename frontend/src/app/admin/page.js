"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getPerfumes,
  adminCreatePerfume as createPerfume,
  adminUpdatePerfume as updatePerfume,
  adminDeletePerfume as deletePerfume,
  getAdminUsers,
  adminCreateUser as createAdminUser,
  adminUpdateUser as updateAdminUser,
  adminDeleteUser as deleteAdminUser,
  getAdminTransactions,
  getAdminOrders
} from "../api";

export default function AdminPage() {
  const router = useRouter();
  
  // Tab control
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, catalog, orders, users, transactions
  
  // List data states
  const [perfumes, setPerfumes] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Stats counters
  const [stats, setStats] = useState({
    revenueUSD: 0,
    revenueKES: 0,
    ordersCount: 0,
    perfumesCount: 0,
    usersCount: 0,
    transactionsCount: 0
  });

  // Modal control states
  const [perfumeModal, setPerfumeModal] = useState({ open: false, mode: "add", data: null });
  const [userModal, setUserModal] = useState({ open: false, mode: "add", data: null });

  // Form states for Perfumes
  const [perfumeForm, setPerfumeForm] = useState({ name: "", brand: "", price: 0, stockCount: 0, description: "" });
  
  // Form states for Users
  const [userForm, setUserForm] = useState({ email: "", password: "", role: "ROLE_USER" });

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Retrieve admin lists
  async function fetchDashboardData() {
    try {
      setLoading(true);
      setErrorMsg("");

      // 1. Load Perfumes
      const perfumesList = await getPerfumes();
      setPerfumes(perfumesList);

      // 2. Load Users
      const usersList = await getAdminUsers();
      setUsers(usersList);

      // 3. Load Orders
      const ordersList = await getAdminOrders();
      setOrders(ordersList);

      // 4. Load Transactions
      const transactionsList = await getAdminTransactions();
      setTransactions(transactionsList);

      // Calculate stats
      const totalRevenueUSD = ordersList
        .filter(o => o.status === "COMPLETED")
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const totalRevenueKES = totalRevenueUSD * 130;

      setStats({
        revenueUSD: totalRevenueUSD,
        revenueKES: totalRevenueKES,
        ordersCount: ordersList.length,
        perfumesCount: perfumesList.length,
        usersCount: usersList.length,
        transactionsCount: transactionsList.length
      });

    } catch (err) {
      setErrorMsg(err.message || "Failed to load dashboard data.");
      
      // Auto-logout redirect on auth exceptions (401/403)
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        localStorage.removeItem("role");
        window.dispatchEvent(new Event("local-auth-change"));
        router.push("/auth");
      }
    } finally {
      setLoading(false);
    }
  }

  // Security guard for ROLE_ADMIN
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    
    if (!savedToken || savedRole !== "ROLE_ADMIN") {
      router.push("/");
    } else {
      fetchDashboardData();
    }
  }, [router]);

  // --- CRUD ACTION HANDLERS ---

  // Perfume CRUD Actions
  async function handlePerfumeSubmit(e) {
    e.preventDefault();
    try {
      if (perfumeModal.mode === "add") {
        await createPerfume(perfumeForm);
      } else {
        await updatePerfume(perfumeModal.data.id, perfumeForm);
      }
      setPerfumeModal({ open: false, mode: "add", data: null });
      fetchDashboardData();
    } catch (err) {
      alert("Error saving perfume: " + err.message);
    }
  }

  async function handlePerfumeDelete(id) {
    if (confirm("Are you sure you want to delete this perfume?")) {
      try {
        await deletePerfume(id);
        fetchDashboardData();
      } catch (err) {
        alert("Error deleting perfume: " + err.message);
      }
    }
  }

  // User CRUD Actions
  async function handleUserSubmit(e) {
    e.preventDefault();
    try {
      if (userModal.mode === "add") {
        await createAdminUser(userForm);
      } else {
        await updateAdminUser(userModal.data.id, userForm);
      }
      setUserModal({ open: false, mode: "add", data: null });
      fetchDashboardData();
    } catch (err) {
      alert("Error saving user: " + err.message);
    }
  }

  async function handleUserDelete(id) {
    if (confirm("Are you sure you want to delete this account?")) {
      try {
        await deleteAdminUser(id);
        fetchDashboardData();
      } catch (err) {
        alert("Error deleting user: " + err.message);
      }
    }
  }

  return (
    <div className="container-wide py-12">
      {/* Title Header */}
      <div className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-display-xl mb-2 font-serif text-foreground">Executive Dashboard</h1>
          <p className="text-body-lg text-muted-foreground">
            Manage Scentcepts operations and catalog.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="rounded-none border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground text-label-caps py-2.5 px-6 cursor-pointer transition-colors font-semibold"
        >
          Refresh Data
        </button>
      </div>

      {errorMsg && (
        <p className="text-red-500 text-sm mb-6 text-center font-medium">⚠️ {errorMsg}</p>
      )}

      {/* Tabs Layout */}
      <div className="grid w-full grid-cols-2 md:grid-cols-5 rounded-none bg-muted p-1 mb-8">
        {["dashboard", "catalog", "orders", "users", "transactions"].map((tab) => (
          <button
            key={tab}
            className={`py-3 text-label-caps cursor-pointer border-none font-semibold transition-colors rounded-none capitalize ${
              activeTab === tab
                ? "bg-background text-primary"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-24">⏳ Fetching dashboard datasets...</p>
      ) : (
        <div>
          {/* TAB 1: METRICS OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border border-border/50 bg-card/50 p-6 rounded-none">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Revenue (KES)</span>
                <h3 className="text-headline-lg font-serif text-primary mt-2">KES {stats.revenueKES.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-2">Total USD: ${stats.revenueUSD.toFixed(2)}</p>
              </div>
              <div className="border border-border/50 bg-card/50 p-6 rounded-none">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Orders</span>
                <h3 className="text-headline-lg font-serif text-foreground mt-2">+{stats.ordersCount}</h3>
                <p className="text-xs text-primary mt-2">Placed checkouts count</p>
              </div>
              <div className="border border-border/50 bg-card/50 p-6 rounded-none">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Catalog Items</span>
                <h3 className="text-headline-lg font-serif text-foreground mt-2">{stats.perfumesCount}</h3>
                <p className="text-xs text-muted-foreground mt-2">Active perfumes listed</p>
              </div>
              <div className="border border-border/50 bg-card/50 p-6 rounded-none">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Active Users</span>
                <h3 className="text-headline-lg font-serif text-foreground mt-2">+{stats.usersCount}</h3>
                <p className="text-xs text-primary mt-2">Registered accounts count</p>
              </div>
            </div>
          )}

          {/* TAB 2: PERFUME CATALOG CRUD */}
          {activeTab === "catalog" && (
            <div className="border border-border/50 bg-card/50 p-6 rounded-none relative">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-headline-md text-foreground font-serif">Perfume Catalog</h3>
                  <p className="text-body-md text-muted-foreground mt-1">Manage Scentcepts fragrance stock.</p>
                </div>
                <button
                  className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 border-none cursor-pointer font-bold transition-colors text-xs tracking-wider"
                  onClick={() => {
                    setPerfumeForm({ name: "", brand: "", price: 0, stockCount: 0, description: "" });
                    setPerfumeModal({ open: true, mode: "add", data: null });
                  }}
                >
                  Add Perfume
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-body-md">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground uppercase text-xs tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Brand</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfumes.map((perfume) => (
                      <tr key={perfume.id} className="border-b border-border/30 hover:bg-muted/10">
                        <td className="py-3 px-4 text-foreground font-medium">{perfume.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{perfume.brand}</td>
                        <td className="py-3 px-4 text-primary">${perfume.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-foreground">{perfume.stockCount}</td>
                        <td className="py-3 px-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setPerfumeForm({
                                name: perfume.name,
                                brand: perfume.brand,
                                price: perfume.price,
                                stockCount: perfume.stockCount,
                                description: perfume.description
                              });
                              setPerfumeModal({ open: true, mode: "edit", data: perfume });
                            }}
                            className="bg-transparent border border-border text-foreground hover:bg-muted/20 text-xs px-3 py-1 cursor-pointer transition-colors font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handlePerfumeDelete(perfume.id)}
                            className="bg-transparent border border-red-500/50 text-red-500 hover:bg-red-500/10 text-xs px-3 py-1 cursor-pointer transition-colors font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PLACED ORDERS */}
          {activeTab === "orders" && (
            <div className="border border-border/50 bg-card/50 p-6 rounded-none">
              <div className="mb-6">
                <h3 className="text-headline-md text-foreground font-serif">Customer Orders</h3>
                <p className="text-body-md text-muted-foreground mt-1">Audit placed checkout records.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-body-md">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground uppercase text-xs tracking-wider">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-border/30 hover:bg-muted/10">
                        <td className="py-3 px-4 text-foreground font-medium">#{order.id}</td>
                        <td className="py-3 px-4 text-muted-foreground">{order.phoneNumber}</td>
                        <td className="py-3 px-4 text-muted-foreground">{order.userId || "GUEST"}</td>
                        <td className="py-3 px-4 text-primary">${order.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-none ${
                            order.status === "COMPLETED"
                              ? "bg-green-500/10 text-green-500"
                              : order.status === "FAILED"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-yellow-500/10 text-yellow-500"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-muted-foreground">No orders logged in database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: USER ACCOUNTS CRUD */}
          {activeTab === "users" && (
            <div className="border border-border/50 bg-card/50 p-6 rounded-none">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-headline-md text-foreground font-serif">Users Directory</h3>
                  <p className="text-body-md text-muted-foreground mt-1">Configure account access roles.</p>
                </div>
                <button
                  className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 border-none cursor-pointer font-bold transition-colors text-xs tracking-wider"
                  onClick={() => {
                    setUserForm({ email: "", password: "", role: "ROLE_USER" });
                    setUserModal({ open: true, mode: "add", data: null });
                  }}
                >
                  Add User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-body-md">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground uppercase text-xs tracking-wider">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Access Role</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border/30 hover:bg-muted/10">
                        <td className="py-3 px-4 text-muted-foreground">#{u.id}</td>
                        <td className="py-3 px-4 text-foreground font-medium">{u.email}</td>
                        <td className="py-3 px-4 text-primary">{u.role}</td>
                        <td className="py-3 px-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setUserForm({ email: u.email, password: "", role: u.role });
                              setUserModal({ open: true, mode: "edit", data: u });
                            }}
                            className="bg-transparent border border-border text-foreground hover:bg-muted/20 text-xs px-3 py-1 cursor-pointer transition-colors font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleUserDelete(u.id)}
                            className="bg-transparent border border-red-500/50 text-red-500 hover:bg-red-500/10 text-xs px-3 py-1 cursor-pointer transition-colors font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: WEBHOOK TRANSACTIONS LOGS */}
          {activeTab === "transactions" && (
            <div className="border border-border/50 bg-card/50 p-6 rounded-none">
              <div className="mb-6">
                <h3 className="text-headline-md text-foreground font-serif">M-Pesa STK Transactions</h3>
                <p className="text-body-md text-muted-foreground mt-1">Audit raw payment callback records.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-body-md">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground uppercase text-xs tracking-wider">
                      <th className="py-3 px-4">Trans ID</th>
                      <th className="py-3 px-4">Checkout ID</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Sender Phone</th>
                      <th className="py-3 px-4">Checkout Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border/30 hover:bg-muted/10">
                        <td className="py-3 px-4 text-primary font-medium">{tx.mpesaReceiptNumber || "PENDING"}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{tx.merchantRequestID}</td>
                        <td className="py-3 px-4 text-foreground">KES {tx.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-foreground">{tx.phoneNumber}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{tx.transactionDate || "N/A"}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-muted-foreground">No webhook callback transactions recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- CRUD MODAL OVERLAYS --- */}

      {/* A. PERFUME FORM MODAL */}
      {perfumeModal.open && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="border border-border/50 bg-card p-8 max-w-lg w-full relative">
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-headline-md font-serif text-foreground">
                {perfumeModal.mode === "add" ? "Create Fragrance" : "Update Fragrance"}
              </h3>
              <button
                className="bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer text-lg font-bold"
                onClick={() => setPerfumeModal({ open: false, mode: "add", data: null })}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePerfumeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Perfume Name</label>
                <input
                  type="text"
                  required
                  value={perfumeForm.name}
                  onChange={(e) => setPerfumeForm({ ...perfumeForm, name: e.target.value })}
                  className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Brand/House</label>
                <input
                  type="text"
                  required
                  value={perfumeForm.brand}
                  onChange={(e) => setPerfumeForm({ ...perfumeForm, brand: e.target.value })}
                  className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={perfumeForm.price}
                    onChange={(e) => setPerfumeForm({ ...perfumeForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Stock Count</label>
                  <input
                    type="number"
                    required
                    value={perfumeForm.stockCount}
                    onChange={(e) => setPerfumeForm({ ...perfumeForm, stockCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Fragrance Description</label>
                <textarea
                  required
                  rows="3"
                  value={perfumeForm.description}
                  onChange={(e) => setPerfumeForm({ ...perfumeForm, description: e.target.value })}
                  className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-label-caps border-none cursor-pointer font-bold transition-colors mt-4"
              >
                {perfumeModal.mode === "add" ? "Save Perfume" : "Update Perfume"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* B. USER FORM MODAL */}
      {userModal.open && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="border border-border/50 bg-card p-8 max-w-md w-full relative">
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-headline-md font-serif text-foreground">
                {userModal.mode === "add" ? "Create Account" : "Update Account"}
              </h3>
              <button
                className="bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer text-lg font-bold"
                onClick={() => setUserModal({ open: false, mode: "add", data: null })}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Password {userModal.mode === "edit" && "(Leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  required={userModal.mode === "add"}
                  placeholder={userModal.mode === "edit" ? "••••••••" : ""}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Access Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md h-10"
                >
                  <option value="ROLE_USER">Customer (ROLE_USER)</option>
                  <option value="ROLE_ADMIN">Administrator (ROLE_ADMIN)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-label-caps border-none cursor-pointer font-bold transition-colors mt-4"
              >
                {userModal.mode === "add" ? "Save Account" : "Update Account"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
