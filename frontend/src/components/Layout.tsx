import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(0);
  const [messages, setMessages] = useState(0);

  // Badge counts refresh by polling
  useEffect(() => {
    const load = async () => {
      try {
        const [n, m] = await Promise.all([
          api.get("/notifications/unread-count"),
          api.get("/messages/unread-count"),
        ]);
        setNotifications(n.data.count);
        setMessages(m.data.count);
      } catch {
        /* ignore transient errors */
      }
    };

    load();
    const timer = window.setInterval(load, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const items = [
    { to: "/home", icon: "🏠", label: "Home" },
    { to: "/search", icon: "🔍", label: "Search" },
    { to: "/explore", icon: "🧭", label: "Explore" },
    { to: "/create", icon: "➕", label: "Create" },
    { to: "/notifications", icon: "🔔", label: "Notifications", badge: notifications },
    { to: "/messages", icon: "✉️", label: "Messages", badge: messages },
    { to: "/profile", icon: "👤", label: "Profile" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo" onClick={() => navigate("/home")}>
          Vibe
        </div>

        <nav>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/profile"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">
                {item.icon}
                {!!item.badge && item.badge > 0 && (
                  <em className="badge">{item.badge > 9 ? "9+" : item.badge}</em>
                )}
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>@{user?.username}</span>
          <button className="link-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
