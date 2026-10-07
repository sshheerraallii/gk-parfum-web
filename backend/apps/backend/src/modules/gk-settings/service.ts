import { MedusaService } from "@medusajs/framework/utils"
import GkSetting from "./models/gk-setting"
import { DEFAULT_OFFERS, type GkOffers } from "../../lib/offers"

class GkSettingsService extends MedusaService({ GkSetting }) {
  async getOffers(): Promise<GkOffers> {
    const [row] = await this.listGkSettings({ key: "offers" })
    return { ...DEFAULT_OFFERS, ...((row?.value as Partial<GkOffers>) ?? {}) }
  }

  async saveOffers(next: GkOffers): Promise<GkOffers> {
    const [row] = await this.listGkSettings({ key: "offers" })
    if (row) {
      await this.updateGkSettings({ id: row.id, value: next as unknown as Record<string, unknown> })
    } else {
      await this.createGkSettings({ key: "offers", value: next as unknown as Record<string, unknown> })
    }
    return next
  }
}

export default GkSettingsService
