import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { getSubscriptionUsage } from "@/lib/subscription/actions";

export async function GET() {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get subscription usage
    const usage = await getSubscriptionUsage(user.id);

    return NextResponse.json(usage);
  } catch (error) {
    console.error("Error fetching subscription usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription usage" },
      { status: 500 }
    );
  }
}
