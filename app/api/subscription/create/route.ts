import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createSubscription } from "@/lib/subscription/actions";
import { z } from "zod";

const createSubscriptionSchema = z.object({
  planType: z.enum(["free", "starter", "pro"]),
  paymentData: z.object({
    cardNumber: z.string().min(1, "Card number is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    cvc: z.string().min(1, "CVC is required"),
    holderName: z.string().min(1, "Card holder name is required"),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSubscriptionSchema.parse(body);

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create subscription with mockup payment processing
    const result = await createSubscription(
      user.id,
      validatedData.planType,
      validatedData.paymentData
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      message: `Successfully subscribed to ${validatedData.planType} plan!`,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
