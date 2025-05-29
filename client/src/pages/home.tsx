import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const endpoint = isSignIn ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        setLocation("/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold cosmic-glow mb-2">Inspirt Labs</h1>
          <p className="text-gray-400">
            {isSignIn ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full primary-button px-6 py-4 rounded-lg font-semibold text-white disabled:opacity-50"
          >
            {isLoading ? "Please wait..." : isSignIn ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsSignIn(!isSignIn)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isSignIn ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
