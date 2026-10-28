<?php
declare(strict_types=1);
/** Read-only preflight. Never prints connection secrets, tokens or full DSN. */
require __DIR__.'/radar.php';
if(PHP_SAPI!=='cli'){http_response_code(404);exit(2);}
$checks=['pdo_mysql','curl','simplexml','mbstring','json'];
$ok=true;
foreach($checks as $ext){
 $pass=extension_loaded($ext);
 echo ($pass?'[PASS] ':'[FAIL] ').$ext."\n";$ok=$ok&&$pass;
}
echo '[INFO] worker: '.(amr_env('AM_RADAR_WORKER_ENABLED')==='1'?'ON':'OFF')."\n";
if(!$ok)exit(1);
try{
 $db=amr_db();
 $tables=['amr_sources','amr_items','amr_decisions','amr_ingest_runs','amr_cycles'];
 foreach($tables as $name){
  $stmt=$db->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?");
  $stmt->execute([$name]);$found=(int)$stmt->fetchColumn()===1;
  echo ($found?'[PASS] ':'[FAIL] ').$name."\n";$ok=$ok&&$found;
 }
 $cycles=(int)$db->query('SELECT COUNT(*) FROM amr_cycles')->fetchColumn();
 echo '[INFO] recorded_cycles: '.$cycles."\n";
}catch(Throwable $e){fwrite(STDERR,"[FAIL] database/schema preflight (".get_class($e).")\n");$ok=false;}
exit($ok?0:1);
