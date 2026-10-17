"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  Loader2Icon,
  MapPinIcon,
  MessageSquareWarningIcon,
  ShirtIcon,
  SmileIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ChoiceCard } from "@/components/choice-card";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CONCERN_AREAS,
  LOCATIONS,
  PHONE_PATTERN,
  PRODUCTS,
  SHARE_TYPES,
  type Campus,
  type ShareType,
} from "@/lib/form-options";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  contact: string;
  campus: Campus | "";
  location: string;
  shareType: ShareType | "";
  products: string[];
  productOther: string;
  concernArea: string;
  feedback: string;
  images: File[];
};

const EMPTY: FormState = {
  name: "",
  contact: "",
  campus: "",
  location: "",
  shareType: "",
  products: [],
  productOther: "",
  concernArea: "",
  feedback: "",
  images: [],
};

const STEPS = [
  "About you",
  "Your campus",
  "What would you like to share?",
  "Tell us more",
] as const;

const SHARE_ICONS: Record<ShareType, React.ReactNode> = {
  "Share your Experience": <SmileIcon />,
  "Product Enquiry": <ShirtIcon />,
  "Concern about Services": <MessageSquareWarningIcon />,
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(step: number, s: FormState): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!s.name.trim()) e.name = "Please enter your name.";
    if (!s.contact.trim()) e.contact = "Please enter your phone number.";
    else if (!PHONE_PATTERN.test(s.contact.trim())) e.contact = "Please enter a valid phone number.";
  }
  if (step === 1) {
    if (!s.campus) e.campus = "Please choose your campus.";
    else if (!s.location) e.location = "Please choose a location.";
  }
  if (step === 2 && !s.shareType) e.shareType = "Please choose an option.";
  if (step === 3) {
    if (s.shareType === "Product Enquiry") {
      if (!s.products.length) e.products = "Please select at least one product.";
      else if (s.products.includes("Other") && !s.productOther.trim()) e.productOther = "Please tell us which product.";
    }
    if (s.shareType === "Concern about Services" && !s.concernArea) e.concernArea = "Please choose an option.";
    if (!s.feedback.trim()) e.feedback = "Please write a few words.";
  }
  return e;
}

