import { useState, useEffect, useCallback } from 'react';
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
  Upload,
  ThumbsUp,
  ThumbsDown,
  Clipboard,
  Wand2,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { profileAPI } from '../services/api';

const ReplyHelper = () => {
  const { user } = useAuthStore();
  const [tweetContent, setTweetContent] = useState('');
  const [guidance, setGuidance] = useState(''); // Custom guidance for AI
  const [replies, setReplies] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('replies');
  const [styleProfile, setStyleProfile] = useState(null);
  const [importedCounts, setImportedCounts] = useState({ tweets: 0, likes: 0 });
  const [styleLoading, setStyleLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ratedSuggestions, setRatedSuggestions] = useState({}); // Track which suggestions have been rated
  const [clipboardImage, setClipboardImage] = useState(null); // Detected clipboard image
  const [showClipboardPrompt, setShowClipboardPrompt] = useState(false);
  const [refiningIndex, setRefiningIndex] = useState(null); // Which suggestion is being refined
  const [showRefinePanel, setShowRefinePanel] = useState(null); // Which suggestion has refine panel open
  const [customRefineInput, setCustomRefineInput] = useState('');

  // Load style profile on mount
  useEffect(() => {
    loadStyleProfile();
  }, []);

  // Check clipboard for images on page focus (mobile-friendly)
  const checkClipboard = useCallback(async () => {
    // Don't check if we already have an image
    if (uploadedImage) return;
    
    try {
      // Check if Clipboard API is available
      if (!navigator.clipboard?.read) return;
      
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        // Look for image types
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = (e) => {
            setClipboardImage(e.target.result);
            setShowClipboardPrompt(true);
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    } catch (error) {
      // Clipboard access denied or not available - silently ignore
      // This is expected on first visit before user grants permission
      console.log('Clipboard check:', error.name);
    }
  }, [uploadedImage]);

  // Check clipboard on mount and when window regains focus
  useEffect(() => {
    // Initial check after a short delay (gives time for permission prompt)
    const initialCheck = setTimeout(checkClipboard, 500);
    
    // Check when user returns to the page (e.g., after taking screenshot)
    const handleFocus = () => {
      checkClipboard();
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkClipboard();
      }
    });
    
    return () => {
      clearTimeout(initialCheck);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkClipboard]);

  // Use clipboard image
  const useClipboardImage = () => {
    if (clipboardImage) {
      setUploadedImage(clipboardImage);
      setImagePreview(clipboardImage);
      setShowClipboardPrompt(false);
      setClipboardImage(null);
      toast.success('Screenshot loaded from clipboard!');
    }
  };

  // Dismiss clipboard prompt
  const dismissClipboardPrompt = () => {
    setShowClipboardPrompt(false);
    setClipboardImage(null);
  };

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

  const handleImportStyle = () => {
    // Style import now happens via Chrome extension
    // Redirect user to Settings page to set up extension
    toast('Import your data using the Chrome extension in Settings', {
      icon: '📦',
      duration: 4000
    });
    window.location.href = '/settings';
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
        image: uploadedImage,
        guidance: guidance.trim() || undefined
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
        image: uploadedImage,
        guidance: guidance.trim() || undefined
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

  // Refinement quick action options
  const refinementOptions = [
    { type: 'shorter', label: 'Shorter', emoji: '✂️' },
    { type: 'funnier', label: 'Funnier', emoji: '😄' },
    { type: 'professional', label: 'Professional', emoji: '👔' },
    { type: 'casual', label: 'Casual', emoji: '😎' },
    { type: 'question', label: 'Add Question', emoji: '❓' },
    { type: 'spicy', label: 'Spicier', emoji: '🌶️' },
  ];

  const handleRefine = async (index, refinementType, customInstruction = null) => {
    const currentSuggestions = activeTab === 'replies' ? replies : quotes;
    const originalSuggestion = currentSuggestions[index];
    
    setRefiningIndex(index);
    
    try {
      const response = await profileAPI.refineSuggestion({
        originalSuggestion,
        refinementType,
        customInstruction,
        originalContext: tweetContent || null
      });
      
      const refined = response.data.data.refined;
      
      // Update the suggestion in place
      if (activeTab === 'replies') {
        setReplies(prev => prev.map((s, i) => i === index ? refined : s));
      } else {
        setQuotes(prev => prev.map((s, i) => i === index ? refined : s));
      }
      
      // Clear rating for this suggestion since it changed
      const oldRatingKey = `${activeTab}-${originalSuggestion}`;
      setRatedSuggestions(prev => {
        const newRatings = { ...prev };
        delete newRatings[oldRatingKey];
        return newRatings;
      });
      
      toast.success('Suggestion refined!');
      setShowRefinePanel(null);
      setCustomRefineInput('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to refine suggestion');
    } finally {
      setRefiningIndex(null);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
    
    // Track that this suggestion was copied (for feedback)
    submitFeedback(text, 1, true);
  };

  const submitFeedback = async (output, rating, wasCopied = false) => {
    const key = `${activeTab}-${output}`;
    
    // Don't submit if already rated (unless it's just a copy action)
    if (ratedSuggestions[key] && !wasCopied) return;
    
    try {
      await profileAPI.submitFeedback({
        type: activeTab === 'replies' ? 'reply' : 'quote',
        input: {
          text: tweetContent,
          hasImage: !!uploadedImage
        },
        output,
        rating,
        wasCopied,
        model: uploadedImage ? 'gpt-4o' : 'gpt-3.5-turbo'
      });
      
      if (!wasCopied) {
        setRatedSuggestions(prev => ({ ...prev, [key]: rating }));
        toast.success(rating === 1 ? 'Thanks! 👍' : 'Thanks for the feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
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
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reply Helper</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Generate engaging replies and quote tweets in your style
        </p>
      </div>

      {/* Clipboard Image Detected Banner */}
      {showClipboardPrompt && clipboardImage && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              <img 
                src={clipboardImage} 
                alt="Clipboard" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-blue-300 shadow-sm"
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Clipboard className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-blue-900 text-sm sm:text-base">Screenshot detected!</h3>
              </div>
              <p className="text-xs sm:text-sm text-blue-700 mb-3">
                Use this image from your clipboard?
              </p>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={useClipboardImage}
                  className="text-xs sm:text-sm"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Use Screenshot
                </Button>
                <button
                  onClick={dismissClipboardPrompt}
                  className="px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Tone</p>
                  <p className="text-sm font-semibold capitalize truncate">{styleProfile.tone}</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Emoji Usage</p>
                  <p className="text-sm font-semibold capitalize truncate">{styleProfile.emojiUsage}</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Avg Length</p>
                  <p className="text-sm font-semibold">{styleProfile.avgLength} chars</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-600 font-medium">Hashtags</p>
                  <p className="text-sm font-semibold capitalize truncate">{styleProfile.hashtagStyle}</p>
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
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Update Style
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-2">No Style Profile Yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use the Chrome extension to import your tweets and likes.
                <br />
                <span className="text-green-600 font-medium">No API calls needed!</span>
              </p>
              <Button onClick={handleImportStyle}>
                <Download className="w-4 h-4 mr-2" />
                Set Up Extension
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

          {/* Paste from Clipboard Button - for mobile */}
          {!imagePreview && (
            <button
              onClick={async () => {
                try {
                  if (!navigator.clipboard?.read) {
                    toast.error('Clipboard not supported in this browser');
                    return;
                  }
                  const clipboardItems = await navigator.clipboard.read();
                  for (const item of clipboardItems) {
                    const imageType = item.types.find(type => type.startsWith('image/'));
                    if (imageType) {
                      const blob = await item.getType(imageType);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setUploadedImage(e.target.result);
                        setImagePreview(e.target.result);
                        toast.success('Screenshot pasted!');
                      };
                      reader.readAsDataURL(blob);
                      return;
                    }
                  }
                  toast.error('No image found in clipboard');
                } catch (error) {
                  if (error.name === 'NotAllowedError') {
                    toast.error('Please allow clipboard access');
                  } else {
                    toast.error('Could not read clipboard');
                  }
                }
              }}
              className="w-full py-2.5 px-4 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Clipboard className="w-4 h-4" />
              Paste Screenshot from Clipboard
            </button>
          )}

          {/* Guidance Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guidance <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              placeholder="e.g., be funny, ask a question, share a contrarian take..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Steer the AI's tone or approach
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base sm:text-lg">
                {activeTab === 'replies' ? 'Reply Suggestions' : 'Quote Tweet Suggestions'}
              </CardTitle>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('replies')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    activeTab === 'replies' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Replies ({replies.length})
                </button>
                <button
                  onClick={() => setActiveTab('quotes')}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
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
              {suggestions.map((suggestion, index) => {
                const ratingKey = `${activeTab}-${suggestion}`;
                const currentRating = ratedSuggestions[ratingKey];
                const isRefining = refiningIndex === index;
                const isPanelOpen = showRefinePanel === index;
                
                return (
                  <div 
                    key={index}
                    className={`p-4 bg-gray-50 rounded-lg border transition-colors ${
                      isPanelOpen ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {/* Suggestion text with loading overlay */}
                    <div className="relative">
                      <p className={`text-gray-900 mb-3 ${isRefining ? 'opacity-50' : ''}`}>
                        {suggestion}
                      </p>
                      {isRefining && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Action bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs text-gray-500">
                          {suggestion.length}/280
                        </span>
                        {/* Feedback buttons */}
                        <div className="flex items-center gap-1 border-l pl-2 sm:pl-3 ml-1">
                          <button
                            onClick={() => submitFeedback(suggestion, 1)}
                            disabled={currentRating !== undefined || isRefining}
                            className={`p-1.5 rounded-md transition-colors ${
                              currentRating === 1
                                ? 'bg-green-100 text-green-600'
                                : currentRating === -1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title="Good suggestion"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => submitFeedback(suggestion, -1)}
                            disabled={currentRating !== undefined || isRefining}
                            className={`p-1.5 rounded-md transition-colors ${
                              currentRating === -1
                                ? 'bg-red-100 text-red-600'
                                : currentRating === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Refine button */}
                        <div className="border-l pl-2 sm:pl-3 ml-1">
                          <button
                            onClick={() => setShowRefinePanel(isPanelOpen ? null : index)}
                            disabled={isRefining}
                            className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${
                              isPanelOpen
                                ? 'bg-purple-100 text-purple-600'
                                : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                            }`}
                            title="Refine this suggestion"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            <span className="text-xs hidden sm:inline">Refine</span>
                          </button>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(suggestion, index)}
                        disabled={isRefining}
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
                    
                    {/* Refine Panel */}
                    {isPanelOpen && (
                      <div className="mt-4 pt-4 border-t border-purple-200">
                        <p className="text-xs font-medium text-purple-700 mb-2">Quick refinements:</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {refinementOptions.map((option) => (
                            <button
                              key={option.type}
                              onClick={() => handleRefine(index, option.type)}
                              disabled={isRefining}
                              className="px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-full hover:bg-purple-50 hover:border-purple-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <span>{option.emoji}</span>
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                        
                        {/* Custom refinement input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customRefineInput}
                            onChange={(e) => setCustomRefineInput(e.target.value)}
                            placeholder="Custom instruction, e.g. 'add an emoji' or 'make it edgier'"
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && customRefineInput.trim()) {
                                handleRefine(index, 'custom', customRefineInput.trim());
                              }
                            }}
                            disabled={isRefining}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              if (customRefineInput.trim()) {
                                handleRefine(index, 'custom', customRefineInput.trim());
                              }
                            }}
                            disabled={!customRefineInput.trim() || isRefining}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {isRefining ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Apply'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
