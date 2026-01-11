import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { baseUrl, ConfigUrl } from '../base';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Camera, 
  Save, 
  Edit3, 
  Upload,
  AlertCircle,
  Shield,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser, handleApiResponse } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    bio: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Fetch user profile data from API
  const fetchUserProfile = async () => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch(`${baseUrl}me/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const apiCheck = await handleApiResponse(response);
      if (apiCheck.expired) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data;
        
        // Update profile data with API response
        setProfileData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          date_of_birth: userData.birth_date || '',
          bio: userData.description || '' // Map description to bio field
        });
        
        // Set avatar preview
        if (userData.avatar) {
          setAvatarPreview(ConfigUrl(userData.avatar));
        }
        
        // Update user context with fresh data
        updateUser({
          ...user,
          ...userData,
          avatar: userData.avatar,
          is_verified: userData.is_verified,
          is_active: userData.is_active
        });
        
        console.log('Profile data loaded:', userData);
        console.log('Mapped profile data:', {
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phone: userData.phone,
          birth_date: userData.birth_date,
          description: userData.description,
          avatar: userData.avatar,
          is_verified: userData.is_verified
        });
      } else {
        console.error('Failed to fetch profile data');
        // Fallback to existing user data
        if (user) {
          setProfileData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            date_of_birth: user.birth_date || user.date_of_birth || '',
            bio: user.description || user.bio || ''
          });
          setAvatarPreview(user.avatar ? ConfigUrl(user.avatar) : null);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Fallback to existing user data
      if (user) {
        setProfileData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          date_of_birth: user.birth_date || user.date_of_birth || '',
          bio: user.description || user.bio || ''
        });
        setAvatarPreview(user.avatar ? ConfigUrl(user.avatar) : null);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // Load user data on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }

      setAvatar(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar separately using dedicated API
  const uploadAvatar = async () => {
    if (!avatar) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatar);

      console.log('🔄 Uploading avatar to:', `${baseUrl}me/change_avatar/`);
      console.log('📁 Avatar file:', avatar.name, avatar.size, avatar.type);

      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}me/change_avatar/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formData
      });

      console.log('📡 API Response status:', response.status);

      // Check if status code is 200
      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ Avatar upload successful:', data);
        return data.data?.avatar || data.avatar;
      } else {
        // Only show error if status is not 200
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Avatar upload failed:', errorData);
        throw new Error(errorData.message || 'Upload avatar failed');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Handle avatar update only
  const handleAvatarUpdate = async () => {
    if (!avatar) {
      console.log('❌ No avatar file selected');
      return;
    }

    console.log('🚀 Starting avatar update process...');
    try {
      const avatarUrl = await uploadAvatar();
      if (!avatarUrl) {
        console.log('❌ Avatar upload returned no URL');
        alert('Lỗi khi cập nhật ảnh đại diện');
        return;
      }

      console.log('🔄 Updating user context with new avatar:', avatarUrl);

      // Update user context with new avatar
      updateUser({
        ...user,
        avatar: avatarUrl
      });

      // Update avatar preview
      setAvatarPreview(ConfigUrl(avatarUrl));

      // Clear the avatar file input
      setAvatar(null);

      alert('Cập nhật ảnh đại diện thành công!');
      console.log('✅ Avatar updated successfully:', avatarUrl);
    } catch (error) {
      console.error('❌ Avatar update failed:', error);
      alert(`Lỗi cập nhật ảnh đại diện: ${error.message}`);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Update profile data (text fields only) using JSON
      const response = await fetch(`${baseUrl}me/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          phone: profileData.phone || '',
          birth_date: profileData.date_of_birth || '',
          description: profileData.bio || ''
        })
      });

      const apiCheck = await handleApiResponse(response);
      if (apiCheck.expired) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data;
        
        // Update user context with fresh data
        updateUser({
          ...user,
          ...userData,
          is_verified: userData.is_verified,
          is_active: userData.is_active
        });

        // Update local profile data
        setProfileData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          date_of_birth: userData.birth_date || '',
          bio: userData.description || ''
        });

        setIsEditing(false);
        setAvatar(null); // Clear the avatar file input
        alert('Cập nhật thông tin thành công!');
        console.log('Profile updated successfully:', userData);
      } else {
        const errorData = await response.json();
        console.error('Profile update failed:', errorData);
        alert(`Lỗi: ${errorData.message || 'Cập nhật thất bại'}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Lỗi khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        date_of_birth: user.birth_date || user.date_of_birth || '',
        bio: user.description || user.bio || ''
      });
      setAvatarPreview(user.avatar ? ConfigUrl(user.avatar) : null);
      setAvatar(null);
    }
    setIsEditing(false);
  };

  const getVerificationStatus = () => {
    if (user?.is_verified) {
      return {
        status: 'verified',
        icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
        text: 'Đã xác thực',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        status: 'unverified',
        icon: <Shield className="h-5 w-5 text-orange-500" />,
        text: 'Chưa xác thực',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }
  };

  const verificationStatus = getVerificationStatus();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Hồ sơ cá nhân
                </h1>
                <p className="text-sm text-gray-500">
                  Quản lý thông tin tài khoản của bạn
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Refresh Button */}
              <button
                onClick={fetchUserProfile}
                disabled={profileLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${profileLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
              
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Test Component - Only show in development */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="mb-6">
            <ProfileTest />
          </div>
        )} */}
        
        {profileLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thông tin hồ sơ...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Avatar Section */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-gray-600">@{user.username}</p>
                
                {/* Update Avatar Button - Only show when editing and avatar is selected */}
                {isEditing && avatar && (
                  <div className="mt-4">
                    <button
                      onClick={handleAvatarUpdate}
                      disabled={uploading}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Cập nhật ảnh đại diện
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Verification Status */}
                <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${verificationStatus.bgColor} ${verificationStatus.borderColor} ${verificationStatus.color}`}>
                  {verificationStatus.icon}
                  <span className="ml-2">{verificationStatus.text}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-1 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Bất động sản đã đăng</div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Thông tin cá nhân
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Nhập tên của bạn"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Nhập họ của bạn"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      disabled={true}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                      placeholder="Email không thể chỉnh sửa"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày sinh
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="date_of_birth"
                      value={profileData.date_of_birth}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

              </div>

              {/* Bio */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới thiệu bản thân
                </label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Viết một vài dòng giới thiệu về bản thân..."
                />
              </div>

              {/* Verification Notice */}
              {!user.is_verified && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-orange-800">
                        Tài khoản chưa được xác thực
                      </h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Để sử dụng đầy đủ các tính năng, vui lòng xác thực tài khoản của bạn.
                      </p>
                      <button className="mt-2 text-sm text-orange-600 hover:text-orange-800 font-medium">
                        Xác thực ngay →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Profile;