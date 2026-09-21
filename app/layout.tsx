import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UtahQDRO.com",
  description:
    "Guided QDRO preparation for Utah divorce cases with secure intake, document previews, payment, signatures, and status tracking.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
