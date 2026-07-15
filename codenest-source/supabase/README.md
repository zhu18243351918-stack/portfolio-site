# Supabase setup

1. Open the project SQL Editor and run `setup.sql` once.
2. Open Authentication > Users and create the portfolio administrator account.
3. Copy that user's UID and add it to `public.portfolio_admins` from the SQL Editor.
4. Sign in from the website editor with that administrator email and password.

The public website can read `portfolio_content` and `portfolio-assets`. Only users listed in `portfolio_admins` can insert or update content and upload images. Keep the project `secret` and `service_role` keys private.
