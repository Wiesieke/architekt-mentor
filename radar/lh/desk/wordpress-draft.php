<?php
declare(strict_types=1);
/** WordPress draft-only adapter. No publish/update/delete API. Called server-side only. */

function amwp_site_url(): ?string {
 $raw=rtrim(amr_env('AM_WP_SITE_URL'),'/');
 if($raw===''||strlen($raw)>250)return null;
 $parsed=parse_url($raw);
 if(!is_array($parsed)||strtolower((string)($parsed['scheme']??''))!=='https'
  ||isset($parsed['user'])||isset($parsed['pass'])||isset($parsed['port'])
  ||isset($parsed['query'])||isset($parsed['fragment']))return null;
 $host=strtolower((string)($parsed['host']??''));
 if(!preg_match('/\A(?=.{4,253}\z)[a-z0-9.-]+\.[a-z]{2,}\z/D',$host)
  ||str_contains($host,'..')||filter_var($host,FILTER_VALIDATE_IP)!==false)return null;
 $path=(string)($parsed['path']??'');
 if($path!==''&&!preg_match('#\A/[a-zA-Z0-9_/-]*\z/D#',$path))return null;
 return $raw;
}
function amwp_ready(): bool {
 return amr_env('AM_WP_DRAFT_ENABLED')==='1'
  &&amr_env('AM_DESK_WRITE_ENABLED')==='1'
  &&amr_env('AM_RADAR_EDITOR_WRITE_ENABLED')==='1'
  &&amwp_site_url()!==null
  &&amr_env('AM_WP_USERNAME')!==''
  &&amr_env('AM_WP_APPLICATION_PASSWORD')!==''
  &&function_exists('curl_init');
}
function amwp_edit_url(int $postId): ?string {
 $site=amwp_site_url();
 if($site===null||$postId<1)return null;
 return $site.'/wp-admin/post.php?post='.$postId.'&action=edit';
}
function amwp_esc(string $value): string {
 return htmlspecialchars($value,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
}
function amwp_inline(string $value): string {
 $escaped=amwp_esc($value);
 $result=preg_replace('/\*\*([^*]{1,500})\*\*/u','<strong>$1</strong>',$escaped);
 return is_string($result)?$result:$escaped;
}
/** Restrictive Markdown subset: headings become h2-h4; all author text is escaped. */
function amwp_body_html(string $text): string {
 $paragraph=[];$result=[];$list='';
 $flush=static function()use(&$paragraph,&$result): void {
  if($paragraph!==[]) {
   $result[]='<p>'.amwp_inline(implode(' ',$paragraph)).'</p>';
   $paragraph=[];
  }
 };
 $close=static function()use(&$list,&$result): void {
  if($list!==''){$result[]='</'.$list.'>';$list='';}
 };
 foreach(explode("\n",str_replace(["\r\n","\r"],"\n",$text))as $line) {
  $value=trim($line);
  if($value===''){$flush();$close();continue;}
  if(preg_match('/\A(#{1,3})\s+(.+)\z/u',$value,$m)) {
   $flush();$close();$tag='h'.(strlen($m[1])+1);
   $result[]='<'.$tag.'>'.amwp_inline($m[2]).'</'.$tag.'>';continue;
  }
  if(preg_match('/\A(?:[-*]|\d+[.)])\s+(.+)\z/u',$value,$m)) {
   $flush();
   $type=preg_match('/\A\d+[.)]/',$value)===1?'ol':'ul';
   if($list!==$type){$close();$result[]='<'.$type.'>';$list=$type;}
   $result[]='<li>'.amwp_inline($m[1]).'</li>';continue;
  }
  $close();$paragraph[]=$value;
 }
 $flush();$close();
 return implode("\n",$result);
}
function amwp_content_html(array $draft): string {
 $html='<p><strong>'.amwp_esc((string)$draft['lead_text']).'</strong></p>'."\n";
 $html.=amwp_body_html((string)$draft['body_text']);
 $source=(string)$draft['original_url'];
 $parts=parse_url($source);
 if(is_array($parts)&&strtolower((string)($parts['scheme']??''))==='https'
  &&($parts['host']??'')!==''&&!isset($parts['user'])&&!isset($parts['pass'])) {
  $html.="\n".'<p>Źródło pierwotne: <a href="'.amwp_esc($source).'">materiał źródłowy</a></p>';
 }
 return $html;
}
/** Returns a verified ID only for HTTP 201 + status=draft; any ambiguity is UNKNOWN. */
function amwp_create_draft(array $draft): ?int {
 $site=amwp_site_url();
 if($site===null||!function_exists('curl_init'))return null;
 $payload=json_encode([
  'status'=>'draft', // HARD-CODED. Never accept publish/private/future from the client.
  'title'=>(string)$draft['title'],
  'content'=>amwp_content_html($draft),
  'excerpt'=>(string)$draft['lead_text'],
  'comment_status'=>'closed',
  'ping_status'=>'closed',
 ],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
 $ch=curl_init($site.'/wp-json/wp/v2/posts');
 if($ch===false)return null;
 $response='';$maxBytes=300000;
 try {
  curl_setopt_array($ch,[
   CURLOPT_POST=>true,
   CURLOPT_POSTFIELDS=>$payload,
   CURLOPT_HTTPHEADER=>['Content-Type: application/json; charset=utf-8','Accept: application/json'],
   CURLOPT_HTTPAUTH=>CURLAUTH_BASIC,
   CURLOPT_USERPWD=>amr_env('AM_WP_USERNAME').':'.amr_env('AM_WP_APPLICATION_PASSWORD'),
   CURLOPT_FOLLOWLOCATION=>false,
   CURLOPT_CONNECTTIMEOUT=>5,
   CURLOPT_TIMEOUT=>20,
   CURLOPT_SSL_VERIFYPEER=>true,
   CURLOPT_SSL_VERIFYHOST=>2,
   CURLOPT_WRITEFUNCTION=>static function($handle,string $chunk)use(&$response,$maxBytes): int {
    if(strlen($response)+strlen($chunk)>$maxBytes)return 0;
    $response.=$chunk;return strlen($chunk);
   },
  ]);
  if(defined('CURLOPT_PROTOCOLS'))curl_setopt($ch,CURLOPT_PROTOCOLS,CURLPROTO_HTTPS);
  $success=curl_exec($ch);$http=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);
  if($success!==true||$http!==201)return null;
  $data=json_decode($response,true,10);
  if(!is_array($data)||($data['status']??null)!=='draft')return null;
  $id=$data['id']??null;
  return is_int($id)&&$id>0?$id:null;
 }finally{curl_close($ch);}
}
