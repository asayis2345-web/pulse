import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  profiles?: Profile;
};

export type Like = {
  id: string;
  post_id: string;
  user_id: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  profiles?: Profile;
};

export type Story = {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  profiles?: Profile;
};

export type Server = {
  id: string;
  name: string;
  icon_url: string | null;
  owner_id: string;
  created_at: string;
};

export type Channel = {
  id: string;
  server_id: string;
  name: string;
  created_at: string;
};

export type Message = {
  id: string;
  channel_id: string;
  user_id: string;
  text: string;
  created_at: string;
  profiles?: Profile;
};

export type DmConversation = {
  id: string;
  created_at: string;
};

export type DmMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  text: string;
  created_at: string;
};
