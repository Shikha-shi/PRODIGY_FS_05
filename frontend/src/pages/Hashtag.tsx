import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import api from "../services/api";
import type { Post } from "../types";

const Hashtag = () => {
  const { name } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get<Post[]>(`/posts/hashtag/${name}`)
      .then((response) => !cancelled && setPosts(response.data))
      .catch((error) => console.error("Failed to load hashtag", error))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <div className="page narrow">
      <div className="page-title">
        <h1>#{name}</h1>
        <span className="muted">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </span>
      </div>

      {loading && <p className="muted">Loading...</p>}
      {!loading && posts.length === 0 && (
        <div className="card empty">
          <h2>No posts with this hashtag</h2>
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDelete={(id) => setPosts((list) => list.filter((p) => p.id !== id))}
        />
      ))}
    </div>
  );
};

export default Hashtag;
