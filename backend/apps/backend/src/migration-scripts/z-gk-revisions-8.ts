import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GK_SETTINGS_MODULE } from "../modules/gk-settings"
import type GkSettingsService from "../modules/gk-settings/service"
import { saveGkOffersWorkflow } from "../workflows/save-gk-offers"

/** Best Sellers podium order (14 Oct 2026): 1 Nomad, 2 Imagine, 3 Eventus. Runs once. */
export default async function gk_revisions_8({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const settings = container.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  const offers = await settings.getOffers()
  await saveGkOffersWorkflow(container).run({ input: { ...offers, bestSellers: ["nomad", "imagine", "eventus"] } })
  logger.info("GK revisions: best sellers set to Nomad, Imagine, Eventus")
}
