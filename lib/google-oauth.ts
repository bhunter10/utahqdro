const googleOauthCallbackPath = "/api/google/oauth/callback";

export function getGoogleOAuthRedirectUri(req: Request) {
  if (process.env.GOOGLE_OAUTH_REDIRECT_URI) return process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${googleOauthCallbackPath}`;
  }

  return `${new URL(req.url).origin}${googleOauthCallbackPath}`;
}
