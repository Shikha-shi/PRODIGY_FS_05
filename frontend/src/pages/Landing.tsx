import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Landing = () => {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/home" replace />;

  return (
    <div className="landing">
      <div className="landing-hero">
        <h1 className="landing-logo">Vibe</h1>
        <p className="landing-tagline">Connect. Share. Vibe.</p>
        <p className="landing-sub">
          Share photos and videos, follow people you love, and keep the
          conversation going.
        </p>
        <div className="landing-actions">
          <Link to="/register" className="btn btn-primary btn-lg">
            Get started
          </Link>
          <Link to="/login" className="btn btn-outline btn-lg">
            Log in
          </Link>
        </div>
      </div>

      <div className="landing-features">
        {[
          ["📸", "Share moments", "Post photos, videos and thoughts with #hashtags."],
          ["💜", "Engage", "Like, comment and see exactly who liked your posts."],
          ["🧭", "Discover", "Explore trending posts and find new people."],
          ["✉️", "Message", "Chat privately with anyone on Vibe."],
        ].map(([icon, title, text]) => (
          <div className="card feature" key={title}>
            <span>{icon}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;
