// Shapes shared by the server (database) and the admin pages.

export type ResponseImage = {
  id: string;
  // Served only to a signed-in admin, by app/api/admin/images/[id]/route.ts.
  url: string;
  name: string;
};

export type FeedbackResponse = {
  id: number;
  timestamp: string;
  name: string;
  contact: string;
  campus: string;
  location: string;
  shareType: string;
  products: string[];
  concernArea: string;
  feedback: string;
  images: ResponseImage[];
};
