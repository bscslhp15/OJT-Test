import { createContext, useState, useEffect, useRef } from 'react';
import { deletePostApi } from '../services/api';

const AuthContext = createContext();
const DELETED_POSTS_KEY = 'testsite-deleted-post-ids';
export const getDeletedPostIds = () => {
  try {
    const deletedIds = JSON.parse(localStorage.getItem(DELETED_POSTS_KEY) || '[]');
    return new Set(Array.isArray(deletedIds) ? deletedIds.map(String) : []);
  } catch (error) {
    return new Set();
  }
};

const removeDeletedPostsFromStorage = () => {
  const deletedPostIds = getDeletedPostIds();
  if (deletedPostIds.size === 0) return;

  const removeDeletedPosts = (posts) => Array.isArray(posts)
    ? posts.filter((post) => !deletedPostIds.has(String(post.id)))
    : posts;

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || (!key.startsWith('testsite-posts-') && !key.startsWith('testsite-drafts-') && !key.startsWith('testsite-user-persist-') && key !== 'testsite-posts')) continue;

    try {
      const storedValue = JSON.parse(localStorage.getItem(key) || 'null');
      if (key === 'testsite-posts' || key.startsWith('testsite-posts-') || key.startsWith('testsite-drafts-')) {
        localStorage.setItem(key, JSON.stringify(removeDeletedPosts(storedValue)));
      } else if (storedValue?.posts) {
        localStorage.setItem(key, JSON.stringify({ ...storedValue, posts: removeDeletedPosts(storedValue.posts) }));
      }
    } catch (error) {
      console.error(`Unable to clean deleted posts from ${key}.`, error);
    }
  }
};

const setStorageItemSafely = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error?.name !== 'QuotaExceededError') throw error;
    console.warn(`Storage quota exceeded while saving ${key}.`);
    return false;
  }
};

const clearPersistedAuth = () => {
  localStorage.removeItem('testsite-user');
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith('testsite-user-persist-')) {
      localStorage.removeItem(key);
    }
  }
};

