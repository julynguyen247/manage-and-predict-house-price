import api from "./apiCustomize";

export function fetchFavoriteIds() {
  return api.get("favourites/listID/");
}

export function toggleFavorite(propertyId) {
  return api.post("favourites/", { property_id: propertyId });
}

export function fetchFeaturedProperties(options = {}) {
  const { featured = true, limit = 8 } = options;
  const params = featured ? { featured: true, limit } : { limit };
  return api.get("properties/", { params });
}

export function fetchFeaturedNews(limit = 3) {
  return api.get("news/", { params: { limit } });
}
