import { createFileRoute } from "@tanstack/react-router";
import { OrderPage } from "@/routes/order.$id";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/orders/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.id} — ${brand.name}` },
      { name: "description", content: "Follow your delivery from picking to your gate." },
      { property: "og:title", content: `Order ${params.id} — ${brand.name}` },
      { property: "og:description", content: "Live order tracking." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});
