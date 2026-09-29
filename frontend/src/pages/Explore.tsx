import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import api from "../services/api";
import type { Post, TrendingHashtag } from "../types";

type Tab = "" | "image" | "video";

const Explore = () => {
  const [tab, setTab] = useState<Tab>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<TrendingHashtag[]>("/posts/hashtags/trending")
      .then((response) => setTags(response.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;

    api
      .get<Post[]>("/posts/trending", { params: { media: tab } })
      .then((response) => !cancelled && setPosts(response.data))
      .catch((error) => console.error("Failed to load trending", error))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [tab]);

  const changeTab = (next: Tab) => {
    setLoading(true);
    setTab(next);
  };

  return (
    <div className="page two-col">
      <section className="feed">
        <div className="page-title">
          <h1>Explore</h1>
          <div className="tabs">
            <button className={tab === "" ? "tab active" : "tab"} onClick={() => changeTab("")}>
              Trending
            </button>
            <button className={tab === "image" ? "tab active" : "tab"} onClick={() => changeTab("image")}>
              Photos
            </button>
            <button className={tab === "video" ? "tab active" : "tab"} onClick={() => changeTab("video")}>
              Videos
            </button>
          </div>
        </div>

        {loading && <p className="muted">Loading...</p>}
        {!loading && posts.length === 0 && (
          <div className="card empty">
            <h2>Nothing trending yet</h2>
            <p>Posts with likes and comments will show up here.</p>
          </div>
        )}

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={(id) => setPosts((list) => list.filter((p) => p.id !== id))}
          />
        ))}
      </section>

      <aside className="side-panel">
        <div className="card">
          <h3>Trending hashtags</h3>
          {tags.length === 0 && <p className="muted">No hashtags yet.</p>}
          {tags.map((tag) => (
            <Link key={tag.name} to={`/hashtag/${tag.name}`} className="tag-row">
              <strong>#{tag.name}</strong>
              <span>
                {tag.posts_count} {tag.posts_count === 1 ? "post" : "posts"}
              </span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default Explore;
