<?php
declare(strict_types=1);
/**
 * Independent ArchitectMentor hourly RSS/Atom metadata collector.
 * CLI-only. Never produces an article, publishes, decides editorial status, or emails.
 */
require __DIR__.'/radar.php';
if(PHP_SAPI!=='cli'){http_response_code(404);exit(2);}
if(amr_env('AM_RADAR_WORKER_ENABLED')!=='1'){
 fwrite(STDERR,"ArchitectMentor radar OFF; no fetch performed.\n");exit(2);
}
$db=null;$lockAcquired=false;$cycleId=0;$attempted=0;$succeeded=0;$seen=0;$new=0;$failures=0;
$outcome='error';
try {
 $db=amr_db();
 $locked=$db->query("SELECT GET_LOCK('architectmentor_radar_hourly',0) AS locked")->fetch();
 if((int)($locked['locked']??0)!==1){fwrite(STDERR,"ArchitectMentor radar already running.\n");exit(3);}
 $lockAcquired=true;
 $stmt=$db->prepare("INSERT INTO amr_cycles (started_at_utc,outcome) VALUES (?,'started')");
 $stmt->execute([amr_now()]);$cycleId=(int)$db->lastInsertId();
 $sources=amr_sources();
 amr_seed($db,$sources); // First seed ALWAYS disabled; does not override rights approval.
 $ids=$db->query("SELECT source_id FROM amr_sources WHERE enabled=1 AND rights_gate='approved' ORDER BY source_id")->fetchAll(PDO::FETCH_COLUMN);
 foreach($ids as $id){
  $attempted++;
  if(!isset($sources[$id])){$failures++;continue;}
  $start=$db->prepare("INSERT INTO amr_ingest_runs (source_id,started_at_utc,outcome) VALUES (?,?,'started')");
  $start->execute([(string)$id,amr_now()]);$runId=(int)$db->lastInsertId();
  try {
   $items=amr_parse(amr_fetch($sources[$id]),$sources[$id]);
   $stats=amr_ingest($db,(string)$id,$sources[$id],$items);
   $done=$db->prepare("UPDATE amr_ingest_runs SET completed_at_utc=?,outcome='success',candidates_seen=?,new_items=? WHERE run_id=?");
   $done->execute([amr_now(),$stats['seen'],$stats['new'],$runId]);
   $succeeded++;$seen+=$stats['seen'];$new+=$stats['new'];
  }catch(Throwable $e){
   $failures++;
   $failed=$db->prepare("UPDATE amr_ingest_runs SET completed_at_utc=?,outcome='error',error_label=? WHERE run_id=?");
   $failed->execute([amr_now(),get_class($e),$runId]);
  }
 }
 $outcome=$attempted===0?'no_enabled_sources':($failures===0?'success':'degraded');
 $finish=$db->prepare("UPDATE amr_cycles SET completed_at_utc=?,outcome=?,sources_attempted=?,sources_succeeded=?,candidates_seen=?,new_items=?,error_label=? WHERE cycle_id=?");
 $finish->execute([amr_now(),$outcome,$attempted,$succeeded,$seen,$new,$failures?'source_failures':null,$cycleId]);
 echo json_encode(['cycle'=>$cycleId,'outcome'=>$outcome,'sources_attempted'=>$attempted,'sources_succeeded'=>$succeeded,'candidates_seen'=>$seen,'new_items'=>$new],JSON_UNESCAPED_SLASHES)."\n";
}catch(Throwable $e){
 if($db instanceof PDO && $cycleId>0){
  try{$db->prepare("UPDATE amr_cycles SET completed_at_utc=?,outcome='error',error_label=? WHERE cycle_id=?")->execute([amr_now(),get_class($e),$cycleId]);}catch(Throwable $ignored){}
 }
 fwrite(STDERR,"ArchitectMentor radar failed: ".get_class($e)."\n");
 $outcome='error';
}finally{
 if($lockAcquired&&$db instanceof PDO){
  try{$db->query("SELECT RELEASE_LOCK('architectmentor_radar_hourly')");}catch(Throwable $ignored){}
 }
}
exit($outcome==='success'?0:($outcome==='no_enabled_sources'?4:1));
