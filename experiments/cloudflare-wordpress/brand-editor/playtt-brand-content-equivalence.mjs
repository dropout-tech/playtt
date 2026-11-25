// Limited to the four harmless serialization differences observed in this
// generated home page. Never strip arbitrary whitespace, attributes or text.
export function normalizeBrandContent(text) {
  return text
    .replace(/(?<=-->)\n+(?=<)/g, '')
    .replaceAll('<!-- wp:heading {"level":2} -->', '<!-- wp:heading -->')
    .replaceAll('class="wp-block-group lp-section "', 'class="wp-block-group lp-section"')
    .replaceAll('>PLAY, LEARN & GROW</p>', '>PLAY, LEARN &amp; GROW</p>')
    .trim();
}
