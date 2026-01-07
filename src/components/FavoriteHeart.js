import React from 'react';
import { Heart } from 'lucide-react';

const FavoriteHeart = ({ 
  favoriteCount = 0, 
  onClick, 
  isFavoritePage = false,
  className = "relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200",
  iconClassName = "h-6 w-6",
  badgeClassName = "absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-lg"
}) => {
  return (
    <button 
      className={className}
      onClick={onClick}
      aria-label="Yêu thích"
    >
      <Heart className={`${iconClassName} ${isFavoritePage ? 'text-red-500 fill-current' : ''}`} />
      {favoriteCount > 0 && (
        <div className={badgeClassName}>
          {favoriteCount > 99 ? '99+' : favoriteCount}
        </div>
      )}
    </button>
  );
};

export default FavoriteHeart;
