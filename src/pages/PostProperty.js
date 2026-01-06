import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Bed,
  Landmark,
  Ruler,
  Type,
  X,
} from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LocationSelect from '../useAPI/LocationSelect';
import PropertyTypeSelect from '../useAPI/PropertyTypeSelect';
import apiService from '../utils/api';
import { baseUrl } from '../base';

const API_POST_PROPERTY = `${baseUrl}properties/`;


// Fix Leaflet marker icons (same as PropertyMap)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = { lat: 10.8231, lng: 106.6297 }; // Ho Chi Minh fallback

function normalizeText(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function includesNormalized(haystack, needle) {
  if (!haystack || !needle) return false;
  return normalizeText(haystack).includes(normalizeText(needle));
}

function RecenterOnPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 15, { animate: true });
    }
  }, [map, position]);
  return null;
}

function ClickToMoveMarker({ onChange }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      if (onChange) onChange({ lat, lng });
      console.log("lat", lat);
      console.log("lng", lng);
    }
  });
  return null;
}

function PostProperty() {
  const navigate = useNavigate();
  const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
  // console.log("mapboxToken", mapboxToken);

  // Steps: 1 -> basic info, 2 -> map + details + submit
  const [step, setStep] = useState(1);

  // Step 1 state
  const [listingType, setListingType] = useState('ban'); // 'ban' | 'thue'
  const [provinceName, setProvinceName] = useState('');
  const [provinceId, setProvinceId] = useState(null);
  const [districtIds, setDistrictIds] = useState([]);
  const [districtNames, setDistrictNames] = useState([]);
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState(''); // triệu
  const [area, setArea] = useState(''); // m2
  const [selectedPropertyTypeIds, setSelectedPropertyTypeIds] = useState([]);
  const [selectedPropertyTypeNames, setSelectedPropertyTypeNames] = useState([]);

  // Step 2 state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [legalStatus, setLegalStatus] = useState(''); // numeric code
  
  // Attributes state
  const [attributesList, setAttributesList] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]); // [{attribute_id, value, name, unit}]
  const [openForms, setOpenForms] = useState([]); // [{id, attributeId, value}]

  // Map / geocode
  const [position, setPosition] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Step 3 state (images)
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [galleryProgress, setGalleryProgress] = useState([]);

  const fullAddress = useMemo(() => {
    const parts = address;
    console.log(parts);
    return parts;
  }, [address, districtNames, provinceName]);

  // Fetch attributes khi property_type thay đổi
  useEffect(() => {
    const fetchAttributes = async () => {
      if (selectedPropertyTypeIds.length === 1) {
        try {
          const response = await fetch(`${baseUrl}attributes/?property_type_id=${selectedPropertyTypeIds[0]}`);
          if (response.ok) {
            const data = await response.json();
            setAttributesList(data.data || []);
            setSelectedAttributes([]);
            setOpenForms([]);
          }
        } catch (error) {
          console.error('Error fetching attributes:', error);
        }
      } else {
        setAttributesList([]);
        setSelectedAttributes([]);
        setOpenForms([]);
      }
    };
    fetchAttributes();
  }, [selectedPropertyTypeIds]);

  // Lấy danh sách attributes chưa được thêm vào danh sách
  const availableAttributes = attributesList.filter(
    attr => !selectedAttributes.some(selected => selected.attribute_id === attr.id)
  );

  // Mở form thêm attribute mới
  const handleOpenForm = () => {
    setOpenForms([...openForms, { id: Date.now(), attributeId: '', value: '' }]);
  };

  // Cập nhật form
  const handleUpdateForm = (formId, field, value) => {
    setOpenForms(openForms.map(form => 
      form.id === formId ? { ...form, [field]: value } : form
    ));
  };

  // Thêm attribute từ form
  const handleAddAttribute = (formId) => {
    const form = openForms.find(f => f.id === formId);
    if (!form || !form.attributeId || !form.value.trim()) return;
    
    const attr = attributesList.find(a => a.id === parseInt(form.attributeId));
    if (attr && !selectedAttributes.some(s => s.attribute_id === attr.id)) {
      setSelectedAttributes([...selectedAttributes, {
        attribute_id: attr.id,
        value: form.value.trim(),
        name: attr.name,
        unit: attr.unit
      }]);
      setOpenForms(openForms.filter(f => f.id !== formId));
    }
  };

  // Đóng form
  const handleCloseForm = (formId) => {
    setOpenForms(openForms.filter(f => f.id !== formId));
  };

  // Xóa attribute
  const handleRemoveAttribute = (attributeId) => {
    setSelectedAttributes(selectedAttributes.filter(a => a.attribute_id !== attributeId));
  };

  const handleProvinceSelect = (name, id) => {
    setProvinceName(name || '');
    setProvinceId(id || null);
    setDistrictIds([]);
    setDistrictNames([]);
  };

  const handleDistrictSelect = (ids, names) => {
    setDistrictIds(Array.isArray(ids) ? ids : []);
    setDistrictNames(Array.isArray(names) ? names : []);
  };

  const validateStep1 = () => {
    if (!listingType) return 'Vui lòng chọn Bán hoặc Thuê';
    if (!provinceId) return 'Vui lòng chọn tỉnh/thành';
    if (!districtIds || districtIds.length === 0) return 'Vui lòng chọn quận/huyện';
    if (!address.trim()) return 'Vui lòng nhập địa chỉ cụ thể';
    // Yêu cầu địa chỉ phải bao gồm cả quận/huyện và tỉnh/thành (so khớp không dấu)
    const firstDistrictName = districtNames && districtNames[0];
    if (provinceName && !includesNormalized(address, provinceName)) {
      return 'Vui lòng nhập địa chỉ có cả tên tỉnh/thành (ví dụ: "..., ' + provinceName + '")';
    }
    if (firstDistrictName && !includesNormalized(address, firstDistrictName)) {
      return 'Vui lòng nhập địa chỉ có cả tên quận/huyện (ví dụ: "..., ' + firstDistrictName + '")';
    }
    if (!price || isNaN(Number(price))) return 'Vui lòng nhập mức giá hợp lệ (triệu)';
    if (!area || isNaN(Number(area))) return 'Vui lòng nhập diện tích hợp lệ (m²)';
    if (!selectedPropertyTypeIds || selectedPropertyTypeIds.length !== 1) return 'Vui lòng chọn 1 loại nhà đất';
    return '';
  };

  const validateStep2 = () => {
    if (!title.trim()) return 'Tiêu đề là bắt buộc';
    if (!description.trim()) return 'Mô tả là bắt buộc';
    if (!position) return 'Không xác định được vị trí trên bản đồ';
    return '';
  };

  const geocodeWithMapbox = async (query) => {
    if (!mapboxToken) return null;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${mapboxToken}&limit=1&language=vi`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401) {
        console.warn('Mapbox token không hợp lệ hoặc đã hết hạn. Sẽ sử dụng OpenStreetMap thay thế.');
      }
      throw new Error(`Mapbox geocoding error: ${res.status}`);
    }
    const data = await res.json();
    const feature = data.features && data.features[0];
    if (feature && feature.center && feature.center.length === 2) {
      const [lng, lat] = feature.center;
      return { lat, lng };
    }
    return null;
  };

  const geocodeWithNominatim = async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
    if (!res.ok) throw new Error(`OSM geocoding error: ${res.status}`);
    const data = await res.json();
    const first = data && data[0];
    if (first) {
      return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
    }
    return null;
  };

  const handleContinue = async () => {
    const err = validateStep1();
    if (err) {
      alert(err);
      return;
    }

    setGeocoding(true);
    setGeoError('');
    try {
      let pos = null;
      let usedFallback = false;
      try {
        pos = await geocodeWithMapbox(fullAddress);
      } catch (e) {
        console.warn('Mapbox geocoding failed, trying OpenStreetMap:', e.message);
        usedFallback = true;
      }
      if (!pos) {
        try {
          pos = await geocodeWithNominatim(fullAddress);
          if (pos && usedFallback) {
            console.log('Đã sử dụng OpenStreetMap để tìm vị trí');
          }
        } catch (nominatimError) {
          console.error('OpenStreetMap geocoding also failed:', nominatimError);
        }
      }
      setPosition(pos || DEFAULT_CENTER);
      if (!pos) {
        setGeoError('Không tìm thấy vị trí từ địa chỉ. Bạn có thể kéo pin để chỉnh vị trí trên bản đồ.');
      }
      setStep(2);
    } catch (e) {
      console.error('Geocoding error:', e);
      setGeoError('Không tìm thấy vị trí từ địa chỉ. Bạn có thể kéo pin để chỉnh vị trí trên bản đồ.');
      setPosition(DEFAULT_CENTER);
      setStep(2);
    } finally {
      setGeocoding(false);
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleFinalize = async () => {
    // Ensure step 2 required fields are valid before finalizing
    const err = validateStep2();
    if (err) {
      alert(err);
      return;
    }

    setSubmitting(true);
    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('tab', listingType);
      formData.append('province', provinceId);
      formData.append('district', districtIds[0]);
      formData.append('address', fullAddress);
      formData.append('price', Number(price));
      formData.append('area_m2', Number(area));
      formData.append('price_per_m2', parseFloat((Number(price) / Number(area)).toFixed(2)));
      formData.append('coord_x', position?.lng ?? '');
      formData.append('coord_y', position?.lat ?? '');
      formData.append('property_type', selectedPropertyTypeIds[0] || '');
      formData.append('legal_status', legalStatus ? Number(legalStatus) : '');

      // Add attributes
      if (selectedAttributes.length > 0) {
        const attributes = selectedAttributes.map(attr => ({
          attribute_id: attr.attribute_id,
          value: attr.value
        }));
        formData.append('attributes', JSON.stringify(attributes));
      }

      // Add files
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      
      if (galleryFiles && galleryFiles.length > 0) {
        galleryFiles.forEach((file, index) => {
          formData.append('images', file);
        });
      }

      // Create property with FormData
      const res = await apiService.postFormData('properties/', formData);
      const propertyId = res?.data?.id || res?.id;
      if (!propertyId) throw new Error('Không lấy được ID bất động sản sau khi tạo');

      alert('Đăng tin thành công!');
      navigate(`/property/${propertyId}`);
    } catch (e) {
      console.error('Finalize submit error:', e);
      alert('Có lỗi khi gửi dữ liệu hoặc tải ảnh. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const mapTileUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Đăng tin bất động sản</h1>
            <div className="w-6" />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-6 text-sm text-gray-600">
          <div className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>Bước 1: Thông tin cơ bản</div>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <div className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>Bước 2: Bản đồ & chi tiết</div>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <div className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>Bước 3: Ảnh</div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            {/* Listing type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hình thức</label>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200">
                <button
                  className={`px-4 py-2 ${listingType === 'ban' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'}`}
                  onClick={() => setListingType('ban')}
                >
                  Bán
                </button>
                <button
                  className={`px-4 py-2 ${listingType === 'thue' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'}`}
                  onClick={() => setListingType('thue')}
                >
                  Thuê
                </button>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Khu vực</label>
              <div className="flex items-stretch border border-gray-300 rounded-lg overflow-visible w-full">
                <LocationSelect
                  onProvinceSelect={handleProvinceSelect}
                  onDistrictSelect={handleDistrictSelect}
                  maxDistrictSelections={1}
                />
              </div>
            </div>

            {/* Property Type */}
            <div>
              <PropertyTypeSelect
                onPropertyTypeSelect={(ids, names) => {
                  setSelectedPropertyTypeIds(ids || []);
                  setSelectedPropertyTypeNames(names || []);
                }}
                tab={listingType}
              />
              {selectedPropertyTypeIds.length !== 1 && (
                <p className="mt-1 text-xs text-orange-600">Vui lòng chọn đúng 1 loại nhà đất.</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ cụ thể</label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-1 text-xs text-gray-500">Lưu ý: Bản đồ sẽ định vị dựa vào ô này. Vui lòng nhập đủ quận/huyện và tỉnh/thành.</p>
            </div>

            {/* Price & Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {listingType === 'thue' ? 'Giá (triệu/tháng)' : 'Giá (triệu)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                    placeholder="Ví dụ: 1500 (tương đương 1.5 tỷ)"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <Type className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                {Number(price) > 0 && Number(area) > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Giá/m²: <span className="font-medium text-red-600">{(Number(price) / Number(area)).toFixed(2)}</span> triệu/m²
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diện tích (m²)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                    placeholder="Ví dụ: 75"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                  <Ruler className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleContinue}
                disabled={geocoding}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {geocoding ? 'Đang tìm vị trí...' : 'Tiếp tục'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {/* Thumbnail uploader */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Ảnh đại diện (thumbnail)</h3>
              <div className="flex items-start gap-4">
                <div className="w-48 h-36 bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="thumbnail preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-sm text-center px-2">Chưa chọn ảnh</span>
                  )}
                </div>
                <div className="flex-1">
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
                  />
                  {thumbProgress > 0 && thumbProgress < 100 && (
                    <div className="mt-2 text-xs text-gray-600">Đang tải: {thumbProgress.toFixed(0)}%</div>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery uploader */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Thư viện ảnh</h3>
              <div className="mb-3 flex items-center gap-3 flex-wrap">
                <label className="inline-block px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      const newFiles = [...galleryFiles, ...files];
                      const newPreviews = [...galleryPreviews, ...files.map((f) => URL.createObjectURL(f))];
                      const newProgress = [...galleryProgress, ...new Array(files.length).fill(0)];
                      setGalleryFiles(newFiles);
                      setGalleryPreviews(newPreviews);
                      setGalleryProgress(newProgress);
                      e.target.value = '';
                    }}
                  />
                  <span className="text-sm text-gray-700">Thêm ảnh</span>
                </label>
                {galleryFiles.length > 0 && (
                  <div className="text-xs text-gray-500">{galleryFiles.length} ảnh đã chọn</div>
                )}
              </div>
              {galleryPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {galleryPreviews.map((src, idx) => (
                    <div key={idx} className="relative border border-gray-200 rounded-lg overflow-hidden group">
                      <img src={src} alt={`preview-${idx}`} className="w-full h-28 object-cover" />
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => {
                          const nf = [...galleryFiles];
                          const np = [...galleryPreviews];
                          const ng = [...galleryProgress];
                          nf.splice(idx, 1);
                          np.splice(idx, 1);
                          ng.splice(idx, 1);
                          setGalleryFiles(nf);
                          setGalleryPreviews(np);
                          setGalleryProgress(ng);
                        }}
                        className="absolute top-1 right-1 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Xóa ảnh"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {typeof galleryProgress[idx] === 'number' && galleryProgress[idx] > 0 && galleryProgress[idx] < 100 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1">
                          {galleryProgress[idx].toFixed(0)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Quay lại
              </button>
              <button
                onClick={handleFinalize}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Hoàn tất đăng tin'}
              </button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Vị trí trên bản đồ</h3>
              {geoError && (
                <div className="mb-3 text-sm text-orange-700 bg-orange-50 border border-orange-200 px-3 py-2 rounded">
                  {geoError}
                </div>
              )}
              <div className="h-80 rounded-lg overflow-hidden relative">
                <MapContainer
                  center={[position?.lat || DEFAULT_CENTER.lat, position?.lng || DEFAULT_CENTER.lng]}
                  zoom={15}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url={mapTileUrl}
                    attribution={mapboxToken ? '© Mapbox © OpenStreetMap' : '© OpenStreetMap contributors'}
                    tileSize={256}
                    zoomOffset={0}
                  />
                  <RecenterOnPosition position={position} />
                  <ClickToMoveMarker onChange={(latlng) => setPosition(latlng)} />
                  <Marker
                    position={[position?.lat || DEFAULT_CENTER.lat, position?.lng || DEFAULT_CENTER.lng]}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const latlng = e.target.getLatLng();
                        setPosition({ lat: latlng.lat, lng: latlng.lng });
                      },
                    }}
                  />
                </MapContainer>
              </div>
              <div className="text-xs text-gray-500 mt-2">Bạn có thể kéo pin để chỉnh vị trí chính xác.</div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề *</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Nhập tiêu đề tin đăng"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả *</label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Mô tả chi tiết về bất động sản..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              {/* Legal Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pháp lý</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={legalStatus}
                  onChange={(e) => setLegalStatus(e.target.value)}
                >
                  <option value="">Chọn</option>
                  <option value="1">Sổ đỏ, Sổ hồng</option>
                  <option value="2">Hợp đồng</option>
                  <option value="4">Khác</option>
                </select>
              </div>

              {/* Attributes Box */}
              {attributesList.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Thuộc tính</h3>
                  
                  {/* Danh sách attributes đã thêm */}
                  {selectedAttributes.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {selectedAttributes.map((attr) => (
                        <div key={attr.attribute_id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">{attr.name}:</span>
                            <span className="ml-2 text-sm text-gray-900">
                              {attr.value}{attr.unit ? ` ${attr.unit}` : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttribute(attr.attribute_id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Các form thêm attribute */}
                  {openForms.map((form) => {
                    const selectedAttr = form.attributeId ? attributesList.find(a => a.id === parseInt(form.attributeId)) : null;
                    const isNumeric = selectedAttr && ['Số phòng ngủ', 'Số phòng tắm, vệ sinh', 'Mặt tiền', 'Đường vào'].includes(selectedAttr.name);
                    return (
                      <div key={form.id} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3 mb-3">
                        <div className="flex items-center gap-3">
                          <select
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            value={form.attributeId}
                            onChange={(e) => handleUpdateForm(form.id, 'attributeId', e.target.value)}
                          >
                            <option value="">Chọn thuộc tính</option>
                            {availableAttributes.map(attr => (
                              <option key={attr.id} value={attr.id}>{attr.name}</option>
                            ))}
                          </select>
                          {form.attributeId ? (
                            <input
                              type={isNumeric ? 'number' : 'text'}
                              min={isNumeric ? '0' : undefined}
                              step={isNumeric ? (selectedAttr.name === 'Mặt tiền' || selectedAttr.name === 'Đường vào' ? '0.01' : '1') : undefined}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              placeholder={selectedAttr?.unit ? `Nhập ${selectedAttr.unit.toLowerCase()}` : 'Nhập giá trị'}
                              value={form.value}
                              onChange={(e) => handleUpdateForm(form.id, 'value', e.target.value)}
                            />
                          ) : (
                            <div className="flex-1 px-3 py-2 text-gray-400 text-sm border border-gray-200 rounded-lg bg-gray-50">
                              Chọn thuộc tính trước
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddAttribute(form.id)}
                            disabled={!form.attributeId || !form.value.trim()}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Thêm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCloseForm(form.id)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Nút thêm thuộc tính */}
                  <button
                    type="button"
                    onClick={handleOpenForm}
                    disabled={availableAttributes.length === 0}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-lg">+</span>
                    <span>Thêm thuộc tính</span>
                  </button>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostProperty;


