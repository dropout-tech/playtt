import type { PHP } from '@php-wasm/universal';

// MDI's legacy readers rtrim the entire body. New native writes carry a byte
// count and digest so readers can remove only the writer's final framing LF.
// Unmarked snapshots retain their previous interpretation until edited.
export function patchPlayttContentPersistence(php: PHP): void {
  const path = '/wordpress/wp-content/plugins/markdown-database-integration/inc/class-wp-markdown-storage.php';
  let source = new TextDecoder().decode(php.readFileAsBuffer(path));
  const patches = [
    ["\t\t$content = $post->post_content ?? '';", String.raw`		$content = $post->post_content ?? '';
		$frontmatter['__playtt_content'] = 'v1:' . strlen( $content ) . ':' . hash( 'sha256', $content );`],
    ["\t\t$content     = $metadata_only ? '' : rtrim( $m[2] );", "\t\t$content     = $metadata_only ? '' : ( is_array( $frontmatter ) ? $this->playtt_read_content( $frontmatter, $m[2] ) : '' );"],
    [String.raw`		if ( ! preg_match( '/^---\n.+?\n---\n\n?(.*)/s', $raw, $m ) ) {`, String.raw`		if ( ! preg_match( '/^---\n(.+?)\n---\n\n?(.*)/s', $raw, $m ) ) {`],
    ["\t\treturn rtrim( $m[1] );", String.raw`		$frontmatter = $this->decode_yaml( $m[1] );
		return is_array( $frontmatter ) ? $this->playtt_read_content( $frontmatter, $m[2] ) : null;`],
    ["\tpublic function read_content_from_file( string $file_path ): ?string {", String.raw`	private function playtt_read_content( array $frontmatter, string $body ): string {
		if ( ! array_key_exists( '__playtt_content', $frontmatter ) ) return rtrim( $body );
		$marker = $frontmatter['__playtt_content'];
		if ( ! is_string( $marker ) || ! preg_match( '/^v1:(0|[1-9][0-9]*):([a-f0-9]{64})$/D', $marker, $match ) || ! str_ends_with( $body, "\n" ) ) {
			throw new RuntimeException( 'Invalid PLAYTT content frame.' );
		}
		$content = substr( $body, 0, -1 );
		if ( $match[1] !== (string) strlen( $content ) || ! hash_equals( $match[2], hash( 'sha256', $content ) ) ) {
			throw new RuntimeException( 'PLAYTT content frame integrity mismatch.' );
		}
		return $content;
	}

	public function read_content_from_file( string $file_path ): ?string {`],
  ];
  // Validate every anchor before changing the runtime file.
  for (const [needle, replacement] of patches) {
    if (source.split(needle).length !== 2) throw new Error('Pinned MDI content anchor is not unique.');
    source = source.replace(needle, replacement);
  }
  php.writeFile(path, new TextEncoder().encode(source));
}
