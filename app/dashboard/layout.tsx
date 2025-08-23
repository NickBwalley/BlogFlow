import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
