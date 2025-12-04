import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { 
  MessageCircle, 
  Quote, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw,
  AlertCircle,
  Zap,
  Download,
  Image,
  X,
  Upload
} from 'lucide-react';
import { profileAPI } from '../services/api';

const ReplyHelper = () => {
  const { user } = useAuthStore();
  const [tweetContent, setTweetContent] = useState('');
  const [replies, setReplies] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('replies');
  const [styleProfile, setStyleProfile] = useState(null);
  const [importedCounts, setImportedCounts] = useState({ tweets: 0, likes: 0 });
  const [styleLoading, setStyleLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load style profile on mount
  useEffect(() => {
    loadStyleProfile();
  }, []);

  const loadStyleProfile = async () => {
    try {
      setStyleLoading(true);
      const response = await profileAPI.getStyleProfile();
      if (response.data.data.hasStyle) {
        setStyleProfile(response.data.data.styleProfile);
        setImportedCounts({
          tweets: response.data.data.tweetsCount || 0,
          likes: response.data.data.likesCount || 0
        });
      }
    } catch (error) {
      console.error('Failed to load style profile:', error);
    } finally {
      setStyleLoading(false);
    }
  };

  const handleImportStyle = async () => {
    if (!user?.twitterConnected) {
      toast.error('Please connect your X account first in Settings');
      return;
    }

    setImportLoading(true);
    try {
      const response = await profileAPI.importStyle();
      const data = response.data.data;
      
      if (data.alreadyImported) {
        toast.success(response.data.message);
      } else {
        toast.success(`Style imported! Analyzed ${data.tweetsImported} tweets and ${data.likesImported} likes.`);
      }
      
      setStyleProfile(data.styleProfile);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import style');
    } finally {
      setImportLoading(false);
    }
  };

  const handleGenerateReplies = async () => {
    if (!tweetContent.trim() && !uploadedImage) {
      toast.error('Please paste a tweet or upload an image');
      return;
    }

    setLoading(true);
    try {
      const response = await profileAPI.generateReplies({ 
        tweetContent: tweetContent.trim(),
        count: 3,
        image: uploadedImage
      });
      setReplies(response.data.data.replies);
      setActiveTab('replies');
      if (response.data.data.usedImage) {
        toast.success('Generated replies from image!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate replies');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuotes = async () => {
    if (!tweetContent.trim() && !uploadedImage) {
      toast.error('Please paste a tweet or upload an image to quote');
      return;
    }

    setLoading(true);
    try {
      const response = await profileAPI.generateQuotes({ 
        tweetContent: tweetContent.trim(),
        count: 3,
        image: uploadedImage
      });
      setQuotes(response.data.data.quotes);
      setActiveTab('quotes');
      if (response.data.data.usedImage) {
        toast.success('Generated quotes from image!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate quotes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleImageUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleImageUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const suggestions = activeTab === 'replies' ? replies : quotes;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reply Helper</h1>
        <p className="text-gray-600 mt-1">
          Generate engaging replies and quote tweets in your style
        </p>
      </div>

      {/* Style Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Your Writing Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          {styleLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : styleProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Tone</p>
                  <p className="text-sm font-semibold capitalize">{styleProfile.tone}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Emoji Usage</p>
                  <p className="text-sm font-semibold capitalize">{styleProfile.emojiUsage}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Avg Length</p>
                  <p className="text-sm font-semibold">{styleProfile.avgLength} chars</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-600 font-medium">Hashtags</p>
                  <p className="text-sm font-semibold capitalize">{styleProfile.hashtagStyle}</p>
                </div>
              </div>
              
              {styleProfile.topics?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Your Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {styleProfile.topics.map((topic, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-gray-500">
                  Imported {importedCounts.tweets} tweets & {importedCounts.likes} likes
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleImportStyle}
                  loading={importLoading}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Re-import
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-2">No Style Profile Yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Import your tweets and likes so AI can learn your writing style.
                <br />
                <span className="text-amber-600 font-medium">Uses 2 API reads (one-time)</span>
              </p>
              <Button onClick={handleImportStyle} loading={importLoading}>
                <Download className="w-4 h-4 mr-2" />
                Import My Style
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tweet Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Tweet to Respond To
            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Text or Image
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={tweetContent}
            onChange={(e) => setTweetContent(e.target.value)}
            placeholder="Paste the tweet text you want to reply to or quote..."
            className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Image Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-lg transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : imagePreview 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {imagePreview ? (
              <div className="p-4">
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Tweet screenshot" 
                    className="max-h-48 rounded-lg shadow-sm"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Image ready for analysis
                </p>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-6 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">Upload screenshot</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 10MB
                </p>
              </label>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateReplies}
              loading={loading && activeTab === 'replies'}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Generate Replies
            </Button>
            <Button 
              onClick={handleGenerateQuotes}
              loading={loading && activeTab === 'quotes'}
              variant="outline"
              className="flex-1"
            >
              <Quote className="w-4 h-4 mr-2" />
              Generate Quotes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {activeTab === 'replies' ? 'Reply Suggestions' : 'Quote Tweet Suggestions'}
              </CardTitle>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('replies')}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    activeTab === 'replies' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Replies ({replies.length})
                </button>
                <button
                  onClick={() => setActiveTab('quotes')}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    activeTab === 'quotes' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Quotes ({quotes.length})
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <p className="text-gray-900 mb-3">{suggestion}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {suggestion.length}/280 characters
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(suggestion, index)}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3 mr-1 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Pro Tips for Growing Followers</h4>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Reply to accounts with 10K-100K followers for best visibility</li>
                <li>• Be one of the first to reply to new tweets</li>
                <li>• Add value or a unique perspective, don't just agree</li>
                <li>• Quote tweets with your own insight perform better than plain retweets</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReplyHelper;
