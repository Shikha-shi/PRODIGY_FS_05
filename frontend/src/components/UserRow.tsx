import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";
import { useAuth } from "../context/AuthContext";
import type { UserBrief } from "../types";

interface UserRowProps {
  user: UserBrief;
  onFollowChange?: (userId: number, isFollowing: boolean) => void;
  onNavigate?: () => void;
}

const UserRow = ({ user, onFollowChange, onNavigate }: UserRowProps) => {
  const { user: me } = useAuth();

  return (
    <div className="user-row">
      <Link
        to={`/profile/${user.username}`}
        className="user-row-link"
        onClick={onNavigate}
      >
        <Avatar username={user.username} image={user.profile_image} />
        <div>
          <strong>@{user.username}</strong>
          <span>{user.bio || "Vibing on Vibe"}</span>
        </div>
      </Link>

      {me && me.id !== user.id && (
        <FollowButton
          username={user.username}
          isFollowing={user.is_following}
          onChange={(status) =>
            onFollowChange?.(user.id, status.is_following)
          }
        />
      )}
    </div>
  );
};

export default UserRow;
