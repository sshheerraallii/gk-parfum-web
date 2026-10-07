import type { Metadata } from "next";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Track an order", alternates: { canonical: "/track" }, robots: { index: false, follow: true } };

export default function Track() {
  return (
    <Prose title="Track your order" intro="Your dispatch email has a Royal Mail tracking number. Enter it on Royal Mail's site to see where your parcel is.">
      <p><a href="https://www.royalmail.com/track-your-item" rel="noopener noreferrer" target="_blank">Track with Royal Mail</a></p>
      <p>No dispatch email yet? Orders ship within one working day. If it&apos;s been longer, <a href="/contact">contact us</a>.</p>
    </Prose>
  );
}
