import { NextResponse } from "next/server";
import { getGoogleOAuthRedirectUri } from "@/lib/google-oauth";

const scope = "https://www.googleapis.com/auth/drive.file";

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;

  if (!clientId) {
    return new NextResponse("Missing GOOGLE_OAUTH_CLIENT_ID.", { status: 500 });
  }

  const redirectUri = getGoogleOAuthRedirectUri(req);
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");

  return NextResponse.redirect(authUrl);
}
