import type { ReactNode } from "react";

export function Page({
  title,
  intro,
  children,
  wide,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`mx-auto w-full px-4 py-5 md:px-6 md:py-8 ${wide ? "max-w-7xl" : "max-w-3xl"}`}>
      <h1 className="type-page text-slate">{title}</h1>
      {intro ? <p className="type-body mt-1 text-slate-secondary">{intro}</p> : null}
      <div className="mt-4 md:mt-6">{children}</div>
    </div>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-8 md:mt-12">
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <h2 className="type-section text-slate">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
