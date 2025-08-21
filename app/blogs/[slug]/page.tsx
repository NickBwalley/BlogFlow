import { BlogDetail } from "@/components/blog/blog-detail";
import { getBlogBySlug } from "@/lib/actions/blog";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";

interface BlogSlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogSlugPage({ params }: BlogSlugPageProps) {
  const { slug } = await params;

  try {
    const blog = await getBlogBySlug(slug);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <Header variant="light" />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <BlogDetail blog={blog} showBackButton={true} backUrl="/blogs" />
          </div>
        </main>
      </div>
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
