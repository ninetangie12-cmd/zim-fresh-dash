import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Wordmark } from "@/components/site/Wordmark";
import { DISCLAIMER, brand } from "@/config/brand";

export function Footer() {
  // Track open state for each accordion section on mobile (collapsed by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sections = [
    {
      id: "company",
      title: "Company",
      content: (
        <div className="space-y-3 text-sm text-white/[0.78]">
          <p>{brand.tagline}</p>
          <p className="text-xs leading-relaxed text-white/[0.78]">
            {brand.contact.address}
            <br />
            {brand.contact.hours}
          </p>
        </div>
      ),
    },
    {
      id: "shop",
      title: "Shop",
      content: (
        <ul className="space-y-2 text-sm">
          <li>
            <Link to="/stores" className="transition-colors hover:text-white">
              Stores
            </Link>
          </li>
          <li>
            <Link to="/shopping-list" className="transition-colors hover:text-white">
              Send your shopping list
            </Link>
          </li>
          <li>
            <Link to="/lists" className="transition-colors hover:text-white">
              Saved lists
            </Link>
          </li>
          <li>
            <Link to="/favourites" className="transition-colors hover:text-white">
              Favourites
            </Link>
          </li>
          <li>
            <Link to="/liquor" className="transition-colors hover:text-white">
              Liquor (18+)
            </Link>
          </li>
        </ul>
      ),
    },
    {
      id: "help",
      title: "Help",
      content: (
        <ul className="space-y-2 text-sm">
          <li>
            <Link to="/help" className="transition-colors hover:text-white">
              Help and support
            </Link>
          </li>
          <li>
            <Link to="/problem" className="transition-colors hover:text-white">
              Report a problem
            </Link>
          </li>
          <li>
            <Link to="/orders" className="transition-colors hover:text-white">
              My orders
            </Link>
          </li>
          <li>
            <Link to="/terms" className="transition-colors hover:text-white">
              Terms and conditions
            </Link>
          </li>
          <li>
            <Link to="/privacy" className="transition-colors hover:text-white">
              Privacy policy
            </Link>
          </li>
          <li>
            <Link to="/disclaimer" className="transition-colors hover:text-white">
              Independent service
            </Link>
          </li>
        </ul>
      ),
    },
    {
      id: "contact",
      title: "Contact",
      content: (
        <div className="space-y-3 text-sm">
          <ul className="space-y-2">
            <li>
              <a href={`tel:${brand.contact.phone}`} className="transition-colors hover:text-white">
                {brand.contact.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${brand.contact.supportEmail}`}
                className="transition-colors hover:text-white"
              >
                {brand.contact.supportEmail}
              </a>
            </li>
          </ul>
          <div className="flex gap-3 pt-1 text-sm">
            <a
              href={brand.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Facebook
            </a>
            <a
              href={brand.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Instagram
            </a>
            <a
              href={brand.social.x}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              X
            </a>
          </div>
        </div>
      ),
    },
  ];

  return (
    <footer className="mt-12 border-t border-border bg-slate text-white/[0.78]">
      {/* Top Bar: Brand & Social Links (Always visible) */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Wordmark tone="light" />

          {/* Social Icons always visible */}
          <div className="flex items-center gap-1.5 text-white/70">
            <a
              href={brand.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <a
              href={brand.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <a
              href={brand.social.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Sections: Individual Accordions on Mobile, Neat Columns on Desktop */}
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 md:py-10">
        <div className="divide-y divide-white/10 md:divide-y-0 md:grid md:grid-cols-4 md:gap-8">
          {sections.map((section) => {
            const isOpen = !!openSections[section.id];

            return (
              <div key={section.id} className="py-1 md:py-0">
                {/* Heading / Accordion Button */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  aria-controls={`footer-accordion-${section.id}`}
                  className="flex w-full items-center justify-between py-3 text-left transition-colors hover:text-white cursor-pointer md:cursor-default md:py-0 md:hover:text-inherit"
                >
                  <h3 className="type-label text-white">{section.title}</h3>
                  <ChevronDown
                    className={`size-4 text-white/50 transition-transform duration-300 ease-out md:hidden ${
                      isOpen ? "rotate-180 text-white" : "rotate-0"
                    }`}
                    aria-hidden
                  />
                </button>

                {/* Sub-links Drawer: Collapsible on mobile, open on desktop */}
                <div
                  id={`footer-accordion-${section.id}`}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out md:!grid-rows-[1fr] md:!opacity-100 ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="pt-2 pb-4 md:pt-3 md:pb-0">
                      {section.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Bar: Disclaimer & Copyright (Always visible at all times) */}
      <div className="border-t border-white/10 bg-slate/80">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-6">
          <div className="flex items-start gap-2 pr-14 sm:pr-0">
            <Info className="mt-0.5 size-3.5 shrink-0 text-white/40" aria-hidden />
            <p className="text-xs leading-relaxed text-white/55">{DISCLAIMER}</p>
          </div>
          <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {brand.legalEntity}</p>
            <p className="text-white/35">{brand.name} is a temporary working name</p>
          </div>
        </div>
      </div>
    </footer>
  );
}


