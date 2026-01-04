import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { baseUrl, ConfigUrl } from '../base';
import { Building2, 
  Trash2, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Phone, 
  Mail,
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil } from 'lucide-react';
import AuthWrapper from '../components/auth/AuthWrapper';
import { useAuth } from '../contexts/AuthContext';
import HeaderActions from '../components/HeaderActions';

function MyProperties() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, handleApiResponse } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [user_search, setUser_search] = useState(null);
  const itemsPerPage = 12;
  
  // Fetch favorite IDs
  const fetchFavoriteIds = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`${baseUrl}favourites/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const apiCheck = await handleApiResponse(res);
      if (apiCheck.expired) {
        return;
      }
      
      const data = await res.json();
      setFavoriteIds(data.data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (propertyId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const isFavorite = favoriteIds.includes(propertyId);
      const url = isFavorite ? `${baseUrl}favourites/${propertyId}/` : `${baseUrl}favourites/`;
      const method = isFavorite ? 'DELETE' : 'POST';
      const body = isFavorite ? null : JSON.stringify({ property_id: propertyId });
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        ...(body && { body })
      });
      
      const apiCheck = await handleApiResponse(res);
      if (apiCheck.expired) {
        return;
      }
      
      if (res.ok) {
        setFavoriteIds(prev => {
          if (isFavorite) {
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
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Parse username from URL parameters
        const params = new URLSearchParams(location.search);
        const urlUsername = params.get('username');
        setUser_search(urlUsername);
        
        // Determine if viewing own properties or another user's properties
        const isOwnProperties = !urlUsername || urlUsername === user?.username;
        
        if (!user && !urlUsername) {
          setItems([]);
          setTotalCount(0);
          setTotalPages(0);
          return;
        }
        
        let apiUrl;
        
        // Use my-properties/ endpoint for own properties, properties/?username= for others
        if (isOwnProperties) {
          // Use my-properties/ endpoint for authenticated user's own properties
          apiUrl = new URL(`${baseUrl}my-properties/`);
          // Add pagination if API supports it
          apiUrl.searchParams.append('page', currentPage.toString());
          apiUrl.searchParams.append('page_size', itemsPerPage.toString());
        } else {
          // Use properties/?username= for viewing another user's properties
          apiUrl = new URL(`${baseUrl}properties/`);
          apiUrl.searchParams.append('username', urlUsername);
          apiUrl.searchParams.append('page', currentPage.toString());
          apiUrl.searchParams.append('page_size', itemsPerPage.toString());
        }
        
        const res = await fetch(apiUrl.toString(), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        // Check for token expiration
        const apiCheck = await handleApiResponse(res);
        if (apiCheck.expired) {
          return; // handleApiResponse already redirected
        }
        
        const data = await res.json();
        
        // Handle response format: { message, data: [...], count: ... }
        const propertyData = Array.isArray(data.data) ? data.data : (Array.isArray(data.results) ? data.results : []);
        setItems(propertyData);
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
      } catch (e) {
        setItems([]);
        setTotalCount(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
      fetchFavoriteIds();
    }
  }, [authLoading, user, currentPage, location.search, user_search]);

  const removeItem = async (id) => {
    if (!window.confirm('Xóa bất động sản này?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}properties/${id}/`, { 
        method: 'DELETE', 
        headers: token ? { Authorization: `Bearer ${token}` } : {} 
      });
      
      // Check for token expiration
      const apiCheck = await handleApiResponse(res);
      if (apiCheck.expired) {
        return; // handleApiResponse already redirected
      }
      
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {}
  };

  // Pagination functions
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}> 
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏢</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">RealEstate</h1>
            </div>
            <div className="flex items-center space-x-2">
              <HeaderActions 
                favoriteCount={favoriteIds.length}
                onFavoriteClick={() => navigate('/favorites')}
              />
              <AuthWrapper />
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium" onClick={() => navigate('/post-property')}>Đăng tin</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - User Profile */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center">
                  {/* User Avatar */}
                  <div className="relative mx-auto mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold mx-auto">
                      {user?.user?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">⭐</span>
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    { user_search || user?.user_fullname || user?.username || 'User'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tham gia RealEstate {user?.date_joined ? new Date(user.created_at).getFullYear() : '2024'}
                  </p>
                  
                  {/* Stats */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="text-sm text-gray-600">Tin đăng đang có</div>
                    <div className="text-xl font-bold text-gray-900">{totalCount}</div>
                  </div>
                  
                  {/* Contact Button */}
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center mb-3">
                    <Phone className="h-4 w-4 mr-2" />
                    Liên hệ
                  </button>
                  
                  {/* Verification Status */}
                  <div className="text-xs text-gray-500 text-center">
                    Đây là người dùng đã được xác thực thông tin cá nhân.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {(() => {
              const params = new URLSearchParams(location.search);
              const urlUsername = params.get('username');
              const displayUsername = urlUsername || user?.username;
              const isOwnProperties = !urlUsername || urlUsername === user?.username;
              
              return (
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Building2 className="h-5 w-5 mr-2"/>
                  {isOwnProperties ? 'Bất động sản của tôi' : `Bất động sản của ${displayUsername}`}
                </h2>
              );
            })()}

        {loading ? (
          <div className="text-gray-600">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-600">Chưa có bất động sản nào.</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-3 flex" onClick={() => navigate(`/property/${item.id}`)} style={{cursor:'pointer'}}>
                <div className="w-36 h-24 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                  <img src={ConfigUrl(item.thumbnail)} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                      {item.status && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          item.status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : item.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : item.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.status === 'approved' ? 'Đã duyệt' : item.status === 'pending' ? 'Chờ duyệt' : item.status === 'rejected' ? 'Từ chối' : item.status}
                        </span>
                      )}
                      {(() => {
                        const params = new URLSearchParams(location.search);
                        const urlUsername = params.get('username');
                        const isOwnProperties = !urlUsername || urlUsername === user?.username;
                        
                        return isOwnProperties ? (
                          <>
                            <button className="text-gray-400 hover:text-blue-600 transition-colors" onClick={(e)=>{e.stopPropagation(); navigate(`/edit-property/${item.id}`);}}>
                              <Pencil className="h-5 w-5"/>
                            </button>
                            <button className="text-gray-400 hover:text-red-600 transition-colors" onClick={(e)=>{e.stopPropagation(); removeItem(item.id);}}>
                              <Trash2 className="h-5 w-5"/>
                            </button>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center"><MapPin className="h-4 w-4 mr-1"/>{item.address}</div>
                </div>
              </div>
            ))}
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
        </div>
      </div>

      {/* Footer (match App.js) */}
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
    </div>
  );
}

export default MyProperties;