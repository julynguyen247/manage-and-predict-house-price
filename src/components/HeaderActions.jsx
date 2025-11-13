import React from 'react';
import NotificationDropdown from './NotificationDropdown';
import FavoriteHeart from './FavoriteHeart';
import { useFavoriteCount } from '../hooks/useFavoriteCount';

const HeaderActions = ({
  onFavoriteClick,
  isFavoritePage = false,
  showOnMobile = true,
  showOnDesktop = true,
  className = ""
}) => {
  const { favoriteCount } = useFavoriteCount();
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Desktop Actions */}
      {showOnDesktop && (
        <div className="hidden sm:flex items-center space-x-1">
          <FavoriteHeart
            favoriteCount={favoriteCount}
            onClick={onFavoriteClick}
            isFavoritePage={isFavoritePage}
          />
          <NotificationDropdown />
        </div>
      )}

      {/* Mobile Actions */}
      {showOnMobile && (
        <div className="flex sm:hidden items-center space-x-1">
          <FavoriteHeart
            favoriteCount={favoriteCount}
            onClick={onFavoriteClick}
            isFavoritePage={isFavoritePage}
          />
          <NotificationDropdown />
        </div>
      )}
    </div>
  );
};

export default HeaderActions;
