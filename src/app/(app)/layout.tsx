
import { AppLayout } from "@/components/layout/app-layout";
import { ThemeProvider } from "@/components/theme-provider"; // Assuming you'll create this or install next-themes

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
      <AppLayout>{children}</AppLayout>
    </ThemeProvider>
  );
}
