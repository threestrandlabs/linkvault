export type PlatformType =
  | 'Threads'
  | 'Instagram'
  | 'Facebook'
  | 'X / Twitter'
  | 'YouTube'
  | 'TikTok'
  | 'Reddit'
  | 'Pinterest'
  | 'Web Link';

export interface SavedPost {
  id: string;
  url: string;
  title: string;
  domain?: string;
  description: string;
  contentSnapshot?: string;
  image?: string;
  siteName: string;
  author?: string;
  platform: PlatformType;
  category: string; // maps to collection (e.g. 'Read later', 'Design refs', 'Kitchen', 'Work', 'Food', 'Travel', 'Tech')
  collection?: string;
  tags: string[];
  notes?: string;
  date?: string;
  unread?: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isRead: boolean;
  tint?: string;
  readTimeEstimate?: string;
  takeaways?: string[];
  savedAt: string;
  updatedAt: string;
  offlineAvailable: boolean;
}

export interface CategoryDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgLight?: string;
  bgDark?: string;
  textColor?: string;
  borderColor?: string;
  description?: string;
  isDefault?: boolean;
}

export type StrandAppearance = 'Light' | 'Dark' | 'System';
export type StrandOpenIn = 'In app' | 'Browser';

export interface StrandPrefs {
  fetch: boolean;
  thumbs: boolean;
  unread: boolean;
}

export interface NewLinkDraft {
  url: string;
  title: string;
  image?: string;
  note?: string;
  collection: string;
  tags: string[];
}
