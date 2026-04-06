import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const AUTH_ROUTES = ["/login", "/register"];
const PUBLIC_ROUTES = ["/"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Logged-in user trying to access login/register → send to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/home", req.nextUrl));
  }

  // Not logged in, not on a public/auth route → send to login
  if (!isLoggedIn && !isAuthRoute && !isPublicRoute) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};