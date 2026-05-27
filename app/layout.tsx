import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vnedoma.com"),
  title: {
    default: "Вне дома — занятия, кружки и события в Туле",
    template: "%s | Вне дома"
  },
  description: "Кружки, секции, мастер-классы, лекции и клубы в Туле.",
  openGraph: {
    title: "Вне дома — занятия, кружки и события в Туле",
    description: "Кружки, секции, мастер-классы, лекции и клубы в Туле.",
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
