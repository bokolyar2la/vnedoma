import { NextRequest, NextResponse } from "next/server";

const BASIC_REALM = 'Basic realm="Admin Area"';

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": BASIC_REALM
    }
  });
}

function getAdminCredentials() {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (user && password) {
    return { user, password };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      user: user ?? "admin",
      password: password ?? "admin"
    };
  }

  return null;
}

function parseBasicAuth(header: string | null) {
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = atob(header.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) {
      return null;
    }

    return {
      user: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const credentials = getAdminCredentials();

  if (!credentials) {
    return unauthorized();
  }

  const auth = parseBasicAuth(request.headers.get("authorization"));

  if (!auth || auth.user !== credentials.user || auth.password !== credentials.password) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
