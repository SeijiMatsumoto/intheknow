import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const INTERNAL_EMAIL = "seijim27@gmail.com";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/inngest(.*)",
  "/api/webhooks(.*)",
]);

const isInternalRoute = createRouteMatcher(["/internal(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isInternalRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const hasAccess = user.emailAddresses.some(
      (e) => e.emailAddress === INTERNAL_EMAIL,
    );
    if (!hasAccess) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
