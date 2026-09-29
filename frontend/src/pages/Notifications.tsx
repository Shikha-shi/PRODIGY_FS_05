import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import { timeAgo } from "../components/utils";
import api from "../services/api";
import type { NotificationItem } from "../types";

const icons: Record<string, string> = {
  like: "♥",
  comment: "💬",
  follow: "👤",
};

const Notifications = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<NotificationItem[]>("/notifications")
      .then((response) => setItems(response.data))
      .catch((error) => console.error("Failed to load notifications", error))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    setItems((list) => list.map((item) => ({ ...item, is_read: true })));
  };

  const open = async (item: NotificationItem) => {
    if (!item.is_read) {
      api.post(`/notifications/${item.id}/read`).catch(() => undefined);
      setItems((list) =>
        list.map((entry) =>
          entry.id === item.id ? { ...entry, is_read: true } : entry
        )
      );
    }

    if (item.post_id) navigate(`/post/${item.post_id}`);
    else if (item.sender_username) navigate(`/profile/${item.sender_username}`);
  };

  const hasUnread = items.some((item) => !item.is_read);

  return (
    <div className="page narrow">
      <div className="page-title">
        <h1>Notifications</h1>
        {hasUnread && (
          <button className="btn btn-outline" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {loading && <p className="muted">Loading...</p>}
      {!loading && items.length === 0 && (
        <div className="card empty">
          <h2>All quiet</h2>
          <p>Likes, comments and new followers will show up here.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="card">
          {items.map((item) => (
            <button
              key={item.id}
              className={`notification ${item.is_read ? "" : "unread"}`}
              onClick={() => open(item)}
            >
              <Avatar
                username={item.sender_username ?? "?"}
                image={item.sender_image}
              />
              <div className="notification-text">
                <p>
                  <span className="notif-icon">{icons[item.type] ?? "🔔"}</span>{" "}
                  {item.message}
                </p>
                <span>{timeAgo(item.created_at)}</span>
              </div>
              {!item.is_read && <i className="dot" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
