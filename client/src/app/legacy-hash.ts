// Old links used hash routing (/#/orders?status=x). Returns the clean path they point to, or null.
export function legacyHashPath(hash: string): string | null {
  if (!hash.startsWith("#/")) return null;
  return hash.slice(1);
}

// Rewrites the address bar before the router reads it, so old bookmarks and shared tracking links keep working.
export function redirectLegacyHash(location: Location = window.location, history: History = window.history) {
  const path = legacyHashPath(location.hash);
  if (path) history.replaceState(history.state, "", path);
}
