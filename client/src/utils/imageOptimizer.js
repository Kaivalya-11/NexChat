/**
 * Image optimization utilities for NexChat
 * Handles Cloudinary dynamic transformations, UI-Avatars sizing, and WebP/AVIF auto-format delivery.
 */

/**
 * Optimizes an avatar or profile image URL.
 * Defaults to 80x80 (2x retina for 32px-40px avatars), c_fill, g_face, q_auto, f_auto.
 *
 * @param {string} url - Original image URL
 * @param {Object} options - Transformation options
 * @param {number} [options.width=80] - Target width in px
 * @param {number} [options.height=80] - Target height in px
 * @param {string} [options.crop='fill'] - Cloudinary crop mode (fill, scale, limit, thumb)
 * @param {string} [options.gravity='face'] - Cloudinary focus gravity
 * @param {string} [options.quality='auto'] - Quality level ('auto', 'auto:eco', 'auto:good', 'auto:best')
 * @param {string} [options.format='auto'] - Image format ('auto' serves WebP/AVIF depending on browser support)
 * @returns {string} Optimized URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return url || '';

  const {
    width = 80,
    height = 80,
    crop = 'fill',
    gravity = 'face',
    quality = 'auto',
    format = 'auto'
  } = options;

  // Cloudinary image transformation
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    const parts = url.split('/image/upload/');
    if (parts.length === 2) {
      const prefix = `${parts[0]}/image/upload/`;
      let rest = parts[1];

      // Build transformation string
      const transformArr = [];
      if (width) transformArr.push(`w_${width}`);
      if (height) transformArr.push(`h_${height}`);
      if (crop) transformArr.push(`c_${crop}`);
      if (gravity && crop === 'fill') transformArr.push(`g_${gravity}`);
      if (quality) transformArr.push(`q_${quality}`);
      if (format) transformArr.push(`f_${format}`);

      const transformStr = transformArr.join(',');

      // If URL already had transformations between /upload/ and version/path, strip them
      const slashIndex = rest.indexOf('/');
      if (slashIndex !== -1) {
        const potentialTransform = rest.substring(0, slashIndex);
        if (/^(?:[whcqf]_[^/]+|g_[^/]+|b_[^/]+|r_[^/]+)/.test(potentialTransform)) {
          rest = rest.substring(slashIndex + 1);
        }
      }

      return `${prefix}${transformStr}/${rest}`;
    }
  }

  // UI-Avatars service: add explicit size param
  if (url.includes('ui-avatars.com/api/')) {
    try {
      const u = new URL(url);
      if (width && !u.searchParams.has('size')) {
        u.searchParams.set('size', String(width));
      }
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
}

/**
 * Optimizes media attachment images (photos, screenshots) posted in chat.
 * Constrains max dimensions and enables auto quality/format to prevent downloading multi-MB raw files.
 *
 * @param {string} url - Original image URL
 * @param {Object} options - Transformation options
 * @param {number} [options.maxWidth=800] - Maximum width constraint
 * @param {number} [options.maxHeight] - Maximum height constraint
 * @param {string} [options.quality='auto'] - Auto compression
 * @param {string} [options.format='auto'] - Auto format conversion (WebP/AVIF)
 * @returns {string} Optimized URL
 */
export function getOptimizedAttachmentUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return url || '';

  const {
    maxWidth = 800,
    maxHeight,
    quality = 'auto',
    format = 'auto'
  } = options;

  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    const parts = url.split('/image/upload/');
    if (parts.length === 2) {
      const prefix = `${parts[0]}/image/upload/`;
      let rest = parts[1];

      const transformArr = [];
      if (maxWidth) transformArr.push(`w_${maxWidth},c_limit`);
      if (maxHeight) transformArr.push(`h_${maxHeight}`);
      if (quality) transformArr.push(`q_${quality}`);
      if (format) transformArr.push(`f_${format}`);

      const transformStr = transformArr.join(',');

      const slashIndex = rest.indexOf('/');
      if (slashIndex !== -1) {
        const potentialTransform = rest.substring(0, slashIndex);
        if (/^(?:[whcqf]_[^/]+|g_[^/]+)/.test(potentialTransform)) {
          rest = rest.substring(slashIndex + 1);
        }
      }

      return `${prefix}${transformStr}/${rest}`;
    }
  }

  return url;
}

