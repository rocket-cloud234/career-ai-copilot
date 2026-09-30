import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export async function middleware(request) {
  const token = request.cookies.get("auth_token")?.value;

  // No login cookie
  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  try {
    // Verify token
    await jwtVerify(token, secret);

    // User is authenticated
    return NextResponse.next();
  } catch (error) {
    // Invalid or expired token
    const response = NextResponse.redirect(
      new URL("/login", request.url)
    );

    // Remove invalid cookie
    response.cookies.delete("auth_token");

    return response;
  }
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/roadmap/:path*",
  ],
};