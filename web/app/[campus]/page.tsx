import type { Metadata } from "next";
import { BrandHeader, SiteFooter } from "@/components/brand-header";
import { FeedbackForm } from "@/components/feedback-form";
import { CAMPUS_NAMES, type Campus } from "@/lib/form-options";

// One form per campus, so customers only ever see their own school's
// locations and products. Any other path is a 404.
const CAMPUS_BY_SLUG: Record<string, Campus> = { sns: "SNS", tkh: "TKH" };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(CAMPUS_BY_SLUG).map((campus) => ({ campus }));
}

export async function generateMetadata({ params }: PageProps<"/[campus]">): Promise<Metadata> {
  const campus = CAMPUS_BY_SLUG[(await params).campus];
  return { title: `Customer Experience & Feedback · ${CAMPUS_NAMES[campus]}` };
}

export default async function CampusFeedback({ params }: PageProps<"/[campus]">) {
  const campus = CAMPUS_BY_SLUG[(await params).campus];
  return (
    <>
      <BrandHeader title="Customer Experience & Feedback">
        <p className="mt-2 font-medium text-white/80 sm:text-lg">{CAMPUS_NAMES[campus]}</p>
      </BrandHeader>
      <main className="mx-3 -mt-16 sm:mx-auto sm:-mt-20 sm:w-full sm:max-w-xl">
        <div className="rounded-2xl bg-card shadow-[0_1px_2px_rgb(14_1_147/0.06),0_8px_24px_rgb(14_1_147/0.08)]">
          <FeedbackForm campus={campus} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
