<?php
/**
 * Plugin Name: Let’s Play 繁體中文初始化
 * Description: 安裝已核對的 WordPress 7.1.4 官方繁體中文語言檔。完成後可移除此工具，語言檔會保留。
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) { exit; }
register_activation_hook(__FILE__, function () {
    global $wp_version;
    if ($wp_version !== '7.1.4') { wp_die('此初始化工具僅適用已驗證的 WordPress 7.1.4。'); }
    $manifest = json_decode(file_get_contents(__DIR__ . '/manifest.json'), true, 512, JSON_THROW_ON_ERROR);
    if (!wp_mkdir_p(WP_LANG_DIR)) { wp_die('無法建立語言檔目錄。'); }
    foreach ($manifest as $name => $hash) {
        if (basename($name) !== $name || strpos($name, '..') !== false || strpos($name, 'zh_TW') === false) { wp_die('語言檔名稱不符。'); }
        $source = __DIR__ . '/package/' . $name;
        if (!hash_equals($hash, hash_file('sha256', $source))) { wp_die('語言檔完整性檢查失敗。'); }
    }
    foreach ($manifest as $name => $hash) {
        if (!copy(__DIR__ . '/package/' . $name, WP_LANG_DIR . '/' . $name)) { wp_die('語言檔複製失敗。'); }
    }
    update_option('WPLANG', 'zh_TW');
    update_user_meta(get_current_user_id(), 'locale', 'zh_TW');
});
