import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const payload = (await req.json()) as { requestId?: string; signerEmail?: string; signerName?: string };

  const required = [
    process.env.DOCUSIGN_ACCOUNT_ID,
    process.env.DOCUSIGN_INTEGRATION_KEY,
    process.env.DOCUSIGN_USER_ID,
    process.env.DOCUSIGN_PRIVATE_KEY
  ];

  if (required.some((value) => !value)) {
    return NextResponse.json({
      message:
        "DocuSign routing is wired but not enabled. Add DocuSign credentials to create live envelopes.",
      requestId: payload.requestId
    });
  }

  return NextResponse.json({
    message:
      "DocuSign credentials are present. Add JWT token exchange and envelope template mapping for the final production envelope.",
    requestId: payload.requestId,
    signerEmail: payload.signerEmail,
    signerName: payload.signerName
  });
}
