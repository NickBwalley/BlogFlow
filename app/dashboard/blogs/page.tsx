import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BlogList } from "@/components/blog/blog-list";
import { getUserBlogs } from "@/lib/actions/blog";
import { Plus } from "lucide-react";

export default async function BlogsPage() {
  const blogs = await getUserBlogs();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Blog Posts</h1>
          <p className="text-muted-foreground">
            Manage and organize your blog content.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/blogs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Blog List */}
      <Suspense fallback={<div>Loading blogs...</div>}>
        <BlogList blogs={blogs} showUserBlogs={true} />
      </Suspense>
    </div>
  );
}
