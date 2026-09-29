import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

interface ProfileData {
  id: number;
  username: string;
  email?: string;
  bio: string | null;
  profile_image: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
}

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = username
          ? await api.get(`/users/${username}`)
          : await api.get("/users/me");

        const data = response.data;

        setProfile({
          id: data.id,
          username: data.username,
          email: data.email,
          bio: data.bio ?? null,
          profile_image: data.profile_image ?? null,
          followers_count: data.followers_count ?? 0,
          following_count: data.following_count ?? 0,
          posts_count: data.posts_count ?? 0,
        });
      } catch (err: any) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
            "Unable to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>Something went wrong</h2>
          <p>{error}</p>

          <button
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>Profile not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.profile_image ? (
              <img
                src={profile.profile_image}
                alt={profile.username}
              />
            ) : (
              profile.username
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          <div className="profile-info">
            <div className="profile-title">
              <h1>@{profile.username}</h1>

              {!username && (
                <button
                  onClick={() =>
                    navigate("/edit-profile")
                  }
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="profile-stats">
              <span>
                <strong>
                  {profile.posts_count}
                </strong>{" "}
                posts
              </span>

              <span>
                <strong>
                  {profile.followers_count}
                </strong>{" "}
                followers
              </span>

              <span>
                <strong>
                  {profile.following_count}
                </strong>{" "}
                following
              </span>
            </div>

            <p>
              {profile.bio || "No bio yet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;