import { AdminLayoutWrapper } from "@/components/layout/admin-layout-wrapper";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
