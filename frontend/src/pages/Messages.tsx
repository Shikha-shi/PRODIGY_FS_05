import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import { timeAgo } from "../components/utils";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage } from "../services/api";
import type { Conversation, Message, UserBrief } from "../types";

const Messages = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserBrief[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await api.get<Conversation[]>("/messages/conversations");
      setConversations(response.data);
    } catch {
      /* ignore transient errors */
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!username) return;

    try {
      const response = await api.get<Message[]>(`/messages/with/${username}`);
      setMessages(response.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load conversation"));
    }
  }, [username]);

  // Conversation list polling
  useEffect(() => {
    loadConversations();
    const timer = window.setInterval(loadConversations, 5000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  // Open conversation polling
  useEffect(() => {
    setMessages([]);
    if (!username) return;

    loadMessages().then(loadConversations);
    const timer = window.setInterval(loadMessages, 3000);
    return () => window.clearInterval(timer);
  }, [username, loadMessages, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Start a conversation with anyone via user search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      api
        .get<UserBrief[]>("/users/search", { params: { q: query } })
        .then((response) => setResults(response.data.slice(0, 6)))
        .catch(() => undefined);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || !username) return;

    try {
      const response = await api.post<Message>(`/messages/with/${username}`, {
        content: text,
      });
      setMessages((list) => [...list, response.data]);
      setText("");
      loadConversations();
    } catch (err) {
      setError(errorMessage(err, "Unable to send message"));
    }
  };

  const startChat = (person: UserBrief) => {
    setQuery("");
    setResults([]);
    navigate(`/messages/${person.username}`);
  };

  const activeConversation = conversations.find(
    (item) => item.user.username === username
  );

  return (
    <div className={`page messages-page ${username ? "chat-open" : ""}`}>
      <section className="conversations card">
        <h2>Messages</h2>

        <div className="search-bar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Start a new chat..."
          />
        </div>

        {results.length > 0 && (
          <div className="search-dropdown">
            {results.map((person) => (
              <button key={person.id} className="conversation" onClick={() => startChat(person)}>
                <Avatar username={person.username} image={person.profile_image} size={38} />
                <strong>@{person.username}</strong>
              </button>
            ))}
          </div>
        )}

        {conversations.length === 0 && (
          <p className="muted">No conversations yet.</p>
        )}

        {conversations.map((item) => (
          <button
            key={item.user.id}
            className={`conversation ${item.user.username === username ? "active" : ""}`}
            onClick={() => navigate(`/messages/${item.user.username}`)}
          >
            <Avatar username={item.user.username} image={item.user.profile_image} size={44} />
            <div className="conversation-text">
              <strong>@{item.user.username}</strong>
              <span className={item.unread_count ? "unread-text" : ""}>
                {item.last_sender_id === me?.id ? "You: " : ""}
                {item.last_message}
              </span>
            </div>
            {item.unread_count > 0 && <em className="badge static">{item.unread_count}</em>}
          </button>
        ))}
      </section>

      <section className="chat card">
        {!username ? (
          <div className="empty">
            <h2>Your messages</h2>
            <p>Pick a conversation or search for someone to start chatting.</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <button className="icon-btn back-btn" onClick={() => navigate("/messages")}>
                ←
              </button>
              <Avatar
                username={username}
                image={activeConversation?.user.profile_image}
                size={38}
              />
              <strong
                className="clickable"
                onClick={() => navigate(`/profile/${username}`)}
              >
                @{username}
              </strong>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && !error && (
                <p className="muted center">Say hi to @{username} 👋</p>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`bubble ${message.sender_id === me?.id ? "mine" : "theirs"}`}
                >
                  <p>{message.content}</p>
                  <span>{timeAgo(message.created_at)}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {error && <div className="error-message">{error}</div>}

            <form className="chat-form" onSubmit={send}>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Message..."
                maxLength={2000}
              />
              <button className="btn btn-primary" disabled={!text.trim()}>
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
};

export default Messages;
