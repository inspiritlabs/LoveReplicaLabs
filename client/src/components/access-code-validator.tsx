import { useState } from "react";

interface AccessCodeValidatorProps {
  onValidCode: (code: string) => void;
}

export default function AccessCodeValidator({ onValidCode }: AccessCodeValidatorProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const validateCode = async () => {
    if (!code.trim()) {
      setError("Please enter an access code");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      const response = await fetch("/api/auth/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (response.ok) {
        onValidCode(code.trim());
      } else {
        setError("Invalid access code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCode();
  };

  return (
    <div className="vision-pro-bg min-h-screen flex items-center justify-center px-4 text-white text-center overflow-hidden">
      <div className="w-full max-w-md space-y-8">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-3">
            Inspirit Labs
          </h1>
          <p className="text-lg text-gray-300">Enter your access code to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="INSP-XXXX-XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="translucent-input w-full px-5 py-4 rounded-xl text-white text-base placeholder-gray-400 text-center font-mono tracking-wider"
            required
          />

          {error && (
            <div className="translucent-input border-red-500/50 bg-red-500/20 rounded-xl p-4 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isValidating}
            className="translucent-button w-full text-white font-semibold py-4 px-4 rounded-xl text-lg focus:outline-none focus:ring-4 focus:ring-gray-400 focus:ring-opacity-50 disabled:opacity-50"
          >
            {isValidating ? "Validating..." : "Validate Code"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-sm">
          <p className="link-style text-xs">
            Access codes follow the pattern: INSP-XXXX-XXXX-XXXX
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