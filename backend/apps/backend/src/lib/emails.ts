import { MedusaError } from "@medusajs/framework/utils"

/**
 * The shop's emails: one function per template, each returning subject + HTML + plain text.
 * Table layout with inline styles so it renders the same in Gmail, Outlook and Apple Mail.
 * Brand colours: ebony #14110e / #1e1a16, gold #c9a15b, ivory #f3ecdf.
 */

export type EmailItem = { title: string; variant?: string | null; quantity: number; total: number; note?: string | null }
export type EmailAddress = {
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  postal_code?: string | null
  country_code?: string | null
}

const site = () => (process.env.STOREFRONT_URL || "https://gkparfum.co.uk").replace(/\/$/, "")
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
export const gbp = (n: number) => `£${(Math.round(n * 100) / 100).toFixed(2)}`

function layout(opts: { preheader: string; heading: string; body: string; cta?: { label: string; href: string } }) {
  const s = site()
  const cta = opts.cta
    ? `<tr><td align="center" style="padding:8px 32px 32px">
         <a href="${esc(opts.cta.href)}" style="display:inline-block;background:#c9a15b;color:#14110e;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:999px;font-family:Arial,Helvetica,sans-serif;font-size:15px">${esc(opts.cta.label)}</a>
       </td></tr>`
    : ""
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:#14110e">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#14110e">
<tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e1a16;border:1px solid #3a3128;border-radius:14px">
    <tr><td align="center" style="padding:32px 32px 8px">
      <a href="${s}"><img src="${s}/brand/gk-crest-email.png" width="76" height="80" alt="GK Parfum" style="display:block;border:0"></a>
      <div style="margin-top:10px;font-family:Georgia,'Times New Roman',serif;letter-spacing:6px;color:#c9a15b;font-size:13px">GK PARFUM</div>
    </td></tr>
    <tr><td style="padding:16px 32px 8px;font-family:Georgia,'Times New Roman',serif;color:#f3ecdf;font-size:26px;line-height:1.25" align="center">${esc(opts.heading)}</td></tr>
    <tr><td style="padding:8px 32px 16px;font-family:Arial,Helvetica,sans-serif;color:#d8cfbf;font-size:15px;line-height:1.6">${opts.body}</td></tr>
    ${cta}
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
    <tr><td align="center" style="padding:18px 24px;font-family:Arial,Helvetica,sans-serif;color:#8a8072;font-size:12px;line-height:1.6">
      GK Parfum · Extrait de parfum, 100 ml · <a href="${s}" style="color:#c9a15b;text-decoration:none">gkparfum.co.uk</a><br>
      Questions? Just reply to this email.
    </td></tr>
  </table>
</td></tr></table></body></html>`
}

function itemsTable(items: EmailItem[], totals: { label: string; value: string; strong?: boolean }[]) {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #3a3128;color:#f3ecdf">${esc(i.title)}${i.variant ? `<br><span style="color:#8a8072;font-size:13px">${esc(i.variant)}</span>` : ""}${i.note ? `<br><span style="color:#c9a15b;font-size:13px">${esc(i.note)}</span>` : ""}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #3a3128;color:#d8cfbf;white-space:nowrap" align="center">× ${i.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #3a3128;color:#f3ecdf;white-space:nowrap" align="right">${i.total ? gbp(i.total) : "Free"}</td>
      </tr>`
    )
    .join("")
  const tot = totals
    .map(
      (t) => `<tr><td colspan="2" style="padding:6px 0;color:${t.strong ? "#f3ecdf" : "#8a8072"};${t.strong ? "font-weight:600;font-size:16px" : ""}">${esc(t.label)}</td>
        <td align="right" style="padding:6px 0;color:${t.strong ? "#c9a15b" : "#d8cfbf"};${t.strong ? "font-weight:600;font-size:16px" : ""}">${esc(t.value)}</td></tr>`
    )
    .join("")
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;margin:12px 0">${rows}${tot}</table>`
}

function addressBlock(a?: EmailAddress | null) {
  if (!a) return ""
  const lines = [
    [a.first_name, a.last_name].filter(Boolean).join(" "),
    a.address_1,
    a.address_2,
    [a.city, a.postal_code].filter(Boolean).join(" "),
    (a.country_code || "").toUpperCase() === "GB" ? "United Kingdom" : a.country_code?.toUpperCase(),
  ].filter(Boolean)
  return lines.map(esc).join("<br>")
}

