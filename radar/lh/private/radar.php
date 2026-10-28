<?php
declare(strict_types=1);
/** ArchitectMentor Radar PRIVATE library; no dependency on WRYCUT. PHP >=8.0. */
function amr_env(string $key): string {
 $v=getenv($key);
 if(is_string($v)&&trim($v)!=='')return trim($v);
 static $cfg=null;
 if($cfg===null){
  $path=__DIR__.'/config.private.php';
  $read=is_file($path)?require $path:[];
  $cfg=is_array($read)?$read:[];
 }
 $v=$cfg[$key]??'';
 return is_string($v)?trim($v):'';
}
function amr_now(): string { return gmdate('Y-m-d H:i:s'); }
function amr_db(): PDO {
 $name=amr_env('AM_RADAR_DB_NAME');
 $expected=amr_env('AM_RADAR_EXPECTED_DB_NAME');
 $user=amr_env('AM_RADAR_DB_USER');
 $password=amr_env('AM_RADAR_DB_PASSWORD');
 if($name===''||$expected===''||$name!==$expected||$user===''||$password===''||stripos($name,'wrycut')!==false)
  throw new RuntimeException('ArchitectMentor radar database isolation/configuration guard failed');
 $host=amr_env('AM_RADAR_DB_HOST')?:'localhost';
 $db=new PDO('mysql:host='.$host.';dbname='.$name.';charset=utf8mb4',$user,$password,
  [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
   PDO::ATTR_EMULATE_PREPARES=>false,PDO::ATTR_TIMEOUT=>8]);
 $db->exec("SET time_zone = '+00:00'");
 if((string)$db->query('SELECT DATABASE()')->fetchColumn()!==$expected)
  throw new RuntimeException('Wrong selected database');
 return $db;
}
function amr_sources(): array { return require __DIR__.'/sources.php'; }
function amr_seed(PDO $db,array $sources): void {
 $now=amr_now();
 $stmt=$db->prepare("INSERT INTO amr_sources (source_id,display_name,feed_url,rights_gate,enabled,created_at_utc,updated_at_utc) VALUES (?,?,?,'needs_review',0,?,?) ON DUPLICATE KEY UPDATE display_name=VALUES(display_name),updated_at_utc=VALUES(updated_at_utc)");
 foreach($sources as $id=>$src)$stmt->execute([$id,$src['name'],$src['url'],$now,$now]);
}
function amr_fetch(array $source): string {
 if(!extension_loaded('curl'))throw new RuntimeException('cURL unavailable');
 $url=$source['url'];$p=parse_url($url);
 if(!is_array($p)||($p['scheme']??'')!=='https'||($p['host']??'')!==$source['host']||isset($p['user'])||isset($p['pass']))
  throw new RuntimeException('Unapproved feed origin');
 $ch=curl_init($url);
 curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,
  CURLOPT_CONNECTTIMEOUT=>6,CURLOPT_TIMEOUT=>18,CURLOPT_MAXREDIRS=>0,
  CURLOPT_USERAGENT=>'ArchitectMentor-Radar/0.1 (+https://ejsymont.com)',
  CURLOPT_HTTPHEADER=>['Accept: application/rss+xml, application/atom+xml, application/xml'],
  CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);
 $raw=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
 if(!is_string($raw)||$status!==200||strlen($raw)>1200000)throw new RuntimeException('RSS fetch failed, status or size limit');
 return $raw;
}
function amr_link(string $value,string $sourceHost): ?string {
 $url=trim($value);$p=parse_url($url);
 if(!is_array($p)||($p['scheme']??'')!=='https'||empty($p['host'])||isset($p['user'])||isset($p['pass'])||isset($p['port'])||strlen($url)>2048)return null;
 $host=strtolower($p['host']);$source=strtolower($sourceHost);
 // Metadata item links may stay only on the exact pre-approved official host.
 return $host===$source?$url:null;
}
function amr_parse(string $raw,array $source): array {
 if(!extension_loaded('simplexml'))throw new RuntimeException('SimpleXML unavailable');
 $xml=simplexml_load_string($raw,'SimpleXMLElement',LIBXML_NONET|LIBXML_NOERROR|LIBXML_NOWARNING);
 if($xml===false)throw new RuntimeException('RSS/Atom parse failed');
 $isRss=isset($xml->channel->item);$entries=$isRss?$xml->channel->item:$xml->entry;
 $out=[];
 foreach($entries as $entry){
  $link='';
  if(isset($entry->link['href']))$link=(string)$entry->link['href'];
  if($link==='')$link=(string)($entry->link??'');
  $url=amr_link($link,$source['host']);
  $title=trim(strip_tags((string)($entry->title??'')));
  $published=(string)($entry->pubDate??$entry->updated??$entry->published??'');
  if(!$url||$title==='')continue;
  $when=null;
  if($published!==''){
   try{$when=(new DateTimeImmutable($published))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');}
   catch(Throwable $ignored){}
  }
  $out[]=['url'=>$url,'title'=>mb_substr($title,0,500),'published'=>$when];
  if(count($out)>=40)break;
 }
 return $out;
}
function amr_ingest(PDO $db,string $sourceId,array $source,array $items): array {
 $created=0;$now=amr_now();
 $db->beginTransaction();
 try{
  $insert=$db->prepare('INSERT IGNORE INTO amr_items (item_id,source_id,title,original_url,published_at_utc,first_seen_at_utc,last_seen_at_utc,topic,fact_check_status) VALUES (?,?,?,?,?,?,?,?,"unverified")');
  $touch=$db->prepare('UPDATE amr_items SET last_seen_at_utc=? WHERE item_id=?');
  foreach($items as $item){
   $id=hash('sha256','ArchitectMentor|'.$sourceId.'|'.hash('sha256',$item['url']));
   $insert->execute([$id,$sourceId,$item['title'],$item['url'],$item['published'],$now,$now,$source['topic']]);
   $created+=$insert->rowCount();
   $touch->execute([$now,$id]);
  }
  $db->commit();
  return ['seen'=>count($items),'new'=>$created];
 }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
}
