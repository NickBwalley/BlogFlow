import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
