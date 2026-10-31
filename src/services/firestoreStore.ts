import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { CategoryDef, SavedPost } from '../types';

function requireDb() {
  if (!db) throw new Error('Firebase is not configured');
  return db;
}

const linksCol = (uid: string) => collection(requireDb(), 'users', uid, 'links');
const linkDoc = (uid: string, id: string) => doc(requireDb(), 'users', uid, 'links', id);
const categoriesCol = (uid: string) => collection(requireDb(), 'users', uid, 'collections');
const categoryDoc = (uid: string, id: string) => doc(requireDb(), 'users', uid, 'collections', id);

export function subscribeLinks(uid: string, onChange: (links: SavedPost[]) => void): Unsubscribe {
  return onSnapshot(linksCol(uid), snapshot => {
    const links = snapshot.docs.map(d => d.data() as SavedPost);
    onChange(links);
  });
}

export function subscribeCategories(uid: string, onChange: (cats: CategoryDef[]) => void): Unsubscribe {
  return onSnapshot(categoriesCol(uid), snapshot => {
    const cats = snapshot.docs.map(d => d.data() as CategoryDef);
    onChange(cats);
  });
}

export async function createLink(uid: string, link: SavedPost): Promise<void> {
  await setDoc(linkDoc(uid, link.id), link);
}

export async function updateLink(uid: string, id: string, patch: Partial<SavedPost>): Promise<void> {
  await updateDoc(linkDoc(uid, id), patch);
}

export async function deleteLink(uid: string, id: string): Promise<void> {
  await deleteDoc(linkDoc(uid, id));
}

export async function deleteAllLinks(uid: string, ids: string[]): Promise<void> {
  const batch = writeBatch(requireDb());
  ids.forEach(id => batch.delete(linkDoc(uid, id)));
  await batch.commit();
}

export async function createCategory(uid: string, cat: CategoryDef): Promise<void> {
  await setDoc(categoryDoc(uid, cat.id), cat);
}

export async function updateCategory(uid: string, id: string, patch: Partial<CategoryDef>): Promise<void> {
  await updateDoc(categoryDoc(uid, id), patch);
}

export async function deleteCategory(uid: string, id: string): Promise<void> {
  await deleteDoc(categoryDoc(uid, id));
}

export async function seedDefaultCategoriesIfEmpty(uid: string, defaults: CategoryDef[]): Promise<void> {
  const existing = await getDocs(categoriesCol(uid));
  if (!existing.empty) return;
  const batch = writeBatch(requireDb());
  defaults.forEach(cat => batch.set(categoryDoc(uid, cat.id), cat));
  await batch.commit();
}

export async function importLinksAndCategories(
  uid: string,
  links: SavedPost[],
  categories: CategoryDef[]
): Promise<void> {
  const batch = writeBatch(requireDb());
  links.forEach(link => batch.set(linkDoc(uid, link.id), link));
  categories.forEach(cat => batch.set(categoryDoc(uid, cat.id), cat));
  await batch.commit();
}
