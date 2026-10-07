import { Module } from "@medusajs/framework/utils"
import GkSettingsService from "./service"

export const GK_SETTINGS_MODULE = "gk_settings"

export default Module(GK_SETTINGS_MODULE, { service: GkSettingsService })
