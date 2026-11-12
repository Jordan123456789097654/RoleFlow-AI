import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoleFlow · Independent AI Assistant",
  description: "Next-generation custom AI platform built by RoleFlow for general inquiry and high-precision software engineering.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#18181b] text-[#f3f3ee] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
