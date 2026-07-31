import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "إبـــن عثمـــان - نظام إدارة المخزون",
  description: "نظام متكامل لإدارة المخازن والمبيعات والمشتريات والتقارير",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          backgroundColor: "#0f1117",
          color: "#e2e8f0",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
