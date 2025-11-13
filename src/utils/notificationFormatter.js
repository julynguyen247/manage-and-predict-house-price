// Safely escape HTML special characters
const escapeHtml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Format message with bold ranges (offset, length), preserving original indices
export const formatMessageWithRanges = (message, ranges = []) => {
  if (!message || !Array.isArray(ranges) || ranges.length === 0) {
    return escapeHtml(message || '').replace(/\n/g, '<br>');
  }

  const msg = String(message);
  const sorted = [...ranges]
    .filter(r => Number.isFinite(r?.offset) && Number.isFinite(r?.length) && r.length > 0)
    .sort((a, b) => a.offset - b.offset);

  let html = '';
  let cursor = 0;

  for (const { offset, length } of sorted) {
    if (offset >= msg.length) break;
    const safeOffset = Math.max(0, offset);
    const safeEnd = Math.min(msg.length, safeOffset + length);
    if (safeEnd <= cursor) continue; // skip overlaps/behind cursor

    // Append plain segment before bold
    const plainSegment = msg.slice(cursor, safeOffset);
    if (plainSegment) {
      html += escapeHtml(plainSegment);
    }

    // Append bolded segment
    const boldSegment = msg.slice(safeOffset, safeEnd);
    html += `<strong>${escapeHtml(boldSegment)}</strong>`;

    cursor = safeEnd;
  }

  // Append remaining tail
  if (cursor < msg.length) {
    html += escapeHtml(msg.slice(cursor));
  }

  // New lines to <br>
  return html.replace(/\n/g, '<br>');
};

export default formatMessageWithRanges;


