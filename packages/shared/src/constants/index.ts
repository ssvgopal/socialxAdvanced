// Application constants
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    PROFILE: '/users/profile',
    SEARCH: '/users/search',
  },
  POSTS: {
    FEED: '/posts',
    CREATE: '/posts',
    LIKE: '/posts/:id/like',
    COMMENT: '/posts/:id/comments',
  },
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 8,
  POST_MAX_LENGTH: 2000,
  COMMENT_MAX_LENGTH: 500,
} as const;