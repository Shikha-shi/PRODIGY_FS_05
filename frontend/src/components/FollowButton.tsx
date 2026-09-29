import { useState } from "react";
import api from "../services/api";

interface FollowButtonProps {
  username: string;
  isFollowing: boolean;
  onChange?: (status: {
    is_following: boolean;
    followers_count: number;
    following_count: number;
  }) => void;
}

const FollowButton = ({ username, isFollowing, onChange }: FollowButtonProps) => {
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);

    try {
      const response = isFollowing
        ? await api.delete(`/follows/${username}`)
        : await api.post(`/follows/${username}`);

      onChange?.(response.data);
    } catch (error) {
      console.error("Follow action failed", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className={isFollowing ? "btn btn-outline" : "btn btn-primary"}
      onClick={toggle}
      disabled={busy}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
