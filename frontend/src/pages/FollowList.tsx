import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import UserRow from "../components/UserRow";
import api from "../services/api";
import type { UserBrief } from "../types";

interface FollowListProps {
  type: "followers" | "following";
}

const FollowList = ({ type }: FollowListProps) => {
  const { username } = useParams();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const timer = window.setTimeout(() => {
      api
        .get<UserBrief[]>(`/follows/${type}/${username}`, { params: { q: query } })
        .then((response) => setUsers(response.data))
        .catch((error) => console.error("Failed to load list", error))
        .finally(() => setLoading(false));
    }, 200);

    return () => window.clearTimeout(timer);
  }, [type, username, query]);

  return (
    <div className="page narrow">
      <div className="page-title">
        <h1>{type === "followers" ? "Followers" : "Following"}</h1>
        <Link to={`/profile/${username}`} className="muted">
          @{username}
        </Link>
      </div>

      <div className="tabs">
        <Link
          className={type === "followers" ? "tab active" : "tab"}
          to={`/profile/${username}/followers`}
        >
          Followers
        </Link>
        <Link
          className={type === "following" ? "tab active" : "tab"}
          to={`/profile/${username}/following`}
        >
          Following
        </Link>
      </div>

      <div className="search-bar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${type}...`}
        />
      </div>

      <div className="card">
        {loading && users.length === 0 && <p className="muted">Loading...</p>}
        {!loading && users.length === 0 && (
          <p className="muted">
            {query ? "No matching users." : `No ${type} yet.`}
          </p>
        )}

        {users.map((person) => (
          <UserRow
            key={person.id}
            user={person}
            onFollowChange={(id, isFollowing) =>
              setUsers((list) =>
                list.map((item) =>
                  item.id === id ? { ...item, is_following: isFollowing } : item
                )
              )
            }
          />
        ))}
      </div>
    </div>
  );
};

export default FollowList;
