import type { Metadata } from "next";

import { AppHeader } from "@/components/AppHeader";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockBrief",
  description: "근거 기반 국내 주식 종목 검토 후보 서비스",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AppHeader />
        <DisclaimerBanner />
        <main>{children}</main>
      </body>
    </html>
  );
}
