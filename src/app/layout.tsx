import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

/* Body font: clean, modern, geometric sans */
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* Display font: elegant serif for headlines */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "AI Staffing Agency - We don't sell AI tools. We staff AI.",
  description:
    "Digital employees for accounting, legal, and property management firms. Not another software tool - a new kind of team member.",
  openGraph: {
    title: "AI Staffing Agency",
    description:
      "We place digital employees that replace high-cost, low-value human hours with high-speed, low-cost AI roles.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
