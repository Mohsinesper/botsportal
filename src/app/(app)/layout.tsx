
import { AppLayout } from "@/components/layout/app-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { CallCenterProvider } from "@/contexts/CallCenterContext";
import { AuthProvider } from "@/contexts/AuthContext"; // Import AuthProvider

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
      <AuthProvider> {/* Add AuthProvider here */}
        <CallCenterProvider>
          <AppLayout>{children}</AppLayout>
        </CallCenterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
