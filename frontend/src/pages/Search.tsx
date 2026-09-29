import { useEffect, useState } from "react";
import UserRow from "../components/UserRow";
import api from "../services/api";
import type { UserBrief } from "../types";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserBrief[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search; empty query lists people to discover
  useEffect(() => {
    setLoading(true);

    const timer = window.setTimeout(() => {
      api
        .get<UserBrief[]>("/users/search", { params: { q: query } })
        .then((response) => setResults(response.data))
        .catch((error) => console.error("Search failed", error))
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="page narrow">
      <div className="page-title">
        <h1>Search</h1>
      </div>

      <div className="search-bar">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users by username..."
        />
        {query && (
          <button className="icon-btn" onClick={() => setQuery("")}>
            ✕
          </button>
        )}
      </div>

      <div className="card">
        {loading && results.length === 0 && <p className="muted">Searching...</p>}

        {!loading && results.length === 0 && (
          <p className="muted">No users found.</p>
        )}

        {results.map((person) => (
          <UserRow
            key={person.id}
            user={person}
            onFollowChange={(id, isFollowing) =>
              setResults((list) =>
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

export default Search;
