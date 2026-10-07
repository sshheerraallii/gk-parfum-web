import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { saveGkOffersWorkflow } from "../../../../workflows/save-gk-offers"
import { GK_SETTINGS_MODULE } from "../../../../modules/gk-settings"
import type GkSettingsService from "../../../../modules/gk-settings/service"
import type { GkOffersBody } from "../../../middlewares"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const settings = req.scope.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  res.json({ offers: await settings.getOffers() })
}

export async function POST(req: MedusaRequest<GkOffersBody>, res: MedusaResponse) {
  const { result } = await saveGkOffersWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ offers: result })
}
