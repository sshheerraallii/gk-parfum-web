import { NextResponse } from "next/server";
import { getOffers } from "@/lib/medusa";

export const revalidate = 60;

export async function GET() {
  return NextResponse.json(await getOffers());
}
