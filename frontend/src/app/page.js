"use client";

import { useState, useEffect } from "react";
import { signup, signin, getPerfumes, checkout, getOrderStatus } from "./api";
import Link from "next/link";

/**
 * Main application dashboard and checkout interface.
 * Implements client-side authentication tabs, product listings, and live M-Pesa status tracking.
 */
export default function Home() {
  // Auth state
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(null);
  const [authMode, setAuthMode] = useState("signin"); // signin or signup
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Catalog state
  const [perfumes, setPerfumes] = useState([]);
  const [catalogError, setCatalogError] = useState("");

  // Modal checkout state
  const [selectedPerfume, setSelectedPerfume] = useState(null);
  const [checkoutPhone, setCheckoutPhone] = useState("2547");
  const [checkoutQty, setCheckoutQty] = useState(1);
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // PENDING, COMPLETED, FAILED

  // Check auth state on boot
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedEmail = localStorage.getItem("email");
    const savedRole = localStorage.getItem("role");
    if (savedToken && savedEmail) {
      setToken(savedToken);
      setEmail(savedEmail);
      setRole(savedRole);
      loadCatalog();
    }
  }, []);

  // Reload catalog whenever token changes (user logs in)
  useEffect(() => {
    if (token) {
      loadCatalog();
    }
  }, [token]);

  // Poll for order payment status when orderId is generated
  useEffect(() => {
    let intervalId;
    if (orderId && paymentStatus === "PENDING") {
      intervalId = setInterval(async () => {
        try {
          const statusDetails = await getOrderStatus(orderId);
          console.log("Order Status Check:", statusDetails.status);
          
          if (statusDetails.status === "COMPLETED") {
            setPaymentStatus("COMPLETED");
            clearInterval(intervalId);
            // Refresh catalog to reflect reduced stock counts
            loadCatalog();
          } else if (statusDetails.status === "FAILED") {
            setPaymentStatus("FAILED");
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error("Error polling order status:", err);
        }
      }, 3000); // Poll every 3 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, paymentStatus]);

  // Fetches perfumes catalog from Spring Boot
  async function loadCatalog() {
    try {
      setCatalogError("");
      const data = await getPerfumes();
      setPerfumes(data);
    } catch (err) {
      setCatalogError(err.message || "Failed to load catalog.");
    }
  }

  // Handles signup/signin submissions
  async function handleAuth(e) {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authEmail || !authPassword) {
      setAuthError("Email and Password are required.");
      return;
    }

    try {
      if (authMode === "signup") {
        await signup(authEmail, authPassword);
        setAuthSuccess("Registration complete. You can now Sign In!");
        setAuthMode("signin");
        setAuthPassword("");
      } else {
        const data = await signin(authEmail, authPassword);
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email);
        localStorage.setItem("role", data.role);
        setToken(data.token);
        setEmail(data.email);
        setRole(data.role);
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (err) {
      setAuthError(err.message || "Authentication failed.");
    }
  }

  // Log out the user and clear browser state
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    setToken(null);
    setEmail("");
    setRole(null);
    setPerfumes([]);
  }

  // Submits checkout request and triggers Safaricom STK Push
  async function handleCheckout(e) {
    e.preventDefault();
    setCheckoutError("");
    setIsSubmitting(true);

    // Validate phone number format (Kenyan 254...)
    if (!/^254(7|1)\d{8}$/.test(checkoutPhone)) {
      setCheckoutError("Provide a valid phone starting with 254 (e.g. 254712345678)");
      setIsSubmitting(false);
      return;
    }

    if (checkoutQty > selectedPerfume.stockCount) {
      setCheckoutError("Requested quantity exceeds available stock.");
      setIsSubmitting(false);
      return;
    }

    const totalAmount = selectedPerfume.price * checkoutQty;

    try {
      const response = await checkout(
        checkoutPhone,
        totalAmount,
        selectedPerfume.id,
        checkoutQty
      );

      // Save order context and transition to polling status mode
      setOrderId(response.orderId);
      setPaymentStatus("PENDING");
    } catch (err) {
      setCheckoutError(err.message || "Checkout submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Resets checkout modal parameters to default
  function closeCheckoutModal() {
    setSelectedPerfume(null);
    setCheckoutPhone("2547");
    setCheckoutQty(1);
    setCheckoutError("");
    setOrderId(null);
    setPaymentStatus(null);
  }

  // 1. RENDER AUTHENTICATION VIEW IF USER IS LOGGED OUT
  if (!token) {
    return (
      <main className="app-container">
        <div className="glass-panel auth-container">
          <h1 className="auth-title">Scentcepts 2.0</h1>
          <p className="auth-subtitle">Discover Your Signature Fragrance</p>

          <div className="auth-tabs">
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

          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

            <button id="auth-submit-btn" type="submit" className="btn-primary">
              {authMode === "signin" ? "Sign In" : "Register"}
            </button>
          </form>

          {authError && <p className="error-message" id="auth-err-msg">{authError}</p>}
          {authSuccess && <p style={{ color: "#4ade80", fontSize: "0.9rem", marginTop: "1rem" }} id="auth-success-msg">{authSuccess}</p>}
        </div>
      </main>
    );
  }

  // 2. RENDER MAIN PRODUCT DASHBOARD VIEW IF AUTHENTICATED
  return (
    <main className="app-container">
      {/* Header and User Navigation */}
      <header className="header">
        <div className="logo">Scentcepts</div>
        <div className="nav-user">
          <span className="user-email">{email}</span>
          {role === "ROLE_ADMIN" && (
            <Link id="admin-dashboard-link" href="/admin" className="btn-secondary" style={{ textDecoration: "none", color: "var(--primary)", borderColor: "var(--primary)" }}>
              👑 Admin Console
            </Link>
          )}
          <button id="logout-btn" className="btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Title Section */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "0.25rem" }}>Luxury Collection</h2>
          <p style={{ color: "--text-muted", fontSize: "0.95rem" }}>Curated fine perfumes, direct M-Pesa clearance</p>
        </div>
        <button className="btn-secondary" onClick={loadCatalog}>
          🔄 Refresh
        </button>
      </div>

      {catalogError && <p className="error-message">{catalogError}</p>}

      {/* Catalog Grid */}
      <section className="catalog-grid">
        {perfumes.map((perfume) => (
          <div key={perfume.id} className="glass-panel perfume-card">
            <span className="perfume-brand">{perfume.brand}</span>
            <h3 className="perfume-name">{perfume.name}</h3>
            <p className="perfume-desc">{perfume.description}</p>
            
            <div className="perfume-footer">
              <span className="perfume-price">${perfume.price.toFixed(2)}</span>
              {perfume.stockCount > 0 ? (
                <span className="stock-tag stock-ok">{perfume.stockCount} in stock</span>
              ) : (
                <span className="stock-tag stock-low">Sold Out</span>
              )}
            </div>

            <button
              id={`buy-btn-${perfume.id}`}
              className="btn-primary"
              style={{ marginTop: "1.25rem" }}
              onClick={() => setSelectedPerfume(perfume)}
              disabled={perfume.stockCount === 0}
            >
              {perfume.stockCount > 0 ? "Order Now" : "Out of Stock"}
            </button>
          </div>
        ))}
      </section>

      {/* 3. CHECKOUT MODAL OVERLAY */}
      {selectedPerfume && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-title">
              <span>🛒 Secure Checkout</span>
            </div>

            {/* Display product details summary */}
            <div className="checkout-details">
              <div className="checkout-row">
                <span>Product:</span>
                <span style={{ fontWeight: 600 }}>{selectedPerfume.name} ({selectedPerfume.brand})</span>
              </div>
              <div className="checkout-row">
                <span>Unit Price:</span>
                <span>${selectedPerfume.price.toFixed(2)}</span>
              </div>
              <div className="checkout-row">
                <span>Stock Level:</span>
                <span>{selectedPerfume.stockCount} left</span>
              </div>
            </div>

            {paymentStatus === null && (
              /* A. FORM INPUT VIEW */
              <form onSubmit={handleCheckout} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label htmlFor="phone-input" className="form-label">M-Pesa Phone Number</label>
                  <input
                    id="phone-input"
                    type="tel"
                    className="form-input"
                    placeholder="254712345678"
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    required
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                    Must begin with 254 (e.g. 254711223344)
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="qty-input" className="form-label">Quantity</label>
                  <input
                    id="qty-input"
                    type="number"
                    min="1"
                    max={selectedPerfume.stockCount}
                    className="form-input"
                    value={checkoutQty}
                    onChange={(e) => setCheckoutQty(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <div className="checkout-details" style={{ marginTop: "0.5rem" }}>
                  <div className="checkout-row checkout-total">
                    <span>Total Amount (KES):</span>
                    <span>KES {(selectedPerfume.price * checkoutQty * 130).toLocaleString()}</span>
                  </div>
                  <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginTop: "0.25rem" }}>
                    Converted at 1 USD = 130 KES for M-Pesa processing
                  </small>
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button id="cancel-checkout-btn" type="button" className="btn-secondary" style={{ flex: 1 }} onClick={closeCheckoutModal}>
                    Cancel
                  </button>
                  <button id="submit-checkout-btn" type="submit" className="btn-primary" style={{ flex: 1.5 }} disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Pay with M-Pesa"}
                  </button>
                </div>
                {checkoutError && <p className="error-message">{checkoutError}</p>}
              </form>
            )}

            {paymentStatus === "PENDING" && (
              /* B. STK PUSH PULSING TIMER VIEW */
              <div style={{ textAlign: "center" }}>
                <div className="stk-pulsing">
                  <span className="stk-icon">📱</span>
                </div>
                <h4 style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "0.5rem" }}>STK Push Initiated</h4>
                <p className="stk-text">
                  Please check your phone for the M-Pesa prompt. Enter your PIN to clear the payment of 
                  <strong> KES {(selectedPerfume.price * checkoutQty * 130).toLocaleString()}</strong>.
                </p>
                <div style={{ color: "var(--primary)", fontSize: "0.9rem", fontWeight: 600 }}>
                  ⏳ Awaiting M-Pesa confirmation callback...
                </div>
              </div>
            )}

            {paymentStatus === "COMPLETED" && (
              /* C. PAYMENT COMPLETE SUCCESS SCREEN */
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={{ fontSize: "3.5rem", color: "#4ade80", marginBottom: "1rem" }}>✓</div>
                <h4 style={{ fontWeight: 600, fontSize: "1.3rem", marginBottom: "0.5rem", color: "#4ade80" }}>Payment Cleared!</h4>
                <p className="stk-text">
                  Your order has been completed and perfume stock levels updated in the catalog.
                </p>
                <button className="btn-primary" style={{ width: "200px" }} onClick={closeCheckoutModal}>
                  Done
                </button>
              </div>
            )}

            {paymentStatus === "FAILED" && (
              /* D. PAYMENT FAILED SCREEN */
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={{ fontSize: "3.5rem", color: "#ff4a4a", marginBottom: "1rem" }}>✗</div>
                <h4 style={{ fontWeight: 600, fontSize: "1.3rem", marginBottom: "0.5rem", color: "#ff4a4a" }}>Payment Failed</h4>
                <p className="stk-text">
                  The STK push request failed or was cancelled by the customer.
                </p>
                <button className="btn-secondary" style={{ width: "200px" }} onClick={closeCheckoutModal}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
