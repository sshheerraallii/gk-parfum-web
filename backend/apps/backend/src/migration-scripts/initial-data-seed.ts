import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductTagsWorkflow,
  createProductsWorkflow,
  createPromotionsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import scents from "../data/scents.json"
import { BUNDLE_DELIVERY_CODE, DEFAULT_OFFERS, GIFT_BOX_SKU } from "../lib/offers"
import { GK_SETTINGS_MODULE } from "../modules/gk-settings"
import type GkSettingsService from "../modules/gk-settings/service"

type Scent = (typeof scents)[number]

const GENDER_CATEGORY: Record<string, string> = { men: "For him", women: "For her", unisex: "Unisex" }

/** Runs once on the first `medusa db:migrate`: sets up GK Parfum's UK store from scratch. */
export default async function initial_data_seed({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillment = container.resolve(ModuleRegistrationName.FULFILLMENT)

  logger.info("GK: sales channel + publishable key")
  const {
    result: [channel],
  } = await createSalesChannelsWorkflow(container).run({
    input: { salesChannelsData: [{ name: "GK Parfum website", description: "gkparfum storefront" }] },
  })
  const {
    result: [pk],
  } = await createApiKeysWorkflow(container).run({
    input: { api_keys: [{ title: "Storefront", type: "publishable", created_by: "" }] },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: pk.id, add: [channel.id] } })

  logger.info("GK: store (GBP)")
  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "GK Parfum",
          supported_currencies: [{ currency_code: "gbp", is_default: true }],
          default_sales_channel_id: channel.id,
        },
      ],
    },
  })

  const paymentProviders = ["pp_system_default"]
  if (process.env.STRIPE_API_KEY) paymentProviders.unshift("pp_stripe_stripe")

  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "United Kingdom",
          currency_code: "gbp",
          countries: ["gb"],
          payment_providers: paymentProviders,
          automatic_taxes: true,
          is_tax_inclusive: true,
        },
      ],
    },
  })
  // UK prices are VAT-inclusive; rate is set in Admin → Tax regions once VAT-registered.
  await createTaxRegionsWorkflow(container).run({ input: [{ country_code: "gb", provider_id: "tp_system" }] })

  logger.info("GK: stock location + shipping")
  const {
    result: [location],
  } = await createStockLocationsWorkflow(container).run({
    input: { locations: [{ name: "GK Studio (UK)", address: { city: "", country_code: "GB", address_1: "" } }] },
  })
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const profile = profiles[0]

  const fset = await fulfillment.createFulfillmentSets({
    name: "UK delivery",
    type: "shipping",
    service_zones: [{ name: "United Kingdom", geo_zones: [{ country_code: "gb", type: "country" }] }],
  })
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fset.id },
  })

  const storeRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]
  const { result: shippingOptions } = await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Royal Mail Tracked 48",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fset.service_zones[0].id,
        shipping_profile_id: profile.id,
        type: { label: "Tracked 48", description: "2–3 working days", code: "tracked-48" },
        prices: [
          { currency_code: "gbp", amount: 3.99 },
          {
            currency_code: "gbp",
            amount: 0,
            rules: [{ attribute: "item_total", operator: "gte", value: DEFAULT_OFFERS.freeDelivery.threshold }],
          },
        ],
        rules: storeRules,
      },
      {
        name: "Royal Mail Tracked 24",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fset.service_zones[0].id,
        shipping_profile_id: profile.id,
        type: { label: "Tracked 24", description: "Next working day", code: "tracked-24" },
        prices: [{ currency_code: "gbp", amount: 5.99 }],
        rules: storeRules,
      },
    ],
  })
  await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [channel.id] } })

  logger.info("GK: categories + collections")
  const { result: cats } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "For him", handle: "men", is_active: true },
        { name: "For her", handle: "women", is_active: true },
        { name: "Unisex", handle: "unisex", is_active: true },
        { name: "Gift boxes", handle: "gift-boxes", is_active: true },
      ],
    },
  })
  const catId = (name: string) => cats.find((c) => c.name === name)!.id

  const { result: cols } = await createCollectionsWorkflow(container).run({
    input: { collections: [{ title: "Extrait de Parfum 100ml", handle: "extrait-100ml" }] },
  })

  logger.info("GK: tags (a product can carry many — edit in Admin → Products)")
  const tagValues = [...new Set(scents.flatMap((s) => s.tags ?? []))]
  const { result: tags } = await createProductTagsWorkflow(container).run({
    input: { product_tags: tagValues.map((value) => ({ value })) },
  })
  const tagIds = (values: string[] = []) => tags.filter((t) => values.includes(t.value)).map((t) => t.id)

  logger.info("GK: products")
  const perfume = (s: Scent) => ({
    title: s.name,
    subtitle: s.inspiredBy ? `Inspired by ${s.inspiredBy.brand} ${s.inspiredBy.name}` : "A GK original",
    handle: s.slug,
    description: s.description,
    status: ProductStatus.PUBLISHED,
    weight: 420,
    material: "Extrait de Parfum, 40% oil",
    origin_country: "gb",
    collection_id: cols[0].id,
    category_ids: [catId(GENDER_CATEGORY[s.gender])],
    tag_ids: tagIds(s.tags),
    shipping_profile_id: profile.id,
    sales_channels: [{ id: channel.id }],
    // Everything the storefront shows is editable here in Admin → Products → Metadata.
    metadata: {
      inspired_brand: s.inspiredBy?.brand ?? "",
      inspired_name: s.inspiredBy?.name ?? "",
      gender: s.gender,
      families: s.families.join(", "),
      mood: s.mood,
      time: s.time,
      notes_top: s.notes.top.join(", "),
      notes_heart: s.notes.heart.join(", "),
      notes_base: s.notes.base.join(", "),
      longevity_min: s.longevityHours[0],
      longevity_max: s.longevityHours[1],
      occasions: s.occasions.join(", "),
      tint: s.tint,
      one_liner: s.oneLiner,
      seo_title: "",
      seo_description: "",
    },
    options: [{ title: "Size", values: ["100ml"] }],
    variants: [
      {
        title: "100ml",
        sku: s.sku,
        manage_inventory: true,
        options: { Size: "100ml" },
        prices: [{ currency_code: "gbp", amount: s.price / 100 }],
      },
    ],
  })

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      products: [
        ...scents.map(perfume),
        {
          title: "Signature gift box",
          handle: "signature-gift-box",
          description: "The GK signature presentation box. Added free to every order — the price stays at £0.",
          status: ProductStatus.PUBLISHED,
          weight: 150,
          category_ids: [catId("Gift boxes")],
          shipping_profile_id: profile.id,
          sales_channels: [{ id: channel.id }],
          metadata: { kind: "gift_box" },
          options: [{ title: "Type", values: ["Box"] }],
          variants: [
            {
              title: "Box",
              sku: GIFT_BOX_SKU,
              manage_inventory: true,
              options: { Type: "Box" },
              prices: [{ currency_code: "gbp", amount: 0 }],
            },
          ],
        },
      ],
    },
  })

  logger.info("GK: opening stock (50 each — edit in Admin → Inventory)")
  const { data: items } = await query.graph({ entity: "inventory_item", fields: ["id"] })
  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: items.map((i) => ({ location_id: location.id, stocked_quantity: 50, inventory_item_id: i.id })),
    },
  })

  logger.info("GK: example discount codes (inactive — switch on in Admin → Promotions)")
  await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [
        {
          code: "WELCOME10",
          type: "standard",
          status: "draft",
          is_automatic: false,
          application_method: {
            type: "percentage",
            target_type: "order",
            allocation: "across",
            value: 10,
            currency_code: "gbp",
          },
        },
        {
          // Applied and removed automatically by the cart when a bag reaches the free-delivery tier.
          // Covers standard Tracked 48 only — express delivery is still charged.
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
            target_rules: [
              {
                attribute: "shipping_methods.shipping_option_id",
                operator: "in",
                values: shippingOptions.filter((o) => o.name === "Royal Mail Tracked 48").map((o) => o.id),
              },
            ],
          },
        },
        {
          code: "FREESHIP",
          type: "standard",
          status: "draft",
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

  const settings = container.resolve<GkSettingsService>(GK_SETTINGS_MODULE)
  await settings.saveOffers(DEFAULT_OFFERS)

  logger.info(`GK: done — ${products.length} products, region ${region.id}, publishable key ${pk.token}`)
}