function plain(...parts: string[]) {
  return parts.filter(Boolean).join("\n\n")
}

/* ── templates ──────────────────────────────────────────────────────────── */

type OrderData = {
  display_id: number | string
  email?: string
  first_name?: string | null
  items: EmailItem[]
  subtotal: number
  discount_total: number
  shipping_total: number
  total: number
  shipping_method?: string | null
  shipping_address?: EmailAddress | null
  gift_box?: boolean
  subscription?: string | null
  promo_codes?: string[]
}

function orderTotals(d: OrderData) {
  // item lines already show what was charged (bundle prices included), so the maths adds up line by line
  const items = d.items.reduce((a, i) => a + i.total, 0)
  const t: { label: string; value: string; strong?: boolean }[] = [{ label: "Subtotal", value: gbp(items) }]
  t.push({ label: d.shipping_method || "Delivery", value: d.shipping_total > 0 ? gbp(d.shipping_total) : "Free" })
  t.push({ label: "Total", value: gbp(d.total), strong: true })
  if (d.discount_total > 0) {
    t.push({ label: `You saved${d.promo_codes?.length ? ` (code ${d.promo_codes.join(", ")})` : ""}`, value: gbp(d.discount_total) })
  }
  return t
}

function orderPlaced(d: OrderData) {
  const s = site()
  const hi = d.first_name ? `Thank you, ${esc(d.first_name)}.` : "Thank you."
  const body = `
    <p style="margin:0 0 12px">${hi} We've got your order <strong style="color:#f3ecdf">#${esc(d.display_id)}</strong> and we're getting it ready. You'll get another email with tracking as soon as it's on its way.</p>
    ${itemsTable(d.items, orderTotals(d))}
    ${d.subscription ? `<p style="margin:12px 0;color:#c9a15b">Repeat delivery: ${esc(d.subscription)}. Reply to this email any time to pause or cancel.</p>` : ""}
    ${d.gift_box ? `<p style="margin:12px 0">It comes in our signature gift box — on us.</p>` : ""}
    ${d.shipping_address ? `<p style="margin:16px 0 4px;color:#8a8072;font-size:13px;letter-spacing:1px">DELIVERING TO</p><p style="margin:0;color:#f3ecdf">${addressBlock(d.shipping_address)}</p>` : ""}`
  return {
    subject: `Order confirmed — #${d.display_id}`,
    html: layout({ preheader: `We've got your order #${d.display_id}.`, heading: "Your order is confirmed", body, cta: { label: "View your order", href: `${s}/account` } }),
    text: plain(
      `${d.first_name ? `Thank you, ${d.first_name}.` : "Thank you."} We've got your order #${d.display_id}.`,
      d.items.map((i) => `${i.quantity} × ${i.title}${i.variant ? ` (${i.variant})` : ""} — ${i.total ? gbp(i.total) : "Free"}`).join("\n"),
      `Total: ${gbp(d.total)}`,
      `Your account: ${s}/account`
    ),
  }
}

function orderPlacedOwner(d: OrderData) {
  const body = `
    <p style="margin:0 0 12px">New order <strong style="color:#f3ecdf">#${esc(d.display_id)}</strong> from ${esc(d.email)}.</p>
    ${itemsTable(d.items, orderTotals(d))}
    ${d.subscription ? `<p style="margin:8px 0;color:#c9a15b">Repeat delivery: ${esc(d.subscription)}</p>` : ""}
    ${d.gift_box ? `<p style="margin:8px 0;color:#c9a15b">Pack in the signature gift box.</p>` : ""}
    <p style="margin:16px 0 4px;color:#8a8072;font-size:13px;letter-spacing:1px">SHIP TO</p><p style="margin:0;color:#f3ecdf">${addressBlock(d.shipping_address)}</p>
    <p style="margin:12px 0 0;color:#8a8072">${esc(d.shipping_method || "")}</p>`
  const admin = (process.env.MEDUSA_BACKEND_URL || "").replace(/\/$/, "")
  return {
    subject: `New order #${d.display_id} — ${gbp(d.total)}`,
    html: layout({ preheader: `${d.items.reduce((a, i) => a + i.quantity, 0)} items, ${gbp(d.total)}`, heading: `New order #${d.display_id}`, body, cta: admin ? { label: "Open in admin", href: `${admin}/app/orders` } : undefined }),
    text: plain(`New order #${d.display_id} from ${d.email} — ${gbp(d.total)}`, d.items.map((i) => `${i.quantity} × ${i.title}`).join("\n")),
  }
}

