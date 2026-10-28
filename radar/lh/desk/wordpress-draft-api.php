<?php
declare(strict_types=1);
/** Explicit, MFA-session-authenticated, draft-ONLY WordPress handoff. */
require_once __DIR__.'/auth.php';
try {amd_boot();require_once __DIR__.'/wordpress-draft.php';}
catch(Throwable $e) {
 error_log('ArchitectMentor WP handoff boot: '.get_class($e));
 amd_reply(503,['ok'=>false,'code'=>'not_configured']);
}
if(!amd_auth_valid())amd_reply(401,['ok'=>false,'code'=>'login_required']);
$method=(string)($_SERVER['REQUEST_METHOD']??'');
$action=(string)($_GET['action']??'');
function amwp_valid_item(mixed $id): bool {
 return is_string($id)&&preg_match('/\A[a-f0-9]{64}\z/D',$id)===1;
}
if($method==='GET'&&$action==='status') {
 $id=$_GET['item_id']??null;
 if(!amwp_valid_item($id))amd_reply(422,['ok'=>false,'code'=>'invalid_item_id']);
 try {
  $db=amr_db();
  $q=$db->prepare('SELECT h.state,h.wp_post_id,h.draft_revision,h.requested_at_utc,
    h.completed_at_utc FROM amr_article_drafts d
    LEFT JOIN amr_wp_draft_handoffs h ON h.draft_id=d.draft_id
    WHERE d.item_id=? LIMIT 1');
  $q->execute([$id]);$row=$q->fetch();
  if(!$row)amd_reply(404,['ok'=>false,'code'=>'draft_not_found']);
  $handoff=($row['state']===null)?null:[
   'state'=>$row['state'],
   'post_id'=>$row['wp_post_id']===null?null:(int)$row['wp_post_id'],
   'draft_revision'=>(int)$row['draft_revision'],
   'requested_at_utc'=>$row['requested_at_utc'],
   'completed_at_utc'=>$row['completed_at_utc'],
   'edit_url'=>$row['wp_post_id']===null?null:amwp_edit_url((int)$row['wp_post_id']),
  ];
  amd_reply(200,['ok'=>true,'enabled'=>amwp_ready(),'handoff'=>$handoff]);
 }catch(Throwable $e){
  error_log('ArchitectMentor WP status: '.get_class($e));
  amd_reply(503,['ok'=>false,'code'=>'migration_005_required']);
 }
}
if($method!=='POST'||$action!=='send')amd_reply(405,['ok'=>false,'code'=>'method_not_allowed']);
if(!amd_check_csrf())amd_reply(403,['ok'=>false,'code'=>'csrf_failed']);
$origin=(string)($_SERVER['HTTP_ORIGIN']??'');
if($origin!=='') {
 $parts=parse_url($origin);$host=(string)($_SERVER['HTTP_HOST']??'');
 $originHost=is_array($parts)?(string)($parts['host']??''):'';
 $originPort=is_array($parts)&&isset($parts['port'])?':'.$parts['port']:'';
 if(!is_array($parts)||($parts['scheme']??'')!=='https'||$originHost.$originPort!==$host)
  amd_reply(403,['ok'=>false,'code'=>'origin_forbidden']);
}
if(!amwp_ready())amd_reply(503,['ok'=>false,'code'=>'wp_not_configured']);
if(strtolower(trim(explode(';',(string)($_SERVER['CONTENT_TYPE']??''))[0]))!=='application/json')
 amd_reply(415,['ok'=>false,'code'=>'json_required']);
if((int)($_SERVER['CONTENT_LENGTH']??0)>2048)amd_reply(413,['ok'=>false,'code'=>'too_large']);
$raw=file_get_contents('php://input',false,null,0,2049);
if(!is_string($raw)||strlen($raw)>2048)amd_reply(413,['ok'=>false,'code'=>'too_large']);
try{$input=json_decode($raw,true,5,JSON_THROW_ON_ERROR);}
catch(Throwable $e){amd_reply(400,['ok'=>false,'code'=>'invalid_json']);}
if(!is_array($input)||array_is_list($input)
 ||array_diff(array_keys($input),['item_id','revision','confirm_draft_only'])!==[]
 ||count($input)!==3)
 amd_reply(400,['ok'=>false,'code'=>'invalid_payload']);
$id=$input['item_id']??null;$revision=$input['revision']??null;
if(!amwp_valid_item($id)||!is_int($revision)||$revision<1||$revision>1000000)
 amd_reply(422,['ok'=>false,'code'=>'invalid_revision']);
if(($input['confirm_draft_only']??null)!==true)
 amd_reply(422,['ok'=>false,'code'=>'confirmation_required']);
$now=gmdate('Y-m-d H:i:s');
$claimed=false;
try {
 $db=amr_db();$db->beginTransaction();
 $q=$db->prepare('SELECT d.draft_id,d.revision,d.status,d.title,d.lead_text,d.body_text,
  i.original_url FROM amr_article_drafts d
  JOIN amr_items i ON i.item_id=d.item_id
  WHERE d.item_id=? LIMIT 1 FOR UPDATE');
 $q->execute([$id]);$draft=$q->fetch();
 if(!$draft){$db->rollBack();amd_reply(404,['ok'=>false,'code'=>'draft_not_found']);}
 if($draft['status']!=='APPROVED') {
  $db->rollBack();amd_reply(409,['ok'=>false,'code'=>'approval_required']);
 }
 if((int)$draft['revision']!==$revision) {
  $db->rollBack();amd_reply(409,['ok'=>false,'code'=>'revision_conflict']);
 }
 $q=$db->prepare('SELECT state,wp_post_id FROM amr_wp_draft_handoffs WHERE draft_id=? FOR UPDATE');
 $q->execute([(int)$draft['draft_id']]);$existing=$q->fetch();
 if($existing){$db->rollBack();amd_reply(409,['ok'=>false,'code'=>'already_handed_off']);}
 $q=$db->prepare("INSERT INTO amr_wp_draft_handoffs
  (draft_id,draft_revision,state,wp_post_id,requested_by,requested_at_utc,completed_at_utc)
  VALUES (?,?,'PENDING',NULL,?,?,NULL)");
 $q->execute([(int)$draft['draft_id'],$revision,
  mb_substr('lh:'.(string)($_SESSION['username']??'operator'),0,100),$now]);
 $handoffId=(int)$db->lastInsertId();
 $db->commit();$claimed=true;
 // The claim was committed BEFORE the HTTP call. A timeout cannot trigger a duplicate retry.
 $postId=null;
 try{$postId=amwp_create_draft($draft);}
 catch(Throwable $e){error_log('ArchitectMentor WP request: '.get_class($e));}
 $state=$postId!==null?'CREATED':'UNKNOWN';
 $updated=$db->prepare('UPDATE amr_wp_draft_handoffs
  SET state=?,wp_post_id=?,completed_at_utc=? WHERE handoff_id=? AND state=?');
 $updated->execute([$state,$postId,gmdate('Y-m-d H:i:s'),$handoffId,'PENDING']);
 if($updated->rowCount()!==1)throw new RuntimeException('Handoff state not persisted');
 if($postId===null)amd_reply(502,['ok'=>false,'code'=>'wp_outcome_unknown']);
 amd_reply(200,['ok'=>true,'code'=>'created_draft','wp_post_id'=>$postId,
  'edit_url'=>amwp_edit_url($postId),'status'=>'draft']);
}catch(Throwable $e){
 if(isset($db)&&$db->inTransaction())$db->rollBack();
 error_log('ArchitectMentor WP handoff: '.get_class($e));
 amd_reply(503,['ok'=>false,'code'=>$claimed?'wp_outcome_unknown':'handoff_unavailable']);
}
