import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import CommentSection from "./CommentSection";
import Modal from "./Modal";
import UserRow from "./UserRow";
import { renderContent, timeAgo } from "./utils";
import { useAuth } from "../context/AuthContext";
import api, { mediaUrl } from "../services/api";
import type { Post, UserBrief } from "../types";

interface PostCardProps {
  post: Post;
  onDelete?: (postId: number) => void;
  startExpanded?: boolean;
}

const PostCard = ({ post: initial, onDelete, startExpanded }: PostCardProps) => {
  const { user } = useAuth();
  const [post, setPost] = useState(initial);
  const [showComments, setShowComments] = useState(!!startExpanded);
  const [likers, setLikers] = useState<UserBrief[] | null>(null);

  useEffect(() => setPost(initial), [initial]);

  const toggleLike = async () => {
    // Optimistic update, corrected by the server response
    setPost((current) => ({
      ...current,
      liked_by_me: !current.liked_by_me,
      likes_count: current.likes_count + (current.liked_by_me ? -1 : 1),
    }));

    try {
      const response = await api.post(`/posts/${post.id}/like`);

      setPost((current) => ({
        ...current,
        liked_by_me: response.data.liked,
        likes_count: response.data.likes_count,
      }));
    } catch {
      setPost(initial);
    }
  };

  const openLikers = async () => {
    if (post.likes_count === 0) return;

    try {
      const response = await api.get<UserBrief[]>(`/posts/${post.id}/likes`);
      setLikers(response.data);
    } catch (error) {
      console.error("Failed to load likes", error);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await api.delete(`/posts/${post.id}`);
      onDelete?.(post.id);
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  };

  return (
    <article className="card post-card">
      <div className="post-header">
        <Link to={`/profile/${post.author_username}`}>
          <Avatar username={post.author_username} image={post.author_image} />
        </Link>

        <div className="post-author">
          <Link to={`/profile/${post.author_username}`}>
            <strong>@{post.author_username}</strong>
          </Link>
          <Link to={`/post/${post.id}`}>
            <span>{timeAgo(post.created_at)}</span>
          </Link>
        </div>

        {user?.id === post.author_id && (
          <button className="link-btn danger" onClick={remove}>
            Delete
          </button>
        )}
      </div>

      {post.content && (
        <p className="post-content">{renderContent(post.content)}</p>
      )}

      {post.media_url && post.media_type === "image" && (
        <img className="post-media" src={mediaUrl(post.media_url)} alt="Post" />
      )}

      {post.media_url && post.media_type === "video" && (
        <video className="post-media" src={mediaUrl(post.media_url)} controls />
      )}

      <div className="post-actions">
        <button
          className={`action-btn ${post.liked_by_me ? "liked" : ""}`}
          onClick={toggleLike}
          aria-label="Like"
        >
          {post.liked_by_me ? "♥" : "♡"}
        </button>

        <button
          className="action-btn"
          onClick={() => setShowComments((value) => !value)}
          aria-label="Comments"
        >
          💬
        </button>
      </div>

      <div className="post-counts">
        <button className="link-btn" onClick={openLikers}>
          {post.likes_count} {post.likes_count === 1 ? "like" : "likes"}
        </button>
        <button
          className="link-btn"
          onClick={() => setShowComments((value) => !value)}
        >
          {post.comments_count}{" "}
          {post.comments_count === 1 ? "comment" : "comments"}
        </button>
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          onCountChange={(count) =>
            setPost((current) => ({ ...current, comments_count: count }))
          }
        />
      )}

      {likers && (
        <Modal title="Liked by" onClose={() => setLikers(null)}>
          {likers.map((liker) => (
            <UserRow
              key={liker.id}
              user={liker}
              onNavigate={() => setLikers(null)}
              onFollowChange={(id, isFollowing) =>
                setLikers((list) =>
                  list
                    ? list.map((item) =>
                        item.id === id
                          ? { ...item, is_following: isFollowing }
                          : item
                      )
                    : list
                )
              }
            />
          ))}
        </Modal>
      )}
    </article>
  );
};

export default PostCard;
