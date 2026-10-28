<?php
declare(strict_types=1);
/** Authenticated, read-only ArchitectMentor Desk API. No cross-database access. */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
function amr_read_reply(int $status, array $data): void {
 http_response_code($status);
 echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
 exit;
}
if(($_SERVER['REQUEST_METHOD']??'')!=='GET')amr_read_reply(405,['ok'=>false,'code'=>'method_not_allowed']);
$private=getenv('AM_RADAR_PRIVATE_DIR');
if(!is_string($private)||trim($private)===''){
 // When installed directly under ~/public_html/mentor-api.sensinte.com/architect-radar-api/
 // go up to ~/; private files live at ~/architectmentor-radar-private.
 $private=dirname(__DIR__,3).'/architectmentor-radar-private';
}
$file=rtrim($private,'/').'/radar.php';
if(!is_file($file))amr_read_reply(503,['ok'=>false,'code'=>'not_configured']);
require $file;
$token=amr_env('AM_RADAR_API_TOKEN');
$header=(string)($_SERVER['HTTP_AUTHORIZATION']??'');
if(strlen($token)<32||!hash_equals('Bearer '.$token,$header))
 amr_read_reply(401,['ok'=>false,'code'=>'unauthorized']);
try{
 $db=amr_db();
 $limit=min(100,max(1,(int)($_GET['limit']??50)));
 $sql='SELECT i.item_id,i.source_id,i.title,i.original_url,i.published_at_utc,
 i.first_seen_at_utc,i.topic,i.fact_check_status,
 COALESCE(d.decision,\'UNREVIEWED\') AS decision,
 COALESCE(d.intended_edition,\'none\') AS intended_edition,
 COALESCE(d.note,\'\') AS note,
 COALESCE(d.revision,0) AS revision,d.decided_at_utc
 FROM amr_items i LEFT JOIN amr_decisions d ON d.item_id=i.item_id
 ORDER BY i.first_seen_at_utc DESC LIMIT '.$limit;
 $items=$db->query($sql)->fetchAll();
 $sources=$db->query('SELECT source_id,display_name,rights_gate,enabled FROM amr_sources ORDER BY display_name')->fetchAll();
 $metrics=$db->query('SELECT (SELECT COUNT(*) FROM amr_items) AS total_items,
 (SELECT COUNT(*) FROM amr_decisions WHERE decision=\'SELECTED\') AS selected,
 (SELECT MAX(completed_at_utc) FROM amr_cycles WHERE outcome=\'success\') AS last_success_utc')->fetch();
 amr_read_reply(200,['ok'=>true,'mode'=>'live','generated_at_utc'=>gmdate('c'),
  'metrics'=>$metrics,'sources'=>$sources,'items'=>$items]);
}catch(Throwable $e){
 error_log('ArchitectMentor editorial read: '.get_class($e));
 amr_read_reply(503,['ok'=>false,'code'=>'read_unavailable']);
}
