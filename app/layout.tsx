import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "@/lib/session-provider";
import { QueryProvider } from "@/lib/query-provider";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "AI Email Organizer",
  description: "Organize your emails with AI-powered categorization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={` antialiased`}
      >
        <SessionProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster />
              <AuthGuard>
                {children}
              </AuthGuard>
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
