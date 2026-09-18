import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Page } from "@/components/site/Page";
import { brand } from "@/config/brand";
import { substitutionOptions, type SubstitutionPreference } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: `Your account — ${brand.name}` },
      { name: "description", content: "Manage your addresses, substitution preferences, orders and support requests." },
      { property: "og:title", content: `Your account — ${brand.name}` },
      { property: "og:description", content: "Your profile and preferences." },
    ],
  }),
  component: Account,
});

function Account() {
  const { state, setDefaultSubstitution, user, signOut } = useApp();

  return (
    <Page
      title="Your account"
      intro={
        user
          ? `Signed in as ${user.email ?? user.name ?? "your account"}. Your orders and addresses are saved here.`
          : "You're browsing as a guest. Create an account to sync across devices."
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile to="/orders" title="Orders" hint={`${state.orders.length} orders`} />
        <Tile to="/addresses" title="Saved addresses" hint={`${state.addresses.length} saved`} />
        <Tile to="/favourites" title="Favourites" hint={`${state.favourites.length} products`} />
        <Tile to="/lists" title="Shopping lists" hint={`${state.lists.length} lists`} />
        <Tile to="/problem" title="Refunds and problems" hint="Report an issue with an order" />
        <Tile to="/help" title="Help and support" hint={brand.contact.hours} />
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card p-4">
        <h2 className="type-card text-slate">Default substitution preference</h2>
        <div className="mt-3 space-y-2 text-sm">
          {substitutionOptions.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-slate-secondary">
              <input
                type="radio"
                name="defaultsub"
                checked={state.defaultSubstitution === o.id}
                onChange={() => {
                  setDefaultSubstitution(o.id as SubstitutionPreference);
                  toast.success("Preference saved");
                }}
              />
              {o.label}
            </label>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card p-4">
        {user ? (
          <>
            <h2 className="type-card text-slate">Signed in</h2>
            <p className="mt-1 text-sm text-slate-secondary">
              {user.email ?? user.name} — your orders, payments and receipts are saved to this
              account.
            </p>
            <button
              type="button"
              onClick={() => {
                void signOut().then(() => toast.success("Signed out"));
              }}
              className="mt-3 rounded-md border border-border px-4 py-2 text-sm font-semibold text-slate hover:border-botanical-mid"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <h2 className="type-card text-slate">Sign in or register</h2>
            <p className="mt-1 text-sm text-slate-secondary">
              Keep your basket, addresses and order history on every device.
            </p>
            <Link to="/auth" className="mt-3 inline-block rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover">
              Sign in or create an account
            </Link>
          </>
        )}
      </section>

      {brand.features.loyalty ? null : (
        <p className="mt-6 text-xs text-slate-muted">
          Our rewards programme is not active yet. We'll let you know when it launches.
        </p>
      )}
    </Page>
  );
}

function Tile({
  to,
  title,
  hint,
}: {
  to: "/orders" | "/addresses" | "/favourites" | "/lists" | "/problem" | "/help";
  title: string;
  hint: string;
}) {
  return (
    <Link to={to} className="rounded-lg border border-border bg-card p-4 hover:border-botanical-mid">
      <span className="block type-card text-slate">{title}</span>
      <span className="block text-xs text-slate-muted">{hint}</span>
    </Link>
  );
}
