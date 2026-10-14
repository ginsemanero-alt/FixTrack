# FixTrack — School Facility Maintenance and Repair Management

A QR-code based system where every classroom or facility has its own QR code.
Scanning it opens a report form with the location already filled in, so problems
are reported quickly. Staff track reports, repair history, and expenses in a dashboard.

**Stack:** React + TypeScript + Vite, Tailwind CSS v4, Supabase (PostgreSQL, RLS, Auth), Recharts, qrcode.react

## Features

| Module | What it does |
| --- | --- |
| QR code generator | Unique QR per facility; download as PNG label, copy link, or print all |
| Report form (public) | Opens on scan, location prefilled; category, description, urgency, photo; no login needed; returns a ticket number |
| Maintenance dashboard | Pending / In Progress / Resolved counts, urgent items, reports by category |
| Reports manager | Search, filter, change status, assign to a maintenance staff member (dropdown), delete (admin); resolving records the repair |
| Roles | `admin` (everything) and `maintenance` (Dashboard + their own assigned Reports only) |
| Staff page (admin) | List staff; in demo mode add/remove maintenance accounts |
| Ticket tracking (public) | `/#/track` — reporters enter their ticket number to see status, assignee and dates; no private data |
| Repair history | Timeline of repairs per facility, CSV export |
| Expense tracking | Monthly chart, totals by facility and by problem type, yearly filter, CSV export, print |
| Notifications | In-app alert and badge for staff when a new report arrives |

## Run it

```bash
npm install
npm run dev
```

With no `.env`, the app runs in **demo mode**: sample data is stored in the browser. Open `/#/login`
(the demo accounts are also listed on the login page):

| Email | Password | Role | Name |
| --- | --- | --- | --- |
| `admin@school.edu` | `admin123` | admin | Admin |
| `tonyo@school.edu` | `staff123` | maintenance | Mang Tonyo |
| `dan@school.edu` | `staff123` | maintenance | Electrician Dan |

## Roles

| | Admin | Maintenance |
| --- | --- | --- |
| Dashboard | Everything, incl. monthly expenses | Only reports assigned to them (no expense tile) |
| Reports | All reports; assign; change status; resolve; delete | Only reports **assigned to their full name**; change status; resolve (records the repair + cost). No assign, no delete |
| Facilities & QR | ✅ | ❌ |
| Repair History | ✅ | ❌ |
| Expenses | ✅ | ❌ |
| Staff | ✅ | ❌ |

Unauthorized routes redirect to the Dashboard and the sidebar hides links the role cannot use.
A signed-in user without a `profiles` row has no role and sees a "Walang access" screen.
Reports are matched to maintenance staff by **`full_name`**, so keep names unique.

## Public ticket tracking

After submitting a report, the reporter gets a ticket number and a **Track a report** link
(also in the report page header). `/#/track` and `/#/track/<ticket>` show facility, category,
urgency, status, assigned staff, and created / updated / resolved dates. The ticket is
case-insensitive. Contact info, reporter name, description and photo are never shown.

## Connect Supabase (real database)

1. Create a Supabase project.
2. Open the SQL Editor and run `supabase/schema.sql` (safe to re-run; it also upgrades an older install).
3. Authentication → Users → add each staff account (email + password). A `profiles` row is created
   automatically with role `maintenance` (least privilege).
4. Promote your first admin and set display names (these are the names used in "Assign to"):

   ```sql
   update public.profiles set role = 'admin' where email = 'admin@school.edu';
   update public.profiles set full_name = 'Mang Tonyo' where email = 'tonyo@school.edu';
   ```

   If you are upgrading an existing project, everyone who already had an account becomes
   `maintenance` until you run the first statement, so promote your admin right after running the schema.
5. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. `npm run dev` again, then log in.

Row Level Security:
- **Anyone (anon)**: read facilities, **insert** a Pending unassigned report, and call `track_report(ticket)`. The `reports` table itself is not readable by anon.
- **Admin**: full access to everything, including delete.
- **Maintenance**: read/update only reports whose `assigned_to` equals their `full_name` (they cannot reassign), and insert repairs for those reports. They cannot read repairs, write facilities, or delete anything.
- **profiles**: users read their own row; only admin reads/writes all rows.

In Supabase mode the Staff page is read-only (accounts are created in Supabase Auth and listed from `profiles`).

## Deploy

`npm run build` creates `dist/`. Host it on Vercel or Netlify and add the two env variables.
The QR codes encode the site's address, so **generate or print the QR codes after deploying**
(QR codes made on localhost only work on your own computer).

## Known limits

- Photos are compressed in the browser and stored in the database as text; fine for a school-scale system.
- Notifications are in-app only (the dashboard checks for new reports; it polls every 15 s with Supabase).
  Email/SMS alerts would need a server function.
- Demo-mode roles are enforced in the browser only (anyone can edit localStorage). Real enforcement is the Supabase RLS above.
- A maintenance user can technically update other columns (e.g. description, urgency) of their own assigned reports through the API; RLS limits *which rows*, not *which columns*.
- Maintenance staff are matched to reports by full name, not user id.
