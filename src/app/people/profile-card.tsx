import type { DirectoryProfile } from "./demo-profiles";
import { ProfileDetailModal } from "./profile-detail-modal";

export function ProfileCard({
  profile,
  isMe,
}: {
  profile: DirectoryProfile;
  isMe: boolean;
}) {
  return (
    <ProfileDetailModal
      profile={profile}
      isMe={isMe}
      card
    />
  );
}