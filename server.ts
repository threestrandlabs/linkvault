import express, { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { analyzeCategoryForLink } from './src/services/categoryEngine';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to decode basic HTML entities
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
}

// Identify social media platform
function detectPlatform(url: string): { platform: string; color: string; badge: string; icon: string } {
  const lower = url.toLowerCase();
  if (lower.includes('threads.net')) {
    return { platform: 'Threads', color: '#000000', badge: 'bg-black text-white', icon: 'threads' };
  }
  if (lower.includes('instagram.com')) {
    return { platform: 'Instagram', color: '#E1306C', badge: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white', icon: 'instagram' };
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me')) {
    return { platform: 'Facebook', color: '#1877F2', badge: 'bg-blue-600 text-white', icon: 'facebook' };
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return { platform: 'X / Twitter', color: '#000000', badge: 'bg-zinc-900 text-white', icon: 'x' };
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return { platform: 'YouTube', color: '#FF0000', badge: 'bg-red-600 text-white', icon: 'youtube' };
  }
  if (lower.includes('tiktok.com')) {
    return { platform: 'TikTok', color: '#000000', badge: 'bg-slate-900 text-white', icon: 'tiktok' };
  }
  if (lower.includes('reddit.com')) {
    return { platform: 'Reddit', color: '#FF4500', badge: 'bg-orange-600 text-white', icon: 'reddit' };
  }
  if (lower.includes('pinterest.com')) {
    return { platform: 'Pinterest', color: '#E60023', badge: 'bg-rose-600 text-white', icon: 'pinterest' };
  }
  return { platform: 'Web Link', color: '#4F46E5', badge: 'bg-indigo-600 text-white', icon: 'globe' };
}

// Fallback smart category detector based on text & keywords
function categorizeContent(text: string, title: string, url: string): { category: string; tags: string[] } {
  const combined = `${text} ${title} ${url}`.toLowerCase();

  const rules: { category: string; keywords: string[]; tags: string[] }[] = [
    {
      category: 'Food',
      keywords: ['recipe', 'food', 'restaurant', 'cafe', 'cooking', 'bake', 'dinner', 'lunch', 'breakfast', 'ramen', 'pizza', 'pasta', 'dessert', 'cocktail', 'coffee', 'delicious', 'chef', 'meal', 'eat', 'tasty', 'dish', 'cuisine', 'bakery', 'menu'],
      tags: ['foodie', 'recipe', 'dining']
    },
    {
      category: 'Travel',
      keywords: ['travel', 'flight', 'hotel', 'airbnb', 'vacation', 'trip', 'destination', 'itinerary', 'tokyo', 'paris', 'explore', 'beach', 'resort', 'hiking', 'mountain', 'backpacking', 'passport', 'tourist', 'wanderlust', 'city guide'],
      tags: ['travel-guide', 'places', 'vacation']
    },
    {
      category: 'Tech',
      keywords: ['tech', 'gadget', 'coding', 'developer', 'ai', 'software', 'hardware', 'apple', 'macbook', 'iphone', 'android', 'github', 'python', 'javascript', 'react', 'robotics', 'app', 'computer', 'screen', 'gpu', 'startup', 'innovation'],
      tags: ['technology', 'gadgets', 'software']
    },
    {
      category: 'Fashion',
      keywords: ['outfit', 'fashion', 'style', 'clothing', 'dress', 'sneakers', 'shoes', 'ootd', 'wardrobe', 'vintage', 'luxury', 'aesthetic', 'jewelry', 'beauty', 'makeup', 'skincare', 'hair'],
      tags: ['fashion', 'ootd', 'style']
    },
    {
      category: 'Fitness',
      keywords: ['fitness', 'workout', 'gym', 'exercise', 'training', 'muscle', 'yoga', 'cardio', 'running', 'health', 'nutrition', 'protein', 'crossfit', 'wellness', 'athlete', 'stretch'],
      tags: ['fitness', 'health', 'workout']
    },
    {
      category: 'Entertainment',
      keywords: ['movie', 'film', 'cinema', 'music', 'album', 'song', 'concert', 'game', 'gaming', 'series', 'netflix', 'streamer', 'comedy', 'trailer', 'anime', 'podcast', 'show'],
      tags: ['entertainment', 'media', 'watch']
    },
    {
      category: 'Ideas',
      keywords: ['quote', 'productivity', 'design', 'inspiration', 'business', 'book', 'reading', 'psychology', 'mindset', 'lifehack', 'diy', 'interior', 'architecture', 'photography', 'art', 'creative'],
      tags: ['inspiration', 'ideas', 'creative']
    }
  ];

  for (const rule of rules) {
    const hits = rule.keywords.filter(kw => combined.includes(kw));
    if (hits.length > 0) {
      return {
        category: rule.category,
        tags: Array.from(new Set([...rule.tags, ...hits.slice(0, 3)]))
      };
    }
  }

  return { category: 'Other', tags: ['bookmark'] };
}

// POST /api/scrape-metadata
app.post('/api/scrape-metadata', async (req: Request, res: Response) => {
  try {
    const { url, titleFallback, textFallback } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Valid URL is required' });
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    const platformInfo = detectPlatform(parsedUrl.href);

    // Default metadata
    let title = titleFallback || parsedUrl.hostname;
    let description = textFallback || '';
    let image = '';
    let siteName = parsedUrl.hostname;
    let author = '';

    // Attempt to scrape OpenGraph tags
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(parsedUrl.href, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();

        const getMeta = (prop: string) => {
          const match =
            html.match(new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
            html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${prop}["']`, 'i')) ||
            html.match(new RegExp(`<meta[^>]*name=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
            html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${prop}["']`, 'i'));
          return match ? decodeHtmlEntities(match[1]) : '';
        };

        const ogTitle = getMeta('og:title') || getMeta('twitter:title');
        const ogDesc = getMeta('og:description') || getMeta('twitter:description') || getMeta('description');
        const ogImage = getMeta('og:image') || getMeta('twitter:image');
        const ogSite = getMeta('og:site_name');
        const ogAuthor = getMeta('author') || getMeta('article:author') || getMeta('twitter:creator');

        if (ogTitle) title = ogTitle;
        if (ogDesc) description = ogDesc;
        if (ogImage) {
          image = ogImage.startsWith('http') ? ogImage : new URL(ogImage, parsedUrl.origin).href;
        }
        if (ogSite) siteName = ogSite;
        if (ogAuthor) author = ogAuthor;

        if (!title || title === parsedUrl.hostname) {
          const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i);
          if (titleTag && titleTag[1]) {
            title = decodeHtmlEntities(titleTag[1]);
          }
        }
      }
    } catch {
      // Offline or scrape blocked by Instagram/Facebook login wall; use fallbacks
      console.log('Scraping skipped or blocked, utilizing URL heuristics.');
    }

    // Handle social-specific path extractions (e.g., handles like /@username/post/123)
    if (parsedUrl.hostname.includes('threads.net')) {
      const match = parsedUrl.pathname.match(/@([^/]+)/);
      if (match) author = `@${match[1]}`;
      siteName = 'Threads';
    } else if (parsedUrl.hostname.includes('instagram.com')) {
      const match = parsedUrl.pathname.match(/(?:p|reel|tv)\/([^/]+)/);
      siteName = 'Instagram';
      if (!author) author = 'Instagram Post';
    } else if (parsedUrl.hostname.includes('facebook.com')) {
      siteName = 'Facebook';
    }

    const suggestion = analyzeCategoryForLink({
      url: parsedUrl.href,
      title: title || '',
      description: description || textFallback || '',
    });

    const tags = suggestion.matchedKeywords.length > 0
      ? suggestion.matchedKeywords.slice(0, 4)
      : (suggestion.category ? [suggestion.category.toLowerCase()] : ['bookmark']);

    res.json({
      url: parsedUrl.href,
      title: title || 'Saved Link',
      description: description || textFallback || 'Offline cached content snippet.',
      image,
      siteName: siteName || parsedUrl.hostname,
      author: author || '',
      category: suggestion.category,
      categoryConfidence: suggestion.confidence,
      categoryReason: suggestion.reason,
      isClearMatch: suggestion.isClearMatch,
      matchedKeywords: suggestion.matchedKeywords,
      tags,
      platform: platformInfo.platform,
      platformIcon: platformInfo.icon,
      savedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scrape error';
    res.status(500).json({ error: message });
  }
});

// POST /api/ai-analyze
// Uses Gemini to summarize, extract key offline notes, and suggest optimal category
app.post('/api/ai-analyze', async (req: Request, res: Response) => {
  const { title, description, url, category } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Return heuristic response when no key
    res.json({
      summary: description || title,
      takeaways: ['Stored offline in local database', 'Ready for reading without internet'],
      suggestedCategory: category || 'Ideas',
      suggestedTags: ['offline-ready', 'saved'],
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analyze this saved social media post / link for an offline reading vault:
URL: ${url || 'N/A'}
Title: ${title || 'N/A'}
Content/Snippet: ${description || 'N/A'}
Current Category: ${category || 'Uncategorized'}

Respond in clean JSON format:
{
  "summary": "1-2 sentence crisp takeaway of what this post is about",
  "takeaways": ["key point 1", "key point 2", "actionable tip or detail"],
  "suggestedCategory": "Food" | "Travel" | "Tech" | "Fashion" | "Fitness" | "Entertainment" | "Ideas" | "Other",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err) {
    console.error('Gemini analysis error:', err);
    res.json({
      summary: description || title,
      takeaways: ['Stored safely offline for instant viewing'],
      suggestedCategory: category || 'Ideas',
      suggestedTags: ['offline-ready'],
    });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = http.createServer(app);

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production build static serving
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Strand Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
