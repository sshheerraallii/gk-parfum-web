import { Module } from "@medusajs/framework/utils"
import GkEngageService from "./service"

export const GK_ENGAGE_MODULE = "gk_engage"

export default Module(GK_ENGAGE_MODULE, { service: GkEngageService })
