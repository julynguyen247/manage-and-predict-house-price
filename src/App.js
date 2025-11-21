import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { baseUrl, ConfigUrl } from './base';
import PropertyTypeSelect from './useAPI/PropertyTypeSelect';
import LocationSelect from './useAPI/LocationSelect';
import PropertyList from './pages/PropertyList';
import AuthWrapper from './components/auth/AuthWrapper';
import UserDropdown from './components/auth/UserDropdown';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import NotificationManager from './components/NotificationManager';
import NotificationDebug from './components/NotificationDebug';
import { 
  Home, 
  User, 
  Settings, 
  Bell, 
  Search, 
  Plus, 
  Heart, 
  MessageCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  MapPin,
  DollarSign,
  Square,
  Clock,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  ChevronDown,
  ChevronRight,
  Play
} from 'lucide-react';








const districtUrl = baseUrl + 'districts/';
const provinceUrl = baseUrl + 'provinces/';
const propertyTypeUrl = baseUrl + 'property-types/';

const pairPrice = {
  'Dưới 1 tỷ': [0, 1000],
  '1-3 tỷ': [1000, 3000],
  '3-5 tỷ': [3000, 5000],
  '5-10 tỷ': [5000, 10000],
  'Trên 10 tỷ': [10000, Infinity]
}

{/* <option>Diện tích</option>
                    <option>Dưới 30 m²</option>
                    <option>30-50 m²</option>
                    <option>50-80 m²</option>
                    <option>80-120 m²</option>
                    <option>Trên 120 m²</option> */}
const pairArea = {
  'Dưới 30 m²': [0, 30],
  '30-50 m²': [30, 50],
  '50-80 m²': [50, 80],
  '80-120 m²': [80, 120],
  'Trên 120 m²': [120, Infinity]
}



