"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadProfileImage, deleteProfileImage } from "@/lib/actions/profile";
import { validateAvatarFile } from "@/lib/utils/avatar-utils";

interface ProfilePhotoUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userInitials: string;
  onAvatarUpdate: (newUrl: string | null) => void;
}

export function ProfilePhotoUpload({
  userId,
  currentAvatarUrl,
  userInitials,
  onAvatarUpdate,
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation before upload
    const validation = await validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadProfileImage(userId, file);

      if (result.success && result.url) {
        onAvatarUpdate(result.url);
        toast.success("Profile photo updated successfully!");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);

      // Enhanced error handling for different scenarios
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error(
          "Network error. Please check your connection and try again."
        );
      } else if (error instanceof Error && error.message.includes("413")) {
        toast.error(
          "File is too large. Please choose an image smaller than 2MB."
        );
      } else {
        toast.error("Failed to upload image. Please try again.");
      }
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    setIsRemoving(true);

    try {
      const result = await deleteProfileImage(userId);

      if (result.success) {
        onAvatarUpdate(null);
        toast.success("Profile photo removed successfully!");
      } else {
        toast.error(result.error || "Failed to remove photo");
      }
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove photo");
    } finally {
      setIsRemoving(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle drag and drop validation
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];

      // Validate the dropped file
      const validation = await validateAvatarFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // Create a mock input event and trigger upload
      const mockEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      handleFileUpload(mockEvent);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <div className="relative" onDragOver={handleDragOver} onDrop={handleDrop}>
        <Avatar
          className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={triggerFileInput}
        >
          <AvatarImage src={currentAvatarUrl || undefined} />
          <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Profile Picture</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={isUploading || isRemoving}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading ? "Uploading..." : "Upload New"}
          </Button>

          {currentAvatarUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemovePhoto}
              disabled={isUploading || isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {isRemoving ? "Removing..." : "Remove"}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP or GIF. Maximum size: 2MB.
        </p>
        <p className="text-xs text-red-500 font-medium">
          Files larger than 2MB will be rejected.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
