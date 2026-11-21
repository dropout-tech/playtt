// Local candidate only: use the native Heartbeat scheduler's supported floor.
// Do not remove heartbeat callbacks, lock checks, nonce refresh or autosave.
add_filter( 'heartbeat_settings', static function ( $settings ) {
    global $pagenow;
    if ( ! is_admin() || ! in_array( $pagenow, array( 'post.php', 'post-new.php' ), true ) ) {
        return $settings;
    }
    $current = isset( $settings['minimalInterval'] ) ? (int) $settings['minimalInterval'] : 0;
    $settings['minimalInterval'] = max( 30, $current );
    return $settings;
}, 100 );
