<?php
declare(strict_types=1);
/** Single-operator LH.pl authentication: password + TOTP + server sessions. */
require_once __DIR__.'/totp.php';

function amd_private_dir(): string {
 $env=getenv('AM_RADAR_PRIVATE_DIR');
 $path=is_string($env)&&trim($env)!==''?trim($env):dirname(__DIR__,3).'/architectmentor-radar-private';
 $real=realpath($path);
 if($real===false||!is_dir($real))throw new RuntimeException('Private radar directory missing');
 $doc=realpath((string)($_SERVER['DOCUMENT_ROOT']??''));
 if($doc!==false&&str_starts_with($real.DIRECTORY_SEPARATOR,$doc.DIRECTORY_SEPARATOR))
  throw new RuntimeException('Private directory must be outside web root');
 return $real;
}
function amd_boot(): void {
 if(PHP_SAPI!=='cli'){
  $ssl=in_array(strtolower((string)($_SERVER['HTTPS']??'')),['on','1'],true)||(int)($_SERVER['SERVER_PORT']??0)===443;
  if(!$ssl){http_response_code(403);exit('HTTPS required');}
  header('Cache-Control: no-store, private, max-age=0');
  header('Pragma: no-cache');
  header('X-Content-Type-Options: nosniff');
  header('Referrer-Policy: no-referrer');
  header('X-Frame-Options: DENY');
  header("Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
  header('Strict-Transport-Security: max-age=31536000');
  session_name('AM_DESK_SESSION');
  ini_set('session.use_strict_mode','1');
  ini_set('session.use_only_cookies','1');
  ini_set('session.use_trans_sid','0');
  ini_set('session.gc_maxlifetime','28800');
  $path=rtrim(str_replace('\\','/',dirname((string)($_SERVER['SCRIPT_NAME']??'/'))),'/');
  session_set_cookie_params(['lifetime'=>0,'path'=>$path===''?'/':$path.'/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
  if(session_start()!==true)throw new RuntimeException('Session unavailable');
 }
 $file=amd_private_dir().'/radar.php';
 if(!is_file($file))throw new RuntimeException('Radar private library missing');
 require_once $file;
}
function amd_auth_path(): string {return amd_private_dir().'/architect-desk-auth.json';}
function amd_setup_token(): string {return amr_env('AM_DESK_SETUP_TOKEN');}
function amd_ready(): bool {return is_file(amd_auth_path());}
function amd_state(): ?array {
 $path=amd_auth_path();
 if(!is_file($path))return null;
 $fp=@fopen($path,'rb');if($fp===false)throw new RuntimeException('Credential store unreadable');
 try {
  if(!flock($fp,LOCK_SH))throw new RuntimeException('Credential store lock failed');
  $raw=stream_get_contents($fp,10000);
  flock($fp,LOCK_UN);
 }finally{fclose($fp);}
 $value=is_string($raw)?json_decode($raw,true):null;
 if(!is_array($value)||!isset($value['username'],$value['password_hash'],$value['totp_secret'],$value['verified']))
  throw new RuntimeException('Credential store corrupt');
 return $value;
}
function amd_create_state(array $state): void {
 $path=amd_auth_path();
 $old=umask(0077);$fp=@fopen($path,'x');umask($old);
 if($fp===false)throw new RuntimeException('Credentials already initialized or directory unwritable');
 try{
  @chmod($path,0600);
  $raw=json_encode($state,JSON_THROW_ON_ERROR);
  if(fwrite($fp,$raw)!==strlen($raw)||!fflush($fp))throw new RuntimeException('Could not save credentials');
 }finally{fclose($fp);}
}
function amd_update_state(callable $mutate): bool {
 $fp=@fopen(amd_auth_path(),'c+');if($fp===false)return false;
 try{
  if(!flock($fp,LOCK_EX))return false;
  $raw=stream_get_contents($fp,10000);
  $state=is_string($raw)?json_decode($raw,true):null;
  if(!is_array($state))return false;
  $next=$mutate($state);
  if(!is_array($next))return false;
  $out=json_encode($next,JSON_THROW_ON_ERROR);
  rewind($fp);if(!ftruncate($fp,0))return false;
  if(fwrite($fp,$out)!==strlen($out)||!fflush($fp))return false;
  @chmod(amd_auth_path(),0600);
  return true;
 }finally{flock($fp,LOCK_UN);fclose($fp);}
}
function amd_auth_valid(): bool {
 if(($_SESSION['authenticated']??false)!==true)return false;
 $now=time();$issued=(int)($_SESSION['issued']??0);$last=(int)($_SESSION['last']??0);
 if($issued<1||$last<1||$now-$last>1800||$now-$issued>28800){
  unset($_SESSION['authenticated'],$_SESSION['username'],$_SESSION['issued'],$_SESSION['last']);return false;
 }
 $_SESSION['last']=$now;
 return true;
}
function amd_set_login(string $username): void {
 session_regenerate_id(true);
 $_SESSION['authenticated']=true;
 $_SESSION['username']=$username;
 $_SESSION['issued']=time();
 $_SESSION['last']=time();
 $_SESSION['csrf']=bin2hex(random_bytes(32));
}
function amd_logout(): void {
 $_SESSION=[];
 if(ini_get('session.use_cookies')){
  $p=session_get_cookie_params();
  setcookie(session_name(),'', ['expires'=>time()-3600,'path'=>$p['path'],'secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
 }
 session_destroy();
}
function amd_csrf(): string {
 if(!is_string($_SESSION['csrf']??null)||strlen($_SESSION['csrf'])!==64)
  $_SESSION['csrf']=bin2hex(random_bytes(32));
 return $_SESSION['csrf'];
}
function amd_check_csrf(): bool {
 $candidate=(string)($_SERVER['HTTP_X_CSRF_TOKEN']??$_POST['csrf']??'');
 return strlen($candidate)===64&&hash_equals(amd_csrf(),$candidate);
}
function amd_rate(string $action): bool {
 $secret=amd_setup_token();
 if(strlen($secret)<32)return false;
 $ip=(string)($_SERVER['REMOTE_ADDR']??'no-ip');
 $key=hash_hmac('sha256',$ip,$secret);
 $path=amd_private_dir().'/architect-desk-attempts.json';
 $old=umask(0077);$fp=@fopen($path,'c+');umask($old);
 if($fp===false)return false;
 try{
  @chmod($path,0600);
  if(!flock($fp,LOCK_EX))return false;
  $raw=stream_get_contents($fp,100000);
  $data=is_string($raw)?json_decode($raw,true):null;
  if(!is_array($data))$data=[];
  $now=time();
  foreach($data as $k=>$times){
   if(!is_array($times)){unset($data[$k]);continue;}
   $recent=array_values(array_filter($times,static fn($t)=>is_int($t)&&$t>$now-1800));
   if($recent)$data[$k]=$recent;else unset($data[$k]);
  }
  $hits=$data[$key]??[];
  $allowed=count($hits)<8;
  if($action==='fail')$data[$key]=array_slice([...$hits,$now],-30);
  if($action==='reset')unset($data[$key]);
  $out=json_encode($data,JSON_THROW_ON_ERROR);
  rewind($fp);
  if(!ftruncate($fp,0))return false;
  if(fwrite($fp,$out)!==strlen($out)||!fflush($fp))return false;
  return $action==='check'?$allowed:true;
 }finally{flock($fp,LOCK_UN);fclose($fp);}
}
function amd_consume_totp(int $step,bool $finalize=false): bool {
 return amd_update_state(static function(array $state)use($step,$finalize): ?array {
  if($step<=(int)($state['last_step']??-1))return null;
  if(!$finalize&&!($state['verified']??false))return null;
  $state['last_step']=$step;
  if($finalize)$state['verified']=true;
  return $state;
 });
}
function amd_esc(?string $text): string {return htmlspecialchars($text??'',ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function amd_reply(int $status,array $data): never {
 http_response_code($status);
 header('Content-Type: application/json; charset=utf-8');
 echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
 exit;
}
