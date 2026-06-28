"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signup, signin } from "../api";

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login"); // login or register
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  
  // Feedback states
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      const savedRole = localStorage.getItem("role");
      router.push(savedRole === "ROLE_ADMIN" ? "/admin" : "/catalog");
    }
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setLoading(true);

    try {
      const data = await signin(loginEmail, loginPassword);
      
      // Save credentials in browser localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);
      
      window.dispatchEvent(new Event("local-auth-change"));
      setAuthSuccess("Successfully logged in");
      
      router.push(data.role === "ROLE_ADMIN" ? "/admin" : "/catalog");
    } catch (err) {
      setAuthError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setLoading(true);

    try {
      await signup(regEmail, regPassword);
      setAuthSuccess("Account created successfully! You can now login.");
      setActiveTab("login");
      
      // Seed fields
      setLoginEmail(regEmail);
      setRegEmail("");
      setRegPassword("");
      setRegName("");
    } catch (err) {
      setAuthError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-wide flex items-center justify-center min-h-[calc(100vh-80px)] py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-display-xl text-primary mb-4 font-serif">Welcome</h1>
          <p className="text-body-lg text-muted-foreground">
            Enter the world of Scentcepts
          </p>
        </div>

        {/* Tab List */}
        <div className="grid w-full grid-cols-2 rounded-none bg-muted p-1 mb-8">
          <button
            id="tab-signin"
            className={`py-3 text-label-caps cursor-pointer border-none font-semibold transition-colors rounded-none ${
              activeTab === "login"
                ? "bg-background text-primary"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              setActiveTab("login");
              setAuthError("");
              setAuthSuccess("");
            }}
          >
            Login
          </button>
          <button
            id="tab-signup"
            className={`py-3 text-label-caps cursor-pointer border-none font-semibold transition-colors rounded-none ${
              activeTab === "register"
                ? "bg-background text-primary"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              setActiveTab("register");
              setAuthError("");
              setAuthSuccess("");
            }}
          >
            Register
          </button>
        </div>

        {activeTab === "login" ? (
          <div className="border border-border/50 bg-card/50 backdrop-blur p-6 relative">
            <div className="mb-6">
              <h3 className="text-headline-md text-foreground font-serif">Sign In</h3>
              <p className="text-body-md text-muted-foreground mt-1">
                Access your curated collection and order history.
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wider text-muted-foreground uppercase block" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-background/50 border border-border/50 text-foreground px-4 py-3 rounded-none outline-none focus:border-primary transition-colors text-body-md h-12"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold tracking-wider text-muted-foreground uppercase block" htmlFor="password">Password</label>
                  <a href="#" className="text-xs text-primary hover:underline no-underline">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border/50 text-foreground px-4 py-3 rounded-none outline-none focus:border-primary transition-colors text-body-md h-12"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-label-caps border-none cursor-pointer font-bold transition-colors"
              >
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </form>
          </div>
        ) : (
          <div className="border border-border/50 bg-card/50 backdrop-blur p-6 relative">
            <div className="mb-6">
              <h3 className="text-headline-md text-foreground font-serif">Create Account</h3>
              <p className="text-body-md text-muted-foreground mt-1">
                Join Scentcepts for exclusive access to new arrivals.
              </p>
            </div>
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wider text-muted-foreground uppercase block" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  placeholder="John Doe"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-background/50 border border-border/50 text-foreground px-4 py-3 rounded-none outline-none focus:border-primary transition-colors text-body-md h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wider text-muted-foreground uppercase block" htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="client@example.com"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-background/50 border border-border/50 text-foreground px-4 py-3 rounded-none outline-none focus:border-primary transition-colors text-body-md h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wider text-muted-foreground uppercase block" htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border/50 text-foreground px-4 py-3 rounded-none outline-none focus:border-primary transition-colors text-body-md h-12"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-none border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground h-12 text-label-caps cursor-pointer font-bold transition-colors"
              >
                {loading ? "Registering..." : "Create Account"}
              </button>
            </form>
          </div>
        )}

        {authError && <p className="text-red-500 text-sm mt-4 text-center font-medium" id="auth-err-msg">⚠️ {authError}</p>}
        {authSuccess && <p className="text-green-500 text-sm mt-4 text-center font-medium" id="auth-success-msg">✓ {authSuccess}</p>}
      </div>
    </div>
  );
}
