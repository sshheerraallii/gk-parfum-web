/** Shapes of linked/computed fields that Query returns but the generated types don't describe. */
export type PricedVariant = { id: string; calculated_price?: { calculated_amount?: number | string | null } | null }

export type PriceRow = {
  amount?: number | string | null
  currency_code?: string | null
  price_rules?: { attribute?: string | null }[] | null
}

export type PricedShippingOption = {
  id: string
  name?: string | null
  type?: { code?: string | null; description?: string | null } | null
  prices?: PriceRow[] | null
}

export type PricedBoxVariant = { id: string; prices?: PriceRow[] | null; product?: { title?: string | null } | null }
