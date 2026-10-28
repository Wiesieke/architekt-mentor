<?php
declare(strict_types=1);
/** RFC 6238 / TOTP SHA-1, six digits, 30-second period. No network dependency. */
function amd_b32_encode(string $bytes): string {
 $alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
 $bits=0;$value=0;$out='';
 for($i=0;$i<strlen($bytes);$i++){
  $value=($value<<8)|ord($bytes[$i]);$bits+=8;
  while($bits>=5){$bits-=5;$out.=$alphabet[($value>>$bits)&31];}
  $value&=(1<<$bits)-1;
 }
 if($bits>0)$out.=$alphabet[($value<<(5-$bits))&31];
 return $out;
}
function amd_b32_decode(string $text): ?string {
 $text=strtoupper(rtrim($text,'='));
 if(!preg_match('/^[A-Z2-7]{16,64}$/D',$text))return null;
 $alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
 $bits=0;$value=0;$out='';
 for($i=0;$i<strlen($text);$i++){
  $digit=strpos($alphabet,$text[$i]);
  if($digit===false)return null;
  $value=($value<<5)|$digit;$bits+=5;
  if($bits>=8){$bits-=8;$out.=chr(($value>>$bits)&255);$value&=(1<<$bits)-1;}
 }
 return $out;
}
function amd_totp_at(string $secret,int $step): ?string {
 if($step<0)return null;
 $key=amd_b32_decode($secret);if($key===null)return null;
 $message=pack('N2',intdiv($step,4294967296),$step%4294967296);
 $digest=hash_hmac('sha1',$message,$key,true);
 $offset=ord($digest[19])&15;
 $value=((ord($digest[$offset])&127)<<24)|(ord($digest[$offset+1])<<16)|(ord($digest[$offset+2])<<8)|ord($digest[$offset+3]);
 return str_pad((string)($value%1000000),6,'0',STR_PAD_LEFT);
}
function amd_totp_step(string $secret,string $code,int $now,int $lastStep=-1): ?int {
 if(!preg_match('/^[0-9]{6}$/D',$code))return null;
 $step=intdiv($now,30);
 for($offset=-1;$offset<=1;$offset++){
  $candidate=$step+$offset;
  if($candidate<=$lastStep)continue;
  $expected=amd_totp_at($secret,$candidate);
  if($expected!==null&&hash_equals($expected,$code))return $candidate;
 }
 return null;
}
