import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow, updateRegionsWorkflow, updateStoresWorkflow } from "@medusajs/medusa/core-flows"
import { GK_SETTINGS_MODULE } from "../modules/gk-settings"
import type GkSettingsService from "../modules/gk-settings/service"
import { saveGkOffersWorkflow } from "../workflows/save-gk-offers"

/**
 * Client revisions round 4 (October 2026):
 *  - Symphonie is unisex (category + metadata.gender)
 *  - the Best Sellers podium: Eventus, Nomad, Imagine
 *  - the shop runs in pounds only — any other currency left on the store or a region is removed
 * Runs once; later admin edits are never overwritten.
 */
export default async function gk_revisions_6({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // 1. Symphonie → Unisex
  const { data: cats } = await query.graph({ entity: "product_category", fields: ["id", "name"] })
  const gender = new Map(cats.map((c) => [c.name, c.id]))
  const genderIds = new Set(["For him", "For her", "Unisex"].map((n) => gender.get(n)).filter(Boolean))
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "metadata", "categories.id"],
    filters: { handle: "symphonie" },
  })
  for (const p of products) {
    const keep = (p.categories ?? []).filter((c) => c && !genderIds.has(c.id)).map((c) => c!.id)
    const unisex = gender.get("Unisex")
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: p.id },
        update: {
          category_ids: unisex ? [...keep, unisex] : keep,
          metadata: { ...((p.metadata ?? {}) as Record<string, unknown>), gender: "unisex" },
        },
      },
    })
    logger.info("GK revisions: Symphonie is now unisex")
  }

  // 2. Best Sellers podium
  const settings = container.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  const offers = await settings.getOffers()
  await saveGkOffersWorkflow(container).run({ input: { ...offers, bestSellers: ["eventus", "nomad", "imagine"] } })
  logger.info("GK revisions: best sellers set to Eventus, Nomad, Imagine")

  // 3. Pounds only
  const { data: stores } = await query.graph({ entity: "store", fields: ["id", "supported_currencies.currency_code", "supported_currencies.is_default"] })
  for (const s of stores) {
    const cur = (s.supported_currencies ?? []).filter(Boolean) as { currency_code: string; is_default: boolean }[]
    const ok = cur.length === 1 && cur[0].currency_code === "gbp" && cur[0].is_default
    if (!ok) {
      await updateStoresWorkflow(container).run({
        input: { selector: { id: s.id }, update: { supported_currencies: [{ currency_code: "gbp", is_default: true }] } },
      })
      logger.info(`GK revisions: store currencies set to GBP only (was ${cur.map((c) => c.currency_code).join(", ") || "none"})`)
    }
  }
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "name", "currency_code"] })
  for (const r of regions.filter((r) => r.currency_code !== "gbp")) {
    await updateRegionsWorkflow(container).run({ input: { selector: { id: r.id }, update: { currency_code: "gbp" } } })
    logger.info(`GK revisions: region ${r.name} switched to GBP`)
  }
}
