import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { baseUrl } from '../base';
import { Calculator, MapPin, Home, AlertCircle, CheckCircle, Loader, Search } from 'lucide-react';
import AuthWrapper from '../components/auth/AuthWrapper';
import { useAuth } from '../contexts/AuthContext';
import HeaderActions from '../components/HeaderActions';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mapbox access token - you should move this to .env file
const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Custom Map Component for Price Prediction
function PricePredictionMap({ coordinates, onMapClick, showMarker, centerMap }) {
  const map = useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  // Navigate map to new location when centerMap changes
  React.useEffect(() => {
    if (centerMap && coordinates) {
      map.setView([coordinates.lat, coordinates.lng], 15);
    }
  }, [centerMap, coordinates, map]);

  return showMarker ? (
    <Marker position={[coordinates.lat, coordinates.lng]}>
      <Popup>
        <div>
          <strong>Tọa độ:</strong><br />
          Vĩ độ: {coordinates.lat.toFixed(6)}<br />
          Kinh độ: {coordinates.lng.toFixed(6)}
        </div>
      </Popup>
    </Marker>
  ) : null;
}

function PricePrediction() {
  const navigate = useNavigate();
  const { user, loading: authLoading, handleApiResponse } = useAuth();
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  
  const [formData, setFormData] = useState({
    propertyType: '',
    province: '',
    district: '',
    detailedAddress: '',
    area: '',
    frontage: '',
    bedrooms: '',
    legalStatus: '',
    floors: '',
    coordinates: { lat: 10.8624, lng: 106.5894 }
  });
  const [centerMap, setCenterMap] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propertyTypesRes = await fetch(`${baseUrl}property-types/`);
        const propertyTypesData = await propertyTypesRes.json();
        setPropertyTypes(propertyTypesData.data || []);

        const provincesRes = await fetch(`${baseUrl}provinces/`);
        const provincesData = await provincesRes.json();
        setProvinces(provincesData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.province) {
        setDistricts([]);
        return;
      }

      try {
        // Find the province by code to get its ID for the districts API
        const selectedProvince = provinces.find(p => p.code === parseInt(formData.province));
        if (!selectedProvince) {
          setDistricts([]);
          return;
        }

        const response = await fetch(`${baseUrl}provinces/${selectedProvince.id}/districts/`);
        const data = await response.json();
        setDistricts(data.data || []);
      } catch (error) {
        console.error('Error fetching districts:', error);
        setDistricts([]);
      }
    };

    fetchDistricts();
  }, [formData.province, provinces]);

  // Helper function to check property type name
  const getPropertyTypeName = (propertyTypeCode) => {
    if (!propertyTypeCode) return '';
    const selectedType = propertyTypes.find(pt => pt.code === parseInt(propertyTypeCode));
    return selectedType ? selectedType.name.toLowerCase() : '';
  };

  // Check if property type is apartment (căn hộ chung cư, chung cư mini)
  const isApartmentType = (propertyTypeCode) => {
    const typeName = getPropertyTypeName(propertyTypeCode);
    return typeName.includes('căn hộ chung cư') || 
           typeName.includes('chung cư mini') || 
           typeName.includes('căn hộ dịch vụ');
  };

  // Check if property type is land (bán đất, đất nền, đất nền dự án)
  const isLandType = (propertyTypeCode) => {
    const typeName = getPropertyTypeName(propertyTypeCode);
    return typeName.includes('bán đất') || 
           typeName.includes('đất nền') ||
           typeName.includes('đất nền dự án');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev };

      // Allow decimal numbers for area & frontage, integers for the rest
      const decimalFields = ['area', 'frontage'];
      const integerFields = ['bedrooms', 'floors'];

      if (decimalFields.includes(field)) {
        const decimalPattern = /^\d*\.?\d*$/;
        if (value === '' || decimalPattern.test(value)) {
          const numericValue = value === '' ? '' : parseFloat(value);
          newData[field] = Number.isNaN(numericValue) ? '' : (numericValue < 0 ? '0' : value);
        }
      } else if (integerFields.includes(field)) {
        const intValue = value === '' ? '' : parseInt(value, 10);
        newData[field] = Number.isNaN(intValue) ? '' : Math.max(0, intValue).toString();
      } else {
        newData[field] = value;
      }
      
      // Reset district when province changes
      if (field === 'province') {
        newData.district = '';
      }
      
      // Handle property type changes
      if (field === 'propertyType') {
        const propertyTypeCode = value;
        
        // If apartment type: set frontage and floors to 0
        if (isApartmentType(propertyTypeCode)) {
          newData.frontage = '0';
          newData.floors = '0';
        }
        
        // If land type: set bedrooms and floors to 0
        if (isLandType(propertyTypeCode)) {
          newData.bedrooms = '0';
          newData.floors = '0';
        }
      }
      
      return newData;
    });
  };

  const handleMapClick = (lat, lng) => {
    setFormData(prev => ({ ...prev, coordinates: { lat, lng } }));
  };

  const searchAddressOnMap = async () => {
    // Kiểm tra đã chọn đủ tỉnh/thành phố và quận/huyện chưa
    if (!formData.province || !formData.district) {
      alert('Vui lòng chọn đầy đủ Tỉnh/Thành phố và Quận/Huyện trước khi tìm kiếm địa chỉ');
      return;
    }

    if (!formData.detailedAddress.trim()) {
      alert('Vui lòng nhập địa chỉ chi tiết để tìm kiếm');
      return;
    }

    try {
      // Lấy tên tỉnh/thành phố và quận/huyện đã chọn
      const selectedProvince = provinces.find(p => p.code === parseInt(formData.province));
      const selectedDistrict = districts.find(d => d.code === parseInt(formData.district));
      
      if (!selectedProvince || !selectedDistrict) {
        alert('Không tìm thấy thông tin tỉnh/thành phố hoặc quận/huyện. Vui lòng thử lại.');
        return;
      }

      // Tạo query string: địa chỉ chi tiết + quận huyện + tỉnh thành phố
      const searchQuery = `${formData.detailedAddress.trim()}, ${selectedDistrict.name}, ${selectedProvince.name}, Vietnam`;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // Use Mapbox Geocoding API for better accuracy
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=VN&limit=1`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const location = data.features[0];
        const [lng, lat] = location.center; // Mapbox returns [lng, lat]
        console.log("location", location.center);
        
        // Update coordinates and trigger map centering
        setFormData(prev => ({ 
          ...prev, 
          coordinates: { lat, lng } 
        }));
        
        // Trigger map to center on new location
        setCenterMap(true);
        
        // Reset centerMap flag after a short delay
        setTimeout(() => setCenterMap(false), 100);
      } else {
        alert('Không tìm thấy địa chỉ. Vui lòng thử lại với địa chỉ khác.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      alert('Có lỗi xảy ra khi tìm kiếm địa chỉ. Vui lòng thử lại.');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          coordinates: { lat: latitude, lng: longitude }
        }));
        
        // Trigger map to center on current location
        setCenterMap(true);
        setTimeout(() => setCenterMap(false), 100);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Vui lòng đăng nhập để sử dụng tính năng dự đoán giá!');
      return;
    }

    // Check required fields based on property type
    const requiredFields = ['propertyType', 'province', 'district', 'area', 'legalStatus'];
    
    // Add conditional required fields
    if (!isApartmentType(formData.propertyType)) {
      requiredFields.push('frontage');
    }
    if (!isApartmentType(formData.propertyType) && !isLandType(formData.propertyType)) {
      requiredFields.push('floors');
    }
    if (!isLandType(formData.propertyType)) {
      requiredFields.push('bedrooms');
    }
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setLoading(true);
    setPredictionResult(null);

    try {
      const token = localStorage.getItem('token');
      
       const selectedPropertyType = propertyTypes.find(pt => pt.code === parseInt(formData.propertyType));
       const selectedProvince = provinces.find(p => p.code === parseInt(formData.province));
       const selectedDistrict = districts.find(d => d.code === parseInt(formData.district));

       // Prepare request data with proper defaults for disabled fields
       const isApartment = isApartmentType(formData.propertyType);
       const isLand = isLandType(formData.propertyType);
       
       const requestData = {
         input_data: {
           "loại nhà đất": selectedPropertyType?.code || 0,
           "mã huyện": selectedDistrict?.code || 0,
           "diện tích": parseFloat(formData.area) || 0,
           "mặt tiền": isApartment ? 0 : (parseFloat(formData.frontage) || 0),
           "phòng ngủ": isLand ? 0 : (parseInt(formData.bedrooms) || 0),
           "pháp lý": parseInt(formData.legalStatus) || 0,
           "tọa độ x": formData.coordinates.lat || 0,
           "tọa độ y": formData.coordinates.lng || 0,
           "số tầng": (isApartment || isLand) ? 0 : (parseInt(formData.floors) || 0),
           "mã tỉnh": selectedProvince?.code || 0
         }
       };

         const response = await fetch(`${baseUrl}predict-requests/`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify(requestData)
       });
       console.log("response", response);

       // Check for token expiration
       const apiCheck = await handleApiResponse(response);
       if (apiCheck.expired) {
         return; // handleApiResponse already redirected
       }

       const result = await response.json();
       console.log("result", result);
       
       if (response.ok) {
         setPredictionResult(result);
       } else {
         alert('Có lỗi xảy ra khi dự đoán giá. Vui lòng thử lại!');
       }
    } catch (error) {
      console.error('Error predicting price:', error);
      alert('Có lỗi xảy ra khi dự đoán giá. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      propertyType: '',
      province: '',
      district: '',
      detailedAddress: '',
      area: '',
      frontage: '',
      bedrooms: '',
      legalStatus: '',
      floors: '',
      coordinates: { lat: 10.8624, lng: 106.5894 }
    });
    setPredictionResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
         {/* Important Notice Banner */}
         <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-6">
           <div className="flex items-start space-x-4">
             <div className="flex-shrink-0">
               <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                 <AlertCircle className="h-5 w-5 text-amber-600" />
               </div>
             </div>
             <div className="flex-1">
               <h3 className="text-lg font-semibold text-amber-800 mb-2">
                 ⚠️ Lưu ý quan trọng về tính năng dự đoán giá
               </h3>
               <div className="text-amber-700 space-y-2">
                 <p className="text-sm">
                   <strong>Phạm vi áp dụng:</strong> Tính năng này hiện tại được tối ưu hóa cho khu vực 
                   <span className="font-semibold text-amber-800"> Thành phố Hồ Chí Minh</span>. 
                   Độ chính xác có thể giảm đối với các khu vực khác.
                 </p>
                 <p className="text-sm">
                   <strong>Mục đích sử dụng:</strong> Kết quả dự đoán chỉ mang tính chất 
                   <span className="font-semibold text-amber-800"> tham khảo</span> và 
                   <span className="font-semibold text-amber-800"> không nên được sử dụng để định giá giao dịch thực tế</span>.
                 </p>
                 <p className="text-sm">
                   <strong>Khuyến nghị:</strong> Vui lòng tham khảo ý kiến chuyên gia bất động sản hoặc 
                   môi giới có kinh nghiệm để có đánh giá chính xác về giá trị tài sản.
                 </p>
               </div>
             </div>
           </div>
         </div>

         <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
           <div className="flex items-center space-x-4">
             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
               <Calculator className="h-8 w-8 text-white" />
             </div>
             <div>
               <h1 className="text-3xl font-bold">Dự đoán giá bất động sản</h1>
               <p className="text-white/80 mt-1">Nhập thông tin bất động sản để nhận dự đoán giá chính xác</p>
             </div>
           </div>
         </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Home className="h-5 w-5 mr-2 text-blue-600" />
              Thông tin bất động sản
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại nhà đất *</label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Chọn loại nhà đất</option>
                  {propertyTypes.map(type => (
                    <option key={type.id} value={type.code}>{type.name}</option>
                  ))}
                </select>
              </div>

                <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố *</label>
                 <select
                   value={formData.province}
                   onChange={(e) => handleInputChange('province', e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   required
                 >
                   <option value="">Chọn tỉnh/thành phố</option>
                   {provinces.map(province => (
                     <option key={province.id} value={province.code}>{province.name}</option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện *</label>
                 <select
                   value={formData.district}
                   onChange={(e) => handleInputChange('district', e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   required
                   disabled={!formData.province}
                 >
                   <option value="">{formData.province ? 'Chọn quận/huyện' : 'Vui lòng chọn tỉnh/thành phố trước'}</option>
                   {districts.map(district => (
                     <option key={district.id} value={district.code}>{district.name}</option>
                   ))}
                 </select>
               </div>

                               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ chi tiết</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.detailedAddress}
                      onChange={(e) => handleInputChange('detailedAddress', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập địa chỉ xã/phường"
                    />
                    <button
                      type="button"
                      onClick={searchAddressOnMap}
                      disabled={!formData.province || !formData.district}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                        !formData.province || !formData.district
                          ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      title={!formData.province || !formData.district ? 'Vui lòng chọn đầy đủ Tỉnh/Thành phố và Quận/Huyện' : ''}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      Tìm
                    </button>
                  </div>
                  {(!formData.province || !formData.district) && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Vui lòng chọn Tỉnh/Thành phố và Quận/Huyện trước khi tìm kiếm địa chỉ
                    </p>
                  )}
                </div>

                <div>
                {/*
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tọa độ chính xác (Tùy chọn)
                    <span className="text-xs text-gray-500 ml-1">- Để trống nếu không biết</span>
                  </label>
                */}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Vĩ độ (Latitude)</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.coordinates.lat}
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value);
                          if (!isNaN(lat)) {
                            setFormData(prev => ({
                              ...prev,
                              coordinates: { ...prev.coordinates, lat }
                            }));
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="10.8624"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Kinh độ (Longitude)</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.coordinates.lng}
                        onChange={(e) => {
                          const lng = parseFloat(e.target.value);
                          if (!isNaN(lng)) {
                            setFormData(prev => ({
                              ...prev,
                              coordinates: { ...prev.coordinates, lng }
                            }));
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="106.5894"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCenterMap(true);
                        setTimeout(() => setCenterMap(false), 100);
                      }}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors flex items-center"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Cập nhật bản đồ
                    </button>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors flex items-center"
                    >
                      📍
                      <span className="ml-1">Vị trí hiện tại</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Nhập tọa độ chính xác để có kết quả dự đoán tốt hơn. Có thể lấy từ Google Maps hoặc các ứng dụng bản đồ khác.
                  </p>
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diện tích (m²) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100"
                  min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mặt tiền (m) {isApartmentType(formData.propertyType) ? '' : '*'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.frontage}
                    onChange={(e) => handleInputChange('frontage', e.target.value)}
                    disabled={isApartmentType(formData.propertyType)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isApartmentType(formData.propertyType) ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="5"
                  min="0"
                    required={!isApartmentType(formData.propertyType)}
                  />
                  {isApartmentType(formData.propertyType) && (
                    <p className="text-xs text-gray-500 mt-1">Không áp dụng cho loại căn hộ</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số phòng ngủ {isLandType(formData.propertyType) ? '' : '*'}
                  </label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    disabled={isLandType(formData.propertyType)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isLandType(formData.propertyType) ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="1"
                  min="0"
                    required={!isLandType(formData.propertyType)}
                  />
                  {isLandType(formData.propertyType) && (
                    <p className="text-xs text-gray-500 mt-1">Không áp dụng cho loại đất</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số tầng {isApartmentType(formData.propertyType) ? '' : '*'}
                  </label>
                  <input
                    type="number"
                    value={formData.floors}
                    onChange={(e) => handleInputChange('floors', e.target.value)}
                    disabled={isApartmentType(formData.propertyType)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      (isApartmentType(formData.propertyType) || isLandType(formData.propertyType)) ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="1"
                  min="0"
                    required={!(isApartmentType(formData.propertyType) || isLandType(formData.propertyType))}
                  />
                  {isApartmentType(formData.propertyType) && (
                    <p className="text-xs text-gray-500 mt-1">Không áp dụng cho loại căn hộ</p>
                  )}
                  {isLandType(formData.propertyType) && !isApartmentType(formData.propertyType) && (
                    <p className="text-xs text-gray-500 mt-1">Không áp dụng cho loại đất nền/bán đất</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pháp lý *</label>
                <select
                  value={formData.legalStatus}
                  onChange={(e) => handleInputChange('legalStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Chọn pháp lý</option>
                  <option value="1">Sổ đỏ, sổ hồng</option>
                  <option value="2">Hợp đồng</option>
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Đang dự đoán...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5 mr-2" />
                      Dự đoán giá
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Làm mới
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
                         <div className="bg-white rounded-xl shadow-lg p-6">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                 <MapPin className="h-5 w-5 mr-2 text-green-600" />
                 Chọn vị trí trên bản đồ
               </h3>
               <div className="h-64 rounded-lg overflow-hidden">
                 <MapContainer
                   center={[formData.coordinates.lat, formData.coordinates.lng]}
                   zoom={13}
                   style={{ height: '100%', width: '100%' }}
                   className="rounded-lg"
                 >
                   <TileLayer
                     url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`}
                     attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                   />
                                       <PricePredictionMap
                      coordinates={formData.coordinates}
                      onMapClick={handleMapClick}
                      showMarker={true}
                      centerMap={centerMap}
                    />
                 </MapContainer>
               </div>
               <div className="mt-4 space-y-2">
                 <p className="text-sm text-gray-600">
                   <strong>Tọa độ hiện tại:</strong> {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                 </p>
                 <p className="text-xs text-gray-500">
                   💡 Nhấp vào bản đồ để thay đổi vị trí marker, hoặc sử dụng ô tìm kiếm bên trên
                 </p>
               </div>
             </div>

                         {predictionResult && (
               <div className="bg-white rounded-xl shadow-lg p-6">
                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                   <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                   Kết quả dự đoán
                 </h3>
                 
                 <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-xl p-6 border border-green-100">
                   <div className="text-center space-y-6">
                     {predictionResult.predict_result ? (
                       <>
                         {/* Total Price Section */}
                         <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                           <div className="flex items-center justify-center mb-2">
                             <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                             <span className="text-sm font-medium text-gray-700">Tổng giá trị bất động sản</span>
                           </div>
                           <div className="text-2xl font-bold text-green-600">
                             {parseFloat(predictionResult.predict_result).toLocaleString()} triệu VNĐ
                           </div>
                           <div className="text-xs text-gray-500 mt-1">
                             Giá dự đoán tổng thể
                           </div>
                         </div>

                         {/* Price per m² Section */}
                         <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                           <div className="flex items-center justify-center mb-2">
                             <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                             <span className="text-sm font-medium text-gray-700">Giá trên mỗi mét vuông</span>
                           </div>
                           <div className="text-2xl font-bold text-blue-600">
                             {parseFloat(predictionResult.predict_price_per_m2).toLocaleString()} triệu VNĐ/m²
                           </div>
                           <div className="text-xs text-gray-500 mt-1">
                             Đơn giá tham khảo
                           </div>
                         </div>

                         {/* Summary Section */}
                         <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4">
                           <div className="flex items-center justify-center mb-2">
                             <Calculator className="h-4 w-4 text-green-600 mr-2" />
                             <span className="text-sm font-semibold text-gray-800">Tóm tắt dự đoán</span>
                           </div>
                           <div className="grid grid-cols-2 gap-4 text-xs">
                             <div className="text-center">
                               <div className="font-medium text-gray-700">Tổng giá trị</div>
                               <div className="text-green-600 font-semibold">
                                 {parseFloat(predictionResult.predict_result).toLocaleString()} triệu
                               </div>
                             </div>
                             <div className="text-center">
                               <div className="font-medium text-gray-700">Đơn giá</div>
                               <div className="text-blue-600 font-semibold">
                                 {parseFloat(predictionResult.predict_price_per_m2).toLocaleString()} triệu/m²
                               </div>
                             </div>
                           </div>
                         </div>

                         {/* Disclaimer */}
                         <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                           <div className="flex items-start">
                             <AlertCircle className="h-3 w-3 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                             <div>
                               <p className="font-medium text-gray-700 mb-1">Lưu ý quan trọng:</p>
                               <p>Kết quả dự đoán này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy thuộc vào nhiều yếu tố khác như thị trường, thời điểm giao dịch, và các điều kiện cụ thể của bất động sản.  </p>
                             </div>
                           </div>
                         </div>
                       </>
                     ) : (
                       <div className="flex items-center justify-center py-8">
                         <Loader className="h-6 w-6 animate-spin text-green-600 mr-2" />
                         <span className="text-gray-600">Đang xử lý dự đoán...</span>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             )}

            {!user && !authLoading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Cần đăng nhập</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Vui lòng đăng nhập để sử dụng tính năng dự đoán giá bất động sản.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricePrediction;
