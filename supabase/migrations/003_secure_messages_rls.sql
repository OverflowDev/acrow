-- Block all direct client access to the messages table.
-- Messages are now served exclusively through the /api/messages/[escrowId] route
-- which uses the service role key (bypasses RLS) after verifying wallet ownership.

DROP POLICY IF EXISTS "messages_read_all"   ON messages;
DROP POLICY IF EXISTS "messages_insert_all" ON messages;

-- No SELECT via anon key
CREATE POLICY "messages_no_read" ON messages
  FOR SELECT USING (false);

-- No INSERT via anon key (all writes go through the API route)
CREATE POLICY "messages_no_insert" ON messages
  FOR INSERT WITH CHECK (false);
