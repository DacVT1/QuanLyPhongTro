const BACKEND_URL = 'http://localhost:3000';

export function getImageUrl(path?: string | null): string {
  if (!path) {
    return '';
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${BACKEND_URL}${path}`;
}