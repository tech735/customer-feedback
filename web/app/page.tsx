import { BrandHeader, SiteFooter } from "@/components/brand-header";
import { FeedbackForm } from "@/components/feedback-form";

export default function Home() {
  return (
    <>
      <BrandHeader title="Customer Experience & Feedback" />
      <main className="mx-3 -mt-16 sm:mx-auto sm:-mt-20 sm:w-full sm:max-w-xl">
        <div className="rounded-2xl bg-card shadow-[0_1px_2px_rgb(14_1_147/0.06),0_8px_24px_rgb(14_1_147/0.08)]">
          <FeedbackForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
