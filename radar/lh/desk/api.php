<?php
declare(strict_types=1);
/** Same-origin JSON API for the LH-hosted PHP Desk; direct isolated MySQL, no public Bearer tokens. */
require_once __DIR__.'/auth.php';
try{amd_boot();}catch(Throwable $e){error_log('ArchitectMentor desk API init: '.get_class($e));amd_reply(503,['ok'=>false,'code'=>'not_configured']);}
if(!amd_auth_valid())amd_reply(401,['ok'=>false,'code'=>'login_required']);
$method=(string)($_SERVER['REQUEST_METHOD']??'');
$action=(string)($_GET['action']??'');
if($method==='GET'&&$action==='items'){
 try{
  $db=amr_db();
  $sql="SELECT i.item_id,i.source_id,i.title,i.original_url,i.published_at_utc,
   i.first_seen_at_utc,i.topic,i.fact_check_status,
   COALESCE(d.decision,'UNREVIEWED') AS decision,
   COALESCE(d.intended_edition,'none') AS intended_edition,
   COALESCE(d.note,'') AS note,COALESCE(d.revision,0) AS revision,d.decided_at_utc
   FROM amr_items i LEFT JOIN amr_decisions d ON d.item_id=i.item_id
   ORDER BY i.first_seen_at_utc DESC LIMIT 100";
  $items=$db->query($sql)->fetchAll();
  $sources=$db->query('SELECT source_id,display_name,rights_gate,enabled FROM amr_sources ORDER BY display_name')->fetchAll();
  $metrics=$db->query("SELECT
    (SELECT COUNT(*) FROM amr_items) AS total_items,
    (SELECT COUNT(*) FROM amr_decisions WHERE decision='SELECTED') AS selected,
    (SELECT MAX(completed_at_utc) FROM amr_cycles WHERE outcome='success') AS last_success_utc")->fetch();
  amd_reply(200,['ok'=>true,'items'=>$items,'sources'=>$sources,'metrics'=>$metrics,'generated_at_utc'=>gmdate('c')]);
 }catch(Throwable $e){
  error_log('ArchitectMentor PHP Desk read: '.get_class($e));
  amd_reply(503,['ok'=>false,'code'=>'read_unavailable_check_migration_002']);
 }
}
if($method!=='POST'||$action!=='decision')amd_reply(405,['ok'=>false,'code'=>'method_not_allowed']);
if(!amd_check_csrf())amd_reply(403,['ok'=>false,'code'=>'csrf_failed']);
$origin=(string)($_SERVER['HTTP_ORIGIN']??'');
if($origin!==''){
 $host=(string)($_SERVER['HTTP_HOST']??'');
 $info=parse_url($origin);
 $originHost=is_array($info)?(string)($info['host']??''):'';
 $originPort=is_array($info)&&isset($info['port'])?':'.$info['port']:'';
 if(!is_array($info)||($info['scheme']??'')!=='https'||$originHost.$originPort!==$host)
  amd_reply(403,['ok'=>false,'code'=>'origin_forbidden']);
}
if(amr_env('AM_DESK_WRITE_ENABLED')!=='1'||amr_env('AM_RADAR_EDITOR_WRITE_ENABLED')!=='1')
 amd_reply(503,['ok'=>false,'code'=>'writes_disabled']);
if(strtolower(trim(explode(';',(string)($_SERVER['CONTENT_TYPE']??''))[0]))!=='application/json')
 amd_reply(415,['ok'=>false,'code'=>'json_required']);
if((int)($_SERVER['CONTENT_LENGTH']??0)>6000)amd_reply(413,['ok'=>false,'code'=>'too_large']);
$raw=file_get_contents('php://input',false,null,0,6001);
if(!is_string($raw)||strlen($raw)>6000)amd_reply(413,['ok'=>false,'code'=>'too_large']);
try{$input=json_decode($raw,true,12,JSON_THROW_ON_ERROR);}
catch(Throwable $e){amd_reply(400,['ok'=>false,'code'=>'invalid_json']);}
if(!is_array($input)||array_is_list($input))amd_reply(400,['ok'=>false,'code'=>'invalid_payload']);
foreach(array_keys($input) as $key){
 if(!in_array($key,['item_id','revision','decision','intended_edition','note'],true))
  amd_reply(400,['ok'=>false,'code'=>'unknown_field']);
}
$id=$input['item_id']??null;$rev=$input['revision']??null;
$decision=$input['decision']??null;$edition=$input['intended_edition']??null;$note=$input['note']??null;
if(!is_string($id)||!preg_match('/^[a-f0-9]{64}$/D',$id))amd_reply(422,['ok'=>false,'code'=>'invalid_item_id']);
if(!is_int($rev)||$rev<0||$rev>1000000)amd_reply(422,['ok'=>false,'code'=>'invalid_revision']);
if(!is_string($decision)||!in_array($decision,['UNREVIEWED','SELECTED','HOLD','REJECTED','REQUEST_RESEARCH'],true))
 amd_reply(422,['ok'=>false,'code'=>'invalid_decision']);
if(!is_string($edition)||!in_array($edition,['none','daily','weekly'],true))
 amd_reply(422,['ok'=>false,'code'=>'invalid_edition']);
if(!is_string($note)||mb_strlen($note)>2000)amd_reply(422,['ok'=>false,'code'=>'invalid_note']);
$note=trim($note);
$label=mb_substr('lh:'.(string)($_SESSION['username']??'operator'),0,100);
$now=gmdate('Y-m-d H:i:s');
try{
 $db=amr_db();$db->beginTransaction();
 $item=$db->prepare('SELECT item_id FROM amr_items WHERE item_id=? FOR UPDATE');
 $item->execute([$id]);
 if(!$item->fetch()){$db->rollBack();amd_reply(404,['ok'=>false,'code'=>'item_not_found']);}
 $current=$db->prepare('SELECT revision FROM amr_decisions WHERE item_id=? FOR UPDATE');
 $current->execute([$id]);$old=$current->fetch();$present=$old?(int)$old['revision']:0;
 if($present!==$rev){$db->rollBack();amd_reply(409,['ok'=>false,'code'=>'revision_conflict','current_revision'=>$present]);}
 $next=$present+1;
 $save=$db->prepare('INSERT INTO amr_decisions
   (item_id,decision,intended_edition,reviewer_label,note,decided_at_utc,revision)
   VALUES (?,?,?,?,?,?,?)
   ON DUPLICATE KEY UPDATE decision=VALUES(decision),intended_edition=VALUES(intended_edition),
   reviewer_label=VALUES(reviewer_label),note=VALUES(note),decided_at_utc=VALUES(decided_at_utc),revision=VALUES(revision)');
 $save->execute([$id,$decision,$edition,$label,$note,$now,$next]);
 $audit=$db->prepare('INSERT INTO amr_decision_audit
   (item_id,revision,saved_at_utc,editor_label,snapshot_json) VALUES (?,?,?,?,?)');
 $audit->execute([$id,$next,$now,$label,json_encode(
  ['decision'=>$decision,'intended_edition'=>$edition,'note'=>$note],
  JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
 $db->commit();
 amd_reply(200,['ok'=>true,'code'=>'saved','item_id'=>$id,'revision'=>$next,'saved_at_utc'=>$now]);
}catch(Throwable $e){
 if(isset($db)&&$db->inTransaction())$db->rollBack();
 error_log('ArchitectMentor PHP Desk save: '.get_class($e));
 amd_reply(503,['ok'=>false,'code'=>'save_unavailable']);
}
