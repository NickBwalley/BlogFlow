"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CreditCard, TrendingUp } from "lucide-react";
import { getAdminAnalytics } from "@/lib/actions/admin";

interface AnalyticsData {
  totalUsers: number;
  totalBlogs: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
}

interface AnalyticsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

function AnalyticsCard({
  title,
  value,
  icon: Icon,
  description,
}: AnalyticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminHomePage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalBlogs: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getAdminAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your platform&apos;s performance and metrics.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse w-20" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform&apos;s performance and metrics.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Users"
          value={analytics.totalUsers}
          icon={Users}
          description="Registered platform users"
        />
        <AnalyticsCard
          title="Total Blogs"
          value={analytics.totalBlogs}
          icon={FileText}
          description="Published blog posts"
        />
        <AnalyticsCard
          title="Total Subscriptions"
          value={analytics.totalSubscriptions}
          icon={CreditCard}
          description="All subscription records"
        />
        <AnalyticsCard
          title="Active Subscriptions"
          value={analytics.activeSubscriptions}
          icon={TrendingUp}
          description="Currently active paid plans"
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User Growth</span>
              <span className="text-sm text-muted-foreground">
                {analytics.totalUsers} total users
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Content Creation</span>
              <span className="text-sm text-muted-foreground">
                {analytics.totalBlogs} blog posts published
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Subscription Rate</span>
              <span className="text-sm text-muted-foreground">
                {analytics.totalSubscriptions > 0
                  ? Math.round(
                      (analytics.activeSubscriptions /
                        analytics.totalSubscriptions) *
                        100
                    )
                  : 0}
                % active subscription rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Use the sidebar to navigate to:
            </p>
            <ul className="text-sm space-y-1">
              <li>• Manage users and profiles</li>
              <li>• Review and moderate blogs</li>
              <li>• Monitor subscription activity</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
