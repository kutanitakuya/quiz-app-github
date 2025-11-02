import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set. Please add it to your environment variables.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

const MIN_AMOUNT = 100; // ¥100
const MAX_AMOUNT = 50_000; // ¥50,000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const currency = typeof body.currency === "string" ? body.currency : "jpy";
    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

    if (!origin) {
      return NextResponse.json({ error: "Origin is missing." }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `寄付額は ${MIN_AMOUNT} 〜 ${MAX_AMOUNT} の範囲で指定してください。` },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "QuizLive サポート寄付",
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/donate/cancel`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Failed to create checkout session", error);
    return NextResponse.json(
      { error: "寄付ページの生成に失敗しました。時間を置いて再度お試しください。" },
      { status: 500 }
    );
  }
}
