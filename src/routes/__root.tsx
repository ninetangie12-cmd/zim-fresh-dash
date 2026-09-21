import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MobileNav } from "@/components/site/MobileNav";
import { OfflineBanner } from "@/components/site/OfflineBanner";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { Toaster } from "@/components/ui/sonner";
import { brand } from "@/config/brand";
import { AppStateProvider } from "@/lib/app-state";
import { AuthModal } from "@/components/site/AuthModal";
import { CartDrawer } from "@/components/site/CartDrawer";
import { MultiStoreCartModal } from "@/components/site/MultiStoreCartModal";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-6xl font-bold text-botanical">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-slate">Page not found</h2>
        <p className="mt-2 text-sm text-slate-muted">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover"
          >
            Start shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="type-section text-slate">This page didn't load</h1>
        <p className="mt-2 text-sm text-slate-muted">
          Something went wrong. Check your connection and try again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-hover"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-slate"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${brand.name} — ${brand.tagline}` },
      {
        name: "description",
        content: `Rapid grocery and liquor delivery in Harare. ${brand.tagline}`,
      },
      { name: "theme-color", content: brand.colours.botanical },
      { property: "og:site_name", content: brand.name },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: brand.favicon, type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <div className="flex min-h-screen flex-col bg-canvas">
          <OfflineBanner />
          <Header />
          <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
            {/* Required: nested routes render here. */}
            <Outlet />
          </main>
          <Footer />
          <MobileNav />
          <WhatsAppButton />
          <Toaster position="top-center" />
          <AuthModal />
          <CartDrawer />
          <MultiStoreCartModal />
        </div>
      </AppStateProvider>
    </QueryClientProvider>
  );
}
