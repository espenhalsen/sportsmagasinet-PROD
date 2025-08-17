import { setCookie, getCookie, deleteCookie } from 'cookies-next';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export function setAuthCookie(req, res, token) {
  setCookie('auth-token', token, { req, res, ...COOKIE_OPTIONS });
}

export function getAuthCookie(req, res) {
  return getCookie('auth-token', { req, res });
}

export function removeAuthCookie(req, res) {
  deleteCookie('auth-token', { req, res, path: '/' });
}

export function setLanguageCookie(req, res, language) {
  setCookie('language', language, { req, res, ...COOKIE_OPTIONS, maxAge: 60 * 60 * 24 * 365 });
}

export function getLanguageCookie(req, res) {
  return getCookie('language', { req, res }) || 'nb';
}