function toFormData(s: FormState): FormData {
  const data = new FormData();
  data.set("name", s.name.trim());
  data.set("contact", s.contact.trim());
  data.set("campus", s.campus);
  data.set("location", s.location);
  data.set("shareType", s.shareType);
  data.set("feedback", s.feedback.trim());
  if (s.shareType === "Product Enquiry") {
    s.products.forEach((p) => data.append("products", p));
    if (s.products.includes("Other")) data.set("productOther", s.productOther.trim());
  }
  if (s.shareType === "Concern about Services") data.set("concernArea", s.concernArea);
  else s.images.forEach((file) => data.append("images", file));
  return data;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function FeedbackForm() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => {
      const next = { ...s, [key]: value };
      // Locations and products differ per campus.
      if (key === "campus" && value !== s.campus) Object.assign(next, { location: "", products: [], productOther: "" });
      return next;
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function goTo(next: number) {
    setStep(next);
    setErrors({});
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function next() {
    const found = validate(step, state);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = document.querySelector<HTMLElement>("[aria-invalid=true]");
      first?.focus();
      return;
    }
    if (step < STEPS.length - 1) return goTo(step + 1);

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", { method: "POST", body: toFormData(state) });
      const result = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !result.ok) throw new Error(result.error || `The server responded with ${res.status}.`);
      setDone(true);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      const message = err instanceof TypeError ? "Check your internet connection and try again." : (err as Error).message;
      toast.error("Your feedback wasn't submitted", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div ref={topRef} className="scroll-mt-4 px-6 py-12 text-center sm:px-10">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-accent text-primary animate-in zoom-in-50 duration-300">
          <CheckIcon className="size-8" strokeWidth={2.5} />
        </div>
        <h2 className="font-heading text-2xl font-semibold text-primary">Thank you, {state.name.split(" ")[0]}!</h2>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
          Your feedback has been submitted. Our team reads every response and will get back to you if needed.
        </p>
        <Button
          variant="outline"
          className="mt-8 h-11 px-5"
          onClick={() => {
            setState(EMPTY);
            setDone(false);
            setStep(0);
          }}
        >
          Send another response
        </Button>
      </div>
    );
  }

  const err = (key: keyof FormState) => (errors[key] ? { "aria-invalid": true, "aria-describedby": `${key}-error` } : {});

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
    >
      <div ref={topRef} className="scroll-mt-4 px-5 pt-6 sm:px-10 sm:pt-8">
        <div className="mb-2 flex items-center justify-between text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="normal-case">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5 bg-muted" />
        <h2 className="mt-6 font-heading text-xl font-semibold text-foreground sm:text-2xl">{STEPS[step]}</h2>
      </div>

      <div key={step} className="space-y-6 px-5 py-6 animate-in fade-in-0 slide-in-from-right-4 duration-300 sm:px-10">
        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                autoComplete="name"
                autoFocus
                value={state.name}
                onChange={(e) => update("name", e.target.value)}
                className="h-11 text-base"
                {...err("name")}
              />
              <FieldError id="name-error" message={errors.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Phone number</Label>
              <Input
                id="contact"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="e.g. +91 98765 43210"
                value={state.contact}
                onChange={(e) => update("contact", e.target.value)}
                className="h-11 text-base"
                {...err("contact")}
              />
              <FieldError id="contact-error" message={errors.contact} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-medium">Campus</legend>
              <RadioGroup
                value={state.campus}
                onValueChange={(v) => update("campus", v as Campus)}
                className="grid grid-cols-2 gap-3"
                {...err("campus")}
              >
                {(["SNS", "TKH"] as const).map((c) => (
                  <ChoiceCard
                    key={c}
                    value={c}
                    title={c}
                    icon={<span className="font-heading text-sm font-semibold">{c[0]}</span>}
                    {...err("campus")}
                  />
                ))}
              </RadioGroup>
              <FieldError id="campus-error" message={errors.campus} />
            </fieldset>

            {state.campus && (
              <fieldset className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                <legend className="mb-3 text-sm font-medium">Location</legend>
                <RadioGroup
                  value={state.location}
                  onValueChange={(v) => update("location", v)}
                  className="grid gap-2 sm:grid-cols-2"
                  {...err("location")}
                >
                  {LOCATIONS[state.campus].map((loc) => (
                    <ChoiceCard key={loc} value={loc} title={loc} icon={<MapPinIcon />} className="py-3" {...err("location")} />
                  ))}
                </RadioGroup>
                <FieldError id="location-error" message={errors.location} />
              </fieldset>
            )}
          </>
        )}

        {step === 2 && (
          <fieldset className="space-y-3">
            <legend className="sr-only">What would you like to share?</legend>
            <RadioGroup
              value={state.shareType}
              onValueChange={(v) => update("shareType", v as ShareType)}
              className="gap-3"
              {...err("shareType")}
            >
              {SHARE_TYPES.map((t) => (
                <ChoiceCard
                  key={t.value}
                  value={t.value}
                  title={t.label}
                  description={t.description}
                  icon={SHARE_ICONS[t.value]}
                  {...err("shareType")}
                />
              ))}
            </RadioGroup>
            <FieldError id="shareType-error" message={errors.shareType} />
          </fieldset>
        )}

        {step === 3 && state.shareType === "Product Enquiry" && state.campus && (
          <fieldset className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <legend className="text-sm font-medium">
                Products <span className="font-normal text-muted-foreground">· select all that apply</span>
              </legend>
              {state.products.length > 0 && (
                <span className="shrink-0 text-xs font-medium text-primary">{state.products.length} selected</span>
              )}
            </div>
            {PRODUCTS[state.campus].map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{group.title}</p>
                <ToggleGroup
                  type="multiple"
                  value={state.products.filter((p) => group.products.some((g) => g.value === p))}
                  onValueChange={(values) =>
                    update("products", [
                      ...state.products.filter((p) => !group.products.some((g) => g.value === p)),
                      ...values,
                    ])
                  }
                  className="w-full flex-wrap gap-2"
                  aria-label={group.title}
                >
                  {group.products.map((p) => (
                    <ToggleGroupItem
                      key={p.value}
                      value={p.value}
                      aria-invalid={!!errors.products || undefined}
                      className="group/chip h-auto min-h-10 rounded-full border border-input bg-card px-3.5 py-2 text-sm font-normal whitespace-normal hover:border-[#B9B7CC] hover:bg-[#FAFAFE] data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:font-medium data-[state=on]:text-primary"
                    >
                      <CheckIcon className="-ml-0.5 hidden size-3.5 group-data-[state=on]/chip:block" strokeWidth={3} />
                      {p.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            ))}
            <FieldError id="products-error" message={errors.products} />
            {state.products.includes("Other") && (
              <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                <Label htmlFor="productOther">Which other product?</Label>
                <Input
                  id="productOther"
                  value={state.productOther}
                  onChange={(e) => update("productOther", e.target.value)}
                  className="h-11 text-base"
                  {...err("productOther")}
                />
                <FieldError id="productOther-error" message={errors.productOther} />
              </div>
            )}
          </fieldset>
        )}

        {step === 3 && state.shareType === "Concern about Services" && (
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-medium">What is it about?</legend>
            <RadioGroup
              value={state.concernArea}
              onValueChange={(v) => update("concernArea", v)}
              className="grid grid-cols-2 gap-3"
              {...err("concernArea")}
            >
              {CONCERN_AREAS.map((a) => (
                <ChoiceCard key={a} value={a} title={a} {...err("concernArea")} />
              ))}
            </RadioGroup>
            <FieldError id="concernArea-error" message={errors.concernArea} />
          </fieldset>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <Label htmlFor="feedback">
              {state.shareType === "Product Enquiry"
                ? "Your enquiry"
                : state.shareType === "Concern about Services"
                  ? "What happened?"
                  : "Your experience"}
            </Label>
            <Textarea
              id="feedback"
              rows={5}
              value={state.feedback}
              onChange={(e) => update("feedback", e.target.value)}
              placeholder={
                state.shareType === "Product Enquiry"
                  ? "Sizes, quantities, or anything else you'd like to know"
                  : "Share as much detail as you like"
              }
              className="min-h-32 text-base"
              {...err("feedback")}
            />
            <FieldError id="feedback-error" message={errors.feedback} />
          </div>
        )}

        {step === 3 && state.shareType !== "Concern about Services" && (
          <ImageUpload
            label={state.shareType === "Product Enquiry" ? "Product photos" : "Photos"}
            files={state.images}
            onChange={(files) => update("images", files)}
          />
        )}
      </div>

      {/* Sticky on phones so the next step is always one tap away. */}
      <div className="sticky bottom-0 flex gap-3 rounded-b-2xl border-t bg-card/95 px-5 py-4 backdrop-blur sm:static sm:border-t-0 sm:bg-card sm:px-10 sm:pt-2 sm:pb-8">
        {step > 0 && (
          <Button type="button" variant="outline" className="h-12 px-4" onClick={() => goTo(step - 1)} disabled={submitting}>
            <ArrowLeftIcon />
            <span className="sr-only sm:not-sr-only">Back</span>
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting}
          className={cn(
            "h-12 flex-1 rounded-xl font-heading text-base font-semibold shadow-[0_6px_16px_rgb(2_1_155/0.25)] hover:bg-primary/90",
          )}
        >
          {submitting ? (
            <>
              <Loader2Icon className="animate-spin" /> Submitting…
            </>
          ) : step === STEPS.length - 1 ? (
            "Submit feedback"
          ) : (
            <>
              Continue <ArrowRightIcon />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
