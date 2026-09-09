import { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();
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

export const AuthProvider = ({ children }) => {
  const STORAGE_KEY = 'testsite-user';
  const getPersistedUserKey = (account) => account?.email
    ? `testsite-user-persist-${account.email.toLowerCase()}`
    : null;

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      if (!storedUser) return null;

      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser) return null;

      const email = String(parsedUser.email || '').toLowerCase();
      const username = String(parsedUser.username || '').toLowerCase();
      const savedPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
      const posts = Array.isArray(savedPosts)
        ? savedPosts.filter((post) => {
            const authorId = String(post.authorId || '').toLowerCase();
            return (email && authorId === email) || (username && authorId === username);
          })
        : [];

      return { ...parsedUser, posts };
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const mergeStoredUser = (incomingUser) => {
    if (!incomingUser) return incomingUser;

    try {
      const matchesUser = (post) => {
        const authorId = String(post.authorId || '').toLowerCase();
        const email = String(incomingUser.email || '').toLowerCase();
        const username = String(incomingUser.username || '').toLowerCase();
        return (email && authorId === email) || (username && authorId === username);
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
      const recoveredPosts = [...storedAccountPosts, ...ownedGlobalPosts].filter(
        (post, index, posts) => posts.findIndex((item) => String(item.id) === String(post.id)) === index
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

      const savedPosts = Array.isArray(previousUser.posts) ? previousUser.posts : [];
      const incomingPosts = Array.isArray(incomingUser.posts) ? incomingUser.posts : [];
      const mergedPosts = [...savedPosts, ...incomingPosts, ...recoveredPosts].filter(
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
    if (user) {
      const lightweightUser = { ...user };
      delete lightweightUser.posts;
      setStorageItemSafely(STORAGE_KEY, JSON.stringify(lightweightUser));
      const persistedUserKey = getPersistedUserKey(user);
      if (persistedUserKey) {
        setStorageItemSafely(persistedUserKey, JSON.stringify(lightweightUser));
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
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
  const logout = () => setUser(null);
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

  const deletePost = (postId) => {
    const globalPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
    const filteredGlobalPosts = globalPosts.filter((post) => String(post.id) !== String(postId));
    localStorage.setItem('testsite-posts', JSON.stringify(filteredGlobalPosts));

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
