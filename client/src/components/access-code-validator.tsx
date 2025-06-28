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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold cosmic-glow mb-2">Inspirt Labs</h1>
          <p className="text-gray-400">Enter your access code to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="INSP-XXXX-YYYY"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full p-4 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-center font-mono tracking-wider"
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
            disabled={isValidating}
            className="w-full primary-button px-6 py-4 rounded-lg font-semibold text-white disabled:opacity-50"
          >
            {isValidating ? "Validating..." : "Validate Code"}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-xs text-gray-500">Access codes follow the pattern: INSP-XXXX-YYYY</p>
          <p className="text-xs text-gray-500">Contact admin for your personal access code</p>
        </div>
      </div>
    </div>
  );
}