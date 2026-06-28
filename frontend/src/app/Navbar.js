"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(null);

  // Sync auth state from localStorage on component mount
  useEffect(() => {
    function syncAuth() {
      const savedToken = localStorage.getItem("token");
      const savedEmail = localStorage.getItem("email");
      const savedRole = localStorage.getItem("role");
      setToken(savedToken);
      setEmail(savedEmail);
      setRole(savedRole);
    }
    
    syncAuth();

    window.addEventListener("storage", syncAuth);
    window.addEventListener("local-auth-change", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("local-auth-change", syncAuth);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    setToken(null);
    setEmail("");
    setRole(null);
    
    window.dispatchEvent(new Event("local-auth-change"));
    router.push("/");
  }

  const isAdmin = role === "ROLE_ADMIN";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container-wide flex h-20 items-center justify-between">
        <Link href="/" className="text-headline-md font-bold tracking-tighter no-underline text-foreground hover:text-primary transition-colors font-serif">
          SCENTCEPTS
        </Link>
        
        <nav className="hidden md:flex gap-8">
          <Link href="/catalog" className="text-label-caps hover:text-primary transition-colors no-underline text-foreground">
            Catalog
          </Link>
          {token && !isAdmin && (
            <Link id="navbar-receipts-link" href="/receipts" className="text-label-caps hover:text-primary transition-colors no-underline text-foreground">
              Receipts
            </Link>
          )}
          {token && isAdmin && (
            <Link id="navbar-admin-link" href="/admin" className="text-label-caps hover:text-primary transition-colors no-underline text-foreground">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {token ? (
            <div className="flex items-center gap-4">
              <span className="text-body-md text-muted-foreground hidden sm:inline max-w-[150px] truncate">
                {email}
              </span>
              <button
                id="navbar-logout-btn"
                className="rounded-none border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground text-label-caps py-2 px-4 transition-colors font-semibold cursor-pointer text-xs"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              id="navbar-signin-link"
              className="rounded-none border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground text-label-caps py-2 px-4 transition-colors font-semibold cursor-pointer text-xs"
              onClick={() => router.push("/auth")}
            >
              Account
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
