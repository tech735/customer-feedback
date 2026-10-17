# Kotu Customer Feedback

The customer feedback form (`/`) and the admin Responses page (`/responses`),
built with Next.js, Tailwind CSS and shadcn/ui. Everything runs in this one
app: responses are saved in a SQLite database and photos in an uploads folder,
both on the server. No outside services.

## Run locally

```bash
cp .env.example .env.local   # then set the admin password and SESSION_SECRET
npm install
npm run dev
```

Open <http://localhost:3000> for the form and <http://localhost:3000/responses>
for the admin page.

## Deploy to a server

Needs Node.js 22.13 or newer (it uses Node's built-in SQLite, so there is
nothing to compile) and a disk that keeps its files. Node prints an
"SQLite is an experimental feature" notice at startup; it is harmless.

On Windows, stop `npm run dev` before running `npm ci` or `npm install`:
the running server keeps some files open, and npm can't replace them.

```bash
npm ci
npm run build
npm start            # listens on port 3000; set PORT to change it
```

Set these environment variables on the server (see `.env.example`):

| Variable | What it is |
|---|---|
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | The admin login for `/responses`. Changing the password signs everyone out. |
| `SESSION_SECRET` | A long random string that signs the login cookie. |
| `DATA_DIR` | Optional. Where the database and photos are kept (default `./data`). |

Keep the app running with a process manager (e.g. `pm2 start npm --name feedback -- start`)
and put it behind a reverse proxy such as nginx with HTTPS. The login cookie
is HTTPS-only in production; set `COOKIE_SECURE=false` only if you must serve
over plain HTTP. If nginx is in front, allow uploads of up to 30 MB
(`client_max_body_size 30m;`), since a response can include 5 photos of 5 MB.

**Back up `DATA_DIR`.** It holds every response (`feedback.db`) and photo (`uploads/`).

## Where things are

| Path | What it is |
|---|---|
| `app/page.tsx`, `components/feedback-form.tsx` | The 4-step feedback form |
| `lib/form-options.ts` | Campuses, locations, products, share types |
| `app/api/feedback/route.ts` | Receives form submissions |
| `lib/server/submission.ts` | Server-side checks of a submission, including photo type |
| `lib/server/db.ts` | Database and photo storage |
| `lib/server/auth.ts`, `app/responses/actions.ts` | Admin login and session cookie |
| `app/responses/page.tsx`, `components/admin/` | Admin login screen and dashboard |
| `app/api/admin/images/[id]/route.ts` | Serves photos to signed-in admins only |
| `components/ui/` | shadcn/ui components |
