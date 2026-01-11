import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { baseUrl, ConfigUrl } from '../base';
import {
  ArrowLeft,
  MapPin,
  Home,
  Ruler,
  DollarSign,
  FileText,
  Save,
  Loader,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import HeaderActions from '../components/HeaderActions';

function EditProperty() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, handleApiResponse } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [initialFormData, setInitialFormData] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    area_m2: '',
    address: '',
    legal_status: ''
  });

  // Check if form has changes
  const hasFormChanges = initialFormData && JSON.stringify(formData) !== JSON.stringify(initialFormData);
  const hasThumbnailChanges = thumbnailFile !== null;
  const hasChanges = hasFormChanges || hasThumbnailChanges;

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

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${baseUrl}properties/${id}/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        const apiCheck = await handleApiResponse(response);
        if (apiCheck.expired) {
          return;
        }

        if (!response.ok) {
          throw new Error('Không tìm thấy bất động sản');
        }

        const data = await response.json();
        const propertyData = data.data || data;
        
        setProperty(propertyData);
        
        // Populate form with existing data
        const initialData = {
          title: propertyData.title || '',
          description: propertyData.description || '',
          price: propertyData.price ? String(propertyData.price).replace(' tỷ', '').replace(' triệu', '') : '',
          area_m2: propertyData.area_m2 || '',
          address: propertyData.address || '',
          legal_status: propertyData.legal_status || ''
        };
        
        setFormData(initialData);
        setInitialFormData(initialData);
      } catch (error) {
        console.error('Error fetching property:', error);
        alert('Không thể tải thông tin bất động sản');
        navigate('/my-properties');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id, navigate, handleApiResponse]);

  const handleInputChange = (field, value) => {
    // Validate giá và diện tích phải >= 0
    if ((field === 'price' || field === 'area_m2') && value !== '') {
      const numValue = parseFloat(value);
      if (numValue < 0 || isNaN(numValue)) {
        return; // Không cập nhật nếu giá trị < 0 hoặc không phải số
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Tính giá trên m²
  const pricePerM2 = useMemo(() => {
    const price = parseFloat(formData.price);
    const area = parseFloat(formData.area_m2);
    if (price > 0 && area > 0) {
      return (price / area).toFixed(2);
    }
    return null;
  }, [formData.price, formData.area_m2]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasChanges) {
      return;
    }
    
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Calculate price_per_m2
      const price = parseFloat(formData.price);
      const area = parseFloat(formData.area_m2);
      const calculatedPricePerM2 = (price > 0 && area > 0) ? (price / area).toFixed(2) : null;
      
      // Prepare data
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        area_m2: formData.area_m2,
        price_per_m2: calculatedPricePerM2,
        legal_status: formData.legal_status || ''
      };

      let body;
      
      // If thumbnail changed, use FormData
      if (thumbnailFile) {
        const formDataToSend = new FormData();
        Object.keys(updateData).forEach(key => {
          formDataToSend.append(key, updateData[key]);
        });
        formDataToSend.append('thumbnail', thumbnailFile);
        body = formDataToSend;
        // Don't set Content-Type for FormData, browser will set it with boundary
      } else {
        // If no thumbnail change, use JSON
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(updateData);
      }
      
      const response = await fetch(`${baseUrl}properties/${id}/`, {
        method: 'PATCH',
        headers: headers,
        body: body
      });

      const apiCheck = await handleApiResponse(response);
      if (apiCheck.expired) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Có lỗi xảy ra khi cập nhật' }));
        throw new Error(errorData.message || errorData.detail || 'Có lỗi xảy ra khi cập nhật');
      }

      const result = await response.json();
      alert('Cập nhật thành công!');
      navigate(`/property/${id}`);
    } catch (error) {
      console.error('Error updating property:', error);
      alert(error.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy bất động sản</p>
          <button
            onClick={() => navigate('/my-properties')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

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
              <button 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                onClick={() => navigate('/post-property')}
              >
                Đăng tin
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/my-properties')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Quay lại danh sách
        </button>

        {/* Title */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Chỉnh sửa bất động sản</h1>
              <p className="text-white/80 mt-1">Cập nhật thông tin bất động sản của bạn</p>
            </div>
          </div>
        </div>

        {/* Property Info Display */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin hiện tại</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {property.status && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Trạng thái</div>
                <div className={`text-sm font-semibold ${
                  property.status === 'approved' ? 'text-green-600' :
                  property.status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {property.status === 'approved' ? 'Đã duyệt' :
                   property.status === 'pending' ? 'Đang chờ' :
                   'Đã từ chối'}
                </div>
              </div>
            )}
            {property.views !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Lượt xem</div>
                <div className="text-lg font-bold text-gray-900">{property.views}</div>
              </div>
            )}
            {property.time && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Đăng lúc</div>
                <div className="text-sm font-medium text-gray-900">{property.time}</div>
              </div>
            )}
            {property.price && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Giá hiện tại</div>
                <div className="text-lg font-bold text-red-600">{property.price}</div>
              </div>
            )}
          </div>
        </div>

        {/* Warning for approved status */}
        {property.status === 'approved' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">
                  Việc chỉnh sửa tiêu đề, mô tả hoặc giá sẽ khiến tin quay về trạng thái chờ duyệt.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Property Image Preview & Upload */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ảnh đại diện</h3>
          <div className="flex items-start gap-4">
            <div className="w-64 h-48 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {thumbnailPreview ? (
                <img 
                  src={thumbnailPreview} 
                  alt="thumbnail preview" 
                  className="w-full h-full object-cover"
                />
              ) : property.thumbnail ? (
                <img 
                  src={ConfigUrl(property.thumbnail)} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 text-sm text-center px-2">Chưa có ảnh</span>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn ảnh mới
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files && e.target.files[0];
                  if (f) {
                    setThumbnailFile(f);
                    setThumbnailPreview(URL.createObjectURL(f));
                  } else {
                    setThumbnailFile(null);
                    setThumbnailPreview('');
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {thumbnailFile && (
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailFile(null);
                    setThumbnailPreview('');
                  }}
                  className="mt-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Hủy thay đổi
                </button>
              )}
              {!thumbnailFile && property.thumbnail && (
                <p className="text-sm text-gray-500 mt-2">Ảnh hiện tại</p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Thông tin cơ bản
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tiêu đề bất động sản"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập mô tả chi tiết về bất động sản"
                  required
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Ruler className="h-5 w-5 mr-2 text-green-600" />
              Chi tiết bất động sản
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Giá (triệu VNĐ) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (isNaN(value) || value < 0) {
                      handleInputChange('price', '0');
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5000"
                  required
                />
              </div>

              {/* Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Ruler className="h-4 w-4 inline mr-1" />
                  Diện tích (m²) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.area_m2}
                  onChange={(e) => handleInputChange('area_m2', e.target.value)}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (isNaN(value) || value < 0) {
                      handleInputChange('area_m2', '0');
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100"
                  required
                />
              </div>

              {/* Price per m² */}
              {pricePerM2 && (
                <div className="md:col-span-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Giá trên m²:
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {parseFloat(pricePerM2).toLocaleString('vi-VN')} triệu VNĐ/m²
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Address - Read Only */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  placeholder="Nhập địa chỉ đầy đủ"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Để thay đổi địa chỉ, vui lòng liên hệ quản trị viên.
                </p>
              </div>

              {/* Legal Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pháp lý
                </label>
                <select
                  value={formData.legal_status}
                  onChange={(e) => handleInputChange('legal_status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Chọn pháp lý</option>
                  <option value="1">Sổ đỏ, sổ hồng</option>
                  <option value="2">Hợp đồng</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/my-properties')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center"
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProperty;
