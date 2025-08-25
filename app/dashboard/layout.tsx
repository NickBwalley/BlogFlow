import { GlobalLayoutWrapper } from "@/components/layout/global-layout-wrapper";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <GlobalLayoutWrapper requireAuth>{children}</GlobalLayoutWrapper>;
}
