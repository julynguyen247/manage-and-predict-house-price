import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthWrapper from './auth/AuthWrapper';
import { Menu, X } from 'lucide-react';
import HeaderActions from './HeaderActions';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children, showNavigation = true, navigationItems = [] }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const defaultNavigationItems = [
    { id: 'ban', label: 'Nhà đất bán', icon: '🏠' },
    { id: 'thue', label: 'Nhà đất thuê', icon: '🔑' },
    { id: 'tin-tuc', label: 'Tin tức', icon: '📰' }
  ];

  const navItems = navigationItems.length > 0 ? navigationItems : defaultNavigationItems;

  const handleNavigateToPropertyList = (type) => {
    if (type === 'ban') {
      navigate('/property-list?tab=ban');
    } else if (type === 'thue') {
      navigate('/property-list?tab=thue');
    } else if (type === 'tin-tuc') {
      navigate('/news');
    }
  };

  const handelNavigateToPostProperty = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để đăng tin!');
      return;
    }
    navigate('/post-property');
  };

  const handelNavigateToPricePrediction = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để dự đoán giá!');
      return;
    }
    navigate('/price-prediction');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">🏢</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">RealEstate</h1>
            </motion.div>

            {/* Navigation */}
            {showNavigation && (
              <nav className="hidden lg:flex items-center space-x-8">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    onClick={() => handleNavigateToPropertyList(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}

            {/* Header Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <HeaderActions 
                onFavoriteClick={() => navigate('/favorites')}
                showOnMobile={true}
                showOnDesktop={true}
              />
              <AuthWrapper />
             {/* Desktop Action Buttons */}
             <div className="hidden sm:flex items-center space-x-2">
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                  onClick={handelNavigateToPostProperty}
                >
                  Đăng tin
                </button>
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                  onClick={handelNavigateToPricePrediction}
                >
                  Dự đoán giá
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-200 bg-white"
            >
              <div className="px-4 py-4 space-y-4">
                {/* Mobile Navigation */}
                {showNavigation && (
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        className="flex items-center space-x-3 w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => {
                          handleNavigateToPropertyList(item.id);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                )}

                {/* Mobile Action Buttons */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                    onClick={() => {
                      handelNavigateToPostProperty();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Đăng tin
                  </button>
                  <button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                    onClick={() => {
                      handelNavigateToPricePrediction();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Dự đoán giá
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;

