import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, RefreshCw, Copy, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import { aiAPI, tweetAPI } from '../services/api';

const AIWriter = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedTweet, setGeneratedTweet] = useState('');
  const [tone, setTone] = useState('professional');
  const [creativity, setCreativity] = useState(0.7);
  const [variations, setVariations] = useState([]);

  const generateMutation = useMutation({
    mutationFn: (data) => aiAPI.generateTweet(data),
    onSuccess: (response) => {
      setGeneratedTweet(response.data.data.tweet);
      toast.success('Tweet generated!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate tweet');
    },
  });

  const variationsMutation = useMutation({
    mutationFn: (data) => aiAPI.generateVariations(data),
    onSuccess: (response) => {
      setVariations(response.data.data.variations);
      toast.success('Variations generated!');
    },
  });

  const saveTweetMutation = useMutation({
    mutationFn: (data) => tweetAPI.createTweet(data),
    onSuccess: () => {
      toast.success('Tweet saved as draft!');
      setGeneratedTweet('');
      setPrompt('');
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    generateMutation.mutate({
      prompt,
      tone,
      creativity,
    });
  };

  const handleGenerateVariations = () => {
    if (!generatedTweet) {
      toast.error('Generate a tweet first');
      return;
    }

    variationsMutation.mutate({
      tweet: generatedTweet,
      count: 3,
      tone,
    });
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleSave = () => {
    if (!generatedTweet) {
      toast.error('No tweet to save');
      return;
    }

    saveTweetMutation.mutate({
      content: generatedTweet,
      aiGenerated: true,
      aiMetadata: {
        prompt,
        tone,
        creativity,
        generatedAt: new Date(),
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Writer</h1>
        <p className="text-gray-600 mt-1">Generate engaging tweets with AI</p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>What do you want to tweet about?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Share tips about productivity for remote workers..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="authoritative">Authoritative</option>
                <option value="humorous">Humorous</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creativity: {creativity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={creativity}
                onChange={(e) => setCreativity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            loading={generateMutation.isPending}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Tweet
          </Button>
        </CardContent>
      </Card>

      {/* Generated Tweet */}
      {generatedTweet && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Tweet</CardTitle>
              <span className="text-sm text-gray-500">
                {generatedTweet.length}/280 characters
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-900 whitespace-pre-wrap">{generatedTweet}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(generatedTweet)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateVariations}
                loading={variationsMutation.isPending}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Variations
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                loading={saveTweetMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variations */}
      {variations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {variations.map((variation, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => setGeneratedTweet(variation)}
                >
                  <p className="text-gray-900 text-sm">{variation}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{variation.length}/280</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(variation);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Better Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Be specific about your topic and target audience</li>
            <li>• Include desired hashtags or mentions in your prompt</li>
            <li>• Experiment with different tones for various content types</li>
            <li>• Higher creativity = more unique content, but may be less focused</li>
            <li>• Generate variations to find the perfect wording</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIWriter;
