import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import { timeAgo } from "./utils";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage } from "../services/api";
import type { Comment } from "../types";

interface CommentSectionProps {
  postId: number;
  onCountChange: (count: number) => void;
}

const CommentSection = ({ postId, onCountChange }: CommentSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Comment[]>(`/comments/post/${postId}`)
      .then((response) => setComments(response.data))
      .catch(() => setError("Unable to load comments"))
      .finally(() => setLoading(false));
  }, [postId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;

    try {
      const response = await api.post<Comment>(`/comments/post/${postId}`, {
        content: text,
      });
      const next = [...comments, response.data];

      setComments(next);
      onCountChange(next.length);
      setText("");
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to add comment"));
    }
  };

  const remove = async (commentId: number) => {
    try {
      await api.delete(`/comments/${commentId}`);
      const next = comments.filter((item) => item.id !== commentId);

      setComments(next);
      onCountChange(next.length);
    } catch (err) {
      setError(errorMessage(err, "Unable to delete comment"));
    }
  };

  return (
    <div className="comments">
      {loading && <p className="muted">Loading comments...</p>}

      {comments.map((comment) => (
        <div className="comment" key={comment.id}>
          <Avatar
            username={comment.username}
            image={comment.user_image}
            size={32}
          />
          <div className="comment-body">
            <p>
              <Link to={`/profile/${comment.username}`}>
                <strong>@{comment.username}</strong>
              </Link>{" "}
              {comment.content}
            </p>
            <span>
              {timeAgo(comment.created_at)}
              {user?.id === comment.user_id && (
                <button
                  className="link-btn"
                  onClick={() => remove(comment.id)}
                >
                  Delete
                </button>
              )}
            </span>
          </div>
        </div>
      ))}

      {!loading && comments.length === 0 && (
        <p className="muted">No comments yet. Start the conversation.</p>
      )}

      {error && <div className="error-message">{error}</div>}

      <form className="comment-form" onSubmit={submit}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Add a comment..."
          maxLength={1000}
        />
        <button className="btn btn-primary" disabled={!text.trim()}>
          Post
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
