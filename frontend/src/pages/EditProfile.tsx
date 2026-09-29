import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage } from "../services/api";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [image, setImage] = useState(user?.profile_image ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await api.post("/users/me/avatar", formData);
      setImage(response.data.profile_image);
      await refreshUser();
    } catch (err) {
      setError(errorMessage(err, "Unable to upload photo"));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.put("/users/me", { username, bio });
      await refreshUser();
      navigate("/profile");
    } catch (err) {
      setError(errorMessage(err, "Unable to update profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page narrow">
      <div className="card">
        <div className="page-title">
          <h1>Edit profile</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="avatar-edit">
          <Avatar username={username || "?"} image={image} size={80} />
          <label className="btn btn-outline">
            Change photo
            <input type="file" accept="image/*" onChange={uploadAvatar} hidden />
          </label>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          <label>Username</label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <label>Bio</label>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Tell people about yourself..."
            rows={4}
          />

          <div className="row-between">
            <button type="button" className="btn btn-outline" onClick={() => navigate("/profile")}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
