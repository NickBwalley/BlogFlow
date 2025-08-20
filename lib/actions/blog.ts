"use server";

import { createClient } from "@/lib/server";
import { BlogInsert, BlogUpdate, BlogFormData } from "@/types/blog";
import { revalidatePath } from "next/cache";

export async function createBlog(formData: BlogFormData) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const blogData: BlogInsert = {
    title: formData.title,
    subtitle: formData.subtitle || null,
    image: formData.image || null,
    image_path: formData.image_path || null,
    content: formData.content,
    author: formData.author,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("blogs")
    .insert(blogData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create blog: ${error.message}`);
  }

  revalidatePath("/dashboard/blogs");
  return data;
}

export async function updateBlog(id: string, formData: BlogFormData) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const updateData: BlogUpdate = {
    title: formData.title,
    subtitle: formData.subtitle || null,
    image: formData.image || null,
    image_path: formData.image_path || null,
    content: formData.content,
    author: formData.author,
  };

  const { data, error } = await supabase
    .from("blogs")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id) // Ensure user can only update their own blogs
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update blog: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      "Blog not found or you do not have permission to update it"
    );
  }

  revalidatePath("/dashboard/blogs");
  revalidatePath(`/dashboard/blogs/${id}`);
  return data;
}

export async function deleteBlog(id: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("blogs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // Ensure user can only delete their own blogs

  if (error) {
    throw new Error(`Failed to delete blog: ${error.message}`);
  }

  revalidatePath("/dashboard/blogs");
  // Don't redirect here - let the component handle the navigation
}

export async function getBlog(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch blog: ${error.message}`);
  }

  return data;
}

export async function getBlogBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    throw new Error(`Failed to fetch blog: ${error.message}`);
  }

  return data;
}

export async function getBlogs(userId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("blogs")
    .select("id, title, slug, subtitle, image, author, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch blogs: ${error.message}`);
  }

  return data;
}

export async function getUserBlogs() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  return getBlogs(user.id);
}
