import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [typedText, setTypedText] = useState("");

  // Typing animation effect
  useEffect(() => {
    const textToType = isSignIn ? "Welcome back" : "Create your account";
    let charIndex = 0;
    setTypedText("");

    const typeEffect = () => {
      if (charIndex < textToType.length) {
        setTypedText(textToType.slice(0, charIndex + 1));
        charIndex++;
        setTimeout(typeEffect, 120);
      }
    };

    const timer = setTimeout(typeEffect, 500);
    return () => clearTimeout(timer);
  }, [isSignIn]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (!isSignIn && !accessCode.trim()) {
      setError("Access code is required for registration");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const endpoint = isSignIn ? "/api/auth/login" : "/api/auth/register";
      const body = isSignIn
        ? { email, password }
        : { email, password, accessCode };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
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
    <div className="vision-pro-bg min-h-screen flex items-center justify-center px-4 text-white text-center overflow-hidden">
      <div className="w-full max-w-md space-y-8">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-3">
            Inspirit Labs
          </h1>
          <p 
            className="text-lg text-gray-300 mx-auto w-max typing-text"
            style={{
              borderRight: typedText.length > 0 && typedText.length < (isSignIn ? "Welcome back" : "Create your account").length 
                ? '.15em solid rgba(255, 255, 255, 0.7)' 
                : 'none'
            }}
          >
            {typedText}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="translucent-input w-full px-5 py-4 rounded-xl text-white text-base placeholder-gray-400"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="translucent-input w-full px-5 py-4 rounded-xl text-white text-base placeholder-gray-400"
            required
          />

          {!isSignIn && (
            <input
              type="text"
              placeholder="Access Code (INSP-XXXX-XXXX-XXXX)"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="translucent-input w-full px-5 py-4 rounded-xl text-white text-base placeholder-gray-400"
              required
            />
          )}

          {error && (
            <div className="translucent-input border-red-500/50 bg-red-500/20 rounded-xl p-4 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="translucent-button w-full text-white font-semibold py-4 px-4 rounded-xl text-lg focus:outline-none focus:ring-4 focus:ring-gray-400 focus:ring-opacity-50 disabled:opacity-50"
          >
            {isLoading
              ? "Please wait..."
              : isSignIn
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-sm">
          <p className="link-style">
            {isSignIn ? "Need an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsSignIn(!isSignIn)}
              className="font-semibold text-white hover:underline"
            >
              {isSignIn ? "Sign up" : "Sign in"}
            </button>
          </p>
          <p className="link-style text-xs">
            Need help?{" "}
            <a href="mailto:inspiritlabs@gmail.com" className="hover:underline">
              Contact us at inspiritlabs@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}