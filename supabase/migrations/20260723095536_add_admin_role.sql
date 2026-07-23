/*
# Add admin role to profiles

1. Modified Tables
- `profiles`: added `is_admin` boolean column (default false)
2. Security
- No policy changes needed; is_admin is readable by all authenticated users (already have SELECT true)
- Only the user themselves can update their profile (existing policy)
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
