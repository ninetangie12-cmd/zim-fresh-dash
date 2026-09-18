import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Page } from "@/components/site/Page";
import { brand } from "@/config/brand";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search["mode"] === "register" ? "register" : "signin") as "signin" | "register",
  }),
  head: () => ({
    meta: [
      { title: `Sign in or register — ${brand.name}` },
      { name: "description", content: "Sign in to keep your basket, addresses and orders on every device." },
      { property: "og:title", content: `Sign in — ${brand.name}` },
      { property: "og:description", content: "Access your orders and saved addresses." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user } = useApp();
  const [mode, setMode] = useState<"signin" | "register">(search.mode || "signin");

  useEffect(() => {
    if (search.mode) {
      setMode(search.mode);
    }
  }, [search.mode]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/account" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || password.length < 6) {
      toast.error("Enter your email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim(), phone: phone.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
        toast.success("Welcome to TengaNow");
        void navigate({ to: "/account" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Signed in");
        void navigate({ to: "/account" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in didn't complete. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/account" });
  };

  if (checkEmail) {
    return (
      <Page title="Check your email" intro="One last step before your account is ready.">
        <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-5 text-sm text-slate-secondary">
          <p>
            We sent a confirmation link to <strong className="text-slate">{email}</strong>. Open it
            to activate your account, then come back and sign in.
          </p>
          <button
            type="button"
            onClick={() => {
              setCheckEmail(false);
              setMode("signin");
            }}
            className="mt-4 rounded-md bg-botanical px-4 py-2 text-sm font-semibold text-white"
          >
            Back to sign in
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={mode === "signin" ? "Sign in" : "Create an account"}
      intro="Accounts are optional — you can shop and check out as a guest."
    >
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex rounded-md border border-border bg-card p-1">
          {(["signin", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded py-2 text-sm font-semibold ${
                mode === m ? "bg-botanical text-white" : "text-slate-secondary"
              }`}
            >
              {m === "signin" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        <form className="space-y-3 rounded-lg border border-border bg-card p-4" onSubmit={submit}>
          {mode === "register" ? (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Full name"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                placeholder="Mobile number (e.g. 077 000 0000)"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              />
            </>
          ) : null}
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            placeholder="Email address"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={72}
            placeholder="Password"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-hover disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-muted">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={google}
          className="w-full rounded-md border border-border bg-card py-2.5 text-sm font-semibold text-slate hover:border-botanical-mid"
        >
          Continue with Google
        </button>

        <Link to="/stores" className="mt-4 block text-center text-sm text-botanical underline">
          Continue as a guest
        </Link>
      </div>
    </Page>
  );
}
