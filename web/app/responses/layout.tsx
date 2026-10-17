import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Responses · Kotu Feedback",
  robots: { index: false, follow: false },
};

export default function ResponsesLayout({ children }: LayoutProps<"/responses">) {
  return children;
}
