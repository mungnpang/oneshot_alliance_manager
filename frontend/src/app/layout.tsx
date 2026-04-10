import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/** Sans-serif widely used in English UI/dashboards (readability and clean look) */
const inter = Inter({
  variable: "--font-ui-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-ui-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oneshot",
  description: "Kingshot alliance tools",
};

/** API origin for early DNS + TLS (cuts queueing on first fetch to backend). */
function apiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:8000";
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const origin = apiOrigin();
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href={origin} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={origin} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
