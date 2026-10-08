import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules, RuleType } from "@medusajs/framework/utils"
import { batchPromotionRulesWorkflow } from "@medusajs/medusa/core-flows"
import { BUNDLE_DELIVERY_CODE } from "../lib/offers"

/** Bundle free delivery covers standard Tracked 48 only, not Tracked 24. No-op when already set. */
export default async function gk_revisions_2({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const promotions = container.resolve(Modules.PROMOTION)

  const [promo] = await promotions.listPromotions(
    { code: BUNDLE_DELIVERY_CODE },
    { relations: ["application_method", "application_method.target_rules"] }
  )
  if (!promo || (promo.application_method?.target_rules ?? []).length) {
    return
  }
  const { data: options } = await query.graph({ entity: "shipping_option", fields: ["id", "type.code"] })
  const t48 = options.filter((o) => o.type?.code === "tracked-48").map((o) => o.id)
  if (!t48.length) {
    return
  }
  await batchPromotionRulesWorkflow(container).run({
    input: {
      id: promo.id,
      rule_type: RuleType.TARGET_RULES,
      create: [{ attribute: "shipping_methods.shipping_option_id", operator: "in", values: t48 }],
    },
  })
  logger.info("GK revisions: bundle free delivery limited to Tracked 48")
}
