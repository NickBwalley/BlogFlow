import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";
import { DEFAULT_BLOG_IMAGE } from "@/lib/utils/default-image";
import {
  getSubscriptionUsage,
  incrementAIPostUsage,
} from "@/lib/subscription/actions";
import { validateWordLimit, truncateToWordLimit } from "@/lib/utils/word-count";

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

    // Check AI post usage and limits
    const subscriptionUsage = await getSubscriptionUsage(user.id);

    if (!subscriptionUsage.canGenerateAI) {
      return Response.json(
        {
          success: false,
          error: `You've reached your AI post limit (${subscriptionUsage.aiPostsLimit}). Upgrade your plan to generate more AI posts.`,
          limitReached: true,
          usage: subscriptionUsage,
        },
        { status: 403 }
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

    // Extract word count preference from description if specified
    const wordCountMatch = description.match(/(\d+)\s*words?/i);
    const requestedWordCount = wordCountMatch
      ? parseInt(wordCountMatch[1])
      : null;

    // Use requested word count or default to 300 as a guideline
    const targetWordCount = requestedWordCount || 300;
    const isCustomWordCount = requestedWordCount !== null;

    // Generate blog content using AI
    const { object: blogPost } = await generateObject({
      model: openai("gpt-4o"),
      schema: BlogPostSchema,
      temperature: 0.7,
      prompt: `Create an engaging blog post based on this description: "${description}"

REQUIREMENTS:
- Target approximately ${targetWordCount} words for the content${
        isCustomWordCount
          ? " (as specifically requested)"
          : " (default guideline)"
      }
- Write in a conversational, engaging tone
- Include proper headings and subheadings
- Use markdown formatting
- Make it SEO-friendly
- Include actionable insights or takeaways
- Make it valuable and informative for readers
- Author name should be: ${authorName}

Structure the content appropriately for ${targetWordCount} words:
${
  targetWordCount <= 300
    ? `
1. A brief engaging introduction (50-75 words)
2. 1-2 main sections with clear headings (150-200 words total)
3. A concise conclusion with key takeaway (25-50 words)`
    : targetWordCount <= 600
    ? `
1. An engaging introduction (75-100 words)
2. 2-3 main sections with clear headings (400-450 words total)
3. A strong conclusion with key takeaways (50-75 words)`
    : `
1. A compelling introduction (100-150 words)
2. 3-4 well-developed main sections with clear headings
3. A comprehensive conclusion with actionable takeaways
4. Include examples, case studies, or detailed explanations as appropriate`
}

Format the content in markdown with proper headings (##, ###), bullet points, and emphasis where appropriate.
${
  isCustomWordCount
    ? "Honor the specific word count requested by the user."
    : "Aim for around 300 words as a good balance of conciseness and value."
}`,
    });

    // Validate content length - only truncate if extremely excessive
    const wordValidation = validateWordLimit(blogPost.content, targetWordCount);
    let finalContent = blogPost.content;

    // Only truncate if content is more than 50% over the target (to prevent abuse)
    const maxAllowedWords = Math.max(targetWordCount * 1.5, 500); // At least 500 words max

    if (wordValidation.wordCount > maxAllowedWords) {
      console.warn(
        `Generated content significantly exceeded target ${targetWordCount} words (${wordValidation.wordCount} words). Truncating to ${maxAllowedWords} words...`
      );
      finalContent = truncateToWordLimit(blogPost.content, maxAllowedWords);
    }

    console.log(
      `Generated blog post: ${
        wordValidation.wordCount
      } words (target: ${targetWordCount}${
        isCustomWordCount ? " - user specified" : " - default"
      })`
    );

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
        content: finalContent, // Use the word-limit validated content
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

    // Increment AI post usage counter
    const incrementSuccess = await incrementAIPostUsage(user.id);
    if (!incrementSuccess) {
      console.warn(
        "Failed to increment AI post usage counter for user:",
        user.id
      );
      // Continue anyway since the blog was created successfully
    }

    // Revalidate the dashboard page
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/blogs");

    // Get updated usage for response
    const updatedUsage = await getSubscriptionUsage(user.id);

    return Response.json({
      success: true,
      data: newBlog,
      usage: updatedUsage,
    });
  } catch (error) {
    console.error("Error generating blog post:", error);
    return Response.json(
      { success: false, error: "Failed to generate blog post" },
      { status: 500 }
    );
  }
}
