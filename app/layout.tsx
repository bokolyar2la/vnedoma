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
  openGraph: {
    title: "Вне дома — занятия, кружки и события в Туле",
    description:
      "Игры, танцы, прогулки, мастер-классы, клубы и встречи в Туле, куда можно прийти одному и оказаться среди людей.",
    url: "https://vnedoma.com",
    siteName: "Вне дома",
    locale: "ru_RU",
    type: "website"
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
