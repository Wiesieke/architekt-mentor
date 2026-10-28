<?php
declare(strict_types=1);
/**
 * ArchitectMentor Desk article drafts.
 * Authenticated, same-origin, manual editorial workflow ONLY. No publishing API.
 */
require_once __DIR__.'/auth.php';
try { amd_boot(); }
catch (Throwable $e) {
 error_log('ArchitectMentor drafts boot: '.get_class($e));
 amd_reply(503,['ok'=>false,'code'=>'not_configured']);
}
if (!amd_auth_valid()) amd_reply(401,['ok'=>false,'code'=>'login_required']);
$method=(string)($_SERVER['REQUEST_METHOD']??'');
$action=(string)($_GET['action']??'');

function amdd_valid_id(mixed $id): bool {
 return is_string($id)&&preg_match('/^[a-f0-9]{64}$/D',$id)===1;
}
function amdd_source_ok(string $value): bool {
 $u=parse_url($value);
 return is_array($u)&&strtolower((string)($u['scheme']??''))==='https'
  &&is_string($u['host']??null)&&$u['host']!==''
  &&!isset($u['user'])&&!isset($u['pass']);
}
function amdd_label(): string {
 return mb_substr('lh:'.(string)($_SESSION['username']??'operator'),0,100);
}
function amdd_snapshot(array $row): string {
 return json_encode([
  'item_id'=>$row['item_id'],'title'=>$row['title'],
  'lead_text'=>$row['lead_text'],'body_text'=>$row['body_text'],
  'status'=>$row['status'],'revision'=>$row['revision'],
  'editor_label'=>$row['editor_label'],'approved_by'=>$row['approved_by'],
  'approved_at_utc'=>$row['approved_at_utc'],
 ],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
}
function amdd_audit(PDO $db,array $row,string $action,string $now): void {
 $stmt=$db->prepare('INSERT INTO amr_article_draft_audit
  (draft_id,revision,saved_at_utc,editor_label,action_label,snapshot_json)
  VALUES (?,?,?,?,?,?)');
 $stmt->execute([(int)$row['draft_id'],(int)$row['revision'],$now,
  amdd_label(),$action,amdd_snapshot($row)]);
}
function amdd_summary(array $row): array {
 return [
  'draft_id'=>(int)$row['draft_id'],'item_id'=>$row['item_id'],
  'title'=>$row['title'],'source_id'=>$row['source_id'],'status'=>$row['status'],
  'revision'=>(int)$row['revision'],'updated_at_utc'=>$row['updated_at_utc'],
 ];
}
if ($method==='GET'&&$action==='list') {
 try {
  $db=amr_db();
  $rows=$db->query("SELECT d.draft_id,d.item_id,d.title,d.status,d.revision,d.updated_at_utc,
   i.source_id FROM amr_article_drafts d
   JOIN amr_items i ON i.item_id=d.item_id
   ORDER BY d.updated_at_utc DESC,d.draft_id DESC LIMIT 100")->fetchAll();
  amd_reply(200,['ok'=>true,'drafts'=>array_map('amdd_summary',$rows),
   'write_enabled'=>amr_env('AM_DESK_WRITE_ENABLED')==='1'
    &&amr_env('AM_RADAR_EDITOR_WRITE_ENABLED')==='1']);
 } catch(Throwable $e) {
  error_log('ArchitectMentor drafts list: '.get_class($e));
  amd_reply(503,['ok'=>false,'code'=>'migration_004_required']);
 }
}
if ($method==='GET'&&$action==='load') {
 $id=$_GET['item_id']??null;
 if (!amdd_valid_id($id)) amd_reply(422,['ok'=>false,'code'=>'invalid_item_id']);
 try {
  $db=amr_db();
  $stmt=$db->prepare("SELECT i.item_id,i.title AS source_title,i.original_url,i.source_id,
    i.fact_check_status,d.draft_id,d.title,d.lead_text,d.body_text,d.status,
    d.revision,d.editor_label,d.approved_by,d.updated_at_utc,d.approved_at_utc
   FROM amr_items i LEFT JOIN amr_article_drafts d ON d.item_id=i.item_id
   WHERE i.item_id=? LIMIT 1");
  $stmt->execute([$id]);$row=$stmt->fetch();
  if (!$row) amd_reply(404,['ok'=>false,'code'=>'item_not_found']);
  $existing=$row['draft_id']!==null;
  amd_reply(200,['ok'=>true,'draft'=>[
   'item_id'=>$id,'source_title'=>$row['source_title'],'source_id'=>$row['source_id'],
   'source_url'=>$row['original_url'],'fact_check_status'=>$row['fact_check_status'],
   'draft_id'=>$existing?(int)$row['draft_id']:null,
   'title'=>$existing?$row['title']:mb_substr((string)$row['source_title'],0,240),
   'lead_text'=>$existing?$row['lead_text']:'',
   'body_text'=>$existing?$row['body_text']:'',
   'status'=>$existing?$row['status']:'DRAFT',
   'revision'=>$existing?(int)$row['revision']:0,
   'editor_label'=>$existing?$row['editor_label']:null,
   'approved_by'=>$existing?$row['approved_by']:null,
   'updated_at_utc'=>$existing?$row['updated_at_utc']:null,
   'approved_at_utc'=>$existing?$row['approved_at_utc']:null,
  ]]);
 } catch(Throwable $e) {
  error_log('ArchitectMentor drafts load: '.get_class($e));
  amd_reply(503,['ok'=>false,'code'=>'migration_004_required']);
 }
}
if ($method!=='POST'||!in_array($action,['save','approve','reopen'],true))
 amd_reply(405,['ok'=>false,'code'=>'method_not_allowed']);
if (!amd_check_csrf()) amd_reply(403,['ok'=>false,'code'=>'csrf_failed']);
$origin=(string)($_SERVER['HTTP_ORIGIN']??'');
if ($origin!=='') {
 $parts=parse_url($origin);$host=(string)($_SERVER['HTTP_HOST']??'');
 $originHost=is_array($parts)?(string)($parts['host']??''):'';
 $originPort=is_array($parts)&&isset($parts['port'])?':'.$parts['port']:'';
 if (!is_array($parts)||($parts['scheme']??'')!=='https'
  ||$originHost.$originPort!==$host)
  amd_reply(403,['ok'=>false,'code'=>'origin_forbidden']);
}
if (amr_env('AM_DESK_WRITE_ENABLED')!=='1'
 ||amr_env('AM_RADAR_EDITOR_WRITE_ENABLED')!=='1')
 amd_reply(503,['ok'=>false,'code'=>'writes_disabled']);
if (strtolower(trim(explode(';',(string)($_SERVER['CONTENT_TYPE']??''))[0]))!=='application/json')
 amd_reply(415,['ok'=>false,'code'=>'json_required']);
if ((int)($_SERVER['CONTENT_LENGTH']??0)>75000) amd_reply(413,['ok'=>false,'code'=>'too_large']);
$raw=file_get_contents('php://input',false,null,0,75001);
if (!is_string($raw)||strlen($raw)>75000) amd_reply(413,['ok'=>false,'code'=>'too_large']);
try {$data=json_decode($raw,true,12,JSON_THROW_ON_ERROR);}
catch (Throwable $e) {amd_reply(400,['ok'=>false,'code'=>'invalid_json']);}
if (!is_array($data)||array_is_list($data)) amd_reply(400,['ok'=>false,'code'=>'invalid_payload']);
$fields=$action==='save'
 ?['item_id','revision','title','lead_text','body_text','submit_review']
 :($action==='approve'
  ?['item_id','revision','confirm_facts','confirm_rights','confirm_final']
  :['item_id','revision']);
foreach (array_keys($data) as $key) {
 if (!in_array($key,$fields,true)) amd_reply(400,['ok'=>false,'code'=>'unknown_field']);
}
$id=$data['item_id']??null;$rev=$data['revision']??null;
if (!amdd_valid_id($id)) amd_reply(422,['ok'=>false,'code'=>'invalid_item_id']);
if (!is_int($rev)||$rev<0||$rev>1000000)
 amd_reply(422,['ok'=>false,'code'=>'invalid_revision']);
if ($action==='save') {
 $title=$data['title']??null;$lead=$data['lead_text']??null;$body=$data['body_text']??null;
 $submit=$data['submit_review']??null;
 if (!is_string($title)||mb_strlen(trim($title))<5||mb_strlen($title)>240)
  amd_reply(422,['ok'=>false,'code'=>'invalid_title']);
 if (!is_string($lead)||mb_strlen($lead)>2000)
  amd_reply(422,['ok'=>false,'code'=>'invalid_lead']);
 if (!is_string($body)||mb_strlen($body)>20000)
  amd_reply(422,['ok'=>false,'code'=>'invalid_body']);
 if (!is_bool($submit)) amd_reply(422,['ok'=>false,'code'=>'invalid_submit']);
 $title=trim($title);$lead=trim($lead);$body=trim($body);
 if ($submit&&(mb_strlen($lead)<40||mb_strlen($body)<150))
  amd_reply(422,['ok'=>false,'code'=>'draft_incomplete']);
}
if ($action==='approve') {
 if (($data['confirm_facts']??false)!==true||
     ($data['confirm_rights']??false)!==true||
     ($data['confirm_final']??false)!==true)
  amd_reply(422,['ok'=>false,'code'=>'review_confirmation_required']);
}
$now=gmdate('Y-m-d H:i:s');$label=amdd_label();
try {
 $db=amr_db();$db->beginTransaction();
 $source=$db->prepare('SELECT item_id,original_url FROM amr_items WHERE item_id=? FOR UPDATE');
 $source->execute([$id]);$item=$source->fetch();
 if (!$item) {$db->rollBack();amd_reply(404,['ok'=>false,'code'=>'item_not_found']);}
 $sel=$db->prepare('SELECT * FROM amr_article_drafts WHERE item_id=? FOR UPDATE');
 $sel->execute([$id]);$old=$sel->fetch();
 $present=$old?(int)$old['revision']:0;
 if ($present!==$rev) {
  $db->rollBack();
  amd_reply(409,['ok'=>false,'code'=>'revision_conflict','current_revision'=>$present]);
 }
 if ($action==='save') {
  if ($old&&$old['status']==='APPROVED') {
   $db->rollBack();amd_reply(409,['ok'=>false,'code'=>'approved_locked']);
  }
  if ($submit&&!amdd_source_ok((string)$item['original_url'])) {
   $db->rollBack();amd_reply(422,['ok'=>false,'code'=>'source_link_required']);
  }
  $next=$present+1;$status=$submit?'IN_REVIEW':'DRAFT';
  if ($old) {
   $q=$db->prepare('UPDATE amr_article_drafts SET title=?,lead_text=?,body_text=?,
    status=?,revision=?,editor_label=?,approved_by=NULL,approved_at_utc=NULL,updated_at_utc=?
    WHERE draft_id=?');
   $q->execute([$title,$lead,$body,$status,$next,$label,$now,(int)$old['draft_id']]);
   $draftId=(int)$old['draft_id'];
  } else {
   $q=$db->prepare('INSERT INTO amr_article_drafts
    (item_id,title,lead_text,body_text,status,revision,editor_label,approved_by,
     created_at_utc,updated_at_utc,approved_at_utc)
    VALUES (?,?,?,?,?,?,?,NULL,?,?,NULL)');
   $q->execute([$id,$title,$lead,$body,$status,$next,$label,$now,$now]);
   $draftId=(int)$db->lastInsertId();
  }
  $row=[
   'draft_id'=>$draftId,'item_id'=>$id,'title'=>$title,'lead_text'=>$lead,
   'body_text'=>$body,'status'=>$status,'revision'=>$next,'editor_label'=>$label,
   'approved_by'=>null,'approved_at_utc'=>null,
  ];
  amdd_audit($db,$row,$submit?'SUBMIT':'SAVE',$now);
 } elseif ($action==='approve') {
  if (!$old||$old['status']!=='IN_REVIEW') {
   $db->rollBack();amd_reply(409,['ok'=>false,'code'=>'not_in_review']);
  }
  if (mb_strlen(trim((string)$old['lead_text']))<40
   ||mb_strlen(trim((string)$old['body_text']))<150
   ||!amdd_source_ok((string)$item['original_url'])) {
   $db->rollBack();amd_reply(422,['ok'=>false,'code'=>'draft_incomplete']);
  }
  $next=$present+1;$status='APPROVED';
  $q=$db->prepare('UPDATE amr_article_drafts SET status=?,revision=?,approved_by=?,
    approved_at_utc=?,updated_at_utc=? WHERE draft_id=?');
  $q->execute([$status,$next,$label,$now,$now,(int)$old['draft_id']]);
  $row=$old;$row['revision']=$next;$row['status']=$status;
  $row['approved_by']=$label;$row['approved_at_utc']=$now;
  amdd_audit($db,$row,'APPROVE',$now);
 } else {
  if (!$old||$old['status']!=='APPROVED') {
   $db->rollBack();amd_reply(409,['ok'=>false,'code'=>'not_approved']);
  }
  // After a WordPress handoff claim the approved source remains immutable.
  $h=$db->prepare('SELECT handoff_id FROM amr_wp_draft_handoffs WHERE draft_id=? LIMIT 1');
  $h->execute([(int)$old['draft_id']]);
  if($h->fetchColumn()!==false) {
   $db->rollBack();amd_reply(409,['ok'=>false,'code'=>'handoff_locked']);
  }
  $next=$present+1;$status='DRAFT';
  $q=$db->prepare('UPDATE amr_article_drafts SET status=?,revision=?,editor_label=?,
    approved_by=NULL,approved_at_utc=NULL,updated_at_utc=? WHERE draft_id=?');
  $q->execute([$status,$next,$label,$now,(int)$old['draft_id']]);
  $row=$old;$row['revision']=$next;$row['status']=$status;
  $row['editor_label']=$label;$row['approved_by']=null;$row['approved_at_utc']=null;
  amdd_audit($db,$row,'REOPEN',$now);
 }
 $db->commit();
 amd_reply(200,['ok'=>true,'code'=>'saved','item_id'=>$id,
  'revision'=>$next,'status'=>$status,'updated_at_utc'=>$now]);
} catch(Throwable $e) {
 if (isset($db)&&$db->inTransaction())$db->rollBack();
 error_log('ArchitectMentor drafts mutation: '.get_class($e));
 amd_reply(503,['ok'=>false,'code'=>'save_unavailable']);
}
