import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { baseUrl, ConfigUrl } from '../base';
import PropertyMap from '../components/PropertyMap';
import AuthWrapper from '../components/auth/AuthWrapper';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import HeaderActions from '../components/HeaderActions';


import { 
  MapPin, 
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  User,
  Youtube,
  Facebook,
  Instagram,
  Twitter,
  Send,
  Heart
} from 'lucide-react';

function PropertyDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, handleApiResponse, user } = useAuth();
  const { sendMessage } = useChat();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Image modal (lightbox) state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    phone: '',
    email: '',
    content: ''
  });
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');

  const navigationItems = [
        { id: 'ban', label: 'Nhà đất bán' },
        { id: 'thue', label: 'Nhà đất thuê' },
        { id: 'tintuc', label: 'Tin tức' },
    ];

  useEffect(() => {
    // Chỉ fetch nếu id là số (tránh conflict với các route khác)
    if (!id || isNaN(Number(id))) {
      navigate('/property-list');
      return;
    }

    const fetchPropertyDetail = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Thêm JWT token nếu có (để owner có thể xem property rejected)
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${baseUrl}properties/${id}/`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Property Detail API Response:', data);
        
        if (data && data.data) {
          setProperty(data.data);
        } else {
          throw new Error('No property data found');
        }
      } catch (error) {
        console.error('Error fetching property detail:', error);
        // Navigate back if property not found
        navigate('/property-list');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetail();
  }, [id, navigate]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!id) return;
      setRecommendationsLoading(true);
      setRecommendationsError('');
      try {
        const response = await fetch(`${baseUrl}properties/${id}/recommendations/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data?.data)) {
          setRecommendations(data.data);
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setRecommendations([]);
        setRecommendationsError('Không thể tải danh sách đề xuất. Vui lòng thử lại sau.');
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, [id]);

  // Check if property is in favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${baseUrl}favourites/listID/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Check for token expiration
        const apiCheck = await handleApiResponse(response);
        if (apiCheck.expired) {
          return; // handleApiResponse already redirected
        }
        
        if (response.ok) {
          const data = await response.json();
          const favoriteIdsList = data.data || [];
          setFavoriteIds(favoriteIdsList);
          setIsFavorite(favoriteIdsList.includes(parseInt(id)));
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [id]);


  // Toggle favorite function
  const toggleFavorite = async () => {
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
        body: JSON.stringify({ property_id: parseInt(id) })
      });

      // Check for token expiration
      const apiCheck = await handleApiResponse(response);
      if (apiCheck.expired) {
        return; // handleApiResponse already redirected
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Toggle favorite response:', data);
        setIsFavorite(!isFavorite);
        
        // Update favoriteIds list
        setFavoriteIds(prev => {
          if (isFavorite) {
            return prev.filter(favId => favId !== parseInt(id));
          } else {
            return [...prev, parseInt(id)];
          }
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleUserClick = () => {
    if (property?.username) {
      navigate(`/my-properties?username=${property.username}`);
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

  const nextImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  // Lightbox helpers
  const openImageModal = (index) => {
    setModalImageIndex(index);
    setZoomScale(1);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setZoomScale(1);
  };

  const modalNext = () => {
    if (!property?.images?.length) return;
    setModalImageIndex((prev) => (prev === property.images.length - 1 ? 0 : prev + 1));
    setZoomScale(1);
  };

  const modalPrev = () => {
    if (!property?.images?.length) return;
    setModalImageIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
    setZoomScale(1);
  };

  const zoomIn = () => setZoomScale((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoomScale((z) => Math.max(1, +(z - 0.25).toFixed(2)));
  const resetZoom = () => setZoomScale(1);

  const formatPrice = (price) => {
    if (!price) return '0';
    const numPrice = parseFloat(price);
    if (numPrice >= 1000) {
      return `${(numPrice / 1000).toFixed(1)} tỷ`;
    }
    return `${numPrice.toFixed(0)} triệu`;
  };

  const formatArea = (area) => {
    if (!area) return '0';
    return `${parseFloat(area).toFixed(0)} m²`;
  };

  // Xử lý nút liên hệ
  const handleContactClick = () => {
    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
      alert('Vui lòng đăng nhập để liên hệ!');
      return;
    }
    // Nếu đã đăng nhập, hiển thị form liên hệ
    setShowContactForm(true);
  };





  // Đóng form liên hệ
  const handleCloseContactForm = () => {
    setShowContactForm(false);
    setContactInfo({ name: '', phone: '', email: '', content: '' });
  };

  // Xử lý thay đổi thông tin liên hệ
  const handleContactInfoChange = (field, value) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const attributeList = useMemo(() => {
    if (!property || !Array.isArray(property.attributes)) return [];
    return property.attributes.filter(
      (attr) =>
        attr &&
        typeof attr.attribute_name === 'string' &&
        attr.attribute_name.trim().length > 0 &&
        attr.value !== null &&
        attr.value !== undefined &&
        `${attr.value}`.trim().length > 0
    );
  }, [property]);

  const findAttributeByName = (name) => {
    if (!name) return null;
    return attributeList.find(
      (attr) =>
        attr.attribute_name &&
        attr.attribute_name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  };

  const formatAttributeValue = (attr, fallbackValue, fallbackUnit = '') => {
    if (attr) {
      return `${attr.value}${attr.unit ? ` ${attr.unit}` : ''}`;
    }
    if (fallbackValue === null || fallbackValue === undefined || fallbackValue === '' || Number.isNaN(fallbackValue)) {
      return null;
    }
    return `${fallbackValue}${fallbackUnit ? ` ${fallbackUnit}` : ''}`.trim();
  };

  const bedroomsAttribute = findAttributeByName('Số phòng ngủ');
  const floorsAttribute = findAttributeByName('Số tầng');
  const frontageAttribute = findAttributeByName('Mặt tiền') || findAttributeByName('Đường vào');

  function formatLegalStatus(status) {
    switch (status) {
      case 1:
        return 'Sổ đỏ';
      case 2:
        return 'Hợp đồng';
      default:
        return 'Khác';
    }
  }

  function getStatusInfo(status) {
    switch (status) {
      case 'approved':
        return { text: 'Đã duyệt', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'rejected':
        return { text: 'Đã từ chối', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'pending':
        return { text: 'Đang chờ duyệt', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      default:
        return { text: 'Không xác định', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  }

  // Tạo attributes_map dạng key-value để hiển thị
  const attributes_map = useMemo(() => {
    if (!property) return {};
    
    const map = {};
    


    // loại bất động sản
    if (property.property_type_name) {
      map['Loại bất động sản'] = property.property_type_name;
    }
    // Giá
    if (property.price) {
      map['Giá'] = formatPrice(property.price);
    }
    
    // Diện tích
    if (property.area_m2) {
      map['Diện tích'] = formatArea(property.area_m2);
    }
    
    // Pháp lý
    if (property.legal_status) {
      map['Pháp lý'] = formatLegalStatus(property.legal_status);
    }
    
    // Giá/m²
    if (property.price_per_m2) {
      map['Giá/m²'] = `${parseFloat(property.price_per_m2).toLocaleString()} triệu`;
    }

    
    
    // Thêm tất cả các attributes từ API (tránh trùng lặp với các trường đã có)
    attributeList.forEach((attr) => {
      const attrName = attr.attribute_name.trim();
      // Chỉ thêm nếu chưa có trong map
      if (!map[attrName]) {
        map[attrName] = `${attr.value}${attr.unit ? ` ${attr.unit}` : ''}`;
      }
    });
    
    return map;
  }, [property, attributeList, bedroomsAttribute, floorsAttribute, frontageAttribute]);

  // Gửi tin nhắn liên hệ qua Chat Socket
  const handleSendContact = async () => {
    // Kiểm tra các trường bắt buộc
    if (!contactInfo.name.trim()) {
      alert('Vui lòng nhập tên của bạn!');
      return;
    }
    if (!contactInfo.phone.trim()) {
      alert('Vui lòng nhập số điện thoại!');
      return;
    }
    if (!contactInfo.content.trim()) {
      alert('Vui lòng nhập nội dung tin nhắn!');
      return;
    }

    // Kiểm tra property và user_id
    if (!property) {
      alert('Không tìm thấy thông tin tài sản!');
      return;
    }

    // Lấy user_id của chủ bài viết (thử nhiều khả năng)
    const ownerUserId = property.user;
    if (!ownerUserId) {
      console.error('Property object:', property);
      alert('Không tìm thấy thông tin chủ sở hữu!');
      return;
    }

    // Kiểm tra nếu người gửi là chủ bài viết thì không được gửi
    if (user?.id === ownerUserId) {
      alert('Bạn không thể gửi tin nhắn cho chính mình!');
      return;
    }

    setSendingMessage(true);
    
    try {
      // Tạo message theo format yêu cầu
      const currentUrl = window.location.href;
      const propertyTitle = property.title || 'N/A';
      // Format số điện thoại: giữ 6 số đầu, ẩn 4 số cuối
      const phoneDisplay = contactInfo.phone.length > 4 
        ? contactInfo.phone.slice(0, -4) + ' ****' 
        : contactInfo.phone;

      const messageContent = `Tôi đang quan tâm tài sản có tiêu đề: ${propertyTitle}

Thông tin liên hệ:

        - Tên: ${contactInfo.name}

        - Số điện thoại: ${phoneDisplay}

        - Email: ${contactInfo.email || 'Không có'}

        Nội dung tin nhắn:

        ${contactInfo.content}

Link bài viết: ${currentUrl}`;

      // Gửi qua chat socket
      const sent = sendMessage({
        action: 'dm',
        to_user_id: ownerUserId,
        content: messageContent,
        reply: null
      });

      if (sent) {
        alert('Tin nhắn đã được gửi thành công!');
        setContactInfo({ name: '', phone: '', email: '', content: '' });
        setShowContactForm(false);
      } else {
        alert('Không thể kết nối. Vui lòng thử lại!');
      }
    } catch (error) {
      console.error('❌ Error sending contact message:', error);
      alert('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      setSendingMessage(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin bất động sản...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy thông tin bất động sản</p>
          <button 
            onClick={handleBack}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header (match App.js style) */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏢</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">RealEstate</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  onClick={
                    () => {
                      if (item.id === 'ban') {
                        navigate('/property-list?tab=ban');
                      } else if (item.id === 'thue') {
                        navigate('/property-list?tab=thue');
                      } else if (item.id === 'tintuc') {
                        navigate('/news');
                      }
                    }
                  }
                >
                  {item.label}
                </button>
              ))}
            </nav>

         {/* Header Actions - desktop vs mobile */}
            <div className="flex items-center space-x-2">
              <HeaderActions 
                favoriteCount={favoriteIds ? favoriteIds.length : 0}
                onFavoriteClick={() => navigate('/favorites')}
              />
              <AuthWrapper />
              <button className="hidden md:inline-flex bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors" onClick={handelNavigateToPostProperty}>
                Đăng tin
              </button>
              <button className="hidden lg:inline-flex bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors" onClick={handelNavigateToPricePrediction}>
                Dự đoán giá
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative h-96">
                {property.images && property.images.length > 0 ? (
                  <>
                    <img
                      src={ConfigUrl(property.images[currentImageIndex].image)}
                      alt={property.title}
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => openImageModal(currentImageIndex)}
                    />
                    
                    {/* Navigation Arrows */}
                    {property.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {property.images.length}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">Không có hình ảnh</p>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {property.images && property.images.length > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex space-x-2 overflow-x-auto">
                    {property.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex 
                            ? 'border-red-500' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={ConfigUrl(image.image)}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Property Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex-1">
                  {property.title || 'Không có tiêu đề'}
                </h2>
                {property.status && (
                  <span className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusInfo(property.status).color}`}>
                    {getStatusInfo(property.status).text}
                  </span>
                )}
              </div>
              
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                 <div className="flex items-center space-x-4">
                   <div className="flex items-center">
                     <MapPin className="h-4 w-4 mr-1" />
                     <span>{property.address || 'Không có địa chỉ'}</span>
                   </div>
                   <div className="flex items-center">
                     <Eye className="h-4 w-4 mr-1" />
                     <span>{property.views || 0} lượt xem</span>
                   </div>
                   <div className="flex items-center">
                     <Clock className="h-4 w-4 mr-1" />
                     <span>Đăng ngày {new Date(property.created_at).toLocaleDateString('vi-VN')}</span>
                   </div>
                 </div>
                                   <button 
                    className={`p-2 rounded-full transition-all duration-300 ${isFavorite ? 'text-red-500 bg-red-50 scale-110' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                    onClick={toggleFavorite}
                  >
                    <Heart className={`h-5 w-5 transition-all duration-300 ${isFavorite ? 'fill-current scale-110' : ''}`} />
                  </button>
               </div>

                             {/* Key Features */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                 {property.price && (
                   <div className="text-center p-4 bg-gray-50 rounded-lg">
                     <div className="text-sm text-gray-500 mb-1">Mức giá</div>
                     <div className="text-2xl font-bold text-red-600">
                       {formatPrice(property.price)}
                     </div>
                   </div>
                 )}
                 {property.area_m2 && (
                   <div className="text-center p-4 bg-gray-50 rounded-lg">
                     <div className="text-sm text-gray-500 mb-1">Mức diện tích</div>
                     <div className="text-2xl font-bold text-gray-900">
                       {formatArea(property.area_m2)}
                     </div>
                   </div>
                 )}
                 {formatAttributeValue(bedroomsAttribute, property.bedrooms) && (
                   <div className="text-center p-4 bg-gray-50 rounded-lg">
                     <div className="text-2xl font-bold text-gray-900">
                       {formatAttributeValue(bedroomsAttribute, property.bedrooms)}
                     </div>
                     <div className="text-sm text-gray-500">Phòng ngủ</div>
                   </div>
                 )}
                 {formatAttributeValue(floorsAttribute, property.floors) && (
                   <div className="text-center p-4 bg-gray-50 rounded-lg">
                     <div className="text-2xl font-bold text-gray-900">
                       {formatAttributeValue(floorsAttribute, property.floors)}
                     </div>
                     <div className="text-sm text-gray-500">Tầng</div>
                   </div>
                 )}
               </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Mô tả</h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {property.description || 'Không có mô tả'}
                </div>
              </div>

        {/* Additional Details */}
        {Object.keys(attributes_map).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin chi tiết</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(attributes_map).map(([key, value], index) => {
                  // Chia đều 2 cột: cột trái (index chẵn), cột phải (index lẻ)
                  if (index % 2 === 0) {
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">&nbsp;</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(attributes_map).map(([key, value], index) => {
                  // Chia đều 2 cột: cột trái (index chẵn), cột phải (index lẻ)
                  if (index % 2 === 1) {
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        )}
              </div>

              {/* Map section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Xem trên bản đồ</h3>
                <PropertyMap property={property} formatPrice={formatPrice} showMarker={true} />
              </div>
            </div>

            {/* Right Column - Contact and Actions (Sticky) */}
            <div className="lg:sticky lg:top-0 space-y-6 h-fit">
              {/* Agent Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liên hệ</h3>
                <div className="flex items-center sm:flex-col sm:text-center gap-3">
                  <div 
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full ring-2 ring-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer hover:ring-gray-300 transition-all"
                    onClick={handleUserClick}
                  >
                    <User className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">Chủ sở hữu</div>
                    <div 
                      className="text-sm text-gray-500 truncate cursor-pointer hover:text-gray-700 transition-colors"
                      onClick={handleUserClick}
                    >
                      {property.user_fullname}
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex items-center sm:justify-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{property.user_phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center sm:justify-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate">{property.user_email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <button 
                    onClick={handleContactClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    <span>Liên hệ</span>
                  </button>
                </div>
              </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Bất động sản đề xuất</h3>
            {recommendations.length > 0 && (
              <span className="text-sm text-gray-500">Dựa trên tin đang xem</span>
            )}
          </div>

          {recommendationsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 bg-white rounded-xl shadow">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500">Đang tải đề xuất...</p>
            </div>
          ) : recommendationsError ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100">
              {recommendationsError}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
              Hiện chưa có đề xuất phù hợp cho bất động sản này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow flex flex-col"
                >
                  <button
                    onClick={() => navigate(`/property/${item.id}`)}
                    className="relative h-48 w-full overflow-hidden rounded-t-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    {item.thumbnail ? (
                      <img
                        src={ConfigUrl(item.thumbnail)}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                        Không có ảnh
                      </div>
                    )}
                    {item.time && (
                      <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                        {item.time}
                      </span>
                    )}
                  </button>
                  <div className="p-5 flex flex-col flex-1 space-y-3">
                    <div className="space-y-1">
                      <h4
                        className="text-lg font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => navigate(`/property/${item.id}`)}
                      >
                        {item.title}
                      </h4>
                      <div className="text-red-600 font-bold text-xl">
                        {item.price || 'Thỏa thuận'}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{item.area_m2 ? `${parseFloat(item.area_m2).toFixed(0)} m²` : '—'}</span>
                      <span className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{item.views ?? 0}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/property/${item.id}`)}
                      className="mt-auto w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 rounded-lg transition-colors"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

             {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Gửi tin nhắn liên hệ</h3>
              </div>
              <button
                onClick={handleCloseContactForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Bất động sản:</span> {property?.title}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Chủ sở hữu:</span> {property?.user_fullname}
              </p>
            </div>

            <div className="space-y-4">
              {/* Thông tin cá nhân */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên của bạn *
                </label>
                <input
                  type="text"
                  value={contactInfo.name}
                  onChange={(e) => handleContactInfoChange('name', e.target.value)}
                  placeholder="Nhập tên của bạn"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                  placeholder="Nhập số điện thoại"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (tùy chọn)
                </label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => handleContactInfoChange('email', e.target.value)}
                  placeholder="Nhập email của bạn"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung tin nhắn *
                </label>
                <textarea
                  value={contactInfo.content}
                  onChange={(e) => handleContactInfoChange('content', e.target.value)}
                  placeholder="Nhập nội dung tin nhắn bạn muốn gửi đến chủ sở hữu..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={4}
                  disabled={sendingMessage}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCloseContactForm}
                disabled={sendingMessage}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSendContact}
                disabled={sendingMessage || !contactInfo.name.trim() || !contactInfo.phone.trim() || !contactInfo.content.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {sendingMessage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang gửi...
                  </>
                ) : (
                  'Gửi tin nhắn'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal (Lightbox with Zoom) */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={closeImageModal}>
          <div className="relative w-full max-w-5xl h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={ConfigUrl(property.images[modalImageIndex].image)}
              alt={`Image ${modalImageIndex + 1}`}
              className="w-full h-full object-contain select-none"
              style={{ transform: `scale(${zoomScale})`, transition: 'transform 150ms ease' }}
            />
            {/* Controls */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 rounded-full px-3 py-2">
              <button onClick={zoomOut} className="px-3 py-1 text-white hover:text-yellow-300">-</button>
              <span className="text-white text-sm w-10 text-center">{Math.round(zoomScale * 100)}%</span>
              <button onClick={zoomIn} className="px-3 py-1 text-white hover:text-yellow-300">+</button>
              <button onClick={resetZoom} className="ml-2 px-2 py-1 text-white/80 hover:text-white text-xs">Reset</button>
            </div>
            {property.images.length > 1 && (
              <>
                <button onClick={modalPrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={modalNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <button onClick={closeImageModal} className="absolute top-4 right-4 text-white/80 hover:text-white">Đóng</button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {modalImageIndex + 1} / {property.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyDetail;
