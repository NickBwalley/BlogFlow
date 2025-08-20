import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";

interface BlogPostCardProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: number;
  views: number;
  comments: number;
  status: "published" | "draft" | "scheduled";
  imageUrl?: string;
}

export function BlogPostCard({
  id,
  title,
  excerpt,
  category,
  publishedAt,
  readTime,
  views,
  comments,
  status,
  imageUrl,
}: BlogPostCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
            <Badge className={`text-xs capitalize ${getStatusColor(status)}`}>
              {status}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {imageUrl && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={title}
              width={400}
              height={225}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            <Link href={`/dashboard/blogs/${id}`}>{title}</Link>
          </h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
            {excerpt}
          </p>
        </div>
      </CardHeader>

      <CardFooter className="pt-0">
        <div className="w-full space-y-3">
          <div className="flex items-center text-xs text-muted-foreground gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(publishedAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readTime} min read
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-muted-foreground gap-3">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {views.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {comments}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/blogs/${id}/edit`}>Edit</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/blog/${id}`} target="_blank">
                  View
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
