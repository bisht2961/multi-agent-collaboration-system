import { convert } from 'html-to-text';

/**
 * Convert markdown-formatted text to plain text
 * Strips common markdown syntax including headers, bold, italic, links, etc.
 */
export function markdownToText(markdown: string): string {
  if (!markdown) return '';

  let text = markdown;

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Convert headers (# ## ### etc) to plain text with line breaks
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Convert bold and italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '$1'); // ***text*** -> text
  text = text.replace(/\*\*(.+?)\*\*/g, '$1'); // **text** -> text
  text = text.replace(/__(.+?)__/g, '$1'); // __text__ -> text
  text = text.replace(/\*(.+?)\*/g, '$1'); // *text* -> text
  text = text.replace(/_(.+?)_/g, '$1'); // _text_ -> text
  text = text.replace(/~~(.+?)~~/g, '$1'); // ~~text~~ -> text

  // Convert links [text](url) to just text
  text = text.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1');

  // Remove reference links
  text = text.replace /^\s*\[\^?[\w\-]+\]:\s*.+$/gm, '');

  // Remove inline code formatting but keep the text
  text = text.replace(/`{3}[\s\S]*?`{3}/g, ''); // Remove code blocks
  text = text.replace(/`(.+?)`/g, '$1'); // Remove inline code

  // Remove list markers
  text = text.replace(/^[\s]*[\*\-\+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');

  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');

  // Remove horizontal rules
  text = text.replace(/^\s*(\*\s*){3,}$/gm, '');
  text = text.replace(/^\s*(-\s*){3,}$/gm, '');
  text = text.replace(/^\s*(_\s*){3,}$/gm, '');

  // Clean up multiple blank lines to max 2
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace from start and end
  text = text.trim();

  return text;
}
