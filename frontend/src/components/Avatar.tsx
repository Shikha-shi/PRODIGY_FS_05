import { mediaUrl } from "../services/api";

interface AvatarProps {
  username: string;
  image?: string | null;
  size?: number;
}

const Avatar = ({ username, image, size = 44 }: AvatarProps) => (
  <div
    className="avatar"
    style={{ width: size, height: size, fontSize: size * 0.42 }}
  >
    {image ? (
      <img src={mediaUrl(image)} alt={username} />
    ) : (
      username.charAt(0).toUpperCase()
    )}
  </div>
);

export default Avatar;
