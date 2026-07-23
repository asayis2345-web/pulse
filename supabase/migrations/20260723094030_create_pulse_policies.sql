/*
# Pulse — RLS Policies

Adds all row-level security policies for the Pulse platform.
All tables already exist from the previous migration.
*/

-- profiles
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- posts
DROP POLICY IF EXISTS "select_posts" ON posts;
CREATE POLICY "select_posts" ON posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_posts" ON posts;
CREATE POLICY "insert_own_posts" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_posts" ON posts;
CREATE POLICY "delete_own_posts" ON posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- likes
DROP POLICY IF EXISTS "select_likes" ON likes;
CREATE POLICY "select_likes" ON likes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_likes" ON likes;
CREATE POLICY "insert_own_likes" ON likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_likes" ON likes;
CREATE POLICY "delete_own_likes" ON likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- comments
DROP POLICY IF EXISTS "select_comments" ON comments;
CREATE POLICY "select_comments" ON comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_comments" ON comments;
CREATE POLICY "insert_own_comments" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_comments" ON comments;
CREATE POLICY "delete_own_comments" ON comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- stories
DROP POLICY IF EXISTS "select_stories" ON stories;
CREATE POLICY "select_stories" ON stories FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_stories" ON stories;
CREATE POLICY "insert_own_stories" ON stories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_stories" ON stories;
CREATE POLICY "delete_own_stories" ON stories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- story_views
DROP POLICY IF EXISTS "select_story_views" ON story_views;
CREATE POLICY "select_story_views" ON story_views FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_story_views" ON story_views;
CREATE POLICY "insert_own_story_views" ON story_views FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- servers
DROP POLICY IF EXISTS "select_servers" ON servers;
CREATE POLICY "select_servers" ON servers FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = servers.id AND server_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_servers" ON servers;
CREATE POLICY "insert_own_servers" ON servers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_servers" ON servers;
CREATE POLICY "update_own_servers" ON servers FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_servers" ON servers;
CREATE POLICY "delete_own_servers" ON servers FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- server_members
DROP POLICY IF EXISTS "select_server_members" ON server_members;
CREATE POLICY "select_server_members" ON server_members FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM server_members sm2 WHERE sm2.server_id = server_members.server_id AND sm2.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_server_members" ON server_members;
CREATE POLICY "insert_own_server_members" ON server_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_server_members" ON server_members;
CREATE POLICY "delete_own_server_members" ON server_members FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- channels
DROP POLICY IF EXISTS "select_channels" ON channels;
CREATE POLICY "select_channels" ON channels FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = channels.server_id AND server_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_channels" ON channels;
CREATE POLICY "insert_channels" ON channels FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM servers WHERE servers.id = channels.server_id AND servers.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_channels" ON channels;
CREATE POLICY "delete_channels" ON channels FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM servers WHERE servers.id = channels.server_id AND servers.owner_id = auth.uid())
  );

-- messages
DROP POLICY IF EXISTS "select_messages" ON messages;
CREATE POLICY "select_messages" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM channels ch
      JOIN server_members sm ON sm.server_id = ch.server_id
      WHERE ch.id = messages.channel_id AND sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM channels ch
      JOIN server_members sm ON sm.server_id = ch.server_id
      WHERE ch.id = messages.channel_id AND sm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- dm_conversations
DROP POLICY IF EXISTS "select_dm_conversations" ON dm_conversations;
CREATE POLICY "select_dm_conversations" ON dm_conversations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM dm_members WHERE dm_members.conversation_id = dm_conversations.id AND dm_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_dm_conversations" ON dm_conversations;
CREATE POLICY "insert_dm_conversations" ON dm_conversations FOR INSERT
  TO authenticated WITH CHECK (true);

-- dm_members
DROP POLICY IF EXISTS "select_dm_members" ON dm_members;
CREATE POLICY "select_dm_members" ON dm_members FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM dm_members dm2 WHERE dm2.conversation_id = dm_members.conversation_id AND dm2.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_dm_members" ON dm_members;
CREATE POLICY "insert_own_dm_members" ON dm_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- dm_messages
DROP POLICY IF EXISTS "select_dm_messages" ON dm_messages;
CREATE POLICY "select_dm_messages" ON dm_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM dm_members WHERE dm_members.conversation_id = dm_messages.conversation_id AND dm_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_dm_messages" ON dm_messages;
CREATE POLICY "insert_own_dm_messages" ON dm_messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM dm_members WHERE dm_members.conversation_id = dm_messages.conversation_id AND dm_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_dm_messages" ON dm_messages;
CREATE POLICY "delete_own_dm_messages" ON dm_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
