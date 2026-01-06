import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PropertyTypeSelect from '../useAPI/PropertyTypeSelect';
import LocationSelect from '../useAPI/LocationSelect';
import { 
  Home, 
  Building2, 
  Search, 
  Calendar,
  Filter
} from 'lucide-react';

function SearchPage() {
  const [activeTab, setActiveTab] = useState('ban');
  const [selectedCity, setSelectedCity] = useState('Thành phố Hồ Chí Minh');
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedDistrictNames, setSelectedDistrictNames] = useState([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedPropertyTypeNames, setSelectedPropertyTypeNames] = useState([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [areaMin, setAreaMin] = useState('');
  const [areaMax, setAreaMax] = useState('');

  const navigate = useNavigate();

  const navigationItems = [
    { id: 'ban', label: 'Bán', icon: Home },
    { id: 'thue', label: 'Thuê', icon: Building2 }
  ];

  const priceRanges = [
    'Dưới 500 triệu',
    '500 triệu - 1 tỷ',
    '1 tỷ - 2 tỷ',
    '2 tỷ - 3 tỷ',
    '3 tỷ - 5 tỷ',
    '5 tỷ - 10 tỷ',
    'Trên 10 tỷ'
  ];

  const areaRanges = [
    'Dưới 30 m²',
    '30 - 50 m²',
    '50 - 80 m²',
    '80 - 100 m²',
    '100 - 150 m²',
    '150 - 200 m²',
    'Trên 200 m²'
  ];

  const handleProvinceSelect = (provinceName, provinceId) => {
    console.log('Đã chọn tỉnh thành:', provinceName, 'ID:', provinceId);
    setSelectedDistricts([]);
    setSelectedDistrictNames([]);
    setSelectedCity(provinceName);
    console.log('Đã reset danh sách districts đã chọn');
  };

  const handleDistrictsChange = (districtIds, districtNames) => {
    setSelectedDistricts(districtIds || []);
    setSelectedDistrictNames(districtNames || []);
    console.log('Danh sách district IDs đã chọn cập nhật:', districtIds);
    console.log('Danh sách district names đã chọn cập nhật:', districtNames);
    console.log('Số lượng districts đã chọn:', districtIds?.length || 0);
  };

  const handlePropertyTypeSelect = (propertyTypeIds, propertyTypeNames) => {
    setSelectedPropertyTypes(propertyTypeIds || []);
    setSelectedPropertyTypeNames(propertyTypeNames || []);
    console.log('Danh sách property type IDs đã chọn:', propertyTypeIds);
    console.log('Danh sách property type names đã chọn:', propertyTypeNames);
  };

  const handleSearch = () => {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Add property types (comma-separated if multiple)
    if (selectedPropertyTypes.length > 0) {
      params.append('property_type', selectedPropertyTypes.join(','));
    }
    
    // Add province
    if (selectedCity && selectedCity !== 'Chọn tỉnh thành') {
      params.append('province', selectedCity);
    }
    
    // Add districts (comma-separated if multiple)
    if (selectedDistricts.length > 0) {
      params.append('district', selectedDistricts.join(','));
    }
    
    // Add price range
    if (priceMin) {
      params.append('price_min', priceMin);
    }
    if (priceMax) {
      params.append('price_max', priceMax);
    }
    
    // Add area range
    if (areaMin) {
      params.append('area_min', areaMin);
    }
    if (areaMax) {
      params.append('area_max', areaMax);
    }

    // Navigate to property list with query parameters
    const queryString = params.toString();
    const url = queryString ? `/properties?${queryString}` : '/properties';
    navigate(url);
    
    console.log('Navigating to:', url);
    console.log('Search parameters:', Object.fromEntries(params));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-1">
                <Home className="h-8 w-8 text-red-600" />
                <span className="text-xl font-bold text-gray-900">RealEstate</span>
              </div>
              
              {/* Navigation Tabs */}
              <nav className="flex space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === item.id
                          ? 'bg-red-100 text-red-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <Calendar className="h-6 w-6" />
              </button>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <Filter className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tìm kiếm bất động sản phù hợp
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Khám phá hàng nghìn bất động sản chất lượng với thông tin chi tiết và đánh giá từ cộng đồng
          </p>
        </div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Location Selection */}
            <div className="lg:col-span-2 xl:col-span-1">
              <LocationSelect
                onProvinceSelect={handleProvinceSelect}
                onDistrictSelect={handleDistrictsChange}
              />
            </div>

            {/* Property Type Selection */}
            <div>
              <PropertyTypeSelect onPropertyTypeSelect={handlePropertyTypeSelect} />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mức giá
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Từ (triệu)"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <input
                  type="number"
                  placeholder="Đến (triệu)"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Area Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diện tích (m²)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Từ (m²)"
                  value={areaMin}
                  onChange={(e) => setAreaMin(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <input
                  type="number"
                  placeholder="Đến (m²)"
                  value={areaMax}
                  onChange={(e) => setAreaMax(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSearch}
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 rounded-lg font-medium text-lg transition-colors flex items-center space-x-2"
            >
              <Search className="h-5 w-5" />
              <span>Tìm kiếm</span>
            </button>
          </div>
        </motion.div>

        {/* Selected Items Display */}
        {(selectedDistricts.length > 0 || selectedPropertyTypes.length > 0) && (
          <div className="space-y-3">
            {/* Hiển thị districts đã chọn */}
            {selectedDistricts.length > 0 && selectedDistrictNames && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Đã chọn {selectedDistricts.length} địa điểm:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDistrictNames && selectedDistrictNames.map((districtName, index) => (
                    <span
                      key={selectedDistricts[index] || index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {districtName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hiển thị property types đã chọn */}
            {selectedPropertyTypes.length > 0 && selectedPropertyTypeNames && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-red-900 mb-2">
                  Đã chọn {selectedPropertyTypes.length} loại nhà đất:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPropertyTypeNames && selectedPropertyTypeNames.map((typeName, index) => (
                    <span
                      key={selectedPropertyTypes[index] || index}
                      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                    >
                      {typeName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default SearchPage;
