import type { PHP } from '@php-wasm/universal';

// Hosted Workers freeze time during synchronous execution. PHP uniqid() polls
// gettimeofday() until it changes, so consecutive calls can spin indefinitely.
// These pinned WordPress core call sites use opaque IDs, not their timestamps.
// Keep the PHP builtin and arbitrary plugin code unchanged; replace pinned calls
// with cryptographic random identifiers. Native password hashing is unchanged.
export const PLAYTT_OPAQUE_ID_PHP = `
if (!function_exists('wp_codebox_uniqid')) {
    function wp_codebox_uniqid(string $prefix = '', bool $more_entropy = false): string {
        return $prefix . bin2hex(random_bytes($more_entropy ? 24 : 16));
    }
}
`;

const PINNED_CORE_CALLS: Record<string, number> = {
  'wp-admin/async-upload.php': 2,
  'wp-admin/includes/class-pclzip.php': 5,
  'wp-admin/includes/file.php': 2,
  'wp-includes/blocks/gallery.php': 1,
  'wp-includes/blocks/image.php': 1,
  'wp-includes/class-snoopy.php': 1,
  'wp-includes/class-wpdb.php': 1,
  'wp-includes/functions.php': 2,
  'wp-includes/PHPMailer/PHPMailer.php': 1,
  'wp-includes/pluggable.php': 1,
  'wp-includes/script-loader.php': 1,
  'wp-includes/theme-templates.php': 1,
};

export function installPlayttOpaqueIds(php: PHP): void {
  const prependPath = '/internal/shared/auto_prepend_file.php';
  const prepend = new TextDecoder().decode(php.readFileAsBuffer(prependPath));
  if (!prepend.startsWith('<?php') || prepend.includes('function wp_codebox_uniqid')) throw new Error('Unexpected PHP prepend script.');
  php.writeFile(prependPath, new TextEncoder().encode(prepend.replace('<?php', '<?php\n' + PLAYTT_OPAQUE_ID_PHP)));
  patchOpaqueCalls(php, '/wordpress/', PINNED_CORE_CALLS);
}

// The pinned runtime storage adapter also uses uniqid for temporary filenames.
export function installPlayttStorageOpaqueIds(php: PHP): void {
  patchOpaqueCalls(php, '/wordpress/wp-content/plugins/markdown-database-integration/', {
    'inc/class-wp-markdown-db.php': 1,
    'inc/class-wp-markdown-storage.php': 1,
    'inc/class-wp-markdown-write-engine.php': 1,
  });
}

function patchOpaqueCalls(php: PHP, root: string, calls: Record<string, number>): void {
  for (const [relativePath, expectedCount] of Object.entries(calls)) {
    const path = root + relativePath;
    const source = new TextDecoder().decode(php.readFileAsBuffer(path));
    if ((source.match(/\buniqid\(/g) ?? []).length !== expectedCount) throw new Error('Pinned WordPress unique ID call sites changed: ' + relativePath);
    php.writeFile(path, new TextEncoder().encode(source.replace(/\buniqid\(/g, 'wp_codebox_uniqid(')));
  }
}

// Starter images are already sized/optimized and the theme uses their originals.
// Avoid decoding/re-encoding their multiple unused thumbnails in a 128 MiB DO.
// Ordinary Media Library uploads retain WordPress's normal image-size behavior.
export const PLAYTT_STARTER_MEDIA_POLICY = `
add_filter('intermediate_image_sizes_advanced', function ($sizes, $metadata, $attachment_id) {
    return get_post_meta($attachment_id, '_lets_play_asset', true) ? array() : $sizes;
}, 10, 3);
`;
