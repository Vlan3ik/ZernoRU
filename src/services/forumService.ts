import { ForumPost, ForumReply } from '../types/domain';
import { getStorage, setStorage, uid } from './localStorageService';
import { STORAGE_KEYS } from '../utils/storageKeys';

export const forumService = {
  getPosts(section?: ForumPost['section'], search = ''): ForumPost[] {
    const posts = getStorage<ForumPost[]>(STORAGE_KEYS.forumPosts, []);

    return posts.filter((post) => {
      if (section && post.section !== section) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase();
      return (
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  },

  addPost(payload: Omit<ForumPost, 'id' | 'createdAt'>): ForumPost {
    const posts = getStorage<ForumPost[]>(STORAGE_KEYS.forumPosts, []);
    const newPost: ForumPost = { ...payload, id: uid('post'), createdAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.forumPosts, [newPost, ...posts]);
    return newPost;
  },

  getReplies(postId: string): ForumReply[] {
    const replies = getStorage<ForumReply[]>(STORAGE_KEYS.forumReplies, []);
    return replies.filter((x) => x.postId === postId);
  },

  addReply(payload: Omit<ForumReply, 'id' | 'createdAt'>): ForumReply {
    const replies = getStorage<ForumReply[]>(STORAGE_KEYS.forumReplies, []);
    const reply: ForumReply = { ...payload, id: uid('reply'), createdAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.forumReplies, [reply, ...replies]);
    return reply;
  },
};


