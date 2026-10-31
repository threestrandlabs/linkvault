import { CategoryDef } from '../types';

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  {
    id: 'Read later',
    name: 'Read later',
    emoji: '🔖',
    color: 'emerald',
    isDefault: true,
  },
  {
    id: 'Design refs',
    name: 'Design refs',
    emoji: '🎨',
    color: 'amber',
    isDefault: true,
  },
  {
    id: 'Kitchen',
    name: 'Kitchen',
    emoji: '🍲',
    color: 'rose',
    isDefault: true,
  },
  {
    id: 'Work',
    name: 'Work',
    emoji: '💼',
    color: 'cyan',
    isDefault: true,
  },
  {
    id: 'Tech',
    name: 'Tech',
    emoji: '💻',
    color: 'indigo',
    isDefault: true,
  },
  {
    id: 'Travel',
    name: 'Travel',
    emoji: '✈️',
    color: 'emerald',
    isDefault: true,
  },
  {
    id: 'Food',
    name: 'Food',
    emoji: '🍔',
    color: 'amber',
    isDefault: true,
  },
];

export const favFg = (t: string): string => {
  return (t === '#F2B33D' || t === '#3DA881') ? '#1E2A26' : '#FBF5EA';
};

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  'Design refs': 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
  'Kitchen': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  'Food': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
  'Travel': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
  'Tech': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'Work': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&auto=format&fit=crop&q=80',
  'Read later': 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
};

export const domainOf = (u: string): string => {
  if (!u) return '';
  const clean = String(u).trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  const host = clean.split('/')[0].split('?')[0].split('#')[0];
  return host || '';
};
