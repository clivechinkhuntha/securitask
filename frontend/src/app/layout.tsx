import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Securitask",
  description: "Finance and operations management for Securitask.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
