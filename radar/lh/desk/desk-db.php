<?php
declare(strict_types=1);
/** LH.pl web-scoped, read-only-safe DB bridge. Never import the Cron worker here. */
function amr_env(string $key): string {
 $v=getenv($key);
 if(is_string($v)&&trim($v)!=='')return trim($v);
 static $cfg=null;
 if($cfg===null){
  $file=amd_private_dir().'/config.private.php';
  if(!is_file($file))throw new RuntimeException('Desk vault config missing');
  $data=require $file;
  if(!is_array($data))throw new RuntimeException('Desk vault config invalid');
  $cfg=$data;
 }
 $v=$cfg[$key]??'';
 return is_string($v)?trim($v):'';
}
function amr_db(): PDO {
 $name=amr_env('AM_RADAR_DB_NAME');
 $expected=amr_env('AM_RADAR_EXPECTED_DB_NAME');
 $user=amr_env('AM_RADAR_DB_USER');
 $password=amr_env('AM_RADAR_DB_PASSWORD');
 if($name===''||$expected===''||$name!==$expected||$user===''||$password===''||stripos($name,'wrycut')!==false)
  throw new RuntimeException('ArchitectMentor DB isolation guard failed');
 $host=amr_env('AM_RADAR_DB_HOST')?:'localhost';
 $db=new PDO('mysql:host='.$host.';dbname='.$name.';charset=utf8mb4',$user,$password,
  [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
   PDO::ATTR_EMULATE_PREPARES=>false,PDO::ATTR_TIMEOUT=>8]);
 $db->exec("SET time_zone = '+00:00'");
 if((string)$db->query('SELECT DATABASE()')->fetchColumn()!==$expected)
  throw new RuntimeException('Wrong selected database');
 return $db;
}
