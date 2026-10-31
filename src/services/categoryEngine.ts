export interface CategorySuggestion {
  category: string | null;
  confidence: 'high' | 'medium' | 'none';
  score: number;
  matchedDomain?: string;
  matchedKeywords: string[];
  reason: string;
  isClearMatch: boolean;
}

interface CategoryRule {
  category: string;
  emoji: string;
  domains: string[];
  keywords: string[];
}

export const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Food',
    emoji: '🍔',
    domains: [
      'eater.com',
      'yelp.com',
      'allrecipes.com',
      'bonappetit.com',
      'seriouseats.com',
      'foodnetwork.com',
      'tasty.co',
      'michelin.com',
      'opentable.com',
      'cookpad.com',
      'thekitchn.com',
      'epicurious.com',
      'foodandwine.com',
      'delish.com',
      'spoonacular.com',
      'ubereats.com',
      'doordash.com',
      'grubhub.com',
      'resy.com',
    ],
    keywords: [
      'recipe', 'recipes', 'cooking', 'bake', 'baking', 'restaurant', 'restaurants', 'cafe',
      'cafes', 'dinner', 'lunch', 'breakfast', 'brunch', 'ramen', 'pasta', 'pizza', 'dessert',
      'desserts', 'cocktail', 'cocktails', 'coffee', 'espresso', 'delicious', 'chef', 'meal',
      'meals', 'eat', 'eats', 'tasty', 'dish', 'dishes', 'cuisine', 'bakery', 'menu', 'ingredient',
      'ingredients', 'foodie', 'foodies', 'izakaya', 'sushi', 'bbq', 'barbecue', 'snack', 'snacks',
      'pastry', 'pastries', 'gourmet', 'dining', 'culinary', 'kitchen', 'wine', 'beer', 'brewery'
    ],
  },
  {
    category: 'Travel',
    emoji: '✈️',
    domains: [
      'tripadvisor.com',
      'airbnb.com',
      'booking.com',
      'lonelyplanet.com',
      'expedia.com',
      'kayak.com',
      'skyscanner.net',
      'skyscanner.com',
      'hostelworld.com',
      'hotels.com',
      'agoda.com',
      'viator.com',
      'rome2rio.com',
      'wanderlog.com',
      'cntraveler.com',
      'nationalgeographic.com',
      'atlasobscura.com',
      'flightradar24.com',
    ],
    keywords: [
      'travel', 'traveling', 'travelling', 'flight', 'flights', 'hotel', 'hotels', 'airbnb',
      'vacation', 'vacations', 'trip', 'trips', 'destination', 'destinations', 'itinerary',
      'itineraries', 'tokyo', 'paris', 'rome', 'kyoto', 'beach', 'beaches', 'resort', 'resorts',
      'hiking', 'hike', 'mountain', 'mountains', 'passport', 'explore', 'exploring', 'tourist',
      'tourism', 'wanderlust', 'city guide', 'attraction', 'attractions', 'hostel', 'sightseeing',
      'monument', 'temple', 'scenic', 'backpacking', 'roadtrip', 'island', 'guidebook'
    ],
  },
  {
    category: 'Tech',
    emoji: '💻',
    domains: [
      'github.com',
      'stackoverflow.com',
      'techcrunch.com',
      'theverge.com',
      'news.ycombinator.com',
      'wired.com',
      'arstechnica.com',
      'producthunt.com',
      'dev.to',
      'engadget.com',
      'macrumors.com',
      '9to5mac.com',
      'huggingface.co',
      'npmjs.com',
      'tomshardware.com',
      'venturebeat.com',
      'gsmarena.com',
      'anandtech.com',
      'hackernews.com',
    ],
    keywords: [
      'tech', 'technology', 'gadget', 'gadgets', 'code', 'coding', 'developer', 'developers',
      'dev', 'ai', 'artificial intelligence', 'software', 'hardware', 'apple', 'macbook', 'iphone',
      'android', 'github', 'python', 'javascript', 'typescript', 'react', 'robotics', 'robot',
      'startup', 'startups', 'screen', 'chip', 'gpu', 'cpu', 'pc', 'linux', 'cloud', 'cybersecurity',
      'algorithm', 'api', 'programming', 'neural', 'llm', 'machine learning', 'framework', 'database'
    ],
  },
  {
    category: 'Fashion',
    emoji: '👗',
    domains: [
      'vogue.com',
      'zara.com',
      'asos.com',
      'farfetch.com',
      'gq.com',
      'ssense.com',
      'hypebeast.com',
      'grailed.com',
      'shein.com',
      'nordstrom.com',
      'uniqlo.com',
      'elle.com',
      'harpersbazaar.com',
      'highsnobiety.com',
    ],
    keywords: [
      'fashion', 'outfit', 'outfits', 'style', 'styling', 'clothing', 'clothes', 'dress', 'dresses',
      'sneakers', 'sneaker', 'shoes', 'footwear', 'ootd', 'wardrobe', 'vintage', 'luxury', 'aesthetic',
      'jewelry', 'beauty', 'makeup', 'thrift', 'thrifting', 'streetwear', 'garment', 'denim', 'blazer',
      'coat', 'designer', 'runway', 'apparel', 'skincare', 'cosmetics', 'perfume', 'haairstyle'
    ],
  },
  {
    category: 'Fitness',
    emoji: '🏋️',
    domains: [
      'strava.com',
      'myfitnesspal.com',
      'bodybuilding.com',
      'runnersworld.com',
      'menshealth.com',
      'womenshealthmag.com',
      'peloton.com',
      'nike.com',
      'crossfit.com',
      'garmin.com',
    ],
    keywords: [
      'workout', 'workouts', 'fitness', 'gym', 'exercise', 'training', 'muscle', 'muscles', 'yoga',
      'cardio', 'running', 'runner', 'runners', 'marathon', 'nutrition', 'protein', 'crossfit',
      'wellness', 'athlete', 'athletic', 'stretch', 'stretching', 'calisthenics', 'bodyweight',
      'pilates', 'aerobics', 'hiit', 'hypertrophy', 'physique', 'strength'
    ],
  },
  {
    category: 'Entertainment',
    emoji: '🎬',
    domains: [
      'imdb.com',
      'rottentomatoes.com',
      'spotify.com',
      'netflix.com',
      'letterboxd.com',
      'ign.com',
      'pitchfork.com',
      'billboard.com',
      'twitch.tv',
      'variety.com',
      'hollywoodreporter.com',
      'polygon.com',
      'crunchyroll.com',
    ],
    keywords: [
      'movie', 'movies', 'film', 'films', 'cinema', 'music', 'album', 'song', 'songs', 'concert',
      'concerts', 'game', 'gaming', 'gamer', 'playstation', 'xbox', 'nintendo', 'series', 'netflix',
      'streamer', 'streaming', 'comedy', 'trailer', 'anime', 'manga', 'podcast', 'podcasts', 'soundtrack',
      'actor', 'actress', 'director', 'soundtrack', 'sound', 'band'
    ],
  },
  {
    category: 'Ideas',
    emoji: '💡',
    domains: [
      'goodreads.com',
      'notion.so',
      'ted.com',
      'hbr.org',
      'wikipedia.org',
      'themarginalian.org',
      'pocket.com',
      'medium.com',
      'substack.com',
    ],
    keywords: [
      'quote', 'quotes', 'productivity', 'design', 'inspiration', 'business', 'book', 'books',
      'reading', 'read', 'psychology', 'mindset', 'lifehack', 'lifehacks', 'diy', 'interior',
      'architecture', 'photography', 'art', 'creative', 'philosophy', 'thinking', 'habits',
      'journal', 'journaling', 'essay', 'strategy', 'framework'
    ],
  },
];

