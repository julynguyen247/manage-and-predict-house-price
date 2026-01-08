import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { baseUrl } from '../base';
import Layout from '../components/Layout';
import { Facebook, Instagram, Twitter, Youtube, Phone, Mail, MapPin } from 'lucide-react';

const News = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [provLoading, setProvLoading] = useState(false);
  const [provError, setProvError] = useState('');
  const [selectedProvince, setSelectedProvince] = useState(null);
  
  // Get current page from URL params, default to 1
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const pageSize = 15;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: pageSize.toString()
        });
        
        const res = await fetch(`${baseUrl}news/?${params}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const responseData = await res.json();
        console.log(responseData);
        setData(responseData);
      } catch (e) {
        setError(e?.message || 'Fetch failed');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [currentPage, pageSize]);

  const formatDate = (s) => {
    if (!s) return '';
    try { return new Date(s).toLocaleString(); } catch { return s; }
  };

  const getThumbnailUrl = (path) => {
    if (!path) return '';
    try {
      // baseUrl typically like: http://localhost:8000/api/v1/
      const api = new URL(baseUrl);
      return `${api.origin}${path}`;
    } catch {
      return path;
    }
  };

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setProvLoading(true);
        setProvError('');
        const res = await fetch(`${baseUrl}provinces/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProvinces(Array.isArray(data?.results) ? data.results : []);
      } catch (e) {
        setProvError(e?.message || 'Fetch failed');
      } finally {
        setProvLoading(false);
      }
    };
    fetchProvinces();
  }, []);

  const items = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const filteredItems = useMemo(() => {
    if (!selectedProvince) return items;
    return items.filter((n) => Number(n?.province) === Number(selectedProvince));
  }, [items, selectedProvince]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tin tức</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {loading && (
              <div className="text-center py-16">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải tin tức...</p>
              </div>
            )}

            {!loading && error && (
              <div className="text-center py-12 text-red-600">{error}</div>
            )}

            {!loading && !error && filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-600">Chưa có tin tức</div>
            )}

            {!loading && !error && filteredItems.length > 0 && (
              <div className="space-y-6">
                {filteredItems.map((news) => (
                  <article 
                    key={news.id} 
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/news/${news.id}`)}
                  >
                    <div className="flex flex-col sm:flex-row h-52 sm:h-56">
                      <div className="w-full sm:w-72 lg:w-80 bg-gray-100 shrink-0 h-52 sm:h-56">
                        {news.thumbnail ? (
                          <img
                            src={getThumbnailUrl(news.thumbnail)}
                            alt={news.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-center overflow-hidden">
                        <div className="flex items-center text-xs text-gray-500 space-x-3 mb-2">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{formatDate(news.created_at)}</span>
                          </div>
                          {news.author_name && (
                            <span className="truncate">{(news.author_name || '').trim()}</span>
                          )}
                          {news.province_name && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700">{news.province_name}</span>
                          )}
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2">
                          {news.title}
                        </h2>
                        {news.introduction && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {news.introduction}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} bài viết
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Trước
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                        
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`px-3 py-2 text-sm font-medium rounded-md ${
                                i === currentPage
                                  ? 'bg-red-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        return pages;
                      })()}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-base font-semibold">Thị trường BĐS tại 10 tỉnh / thành phố lớn</h3>
              </div>
              <div className="p-3">
                <button
                  onClick={() => setSelectedProvince(null)}
                  className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-colors ${
                    selectedProvince === null ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  Tất cả tỉnh/thành
                </button>
                {provLoading && (
                  <div className="px-3 py-4 text-sm text-gray-500">Đang tải danh sách tỉnh...</div>
                )}
                {provError && (
                  <div className="px-3 py-4 text-sm text-red-600">{provError}</div>
                )}
                {!provLoading && !provError && provinces.length > 0 && (
                  <ul className="max-h-[520px] overflow-auto pr-1">
                    {provinces.map((p) => (
                      <li key={p.id}>
                        <button
                          onClick={() => setSelectedProvince(p.id)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                            selectedProvince === p.id ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                          }`}
                        >
                          {p.name || p.title || p.province_name || `Tỉnh ${p.id}`}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
      {/* Footer giống trang chủ nếu có (Layout hiện không render footer riêng) */}
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
    </Layout>
  );
};

export default News;


