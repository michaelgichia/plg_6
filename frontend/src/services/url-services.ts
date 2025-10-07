import { PathParams } from '@/types/common';

export const API_ROUTES = {
  // Courses
  GET_COURSE_BY_ID: '/api/v1/courses/[id]',
  // Nested Flashcards route
  FLASHCARDS: '/api/v1/courses/[id]/flashcards',
  // Nested Quiz Session route
  QUIZ_SESSION_BY_ID: '/api/v1/courses/[id]/quiz-session/[sessionId]',
  // Chat stream route
  CHAT: '/api/v1/courses/[id]/chat',
} as const;

export type ApiRoutePath = typeof API_ROUTES[keyof typeof API_ROUTES];

/**
 * Replaces dynamic segments in a path with actual values.
 * @param path - The path constant from API_ROUTES (e.g., '/api/v1/courses/[id]').
 * @param params - An object containing the values for dynamic segments.
 * @returns The final path string (e.g., '/api/v1/courses/123').
 */

export function buildApiPath<T extends ApiRoutePath>(
  path: T,
  params: PathParams<T>
): T {
  let finalPath = path;

  for (const key in params) {
    const value = params[key];
    finalPath = finalPath.replace(`[${key}]`, String(value)) as T;
  }

  if (finalPath.includes('[')) {
    console.error('Missing required path parameters:', finalPath);
  }

  return finalPath;
}

export default API_ROUTES;