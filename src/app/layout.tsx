import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://roleflow.site"),
  title: {
    default: "RoleFlow — Advanced AI Assistant & Engineering Platform",
    template: "%s | RoleFlow",
  },
  description:
    "RoleFlow is an advanced AI assistant and engineering platform created by Jordan Daniels. Featuring live code previews, multi-step reasoning models, persistent memory, and developer APIs.",
  keywords: [
    "RoleFlow",
    "RoleFlow AI",
    "AI Assistant",
    "AI Code Execution",
    "AI Live Preview",
    "Jordan Daniels",
    "Apex 1.0",
    "Omni 1.0",
    "Genesis 1.5",
    "Flash 2.0",
    "LLM Reasoning",
    "AI Software Engineering",
  ],
  authors: [{ name: "Jordan Daniels", url: "https://roleflow.site" }],
  creator: "Jordan Daniels",
  publisher: "RoleFlow",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "RoleFlow — Advanced AI Assistant & Engineering Platform",
    description:
      "Advanced AI assistant created by Jordan Daniels. Powered by high-speed neural clusters with real-time code previews.",
    url: "https://roleflow.site",
    siteName: "RoleFlow",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://roleflow.site/assets/catalog-meet-roleflow.jpg",
        width: 1024,
        height: 572,
        alt: "RoleFlow AI — Thinking, writing, building",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RoleFlow — Advanced AI Assistant & Engineering Platform",
    description: "Advanced AI platform with live code execution previews and persistent memory.",
    images: ["https://roleflow.site/assets/catalog-meet-roleflow.jpg"],
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }, { url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before first paint so the saved theme never flashes. Reads "light" | "dark" | "system".
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem("roleflow_theme") || "system";
    var dark = t === "dark" || (t !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

const schemaData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "RoleFlow",
      "applicationCategory": "DeveloperApplication, BusinessApplication",
      "operatingSystem": "All",
      "url": "https://roleflow.site",
      "description":
        "RoleFlow is an advanced AI assistant and reasoning platform with live code execution previews, persistent memory, and developer APIs.",
      "author": {
        "@type": "Person",
        "name": "Jordan Daniels",
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
    },
    {
      "@type": "Organization",
      "name": "RoleFlow",
      "url": "https://roleflow.site",
      "logo": "https://roleflow.site/icon.png",
      "founder": {
        "@type": "Person",
        "name": "Jordan Daniels",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body className="min-h-screen bg-app text-ink antialiased">{children}</body>
    </html>
  );
}
