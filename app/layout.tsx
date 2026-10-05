import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Platafolio",
  description: "A personal weekly money tracker.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Bebas+Neue&family=Chewy&family=Oswald:wght@600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
