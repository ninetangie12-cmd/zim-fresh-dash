import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { storeById } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/requests")({
  head: () => ({ meta: [
    { title: "Shopping-list requests — TengaNow operations" },
    { name: "description", content: "Review and progress customer shopping-list requests." },
    { property: "og:title", content: "Shopping-list requests — TengaNow operations" },
    { property: "og:description", content: "Review and progress customer shopping-list requests." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: RequestsPage,
});

type ListRequest = {
  id: string;
  body: string | null;
  preference: string | null;
  instructions: string | null;
  status: string;
  created_at: string;
};

async function listRequests(): Promise<ListRequest[]> {
  const { data, error } = await supabase
    .from("shopping_list_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as ListRequest[];
}

const statuses = ["Received", "Pricing", "Quote sent", "Converted to order", "Closed"];

function RequestsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "requests"], queryFn: listRequests });

  const update = useMutation({
    mutationFn: async (input: { id: string; status: string }) => {
      const { error } = await supabase
        .from("shopping_list_requests")
        .update({ status: input.status })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request updated");
      void qc.invalidateQueries({ queryKey: ["admin", "requests"] });
    },
    onError: () => toast.error("We couldn't update that request."),
  });

  if (isLoading) return <p className="text-sm text-slate-secondary">Loading shopping lists…</p>;
  const requests = data ?? [];

  if (requests.length === 0)
    return (
      <p className="text-sm text-slate-muted">
        No shopping lists have been sent in yet. They appear here as soon as a customer submits one.
      </p>
    );

  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <li key={r.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-muted">
              {new Date(r.created_at).toLocaleString()}
            </span>
            <select
              value={r.status}
              onChange={(e) => update.mutate({ id: r.id, status: e.target.value })}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
            >
              {[...new Set([r.status, ...statuses])].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {r.body ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-secondary">{r.body}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-muted">Photo list — open the customer's upload.</p>
          )}
          <p className="mt-2 text-xs text-slate-muted">
            Preference: {r.preference ? (storeById(r.preference)?.name ?? r.preference) : "Any"}
            {r.instructions ? ` · ${r.instructions}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
