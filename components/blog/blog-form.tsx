"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { BlogFormData, Blog } from "@/types/blog";
import { createBlog, updateBlog } from "@/lib/actions/blog";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

interface BlogFormProps {
  blog?: Blog;
  mode: "create" | "edit";
}

export function BlogForm({ blog, mode }: BlogFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<BlogFormData>({
    title: blog?.title || "",
    subtitle: blog?.subtitle || "",
    image: blog?.image || "",
    content: blog?.content || "",
    author: blog?.author || "",
  });

  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }

    if (!formData.author.trim()) {
      newErrors.author = "Author is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const newBlog = await createBlog(formData);
          toast.success("Blog post created successfully!");
          router.push(`/dashboard/blogs/${newBlog.id}`);
        } else if (blog) {
          await updateBlog(blog.id, formData);
          toast.success("Blog post updated successfully!");
        }
      } catch (error) {
        console.error("Failed to save blog:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save blog";
        toast.error(errorMessage);
        setErrors({
          general: errorMessage,
        });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/blogs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blogs
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "Create New Blog Post" : "Edit Blog Post"}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Blog Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter blog title"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                placeholder="Enter blog subtitle (optional)"
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
                placeholder="Enter author name"
                className={errors.author ? "border-red-500" : ""}
              />
              {errors.author && (
                <p className="text-sm text-red-500">{errors.author}</p>
              )}
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="image">Cover Image URL</Label>
              <Input
                id="image"
                type="url"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="Enter image URL (optional)"
              />
              {formData.image && (
                <div className="mt-2 relative max-w-xs h-32">
                  <Image
                    src={formData.image}
                    alt="Cover preview"
                    fill
                    className="object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Content *
              <span className="text-xs text-muted-foreground font-normal">
                Changes are saved locally - click &quot;Create Blog&quot; to
                save to database
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Start writing your blog post..."
            />
            {errors.content && (
              <p className="text-sm text-red-500 mt-2">{errors.content}</p>
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {errors.general && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{errors.general}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/blogs">
            <Button type="button" variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending
              ? "Saving..."
              : mode === "create"
              ? "Create Blog"
              : "Update Blog"}
          </Button>
        </div>
      </form>
    </div>
  );
}