function App() {
  const [activeTab, setActiveTab] = useState('ban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [propertyType, setPropertyType] = useState(null);
  const [priceRange, setPriceRange] = useState('');
  const [area, setArea] = useState('');
  const [districts, setDistricts] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedDistrictNames, setSelectedDistrictNames] = useState([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedPropertyTypeNames, setSelectedPropertyTypeNames] = useState([]);
  const [currentPage, setCurrentPage] = useState('search'); // 'search' or 'propertyList'
  const [searchParams, setSearchParams] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const navigationItems = [
    { id: 'ban', label: 'Nhà đất bán' },
    { id: 'thue', label: 'Nhà đất thuê' },
    { id: 'tintuc', label: 'Tin tức' },
  ];

  // Fetch favorite IDs
  useEffect(() => {
    const fetchFavoriteIds = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${baseUrl}favourites/listID/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setFavoriteIds(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching favorite IDs:', error);
      }
    };

    fetchFavoriteIds();
  }, []);

  // Toggle favorite function
  const toggleFavorite = async (propertyId, e) => {
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login or show login modal
        navigate('/login');
        return;
      }

      const response = await fetch(`${baseUrl}favourites/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ property_id: propertyId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Toggle favorite response:', data);
        
        // Update favorite IDs state
        setFavoriteIds(prev => {
          if (prev.includes(propertyId)) {
            return prev.filter(id => id !== propertyId);
          } else {
            return [...prev, propertyId];
          }
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleProvinceSelect = (provinceName, provinceId) => {
    console.log('Đã chọn tỉnh thành:', provinceName, 'ID:', provinceId);
    
    // Reset lại danh sách districts đã chọn khi chọn tỉnh mới
    setSelectedDistricts([]);
    setSelectedDistrictNames([]);
    
    // Có thể lưu thông tin tỉnh đã chọn để sử dụng sau này
    setSelectedCity(provinceId); // nếu bạn có state này
    
    // Log để debug
    console.log('Đã reset danh sách districts đã chọn');
  };
  
  const handlePropertyTypeSelect = (propertyTypeIds, propertyTypeNames) => {
    setSelectedPropertyTypes(propertyTypeIds || []);
    setSelectedPropertyTypeNames(propertyTypeNames || []);
    console.log('Danh sách property type IDs đã chọn:', propertyTypeIds);
    console.log('Danh sách property type names đã chọn:', propertyTypeNames);
  };

  const handleSearch = () => {
    // Join arrays into comma-separated strings
    const districtString = Array.isArray(selectedDistricts) && selectedDistricts.length > 0
      ? selectedDistricts.join(',')
      : '';
    const propertyTypeString = Array.isArray(selectedPropertyTypes) && selectedPropertyTypes.length > 0
      ? selectedPropertyTypes.join(',')
      : '';

    // Parse a value that can be an array [min,max] or a string "min,max"
    const parsePair = (value) => {
      if (!value) return { min: undefined, max: undefined };
      if (Array.isArray(value)) {
        const [minVal, maxVal] = value;
        const min = Number.isFinite(Number(minVal)) ? Number(minVal) : undefined;
        const max = Number.isFinite(Number(maxVal)) ? Number(maxVal) : undefined;
        return { min, max };
      }
      const parts = String(value).split(',');
      const minNum = Number(parts[0]);
      const maxRaw = parts[1];
      const maxNum = Number(maxRaw);
      const min = Number.isFinite(minNum) ? minNum : undefined;
      const max = (!maxRaw || String(maxRaw).toLowerCase() === 'infinity')
        ? undefined
        : (Number.isFinite(maxNum) ? maxNum : undefined);
      return { min, max };
    };

    const { min: priceMin, max: priceMax } = parsePair(priceRange);
    const { min: areaMin, max: areaMax } = parsePair(area);

    // Build params and drop empty values
    const rawParams = {
      searchQuery: searchQuery || '',
      province: selectedCity ?? undefined,
      district: districtString || undefined,
      property_type: propertyTypeString || undefined,
      price_min: priceMin,
      price_max: priceMax,
      area_min: areaMin,
      area_max: areaMax,
      tab: activeTab
    };
    // Filter out undefined, null, empty string, and 0 values
    const params = Object.fromEntries(
      Object.entries(rawParams).filter(([_, v]) => {
        if (v === undefined || v === null || v === '') return false;
        if (typeof v === 'number' && v === 0) return false;
        return true;
      })
    );

    // console.log('Search Parameters:', params);
    // console.log('URL Search Params:', new URLSearchParams(params).toString());
    // console.log(`Province ID: ${selectedCity}`);
    // console.log(`District IDs: ${selectedDistricts} -> Formatted: ${districtString}`);
    // console.log(`Property Type IDs: ${selectedPropertyTypes} -> Formatted: ${propertyTypeString}`);
    // console.log(`Price Range (raw): ${priceRange} -> Min: ${priceMin}, Max: ${priceMax}`);
    // console.log(`Area Range (raw): ${area} -> Min: ${areaMin}, Max: ${areaMax}`);

    navigate(`/property-list?${new URLSearchParams(params).toString()}`);
    setSearchParams(params);
    setCurrentPage('propertyList');
  };

  const handleBackToSearch = () => {
    setCurrentPage('search');
  };
  
  // 2. Sửa hàm handleDis trictsChange - giữ nguyên logic nhưng thêm log
  const handleDistrictsChange = (districtIds, districtNames) => {
    setSelectedDistricts(districtIds || []);
    setSelectedDistrictNames(districtNames || []);
    
    console.log('Danh sách district IDs đã chọn cập nhật:', districtIds);
    console.log('Danh sách district names đã chọn cập nhật:', districtNames);
    console.log('Số lượng districts đã chọn:', districtIds?.length || 0);
    
    // Có thể thêm logic xử lý khác nếu cần
    // Ví dụ: lưu vào localStorage, gửi lên server, etc.
  };



  const [featuredNews, setFeaturedNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true); 



  const handleNavigateToPropertyList = (tab) => {
    if (tab === 'ban') {
      navigate(`/property-list?tab=ban`);
    } else if (tab === 'thue') {
      navigate(`/property-list?tab=thue`);
    } else {
      navigate('/property-list');
    }
  }
  const [propertyListings, setPropertyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured properties from API
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        setLoading(true);
        // Try featured properties first, fallback to latest properties
        let response = await fetch(`${baseUrl}properties/?featured=true&limit=8`);
        if (!response.ok) {
          // Fallback to latest properties if featured endpoint doesn't exist
          response = await fetch(`${baseUrl}properties/?limit=8`);
        }
        
        if (response.ok) {
          const data = await response.json();
          setPropertyListings(data.results || data.data || []);
        } else {
          console.error('Failed to fetch properties');
          setPropertyListings([]);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setPropertyListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProperties();
  }, []);

  // Fetch featured news from API
  useEffect(() => {
    const fetchFeaturedNews = async () => {
      try {
        setNewsLoading(true);
        const response = await fetch(`${baseUrl}news/?limit=3`);
        
        if (response.ok) {
          const data = await response.json();
          setFeaturedNews(data.results || []);
        } else {
          console.error('Failed to fetch news');
          setFeaturedNews([]);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setFeaturedNews([]);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchFeaturedNews();
  }, []);

  const handelNavigateToPostProperty = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để đăng tin!');
      return;
    }
    navigate('/post-property');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Vừa xong';
      if (diffInHours < 24) return `${diffInHours} giờ trước`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays} ngày trước`;
      
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const getThumbnailUrl = (path) => {
    if (!path) return '';
    try {
      const api = new URL(baseUrl);
      return `${api.origin}${path}`;
    } catch {
      return path;
    }
  };

  // Render PropertyList page if currentPage is 'propertyList'
  if (currentPage === 'propertyList') {
    return (
      <PropertyList 
        searchParams={searchParams} 
        onBack={handleBackToSearch}
      />
    );
  }

  // Render Search page
  return (
    <Layout>
      <NotificationManager /> 

      {/* Search Section */}
      
      <div id="search-section" className="bg-white py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            {/* Tabs */}
            <div className="flex space-x-1 mb-4 sm:mb-6">
              <button
                onClick={() => setActiveTab('ban')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  activeTab === 'ban'
                    ? 'bg-amber-800 text-white'
                    : 'bg-amber-100 text-gray-700 hover:bg-amber-200'
                }`}
              >
                Nhà đất bán
              </button>
              <button
                onClick={() => setActiveTab('thue')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  activeTab === 'thue'
                    ? 'bg-amber-800 text-white'
                    : 'bg-amber-100 text-gray-700 hover:bg-amber-200'
                }`}
              >
                Nhà đất cho thuê
              </button>
              
            </div>

            {/* Main Search Bar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch border border-gray-300 rounded-lg overflow-visible w-full">
                {/* Location Input */}
                <LocationSelect 
                  onProvinceSelect={handleProvinceSelect} 
                  onDistrictSelect={handleDistrictsChange}
                />
                
                {/* Desktop Search Button */}
                <button 
                  onClick={handleSearch}
                  className="hidden sm:inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-3 font-medium transition-colors whitespace-nowrap flex-shrink-0 sm:rounded-l-none sm:rounded-r-lg" 
                  id="search-RealEstate"
                >
                  Tìm kiếm
                </button>
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <PropertyTypeSelect onPropertyTypeSelect={handlePropertyTypeSelect} tab={activeTab} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức giá
                  </label>
                  <select
                    value={priceRange || ''}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="">Mức giá</option>
                    <option value="0,1000">Dưới 1 tỷ</option>
                    <option value="1000,3000">1-3 tỷ</option>
                    <option value="3000,5000">3-5 tỷ</option>
                    <option value="5000,10000">5-10 tỷ</option>
                    <option value="10000,Infinity">Trên 10 tỷ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diện tích
                  </label>
                  <select
                    value={area || ''}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="">Diện tích</option>
                    <option value="0,30">Dưới 30 m²</option>
                    <option value="30,50">30-50 m²</option>
                    <option value="50,80">50-80 m²</option>
                    <option value="80,120">80-120 m²</option>
                    <option value="120,Infinity">Trên 120 m²</option>
                  </select>
                </div>
              </div>

              {/* Mobile search button */}
              <div className="sm:hidden">
                <button 
                  onClick={handleSearch}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20"></div>
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-yellow-400/10 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-white"
            >
              <div className="mb-4">
                <span className="text-yellow-400 text-sm font-medium">KOHLER PRESENTS</span>
              </div>
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <span className="text-gray-900 font-bold text-sm">🏆</span>
                  </div>
                  <span className="text-yellow-400 font-medium">PropertyGuru Vietnam Property Awards</span>
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                11 năm tôn vinh chủ đầu tư xuất sắc ngành bất động sản
              </h2>
              <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg transition-colors">
                ĐĂNG KÝ TẠI ĐÂY
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-8 w-8 text-gray-900" />
                  </div>
                  <p className="text-white text-lg">Xem video giới thiệu</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Carousel Navigation */}
        <button className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-yellow-400 transition-colors">
          <ChevronRight className="h-8 w-8 rotate-180" />
        </button>
        <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-yellow-400 transition-colors">
          <ChevronRight className="h-8 w-8" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {[1, 2, 3, 4, 5, 6].map((dot) => (
            <div
              key={dot}
              className={`w-3 h-3 rounded-full transition-colors ${
                dot === 1 ? 'bg-yellow-400' : 'bg-white/50'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Featured News */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Tin nổi bật</h3>
            <button 
              className="text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => navigate('/news')}
            >
              Xem thêm
            </button>
          </div>

          {newsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredNews.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredNews.map((news, index) => (
                <motion.div
                  key={news.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/news/${news.id}`)}
                >
                  <div className="relative">
                    <img
                      src={getThumbnailUrl(news.thumbnail)}
                      alt={news.title}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Tin nổi bật
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {news.title}
                    </h4>
                    {news.introduction && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {news.introduction}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatDate(news.created_at)}
                      </div>
                      {news.author_name && (
                        <span>{news.author_name}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-400 text-2xl">📰</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có tin tức</h3>
              <p className="text-gray-500">Hiện tại chưa có tin tức nào được đăng</p>
            </div>
          )}
        </div>
      </div>

      {/* Property Listings */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Bất động sản nổi bật</h3>
          
          {loading ? (
            // Loading skeleton for desktop
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Actual content for desktop
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {propertyListings.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => navigate(`/property/${property.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="relative h-48">
                  <img src={ConfigUrl(property.thumbnail)} alt={property.title.slice(0, 10)} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Favorite Button */}
                  <button 
                    className={`absolute top-3 right-3 z-10 transition-all duration-300 ${favoriteIds.includes(property.id) ? 'text-red-500 scale-110' : 'text-white hover:text-red-500'}`}
                    onClick={(e) => toggleFavorite(property.id, e)}
                  >
                    <Heart className={`h-5 w-5 transition-all duration-300 ${favoriteIds.includes(property.id) ? 'fill-current scale-110' : ''}`} />
                  </button>
                      </div>
                <div className="p-4">
                  <h4 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">{property.title}</h4>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{property.description || 'Không có mô tả'}</p>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="text-base font-bold text-red-600">{property.price}</div>
                      <div className="text-gray-600 text-sm">{property.area_m2}m²</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="truncate">{property.address}</span>
                    <span>{property.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
          )}

          {/* Mobile view */}
          {loading ? (
            // Loading skeleton for mobile
            <div className="sm:hidden space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                  <div className="flex">
                    <div className="w-32 h-24 bg-gray-200 flex-shrink-0"></div>
                    <div className="flex-1 p-3">
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="mt-1 h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Actual content for mobile
            <div className="sm:hidden space-y-3">
              {propertyListings.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 active:scale-[0.98]"
                onClick={() => navigate(`/property/${property.id}`)}
              >
                <div className="flex">
                  <div className="relative w-32 h-24 flex-shrink-0">
                    <img src={ConfigUrl(property.thumbnail)} alt={property.title.slice(0, 10)} className="w-full h-full object-cover" />
                    
                    {/* Favorite Button */}
                    <button 
                      className={`absolute top-1 right-1 transition-all duration-300 ${favoriteIds.includes(property.id) ? 'text-red-500 scale-110' : 'text-white hover:text-red-500'}`}
                      onClick={(e) => toggleFavorite(property.id, e)}
                    >
                      <Heart className={`h-4 w-4 transition-all duration-300 ${favoriteIds.includes(property.id) ? 'fill-current scale-110' : ''}`} />
                    </button>
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">{property.title}</h4>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-1">{property.description || 'Không có mô tả'}</p>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-bold text-red-600">{property.price}</div>
                        <div className="text-gray-600 text-xs">{property.area_m2}m²</div>
                      </div>
                      <span className="text-xs text-gray-500">{property.time}</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">{property.address}</div>
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && propertyListings.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-400 text-2xl">🏠</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có bất động sản nổi bật</h3>
              <p className="text-gray-500 mb-4">Hiện tại chưa có bất động sản nào được đánh dấu nổi bật</p>
              <button 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                onClick={() => navigate('/property-list')}
              >
                Xem tất cả bất động sản
              </button>
            </div>
          )}

          {/* Button xem thêm bất động sản */}
          {!loading && propertyListings.length > 0 && (
            <div className="flex justify-center" style={{ marginTop: '20px' }}>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors" onClick={() => navigate('/property-list')}>
                Xem thêm
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <span className="text-gray-900 font-bold text-sm">🏢</span>
                </div>
                <h3 className="text-xl font-bold">RealEstate</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Nền tảng bất động sản hàng đầu Việt Nam, kết nối người mua và người bán một cách hiệu quả.
              </p>
              <div className="flex space-x-4">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Youtube className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Dịch vụ</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Mua bán nhà đất</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cho thuê nhà đất</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dự án bất động sản</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tư vấn đầu tư</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Liên hệ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Liên hệ</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>1900 1234</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>info@realestate.vn</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>123 Đường ABC, Quận 1, TP.HCM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 RealEstate. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}

export default App;
