/**
 * Quote and Reply Preview Formatter
 * Converts raw message contents (including JSON polls, contacts, media, and stickers)
 * into human-readable quote previews matching the actual message.
 */

export function parseQuotedContent(content) {
  if (!content) return { type: 'text', text: 'Attachment' };

  if (typeof content === 'string') {
    const trimmed = content.trim();

    // Check if it's a JSON string (e.g. Poll or Contact)
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && parsed.question) {
          return {
            type: 'poll',
            label: 'Poll',
            text: parsed.question
          };
        }
        if (parsed && (parsed.name || parsed.phone || parsed.email)) {
          return {
            type: 'contact',
            label: 'Contact',
            text: parsed.name || parsed.phone || parsed.email
          };
        }
      } catch (e) {
        // Fallback to normal string if parsing fails
      }
    }

    // Check if it's a sticker url or gif
    if (trimmed.startsWith('http') && (trimmed.includes('giphy.com') || trimmed.includes('.gif') || trimmed.includes('sticker'))) {
      return {
        type: 'sticker',
        label: 'Sticker',
        text: 'Sticker'
      };
    }

    // Strip forwarded wrapper if present for compact preview
    if (trimmed.startsWith('> **Forwarded from')) {
      const lines = trimmed.split('\n');
      const clean = lines.slice(1).join(' ').trim();
      return {
        type: 'text',
        text: clean || 'Forwarded message'
      };
    }

    return {
      type: 'text',
      text: trimmed
    };
  }

  // If passed an object directly
  if (typeof content === 'object') {
    if (content.question) {
      return {
        type: 'poll',
        label: 'Poll',
        text: content.question
      };
    }
    if (content.name || content.phone) {
      return {
        type: 'contact',
        label: 'Contact',
        text: content.name || content.phone || 'Contact'
      };
    }
  }

  return { type: 'text', text: String(content) };
}

export function formatQuotePreview(msgOrContent) {
  if (!msgOrContent) return 'Attachment';

  // If passed a full message object
  if (typeof msgOrContent === 'object' && !msgOrContent.question && !msgOrContent.text) {
    const type = msgOrContent.type;
    const content = msgOrContent.content;
    const media = msgOrContent.media;

    if (type === 'poll') {
      try {
        const poll = typeof content === 'string' ? JSON.parse(content) : content;
        return `📊 Poll: ${poll?.question || 'Poll'}`;
      } catch (e) {
        return '📊 Poll';
      }
    }

    if (type === 'contact') {
      try {
        const c = typeof content === 'string' ? JSON.parse(content) : content;
        return `👤 Contact: ${c?.name || c?.phone || 'Shared Contact'}`;
      } catch (e) {
        return '👤 Contact';
      }
    }

    if (type === 'sticker') {
      return '🏷️ Sticker';
    }

    if ((!content || !content.trim()) && Array.isArray(media) && media.length > 0) {
      const first = media[0];
      const mime = (first.fileType || first.mimeType || '').toLowerCase();
      const url = (first.url || '').toLowerCase();
      if (mime.startsWith('image') || url.match(/\.(png|jpe?g|webp|gif)$/i)) {
        return '🖼️ Photo';
      }
      if (mime.startsWith('video') || url.match(/\.(mp4|mov|webm)$/i)) {
        return '🎥 Video';
      }
      if (mime.startsWith('audio') || url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        return '🎵 Audio';
      }
      return `📄 ${first.fileName || 'Document'}`;
    }

    return parseQuotedContent(content).text || 'Attachment';
  }

  const parsed = parseQuotedContent(msgOrContent);
  if (parsed.type === 'poll') return `📊 Poll: ${parsed.text}`;
  if (parsed.type === 'contact') return `👤 Contact: ${parsed.text}`;
  if (parsed.type === 'sticker') return '🏷️ Sticker';
  return parsed.text || 'Attachment';
}

