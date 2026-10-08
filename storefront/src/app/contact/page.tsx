import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Questions about a GK Parfum order, a scent or delivery? Send us a message — a real person replies within one working day.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return (
    <section className="wrap py-16 md:py-24">
      <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <h1 className="display-xl">Contact us</h1>
          <p className="lede mt-5">A real person reads every message. We reply within one working day.</p>
          <dl className="mt-10 space-y-6">
            <div>
              <dt className="text-champagne">Email</dt>
              <dd className="mt-1"><a href={`mailto:${SITE.email}`} className="text-ivory underline-offset-4 hover:underline">{SITE.email}</a></dd>
            </div>
            <div>
              <dt className="text-champagne">Where&apos;s my order?</dt>
              <dd className="mt-1 text-smoke">
                Orders ship within one working day by Royal Mail Tracked. Your tracking link is in your dispatch email, and in{" "}
                <Link href="/account" className="text-ivory underline underline-offset-4">your account</Link>.
              </dd>
            </div>
            <div>
              <dt className="text-champagne">Quick answers</dt>
              <dd className="mt-1 text-smoke">
                Delivery, returns, bundles and subscriptions are covered in our <Link href="/faq" className="text-ivory underline underline-offset-4">questions page</Link>.
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-[var(--radius-m)] border border-[var(--line)] bg-ebony/60 p-6 md:p-8">
          <h2 className="display-m">Send a message</h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
