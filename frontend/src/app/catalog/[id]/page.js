"use client";

import { useState, useEffect } from "react";
import { getPerfumeById, checkout, getOrderStatus } from "../../api";
import Link from "next/link";

/**
 * ProductDetailPage Component.
 * Handles dynamic route `/catalog/[id]` showing detailed olfactory descriptions,
 * sizing selection (Full size vs decants), and secure M-Pesa STK checkouts.
 */
export default function ProductDetailPage({ params }) {
  const perfumeId = params.id;

  // Authentication status
  const [token, setToken] = useState(null);
  
  // Data states
  const [perfume, setPerfume] = useState(null);
  const [size, setSize] = useState("FULL"); // FULL (100ml) or DECANT (10ml)
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("2547");

  // Flow control states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // PENDING, COMPLETED, FAILED

  // Check auth and load product details
  useEffect(() => {
    setToken(localStorage.getItem("token"));
    
    async function loadProduct() {
      try {
        setLoading(true);
        setErrorMsg("");
        const data = await getPerfumeById(perfumeId);
        setPerfume(data);
      } catch (err) {
        setErrorMsg(err.message || "Failed to load fragrance profile.");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [perfumeId]);

  // Polling order completion status
  useEffect(() => {
    let intervalId;
    if (orderId && paymentStatus === "PENDING") {
      intervalId = setInterval(async () => {
        try {
          const statusDetails = await getOrderStatus(orderId);
          if (statusDetails.status === "COMPLETED") {
            setPaymentStatus("COMPLETED");
            clearInterval(intervalId);
            // Re-fetch product to get refreshed stock counts
            const refreshed = await getPerfumeById(perfumeId);
            setPerfume(refreshed);
          } else if (statusDetails.status === "FAILED") {
            setPaymentStatus("FAILED");
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error("Error polling order status:", err);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, paymentStatus, perfumeId]);

  // Calculate pricing based on bottle size selection (Decant is 15% of full price)
  const getUnitPrice = () => {
    if (!perfume) return 0;
    return size === "FULL" ? perfume.price : perfume.price * 0.15;
  };

  const unitPrice = getUnitPrice();
  const totalPriceUSD = unitPrice * quantity;
  const totalPriceKES = totalPriceUSD * 130;

  // Submit payment order
  async function handleOrderSubmit(e) {
    e.preventDefault();
    setCheckoutError("");
    setIsSubmitting(true);

    if (!/^254(7|1)\d{8}$/.test(phone)) {
      setCheckoutError("Provide a valid phone starting with 254 (e.g. 254712345678)");
      setIsSubmitting(false);
      return;
    }

    if (quantity > perfume.stockCount) {
      setCheckoutError("Requested quantity exceeds available stock.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await checkout(
        phone,
        totalPriceUSD,
        perfume.id,
        quantity
      );
      setOrderId(response.orderId);
      setPaymentStatus("PENDING");
    } catch (err) {
      setCheckoutError(err.message || "Checkout submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Close payment tracking modal
  function resetPaymentTracking() {
    setOrderId(null);
    setPaymentStatus(null);
    setCheckoutError("");
    setQuantity(1);
  }

  if (loading) {
    return <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "5rem" }}>⏳ Loading fragrance profile...</p>;
  }

  if (errorMsg || !perfume) {
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>
        <p className="error-message">{errorMsg || "Fragrance not found."}</p>
        <Link href="/catalog" className="btn-secondary" style={{ display: "inline-block", marginTop: "2rem", textDecoration: "none" }}>
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Dynamic olfactory notes based on the seeded brand/name
  const getOlfactoryNotes = () => {
    const brand = perfume.brand.toUpperCase();
    if (brand.includes("CHANEL")) {
      return {
        top: "Aldehydes, Ylang-Ylang, Neroli, Bergamot",
        heart: "Iris, Jasmine, Rose, Orris Root",
        base: "Sandalwood, Amber, Patchouli, Musk, Vetiver"
      };
    } else if (brand.includes("DIOR")) {
      return {
        top: "Calabrian Bergamot, Sichuan Pepper",
        heart: "Lavender, Pink Pepper, Vetiver, Patchouli",
        base: "Ambroxan, Cedar, Labdanum"
      };
    } else if (brand.includes("LAURENT") || brand.includes("YSL")) {
      return {
        top: "Pear, Pink Pepper, Orange Blossom",
        heart: "Coffee, Jasmine, Bitter Almond, Licorice",
        base: "Vanilla, Patchouli, Cashmere Wood, Cedar"
      };
    }
    return {
      top: "Bergamot, Citrus, Fresh Spices",
      heart: "White Florals, Lavender, Soft Resins",
      base: "Sandalwood, Warm Musk, Amberwood"
    };
  };

  const notes = getOlfactoryNotes();

  return (
    <main style={{ paddingBottom: "4rem" }}>
      
      <Link href="/catalog" className="btn-secondary" style={{ display: "inline-block", textDecoration: "none", marginBottom: "2rem" }}>
        ← Back to Catalog
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem" }}>
        
        {/* Left Side: Olfactory Profile */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="glass-panel animate-float" style={{ padding: "3rem 2rem", borderRadius: "24px", textAlign: "center", border: "1px solid rgba(212, 175, 55, 0.15)" }}>
            <span style={{ fontSize: "6rem" }}>🧴</span>
            <h2 className="text-gold-gradient" style={{ fontSize: "2rem", marginTop: "1.5rem", fontWeight: 700 }}>{perfume.name}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", letterSpacing: "1px", textTransform: "uppercase" }}>{perfume.brand}</p>
          </div>

          <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--primary)", marginBottom: "1rem" }}>Olfactory Notes</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.9rem" }}>
              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "0.75rem" }}>
                <strong style={{ color: "#ffffff", display: "block", marginBottom: "0.25rem" }}>Top Notes</strong>
                <span style={{ color: "var(--text-muted)" }}>{notes.top}</span>
              </div>
              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "0.75rem" }}>
                <strong style={{ color: "#ffffff", display: "block", marginBottom: "0.25rem" }}>Heart Notes</strong>
                <span style={{ color: "var(--text-muted)" }}>{notes.heart}</span>
              </div>
              <div>
                <strong style={{ color: "#ffffff", display: "block", marginBottom: "0.25rem" }}>Base Notes</strong>
                <span style={{ color: "var(--text-muted)" }}>{notes.base}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Product Details & M-Pesa Checkout */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="glass-panel" style={{ padding: "2.5rem", borderRadius: "24px" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 600, marginBottom: "0.75rem", color: "#ffffff" }}>Fragrance Overview</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "1.5rem" }}>{perfume.description}</p>
            
            <div style={{ borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", padding: "1.25rem 0", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Standard Bottle Price</span>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary)" }}>${perfume.price.toFixed(2)}</div>
              </div>
              <span className={`stock-tag ${perfume.stockCount > 0 ? "stock-ok" : "stock-low"}`} style={{ height: "fit-content" }}>
                {perfume.stockCount > 0 ? `${perfume.stockCount} Bottles Left` : "Out of Stock"}
              </span>
            </div>

            {/* Sizing Toggles */}
            <div style={{ marginBottom: "2rem" }}>
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", display: "block", marginBottom: "0.75rem", fontWeight: 500 }}>Select Bottle Sizing</span>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button 
                  onClick={() => setSize("FULL")} 
                  className="btn-secondary" 
                  style={{
                    flex: 1,
                    background: size === "FULL" ? "rgba(212, 175, 55, 0.1)" : "transparent",
                    borderColor: size === "FULL" ? "var(--primary)" : "var(--border-color)",
                    color: size === "FULL" ? "var(--primary)" : "var(--text-main)",
                    fontWeight: 600
                  }}
                >
                  🧴 Full Bottle (100ml)
                </button>
                <button 
                  onClick={() => setSize("DECANT")} 
                  className="btn-secondary" 
                  style={{
                    flex: 1,
                    background: size === "DECANT" ? "rgba(212, 175, 55, 0.1)" : "transparent",
                    borderColor: size === "DECANT" ? "var(--primary)" : "var(--border-color)",
                    color: size === "DECANT" ? "var(--primary)" : "var(--text-main)",
                    fontWeight: 600
                  }}
                >
                  🧪 Travel Decant (10ml)
                </button>
              </div>
            </div>

            {/* Checkout Interface conditional wrapper */}
            {token ? (
              <form onSubmit={handleOrderSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                  <div className="form-group" style={{ flex: 1.5 }}>
                    <label htmlFor="qty-input" className="form-label">Quantity</label>
                    <input 
                      id="qty-input" 
                      type="number" 
                      min="1" 
                      max={perfume.stockCount} 
                      className="form-input" 
                      value={quantity} 
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 3.5 }}>
                    <label htmlFor="phone-input" className="form-label">M-Pesa Phone Number</label>
                    <input 
                      id="phone-input" 
                      type="tel" 
                      className="form-input" 
                      placeholder="254712345678" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="checkout-details" style={{ margin: "0.5rem 0" }}>
                  <div className="checkout-row">
                    <span>Unit Price ({size === "FULL" ? "100ml" : "10ml decant"}):</span>
                    <span>${unitPrice.toFixed(2)} USD</span>
                  </div>
                  <div className="checkout-row checkout-total" style={{ fontSize: "1.2rem" }}>
                    <span>Total Amount (KES):</span>
                    <span>KES {totalPriceKES.toLocaleString()}</span>
                  </div>
                  <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>
                    USD converted at 1 USD = 130 KES for Safaricom STK checkout
                  </small>
                </div>

                <button id="order-submit-btn" type="submit" className="btn-primary" style={{ width: "100%", padding: "0.85rem" }} disabled={isSubmitting || perfume.stockCount === 0}>
                  {isSubmitting ? "Processing checkout..." : "Pay with M-Pesa"}
                </button>
                {checkoutError && <p className="error-message">⚠️ {checkoutError}</p>}
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem", background: "rgba(255,255,255,0.02)", border: "1px dashed var(--border-color)", borderRadius: "16px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>You must sign in to clear orders and pay via M-Pesa.</p>
                <Link href="/auth" className="btn-primary" style={{ display: "inline-block", textDecoration: "none", padding: "0.6rem 2rem" }}>
                  Sign In to Purchase
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- PAYMENT POPUP MODAL --- */}
      {paymentStatus !== null && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: "450px", textAlign: "center" }}>
            
            {paymentStatus === "PENDING" && (
              <div>
                <div className="stk-pulsing">
                  <span className="stk-icon">📱</span>
                </div>
                <h4 style={{ fontWeight: 600, fontSize: "1.2rem", marginBottom: "0.5rem", color: "#ffffff" }}>STK Push Dispatched</h4>
                <p className="stk-text" style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                  Please check your phone for the M-Pesa pin prompt to clear the payment of 
                  <strong> KES {totalPriceKES.toLocaleString()}</strong>.
                </p>
                <div style={{ color: "var(--primary)", fontSize: "0.9rem", fontWeight: 600 }}>
                  ⏳ Awaiting M-Pesa callback confirmation...
                </div>
              </div>
            )}

            {paymentStatus === "COMPLETED" && (
              <div style={{ padding: "1rem 0" }}>
                <div style={{ fontSize: "3.5rem", color: "#4ade80", marginBottom: "1rem" }}>✓</div>
                <h4 style={{ fontWeight: 600, fontSize: "1.3rem", marginBottom: "0.5rem", color: "#4ade80" }}>Payment Cleared!</h4>
                <p className="stk-text" style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                  Your order has been completed and perfume stock levels updated in the catalog.
                </p>
                <button className="btn-primary" style={{ width: "200px" }} onClick={resetPaymentTracking}>
                  Done
                </button>
              </div>
            )}

            {paymentStatus === "FAILED" && (
              <div style={{ padding: "1rem 0" }}>
                <div style={{ fontSize: "3.5rem", color: "#ff4a4a", marginBottom: "1rem" }}>✗</div>
                <h4 style={{ fontWeight: 600, fontSize: "1.3rem", marginBottom: "0.5rem", color: "#ff4a4a" }}>Payment Failed</h4>
                <p className="stk-text" style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                  The STK push request failed or was cancelled by the customer.
                </p>
                <button className="btn-secondary" style={{ width: "200px" }} onClick={resetPaymentTracking}>
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
