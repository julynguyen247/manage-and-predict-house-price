const url_http = process.env.REACT_APP_URL_HTTP;
const url_websocket = process.env.REACT_APP_URL_WEBSOCKET;

export const baseUrl = url_http + '/api/v1/';
export const baseUrlImage = url_http + '/';
export const baseUrlWebsocket = url_websocket + '/ws/';
export const baseUrlWeb = url_http + '/api/v1';
export const originUrl = url_http;
function ConfigUrl(url){
    // Guard against undefined/null or non-string values
    if (!url || typeof url !== 'string') {
        return '';
    }
    // Absolute http(s) URL
    if (url.startsWith('http')){
        return url;
    }
    // Normalize slashes when combining with baseUrlImage
    const base = baseUrlImage.endsWith('/') ? baseUrlImage.slice(0, -1) : baseUrlImage;
    const path = url.startsWith('/') ? url : `/${url}`;
    return base + path;
}
export { ConfigUrl };