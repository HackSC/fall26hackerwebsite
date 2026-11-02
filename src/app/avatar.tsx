/** Round profile picture, falling back to the person's initial. */
export function Avatar({
  url,
  name,
  className = "size-10",
}: {
  url?: string | null;
  name?: string;
  className?: string;
}) {
  if (url) {
    return (
      // Small user-uploaded images from Supabase Storage; next/image adds nothing here.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name ?? ""} className={`${className} shrink-0 rounded-full object-cover`} />
    );
  }
  return (
    <span
      aria-hidden
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-placeholder font-medium text-muted`}
    >
      {name?.trim().charAt(0).toUpperCase()}
    </span>
  );
}
