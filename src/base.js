export const baseUrl = "http://127.0.0.1:8000/api/v1/";
export const baseUrlImage = "http://127.0.0.1:8000/";
export const baseUrlWebsocket = "ws://127.0.0.1:8000/ws/";
export const baseUrlWeb = "http://127.0.0.1:8000/api/v1";
function ConfigUrl(url) {
  // Guard against undefined/null or non-string values
  if (!url || typeof url !== "string") {
    return "";
  }
  // Absolute http(s) URL
  if (url.startsWith("http")) {
    return url;
  }
  // Normalize slashes when combining with baseUrlImage
  const base = baseUrlImage.endsWith("/")
    ? baseUrlImage.slice(0, -1)
    : baseUrlImage;
  const path = url.startsWith("/") ? url : `/${url}`;
  return base + path;
}
export { ConfigUrl };
