import { createFileRoute } from "@tanstack/react-router";

import { IndependentNotice } from "@/components/site/Disclaimer";
import { Page } from "@/components/site/Page";
import { StoreCatalog } from "@/components/site/StoreCatalog";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: `Stores & Merchants — ${brand.name}` },
      {
        name: "description",
        content:
          "Browse local supermarkets, farm fresh produce, butcheries, liquor suppliers, pharmacies, and bakeries delivering across Harare.",
      },
      { property: "og:title", content: `Stores & Merchants — ${brand.name}` },
      { property: "og:description", content: "Fast on-demand delivery from your favorite Harare stores." },
    ],
  }),
  component: Stores,
});

function Stores() {
  return (
    <Page
      title="Stores & Merchants"
      intro="Order from leading supermarkets, fresh butcheries, farm grocers, pharmacies, and bakeries in Harare."
      wide
    >
      <IndependentNotice className="mb-4" />
      <StoreCatalog showTitle={false} />
    </Page>
  );
}
