/** "Why £17.99 and not £300" — a simple side-by-side, set like a price list. */
const ROWS: [string, string, string][] = [
  ["Bottle size", "Usually 50–100 ml", "100 ml, always"],
  ["Strength", "Eau de parfum, 15–20% oil", "Extrait, 40% oil"],
  ["Lasts on skin", "6–10 hours", "12+ hours"],
  ["Made in", "France, Italy, USA", "Manufactured in the UK"],
  ["Vegan friendly", "Not always", "Yes"],
  ["Price for 100 ml", "£85 – £380", "£16.99 – £17.99"],
];

export function Ledger() {
  return (
    <section className="wrap py-24 md:py-32" aria-labelledby="ledger-title">
      <div className="grid gap-12 md:grid-cols-[.8fr_1.2fr] md:items-center">
        <div>
          <h2 id="ledger-title" className="display-l max-w-[12ch]">Why it costs £17.99, not £300</h2>
          <p className="lede mt-5">
            Designer prices pay for advertising, celebrity faces and department-store rent. Ours pay for the oil in the bottle —
            extrait strength that lasts 12 to 24 hours.
          </p>
        </div>
        <div className="overflow-hidden rounded-[var(--radius-m)] border border-[var(--line)]">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Designer perfume compared with GK Parfum</caption>
            <thead>
              <tr className="bg-ebony">
                <th scope="col" className="w-[34%] px-5 py-4 font-normal text-smoke"><span className="sr-only">Feature</span></th>
                <th scope="col" className="px-5 py-4 font-normal text-smoke">Designer bottle</th>
                <th scope="col" className="px-5 py-4 font-display text-[1.3rem] font-medium text-champagne">GK Parfum</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([k, a, b], i) => (
                <tr key={k} className={i % 2 ? "bg-ebony/40" : ""}>
                  <th scope="row" className="border-t border-[var(--line-soft)] px-5 py-4 font-normal text-smoke">{k}</th>
                  <td className="border-t border-[var(--line-soft)] px-5 py-4 text-smoke">{a}</td>
                  <td className="border-t border-[var(--line-soft)] px-5 py-4 text-ivory">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
