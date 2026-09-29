export interface User {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  profile_image: string | null;
}

export interface UserBrief {
  id: number;
  username: string;
  bio: string | null;
  profile_image: string | null;
  is_following: boolean;
}

export interface ProfileData {
  id: number;
  username: string;
  bio: string | null;
  profile_image: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
}

export interface Post {
  id: number;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  author_id: number;
  author_username: string;
  author_image: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
  hashtags: string[];
}

export interface Comment {
  id: number;
  content: string;
  user_id: number;
  post_id: number;
  username: string;
  user_image: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  type: "like" | "follow" | "comment" | string;
  message: string;
  is_read: boolean;
  created_at: string;
  post_id: number | null;
  sender_username: string | null;
  sender_image: string | null;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  user: UserBrief;
  last_message: string;
  last_message_at: string;
  last_sender_id: number;
  unread_count: number;
}

export interface TrendingHashtag {
  name: string;
  posts_count: number;
}
