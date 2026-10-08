import { MedusaService } from "@medusajs/framework/utils"
import GkSetting from "./models/gk-setting"
import { normaliseOffers, type GkOffers } from "../../lib/offers"

class GkSettingsService extends MedusaService({ GkSetting }) {
  async getOffers(): Promise<GkOffers> {
    const [row] = await this.listGkSettings({ key: "offers" })
    return normaliseOffers(row?.value as Partial<GkOffers> | undefined)
  }

  async saveOffers(next: GkOffers): Promise<GkOffers> {
    const clean = normaliseOffers(next)
    const [row] = await this.listGkSettings({ key: "offers" })
    if (row) {
      await this.updateGkSettings({ id: row.id, value: clean as unknown as Record<string, unknown> })
    } else {
      await this.createGkSettings({ key: "offers", value: clean as unknown as Record<string, unknown> })
    }
    return clean
  }
}

export default GkSettingsService
