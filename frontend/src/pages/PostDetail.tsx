import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import api, { errorMessage } from "../services/api";
import type { Post } from "../types";

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Post>(`/posts/${postId}`)
      .then((response) => setPost(response.data))
      .catch((err) => setError(errorMessage(err, "Unable to load post")));
  }, [postId]);

  return (
    <div className="page narrow">
      <div className="page-title">
        <h1>Post</h1>
      </div>

      {error && <div className="card empty"><h2>{error}</h2></div>}
      {!post && !error && <p className="muted">Loading...</p>}

      {post && (
        <PostCard
          post={post}
          startExpanded
          onDelete={() => navigate("/home", { replace: true })}
        />
      )}
    </div>
  );
};

export default PostDetail;
