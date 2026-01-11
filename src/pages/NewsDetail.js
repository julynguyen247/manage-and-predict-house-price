import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { baseUrl, ConfigUrl } from '../base';
import Layout from '../components/Layout';
import { ArrowLeft, Calendar, User, MapPin, Facebook, Instagram, Twitter, Youtube, Phone, Mail } from 'lucide-react';
import Comments from '../components/Comments';

function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendedArticles, setRecommendedArticles] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [provinceID, setProvinceID] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}news/${id}/`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Article data:', data.data);
        setArticle(data.data);
        
    
        
        // Fetch recommended articles if article has province
        if (data.data && data.data.province) {
          console.log('Article has province, fetching recommended articles...');
          fetchRecommendedArticles(data.data.province.id, data.data.id);
        } else {
          fetchOtherArticles(data.data.id);
        }
        
      } catch (error) {
        console.error('Error fetching article:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendedArticles = async (provinceId, current_article_id) => {
      try {
        setRecommendedLoading(true);
        console.log('Fetching recommended articles for province:', provinceId, 'current article:', current_article_id);
        const response = await fetch(`${baseUrl}news/recommended/?province=${provinceId}&limit=5&current_article_id=${current_article_id}`);
        
        console.log('Recommended articles response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Recommended articles data:', data);
          setRecommendedArticles(data.data || []);
        } else {
          console.error('Failed to fetch recommended articles:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching recommended articles:', error);
      } finally {
        setRecommendedLoading(false);
      }
    };

    const fetchOtherArticles = async (currentArticleId) => {
      try {
        setRecommendedLoading(true);
        const response = await fetch(`${baseUrl}news/recommended/?current_article_id=${currentArticleId}`);
        
        if (response.ok) {
          const data = await response.json();
          setRecommendedArticles(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching recommended articles:', error);
      } finally {
        setRecommendedLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải bài viết...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !article) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-600 text-4xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Không tìm thấy bài viết
            </h3>
            <p className="text-gray-600 mb-6">
              {error || 'Bài viết không tồn tại hoặc đã bị xóa.'}
            </p>
            <button
              onClick={() => navigate('/news')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Quay lại danh sách tin tức
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/news')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Quay lại danh sách tin tức
        </button>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Article Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {article.title}
              </h1>
              
              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>{article.author_name || 'Tác giả'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(article.created_at)}</span>
                </div>
                {article.province && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{article.province.name}</span>
                  </div>
                )}
              </div>

              {/* Article Thumbnail */}
              {article.thumbnail && (
                <div className="mb-8">
                  <img
                    src={ConfigUrl(article.thumbnail)}
                    alt={article.title}
                    className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: article.content }}
                className="text-gray-800 leading-relaxed"
              />
            </div>

            {/* Comments */}
            <Comments articleId={id} />

            {/* Sources Section */}
            {article.sources && article.sources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Nguồn tham khảo:</h4>
                <div className="space-y-2">
                  {article.sources.map((source, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-gray-500 text-sm mr-2">{index + 1}.</span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                      >
                        {source.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Article Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-sm text-gray-600">
                  <p>Cập nhật lần cuối: {formatDate(article.updated_at)}</p>
                </div>
                
                {/* Social Share Buttons */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Chia sẻ:</span>
                  <button className="text-blue-600 hover:text-blue-800 transition-colors">
                    <Facebook className="h-5 w-5" />
                  </button>
                  <button className="text-pink-600 hover:text-pink-800 transition-colors">
                    <Instagram className="h-5 w-5" />
                  </button>
                  <button className="text-blue-400 hover:text-blue-600 transition-colors">
                    <Twitter className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Recommended Articles */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Bài viết được xem nhiều nhất
                </h3>
                
    
                {(() => {
                  console.log('Rendering recommended articles section:', { 
                    recommendedLoading, 
                    recommendedArticlesLength: recommendedArticles.length, 
                    recommendedArticles 
                  });
                  return null;
                })()}
                {recommendedLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải bài viết gợi ý...</p>
                  </div>
                ) : recommendedArticles && recommendedArticles.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg">
                    {recommendedArticles.map((recArticle, index) => (
                      <div key={recArticle.id}>
                        <div
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/news/${recArticle.id}`)}
                        >
                          <div className="flex items-start">
                            <span className="text-gray-900 font-medium text-sm mr-3 flex-shrink-0">
                              {index + 1}.
                            </span>
                            <h4 className="text-sm text-gray-900 leading-relaxed hover:text-red-600 transition-colors">
                              {recArticle.title}
                            </h4>
                          </div>
                        </div>
                        {index < recommendedArticles.length - 1 && (
                          <div className="border-b border-gray-100 mx-4"></div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-gray-600 mb-4">
                      Chưa có bài viết gợi ý nào.
                    </p>
                    <button
                      onClick={() => navigate('/news')}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Xem tất cả tin tức
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Articles Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Bài viết khác
        </h3>
        
        {recommendedLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải bài viết khác...</p>
          </div>
        ) : recommendedArticles.length > 0 ? (
          <div className="space-y-4">
            {recommendedArticles.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/news/${article.id}`)}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div className="relative w-full sm:w-80 h-48 sm:h-40 flex-shrink-0">
                    {article.thumbnail ? (
                      <img
                        src={ConfigUrl(article.thumbnail)}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No image</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                        TIN TỨC
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-center">
                    <div className="text-xs text-gray-500 mb-2">
                      {formatDate(article.created_at)} • {article.author_name || 'Tác giả'}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-red-600 transition-colors">
                      {article.title}
                    </h4>
                    {article.introduction && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {article.introduction}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Chưa có bài viết khác.</p>
          </div>
        )}
      </div>

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
                <button className="text-gray-400 hover:text-white transition-colors"><Facebook className="h-5 w-5" /></button>
                <button className="text-gray-400 hover:text-white transition-colors"><Instagram className="h-5 w-5" /></button>
                <button className="text-gray-400 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></button>
                <button className="text-gray-400 hover:text-white transition-colors"><Youtube className="h-5 w-5" /></button>
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
                <div className="flex items-center space-x-2"><Phone className="h-4 w-4" /><span>1900 1234</span></div>
                <div className="flex items-center space-x-2"><Mail className="h-4 w-4" /><span>info@realestate.vn</span></div>
                <div className="flex items-center space-x-2"><MapPin className="h-4 w-4" /><span>123 Đường ABC, Quận 1, TP.HCM</span></div>
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
}

export default NewsDetail;
