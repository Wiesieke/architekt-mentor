<?php
declare(strict_types=1);
/**
 * ArchitectMentor one-shot private diagnostic for LH.pl without SSH.
 * CLI-only, read-only SQL. Writes sanitized results only OUTSIDE public_html.
 * If diagnostic-result.txt exists, it is never overwritten.
 */
if(PHP_SAPI!=='cli'){http_response_code(404);exit(2);}
$report=__DIR__.'/diagnostic-result.txt';
if(is_file($report))exit(0);
require __DIR__.'/radar.php';
$messages=["ArchitectMentor Radar private diagnostic", "UTC: ".gmdate('Y-m-d H:i:s')];
$ok=true;
foreach(['pdo_mysql','curl','simplexml','mbstring','json'] as $ext){
 $good=extension_loaded($ext);
 $messages[]=($good?'[PASS] ':'[FAIL] ').'extension '.$ext;
 $ok=$ok&&$good;
}
$messages[]='[INFO] worker: '.(amr_env('AM_RADAR_WORKER_ENABLED')==='1'?'ON':'OFF');
if($ok){
 try {
  $db=amr_db();
  $name=(string)$db->query('SELECT DATABASE()')->fetchColumn();
  $good=hash_equals(amr_env('AM_RADAR_EXPECTED_DB_NAME'),$name);
  $messages[]=($good?'[PASS] ':'[FAIL] ').'isolated ArchitectMentor DB identity';
  $ok=$ok&&$good;
  foreach(['amr_sources','amr_items','amr_decisions','amr_ingest_runs','amr_cycles'] as $table){
   $q=$db->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?');
   $q->execute([$table]);$exists=(int)$q->fetchColumn()===1;
   $messages[]=($exists?'[PASS] ':'[FAIL] ').'table '.$table;
   $ok=$ok&&$exists;
  }
  if($ok){
   $sources=(int)$db->query('SELECT COUNT(*) FROM amr_sources')->fetchColumn();
   $cycles=(int)$db->query('SELECT COUNT(*) FROM amr_cycles')->fetchColumn();
   $messages[]='[INFO] source_count='.$sources;
   $messages[]='[INFO] cycle_count='.$cycles;
  }
 }catch(Throwable $e){
  $messages[]='[FAIL] database preflight: '.get_class($e);
  $ok=false;
 }
}
$messages[]=$ok?'[RESULT] READY_FOR_SOURCE_REVIEW (not collecting)':'[RESULT] BLOCKED — fix preflight before collecting';
$fp=@fopen($report,'x'); // atomic one-shot creation
if(!is_resource($fp)){fwrite(STDERR,"Could not write private diagnostic report.\n");exit(2);}
fwrite($fp,implode("\n",$messages)."\n");fclose($fp);
@chmod($report,0600);
exit($ok?0:1);
