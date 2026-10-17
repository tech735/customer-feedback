# Save form responses to Google Sheets

Each submission becomes a row in a Google Sheet. Uploaded images are saved to a
Google Drive folder, and their links go in the row. It takes about 10 minutes
and is free.

## 1. Create the Sheet

1. Go to <https://sheets.google.com> and create a blank spreadsheet.
2. Name it, e.g. **Customer Feedback Responses**.

You don't need to add headers. The script creates a **Responses** tab with
headers on the first submission.

## 2. Add the script

1. In the Sheet, open **Extensions → Apps Script**.
2. Delete everything in `Code.gs` and paste in the full contents of
   [`Code.gs`](Code.gs) from this folder.
   If you created the script at script.google.com instead of from the Sheet,
   paste the Sheet's ID (the part of its URL between `/d/` and `/edit`) into
   `SPREADSHEET_ID` at the top.
3. Click **Save** (💾). You can rename the project, e.g. *Feedback Form Backend*.

## 3. Deploy it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear ⚙ next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description:** `Feedback form`
   - **Execute as:** **Me** (your account)
   - **Who has access:** **Anyone**
4. Click **Deploy**.
5. Google asks you to **Authorize access**. Choose your account.
   - If you see *"Google hasn't verified this app"*, click **Advanced →
     Go to … (unsafe)**. This is normal for your own scripts.
   - Allow access to Sheets and Drive. The script needs these to write rows
     and save images.
6. Copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy…/exec`

To check it works, open that URL in your browser. You should see
`{"ok":true,"message":"Feedback endpoint is running."}`.

## 4. Connect the form

In `index.html`, paste the URL into `data-endpoint`:

```html
<form id="feedback-form" data-endpoint="https://script.google.com/macros/s/AKfy…/exec" enctype="multipart/form-data" novalidate>
```

Save, open the form, and submit a test response. A new row should appear in
the **Responses** tab within a few seconds.

## Sheet columns

| Column | What it holds |
|---|---|
| Timestamp | When the form was submitted |
| Name, Contact | Personal information |
| Campus, Location | SNS/TKH and the chosen location |
| What would you like to share? | Share your Experience / Product Enquiry / Concern about Services |
| Product | Products ticked, comma-separated (e.g. `SNS Blazer, Thermals, Other: Cap`) |
| Concern Area | Team Member / Other (service concerns only) |
| Feedback / Remarks | The text the customer wrote |
| Images | Google Drive links to uploaded images, one per line |

Images are saved in the **Customer Feedback Uploads** folder in your Google
Drive. Only you, and people you share the folder with, can open them.

Limits: up to 5 images per submission, 5 MB each.

## Changing the script later

When you edit `Code.gs` in Apps Script, the live URL keeps running the old code
until you redeploy:

**Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy.**

This keeps the same URL, so you don't need to change `index.html`. If you use
**New deployment** instead, you get a new URL and must update `data-endpoint`.

## Troubleshooting

- **"Something went wrong while submitting"**: open the browser console (F12)
  to see the error. Check that the URL ends in `/exec` (not `/dev`) and that
  access is set to **Anyone**.
- **No row appears**: in Apps Script, open **Executions** in the left sidebar
  to see each request and any errors.
- **Edited the script but nothing changed**: you need to redeploy as a new
  version (see above).
