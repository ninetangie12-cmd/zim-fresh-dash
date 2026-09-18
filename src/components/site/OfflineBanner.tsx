import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="sticky top-0 z-50 flex min-h-11 items-center justify-center gap-2 bg-warning-bg px-4 py-2 text-sm font-semibold text-warning">
      <WifiOff className="size-4" />
      You’re offline. Your basket is saved; reconnect to place an order.
    </div>
  );
}