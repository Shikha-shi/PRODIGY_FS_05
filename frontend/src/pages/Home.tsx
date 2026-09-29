import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import UserRow from "../components/UserRow";
import api from "../services/api";
import type { Post, UserBrief } from "../types";

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState<UserBrief[]>([]);
  const [scope, setScope] = useState<"all" | "following">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get<Post[]>("/posts", { params: { scope } })
      .then((response) => !cancelled && setPosts(response.data))
      .catch((error) => console.error("Failed to load posts", error))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [scope]);

  useEffect(() => {
    api
      .get<UserBrief[]>("/users/suggestions")
      .then((response) => setSuggestions(response.data))
      .catch(() => undefined);
  }, []);

  const changeScope = (next: "all" | "following") => {
    setLoading(true);
    setScope(next);
  };

  return (
    <div className="page two-col">
      <section className="feed">
        <div className="page-title">
          <h1>Your feed</h1>
          <div className="tabs">
            <button
              className={scope === "all" ? "tab active" : "tab"}
              onClick={() => changeScope("all")}
            >
              For you
            </button>
            <button
              className={scope === "following" ? "tab active" : "tab"}
              onClick={() => changeScope("following")}
            >
              Following
            </button>
          </div>
        </div>

        {loading && <p className="muted">Loading your feed...</p>}

        {!loading && posts.length === 0 && (
          <div className="card empty">
            <h2>No posts yet</h2>
            <p>
              {scope === "following"
                ? "Follow people to see their posts here."
                : "Create the first post and start the conversation."}
            </p>
            <Link to="/create" className="btn btn-primary">
              Create a post
            </Link>
          </div>
        )}

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={(id) =>
              setPosts((list) => list.filter((item) => item.id !== id))
            }
          />
        ))}
      </section>

      <aside className="side-panel">
        <div className="card">
          <h3>Suggested for you</h3>
          {suggestions.length === 0 && (
            <p className="muted">No suggestions right now.</p>
          )}
          {suggestions.map((person) => (
            <UserRow
              key={person.id}
              user={person}
              onFollowChange={(id, isFollowing) =>
                setSuggestions((list) =>
                  list.map((item) =>
                    item.id === id ? { ...item, is_following: isFollowing } : item
                  )
                )
              }
            />
          ))}
        </div>
      </aside>
    </div>
  );
};

export default Home;
