import api from './api';

/**
 * SWR fetcher function
 * Wraps the axios instance for use with SWR
 */
export const fetcher = async (url: string) => {
  const response = await api.get(url);
  return response.data;
};

/**
 * SWR fetcher for POST requests
 */
export const poster = async (url: string, data?: any) => {
  const response = await api.post(url, data);
  return response.data;
};

/**
 * SWR fetcher for PUT requests
 */
export const putter = async (url: string, data?: any) => {
  const response = await api.put(url, data);
  return response.data;
};

/**
 * SWR fetcher for DELETE requests
 */
export const deleter = async (url: string) => {
  const response = await api.delete(url);
  return response.data;
};
