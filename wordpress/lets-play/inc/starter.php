<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Copy starter media into the ordinary Media Library so it survives theme changes. */
function lets_play_import_media() {
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $map = array();
    foreach ( glob( get_theme_file_path( 'assets/images/*.webp' ) ) as $file ) {
        $name = basename( $file );
        $existing = get_posts( array( 'post_type' => 'attachment', 'post_status' => 'inherit', 'posts_per_page' => 1, 'meta_key' => '_lets_play_asset', 'meta_value' => $name ) );
        if ( $existing ) {
            $url = wp_get_attachment_url( $existing[0]->ID );
        } else {
            $upload = wp_upload_bits( $name, null, file_get_contents( $file ) );
            if ( $upload['error'] ) { return new WP_Error( 'upload_failed', $upload['error'] ); }
            $id = wp_insert_attachment( array( 'post_mime_type' => 'image/webp', 'post_title' => pathinfo( $name, PATHINFO_FILENAME ), 'post_status' => 'inherit' ), $upload['file'], 0, true );
            if ( is_wp_error( $id ) ) { return $id; }
            update_post_meta( $id, '_lets_play_asset', $name );
            wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );
            $url = $upload['url'];
        }
        $map[ get_theme_file_uri( 'assets/images/' . $name ) ] = $url;
    }
    return $map;
}

/** Idempotent starter import. Never overwrite an existing page or change an existing homepage. */
function lets_play_import_starter() {
    if ( ! current_user_can( 'manage_options' ) ) { return new WP_Error( 'forbidden', '需要管理員權限。' ); }
    $media = lets_play_import_media();
    if ( is_wp_error( $media ) ) { return $media; }
    $pages = json_decode( file_get_contents( get_theme_file_path( 'inc/pages.json' ) ), true );
    $created = array();
    foreach ( $pages as $page ) {
        if ( get_page_by_path( $page['slug'] ) ) { continue; }
        $file = get_theme_file_path( 'patterns/' . $page['pattern'] . '.php' );
        ob_start();
        include $file;
        $content = strtr( ob_get_clean(), $media );
        $id = wp_insert_post( array(
            'post_type' => 'page', 'post_status' => 'publish',
            'post_name' => $page['slug'], 'post_title' => $page['title'],
            'post_excerpt' => $page['excerpt'], 'post_content' => wp_slash( $content ),
        ), true );
        if ( is_wp_error( $id ) ) { return $id; }
        update_post_meta( $id, '_lets_play_source', 'playtt/e4b6ebf5f2bf8bcea676aec438d92136e9909240' );
        $created[ $page['slug'] ] = $id;
    }
    if ( ! get_option( 'page_on_front' ) && isset( $created['home'] ) ) {
        update_option( 'show_on_front', 'page' );
        update_option( 'page_on_front', $created['home'] );
    }
    return $created;
}

add_action( 'admin_menu', function () {
    add_management_page( 'Let’s Play 網站內容', 'Let’s Play 網站內容', 'manage_options', 'lets-play-starter', function () {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        echo '<div class="wrap"><h1>Let’s Play 網站內容</h1><p>新增品牌首頁、課程、教練、據點、關於我們及合作招募頁面。既有同網址頁面不會被覆寫。</p><p>匯入後請在「頁面」編輯內容，並在「外觀 → 編輯器」調整頁首頁尾。課程價格、教練資料與據點資訊請於正式發布前確認。</p>';
        if ( isset( $_GET['imported'] ) ) { echo '<div class="notice notice-success"><p>匯入完成。請到頁面確認內容。</p></div>'; }
        echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
        wp_nonce_field( 'lets_play_import' );
        echo '<input type="hidden" name="action" value="lets_play_import">';
        submit_button( '新增 Let’s Play 品牌頁面' );
        echo '</form></div>';
    } );
} );
add_action( 'admin_post_lets_play_import', function () {
    if ( ! current_user_can( 'manage_options' ) ) { wp_die( '需要管理員權限。', '', array( 'response' => 403 ) ); }
    check_admin_referer( 'lets_play_import' );
    $result = lets_play_import_starter();
    if ( is_wp_error( $result ) ) { wp_die( esc_html( $result->get_error_message() ) ); }
    wp_safe_redirect( admin_url( 'tools.php?page=lets-play-starter&imported=1' ) );
    exit;
} );
