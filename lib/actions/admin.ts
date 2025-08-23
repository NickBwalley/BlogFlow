"use server";

import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";

// Helper function to check if current user is admin
async function checkAdminAccess() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

// Admin action to get all users (bypasses RLS using service role for admin operations)
export async function getAdminUsers() {
  // First check admin access using a direct query approach
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  // Direct query to check admin status without triggering RLS policies
  const { data: adminCheck, error: adminError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (adminError || adminCheck?.role !== "admin") {
    redirect("/dashboard");
  }

  // Now fetch all users - this will work because the admin check was successful
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return data;
}

// Admin action to get all blogs
export async function getAdminBlogs() {
  await checkAdminAccess();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch blogs: ${error.message}`);
  }

  return data;
}

// Admin action to get all subscriptions with user email
export async function getAdminSubscriptions() {
  await checkAdminAccess();

  const supabase = await createClient();

  // Fetch subscriptions and profiles separately, then join them
  const [subscriptionsResult, profilesResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("user_id, email"),
  ]);

  if (subscriptionsResult.error) {
    throw new Error(
      `Failed to fetch subscriptions: ${subscriptionsResult.error.message}`
    );
  }

  if (profilesResult.error) {
    throw new Error(
      `Failed to fetch profiles: ${profilesResult.error.message}`
    );
  }

  // Create a map of user_id to email for quick lookup
  const emailMap = new Map(
    profilesResult.data?.map((profile) => [profile.user_id, profile.email]) ||
      []
  );

  // Join the data manually
  const subscriptionsWithEmail =
    subscriptionsResult.data?.map((subscription) => ({
      ...subscription,
      profiles: {
        email: emailMap.get(subscription.user_id) || "Unknown",
      },
    })) || [];

  return subscriptionsWithEmail;
}

// Admin action to get analytics data
export async function getAdminAnalytics() {
  await checkAdminAccess();

  const supabase = await createClient();

  // Fetch analytics data in parallel
  const [usersResult, blogsResult, subscriptionsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("blogs").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("status", { count: "exact" }),
  ]);

  if (usersResult.error) {
    throw new Error(
      `Failed to fetch users count: ${usersResult.error.message}`
    );
  }

  if (blogsResult.error) {
    throw new Error(
      `Failed to fetch blogs count: ${blogsResult.error.message}`
    );
  }

  if (subscriptionsResult.error) {
    throw new Error(
      `Failed to fetch subscriptions: ${subscriptionsResult.error.message}`
    );
  }

  // Count active subscriptions
  const activeSubscriptions =
    subscriptionsResult.data?.filter((sub) => sub.status === "active").length ||
    0;

  return {
    totalUsers: usersResult.count || 0,
    totalBlogs: blogsResult.count || 0,
    totalSubscriptions: subscriptionsResult.count || 0,
    activeSubscriptions,
  };
}

// Admin action to update user role
export async function updateUserRole(
  userId: string,
  newRole: "user" | "admin"
) {
  await checkAdminAccess();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`);
  }

  return data;
}

// Admin action to delete user profile
export async function deleteUserProfile(userId: string) {
  await checkAdminAccess();

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete user profile: ${error.message}`);
  }

  return { success: true };
}

// Helper function to check current user profile (for debugging)
// This function bypasses admin checks to avoid recursion
export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(`Authentication error: ${userError?.message || "No user"}`);
  }

  // Use a different approach to get profile - query as the user themselves
  // This should work with the basic user policies
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    throw new Error(
      `Profile error: ${profileError.message} (Code: ${profileError.code})`
    );
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile,
  };
}

// Bootstrap function to promote the current user to admin (when no admins exist yet)
export async function promoteToAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(`Authentication error: ${userError?.message || "No user"}`);
  }

  // Use the database function to promote user to admin
  const { data, error } = await supabase.rpc("promote_user_to_admin", {
    target_user_id: user.id,
  });

  if (error) {
    throw new Error(`Failed to promote to admin: ${error.message}`);
  }

  return { success: true, message: data };
}

// Function to check current admin status
export async function checkAdminStatus() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(`Authentication error: ${userError?.message || "No user"}`);
  }

  // Check the role field in profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isAdmin = !profileError && profile?.role === "admin";

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    isAdmin,
    canAccessAdmin: isAdmin,
  };
}
