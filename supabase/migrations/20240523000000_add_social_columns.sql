/*
  Migration: Add social columns to profiles table
  Description: Adds instagram, telegram, and phone columns to profiles table if they don't exist.
  Created at: 2024-05-23
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS telegram TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;
