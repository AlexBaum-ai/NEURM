/**
 * Forum Store
 * Zustand store for managing forum state (categories, topics, votes, etc.)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ForumCategory, VotesMap, VoteType, VoteableType } from '../types';

interface ForumState {
  // Categories
  categories: ForumCategory[];
  selectedCategory: ForumCategory | null;
  followedCategories: string[]; // Category IDs

  // Voting
  userVotes: VotesMap; // Map of "{type}:{id}" -> VoteType

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  setCategories: (categories: ForumCategory[]) => void;
  setSelectedCategory: (category: ForumCategory | null) => void;
  updateCategory: (categoryId: string, updates: Partial<ForumCategory>) => void;
  toggleFollowCategory: (categoryId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Voting Actions
  setUserVotes: (votes: VotesMap) => void;
  setVote: (type: VoteableType, id: string, voteType: VoteType) => void;
  getUserVote: (type: VoteableType, id: string) => VoteType;
}

const initialState = {
  categories: [],
  selectedCategory: null,
  followedCategories: [],
  userVotes: {},
  isLoading: false,
  error: null,
};

export const useForumStore = create<ForumState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setCategories: (categories) =>
        set({ categories, error: null }, false, 'setCategories'),

      setSelectedCategory: (category) =>
        set({ selectedCategory: category }, false, 'setSelectedCategory'),

      updateCategory: (categoryId, updates) =>
        set(
          (state) => ({
            categories: state.categories.map((cat) => {
              if (cat.id === categoryId) {
                return { ...cat, ...updates };
              }
              // Also update if it's a child category
              if (cat.children) {
                return {
                  ...cat,
                  children: cat.children.map((child) =>
                    child.id === categoryId ? { ...child, ...updates } : child
                  ),
                };
              }
              return cat;
            }),
            // Update selected category if it's the one being updated
            selectedCategory:
              state.selectedCategory?.id === categoryId
                ? { ...state.selectedCategory, ...updates }
                : state.selectedCategory,
          }),
          false,
          'updateCategory'
        ),

      toggleFollowCategory: (categoryId) =>
        set(
          (state) => {
            const isFollowing = state.followedCategories.includes(categoryId);
            const newFollowedCategories = isFollowing
              ? state.followedCategories.filter((id) => id !== categoryId)
              : [...state.followedCategories, categoryId];

            // Update category's follower count
            const categories = state.categories.map((cat) => {
              if (cat.id === categoryId) {
                const followerCount = cat.followerCount ?? 0;
                return {
                  ...cat,
                  isFollowing: !isFollowing,
                  followerCount: isFollowing ? followerCount - 1 : followerCount + 1,
                };
              }
              // Also update if it's a child category
              if (cat.children) {
                return {
                  ...cat,
                  children: cat.children.map((child) => {
                    if (child.id === categoryId) {
                      const followerCount = child.followerCount ?? 0;
                      return {
                        ...child,
                        isFollowing: !isFollowing,
                        followerCount: isFollowing ? followerCount - 1 : followerCount + 1,
                      };
                    }
                    return child;
                  }),
                };
              }
              return cat;
            });

            return {
              followedCategories: newFollowedCategories,
              categories,
            };
          },
          false,
          'toggleFollowCategory'
        ),

      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      reset: () => set(initialState, false, 'reset'),

      // Voting Actions
      setUserVotes: (votes) => set({ userVotes: votes }, false, 'setUserVotes'),

      setVote: (type, id, voteType) =>
        set(
          (state) => ({
            userVotes: {
              ...state.userVotes,
              [`${type}:${id}`]: voteType,
            },
          }),
          false,
          'setVote'
        ),

      getUserVote: (type, id) => {
        const state = get();
        return state.userVotes[`${type}:${id}`] || 0;
      },
    }),
    { name: 'forum-store' }
  )
);

// Selectors
export const selectCategories = (state: ForumState) => state.categories;
export const selectMainCategories = (state: ForumState) =>
  state.categories.filter((cat) => cat.level === 0);
export const selectSelectedCategory = (state: ForumState) => state.selectedCategory;
export const selectFollowedCategories = (state: ForumState) => state.followedCategories;
export const selectIsLoading = (state: ForumState) => state.isLoading;
export const selectError = (state: ForumState) => state.error;
