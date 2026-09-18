import { Link } from "@tanstack/react-router";

import { categories } from "@/data/catalog";

export function CategoryRail({ active }: { active?: string }) {
  return (
    <nav aria-label="Product categories" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {categories.map((category) => (
        <Link
          key={category.slug}
          to="/category/$slug"
          params={{ slug: category.slug }}
          aria-current={active === category.slug ? "page" : undefined}
          className={`flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            active === category.slug
              ? "border-botanical bg-botanical text-primary-foreground"
              : "border-border bg-card text-slate-secondary hover:border-botanical-mid"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}