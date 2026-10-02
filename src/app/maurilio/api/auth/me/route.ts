import { NextRequest, NextResponse } from "next/server";
import {
  getMaurilioUser,
  MAURILIO_AUTH_COOKIE,
  MAURILIO_REFRESH_COOKIE,
  refreshMaurilio,
} from "@/lib/maurilio-auth-server";

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get(MAURILIO_AUTH_COOKIE)?.value;
  const refreshToken = request.cookies.get(MAURILIO_REFRESH_COOKIE)?.value;
  let refreshed:
    | {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      }
    | undefined;

  let user = accessToken ? await getMaurilioUser(accessToken) : null;

  if ((!user || !user.ok) && refreshToken) {
    const refresh = await refreshMaurilio(refreshToken);
    if (refresh.ok && refresh.body.access_token) {
      accessToken = refresh.body.access_token;
      refreshed = refresh.body;
      user = await getMaurilioUser(accessToken);
    }
  }

  if (!user?.ok) {
    return NextResponse.json(
      { authenticated: false },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }

  const metadata =
    user.body.user_metadata &&
    typeof user.body.user_metadata === "object" &&
    !Array.isArray(user.body.user_metadata)
      ? (user.body.user_metadata as Record<string, unknown>)
      : {};

  const response = NextResponse.json(
    {
      authenticated: true,
      id: user.body.id,
      email: user.body.email,
      displayName:
        typeof metadata.display_name === "string"
          ? metadata.display_name
          : null,
      requestedRole:
        metadata.maurilio_role === "tipster" ? "tipster" : "user",
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );

  if (refreshed?.access_token) {
    response.cookies.set(MAURILIO_AUTH_COOKIE, refreshed.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/maurilio",
      maxAge: Number(refreshed.expires_in || 3600),
    });
    if (refreshed.refresh_token) {
      response.cookies.set(MAURILIO_REFRESH_COOKIE, refreshed.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/maurilio",
        maxAge: 60 * 60 * 24 * 90,
      });
    }
  }

  return response;
}
