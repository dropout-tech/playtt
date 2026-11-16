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
    wp_enqueue_script( 'lets-play-legacy-links', get_theme_file_uri( 'assets/legacy-links.js' ), array(), '0.1.0', false );
    wp_add_inline_script( 'lets-play-legacy-links', 'window.letsPlayBase=' . wp_json_encode( home_url( '/' ) ) . ';', 'before' );
} );
add_action( 'init', function () {
    register_block_pattern_category( 'lets-play', array( 'label' => 'Let’s Play 品牌版型' ) );
} );

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
