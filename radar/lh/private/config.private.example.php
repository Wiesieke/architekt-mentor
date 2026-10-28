<?php
declare(strict_types=1);
/** Template only. Keep completed config.private.php OUTSIDE public_html, never commit it. */
return [
 'AM_RADAR_DB_HOST'=>'',
 'AM_RADAR_DB_NAME'=>'', // Dedicated ArchitectMentor DB; never WRYCUT DB.
 'AM_RADAR_EXPECTED_DB_NAME'=>'', // Repeat EXACT same intended DB name as a safety pin.
 'AM_RADAR_DB_USER'=>'',
 'AM_RADAR_DB_PASSWORD'=>'',
 'AM_RADAR_WORKER_ENABLED'=>'0',
];
