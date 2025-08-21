import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";
import { DEFAULT_BLOG_IMAGE } from "@/lib/utils/default-image";

// Schema for the generated blog post
const BlogPostSchema = z.object({
  title: z.string().describe("A compelling, SEO-friendly blog post title"),
  subtitle: z
    .string()
    .describe("A brief subtitle or tagline that complements the title"),
  content: z
    .string()
    .describe(
      "The complete blog post content in markdown format, well-structured with headings, paragraphs, and proper formatting"
    ),
  author: z.string().describe("Author name for the blog post"),
});

export async function POST(req: Request) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== "string") {
      return Response.json(
        { success: false, error: "Description is required" },
        { status: 400 }
      );
    }

    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user profile for author name
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, email")
      .eq("user_id", user.id)
      .single();

    const authorName =
      profile?.first_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Anonymous";

    // Generate blog content using AI
    const { object: blogPost } = await generateObject({
      model: openai("gpt-4o"),
      schema: BlogPostSchema,
      prompt: `Create a comprehensive, engaging blog post based on this description: "${description}"

Requirements:
- Write in a conversational, engaging tone
- Include proper headings and subheadings
- Use markdown formatting
- Make it SEO-friendly
- Target length: 800-1500 words
- Include actionable insights or takeaways
- Make it valuable and informative for readers
- Author name should be: ${authorName}

Structure the content with:
1. An engaging introduction
2. Well-organized main sections with clear headings
3. Practical examples or tips where relevant
4. A strong conclusion

Format the content in markdown with proper headings (##, ###), bullet points, and emphasis where appropriate.`,
      maxTokens: 4000,
      temperature: 0.7,
    });

    // Generate a unique slug from the title
    const baseSlug = blogPost.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Check for existing slugs and make unique
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data: existingBlog } = await supabase
        .from("blogs")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existingBlog) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Save the generated blog post to the database
    const { data: newBlog, error: insertError } = await supabase
      .from("blogs")
      .insert({
        title: blogPost.title,
        slug: slug,
        subtitle: blogPost.subtitle,
        content: blogPost.content,
        author: blogPost.author,
        image: DEFAULT_BLOG_IMAGE, // Use default image for AI-generated posts
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving blog post:", insertError);
      return Response.json(
        { success: false, error: "Failed to save blog post" },
        { status: 500 }
      );
    }

    // Revalidate the dashboard page
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/blogs");

    return Response.json({
      success: true,
      data: newBlog,
    });
  } catch (error) {
    console.error("Error generating blog post:", error);
    return Response.json(
      { success: false, error: "Failed to generate blog post" },
      { status: 500 }
    );
  }
}
