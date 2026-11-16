import net from 'node:net';
import { runCLI } from '@wp-playground/cli';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Playground currently defaults to all interfaces. This development process is loopback-only.
const nativeListen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  if (typeof args[0] === 'number' && typeof args[1] !== 'string') args.splice(1, 0, '127.0.0.1');
  return nativeListen.apply(this, args);
};

export async function boot(port = 9420, options = {}) {
  await mkdir(path.join(root, '.runtime'), { recursive: true });
  return runCLI({
    command:'server', port, php:'8.3', wp:'latest', login:options.login ?? true, quiet:true, workers:2,
    internalCookieStore:false,
    define:{WPLANG:'zh_TW'},
    wordpressInstallMode:'install-from-existing-files-if-needed',
    'mount-before-install':[{hostPath:options.sitePath ?? path.join(root,'.runtime/core/wordpress'),vfsPath:'/wordpress'}],
    mount:options.mountTheme === false ? [] : [{hostPath:path.join(root,'lets-play'),vfsPath:'/wordpress/wp-content/themes/lets-play'}],
    blueprint:{steps: options.seed === false ? [] : [
      {step:'runPHP',code:"<?php require '/wordpress/wp-load.php'; switch_theme('lets-play');"},
      {step:'runPHP',code:`<?php
        require '/wordpress/wp-load.php';
        wp_set_current_user(1);
        update_option('blogname', 'Let’s Play 桌球聯盟');
        update_option('blogdescription', '從喜歡開始，一起玩桌球。');
        update_option('timezone_string', 'Asia/Taipei');
        update_option('WPLANG', 'zh_TW');
        update_option('permalink_structure', '/%postname%/');
        update_option('default_comment_status', 'closed');
        update_option('blog_public', 0);
        $result = lets_play_import_starter();
        if (is_wp_error($result)) { throw new Exception($result->get_error_message()); }
        flush_rewrite_rules(false);
      `}
    ]}
  });
}

export async function php(server, code) {
  const response = await server.playground.run({code:"<?php require '/wordpress/wp-load.php'; " + code});
  const body = typeof response.text === 'string' ? response.text : new TextDecoder().decode(response.bytes);
  if (response.exitCode !== 0) throw new Error(body + '\n' + response.errors);
  return body;
}
