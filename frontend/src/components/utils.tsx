import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export const timeAgo = (iso: string) => {
  // Backend stores naive UTC timestamps
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

  return date.toLocaleDateString();
};

// Turns #tags into links to /hashtag/:name
export const renderContent = (text: string): ReactNode[] =>
  text.split(/(#\w+)/g).map((part, index) =>
    /^#\w+$/.test(part) ? (
      <Link
        key={index}
        className="hashtag-link"
        to={`/hashtag/${part.slice(1).toLowerCase()}`}
      >
        {part}
      </Link>
    ) : (
      <span key={index}>{part}</span>
    )
  );
