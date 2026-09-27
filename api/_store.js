const { randomUUID } = require('node:crypto');

async function storeWithConsent(record) {
  if (record.consent !== true) return { saved: null };
  const url = process.env.LH_STORAGE_URL;
  const token = process.env.LH_STORAGE_TOKEN;
  if (!url || !token) return { saved: false, storageCode: 'missing_settings' };
  if (!/^https:\/\/[^/?#]+\/[a-z0-9/_-]+\.php$/i.test(url)) {
    return { saved: false, storageCode: 'invalid_url' };
  }
  const id = randomUUID();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-store-token': token },
      body: JSON.stringify({ ...record, id }),
      signal: AbortSignal.timeout(6000)
    });
    if (response.status === 201) return { saved: true, recordId: id };
    // Status only: never expose response bodies, tokens, submitted content or SQL errors.
    if (response.status === 503) {
      try {
        const data = await response.json();
        const codes = new Set(['db_auth', 'db_not_found', 'table_not_found', 'db_connect', 'db_error', 'mysql_driver_missing', 'storage_error']);
        if (codes.has(data?.code)) return { saved: false, storageCode: data.code };
      } catch {
        // The host may return an HTML error page.
      }
    }
    return { saved: false, storageCode: 'http_' + response.status };
  } catch (error) {
    return { saved: false, storageCode: error?.name === 'TimeoutError' ? 'timeout' : 'connection' };
  }
}

module.exports = { storeWithConsent, randomUUID };
