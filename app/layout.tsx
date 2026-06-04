import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vnedoma.com"),
  title: {
    default: "Вне дома — занятия, кружки и события в Туле",
    template: "%s | Вне дома"
  },
  description:
    "Игры, танцы, прогулки, мастер-классы, клубы и встречи в Туле, куда можно прийти одному и оказаться среди людей.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Вне дома — занятия, кружки и события в Туле",
    description:
      "Игры, танцы, прогулки, мастер-классы, клубы и встречи в Туле, куда можно прийти одному и оказаться среди людей.",
    url: "https://vnedoma.com",
    siteName: "Вне дома",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Вне дома — социальные активности в Туле"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Вне дома — занятия, кружки и события в Туле",
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
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
