"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-kp-background flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl font-black text-kp-primary tracking-tighter mb-2">
            AI Trainer
          </h1>
          <p className="text-kp-on-surface-variant text-xs uppercase tracking-[0.2em] font-headline">
            Kinetic Precision Lab
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-kp-surface-container-low p-8 rounded-xl space-y-6"
        >
          <div>
            <label className="text-[10px] font-headline uppercase tracking-widest text-kp-on-surface-variant block mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-kp-surface-container-lowest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40"
              placeholder="admin@kinetic.lab"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-headline uppercase tracking-widest text-kp-on-surface-variant block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-kp-surface-container-lowest rounded-lg p-3 text-sm text-kp-on-surface border-none focus:ring-1 focus:ring-kp-primary placeholder:text-kp-on-surface-variant/40"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <p className="text-kp-error text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-kp-primary to-kp-secondary text-kp-on-primary font-headline font-black text-sm uppercase tracking-widest rounded-full disabled:opacity-50 hover:shadow-[0_0_20px_rgba(221,255,177,0.3)] transition-all"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-[10px] text-kp-on-surface-variant">
            Default: admin@kinetic.lab / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
