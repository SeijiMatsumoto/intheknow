import { headers } from "next/headers";
import { Webhook } from "svix";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ClerkWebhookEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("user.created"),
    data: z.object({ id: z.string() }),
  }),
]);

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();

  let event: z.infer<typeof ClerkWebhookEventSchema>;
  try {
    const verified = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
    event = ClerkWebhookEventSchema.parse(verified);
  } catch {
    return new Response("Invalid webhook signature or payload", {
      status: 400,
    });
  }

  if (event.type === "user.created") {
    await prisma.userPlan.create({
      data: {
        userId: event.data.id,
        plan: "free",
      },
    });
  }

  return new Response(null, { status: 200 });
}
