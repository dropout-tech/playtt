<?php
/**
 * Title: 品牌頁首
 * Slug: lets-play/header
 * Categories: lets-play
 * Inserter: no
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<!-- wp:group {"className":"lp-header","layout":{"type":"default"}} -->
<div class="wp-block-group lp-header"><!-- wp:group {"className":"lp-shell lp-header-row","layout":{"type":"default"}} -->
<div class="wp-block-group lp-shell lp-header-row"><!-- wp:image {"sizeSlug":"full","linkDestination":"custom","className":"lp-logo"} -->
<figure class="wp-block-image size-full lp-logo"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/brand-logo.svg' ) ); ?>" alt="Let’s Play 桌球聯盟首頁"/></a></figure>
<!-- /wp:image -->
<!-- wp:navigation {"overlayMenu":"mobile","ariaLabel":"主要導覽","layout":{"type":"flex","justifyContent":"right"}} -->
<!-- wp:navigation-link {"label":"關於我們","url":"<?php echo esc_url( home_url( '/about/' ) ); ?>","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"課程資訊","url":"<?php echo esc_url( home_url( '/class/' ) ); ?>","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"教練團隊","url":"<?php echo esc_url( home_url( '/coaches/' ) ); ?>","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"據點","url":"<?php echo esc_url( home_url( '/locations/' ) ); ?>","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"合作招募","url":"<?php echo esc_url( home_url( '/partner/' ) ); ?>","kind":"custom"} /-->

<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
