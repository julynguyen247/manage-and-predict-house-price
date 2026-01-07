import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { baseUrl, ConfigUrl } from '../base';
import { ArrowLeft, Mail, User, Clock, Home } from 'lucide-react';

const PAGE_SIZE = 10;

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const t = new Date(timestamp);
  const diffInMinutes = Math.floor((now - t) / (1000 * 60));
  if (diffInMinutes < 1) return 'Vừa xong';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} ngày trước`;
};

const Messages = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = Number(searchParams.get('p')) || 1;
  const propertyIdFromUrl = searchParams.get('property_id') || '';
  const [page, setPage] = useState(pageFromUrl);
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyIdFromUrl);
  const [myProperties, setMyProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [isPropMenuOpen, setIsPropMenuOpen] = useState(false);
  const propMenuRef = React.useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalPages = Math.max(1, Math.ceil((Number(count) || 0) / PAGE_SIZE));

  const fetchPage = async (pageNumber = 1, propId = selectedPropertyId) => {
    try {
      setLoading(true);
      setError('');
      setPage(pageNumber);
      // sync URL param p
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('p', String(pageNumber));
      if (propId) nextParams.set('property_id', String(propId)); else nextParams.delete('property_id');
      setSearchParams(nextParams);
      const token = localStorage.getItem('token');
      if (!token) {
        setItems([]);
        setCount(0);
        return;
      }
      const url = `${baseUrl}contact-requests/?page=${pageNumber}&page_size=${PAGE_SIZE}${propId ? `&property_id=${encodeURIComponent(propId)}` : ''}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const resultsContainer = data?.results;
      const list = Array.isArray(resultsContainer?.data)
        ? resultsContainer.data
        : (Array.isArray(data?.results) ? data.results : []);
      setItems(list);
      setCount(Number(data?.count) || list.length || 0);
    } catch (e) {
      setError(e?.message || 'Lỗi tải dữ liệu');
      setItems([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (page !== pageFromUrl) setPage(pageFromUrl);
    if (selectedPropertyId !== propertyIdFromUrl) setSelectedPropertyId(propertyIdFromUrl || '');
    fetchPage(pageFromUrl, propertyIdFromUrl || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageFromUrl, propertyIdFromUrl]);

  // Fetch user's properties for filter
  useEffect(() => {
    const loadMyProps = async () => {
      try {
        setLoadingProps(true);
        const token = localStorage.getItem('token');
        if (!token) { setMyProperties([]); return; }
        const res = await fetch(`${baseUrl}my-properties/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.results) ? data.results : []);
        setMyProperties(list);
      } catch (_) {
        setMyProperties([]);
      } finally {
        setLoadingProps(false);
      }
    };
    loadMyProps();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (propMenuRef.current && !propMenuRef.current.contains(e.target)) {
        setIsPropMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const buildPageList = (current, total) => {
    const pages = [];
    const push = (val) => pages.push(val);
    const addRange = (start, end) => { for (let i = start; i <= end; i += 1) push(i); };

    if (total <= 7) {
      addRange(1, total);
      return pages;
    }

    // Always show first two
    push(1); push(2);

    const start = Math.max(3, current - 1);
    const end = Math.min(total - 2, current + 1);

    if (start > 3) push('...-left');
    addRange(start, end);
    if (end < total - 2) push('...-right');

    // Always show last two
    push(total - 1); push(total);
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Tin nhắn đến</h1>
                <p className="text-sm text-gray-500">Tổng: {count}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Property filter - Rich dropdown */}
        <div className="mb-4" ref={propMenuRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo bất động sản</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPropMenuOpen((o) => !o)}
              disabled={loadingProps}
              className="w-full sm:max-w-2xl inline-flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
            >
              <span className="truncate text-left">
                {selectedPropertyId
                  ? (myProperties.find((x) => String(x.id) === String(selectedPropertyId))?.title || 'Đang tải...')
                  : 'Tất cả bất động sản của tôi'}
              </span>
              <svg className="w-4 h-4 text-gray-500 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
            </button>

            {isPropMenuOpen && (
              <div className="absolute z-20 mt-2 w-full sm:max-w-2xl bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                <div
                  className={`p-3 cursor-pointer hover:bg-gray-50 ${!selectedPropertyId ? 'bg-blue-50' : ''}`}
                  onClick={() => { setSelectedPropertyId(''); setIsPropMenuOpen(false); fetchPage(1, ''); }}
                >
                  <div className="text-sm font-medium text-gray-900">Tất cả bất động sản của tôi</div>
                </div>
                <div className="max-h-96 overflow-auto divide-y divide-gray-100">
                  {myProperties.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedPropertyId(String(p.id)); setIsPropMenuOpen(false); fetchPage(1, String(p.id)); }}
                      className={`p-3 hover:bg-gray-50 cursor-pointer ${String(p.id) === String(selectedPropertyId) ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <img src={ConfigUrl(p.thumbnail)} alt={p.title} className="w-16 h-16 rounded object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{p.title}</div>
                          <div className="mt-1 text-xs text-gray-600 flex flex-wrap items-center gap-2">
                            {p.price && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{p.price}</span>}
                            {p.area_m2 && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{p.area_m2} m²</span>}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">{p.address}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!loadingProps && myProperties.length === 0) && (
                    <div className="p-3 text-sm text-gray-500">Bạn chưa có bất động sản nào.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có tin nhắn nào</h3>
            <p className="text-gray-500">Bạn chưa nhận được tin nhắn liên hệ nào.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => {
              const p = item.property_data || item.property; // fallback if API changes
              return (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 text-gray-800">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{item.from_username || 'Người dùng'}</div>
                        <div className="text-xs text-gray-500">Đã gửi yêu cầu liên hệ</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatTimeAgo(item.timestamp || item.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-800 leading-relaxed break-words">
                    <div className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: String(item.message || '').replace(/\n/g, '<br/>') }}></div>
                  </div>

                  {p && (
                    <div className="mt-4 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <img
                        src={ConfigUrl(p.thumbnail)}
                        alt={p.title}
                        className="w-20 h-20 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                        <div className="mt-1 text-xs text-gray-600 flex flex-wrap items-center gap-2">
                          {p.price && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{p.price}</span>}
                          {p.area_m2 && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{p.area_m2} m²</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.address}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/property/${p.id}`)}
                        className="flex-shrink-0 inline-flex items-center px-3 py-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md text-xs font-medium"
                        title="Xem bất động sản"
                      >
                        <Home className="h-4 w-4 mr-1" /> Xem
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center border-t pt-4">
            <div className="inline-flex items-center space-x-1">
              {buildPageList(page, totalPages).map((p, idx) => (
                typeof p === 'number' ? (
                  <button
                    key={`p-${p}`}
                    onClick={() => fetchPage(p)}
                    className={`min-w-[36px] h-9 px-2 rounded-md text-sm border ${p === page ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={`sep-${idx}`} className="px-2 text-gray-400">…</span>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;


