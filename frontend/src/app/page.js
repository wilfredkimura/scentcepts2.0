"use client";

import { useState, useEffect } from "react";
import { getPerfumes } from "./api";
import Link from "next/link";

/**
 * Root Landing Page Component (/).
 * Renders a premium luxury storefront presentation featuring the hero banner,
 * slow float animation keyframes, feature call-outs, and popular arrivals.
 */
export default function LandingPage() {
  const [popularPerfumes, setPopularPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load sample perfumes for the popular arrivals gallery
  useEffect(() => {
    async function loadPopular() {
      try {
        const data = await getPerfumes();
        // Take the first 3 perfumes as featured arrivals
        setPopularPerfumes(data.slice(0, 3));
      } catch (err) {
        console.error("Failed to load featured perfumes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPopular();
  }, []);

  return (
    <main style={{ paddingBottom: "6rem" }}>
      
      {/* 1. HERO HEADER SECTION */}
      <section style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "60vh", flexWrap: "wrap", gap: "2rem", margin: "2rem 0 4rem 0" }}>
        <div style={{ flex: "1 1 500px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px" }}>
            Est. 2026 • Haute Parfumerie
          </span>
          <h1 className="text-gold-gradient" style={{ fontSize: "3.8rem", fontWeight: 700, lineHeight: "1.1", fontFamily: "serif" }}>
            Liquid Memories, <br />Artfully Bottled.
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", lineHeight: "1.7", maxWidth: "480px" }}>
            Explore decants and full bottles of the world's most exclusive fragrance collections. 
            Cleared instantly through integrated Safaricom M-Pesa STK billing.
          </p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Link href="/catalog" className="bg-luxury-gold" style={{ textDecoration: "none", padding: "0.9rem 2.2rem", borderRadius: "12px", fontWeight: 600, fontSize: "0.95rem", boxShadow: "0 4px 20px rgba(212,175,55,0.2)", display: "inline-block" }}>
              Explore Collection
            </Link>
            <Link href="/auth" className="btn-secondary" style={{ textDecoration: "none", padding: "0.9rem 2.2rem", display: "inline-block" }}>
              Create Account
            </Link>
          </div>
        </div>

        {/* Slow Float Animation Display Bottle */}
        <div style={{ flex: "1 1 350px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="glass-panel animate-float" style={{ padding: "4rem 3rem", borderRadius: "30px", border: "1px solid rgba(212, 175, 55, 0.2)", boxShadow: "0 20px 50px rgba(0,0,0,0.6)", textAlign: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: "10%", left: "10%", right: "10%", bottom: "10%", background: "radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)", zIndex: 0 }}></div>
            <span style={{ fontSize: "9rem", display: "block", position: "relative", zIndex: 1 }}>🧴</span>
            <div style={{ marginTop: "1.5rem", position: "relative", zIndex: 1 }}>
              <span style={{ color: "var(--primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "1px", fontWeight: 600 }}>Featured Fragrance</span>
              <h3 style={{ fontSize: "1.4rem", margin: "0.25rem 0", color: "#ffffff" }}>Sauvage Elixir</h3>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>By Dior</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITIONS */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", marginBottom: "5rem" }}>
        <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px", border: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: "2rem" }}>🧪</span>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "1rem 0 0.5rem 0", color: "#ffffff" }}>Premium Travel Decants</h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Try travel-friendly 10ml decants before committing to an expensive full bottle. 100% original fragrances.</p>
        </div>

        <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px", border: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: "2rem" }}>📱</span>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "1rem 0 0.5rem 0", color: "#ffffff" }}>M-Pesa STK Clearance</h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Enter your phone, receive an instant PIN pop-up on your device, and clear payments securely in seconds.</p>
        </div>

        <div className="glass-panel" style={{ padding: "2rem", borderRadius: "20px", border: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: "2rem" }}>🚚</span>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "1rem 0 0.5rem 0", color: "#ffffff" }}>Tracked Logistics</h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>All orders are logged, verified, and shipped with real-time tracking numbers directly to your doorstep.</p>
        </div>
      </section>

      {/* 3. POPULAR NEW ARRIVALS */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ fontSize: "2rem", fontWeight: 600, color: "#ffffff" }}>Curated Arrivals</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Exquisite scents handpicked for the season</p>
          </div>
          <Link href="/catalog" style={{ color: "var(--primary)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 600 }}>
            Browse Entire Catalog →
          </Link>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Loading featured arrivals...</p>
        ) : (
          <div className="catalog-grid">
            {popularPerfumes.map((perfume) => (
              <div key={perfume.id} className="glass-panel perfume-card hover-card-luxury" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <span className="perfume-brand">{perfume.brand}</span>
                  <h3 className="perfume-name" style={{ fontSize: "1.2rem", margin: "0.25rem 0 0.5rem 0" }}>{perfume.name}</h3>
                  <p className="perfume-desc" style={{ fontSize: "0.85rem", minHeight: "55px" }}>{perfume.description}</p>
                </div>
                
                <div>
                  <div className="perfume-footer" style={{ marginTop: "1rem" }}>
                    <span className="perfume-price">${perfume.price.toFixed(2)}</span>
                    <span className="stock-tag stock-ok">{perfume.stockCount} left</span>
                  </div>

                  <Link href={`/catalog/${perfume.id}`} style={{ textDecoration: "none" }}>
                    <button className="btn-primary" style={{ width: "100%", marginTop: "1.25rem" }}>
                      View Fragrance Details
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
