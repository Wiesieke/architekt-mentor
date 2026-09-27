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
    return { saved: false, storageCode: 'http_' + response.status };
  } catch (error) {
    return { saved: false, storageCode: error?.name === 'TimeoutError' ? 'timeout' : 'connection' };
  }
}

module.exports = { storeWithConsent, randomUUID };
