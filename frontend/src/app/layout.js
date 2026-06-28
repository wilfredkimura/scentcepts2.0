import "./globals.css";
import Navbar from "./Navbar";
import Link from "next/link";

export const metadata = {
  title: "Scentcepts 2.0 | Premium Perfumes & M-Pesa Checkout",
  description: "Browse our curated collection of fine perfumes, place orders, and pay securely via Safaricom M-Pesa STK Push.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="glow-shape-1"></div>
          <div className="glow-shape-2"></div>

          {/* Global Header/Navbar */}
          <Navbar />

          {/* Main Content */}
          <main className="flex-1 relative z-10">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-border/40 bg-background py-12 relative z-10">
            <div className="container-wide grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-headline-md mb-4 font-serif">SCENTCEPTS</h3>
                <p className="text-body-md text-muted-foreground">
                  Modern Noir & Champagne Gold. A high-fashion, editorial-style fragrance boutique.
                </p>
              </div>
              <div>
                <h4 className="text-label-caps mb-4">Explore</h4>
                <ul className="space-y-2 text-body-md text-muted-foreground list-none p-0">
                  <li>
                    <Link href="/catalog" className="hover:text-primary transition-colors no-underline text-muted-foreground">
                      All Fragrances
                    </Link>
                  </li>
                  <li>
                    <Link href="/catalog" className="hover:text-primary transition-colors no-underline text-muted-foreground">
                      New Arrivals
                    </Link>
                  </li>
                  <li>
                    <Link href="/catalog" className="hover:text-primary transition-colors no-underline text-muted-foreground">
                      Bestsellers
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-label-caps mb-4">Client Care</h4>
                <ul className="space-y-2 text-body-md text-muted-foreground list-none p-0">
                  <li>
                    <a href="#" className="hover:text-primary transition-colors no-underline text-muted-foreground">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary transition-colors no-underline text-muted-foreground">
                      Shipping & Returns
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary transition-colors no-underline text-muted-foreground">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-label-caps mb-4">Newsletter</h4>
                <p className="text-body-md text-muted-foreground mb-4">
                  Subscribe to receive updates, access to exclusive deals, and more.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="flex-1 bg-transparent border-b border-border px-2 py-1 outline-none focus:border-primary transition-colors text-body-md text-foreground"
                  />
                  <button className="bg-transparent border-none text-primary hover:bg-primary/10 text-label-caps cursor-pointer py-1 px-4 transition-colors font-semibold">
                    SUBSCRIBE
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