function orderShipped(d: { display_id: number | string; first_name?: string | null; tracking_number?: string | null; tracking_url?: string | null; carrier?: string | null; items?: EmailItem[] }) {
  const s = site()
  const track = d.tracking_url || (d.tracking_number ? `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(d.tracking_number)}` : null)
  const body = `
    <p style="margin:0 0 12px">${d.first_name ? `Good news, ${esc(d.first_name)} — ` : "Good news — "}order <strong style="color:#f3ecdf">#${esc(d.display_id)}</strong> is on its way${d.carrier ? ` with ${esc(d.carrier)}` : ""}.</p>
    ${d.tracking_number ? `<p style="margin:0 0 12px">Tracking number: <strong style="color:#f3ecdf">${esc(d.tracking_number)}</strong></p>` : ""}
    ${d.items?.length ? `<p style="margin:12px 0 0;color:#8a8072">${d.items.map((i) => `${i.quantity} × ${esc(i.title)}`).join("<br>")}</p>` : ""}
    <p style="margin:16px 0 0">Tip: spray on pulse points straight after a shower — extrait lasts longest on warm, moisturised skin.</p>`
  return {
    subject: `On its way — order #${d.display_id}`,
    html: layout({ preheader: "Your GK Parfum order has been dispatched.", heading: "Your order is on its way", body, cta: track ? { label: "Track your parcel", href: track } : { label: "Your account", href: `${s}/account` } }),
    text: plain(`Order #${d.display_id} is on its way.`, d.tracking_number ? `Tracking: ${d.tracking_number}${track ? ` — ${track}` : ""}` : ""),
  }
}

function passwordReset(d: { url: string; for_admin?: boolean }) {
  const body = `
    <p style="margin:0 0 12px">Someone (hopefully you) asked to reset the password for your GK Parfum ${d.for_admin ? "admin " : ""}account.</p>
    <p style="margin:0 0 12px">Click the button to choose a new one. The link works once and expires in 15 minutes.</p>
    <p style="margin:0;color:#8a8072;font-size:13px">If you didn't ask for this, ignore this email — your password stays the same.</p>`
  return {
    subject: "Reset your GK Parfum password",
    html: layout({ preheader: "Choose a new password — the link expires in 15 minutes.", heading: "Reset your password", body, cta: { label: "Choose a new password", href: d.url } }),
    text: plain("Reset your GK Parfum password (link expires in 15 minutes):", d.url, "If you didn't ask for this, ignore this email."),
  }
}

function welcome(d: { first_name?: string | null }) {
  const s = site()
  const body = `
    <p style="margin:0 0 12px">${d.first_name ? `Welcome, ${esc(d.first_name)}.` : "Welcome."} Your account is ready — your bag, wishlist and orders now follow you to any device.</p>
    <p style="margin:0">Mix any 2 bottles to save 10%, or any 3 for 10% off plus free delivery. Every order comes in our signature gift box.</p>`
  return {
    subject: "Welcome to GK Parfum",
    html: layout({ preheader: "Your account is ready.", heading: "Welcome to GK Parfum", body, cta: { label: "Explore the collection", href: `${s}/shop` } }),
    text: plain("Welcome to GK Parfum. Your account is ready.", `${s}/shop`),
  }
}

export function renderEmail(template: string, data: Record<string, unknown>): { subject: string; html: string; text: string } {
  switch (template) {
    case "order-placed":
      return orderPlaced(data as unknown as OrderData)
    case "order-placed-owner":
      return orderPlacedOwner(data as unknown as OrderData)
    case "order-shipped":
      return orderShipped(data as Parameters<typeof orderShipped>[0])
    case "password-reset":
      return passwordReset(data as Parameters<typeof passwordReset>[0])
    case "welcome":
      return welcome(data as Parameters<typeof welcome>[0])
    default:
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unknown email template "${template}"`)
  }
}
