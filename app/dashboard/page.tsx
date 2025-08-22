"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BlogPostCard } from "@/components/blog-post-card";
import { BlogCreationModal } from "@/components/blog/blog-creation-modal";
import { getUserBlogs } from "@/lib/actions/blog";
import { getBlogImageWithDefault } from "@/lib/utils/default-image";
import { BlogListItem } from "@/types/blog";
import { Plus } from "lucide-react";

interface DashboardHomeProps {
  isModalOpen: boolean;
  handleModalClose: (open: boolean) => void;
  handleOpenModal: () => void;
  refreshTrigger: number;
}

function DashboardHome({
  isModalOpen,
  handleModalClose,
  handleOpenModal,
  refreshTrigger,
}: DashboardHomeProps) {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load blogs
  const loadBlogs = async () => {
    try {
      setIsLoading(true);
      const fetchedBlogs = await getUserBlogs();
      setBlogs(fetchedBlogs);
    } catch (error) {
      console.error("Failed to load blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load blogs on component mount and when refresh is triggered
  useEffect(() => {
    loadBlogs();
  }, [refreshTrigger]);

  // Function to handle blog deletion
  const handleBlogDelete = () => {
    // Refresh the blogs list after deletion
    loadBlogs();
  };

  // Map blog data to BlogPostCard format
  const blogCardData = blogs.map((blog) => ({
    id: blog.id,
    title: blog.title,
    excerpt:
      blog.subtitle || "Learn the fundamentals of modern web development",
    category: "Design", // Default category for now
    publishedAt: blog.created_at,
    views: 0, // Default views
    comments: 0, // Default comments
    status: "published" as const,
    imageUrl: getBlogImageWithDefault(blog.image, blog.image_path),
    authorName: blog.author,
    slug: blog.slug,
    showDelete: true,
    onDelete: handleBlogDelete,
    content: blog.content, // Pass content for dynamic read time calculation
  }));

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Blog Posts</h1>
            <p className="text-muted-foreground">
              Manage and organize your blog content.
            </p>
          </div>
          <Button onClick={handleOpenModal}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading blogs...</p>
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
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
          <Button onClick={handleOpenModal}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No blog posts yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first blog post.
            </p>
            <Button onClick={handleOpenModal}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Blog
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
        <Button onClick={handleOpenModal}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Blog Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogCardData.map((blog) => (
          <BlogPostCard key={blog.id} {...blog} />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to handle modal close and refresh
  const handleModalClose = (open: boolean) => {
    console.log("handleModalClose called with open:", open);
    setIsModalOpen(open);
    if (!open) {
      // Trigger refresh when modal closes (in case a new blog was created)
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  // Function to handle modal opening
  const handleOpenModal = () => {
    console.log("handleOpenModal called, setting modal to true");
    setIsModalOpen(true);
    console.log("Modal state after setting:", true);
  };

  return (
    <>
      <DashboardHome
        isModalOpen={isModalOpen}
        handleModalClose={handleModalClose}
        handleOpenModal={handleOpenModal}
        refreshTrigger={refreshTrigger}
      />

      {/* Blog Creation Modal - Single instance rendered here to avoid duplicates */}
      <BlogCreationModal open={isModalOpen} onOpenChange={handleModalClose} />
    </>
  );
}
