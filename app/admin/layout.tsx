import { GlobalLayoutWrapper } from "@/components/layout/global-layout-wrapper";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <GlobalLayoutWrapper requireAuth>{children}</GlobalLayoutWrapper>;
}
