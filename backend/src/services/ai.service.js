import OpenAI from 'openai';
import axios from 'axios';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

class AIService {
  constructor() {
    this.openai = null;
  }

  // Lazy initialization of OpenAI client
  getOpenAI() {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  /**
   * Generate tweet content using AI
   */
  async generateTweet(params) {
    const {
      prompt,
      tone = 'professional',
      creativity = 0.7,
      model = 'gpt-3.5-turbo',
      maxTokens = 100,
      context = ''
    } = params;

    try {
      const systemPrompt = this.buildSystemPrompt(tone, context);
      const userPrompt = this.buildTweetPrompt(prompt);

      const response = await this.getOpenAI().chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: creativity,
        max_tokens: maxTokens,
        n: 1,
      });

      const generatedText = response.choices[0].message.content.trim();
      
      // Ensure tweet is within character limit
      const tweet = this.formatTweet(generatedText);

      return {
        content: tweet,
        model: model,
        metadata: {
          finishReason: response.choices[0].finish_reason,
          tokensUsed: response.usage.total_tokens
        }
      };
    } catch (error) {
      logger.error('AI Tweet Generation Error:', error);
      throw new AppError('Failed to generate tweet', 500);
    }
  }

  /**
   * Generate multiple tweet variations
   */
  async generateVariations(tweet, count = 3, tone = 'professional') {
    try {
      const systemPrompt = `You are an expert social media content creator. Generate ${count} different variations of the given tweet while maintaining the core message. Each variation should have a ${tone} tone and be under 280 characters.`;
      
      const userPrompt = `Create ${count} variations of this tweet:\n\n"${tweet}"\n\nProvide only the variations, numbered 1-${count}.`;

      const response = await this.getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const variations = this.parseVariations(response.choices[0].message.content);
      
      return variations.slice(0, count);
    } catch (error) {
      logger.error('AI Variations Generation Error:', error);
      throw new AppError('Failed to generate variations', 500);
    }
  }

  /**
   * Rewrite tweet with different tone
   */
  async rewriteTweet(tweet, targetTone) {
    try {
      const systemPrompt = `You are an expert at rewriting social media content. Rewrite the given tweet with a ${targetTone} tone while keeping the core message. Keep it under 280 characters.`;
      
      const response = await this.getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: tweet }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      return this.formatTweet(response.choices[0].message.content);
    } catch (error) {
      logger.error('AI Rewrite Error:', error);
      throw new AppError('Failed to rewrite tweet', 500);
    }
  }

  /**
   * Generate thread from a topic
   */
  async generateThread(topic, threadLength = 5, tone = 'professional') {
    try {
      const systemPrompt = `You are an expert thread writer for X (Twitter). Create an engaging thread of ${threadLength} tweets about the given topic. Each tweet should be under 280 characters. Use a ${tone} tone.`;
      
      const userPrompt = `Create a ${threadLength}-tweet thread about: ${topic}\n\nFormat: Number each tweet (1/${threadLength}, 2/${threadLength}, etc.)`;

      const response = await this.getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const thread = this.parseThread(response.choices[0].message.content);
      
      return thread;
    } catch (error) {
      logger.error('AI Thread Generation Error:', error);
      throw new AppError('Failed to generate thread', 500);
    }
  }

  /**
   * Analyze tweet sentiment
   */
  async analyzeSentiment(text) {
    try {
      const systemPrompt = 'You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with ONLY a JSON object containing "score" (number from -1 to 1) and "label" (positive, neutral, or negative).';
      
      const response = await this.getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 50,
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result;
    } catch (error) {
      logger.error('Sentiment Analysis Error:', error);
      return { score: 0, label: 'neutral' };
    }
  }

  /**
   * Generate content ideas based on niche
   */
  async generateIdeas(niche, count = 10) {
    try {
      const systemPrompt = `You are a creative content strategist. Generate ${count} viral tweet ideas for the ${niche} niche. Each idea should be one concise sentence.`;
      
      const response = await this.getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${count} tweet ideas for ${niche}` }
        ],
        temperature: 0.9,
        max_tokens: 500,
      });

      const ideas = this.parseIdeas(response.choices[0].message.content);
      
      return ideas.slice(0, count);
    } catch (error) {
      logger.error('AI Ideas Generation Error:', error);
      throw new AppError('Failed to generate ideas', 500);
    }
  }

  /**
   * Predict engagement score for a tweet
   */
  async predictEngagement(tweet, userMetrics = {}) {
    try {
      const features = this.extractFeatures(tweet);
      
      // Simple heuristic-based prediction
      // In production, use a trained ML model
      let score = 50; // Base score
      
      // Length factor
      if (tweet.length > 100 && tweet.length < 200) score += 10;
      
      // Hashtag factor
      if (features.hashtags > 0 && features.hashtags <= 3) score += 5;
      
      // Question factor
      if (features.hasQuestion) score += 8;
      
      // Call to action
      if (features.hasCallToAction) score += 7;
      
      // Media presence
      if (features.hasMedia) score += 15;
      
      // Emoji usage
      if (features.emojiCount > 0 && features.emojiCount <= 3) score += 5;
      
      return Math.min(Math.max(score, 0), 100);
    } catch (error) {
      logger.error('Engagement Prediction Error:', error);
      return 50; // Default neutral score
    }
  }

  // Helper Methods

  buildSystemPrompt(tone, context) {
    const toneDescriptions = {
      professional: 'You are a professional content writer. Write clear, authoritative, and polished tweets.',
      casual: 'You are a casual, friendly content creator. Write relatable and conversational tweets.',
      friendly: 'You are a warm, approachable writer. Create engaging and personable tweets.',
      authoritative: 'You are an expert thought leader. Write confident, insightful tweets.',
      humorous: 'You are a witty, entertaining writer. Create funny and engaging tweets.'
    };

    let prompt = toneDescriptions[tone] || toneDescriptions.professional;
    prompt += ' Keep tweets under 280 characters and make them engaging.';
    
    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    return prompt;
  }

  buildTweetPrompt(prompt) {
    return `Write a compelling tweet about: ${prompt}`;
  }

  formatTweet(text) {
    // Remove quotes if present
    text = text.replace(/^["']|["']$/g, '');
    
    // Trim and ensure under 280 characters
    if (text.length > 280) {
      text = text.substring(0, 277) + '...';
    }
    
    return text.trim();
  }

  parseVariations(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const variations = [];
    
    for (const line of lines) {
      const cleaned = line.replace(/^\d+[\.)]\s*/, '').trim();
      if (cleaned && cleaned.length <= 280) {
        variations.push(cleaned);
      }
    }
    
    return variations;
  }

  parseThread(text) {
    const tweets = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const cleaned = line.replace(/^\d+\/\d+[\:)]\s*/, '').trim();
      if (cleaned && cleaned.length <= 280) {
        tweets.push({
          content: cleaned,
          order: tweets.length + 1
        });
      }
    }
    
    return tweets;
  }

  parseIdeas(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const ideas = [];
    
    for (const line of lines) {
      const cleaned = line.replace(/^[-•*]\s*/, '').replace(/^\d+[\.)]\s*/, '').trim();
      if (cleaned) {
        ideas.push(cleaned);
      }
    }
    
    return ideas;
  }

  extractFeatures(tweet) {
    return {
      length: tweet.length,
      hashtags: (tweet.match(/#\w+/g) || []).length,
      mentions: (tweet.match(/@\w+/g) || []).length,
      urls: (tweet.match(/https?:\/\/\S+/g) || []).length,
      hasQuestion: /\?/.test(tweet),
      hasCallToAction: /(click|check|read|learn|discover|try|get)/i.test(tweet),
      hasMedia: false, // Would be set if media is attached
      emojiCount: (tweet.match(/[\p{Emoji}]/gu) || []).length
    };
  }

  /**
   * Analyze user's writing style from their tweets and likes
   */
  async analyzeStyle(tweets, likes) {
    try {
      const tweetTexts = tweets.map(t => t.content).join('\n---\n');
      const likeTexts = likes.slice(0, 20).map(l => l.content).join('\n---\n');

      const systemPrompt = `You are an expert at analyzing writing styles and content preferences. Analyze the user's tweets and liked content to create a style profile. Respond with ONLY a valid JSON object.`;

      const userPrompt = `Analyze this user's writing style and interests.

USER'S TWEETS:
${tweetTexts || 'No tweets provided'}

CONTENT THEY LIKE:
${likeTexts || 'No likes provided'}

Respond with this exact JSON structure:
{
  "tone": "one of: casual, professional, witty, inspirational, educational",
  "topics": ["array of 3-5 main topics they discuss/like"],
  "vocabulary": ["5-10 characteristic words or phrases they use"],
  "avgLength": estimated average tweet length as number,
  "emojiUsage": "one of: none, light, moderate, heavy",
  "hashtagStyle": "one of: none, minimal, moderate, frequent",
  "writingPatterns": "brief description of their writing patterns",
  "contentThemes": "brief description of themes in content they like"
}`;

      const response = await this.getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        ...result,
        analyzedAt: new Date(),
        tweetCount: tweets.length,
        likesCount: likes.length
      };
    } catch (error) {
      logger.error('Style Analysis Error:', error);
      // Return default profile on error
      return {
        tone: 'casual',
        topics: ['general'],
        vocabulary: [],
        avgLength: 150,
        emojiUsage: 'light',
        hashtagStyle: 'minimal',
        writingPatterns: 'Unable to analyze',
        contentThemes: 'Unable to analyze',
        analyzedAt: new Date(),
        tweetCount: tweets.length,
        likesCount: likes.length
      };
    }
  }

  /**
   * Generate tweet in user's style
   */
  async generateInStyle(prompt, styleProfile, options = {}) {
    try {
      const { type = 'tweet' } = options;

      const styleContext = `
Writing Style Profile:
- Tone: ${styleProfile.tone}
- Topics of interest: ${styleProfile.topics?.join(', ')}
- Characteristic vocabulary: ${styleProfile.vocabulary?.join(', ')}
- Average length: ~${styleProfile.avgLength} characters
- Emoji usage: ${styleProfile.emojiUsage}
- Hashtag style: ${styleProfile.hashtagStyle}
${styleProfile.writingPatterns ? `- Writing patterns: ${styleProfile.writingPatterns}` : ''}
`;

      const systemPrompt = `You are ghostwriting for a Twitter user. Match their exact writing style based on this profile:
${styleContext}

Write content that sounds authentically like them - use their vocabulary, match their tone, and follow their patterns. Keep tweets under 280 characters.`;

      const response = await this.getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      return this.formatTweet(response.choices[0].message.content);
    } catch (error) {
      logger.error('Generate In Style Error:', error);
      throw new AppError('Failed to generate content in your style', 500);
    }
  }

  /**
   * Generate reply suggestions for a tweet
   */
  async generateReplies(tweetContent, styleProfile, count = 3) {
    try {
      const styleContext = styleProfile ? `
Match this writing style:
- Tone: ${styleProfile.tone}
- Vocabulary: ${styleProfile.vocabulary?.slice(0, 5).join(', ')}
- Emoji usage: ${styleProfile.emojiUsage}
` : '';

      const systemPrompt = `You are helping a user craft engaging replies on Twitter. Generate ${count} different reply options that are authentic and likely to get engagement.
${styleContext}
Each reply should be under 280 characters. Make them conversational and add value to the discussion.`;

      const userPrompt = `Generate ${count} reply options for this tweet:

"${tweetContent}"

Provide replies that:
1. Add value or insight
2. Are engaging and likely to start conversation
3. Sound natural, not generic`;

      const response = await this.getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 400,
      });

      const replies = this.parseVariations(response.choices[0].message.content);
      return replies.slice(0, count);
    } catch (error) {
      logger.error('Generate Replies Error:', error);
      throw new AppError('Failed to generate replies', 500);
    }
  }

  /**
   * Generate quote tweet suggestions
   */
  async generateQuotes(tweetContent, styleProfile, count = 3) {
    try {
      const styleContext = styleProfile ? `
Match this writing style:
- Tone: ${styleProfile.tone}
- Topics: ${styleProfile.topics?.slice(0, 3).join(', ')}
` : '';

      const systemPrompt = `You are helping a user create engaging quote tweets. Generate ${count} different quote tweet options that add unique perspective or value.
${styleContext}
Each should be under 200 characters (leaving room for the quoted tweet). Make them insightful and shareable.`;

      const userPrompt = `Generate ${count} quote tweet options for this tweet:

"${tweetContent}"

Provide quotes that:
1. Add your unique take or insight
2. Could go viral or get high engagement
3. Position you as a thought leader`;

      const response = await this.getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 400,
      });

      const quotes = this.parseVariations(response.choices[0].message.content);
      return quotes.slice(0, count);
    } catch (error) {
      logger.error('Generate Quotes Error:', error);
      throw new AppError('Failed to generate quote tweets', 500);
    }
  }
}

export default new AIService();
