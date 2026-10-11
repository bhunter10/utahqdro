import { NextResponse } from "next/server";

type SquarePaymentLinkResponse = {
  payment_link?: {
    id?: string;
    url?: string;
    long_url?: string;
  };
  errors?: Array<{ detail?: string; code?: string }>;
};

function getSquareApiBaseUrl() {
  return process.env.SQUARE_ENVIRONMENT === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}

export async function POST(req: Request) {
  const { requestId, cancelPath } = (await req.json()) as { requestId?: string; cancelPath?: string };
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const priceCents = Number(process.env.SQUARE_QDRO_PRICE_CENTS || "55000");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const safeCancelPath = cancelPath?.startsWith("/") && !cancelPath.startsWith("//") ? cancelPath : "/qdro-request";
  const safeRequestId = requestId || "draft";

  if (!accessToken || !locationId) {
    return NextResponse.json({
      message:
        "Square Checkout is wired but not enabled. Add SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID to create live payment links.",
      requestId
    });
  }

  const response = await fetch(`${getSquareApiBaseUrl()}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": process.env.SQUARE_API_VERSION || "2026-09-16"
    },
    body: JSON.stringify({
      idempotency_key: `${safeRequestId}-${Date.now()}`,
      description: `UtahQDRO request ${safeRequestId}`,
      quick_pay: {
        name: "UtahQDRO flat fee",
        price_money: {
          amount: Number.isFinite(priceCents) ? priceCents : 55000,
          currency: "USD"
        },
        location_id: locationId
      },
      checkout_options: {
        redirect_url: `${appUrl}/portal?payment=success&request_id=${encodeURIComponent(safeRequestId)}`
      },
      payment_note: `UtahQDRO request ${safeRequestId}; cancel path ${safeCancelPath}`
    })
  });

  const payload = (await response.json()) as SquarePaymentLinkResponse;
  if (!response.ok || !payload.payment_link?.url) {
    const detail = payload.errors?.map((error) => error.detail || error.code).filter(Boolean).join(" ");
    return NextResponse.json({ message: detail || "Square could not create a payment link.", requestId }, { status: 502 });
  }

  return NextResponse.json({ url: payload.payment_link.url, squarePaymentLinkId: payload.payment_link.id });
}
