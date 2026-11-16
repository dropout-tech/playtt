<?php
/** Let’s Play block theme. Content is stored in ordinary WordPress pages. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'after_setup_theme', function () {
    add_theme_support( 'editor-styles' );
    add_editor_style( 'style.css' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'responsive-embeds' );
} );
add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style( 'lets-play', get_stylesheet_uri(), array(), wp_get_theme()->get( 'Version' ) );
    wp_enqueue_script( 'lets-play-legacy-links', get_theme_file_uri( 'assets/legacy-links.js' ), array(), wp_get_theme()->get( 'Version' ), false );
    wp_add_inline_script( 'lets-play-legacy-links', 'window.letsPlayBase=' . wp_json_encode( home_url( '/' ) ) . ';', 'before' );
} );
add_action( 'init', function () {
    register_block_pattern_category( 'lets-play', array( 'label' => 'Let’s Play 品牌版型' ) );
} );

// Reserve image space before download without changing saved block markup.
// This also fixes previously imported pages when only the theme is updated.
add_filter( 'render_block_core/image', function ( $html, $block ) {
    static $dimensions = null;
    if ( null === $dimensions ) {
        $dimensions = array();
        foreach ( glob( get_theme_file_path( 'assets/images/*.webp' ) ) as $file ) {
            $size = wp_getimagesize( $file );
            if ( $size ) { $dimensions[ get_theme_file_uri( 'assets/images/' . basename( $file ) ) ] = array( $size[0], $size[1] ); }
        }
        foreach ( get_posts( array( 'post_type' => 'attachment', 'post_status' => 'inherit', 'posts_per_page' => -1, 'meta_key' => '_lets_play_asset' ) ) as $attachment ) {
            $metadata = wp_get_attachment_metadata( $attachment->ID );
            if ( ! empty( $metadata['width'] ) && ! empty( $metadata['height'] ) ) {
                $dimensions[ wp_get_attachment_url( $attachment->ID ) ] = array( $metadata['width'], $metadata['height'] );
            }
        }
    }
    $processor = new WP_HTML_Tag_Processor( $html );
    while ( $processor->next_tag( 'IMG' ) ) {
        $src = $processor->get_attribute( 'src' );
        if ( isset( $dimensions[ $src ] ) && ! $processor->get_attribute( 'width' ) && ! $processor->get_attribute( 'height' ) ) {
            $processor->set_attribute( 'width', (int) $dimensions[ $src ][0] );
            $processor->set_attribute( 'height', (int) $dimensions[ $src ][1] );
        }
        if ( in_array( $block['attrs']['className'] ?? '', array( 'lp-brand-desktop', 'lp-brand-mobile' ), true ) ) {
            $processor->set_attribute( 'loading', 'eager' );
            $processor->set_attribute( 'fetchpriority', 'high' );
        }
    }
    return $processor->get_updated_html();
}, 20, 2 );

// Keep core canonical output and sitemap. Provide defaults only when no SEO plugin owns them.
add_action( 'wp_head', function () {
    if ( defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || defined( 'AIOSEO_VERSION' ) || is_404() || ! is_singular() ) { return; }
    $description = get_the_excerpt();
    if ( ! $description ) { $description = get_bloginfo( 'description' ); }
    $description = wp_strip_all_tags( $description );
    echo '<meta name="description" content="' . esc_attr( $description ) . '">' . "\n";
    echo '<meta property="og:title" content="' . esc_attr( wp_get_document_title() ) . '">' . "\n";
    echo '<meta property="og:description" content="' . esc_attr( $description ) . '">' . "\n";
    echo '<meta property="og:url" content="' . esc_url( get_permalink() ) . '">' . "\n";
    echo '<meta property="og:type" content="website">' . "\n";
    echo '<meta property="og:locale" content="zh_TW">' . "\n";
    echo '<meta property="og:image" content="' . esc_url( get_theme_file_uri( 'assets/images/share.jpg' ) ) . '">' . "\n";
    $schema = array( '@context' => 'https://schema.org', '@type' => 'WebSite', 'name' => get_bloginfo( 'name' ), 'url' => home_url( '/' ), 'inLanguage' => 'zh-TW' );
    echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP ) . '</script>' . "\n";
} );

require_once get_theme_file_path( 'inc/starter.php' );
