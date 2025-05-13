
import { AppLayout } from "@/components/layout/app-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { CallCenterProvider } from "@/contexts/CallCenterContext";

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CallCenterProvider>
        <AppLayout>{children}</AppLayout>
      </CallCenterProvider>
    </ThemeProvider>
  );
}
