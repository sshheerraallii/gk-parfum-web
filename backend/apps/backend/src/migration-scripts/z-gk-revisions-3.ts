import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductTagsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import scents from "../data/scents.json"
import renamed from "../data/renamed-slugs.json"
import { GK_SETTINGS_MODULE } from "../modules/gk-settings"
import type GkSettingsService from "../modules/gk-settings/service"
import { GK_ENGAGE_MODULE } from "../modules/gk-engage"
import type GkEngageService from "../modules/gk-engage/service"
import { saveGkOffersWorkflow } from "../workflows/save-gk-offers"

const RENAMED = renamed as Record<string, string>
const CATALOG = "2026-10"

/**
 * Client revisions round 2 (October 2026): the final scent names, corrected notes and copy.
 * Each scent is updated once (marked with metadata.gk_catalog), so later admin edits are never overwritten.
 * Also moves best-seller picks and reviews over to the new handles. A no-op on a fresh install.
 */
export default async function gk_revisions_3({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata", "variants.sku"],
  })
  const stale = products.filter((p) => {
    const handle = RENAMED[p.handle] ?? p.handle
    const meta = (p.metadata ?? {}) as Record<string, unknown>
    return scents.some((s) => s.slug === handle) && meta.gk_catalog !== CATALOG
  })

  if (stale.length) {
    const { data: tagRows } = await query.graph({ entity: "product_tag", fields: ["id", "value"] })
    const tagId = new Map(tagRows.map((t) => [t.value, t.id]))
    const missing = [...new Set(scents.flatMap((s) => s.tags ?? []))].filter((v) => !tagId.has(v))
    if (missing.length) {
      const { result } = await createProductTagsWorkflow(container).run({
        input: { product_tags: missing.map((value) => ({ value })) },
      })
      result.forEach((t) => tagId.set(t.value, t.id))
    }

    for (const p of stale) {
      const s = scents.find((x) => x.slug === (RENAMED[p.handle] ?? p.handle))
      if (!s) {
        continue
      }
      const meta = (p.metadata ?? {}) as Record<string, unknown>
      await updateProductsWorkflow(container).run({
        input: {
          selector: { id: p.id },
          update: {
            title: s.name,
            handle: s.slug,
            subtitle: s.inspiredBy ? `Inspired by ${s.inspiredBy.brand} ${s.inspiredBy.name}` : "A GK original",
            description: s.description,
            tag_ids: (s.tags ?? []).map((v) => tagId.get(v)!).filter(Boolean),
            metadata: {
              ...meta,
              inspired_brand: s.inspiredBy?.brand ?? "",
              inspired_name: s.inspiredBy?.name ?? "",
              families: s.families.join(", "),
              mood: s.mood,
              time: s.time,
              notes_top: s.notes.top.join(", "),
              notes_heart: s.notes.heart.join(", "),
              notes_base: s.notes.base.join(", "),
              occasions: s.occasions.join(", "),
              tint: s.tint,
              one_liner: s.oneLiner,
              gk_catalog: CATALOG,
            },
          },
        },
      })
    }
    logger.info(`GK revisions: ${stale.length} scents updated to the final catalogue names and notes`)
  }

  // best sellers picked in Admin → Offers are stored by handle
  const settings = container.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  const offers = await settings.getOffers()
  if (offers.bestSellers.some((h) => RENAMED[h])) {
    await saveGkOffersWorkflow(container).run({
      input: { ...offers, bestSellers: [...new Set(offers.bestSellers.map((h) => RENAMED[h] ?? h))] },
    })
    logger.info("GK revisions: best sellers moved to the new names")
  }

  // reviews are linked by handle
  const engage = container.resolve<GkEngageService>(GK_ENGAGE_MODULE)
  const reviews = await engage.listGkReviews({ product_handle: Object.keys(RENAMED) }, { take: 10000 })
  for (const r of reviews) {
    await engage.updateGkReviews({ id: r.id, product_handle: RENAMED[r.product_handle!] })
  }
  if (reviews.length) {
    logger.info(`GK revisions: ${reviews.length} reviews moved to the new names`)
  }
}
