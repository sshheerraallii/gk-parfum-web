import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createProductTagsWorkflow,
  createPromotionsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import scents from "../data/scents.json"
import { BUNDLE_DELIVERY_CODE, GIFT_BOX_SKU } from "../lib/offers"
import { GK_SETTINGS_MODULE } from "../modules/gk-settings"
import type GkSettingsService from "../modules/gk-settings/service"
import { saveGkOffersWorkflow } from "../workflows/save-gk-offers"

/**
 * Client revisions, October 2026 — upgrades a store seeded before them:
 * bundle tiers + free delivery over £65, free gift box, bundle delivery code,
 * product tags, 12–24h longevity and the Ombre Nomade correction.
 * Every step checks first, so on a fresh install (already seeded with all of this) it does nothing.
 */
export default async function gk_revisions_1({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata", "tags.value", "variants.id", "variants.sku", "variants.prices.amount"],
  })
  if (!products.length) {
    logger.info("GK revisions: empty store, nothing to upgrade")
    return
  }

  // offers: re-save through the workflow so the Tracked 48 "free over" rule moves to £65
  const settings = container.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  const current = await settings.getOffers()
  if (current.freeDelivery.threshold !== 65) {
    await saveGkOffersWorkflow(container).run({ input: { ...current, freeDelivery: { enabled: true, threshold: 65 } } })
    logger.info("GK revisions: offers moved to bundle tiers, free delivery over £65")
  }

  // bundle free-delivery promotion
  const promotions = container.resolve(Modules.PROMOTION)
  const existing = await promotions.listPromotions({ code: BUNDLE_DELIVERY_CODE })
  if (!existing.length) {
    await createPromotionsWorkflow(container).run({
      input: {
        promotionsData: [
          {
            code: BUNDLE_DELIVERY_CODE,
            type: "standard",
            status: "active",
            is_automatic: false,
            application_method: {
              type: "percentage",
              target_type: "shipping_methods",
              allocation: "across",
              value: 100,
              currency_code: "gbp",
            },
          },
        ],
      },
    })
    logger.info("GK revisions: bundle free-delivery code created")
  }

  // gift box is free with every order
  type PricedVariantRow = { id: string; sku?: string | null; prices?: { amount?: number | string | null }[] | null }
  const box = (products.flatMap((p) => p.variants ?? []) as unknown as PricedVariantRow[]).find((v) => v?.sku === GIFT_BOX_SKU)
  if (box && (box.prices ?? []).some((pr) => Number(pr?.amount) !== 0)) {
    await updateProductVariantsWorkflow(container).run({
      input: { selector: { id: box.id }, update: { prices: [{ currency_code: "gbp", amount: 0 }] } },
    })
    logger.info("GK revisions: gift box price set to £0")
  }

  // tags
  const { data: tagRows } = await query.graph({ entity: "product_tag", fields: ["id", "value"] })
  const tagId = new Map(tagRows.map((t) => [t.value, t.id]))
  const missing = [...new Set(scents.flatMap((s) => s.tags ?? []))].filter((v) => !tagId.has(v))
  if (missing.length) {
    const { result } = await createProductTagsWorkflow(container).run({
      input: { product_tags: missing.map((value) => ({ value })) },
    })
    result.forEach((t) => tagId.set(t.value, t.id))
  }

  // per-scent data corrections
  let changed = 0
  for (const s of scents) {
    const p = products.find((x) => x.handle === s.slug)
    if (!p) {
      continue
    }
    const meta = (p.metadata ?? {}) as Record<string, unknown>
    const needsMeta =
      Number(meta.longevity_min) !== s.longevityHours[0] ||
      Number(meta.longevity_max) !== s.longevityHours[1] ||
      (s.inspiredBy && meta.inspired_name !== s.inspiredBy.name)
    const hasTags = (p.tags ?? []).length > 0
    if (!needsMeta && hasTags) {
      continue
    }
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: p.id },
        update: {
          ...(needsMeta
            ? {
                subtitle: s.inspiredBy ? `Inspired by ${s.inspiredBy.brand} ${s.inspiredBy.name}` : "A GK original",
                metadata: {
                  ...meta,
                  longevity_min: s.longevityHours[0],
                  longevity_max: s.longevityHours[1],
                  inspired_brand: s.inspiredBy?.brand ?? "",
                  inspired_name: s.inspiredBy?.name ?? "",
                },
              }
            : {}),
          ...(hasTags ? {} : { tag_ids: (s.tags ?? []).map((v) => tagId.get(v)!).filter(Boolean) }),
        },
      },
    })
    changed++
  }
  logger.info(`GK revisions: ${changed} products updated`)
}
