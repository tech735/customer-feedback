import { BrandHeader, SiteFooter } from "@/components/brand-header";

// The forms live at /sns and /tkh. This page deliberately links to neither,
// so a customer never sees the other school's form.
export default function Home() {
  return (
    <>
      <BrandHeader title="Customer Experience & Feedback" />
      <main className="mx-3 -mt-16 sm:mx-auto sm:-mt-20 sm:w-full sm:max-w-xl">
        <div className="rounded-2xl bg-card px-6 py-12 text-center shadow-[0_1px_2px_rgb(14_1_147/0.06),0_8px_24px_rgb(14_1_147/0.08)] sm:px-10">
          <h2 className="font-heading text-xl font-semibold text-foreground">Please use your school&apos;s feedback link</h2>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
            Open the link or scan the QR code shared by your school to give us your feedback.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