export const AuthProvider = ({ children }) => {
  const STORAGE_KEY = 'testsite-user';
  const getPersistedUserKey = (account) => account?.email
    ? `testsite-user-persist-${account.email.toLowerCase()}`
    : null;

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (error) {
      return null;
    }
  });
  const hasHydratedUser = useRef(false);

  const mergeStoredUser = (incomingUser) => {
    if (!incomingUser) return incomingUser;

    try {
      removeDeletedPostsFromStorage();
      const matchesUser = (post) => {
        const authorId = String(post.authorId || '').toLowerCase();
        const email = String(incomingUser.email || '').toLowerCase();
        const username = String(incomingUser.username || '').toLowerCase();
        return !getDeletedPostIds().has(String(post.id))
          && ((email && authorId === email) || (username && authorId === username));
      };
      const profileKey = incomingUser.email ? `testsite-profile-${incomingUser.email.toLowerCase()}` : null;
      const savedPhoto = profileKey ? localStorage.getItem(profileKey) : null;
      const saved = localStorage.getItem(getPersistedUserKey(incomingUser));
      const globalPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
      const ownedGlobalPosts = Array.isArray(globalPosts)
        ? globalPosts.filter(matchesUser)
        : [];
      const accountPosts = incomingUser.email
        ? JSON.parse(localStorage.getItem(`testsite-posts-${incomingUser.email.toLowerCase()}`) || '[]')
        : [];
      const storedAccountPosts = Array.isArray(accountPosts) ? accountPosts : [];
      const deletedPostIds = getDeletedPostIds();
      const recoveredPosts = [...storedAccountPosts, ...ownedGlobalPosts].filter(
        (post, index, posts) => !deletedPostIds.has(String(post.id))
          && posts.findIndex((item) => String(item.id) === String(post.id)) === index
      );
      if (!saved) {
        return {
          ...incomingUser,
          ...(savedPhoto ? { profile_photo: savedPhoto } : {}),
          posts: recoveredPosts
        };
      }

      const previousUser = JSON.parse(saved);
      if (!previousUser) return incomingUser;

      const sameUser =
        (incomingUser.email && previousUser.email && incomingUser.email === previousUser.email) ||
        (incomingUser.username && previousUser.username && incomingUser.username === previousUser.username);

      if (!sameUser) {
        return {
          ...incomingUser,
          ...(savedPhoto ? { profile_photo: savedPhoto } : {}),
          posts: recoveredPosts
        };
      }

      const incomingPosts = Array.isArray(incomingUser.posts)
        ? incomingUser.posts.filter((post) => !deletedPostIds.has(String(post.id)))
        : [];
      const mergedPosts = [...incomingPosts, ...recoveredPosts].filter(
        (post, index, posts) => posts.findIndex((item) => String(item.id) === String(post.id)) === index
      );

      return {
        ...incomingUser,
        firstName: previousUser.firstName ?? incomingUser.firstName,
        lastName: previousUser.lastName ?? incomingUser.lastName,
        username: previousUser.username ?? incomingUser.username,
        phone: previousUser.phone ?? incomingUser.phone,
        address: previousUser.address ?? incomingUser.address,
        bio: previousUser.bio ?? incomingUser.bio,
        profile_photo: incomingUser.profile_photo ?? savedPhoto ?? previousUser.profile_photo,
        social: {
          ...(incomingUser.social || {}),
          ...(previousUser.social || {})
        },
        posts: mergedPosts
      };
    } catch (error) {
      console.error('Unable to merge saved user data.', error);
      return incomingUser;
    }
  };

  useEffect(() => {
    if (!hasHydratedUser.current) {
      hasHydratedUser.current = true;
      if (user) {
        setUser(mergeStoredUser(user));
        return;
      }
    }

    if (user) {
      const lightweightUser = { ...user };
      delete lightweightUser.posts;
      setStorageItemSafely(STORAGE_KEY, JSON.stringify(lightweightUser));
      const persistedUserKey = getPersistedUserKey(user);
      if (persistedUserKey) {
        setStorageItemSafely(persistedUserKey, JSON.stringify(lightweightUser));
      }
    } else {
      clearPersistedAuth();
    }
  }, [user]);

  const login = (data) => {
    const authenticatedUser = mergeStoredUser(data);
    if (!authenticatedUser) {
      throw new Error('Login response did not include a user.');
    }
    setUser(authenticatedUser);
    return authenticatedUser;
  };
  const logout = () => {
    setUser(null);
    clearPersistedAuth();
  };
  const updateProfile = (updates) => setUser((prev) => {
    if (!prev) return prev;

    const nextUser = { ...prev, ...updates };
    const profilePhotoChanged = Object.prototype.hasOwnProperty.call(updates, 'profile_photo');
    const savedPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
    const updatedPosts = savedPosts.map((post) => {
      const belongsToCurrentUser =
        (post.authorId && prev.email && post.authorId.toLowerCase() === prev.email.toLowerCase()) ||
        (post.authorId && prev.username && post.authorId === prev.username);

      return belongsToCurrentUser
        ? {
            ...post,
            author: [nextUser.firstName, nextUser.lastName].filter(Boolean).join(' ').trim() || nextUser.username,
            authorBio: nextUser.bio || '',
            authorSocial: nextUser.social || {},
            ...(nextUser.profile_photo ? { authorAvatar: nextUser.profile_photo } : {})
          }
        : post;
    });
    localStorage.setItem('testsite-posts', JSON.stringify(updatedPosts));

    if (profilePhotoChanged && nextUser.profile_photo) {
      if (nextUser.email) {
        localStorage.setItem(`testsite-profile-${nextUser.email.toLowerCase()}`, nextUser.profile_photo);
      }

      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith('testsite-comments-')) continue;

        try {
          const savedComments = JSON.parse(localStorage.getItem(key) || '[]');
          const updatedComments = savedComments.map((comment) => {
            const isCurrentUserComment =
              (comment.email && prev.email && comment.email.toLowerCase() === prev.email.toLowerCase()) ||
              (comment.name && prev.username && comment.name === prev.username);

            return isCurrentUserComment ? { ...comment, avatar: nextUser.profile_photo } : comment;
          });
          localStorage.setItem(key, JSON.stringify(updatedComments));
        } catch (error) {
          console.error('Unable to update saved comment avatars.', error);
        }
      }
    }

    return nextUser;
  });

  const deletePost = async (postId) => {
    const authKey = user?.authKey || user?.auth_key;
    if (authKey) {
      try {
        await deletePostApi(postId, authKey);
      } catch (error) {
        const status = error?.response?.status;
        if (status !== 403 && status !== 404) throw error;
        console.warn('Post is not available in the backend; removing the local copy.', postId);
      }
    }

    const deletedPostIds = getDeletedPostIds();
    deletedPostIds.add(String(postId));
    setStorageItemSafely(DELETED_POSTS_KEY, JSON.stringify([...deletedPostIds]));
    removeDeletedPostsFromStorage();

    const removePost = (posts) => Array.isArray(posts)
      ? posts.filter((post) => String(post.id) !== String(postId))
      : posts;

    const globalPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
    localStorage.setItem('testsite-posts', JSON.stringify(removePost(globalPosts)));

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || (!key.startsWith('testsite-posts-') && !key.startsWith('testsite-drafts-') && !key.startsWith('testsite-user-persist-'))) continue;

      try {
        const storedValue = JSON.parse(localStorage.getItem(key) || 'null');
        if (key.startsWith('testsite-posts-') || key.startsWith('testsite-drafts-')) {
          localStorage.setItem(key, JSON.stringify(removePost(storedValue)));
        } else if (storedValue?.posts) {
          localStorage.setItem(key, JSON.stringify({ ...storedValue, posts: removePost(storedValue.posts) }));
        }
      } catch (error) {
        console.error(`Unable to remove post ${postId} from ${key}.`, error);
      }
    }

    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: (prev.posts || []).filter((post) => String(post.id) !== String(postId))
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, deletePost }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
