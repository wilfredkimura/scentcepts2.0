"use client";

import { useState, useEffect, use } from "react";
import { getPerfumeById, checkout, getOrderStatus, mockPayOrder } from "../../api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const perfumeId = unwrappedParams.id;

  // Authentication status
  const [token, setToken] = useState(null);
  
  // Data states
  const [perfume, setPerfume] = useState(null);
  const [size, setSize] = useState("FULL"); // FULL (100ml) or DECANT (10ml)
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("2547");

  // WhatsApp form states
  const [paymentMethod, setPaymentMethod] = useState("mpesa"); // mpesa or whatsapp
  const [waName, setWaName] = useState("");
  const [waAddress, setWaAddress] = useState("");
  const [waNotes, setWaNotes] = useState("");

  // Control states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle, processing, success, failed

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
    if (orderId && paymentStatus === "processing") {
      intervalId = setInterval(async () => {
        try {
          const statusDetails = await getOrderStatus(orderId);
          if (statusDetails.status === "COMPLETED") {
            setPaymentStatus("success");
            clearInterval(intervalId);
            // Refresh details
            const refreshed = await getPerfumeById(perfumeId);
            setPerfume(refreshed);
          } else if (statusDetails.status === "FAILED") {
            setPaymentStatus("failed");
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

  // Pricing calculations
  const getUnitPrice = () => {
    if (!perfume) return 0;
    return size === "FULL" ? perfume.price : perfume.price * 0.15;
  };

  const unitPrice = getUnitPrice();
  const totalPriceKES = unitPrice * quantity;

  // Submit payment order
  async function handleOrderSubmit(e) {
    e.preventDefault();
    setCheckoutError("");
    setPaymentStatus("processing");

    if (!/^254(7|1)\d{8}$/.test(phone)) {
      setCheckoutError("Provide a valid phone starting with 254 (e.g. 254712345678)");
      setPaymentStatus("idle");
      return;
    }

    if (quantity > perfume.stockCount) {
      setCheckoutError("Requested quantity exceeds available stock.");
      setPaymentStatus("idle");
      return;
    }

    try {
      const response = await checkout(
        phone,
        totalPriceKES,
        perfume.id,
        quantity
      );
      setOrderId(response.orderId);

      // Trigger asynchronous mock payment completion simulator after 1.5 seconds
      setTimeout(async () => {
        try {
          await mockPayOrder(response.orderId);
          console.log("Mock payment triggered for order: " + response.orderId);
        } catch (mockErr) {
          console.error("Mock payment failed to register:", mockErr);
        }
      }, 1500);

    } catch (err) {
      setCheckoutError(err.message || "Checkout submission failed.");
      setPaymentStatus("idle");
    }
  }

  // Forward order details to official Scentcepts WhatsApp portal
  function handleWhatsAppSubmit(e) {
    e.preventDefault();
    if (!waName || !waAddress) {
      alert("Please provide a name and delivery address.");
      return;
    }

    const message = `⚜️ *SCENTCEPTS MAISON ORDER* ⚜️\n\n` +
      `*Product*: ${perfume.name} (${perfume.brand})\n` +
      `*Size*: ${size === "FULL" ? "100ml Bottle" : "10ml Decant"}\n` +
      `*Quantity*: ${quantity}\n` +
      `*Total Price*: KSH ${totalPriceKES.toLocaleString()}\n\n` +
      `── *Delivery Information* ──\n` +
      `*Customer Name*: ${waName}\n` +
      `*Delivery Address*: ${waAddress}\n` +
      `*Phone Number*: ${phone}\n` +
      `*Special Notes*: ${waNotes || "None"}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/254716052342?text=${encodedMessage}`;
    
    // Open in separate browser window/tab
    window.open(whatsappUrl, "_blank");
    resetPaymentTracking();
  }

  function resetPaymentTracking() {
    setOrderId(null);
    setPaymentStatus("idle");
    setCheckoutError("");
    setQuantity(1);
    setPaymentMethod("mpesa");
    setWaName("");
    setWaAddress("");
    setWaNotes("");
  }

  if (loading) {
    return <p className="text-center text-muted-foreground py-24">⏳ Loading fragrance profile...</p>;
  }

  if (errorMsg || !perfume) {
    return (
      <div className="text-center py-24">
        <p className="text-red-500 font-medium">{errorMsg || "Fragrance not found."}</p>
        <Link href="/catalog" className="no-underline">
          <button className="mt-8 rounded-none border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background text-label-caps py-3 px-6 cursor-pointer transition-colors font-semibold">
            Return to Catalog
          </button>
        </Link>
      </div>
    );
  }

  // Olfactory notes matching details page layout
  const getNotes = () => {
    const brand = perfume.brand.toUpperCase();
    if (brand.includes("CHANEL")) {
      return {
        top: "Aldehydes, Ylang-Ylang, Neroli",
        heart: "Iris, Jasmine, Rose",
        base: "Sandalwood, Amber, Patchouli"
      };
    } else if (brand.includes("DIOR")) {
      return {
        top: "Calabrian Bergamot, Sichuan Pepper",
        heart: "Lavender, Pink Pepper, Patchouli",
        base: "Ambroxan, Cedar, Labdanum"
      };
    }
    return {
      top: "Bergamot, Citrus, Fresh Spices",
      heart: "White Florals, Lavender, Resins",
      base: "Sandalwood, Warm Musk, Amberwood"
    };
  };

  const notes = getNotes();

  return (
    <div className="container-wide py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-fashion overflow-hidden bg-muted">
            <img
              src={perfume.imageUrl || "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1200"}
              alt={perfume.name}
              className="w-full h-full object-cover img-awaken"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-center">
          <div className="mb-8 border-b border-border/50 pb-8">
            <h1 className="text-display-xl mb-4 font-serif">{perfume.name}</h1>
            <p className="text-body-lg text-muted-foreground mb-6">
              {perfume.brand} Exclusive
            </p>
            <p className="text-headline-lg font-medium text-primary">KSH {unitPrice.toLocaleString()}</p>
          </div>

          <div className="mb-8">
            <p className="text-body-lg mb-6 leading-relaxed text-muted-foreground">
              {perfume.description}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div>
                <h4 className="text-label-caps text-muted-foreground mb-2">
                  Top Notes
                </h4>
                <p className="text-body-md text-foreground">{notes.top}</p>
              </div>
              <div>
                <h4 className="text-label-caps text-muted-foreground mb-2">
                  Heart Notes
                </h4>
                <p className="text-body-md text-foreground">{notes.heart}</p>
              </div>
              <div>
                <h4 className="text-label-caps text-muted-foreground mb-2">
                  Base Notes
                </h4>
                <p className="text-body-md text-foreground">{notes.base}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <h4 className="text-label-caps mb-4">Select Size</h4>
              <div className="flex gap-4">
                <button
                  onClick={() => setSize("FULL")}
                  className={`flex-1 py-4 border cursor-pointer font-semibold transition-colors rounded-none text-label-caps ${
                    size === "FULL"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground bg-transparent"
                  }`}
                >
                  100ml Full Bottle
                </button>
                <button
                  onClick={() => setSize("DECANT")}
                  className={`flex-1 py-4 border cursor-pointer font-semibold transition-colors rounded-none text-label-caps ${
                    size === "DECANT"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground bg-transparent"
                  }`}
                >
                  10ml Decant
                </button>
              </div>
            </div>
          </div>

          {/* Checkout triggers */}
          {token ? (
            <div>
              <button
                onClick={() => setPaymentStatus("checkout-form")}
                disabled={perfume.stockCount === 0}
                className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-label-caps border-none cursor-pointer font-bold transition-colors"
              >
                {perfume.stockCount > 0 ? "Purchase Now" : "Out of Stock"}
              </button>
            </div>
          ) : (
            <div className="p-6 bg-muted/20 border border-dashed border-border/50 text-center rounded-none">
              <p className="text-body-md text-muted-foreground mb-4">You must sign in to place checkout orders.</p>
              <Link href="/auth" className="no-underline">
                <button className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 border-none cursor-pointer font-bold transition-colors text-label-caps">
                  Sign In to Purchase
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* --- PAYMENT POPUP MODAL --- */}
      {paymentStatus !== "idle" && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="border border-border/50 bg-card/95 backdrop-blur-xl p-8 max-w-md w-full relative">
            
            {paymentStatus === "checkout-form" && (
              <div>
                <div className="mb-6 flex justify-between items-center border-b border-border/30 pb-4">
                  <h3 className="text-headline-md font-serif text-foreground">Checkout Portal</h3>
                  <button className="bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer text-lg font-bold" onClick={resetPaymentTracking}>✕</button>
                </div>

                {/* Tab switcher */}
                <div className="flex border-b border-border/40 mb-6">
                  <button
                    onClick={() => setPaymentMethod("mpesa")}
                    className={`flex-1 pb-3 text-xs uppercase font-bold tracking-wider cursor-pointer border-b-2 bg-transparent transition-colors ${
                      paymentMethod === "mpesa"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Lipa Na M-Pesa
                  </button>
                  <button
                    onClick={() => setPaymentMethod("whatsapp")}
                    className={`flex-1 pb-3 text-xs uppercase font-bold tracking-wider cursor-pointer border-b-2 bg-transparent transition-colors ${
                      paymentMethod === "whatsapp"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    WhatsApp Order
                  </button>
                </div>

                <p className="text-body-md text-muted-foreground mb-6">
                  Order: <strong className="text-foreground">{quantity}x {perfume.name}</strong> ({size === "FULL" ? "100ml Bottle" : "10ml Decant"}) — <strong className="text-primary">KSH {totalPriceKES.toLocaleString()}</strong>
                </p>

                {paymentMethod === "mpesa" ? (
                  <form onSubmit={handleOrderSubmit} className="space-y-6">
                    <div className="space-y-2 flex gap-4">
                      <div className="w-1/3">
                        <label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          max={perfume.stockCount}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                        />
                      </div>
                      <div className="w-2/3">
                        <label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">M-Pesa Phone Number</label>
                        <input
                          type="tel"
                          placeholder="254700000000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Enter Safaricom number format: 2547...
                    </p>

                    <button
                      type="submit"
                      className="w-full rounded-none bg-[#4CAF50] hover:bg-[#45a049] text-white h-12 text-label-caps border-none cursor-pointer font-bold transition-colors uppercase tracking-wider text-xs"
                    >
                      Pay via M-Pesa
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold uppercase text-muted-foreground block">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          max={perfume.stockCount}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold uppercase text-muted-foreground block">Customer Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Wilfred Kimura"
                          value={waName}
                          onChange={(e) => setWaName(e.target.value)}
                          className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground block">Contact Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 254712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground block">Delivery Address / Location</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nairobi CBD, Junction Mall"
                        value={waAddress}
                        onChange={(e) => setWaAddress(e.target.value)}
                        className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground block">Special Delivery Instructions</label>
                      <textarea
                        rows="2"
                        placeholder="e.g. Deliver between 2 PM and 5 PM"
                        value={waNotes}
                        onChange={(e) => setWaNotes(e.target.value)}
                        className="w-full bg-background border border-border/50 text-foreground px-3 py-2 rounded-none outline-none focus:border-primary text-body-md"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-none bg-[#25D366] hover:bg-[#20ba56] text-white h-12 text-label-caps border-none cursor-pointer font-bold transition-colors uppercase tracking-wider text-xs"
                    >
                      Send Order to WhatsApp
                    </button>
                  </form>
                )}
                {checkoutError && <p className="text-red-500 text-xs mt-3">⚠️ {checkoutError}</p>}
              </div>
            )}

            {paymentStatus === "processing" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h3 className="text-headline-md font-serif text-foreground">Processing Payment</h3>
                <p className="text-body-md text-muted-foreground">
                  Simulating Lipa Na M-Pesa transaction. Please check your phone for the STK prompt...
                </p>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                  ✓
                </div>
                <h3 className="text-headline-md text-primary font-serif">Payment Successful</h3>
                <p className="text-body-md text-muted-foreground">
                  Your order has been verified successfully. You can view your invoice receipt under the <Link href="/receipts" className="text-primary hover:underline font-semibold">Receipts</Link> tab.
                </p>
                <button
                  className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 border-none cursor-pointer font-bold transition-colors mt-4 text-xs tracking-wider"
                  onClick={resetPaymentTracking}
                >
                  Done
                </button>
              </div>
            )}

            {paymentStatus === "failed" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                  ✕
                </div>
                <h3 className="text-headline-md text-red-500 font-serif">Payment Failed</h3>
                <p className="text-body-md text-muted-foreground">
                  The STK push request failed or was rejected.
                </p>
                <button
                  className="rounded-none bg-transparent border border-border text-foreground hover:bg-muted/10 h-10 px-8 cursor-pointer font-bold transition-colors mt-4 text-xs tracking-wider"
                  onClick={resetPaymentTracking}
                >
                  Close
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
