<?php
declare(strict_types=1);
require __DIR__.'/../totp.php';
function expect_true(bool $condition,string $label): void {
 if(!$condition){fwrite(STDERR,"FAIL: ".$label."\n");exit(1);}
 echo "PASS: ".$label."\n";
}
$seed='12345678901234567890';
$encoded=amd_b32_encode($seed);
expect_true($encoded==='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ','RFC SHA-1 base32 seed');
expect_true(amd_b32_decode($encoded)===$seed,'base32 round-trip');
expect_true(amd_totp_at($encoded,1)==='287082','RFC 6238 truncated SHA1 TOTP, t=59');
expect_true(amd_totp_step($encoded,'287082',59,-1)===1,'accept current time-step');
expect_true(amd_totp_step($encoded,'287082',59,1)===null,'reject replay');
expect_true(amd_totp_step($encoded,'287082',59+90,-1)===null,'reject expired code');
expect_true(amd_totp_step($encoded,'12345X',59,-1)===null,'reject malformed code');
expect_true(amd_b32_decode('not/base32')===null,'reject malformed seed');
echo "All TOTP tests passed.\n";
