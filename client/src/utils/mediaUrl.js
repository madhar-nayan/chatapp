export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path;
}
