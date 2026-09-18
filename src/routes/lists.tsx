import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Page } from "@/components/site/Page";
import { brand, formatUsd, whatsappLink } from "@/config/brand";
import { productById } from "@/data/catalog";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/lists")({
  head: () => ({
    meta: [
      { title: `Saved shopping lists — ${brand.name}` },
      { name: "description", content: "Reuse your usual shop. Move a whole list into your basket in one tap." },
      { property: "og:title", content: `Saved shopping lists — ${brand.name}` },
      { property: "og:description", content: "Your reusable shopping lists." },
    ],
  }),
  component: Lists,
});

function Lists() {
  const { state, listToCart, addList } = useApp();
  const [name, setName] = useState("");

  return (
    <Page title="Saved lists" intro="Build a list once and reuse it every month.">
      <form
        className="mb-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addList(name.trim(), []);
          setName("");
          toast.success("List created");
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="New list name"
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-botanical px-4 py-2 text-sm font-semibold text-white">
          Create
        </button>
      </form>

      <ul className="space-y-3">
        {state.lists.map((list) => {
          const items = list.productIds.map(productById).filter(Boolean);
          const total = items.reduce((s, p) => s + (p?.price ?? 0), 0);
          return (
            <li key={list.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="type-card text-slate">{list.name}</h2>
                <span className="text-xs text-slate-muted">
                  {items.length} items · about {formatUsd(total)}
                </span>
              </div>
              {items.length ? (
                <p className="mt-1 text-sm text-slate-secondary">
                  {items.map((p) => p?.name).join(", ")}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-muted">Empty — add products from the catalogue.</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!items.length}
                  onClick={() => {
                    listToCart(list.id);
                    toast.success(`${list.name} moved to your basket`);
                  }}
                  className="rounded-md bg-coral px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Move list to basket
                </button>
                <a
                  href={whatsappLink(`My ${list.name} list: ${items.map((p) => p?.name).join(", ")}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-slate"
                >
                  Share list
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-sm text-slate-muted">
        Want us to shop a list we don't stock?{" "}
        <Link to="/shopping-list" className="text-botanical underline">Send it to us</Link>.
      </p>
    </Page>
  );
}
