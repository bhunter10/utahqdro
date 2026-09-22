import { NextResponse } from "next/server";
import { getGoogleOAuthRedirectUri } from "@/lib/google-oauth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return oauthHtml("Google Drive was not connected. No authorization code was returned.");
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return oauthHtml("Google OAuth is missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleOAuthRedirectUri(req),
      grant_type: "authorization_code"
    })
  });

  const token = (await tokenResponse.json()) as { refresh_token?: string; error_description?: string };

  if (!tokenResponse.ok || !token.refresh_token) {
    return oauthHtml(token.error_description || "Google did not return a refresh token. Try connecting again.");
  }

  const response = oauthHtml("Google Drive is connected. You can close this tab and create the Google Doc again.");
  response.cookies.set("google_refresh_token", token.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}

function oauthHtml(message: string) {
  return new NextResponse(
    `<!doctype html>
    <html>
      <head>
        <title>Google Drive Connection</title>
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 40px; line-height: 1.5; }
          main { max-width: 620px; margin: 0 auto; }
          button { border: 0; border-radius: 8px; padding: 10px 14px; background: #164b7a; color: white; font-weight: 700; cursor: pointer; }
        </style>
      </head>
      <body>
        <main>
          <h1>Google Drive Connection</h1>
          <p>${escapeHtml(message)}</p>
          <button onclick="window.close()">Close</button>
        </main>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
