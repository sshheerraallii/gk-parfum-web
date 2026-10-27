import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const modules: { resolve: string; options?: Record<string, unknown> }[] = [
  { resolve: "./src/modules/gk-settings" },
  { resolve: "./src/modules/gk-engage" },
  { resolve: "./src/modules/gk-blog" },
]

// Payments. Stripe: cards, Apple Pay, Google Pay, Klarna/Clearpay through the Payment Element (turn methods on
// in the Stripe dashboard → Settings → Payment methods). PayPal: its own button at checkout.
const paymentProviders: { resolve: string; id: string; options: Record<string, unknown> }[] = []
if (process.env.STRIPE_API_KEY) {
  paymentProviders.push({
    resolve: "@medusajs/medusa/payment-stripe",
    id: "stripe",
    options: {
      apiKey: process.env.STRIPE_API_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      capture: true,
      automatic_payment_methods: true,
    },
  })
}
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  paymentProviders.push({
    resolve: "./src/modules/paypal",
    id: "paypal",
    options: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      // sandbox unless told it's live
      sandbox: process.env.PAYPAL_MODE !== "live",
      apiUrl: process.env.PAYPAL_API_URL,
    },
  })
}
if (paymentProviders.length) {
  modules.push({ resolve: "@medusajs/medusa/payment", options: { providers: paymentProviders } })
}

// Product photos uploaded in the admin. Without S3 settings they're saved on the server's own disk,
// which free hosts wipe on every restart — so on Render, point these at a free Supabase Storage bucket.
if (process.env.S3_BUCKET) {
  modules.push({
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/file-s3",
          id: "s3",
          options: {
            file_url: process.env.S3_FILE_URL,
            access_key_id: process.env.S3_ACCESS_KEY_ID,
            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION || "eu-west-2",
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT,
            // Supabase buckets are made public in its dashboard, so no per-file ACL header
            acl: false,
            additional_client_config: { forcePathStyle: true },
          },
        },
      ],
    },
  })
} else if (/^https?:\/\//.test(process.env.MEDUSA_BACKEND_URL || "")) {
  // Own server (VPS): photos live on the server's disk (a Docker volume) and are served from /static
  // on the backend's public address, so the links in the shop work from anywhere.
  modules.push({
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/file-local",
          id: "local",
          options: {
            upload_dir: "static",
            backend_url: `${process.env.MEDUSA_BACKEND_URL!.replace(/\/$/, "")}/static`,
          },
        },
      ],
    },
  })
}

// Shop emails (order confirmation, dispatch, password reset, owner alerts) via Resend.
if (process.env.RESEND_API_KEY) {
  modules.push({
    resolve: "@medusajs/medusa/notification",
    options: {
      providers: [
        {
          resolve: "./src/modules/resend",
          id: "resend",
          options: {
            channels: ["email"],
            apiKey: process.env.RESEND_API_KEY,
            from: process.env.EMAIL_FROM || "GK Parfum <sales@gkparfum.co.uk>",
            replyTo: process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL,
            apiUrl: process.env.RESEND_API_URL,
          },
        },
      ],
    },
  })
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Hosted Postgres (Supabase, Neon, Render) wants TLS; set DATABASE_SSL=true there.
    ...(process.env.DATABASE_SSL === "true"
      ? { databaseDriverOptions: { connection: { ssl: { rejectUnauthorized: false } } } }
      : {}),
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "/",
  },
  modules,
})
