"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { BlogFormData, Blog } from "@/types/blog";
import { createBlog, updateBlog } from "@/lib/actions/blog";
import { ArrowLeft, Save, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Dropzone, DropzoneContent } from "@/components/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getBlogImageUrl } from "@/lib/utils/image-utils";
import { DEFAULT_BLOG_IMAGE } from "@/lib/utils/default-image";

interface BlogFormProps {
  blog?: Blog;
  mode: "create" | "edit";
}

export function BlogForm({ blog, mode }: BlogFormProps) {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const [formData, setFormData] = useState<BlogFormData>({
    title: blog?.title || "",
    subtitle: blog?.subtitle || "",
    image: blog?.image || "",
    image_path: blog?.image_path || "",
    content: blog?.content || "",
    author: blog?.author || "",
  });

  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dropzone configuration
  const dropzoneProps = useSupabaseUpload({
    bucketName: "blog-images",
    path: userId || "anonymous",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxFiles: 1,
    maxFileSize: 5 * 1024 * 1024, // 5MB to match migration
    upsert: true, // Allow overwriting existing files
  });

  // Function to detect if content is markdown
  const isMarkdownContent = (content: string): boolean => {
    if (!content) return false;

    // Check for common markdown patterns
    const markdownPatterns = [
      /^#{1,6}\s+/m, // Headers (# ## ### etc)
      /\*\*.*?\*\*/, // Bold text
      /\*.*?\*/, // Italic text
      /^\s*[-*+]\s+/m, // Unordered lists
      /^\s*\d+\.\s+/m, // Ordered lists
      /\[.*?\]\(.*?\)/, // Links
      /```[\s\S]*?```/, // Code blocks
      /`.*?`/, // Inline code
    ];

    return markdownPatterns.some((pattern) => pattern.test(content));
  };

  // Memoize the dropzone reset function to avoid dependency issues
  const resetDropzone = useCallback(() => {
    dropzoneProps.setFiles([]);
    // Reset upload state
    if (dropzoneProps.setErrors) {
      dropzoneProps.setErrors([]);
    }
  }, [dropzoneProps.setFiles, dropzoneProps.setErrors]);

  // Reset dropzone when blog data changes (for edit mode)
  useEffect(() => {
    if (blog && mode === "edit") {
      resetDropzone();
    }
  }, [blog?.id, mode, resetDropzone]);

  // Memoize the upload success handler
  const handleUploadSuccess = useCallback(() => {
    if (dropzoneProps.isSuccess && dropzoneProps.files.length > 0) {
      const uploadedFile = dropzoneProps.files[0];
      // The file gets uploaded with the original name in the user's folder
      const imagePath = `${userId || "anonymous"}/${uploadedFile.name}`;
      setFormData((prev) => ({
        ...prev,
        image_path: imagePath,
        image: "", // Clear any previous URL since we're using storage now
      }));
      toast.success("Image uploaded successfully!");

      // Clear the dropzone files after successful upload and form update
      setTimeout(() => {
        dropzoneProps.setFiles([]);
      }, 1000);
    }
  }, [
    dropzoneProps.isSuccess,
    dropzoneProps.files,
    dropzoneProps.setFiles,
    userId,
  ]);

  // Handle successful upload
  useEffect(() => {
    handleUploadSuccess();
  }, [handleUploadSuccess]);

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
        // Prepare form data with default image if no image is provided
        const blogData = {
          ...formData,
          image:
            formData.image || formData.image_path
              ? formData.image
              : DEFAULT_BLOG_IMAGE,
        };

        if (mode === "create") {
          await createBlog(blogData);
          toast.success("Blog post created successfully!");
          router.push(`/dashboard`);
        } else if (blog) {
          await updateBlog(blog.id, blogData);
          toast.success("Blog post updated successfully!");
          router.push("/dashboard");
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
        <Link href="/dashboard">
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

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>Cover Image</Label>

              {/* Show current image if it exists and no new upload in progress */}
              {(formData.image || formData.image_path) &&
                dropzoneProps.files.length === 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      Current image:
                    </p>
                    <div className="relative max-w-xs h-32 border rounded">
                      <Image
                        src={
                          formData.image ||
                          getBlogImageUrl(formData.image_path) ||
                          ""
                        }
                        alt="Cover preview"
                        fill
                        className="object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          image: "",
                          image_path: "",
                        }));
                        dropzoneProps.setFiles([]);
                        toast.success("Image removed");
                      }}
                      className="mt-2"
                    >
                      Remove Image
                    </Button>
                  </div>
                )}

              {/* Dropzone - always show but with conditional text */}
              <Dropzone {...dropzoneProps} className="min-h-[120px]">
                {/* Custom empty state for blog images */}
                {dropzoneProps.files.length === 0 &&
                  !dropzoneProps.isSuccess && (
                    <div className="flex flex-col items-center gap-y-2">
                      <Upload size={20} className="text-muted-foreground" />
                      <p className="text-sm">
                        {formData.image || formData.image_path
                          ? "Replace cover image"
                          : "Upload cover image"}
                      </p>
                      <div className="flex flex-col items-center gap-y-1">
                        <p className="text-xs text-muted-foreground">
                          Drag and drop or{" "}
                          <a
                            onClick={() =>
                              dropzoneProps.inputRef.current?.click()
                            }
                            className="underline cursor-pointer transition hover:text-foreground"
                          >
                            select file
                          </a>{" "}
                          to upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Maximum file size: 5 MB
                        </p>
                      </div>
                    </div>
                  )}
                <DropzoneContent />
              </Dropzone>
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
              isMarkdown={isMarkdownContent(formData.content)}
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
          <Link href="/dashboard">
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
