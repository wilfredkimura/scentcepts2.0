"use client";

import { useState, useEffect } from "react";
import { getMyReceipts } from "../api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }

    async function loadReceipts() {
      try {
        const data = await getMyReceipts();
        setReceipts(data);
      } catch (err) {
        console.error("Receipts error:", err);
        setErrorMsg(err.message || "Failed to retrieve transaction receipts.");
      } finally {
        setLoading(false);
      }
    }

    loadReceipts();
  }, [router]);

  return (
    <div className="container-wide py-16 min-h-[60vh] flex flex-col justify-center">
      <div className="mb-12 border-b border-border/40 pb-6">
        <h1 className="text-display-xl font-serif text-foreground mb-2">Your Receipts</h1>
        <p className="text-body-lg text-muted-foreground">
          View past completed purchases and transaction invoices.
        </p>
      </div>

      {loading && (
        <p className="text-center text-muted-foreground py-12">⏳ Loading invoices...</p>
      )}

      {errorMsg && (
        <div className="text-center py-12">
          <p className="text-red-500 font-medium mb-6">⚠️ {errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-none border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background text-label-caps py-2.5 px-6 cursor-pointer transition-colors text-xs font-bold"
          >
            Retry Loading
          </button>
        </div>
      )}

      {!loading && !errorMsg && receipts.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border/50 max-w-lg mx-auto w-full p-8 bg-card/20">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground text-2xl font-serif">
            🧾
          </div>
          <h3 className="text-headline-md font-serif text-foreground mb-3">No Receipts Found</h3>
          <p className="text-body-md text-muted-foreground mb-8 leading-relaxed">
            You do not have any completed transaction receipts yet. Explore our exclusive fragrance catalog and place your first order.
          </p>
          <Link href="/catalog" className="no-underline">
            <button className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 border-none cursor-pointer font-bold transition-colors text-label-caps tracking-wider text-xs">
              Browse Catalog
            </button>
          </Link>
        </div>
      )}

      {!loading && !errorMsg && receipts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="border border-border/50 bg-card p-8 relative flex flex-col justify-between hover:border-primary/50 transition-all hover:translate-y-[-2px] duration-300"
            >
              {/* Receipt Header Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary"></div>
              
              <div>
                <div className="flex justify-between items-start mb-6 border-b border-border/30 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Receipt ID</span>
                    <span className="text-xs text-foreground font-mono truncate max-w-[150px] block">#{receipt.id.slice(0, 8)}...</span>
                  </div>
                  <span className="px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider rounded-none bg-green-500/10 text-green-500 border border-green-500/20">
                    Paid
                  </span>
                </div>

                <div className="flex gap-4 mb-6">
                  {receipt.perfumeImageUrl ? (
                    <img
                      src={receipt.perfumeImageUrl}
                      alt={receipt.perfumeName}
                      className="w-16 h-20 object-cover border border-border/40"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-muted flex items-center justify-center border border-border/40 text-xs text-muted-foreground font-serif">
                      🧴
                    </div>
                  )}
                  <div>
                    <h4 className="text-headline-sm font-serif text-foreground leading-tight mb-1">{receipt.perfumeName}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{receipt.perfumeBrand}</p>
                    <span className="text-[11px] text-muted-foreground block">
                      Quantity: <strong className="text-foreground">{receipt.quantity}</strong>
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-dashed border-border/30 pt-4 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>M-Pesa Sender</span>
                    <span className="text-foreground font-mono">{receipt.phone}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>M-Pesa Method</span>
                    <span className="text-foreground uppercase tracking-wide">Lipa Na M-Pesa</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40 pt-4 mt-6 flex justify-between items-baseline">
                <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Amount Paid</span>
                <span className="text-headline-md font-serif text-primary font-bold">
                  KSH {parseFloat(receipt.amount).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
