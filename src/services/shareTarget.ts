import { PlatformType } from '../types';
import { analyzeCategoryForLink, CategorySuggestion } from './categoryEngine';

export interface IncomingSharePayload {
  url: string;
  rawText: string;
  title: string;
  platform: PlatformType;
  suggestedCategory: string | null;
  categoryReason: string;
  isClearMatch: boolean;
  cleanUrl: string;
}

// Extract any valid URL from a string that might contain mixed text
export function extractUrlFromText(text: string): string | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

// Clean common tracking parameters from social media share links
export function cleanTrackingParams(rawUrl: string): string {
  try {
    const urlObj = new URL(rawUrl);
    const trackingKeys = [
      'igsh',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'ref',
      's',
      't',
      'si',
      'feature',
    ];
    trackingKeys.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch {
    return rawUrl;
  }
}

// Identify social media platform
export function detectPlatformFromUrl(url: string): PlatformType {
  const lower = url.toLowerCase();
  if (lower.includes('threads.net')) return 'Threads';
  if (lower.includes('instagram.com')) return 'Instagram';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me')) return 'Facebook';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'X / Twitter';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
  if (lower.includes('tiktok.com')) return 'TikTok';
  if (lower.includes('reddit.com')) return 'Reddit';
  if (lower.includes('pinterest.com')) return 'Pinterest';
  return 'Web Link';
}

// Client-side category prediction with explanation and clear-match determination
export function predictCategory(text: string, title: string, url: string): CategorySuggestion {
  return analyzeCategoryForLink({
    url,
    title,
    description: text,
  });
}

// Check window.location.search for incoming Web Share Target parameters
export function checkIncomingShare(): IncomingSharePayload | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const rawUrl = params.get('url');
  const rawText = params.get('text');
  const rawTitle = params.get('title');

  if (!rawUrl && !rawText && !rawTitle) {
    return null;
  }

  // Determine the URL (either direct url param, or extracted from text param)
  let detectedUrl = rawUrl || '';
  if (!detectedUrl && rawText) {
    const extracted = extractUrlFromText(rawText);
    if (extracted) {
      detectedUrl = extracted;
    }
  }

  if (!detectedUrl) {
    return null;
  }

  const clean = cleanTrackingParams(detectedUrl);
  const platform = detectPlatformFromUrl(clean);
  const suggestion = predictCategory(rawText || '', rawTitle || '', clean);

  // Clean the URL search params from the address bar to prevent duplicate triggering
  const newUrl = window.location.pathname;
  window.history.replaceState({}, document.title, newUrl);

  return {
    url: detectedUrl,
    cleanUrl: clean,
    rawText: rawText || '',
    title: rawTitle || '',
    platform,
    suggestedCategory: suggestion.category,
    categoryReason: suggestion.reason,
    isClearMatch: suggestion.isClearMatch,
  };
}
