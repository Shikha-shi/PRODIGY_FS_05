import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const EditProfile = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/users/me");

        setUsername(response.data.username);
        setBio(response.data.bio || "");
        setProfileImage(
          response.data.profile_image || ""
        );
      } catch {
        setError("Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      await api.put("/users/me", {
        username,
        bio,
        profile_image: profileImage || null,
      });

      navigate("/profile");
    } catch (error: any) {
      setError(
        error.response?.data?.detail ||
          "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        Loading...
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="edit-profile-card">
        <h1>Edit Profile</h1>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Username</label>

          <input
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            required
          />

          <label>Bio</label>

          <textarea
            value={bio}
            onChange={(event) =>
              setBio(event.target.value)
            }
            placeholder="Tell people about yourself..."
            rows={4}
          />

          <label>Profile Image URL</label>

          <input
            value={profileImage}
            onChange={(event) =>
              setProfileImage(event.target.value)
            }
            placeholder="https://..."
          />

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;