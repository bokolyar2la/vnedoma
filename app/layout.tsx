import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { YandexMetrika } from "@/components/YandexMetrika";
import { YandexMetrikaRouteTracker } from "@/components/YandexMetrikaRouteTracker";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vlyudi.ru"),
  title: {
    default: "Влюди — куда сходить и чем заняться в Туле",
    template: "%s | Влюди"
  },
  description:
    "Игры, танцы, прогулки, мастер-классы, клубы и встречи в Туле, куда можно прийти одному и оказаться среди людей.",
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: [
      { url: "/favicon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "Влюди — куда сходить и чем заняться в Туле",
    description:
      "Игры, танцы, прогулки, мастер-классы, клубы и встречи в Туле, куда можно прийти одному и оказаться среди людей.",
    url: "https://vlyudi.ru",
    siteName: "Влюди",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Влюди — социальные активности в Туле"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Влюди — куда сходить и чем заняться в Туле",
    description:
      "Игры, танцы, прогулки, мастер-классы, клубы и встречи в Туле, куда можно прийти одному и оказаться среди людей.",
    images: ["/opengraph-image"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">
        <YandexMetrika />
        <YandexMetrikaRouteTracker />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
