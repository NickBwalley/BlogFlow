import { GlobalLayoutWrapper } from "@/components/layout/global-layout-wrapper";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return <GlobalLayoutWrapper requireAuth>{children}</GlobalLayoutWrapper>;
}
