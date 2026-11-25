"""Verify the pinned native permission checks used by the local REST403 reproduction."""
from pathlib import Path
import argparse,datetime as dt,hashlib,json,zipfile
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--runtime',type=Path,required=True);p.add_argument('--output',type=Path,required=True);args=p.parse_args();runtime=args.runtime.resolve()
manifest=json.loads((runtime/'assets/wordpress-runtime-artifact.json').read_text(encoding='utf8'));archive=runtime/'artifacts/cloudflare-wordpress-runtime-corpus.zip';data=archive.read_bytes();sha=lambda b:hashlib.sha256(b).hexdigest();assert sha(data)==manifest['archive']['sha256'];assert len(data)==manifest['archive']['size']
checks={
'wordpress/wp-includes/rest-api/endpoints/class-wp-rest-global-styles-controller.php':['class WP_REST_Global_Styles_Controller extends WP_REST_Posts_Controller',"if ( 'edit' === $request['context'] && $post && ! $this->check_update_permission( $post ) )", "'rest_forbidden_context'"],
'wordpress/wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php':['protected function check_update_permission( $post )',"return current_user_can( 'edit_post', $post->ID );"],
'wordpress/wp-includes/post.php':["'wp_global_styles'", "'edit_posts'             => 'edit_theme_options'", "'edit_others_posts'      => 'edit_theme_options'"]}
proof=[]
with zipfile.ZipFile(archive)as z:
 for path,anchors in checks.items():
  content=z.read(path);entry=next(e for e in manifest['files']if e['path']==path);assert sha(content)==entry['sha256'];assert len(content)==entry['size'];text=content.decode();lines=text.splitlines();refs=[]
  for anchor in anchors:
   assert anchor in text;refs.append({'anchor':anchor,'lines':[i+1 for i,line in enumerate(lines)if anchor in line]})
  proof.append({'path':path,'sha256':sha(content),'bytes':len(content),'checks':refs})
report={'schema':'playtt/rest-route-core-audit/v1','at':dt.datetime.now(dt.timezone.utc).isoformat(),'result':'pass','wordpressVersion':manifest['source']['version'],'runtimeArchiveSha256':sha(data),'files':proof,'observedRoleEvidence':'playtt-rest-route-audit.json; editor role has edit_pages/edit_others_pages but no edit_theme_options','interpretation':'Native global-style edit-context request requires update permission; its denial matches the observed REST403. Do not grant extra capability to suppress this response.','sourceUrl':'https://developer.wordpress.org/reference/classes/wp_rest_global_styles_controller/get_item_permissions_check/','runtimeFilesChanged':False,'networkRequests':0}
args.output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');print(json.dumps({'result':'pass','files':len(proof),'runtimeFilesChanged':False,'networkRequests':0}))
