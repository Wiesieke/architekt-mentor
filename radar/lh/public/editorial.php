<?php
declare(strict_types=1);
/** Authenticated manual ArchitectMentor decision API. Never publishes. */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
function amr_edit_reply(int $status,string $code,array $more=[]): void {
 http_response_code($status);
 echo json_encode(['ok'=>$status<400,'code'=>$code]+$more,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
 exit;
}
if(($_SERVER['REQUEST_METHOD']??'')!=='POST')amr_edit_reply(405,'method_not_allowed');
$private=getenv('AM_RADAR_PRIVATE_DIR');
if(!is_string($private)||trim($private)==='')
 $private=dirname(__DIR__,3).'/architectmentor-radar-private';
$file=rtrim($private,'/').'/radar.php';
if(!is_file($file))amr_edit_reply(503,'not_configured');
require $file;
if(amr_env('AM_RADAR_EDITOR_WRITE_ENABLED')!=='1')amr_edit_reply(503,'writes_disabled');
$token=amr_env('AM_RADAR_EDITOR_API_TOKEN');
$header=(string)($_SERVER['HTTP_AUTHORIZATION']??'');
if(strlen($token)<32||!hash_equals('Bearer '.$token,$header))
 amr_edit_reply(401,'unauthorized');
if(strtolower(trim(explode(';',(string)($_SERVER['CONTENT_TYPE']??''))[0]))!=='application/json')
 amr_edit_reply(415,'json_required');
if((int)($_SERVER['CONTENT_LENGTH']??0)>6000)amr_edit_reply(413,'too_large');
$raw=file_get_contents('php://input',false,null,0,6001);
if(!is_string($raw)||strlen($raw)>6000)amr_edit_reply(413,'too_large');
try{$input=json_decode($raw,true,12,JSON_THROW_ON_ERROR);}
catch(Throwable $e){amr_edit_reply(400,'invalid_json');}
if(!is_array($input)||array_is_list($input))amr_edit_reply(400,'invalid_payload');
foreach(array_keys($input) as $key){
 if(!in_array($key,['item_id','revision','decision','intended_edition','note'],true))
  amr_edit_reply(400,'unknown_field');
}
$id=$input['item_id']??null;$rev=$input['revision']??null;
$decision=$input['decision']??null;$edition=$input['intended_edition']??null;
$note=$input['note']??null;
if(!is_string($id)||!preg_match('/^[a-f0-9]{64}$/D',$id))amr_edit_reply(422,'invalid_item_id');
if(!is_int($rev)||$rev<0||$rev>1000000)amr_edit_reply(422,'invalid_revision');
if(!is_string($decision)||!in_array($decision,['UNREVIEWED','SELECTED','HOLD','REJECTED','REQUEST_RESEARCH'],true))
 amr_edit_reply(422,'invalid_decision');
if(!is_string($edition)||!in_array($edition,['none','daily','weekly'],true))
 amr_edit_reply(422,'invalid_edition');
if(!is_string($note)||mb_strlen($note)>2000)amr_edit_reply(422,'invalid_note');
$note=trim($note);
$editor=amr_env('AM_RADAR_EDITOR_LABEL')?:'ArchitectMentor editorial operator';
// Bearer-authenticated proxy supplies the actual Clerk user ID; no browser-supplied label.
$actor=(string)($_SERVER['HTTP_X_EDITORIAL_ACTOR']??'');
if(preg_match('/^user_[A-Za-z0-9]{10,64}$/D',$actor))$editor=$actor;
$editor=mb_substr($editor,0,100);$now=gmdate('Y-m-d H:i:s');
try{
 $db=amr_db();$db->beginTransaction();
 // Lock the parent even for a first-time decision (no decision row exists yet).
 $item=$db->prepare('SELECT item_id FROM amr_items WHERE item_id=? FOR UPDATE');
 $item->execute([$id]);
 if(!$item->fetch()){$db->rollBack();amr_edit_reply(404,'item_not_found');}
 $current=$db->prepare('SELECT revision FROM amr_decisions WHERE item_id=? FOR UPDATE');
 $current->execute([$id]);$old=$current->fetch();$present=$old?(int)$old['revision']:0;
 if($present!==$rev){$db->rollBack();amr_edit_reply(409,'revision_conflict',['current_revision'=>$present]);}
 $next=$present+1;
 $save=$db->prepare('INSERT INTO amr_decisions
 (item_id,decision,intended_edition,reviewer_label,note,decided_at_utc,revision)
 VALUES (?,?,?,?,?,?,?)
 ON DUPLICATE KEY UPDATE decision=VALUES(decision),intended_edition=VALUES(intended_edition),
 reviewer_label=VALUES(reviewer_label),note=VALUES(note),decided_at_utc=VALUES(decided_at_utc),revision=VALUES(revision)');
 $save->execute([$id,$decision,$edition,$editor,$note,$now,$next]);
 $audit=$db->prepare('INSERT INTO amr_decision_audit
 (item_id,revision,saved_at_utc,editor_label,snapshot_json) VALUES (?,?,?,?,?)');
 $audit->execute([$id,$next,$now,$editor,json_encode(
  ['decision'=>$decision,'intended_edition'=>$edition,'note'=>$note],
  JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
 $db->commit();
 amr_edit_reply(200,'saved',['item_id'=>$id,'revision'=>$next,'saved_at_utc'=>$now]);
}catch(Throwable $e){
 if(isset($db)&&$db->inTransaction())$db->rollBack();
 error_log('ArchitectMentor editorial write: '.get_class($e));
 amr_edit_reply(503,'save_unavailable');
}
