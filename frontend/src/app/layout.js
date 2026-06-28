import "./globals.css";

export const metadata = {
  title: "Scentcepts 2.0 | Premium Perfumes & M-Pesa Checkout",
  description: "Browse our curated collection of fine perfumes, place orders, and pay securely via Safaricom M-Pesa STK Push.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
