import type { PHP } from '@php-wasm/universal';

// Native WordPress drafts may intentionally have no slug yet. MDI writes that
// empty value, but its filename fallback currently treats it as absent on load.
// Keep fallback for dropped-in Markdown without a slug; preserve explicit empty
// values in the two pinned built-in frontmatter profiles.
export function patchPlayttEmptySlugPersistence(php: PHP): void {
  const path = '/wordpress/wp-content/plugins/markdown-database-integration/inc/class-wp-markdown-storage.php';
  const source = new TextDecoder().decode(php.readFileAsBuffer(path));
  const needle = "\t\tif ( '' === $post->post_name && '' !== $file_path ) {";
  const replacement = String.raw`		// PLAYTT_PERSIST_EMPTY_SLUG: explicit empty is different from omitted.
		$playtt_slug_metadata = null;
		if ( 'native' === ( $profile['id'] ?? '' ) ) {
			$playtt_slug_metadata = $frontmatter;
		} elseif ( 'okf' === ( $profile['id'] ?? '' ) && isset( $frontmatter['wordpress'] ) && is_array( $frontmatter['wordpress'] ) ) {
			$playtt_slug_metadata = $frontmatter['wordpress'];
		}
		$playtt_explicit_empty_slug = is_array( $playtt_slug_metadata ) && array_key_exists( 'slug', $playtt_slug_metadata ) && '' === $playtt_slug_metadata['slug'];
		if ( '' === $post->post_name && '' !== $file_path && ! $playtt_explicit_empty_slug ) {`;
  const index = source.indexOf(needle);
  if (index < 0 || index !== source.lastIndexOf(needle)) {
    throw new Error('Pinned MDI empty-slug policy anchor is not unique.');
  }
  php.writeFile(path, new TextEncoder().encode(source.slice(0, index) + replacement + source.slice(index + needle.length)));
}
