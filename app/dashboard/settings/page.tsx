"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Save, Globe, Bell, Shield, Palette } from "lucide-react";

export default function SettingsPage() {
  const [blogTitle, setBlogTitle] = useState("BlogFlow");
  const [blogDescription, setBlogDescription] = useState(
    "A platform for creating and sharing amazing blog posts"
  );
  const [blogUrl, setBlogUrl] = useState("https://myblog.com");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("America/New_York");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [commentNotifications, setCommentNotifications] = useState(true);

  // Privacy settings
  const [blogVisibility, setBlogVisibility] = useState("public");
  const [commentModeration, setCommentModeration] = useState(true);

  const handleSave = () => {
    // In a real app, this would save to your backend
    console.log("Settings saved!");
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your blog preferences and configuration.
        </p>
      </div>

      {/* Blog Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Blog Settings</CardTitle>
          </div>
          <CardDescription>
            Configure your blog&apos;s basic information and appearance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="blog-title">Blog Title</Label>
              <Input
                id="blog-title"
                value={blogTitle}
                onChange={(e) => setBlogTitle(e.target.value)}
                placeholder="Enter your blog title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-url">Blog URL</Label>
              <Input
                id="blog-url"
                value={blogUrl}
                onChange={(e) => setBlogUrl(e.target.value)}
                placeholder="https://yourblog.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-description">Blog Description</Label>
            <Textarea
              id="blog-description"
              value={blogDescription}
              onChange={(e) => setBlogDescription(e.target.value)}
              placeholder="Describe what your blog is about"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time
                  </SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose how you want to be notified about activity on your blog.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your blog activity
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get push notifications for important updates
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Comment Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone comments on your posts
              </p>
            </div>
            <Switch
              checked={commentNotifications}
              onCheckedChange={setCommentNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Privacy & Security</CardTitle>
          </div>
          <CardDescription>
            Control who can see and interact with your blog.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="blog-visibility">Blog Visibility</Label>
            <Select value={blogVisibility} onValueChange={setBlogVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    Public
                    <Badge variant="secondary">Recommended</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Public blogs can be found by search engines and anyone with the
              link.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Comment Moderation</Label>
              <p className="text-sm text-muted-foreground">
                Require approval before comments are published
              </p>
            </div>
            <Switch
              checked={commentModeration}
              onCheckedChange={setCommentModeration}
            />
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize the look and feel of your blog.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Theme customization features coming soon! You&apos;ll be able to
            customize colors, fonts, and layout options.
          </div>
          <Button variant="outline" disabled>
            Customize Theme
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <Button onClick={handleSave} className="min-w-32">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
