export function Prose({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="wrap max-w-3xl py-16 md:py-24">
      <h1 className="display-xl">{title}</h1>
      {intro && <p className="lede mt-5">{intro}</p>}
      <div className="prose-gk mt-12">{children}</div>
    </article>
  );
}
