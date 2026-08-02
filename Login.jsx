import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Logo } from "../components/Chrome";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#5C4033] px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <Logo size={110} color="#F2E8DE" />
        </div>
        <p className="text-xs font-mono text-sand text-center mb-8 tracking-wide">SIGN IN TO YOUR SHOP</p>
        <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-sand p-5 space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wide font-mono text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-body text-sm text-ink"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide font-mono text-muted">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border border-sand bg-paper font-body text-sm text-ink"
            />
          </div>
          {error && <p className="text-xs text-deeprust font-mono">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-mono text-xs font-semibold bg-rust text-[#1F2A24] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-[11px] font-mono text-sand text-center mt-4">
          Accounts are created for you in the Supabase dashboard — see README.
        </p>
      </div>
    </div>
  );
}
