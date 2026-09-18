import { MessageCircle } from "lucide-react";

import { whatsappLink } from "@/config/brand";

export function WhatsAppButton() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat to support on WhatsApp"
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-3 z-30 flex min-h-11 items-center gap-2 rounded-full bg-success px-3 py-2 text-sm font-semibold text-primary-foreground shadow-md md:bottom-4 md:right-4 md:px-4"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">WhatsApp us</span>
    </a>
  );
}
