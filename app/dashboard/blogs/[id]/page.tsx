import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BlogDetail } from "@/components/blog/blog-detail";
import { getBlog } from "@/lib/actions/blog";
import { notFound } from "next/navigation";
import { Edit, Eye } from "lucide-react";

interface BlogPageProps {
  params: Promise<{ id: string }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { id } = await params;

  try {
    const blog = await getBlog(id);

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Header Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/blogs/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/blogs/${blog.slug}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                View Public
              </Link>
            </Button>
          </div>

          {/* Blog Content */}
          <BlogDetail
            blog={blog}
            showBackButton={true}
            backUrl="/dashboard/blogs"
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch blog:", error);
    notFound();
  }
}
