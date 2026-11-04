import type { DirectoryProfile } from "./demo-profiles";
import { ProfileDetailModal } from "./profile-detail-modal";

export function ProfileCard({ profile }: { profile: DirectoryProfile }) {
  return <ProfileDetailModal profile={profile} card />;
}