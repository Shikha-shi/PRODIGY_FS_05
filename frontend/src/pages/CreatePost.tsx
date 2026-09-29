import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../services/api";

const CreatePost = () => {
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Release the object URL when it changes or the page unmounts
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleMediaChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setMedia(file ?? null);
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!content.trim() && !media) {
      setError("Write something or select an image/video.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("content", content);
      if (media) formData.append("media", media);

      await api.post("/posts", formData);
      navigate("/home");
    } catch (err) {
      setError(errorMessage(err, "Unable to create post"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page narrow">
      <div className="card">
        <div className="page-title">
          <h1>Share your vibe</h1>
        </div>
        <p className="muted">
          Add #hashtags so people can discover your post.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="stack">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What's happening? #vibe"
            rows={6}
          />

          {preview && (
            <div className="media-preview">
              {media?.type.startsWith("image/") ? (
                <img src={preview} alt="Preview" />
              ) : (
                <video src={preview} controls />
              )}
              <button
                type="button"
                className="icon-btn remove-media"
                onClick={() => {
                  setMedia(null);
                  setPreview("");
                }}
              >
                ✕
              </button>
            </div>
          )}

          <div className="row-between">
            <label className="btn btn-outline">
              📷 Add photo/video
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                hidden
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
