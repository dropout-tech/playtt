// Opt-in only. Retain the native Heartbeat transport, callbacks and lock expiry.
export const PLAYTT_EDITOR_HEARTBEAT_FLAG = 'native-30s-v1';

export const PLAYTT_EDITOR_HEARTBEAT_POLICY = String.raw`
add_filter( 'heartbeat_settings', static function ( $settings ) {
    global $pagenow;
    if ( ! is_admin() || ! in_array( $pagenow, array( 'post.php', 'post-new.php' ), true ) ) {
        return $settings;
    }
    $current = isset( $settings['minimalInterval'] ) ? (int) $settings['minimalInterval'] : 0;
    $settings['minimalInterval'] = max( 30, $current );
    return $settings;
}, 100 );
`;
