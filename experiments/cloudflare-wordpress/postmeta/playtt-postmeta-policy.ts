import type { PHP } from '@php-wasm/universal';

// Private canonical state needs internal keys and original meta_id identities.
// A versioned marker distinguishes the complete table from legacy partitioned
// snapshots, which remain readable until their next metadata write.
export const PLAYTT_POSTMETA_PHP = String.raw`<?php
function playtt_full_postmeta(string $root): bool {
    $path = $root . '/_runtime/playtt-postmeta-layout.json';
    if (!file_exists($path)) return false;
    if (!is_file($path) || filesize($path) > 256) throw new RuntimeException('Invalid canonical postmeta layout.');
    $raw = file_get_contents($path);
    if (false === $raw) throw new RuntimeException('Unreadable canonical postmeta layout.');
    $data = json_decode($raw, true, 4, JSON_THROW_ON_ERROR);
    if ($data !== array('schema'=>'playtt/postmeta-table/v1')) throw new RuntimeException('Unsupported canonical postmeta layout.');
    if (!is_file($root . '/_tables/postmeta.json')) throw new RuntimeException('Missing canonical postmeta table.');
    return true;
}
`;

export function patchPlayttPostmetaPersistence(php: PHP): void {
  const root='/wordpress/wp-content/plugins/markdown-database-integration/inc/';
  const writerMethod=String.raw`
	private function playtt_persist_postmeta(): void {
		// Preserve protected keys, duplicate rows, null/empty values and IDs.
		$table = chr(96) . $this->prefix() . 'postmeta' . chr(96);
		$rows = $this->driver->get_connection()->get_pdo()->query('SELECT * FROM ' . $table . ' ORDER BY meta_id')->fetchAll(\PDO::FETCH_ASSOC);
		$this->ensure_tables_dir();
		$this->write_json($this->state_dir . '/_tables/postmeta.json', $rows);
		$directory = $this->state_dir . '/_runtime';
		if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) throw new \RuntimeException('Postmeta layout directory is unavailable.');
		$this->write_json($directory . '/playtt-postmeta-layout.json', array('schema'=>'playtt/postmeta-table/v1'));
	}
`;
  const patches = [
    {file:'class-wp-markdown-write-engine.php',needle:"\t\t\t\t\t$this->persist_table_excluding_markdown_posts( 'postmeta', 'post_id' );",replacement:'\t\t\t\t\t$this->playtt_persist_postmeta();'},
    {file:'class-wp-markdown-write-engine.php',needle:'\tprivate function persist_postmeta_write( string $query, string $op_type ): void {',replacement:writerMethod+'\n\tprivate function persist_postmeta_write( string $query, string $op_type ): void {'},
    {file:'class-wp-markdown-loader.php',needle:'class WP_Markdown_Loader {',replacement:"require_once __DIR__ . '/playtt-postmeta-policy.php';\n\nclass WP_Markdown_Loader {"},
    {file:'class-wp-markdown-loader.php',needle:'\tpublic function load_all(): void {',replacement:'\tpublic function load_all(): void {\n\t\tplaytt_full_postmeta($this->state_dir);'},
    {file:'class-wp-markdown-loader.php',needle:'\tpublic function sync_incremental(): void {',replacement:'\tpublic function sync_incremental(): void {\n\t\tplaytt_full_postmeta($this->state_dir);'},
    {file:'class-wp-markdown-loader.php',needle:'\t\t\t// Boot failures should log but not kill WordPress.',replacement:'\t\t\tif (playtt_full_postmeta($this->state_dir)) throw $e;\n\t\t\t// Boot failures should log but not kill WordPress.'},
    {file:'class-wp-markdown-loader.php',needle:'\tprivate function load_frontmatter_meta(): void {',replacement:'\tprivate function load_frontmatter_meta(): void {\n\t\tif (playtt_full_postmeta($this->state_dir)) return;'},
    {file:'class-wp-markdown-loader.php',needle:'\t\t$meta = $post->_frontmatter_meta ?? array();',replacement:'\t\t$meta = playtt_full_postmeta($this->state_dir) ? array() : ($post->_frontmatter_meta ?? array());'},
    {file:'class-wp-markdown-loader.php',needle:"\t\t\t\tif ( 'postmeta' === $table_suffix ) {",replacement:"\t\t\t\tif ( 'postmeta' === $table_suffix && !playtt_full_postmeta($this->state_dir) ) {"},
    // A filesystem sync must also detect a new marker when old/new JSON bytes
    // happen to match. Reusable-cache requests do not run this filesystem sync.
    {file:'class-wp-markdown-loader.php',needle:"\t\t\t$cached = $manifest[ $file_key ] ?? null;",replacement:"\t\t\t$cached = $manifest[ $file_key ] ?? null;\n\t\t\tif ('postmeta' === $table_suffix && playtt_full_postmeta($this->state_dir)) $cached = null;"},
    {file:'class-wp-markdown-loader.php',needle:'\t\t\t\t$pdo->exec( "DELETE FROM `{$meta_table}` WHERE post_id = {$id}" );',replacement:'\t\t\t\tif (!playtt_full_postmeta($this->state_dir)) $pdo->exec( "DELETE FROM `{$meta_table}` WHERE post_id = {$id}" );'},
    {file:'class-wp-markdown-loader.php',needle:'\t\t\t\t$pdo->exec( "DELETE FROM `{$meta_table}` WHERE post_id IN ({$id_list})" );',replacement:'\t\t\t\tif (!playtt_full_postmeta($this->state_dir)) $pdo->exec( "DELETE FROM `{$meta_table}` WHERE post_id IN ({$id_list})" );'},
  ];
  const prepared=new Map<string,string>();
  for(const patch of patches){
    const path=root+patch.file,source=prepared.get(path)??new TextDecoder().decode(php.readFileAsBuffer(path));
    const needle='\n'+patch.needle;
    if(source.split(needle).length!==2)throw new Error('Pinned MDI postmeta anchor is not unique: '+patch.file+' '+patch.needle.trim());
    prepared.set(path,source.replace(needle,'\n'+patch.replacement));
  }
  php.writeFile(root+'playtt-postmeta-policy.php',new TextEncoder().encode(PLAYTT_POSTMETA_PHP));
  for(const [path,source] of prepared)php.writeFile(path,new TextEncoder().encode(source));
}
