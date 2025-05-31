import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [, setLocation] = useLocation();
  const [accessCode, setAccessCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: access code, 2: registration, 3: login
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeAlreadyUsed, setCodeAlreadyUsed] = useState(false);

  const validateAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.alreadyUsed) {
          setCodeAlreadyUsed(true);
          setStep(3); // Move to login step
        } else {
          setStep(2); // Move to registration step
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Invalid access code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("All fields are required");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/register-with-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode, email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        setLocation("/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        setLocation("/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Login failed");
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
{step === 1 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold cosmic-glow mb-2">Inspirt Labs</h1>
              <p className="text-gray-400">
                Enter your access code to continue
              </p>
            </div>

            <form onSubmit={validateAccessCode} className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Access Code (e.g., INSP-0001-ALFA)"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="w-full p-4 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-center font-mono text-lg tracking-wider"
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
                {isLoading ? "Verifying..." : "Validate Code"}
              </button>
            </form>

            <div className="text-center mt-6 text-sm text-gray-500">
              <p>Access codes follow the pattern: INSP-XXXX-YYYY</p>
              <p className="mt-2">Contact admin for your personal access code</p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold cosmic-glow mb-2">Create Account</h1>
              <p className="text-gray-400">
                Access code verified: <span className="text-green-400 font-mono">{accessCode}</span>
              </p>
              <button 
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-white mt-2"
              >
                ← Use different code
              </button>
            </div>

            <form onSubmit={handleRegistration} className="space-y-6">
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold cosmic-glow mb-2">Welcome Back</h1>
              <p className="text-gray-400">
                Access code <span className="text-orange-400 font-mono">{accessCode}</span> is already registered
              </p>
              <p className="text-sm text-gray-500 mt-2">Please login with your email and password</p>
              <button 
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-white mt-2"
              >
                ← Use different code
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
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
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
