"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BlogForm } from "@/components/blog/blog-form";
import { BlogCreationModal } from "@/components/blog/blog-creation-modal";

export default function NewBlogPage() {
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Show modal first when the page loads
    setShowModal(true);
  }, []);

  const handleModalClose = (open: boolean) => {
    setShowModal(open);
    if (!open) {
      // If modal is closed without selecting, redirect back to dashboard
      router.push("/dashboard");
    }
  };

  const handleCreateFromScratch = () => {
    setShowModal(false);
    setShowForm(true);
  };

  if (showForm) {
    return <BlogForm mode="create" />;
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Choose how to create your blog post...
        </p>
      </div>
      <BlogCreationModal
        open={showModal}
        onOpenChange={handleModalClose}
        onCreateFromScratch={handleCreateFromScratch}
      />
    </>
  );
}