/**
 * Automatically suggests or assigns categories to saved links based on:
 * 1. URL domain mapping (+10 points)
 * 2. Page title keyword matches (+3 points each)
 * 3. Meta description / content keyword matches (+2 points each)
 * 4. URL path keyword matches (+2 points each)
 *
 * If no clear category can be determined (score < 3 or tie without clear leader),
 * returns category: null, isClearMatch: false, confidence: 'none'
 */
export function analyzeCategoryForLink(params: {
  url: string;
  title?: string;
  description?: string;
  existingCategories?: string[];
}): CategorySuggestion {
  const { url, title = '', description = '', existingCategories } = params;

  let hostname = '';
  let pathname = '';
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
    pathname = urlObj.pathname.toLowerCase();
  } catch {
    // Malformed URL
  }

  const cleanTitle = title.toLowerCase();
  const cleanDesc = description.toLowerCase();
  const cleanPath = pathname.replace(/[_\-/.]+/g, ' ');

  // 1. Check direct domain matches
  if (hostname) {
    for (const rule of CATEGORY_RULES) {
      const matchedDomain = rule.domains.find(d => hostname === d || hostname.endsWith(`.${d}`));
      if (matchedDomain) {
        // If domain is known (e.g. allrecipes.com, tripadvisor.com, github.com), high confidence
        return {
          category: rule.category,
          confidence: 'high',
          score: 10,
          matchedDomain,
          matchedKeywords: [],
          reason: `Matched domain "${matchedDomain}"`,
          isClearMatch: true,
        };
      }
    }
  }

  // 2. Score each category based on title, description, and URL path
  const scores: {
    category: string;
    score: number;
    matchedKeywords: string[];
    reasons: string[];
  }[] = [];

  for (const rule of CATEGORY_RULES) {
    let catScore = 0;
    const matchedKws: string[] = [];
    const reasons: string[] = [];

    for (const kw of rule.keywords) {
      // Word boundary regex for accurate keyword matching (avoid partial substring collisions)
      const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');

      let hit = false;
      // Title match (high weight: 3 points)
      if (regex.test(cleanTitle)) {
        catScore += 3;
        matchedKws.push(kw);
        hit = true;
      }
      // Description match (medium weight: 2 points)
      else if (regex.test(cleanDesc)) {
        catScore += 2;
        matchedKws.push(kw);
        hit = true;
      }
      // URL path match (medium weight: 2 points)
      else if (regex.test(cleanPath)) {
        catScore += 2;
        matchedKws.push(kw);
        hit = true;
      }
    }

    if (catScore > 0) {
      scores.push({
        category: rule.category,
        score: catScore,
        matchedKeywords: Array.from(new Set(matchedKws)),
        reasons,
      });
    }
  }

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score);

  // If no category scored any points, or score is too low (< 3 points),
  // no clear category can be determined!
  if (scores.length === 0 || scores[0].score < 3) {
    return {
      category: null,
      confidence: 'none',
      score: scores.length > 0 ? scores[0].score : 0,
      matchedKeywords: [],
      reason: 'No clear category could be determined from the link domain or title/description keywords.',
      isClearMatch: false,
    };
  }

  const top = scores[0];
  const runnerUp = scores[1];

  // If top 2 categories are tied or very close (difference < 2 points), ambiguous!
  if (runnerUp && top.score - runnerUp.score < 2 && top.score < 5) {
    return {
      category: null,
      confidence: 'none',
      score: top.score,
      matchedKeywords: [...top.matchedKeywords, ...runnerUp.matchedKeywords].slice(0, 4),
      reason: `Ambiguous match between ${top.category} and ${runnerUp.category}.`,
      isClearMatch: false,
    };
  }

  const confidence: 'high' | 'medium' = top.score >= 6 ? 'high' : 'medium';
  const keywordList = top.matchedKeywords.slice(0, 3).join(', ');

  return {
    category: top.category,
    confidence,
    score: top.score,
    matchedKeywords: top.matchedKeywords,
    reason: `Found keywords: "${keywordList}" in post title/description`,
    isClearMatch: true,
  };
}
