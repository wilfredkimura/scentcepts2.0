"use client";

import { useState, useEffect } from "react";
import { getPerfumes } from "../api";
import Link from "next/link";

/**
 * CatalogPage Component.
 * Exposes full collection catalog browsing with search filters, brand filtering,
 * and card hover gold-glow effects linking to dynamic item detail pages.
 */
export default function CatalogPage() {
  const [perfumes, setPerfumes] = useState([]);
  const [filteredPerfumes, setFilteredPerfumes] = useState([]);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Retrieve full collection catalog on component mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        setErrorMsg("");
        const data = await getPerfumes();
        setPerfumes(data);
        setFilteredPerfumes(data);
      } catch (err) {
        setErrorMsg(err.message || "Failed to load perfume collection.");
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Recalculate filtrations when searchQuery or selectedBrand changes
  useEffect(() => {
    let result = perfumes;

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query)
      );
    }

    if (selectedBrand !== "ALL") {
      result = result.filter(p => p.brand === selectedBrand);
    }

    setFilteredPerfumes(result);
  }, [searchQuery, selectedBrand, perfumes]);

  // Extract unique brands list for filtration tags
  const brandsList = ["ALL", ...new Set(perfumes.map(p => p.brand))];

  return (
    <main style={{ paddingBottom: "4rem" }}>
      {/* Title */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="text-gold-gradient" style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>The Luxury Collection</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Explore premium fragrance houses and curated original decants</p>
        </div>
      </div>

      {/* Search and Brand Filter Tag panel */}
      <section className="glass-panel" style={{ padding: "1.5rem", borderRadius: "16px", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="Search perfumes or brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "0.85rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginRight: "0.25rem" }}>Brand:</span>
          {brandsList.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className="stock-tag"
              style={{
                cursor: "pointer",
                background: selectedBrand === brand ? "var(--primary)" : "rgba(255,255,255,0.03)",
                color: selectedBrand === brand ? "#0a0b0e" : "var(--text-main)",
                fontWeight: selectedBrand === brand ? 600 : 400,
                border: selectedBrand === brand ? "none" : "1px solid var(--border-color)",
                padding: "0.4rem 0.8rem",
                borderRadius: "8px"
              }}
            >
              {brand}
            </button>
          ))}
        </div>
      </section>

      {loading && <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}>⏳ Loading collection catalog...</p>}
      {errorMsg && <p className="error-message" style={{ textAlign: "center" }}>{errorMsg}</p>}

      {/* Product Display Cards Grid */}
      <section className="catalog-grid">
        {filteredPerfumes.map((perfume) => (
          <div key={perfume.id} className="glass-panel perfume-card hover-card-luxury" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span className="perfume-brand" style={{ letterSpacing: "1px", textTransform: "uppercase" }}>{perfume.brand}</span>
              <h3 className="perfume-name" style={{ fontSize: "1.3rem", margin: "0.25rem 0 0.5rem 0", color: "#ffffff" }}>{perfume.name}</h3>
              <p className="perfume-desc" style={{ minHeight: "65px", fontSize: "0.88rem", lineHeight: "1.4" }}>{perfume.description}</p>
            </div>
            
            <div>
              <div className="perfume-footer" style={{ marginTop: "1rem" }}>
                <span className="perfume-price" style={{ fontSize: "1.4rem" }}>${perfume.price.toFixed(2)}</span>
                {perfume.stockCount > 0 ? (
                  <span className="stock-tag stock-ok">{perfume.stockCount} in stock</span>
                ) : (
                  <span className="stock-tag stock-low">Sold Out</span>
                )}
              </div>

              <Link href={`/catalog/${perfume.id}`} style={{ textDecoration: "none" }}>
                <button
                  className="btn-primary"
                  style={{ width: "100%", marginTop: "1.25rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
                  disabled={perfume.stockCount === 0}
                >
                  {perfume.stockCount > 0 ? "View Fragrance Details" : "Out of Stock"}
                </button>
              </Link>
            </div>
          </div>
        ))}
      </section>

      {!loading && filteredPerfumes.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "5rem" }}>
          <span style={{ fontSize: "2rem" }}>🔍</span>
          <p style={{ marginTop: "1rem" }}>No fragrances matched your selection filters.</p>
        </div>
      )}
    </main>
  );
}
