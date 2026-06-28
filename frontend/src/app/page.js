"use client";

import { useState, useEffect } from "react";
import { getPerfumes } from "./api";
import Link from "next/link";

export default function LandingPage() {
  const [featuredPerfumes, setFeaturedPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic arrivals loading from Spring Boot backend catalog
  useEffect(() => {
    async function loadFeatured() {
      try {
        const data = await getPerfumes();
        // Capture up to 3 perfumes
        setFeaturedPerfumes(data.slice(0, 3));
      } catch (err) {
        console.error("Failed to load catalog arrivals:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1615397323282-31251f77569e?auto=format&fit=crop&q=80&w=2000"
            alt="Luxury Perfume"
            className="w-full h-full object-cover opacity-40 img-awaken"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background"></div>
        </div>

        <div className="container-wide relative z-10 text-center max-w-4xl mx-auto mt-20">
          <h1 className="text-display-xl mb-6 text-foreground">
            The Essence of Noir
          </h1>
          <p className="text-body-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Discover a curated collection of high-fashion fragrances designed to
            awaken the senses and define your signature aura.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/catalog" className="no-underline">
              <button className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto text-label-caps h-14 px-10 border-none font-bold cursor-pointer transition-colors">
                Explore Collection
              </button>
            </Link>
            <Link href="/auth" className="no-underline">
              <button className="rounded-none bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto text-label-caps h-14 px-10 font-bold cursor-pointer transition-colors">
                Join the Club
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="section-gap container-wide">
        <div className="flex justify-between items-end mb-12 border-b border-border/50 pb-6">
          <h2 className="text-headline-lg font-serif">Curated Arrivals</h2>
          <Link
            href="/catalog"
            className="text-label-caps text-primary hover:underline underline-offset-4 no-underline font-semibold"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">⏳ Loading arrivals gallery...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {featuredPerfumes.map((perfume) => (
              <Link href={`/catalog/${perfume.id}`} key={perfume.id} className="group block no-underline text-foreground">
                <div className="aspect-fashion overflow-hidden bg-muted relative mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800"
                    alt={perfume.name}
                    className="w-full h-full object-cover img-awaken group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-background/80 backdrop-blur px-3 py-1 text-label-caps border border-border/40 text-[10px]">
                    New
                  </div>
                </div>
                <h3 className="text-headline-md mb-2 group-hover:text-primary transition-colors font-serif">
                  {perfume.name}
                </h3>
                <p className="text-body-md text-muted-foreground mb-4">
                  {perfume.brand}
                </p>
                <p className="text-body-lg font-medium text-primary">${perfume.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Editorial Banner */}
      <section className="section-gap bg-muted/30 py-24 relative overflow-hidden border-y border-border/40">
        <div className="container-wide grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <h2 className="text-display-xl mb-6 font-serif">Artistry in Every Drop</h2>
            <p className="text-body-lg text-muted-foreground mb-8">
              Our master perfumers blend rare botanicals and synthetic
              innovations to create olfactory masterpieces that linger in the
              memory long after you've left the room.
            </p>
            <button className="bg-transparent rounded-none border border-foreground text-foreground hover:bg-foreground hover:text-background text-label-caps h-12 px-8 font-semibold cursor-pointer transition-colors">
              Read Our Story
            </button>
          </div>
          <div className="aspect-square relative">
            <img
              src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1000"
              alt="Perfume Ingredients"
              className="w-full h-full object-cover grayscale"
            />
            <div className="absolute inset-0 border-2 border-primary m-4 pointer-events-none"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
