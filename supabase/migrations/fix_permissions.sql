-- Enable RLS for talents and generations tables
ALTER TABLE talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to select from talents (for their own data or public data)
-- Assuming users can see their own talents, and potentially public ones if needed
CREATE POLICY "Allow select for authenticated users on talents"
ON talents
FOR SELECT
TO authenticated
USING (true); -- Or stricter: (auth.uid() = user_id OR for_sale = true)

-- Policy to allow authenticated users to insert into talents
CREATE POLICY "Allow insert for authenticated users on talents"
ON talents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to select from generations
CREATE POLICY "Allow select for authenticated users on generations"
ON generations
FOR SELECT
TO authenticated
USING (true); -- Or stricter: (auth.uid() = user_id OR is_public = true)

-- Policy to allow authenticated users to insert into generations
CREATE POLICY "Allow insert for authenticated users on generations"
ON generations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Additional policies for update/delete if needed
CREATE POLICY "Allow update for owners on talents"
ON talents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow delete for owners on talents"
ON talents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow update for owners on generations"
ON generations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow delete for owners on generations"
ON generations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
