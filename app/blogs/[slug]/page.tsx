import { BlogDetail } from "@/components/blog/blog-detail";
import { getBlogBySlug } from "@/lib/actions/blog";
import { notFound } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Home, FileText, Rss, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const publicNavItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "All Blogs",
    href: "/blogs",
    icon: FileText,
  },
  {
    title: "Recent Posts",
    href: "/blogs?filter=recent",
    icon: Calendar,
  },
  {
    title: "Categories",
    href: "/blogs?view=categories",
    icon: Tag,
  },
];

interface BlogSlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogSlugPage({ params }: BlogSlugPageProps) {
  const { slug } = await params;

  try {
    const blog = await getBlogBySlug(slug);

    return (
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="relative h-8 w-8">
                <Image
                  src="/images/favicon.png"
                  alt="BlogFlow Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-md"
                />
              </div>
              <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden">
                BlogFlow
              </h1>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {publicNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <Link href={item.href}>
                            <Icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="p-2">
              <Separator className="mb-2" />

              <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center">
                <Rss className="h-5 w-5" />
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium">Stay Updated</p>
                  <p className="text-xs text-muted-foreground">
                    Follow our latest posts
                  </p>
                </div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          {/* Header with Sidebar Toggle */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1" />
          </header>

          {/* Main Content */}
          <main className="flex-1 space-y-4 p-6">
            <BlogDetail blog={blog} showBackButton={true} backUrl="/blogs" />
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  } catch (error) {
    console.error("Failed to fetch blog:", error);
    notFound();
  }
}

// Generate static params for better performance (optional)
export async function generateStaticParams() {
  // This could be implemented to pre-generate static pages
  // For now, we'll use dynamic rendering
  return [];
}
