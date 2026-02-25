import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "نظام إدارة الباصات المدرسية",
  description: "نظام ذكي لتسجيل الحضور والغياب في الباصات المدرسية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* ده اللي هيحل مشكلة الضيق على الموبايل */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${cairo.variable} antialiased min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-black`}
      >
        {children}
      </body>
    </html>
  );
}