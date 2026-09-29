import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import FollowButton from "../components/FollowButton";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage } from "../services/api";
import type { Post, ProfileData } from "../types";

const Profile = () => {
  const { username: routeUsername } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const username = routeUsername ?? me?.username;
  const isOwn = !!me && username === me.username;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [profileRes, postsRes, statusRes] = await Promise.all([
          api.get<ProfileData>(`/users/${username}`),
          api.get<Post[]>(`/posts/user/${username}`),
          api.get(`/follows/status/${username}`),
        ]);

        if (cancelled) return;
        setProfile(profileRes.data);
        setPosts(postsRes.data);
        setIsFollowing(statusRes.data.is_following);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Unable to load profile"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) return <div className="page narrow"><p className="muted">Loading profile...</p></div>;

  if (error || !profile) {
    return (
      <div className="page narrow">
        <div className="card empty">
          <h2>{error || "Profile not found"}</h2>
          <button className="btn btn-primary" onClick={() => navigate("/home")}>
            Back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <div className="card profile-card">
        <div className="profile-header">
          <Avatar username={profile.username} image={profile.profile_image} size={104} />

          <div className="profile-info">
            <div className="profile-title">
              <h1>@{profile.username}</h1>

              {isOwn ? (
                <button className="btn btn-outline" onClick={() => navigate("/edit-profile")}>
                  Edit profile
                </button>
              ) : (
                <>
                  <FollowButton
                    username={profile.username}
                    isFollowing={isFollowing}
                    onChange={(status) => {
                      setIsFollowing(status.is_following);
                      setProfile((current) =>
                        current
                          ? {
                              ...current,
                              followers_count: status.followers_count,
                              following_count: status.following_count,
                            }
                          : current
                      );
                    }}
                  />
                  <button
                    className="btn btn-outline"
                    onClick={() => navigate(`/messages/${profile.username}`)}
                  >
                    Message
                  </button>
                </>
              )}
            </div>

            <div className="profile-stats">
              <span>
                <strong>{profile.posts_count}</strong> posts
              </span>
              <Link to={`/profile/${profile.username}/followers`}>
                <strong>{profile.followers_count}</strong> followers
              </Link>
              <Link to={`/profile/${profile.username}/following`}>
                <strong>{profile.following_count}</strong> following
              </Link>
            </div>

            <p className="bio">{profile.bio || "No bio yet."}</p>
          </div>
        </div>
      </div>

      <h3 className="section-title">Posts</h3>

      {posts.length === 0 && (
        <div className="card empty">
          <h2>No posts yet</h2>
          {isOwn && (
            <Link to="/create" className="btn btn-primary">
              Share your first post
            </Link>
          )}
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDelete={(id) => {
            setPosts((list) => list.filter((item) => item.id !== id));
            setProfile((current) =>
              current ? { ...current, posts_count: current.posts_count - 1 } : current
            );
          }}
        />
      ))}

    </div>
  );
};

export default Profile;
