"use client";

import { useState, useEffect } from "react";
import { getPerfumes } from "../api";
import Link from "next/link";

export default function CatalogPage() {
  const [perfumes, setPerfumes] = useState([]);
  const [filteredPerfumes, setFilteredPerfumes] = useState([]);
  
  // Filtering states
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Load perfumes on mount
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

  // Filter local items
  useEffect(() => {
    let result = perfumes;

    if (search.trim() !== "") {
      const query = search.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query)
      );
    }

    if (selectedBrand !== "All") {
      result = result.filter(p => p.brand === selectedBrand);
    }

    setFilteredPerfumes(result);
  }, [search, selectedBrand, perfumes]);

  // Extract unique brands list
  const brandsList = ["All", ...new Set(perfumes.map(p => p.brand))];

  return (
    <div className="container-wide py-12">
      <div className="mb-16">
        <h1 className="text-display-xl mb-6 font-serif">The Collection</h1>
        <p className="text-body-lg text-muted-foreground max-w-2xl">
          Explore our complete anthology of fine fragrances. Filter by brand or
          search for specific olfactory profiles.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 space-y-8">
          <div>
            <h3 className="text-label-caps mb-4">Search</h3>
            <input
              type="text"
              placeholder="Search fragrances..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background/50 border border-border/50 text-foreground px-4 py-3 rounded-none outline-none focus:border-primary transition-colors text-body-md h-12"
            />
          </div>

          <div>
            <h3 className="text-label-caps mb-4">Brands</h3>
            <div className="space-y-3 flex flex-col items-start">
              {brandsList.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`text-body-md transition-colors bg-transparent border-none cursor-pointer p-0 ${
                    selectedBrand === brand
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1">
          {loading && (
            <p className="text-center text-muted-foreground py-24">⏳ Loading fragrance catalog...</p>
          )}
          {errorMsg && (
            <p className="text-center text-red-500 font-medium py-24">⚠️ {errorMsg}</p>
          )}

          {!loading && !errorMsg && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
              {filteredPerfumes.map((perfume) => (
                <Link
                  href={`/catalog/${perfume.id}`}
                  key={perfume.id}
                  className="group block no-underline text-foreground"
                >
                  <div className="aspect-fashion overflow-hidden bg-muted relative mb-6">
                    <img
                      src={perfume.imageUrl || "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800"}
                      alt={perfume.name}
                      className="w-full h-full object-cover img-awaken group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="rounded-none bg-background/80 backdrop-blur text-foreground border border-border/40 text-[10px] tracking-wider uppercase font-semibold px-3 py-1">
                        {perfume.stockCount > 0 ? "Exclusive" : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-headline-md group-hover:text-primary transition-colors font-serif">
                      {perfume.name}
                    </h3>
                    <span className="text-body-lg font-medium text-primary">
                      KSH {perfume.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-body-md text-muted-foreground">
                    {perfume.brand}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {!loading && filteredPerfumes.length === 0 && (
            <div className="text-center py-24">
              <p className="text-body-lg text-muted-foreground">
                No fragrances found matching your criteria.
              </p>
              <button
                className="mt-6 rounded-none border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground text-label-caps py-3 px-6 cursor-pointer transition-colors font-semibold"
                onClick={() => {
                  setSearch("");
                  setSelectedBrand("All");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
