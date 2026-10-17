// Choices offered by the feedback form. Product values are what lands in the
// Sheet, so keep them stable; labels are what customers see.

export type Campus = "SNS" | "TKH";

export const LOCATIONS: Record<Campus, string[]> = {
  SNS: ["SNS Gurgaon", "SNS Chennai", "SNS Noida", "SNS Faridabad"],
  TKH: ["Gurgaon", "Pune", "Bangalore"],
};

export type ProductGroup = { title: string; products: { value: string; label: string }[] };

function group(title: string, campus: Campus, labels: string[], extra: string[] = []): ProductGroup {
  return {
    title,
    products: [
      ...labels.map((label) => ({ value: `${campus} ${label}`, label })),
      ...extra.map((value) => ({ value, label: value })),
    ],
  };
}

export const PRODUCTS: Record<Campus, ProductGroup[]> = {
  SNS: [
    group("Winter", "SNS", ["Fleece Track Pant", "Blazer", "Fullsleeve Jacket", "Sleeveless Jacket", "Sweatshirt"]),
    group("Summer & Mid-Season", "SNS", [
      "Formal Trouser (B)", "Formal Trouser (G)",
      "Halfsleeve Formal Shirt (B)", "Halfsleeve Formal Shirt (G)",
      "Fullsleeve Formal Shirt (B)", "Fullsleeve Formal Shirt (G)",
      "House T-Shirt H/S", "House T-Shirt Fullsleeves",
      "Skirt", "Track Pant Summer", "Track Shorts",
    ]),
    group("Accessories & Others", "SNS", ["Belt", "Socks", "Tie"], ["Thermals", "Other"]),
  ],
  TKH: [
    group("Winter", "TKH", [
      "Fleece Track Pant", "Winter Smart Jacket (U)", "Winter Smart Jacket (M)",
      "Winter Smart Jacket (F)", "Lightweight Jacket",
    ]),
    group("Summer & Mid-Season", "TKH", [
      "Formal Trouser (B)", "Formal Trouser (G)",
      "Halfsleeve Formal Shirt (B)", "Halfsleeve Formal Shirt (G)",
      "Fullsleeve Formal Shirt (B)", "Fullsleeve Formal Shirt (G)",
      "House T-Shirt H/S", "House T-Shirt Fullsleeves",
      "Skirt", "Track Pant Summer", "Track Shorts",
    ]),
    group("Accessories & Others", "TKH", ["Belt", "Socks"], ["Thermals", "Other"]),
  ],
};

export const SHARE_TYPES = [
  {
    value: "Share your Experience",
    label: "Share your experience",
    description: "Tell us what you liked, or what we could do better.",
  },
  {
    value: "Product Enquiry",
    label: "Product enquiry",
    description: "Ask about sizes, availability or a specific item.",
  },
  {
    value: "Concern about Services",
    label: "Concern about services",
    description: "Let us know about an issue with our team or service.",
  },
] as const;

export type ShareType = (typeof SHARE_TYPES)[number]["value"];

export const CONCERN_AREAS = ["Team Member", "Other"] as const;

export const PHONE_PATTERN = /^\+?[0-9\s-]{10,15}$/;

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
