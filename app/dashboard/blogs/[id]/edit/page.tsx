import { BlogForm } from "@/components/blog/blog-form";
import { getBlog } from "@/lib/actions/blog";
import { notFound } from "next/navigation";

interface EditBlogPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params;

  try {
    const blog = await getBlog(id);
    return <BlogForm blog={blog} mode="edit" />;
  } catch (error) {
    console.error("Failed to fetch blog:", error);
    notFound();
  }
}
