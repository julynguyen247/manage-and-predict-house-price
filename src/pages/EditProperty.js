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
    <></>
  );
}

export default EditProperty;
