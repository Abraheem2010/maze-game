const API_BASE = process.env.REACT_APP_API_URL || "";

export const buildApiUrl = (path) => {
  const base = API_BASE.replace(/\/+$/, "");
  const route = path.startsWith("/") ? path : `/${path}`;
  return `${base}${route}`;
};

const isSameOrigin = (url) => {
  try {
    const resolved = new URL(url, window.location.href);
    return resolved.origin === window.location.origin;
  } catch {
    return true;
  }
};

export const postScore = (payload) => {
  const url = buildApiUrl("/api/score");

  try {
    if (navigator.sendBeacon && isSameOrigin(url)) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const queued = navigator.sendBeacon(url, blob);
      if (queued) return;
    }
  } catch (e) {
    // Fall through to fetch
  }

  try {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch (e) {}
};

export default API_BASE;
