from pathlib import Path
import argparse,hashlib,json,zipfile
p=argparse.ArgumentParser();p.add_argument('--local',action='store_true',required=True);p.add_argument('--check',action='store_true');args=p.parse_args()
sha=lambda b:hashlib.sha256(b).hexdigest();rt=Path.cwd()
manifest=json.loads((rt/'assets/wordpress-runtime-artifact.json').read_text(encoding='utf-8'))
archive=rt/'artifacts/cloudflare-wordpress-runtime-corpus.zip';assert sha(archive.read_bytes())==manifest['archive']['sha256']
with zipfile.ZipFile(archive)as z:
 dispatch=z.read('wordpress/wp-admin/admin-ajax.php');handler=z.read('wordpress/wp-admin/includes/ajax-actions.php')
d=dispatch.decode();h=handler.decode();body=h[h.index('function wp_ajax_wp_remove_post_lock()'):];body=body[:body.index('\n}\n')+3]
assert "'wp-remove-post-lock'" in d and "add_action( 'wp_ajax_nopriv_heartbeat', 'wp_ajax_nopriv_heartbeat', 1 );" in d
assert 'wp_ajax_nopriv_wp_remove_post_lock' not in d and 'wp_ajax_nopriv_wp-remove-post-lock' not in d
assert 'if ( is_user_logged_in() )' in d and 'if ( ! has_action( "wp_ajax_nopriv_{$action}" ) )' in d and "wp_die( '0', 400 );" in d
assert "check_ajax_referer( 'update-post_' . $post_id );" in body and "current_user_can( 'edit_post', $post_id )" in body and "update_post_meta( $post_id, '_edit_lock'" in body and 'wp_die( 1 );' in body
static=json.loads((rt/'assets/wordpress-static-artifact.json').read_text(encoding='utf-8'));entry=next(e for e in static['files']if e['path']=='wordpress/wp-includes/js/dist/editor.js')
with (rt/'artifacts/cloudflare-wordpress-static-corpus.bin').open('rb')as f:f.seek(entry['offset']);client=f.read(entry['size'])
assert sha(client)==entry['sha256'];c=client.decode();n=c.index('function releasePostLock()');release=c[n:c.index('}, []);',n)]
for needle in ['new window.FormData()', 'data.append("action", "wp-remove-post-lock")','window.navigator.sendBeacon(postLockUtils.ajaxUrl, data)','window.addEventListener("beforeunload", releasePostLock)']:assert needle in release
report={'schema':'playtt/ajax-source-audit/v1','result':'pass','archiveSha256':manifest['archive']['sha256'],'dispatch':{'path':'wordpress/wp-admin/admin-ajax.php','sha256':sha(dispatch),'loggedOutUnregisteredActionStatus':400,'loggedOutUnregisteredActionBody':'0','heartbeatNoprivRegistered':True,'unlockNoprivRegisteredInCoreDispatcher':False},'unlockHandler':{'path':'wordpress/wp-admin/includes/ajax-actions.php','sha256':sha(handler),'nonceAndEditPermissionRequired':True,'changesOwnedEditLock':True,'successBody':'1'},'client':{'path':entry['path'],'sha256':entry['sha256'],'formDataUnlockAction':True,'beforeUnloadSendBeacon':True},'scope':'Pinned core source plus separately recorded actual controls; source alone cannot classify an old request lacking action/auth evidence.','cloudRequests':0}
out=rt/'artifacts/playtt-ajax-source-audit.json';text=json.dumps(report,indent=2)+'\n'
if args.check:assert out.read_bytes()==text.encode()
else:
 assert not out.exists();out.write_bytes(text.encode())
print(json.dumps({'result':'pass','coreAnonymousUnlockRegistered':False,'coreHeartbeatRegistered':True,'clientFormDataUnlock':True,'readOnlyCheck':args.check}))
