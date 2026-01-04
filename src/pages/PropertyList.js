import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { baseUrl, ConfigUrl } from '../base';
import Layout from '../components/Layout';
import { Facebook, Instagram, Twitter, Youtube, Phone, Mail } from 'lucide-react';
import { 
  Search, 
  MapPin, 
  Square, 
  Heart, 
  Star,
  Filter,
  Grid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function PropertyList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); 
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useState({});
  const [favoriteIds, setFavoriteIds] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 12;

  // Update a single query param (preserving others) and reset to page 1
  const updateQueryParam = (key, value) => {
    const params = new URLSearchParams(location.search);
    if (value === undefined || value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set('page', '1');
    navigate(`/property-list?${params.toString()}`);
  };

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
        navigate('/');
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

  // Combined useEffect to parse URL parameters and fetch data
  useEffect(() => {
    console.log('PropertyList useEffect triggered, location.search:', location.search);
    
    // Add a flag to prevent duplicate calls
    let isMounted = true;
    
    const fetchProperties = async () => {
      console.log('Starting fetchProperties for page:', currentPage);
      setLoading(true);
      
      try {
        // Parse URL parameters
        const params = new URLSearchParams(location.search);
        const searchParamsObj = {};
        
        // Convert URLSearchParams to object
        for (const [key, value] of params.entries()) {
          searchParamsObj[key] = value;
        }
        
        console.log('Parsed searchParamsObj:', searchParamsObj);
        setSearchParams(searchParamsObj);
        
        // Build API URL with search parameters and pagination
        const apiUrl = new URL(`${baseUrl}properties/`);
        
        // Add search parameters to API URL
        Object.entries(searchParamsObj).forEach(([key, value]) => {
          if (value && value !== '') {
            apiUrl.searchParams.append(key, value);
          }
        });

        // Add pagination parameters
        apiUrl.searchParams.append('page', currentPage.toString());
        apiUrl.searchParams.append('page_size', itemsPerPage.toString());

        console.log('Fetching from API:', apiUrl.toString());
        console.log('Request timestamp:', new Date().toISOString());
        
        const response = await fetch(apiUrl.toString());
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        // Check if component is still mounted before updating state
        if (!isMounted) return;
        
        // Handle API response with pagination
        if (data && data.data && data.data.length > 0) {
          setProperties(data.data);
          setTotalCount(data.count || 0);
          setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
          console.log('Properties:', data.data);
          console.log('Total count:', data.count);
          console.log('Total pages:', Math.ceil((data.count || 0) / itemsPerPage));
        } else if (data && data.data && data.data.length === 0) {
          // API returned empty array - no properties found
          setProperties([]);
          setTotalCount(0);
          setTotalPages(0);
          console.log('No properties found for the given criteria');
        } else {
          // Fallback to mock data with pagination simulation
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const mockData = [
            {
              id: 1,
              title: 'Căn hộ cao cấp tại Quận 1',
              description: 'Căn hộ 2 phòng ngủ, view hồ bơi, gần trung tâm thương mại',
              price: '15',
              area_m2: '85',
              address: 'Quận 1, Thành phố Hồ Chí Minh',
              time: '2 giờ trước',
              thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
              views: 1234
            },
            {
              id: 2,
              title: 'Nhà phố 3 tầng tại Quận 7',
              description: 'Nhà phố mặt tiền, 4 phòng ngủ, gara ô tô',
              price: '45',
              area_m2: '150',
              address: 'Quận 7, Thành phố Hồ Chí Minh',
              time: '5 giờ trước',
              thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
              views: 892
            },
            {
              id: 3,
              title: 'Nhà riêng 4 tầng tại Thủ Đức',
              description: 'Penthouse sky villa Elysian by Gamuda Land với diện tích 207-332m²',
              price: '25',
              area_m2: '200',
              address: 'Thủ Đức, Thành phố Hồ Chí Minh',
              time: '1 ngày trước',
              thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
              views: 892
            },
            {
              id: 4,
              title: 'Văn phòng cho thuê tại Quận 3',
              description: 'Văn phòng A, tầng 15, view toàn cảnh',
              price: '50',
              area_m2: '120',
              address: 'Quận 3, Thành phố Hồ Chí Minh',
              time: '3 giờ trước',
              thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
              views: 567
            }
          ];

          const paginatedData = mockData.slice(startIndex, endIndex);
          setProperties(paginatedData);
          setTotalCount(mockData.length);
          setTotalPages(Math.ceil(mockData.length / itemsPerPage));
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        if (isMounted) {
          setProperties([]);
          setTotalCount(0);
          setTotalPages(0);
          // You could also set an error state here to show a different message
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Reset pagination when search params change (but not when page changes)
    if (location.search !== window.location.search) {
      setCurrentPage(1);
    }
    
    fetchProperties();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [location.search, currentPage]);

  // Mock data for demonstration (extended for pagination testing)
  const mockProperties = [
    {
      id: 1,
      title: 'Elysian - Giỏ hàng trực tiếp CĐT, CK 9%',
      description: 'TT 50% nhận nhà, CĐT hỗ trợ trả chậm đến 2029',
      price: '9',
      area_m2: '50',
      address: 'Quận 7, Thành phố Hồ Chí Minh',
      time: '9 giờ trước',
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      views: 1247
    },
    {
      id: 2,
      title: 'Căn hộ cao cấp tại Quận 1',
      description: 'Vị trí đắc địa, view sông Sài Gòn',
      price: '15',
      area_m2: '80',
      address: 'Quận 1, Thành phố Hồ Chí Minh',
      time: '2 giờ trước',
      thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      views: 2156
    },
    {
      id: 3,
      title: 'Nhà riêng 4 tầng tại Thủ Đức',
      description: 'Penthouse sky villa Elysian by Gamuda Land với diện tích 207-332m²',
      price: '25',
      area_m2: '200',
      address: 'Thủ Đức, Thành phố Hồ Chí Minh',
      time: '1 ngày trước',
      thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      views: 892
    },
    {
      id: 4,
      title: 'Văn phòng cho thuê tại Quận 3',
      description: 'Văn phòng A, tầng 15, view toàn cảnh',
      price: '50',
      area_m2: '120',
      address: 'Quận 3, Thành phố Hồ Chí Minh',
      time: '3 giờ trước',
      thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      views: 567
    }
  ];



  const handleBack = () => {
    navigate('/?page=1');
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const PropertyCard = ({ property }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer h-full flex flex-col"
      onClick={() => navigate(`/property/${property.id}?page=1${searchParams.tab ? `&tab=${searchParams.tab}` : ''}`)}
    >
      {/* Property Image */}
      <div className="relative h-48 flex-shrink-0">
        <img
          src={ConfigUrl(property.thumbnail)}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {/* Favorite Button */}
         <button 
           className={`absolute top-3 right-3 z-10 transition-all duration-300 ${favoriteIds.includes(property.id) ? 'text-red-500 scale-110' : 'text-white hover:text-red-500'}`}
           onClick={(e) => toggleFavorite(property.id, e)}
         >
           <Heart className={`h-5 w-5 transition-all duration-300 ${favoriteIds.includes(property.id) ? 'fill-current scale-110' : ''}`} />
         </button>
         

        {/* Views */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-xs text-gray-700 font-medium">{property.views} lượt xem</span>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {property.title || ''}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[2rem] flex-shrink-0">
          {property.description ? property.description.slice(0, 60) : ''}
        </p>
        
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="text-base font-bold text-red-600">{property.price || 0}</div>
            <div className="text-gray-600 flex items-center text-sm">
              <Square className="h-4 w-4 mr-1" />
              {property.area_m2 || 0} m²
            </div>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500 mb-2 flex-shrink-0">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{property.address || ''}</span>
        </div>

        <div className="text-xs text-gray-500 mt-auto">
          {property.time || ''}
        </div>
      </div>
    </motion.div>
  );

  const PropertyListItem = ({ property }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/property/${property.id}?page=1${searchParams.tab ? `&tab=${searchParams.tab}` : ''}`)}
    >
      <div className="flex">
        {/* Property Image */}
        <div className="relative w-36 h-24 md:w-48 md:h-32 flex-shrink-0">
          <img
            src={ConfigUrl(property.thumbnail)}
            alt={property.title}
            className="w-full h-full object-cover"
          />
                     <button 
             className={`absolute top-2 right-2 transition-all duration-300 ${favoriteIds.includes(property.id) ? 'text-red-500 scale-110' : 'text-white hover:text-red-500'}`}
             onClick={(e) => toggleFavorite(property.id, e)}
           >
             <Heart className={`h-5 w-5 transition-all duration-300 ${favoriteIds.includes(property.id) ? 'fill-current scale-110' : ''}`} />
           </button>
        </div>

        {/* Property Details */}
        <div className="flex-1 p-4">
          <div className="flex justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                {property.title || ''}
              </h3>
              <p className="text-gray-600 text-sm md:text-[15px] mb-2 line-clamp-2">
                {property.description || ''}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{property.address || ''}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg md:text-xl font-bold text-red-600">{property.price || 0}</div>
              <div className="text-xs md:text-sm text-gray-500 flex items-center justify-end"><Square className="h-4 w-4 mr-1" />{property.area_m2 || 0} m²</div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs md:text-sm text-gray-500">
            <div className="flex items-center space-x-3">
              <span>{property.time || ''}</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                <span>{property.rating || 0}</span>
              </div>
              <span>{property.views || 0} lượt xem</span>
            </div>
            <div className="hidden sm:block text-xs text-gray-500">
              {property.brand || ''}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Kết quả tìm kiếm</h1>
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách bất động sản...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kết quả tìm kiếm</h1>
        <p className="text-sm text-gray-500 mb-6">{totalCount > 0 ? `${totalCount} bất động sản được tìm thấy` : 'Không tìm thấy bất động sản nào'}</p>

        {/* Current Search Info */}
        {Object.keys(searchParams).length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Tiêu chí tìm kiếm hiện tại:</span>
              </div>
              <button
                onClick={() => navigate('/?page=1')}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Thay đổi
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {searchParams.province && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <MapPin className="h-3 w-3 mr-1" />
                  {searchParams.province}
                </span>
              )}
              {searchParams.district && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {searchParams.district}
                </span>
              )}
              {searchParams.property_type && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {searchParams.property_type}
                </span>
              )}
              {searchParams.price_min && searchParams.price_max && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {searchParams.price_min} - {searchParams.price_max} tỷ
                </span>
              )}
              {searchParams.area_min && searchParams.area_max && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {searchParams.area_min} - {searchParams.area_max} m²
                </span>
              )}
              {searchParams.tab && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {searchParams.tab === 'ban' ? 'Nhà đất bán' : 'Nhà đất cho thuê'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Tab selector: Bán / Thuê */}
            <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => updateQueryParam('tab', 'ban')}
                className={`px-4 py-2 text-sm ${searchParams.tab === 'ban' || !searchParams.tab ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Bán
              </button>
              <button
                onClick={() => updateQueryParam('tab', 'thue')}
                className={`px-4 py-2 text-sm ${searchParams.tab === 'thue' ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Thuê
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc
            </button>

            <div className="flex items-center bg-white border border-gray-300 rounded-lg">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-transparent border-none focus:ring-0 text-sm"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-low">Giá thấp đến cao</option>
                <option value="price-high">Giá cao đến thấp</option>
                <option value="area-low">Diện tích nhỏ đến lớn</option>
                <option value="area-high">Diện tích lớn đến nhỏ</option>
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400 mr-3" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-white text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-white text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Property List */}
        {properties.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {properties.map((property) => (
                  <PropertyListItem key={property.id} property={property} />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Empty State - No properties found */
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              {/* Empty State Icon */}
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              
              {/* Empty State Message */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Không tìm thấy bất động sản
              </h3>
              
              <p className="text-gray-600 mb-6">
                {searchParams.province || searchParams.district ? (
                  <>
                    Hiện tại không có bất động sản nào phù hợp với tiêu chí tìm kiếm của bạn tại{' '}
                    <span className="font-medium text-gray-900">
                      {searchParams.province && searchParams.district 
                        ? `${searchParams.province} - ${searchParams.district}`
                        : searchParams.province || searchParams.district
                      }
                    </span>
                  </>
                ) : (
                  'Không có bất động sản nào phù hợp với tiêu chí tìm kiếm của bạn.'
                )}
              </p>
              
              {/* Suggestions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Gợi ý tìm kiếm:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Thử mở rộng phạm vi tìm kiếm (bỏ bớt filter)</li>
                  <li>• Kiểm tra lại từ khóa tìm kiếm</li>
                  <li>• Thử tìm kiếm ở khu vực lân cận</li>
                  <li>• Điều chỉnh khoảng giá hoặc diện tích</li>
                </ul>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/?page=1')}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Tìm kiếm lại
                </button>
                <button
                  onClick={() => {
                    // Clear all filters and search for all properties
                    navigate('/property-list?page=1');
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Xem tất cả bất động sản
                </button>
              </div>
              
              {/* Suggested Properties */}
              <div className="mt-12">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Bất động sản gợi ý</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockProperties.slice(0, 3).map((property) => (
                    <div
                      key={property.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/property/${property.id}?page=1`)}
                    >
                      <div className="relative h-32">
                        <img
                          src={ConfigUrl(property.thumbnail)}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      </div>
                      <div className="p-3">
                        <h5 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                          {property.title}
                        </h5>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-red-600">{property.price} tỷ</span>
                          <span className="text-gray-600">{property.area_m2} m²</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{property.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2 bg-white rounded-lg shadow-md px-4 py-2">
              {/* Previous Button */}
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Page Numbers */}
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-red-600 text-white'
                          : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}

              {/* Next Button */}
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Pagination Info */}
        {totalCount > 0 && (
          <div className="text-center mt-4 text-sm text-gray-600">
            Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} trong tổng số {totalCount} bất động sản
          </div>
        )}
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
                <button className="text-gray-400 hover:text-white transition-colors"><Facebook className="h-5 w-5" /></button>
                <button className="text-gray-400 hover:text-white transition-colors"><Instagram className="h-5 w-5" /></button>
                <button className="text-gray-400 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></button>
                <button className="text-gray-400 hover:text-white transition-colors"><Youtube className="h-5 w-5" /></button>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Dịch vụ</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/property-list?tab=ban" className="hover:text-white transition-colors">Mua bán nhà đất</a></li>
                <li><a href="/property-list?tab=thue" className="hover:text-white transition-colors">Cho thuê nhà đất</a></li>
                <li><a href="/news" className="hover:text-white transition-colors">Dự án bất động sản</a></li>
                <li><a href="/price-prediction" className="hover:text-white transition-colors">Tư vấn đầu tư</a></li>
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
                <div className="flex items-center space-x-2"><Phone className="h-4 w-4" /><span>1900 1234</span></div>
                <div className="flex items-center space-x-2"><Mail className="h-4 w-4" /><span>info@realestate.vn</span></div>
                <div className="flex items-center space-x-2"><MapPin className="h-4 w-4" /><span>123 Đường ABC, Quận 1, TP.HCM</span></div>
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

export default PropertyList;
