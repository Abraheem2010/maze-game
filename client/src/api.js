const API_BASE = process.env.REACT_APP_API_URL || "";

export const buildApiUrl = (path) => {
  const base = API_BASE.replace(/\/+$/, "");
  const route = path.startsWith("/") ? path : `/${path}`;
  return `${base}${route}`;
};

export default API_BASE;
