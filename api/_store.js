const { randomUUID } = require('node:crypto');

async function storeWithConsent(record) {
  if (record.consent !== true) return { saved: null };
  const url = process.env.LH_STORAGE_URL;
  const token = process.env.LH_STORAGE_TOKEN;
  if (!url || !token || !/^https:\/\/[^/?#]+\/[a-z0-9/_-]+\.php$/i.test(url)) return { saved: false };
  const id = randomUUID();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-store-token': token },
      body: JSON.stringify({ ...record, id }),
      signal: AbortSignal.timeout(6000)
    });
    return response.status === 201 ? { saved: true, recordId: id } : { saved: false };
  } catch {
    // Generating/assessing content must still work if optional storage fails.
    return { saved: false };
  }
}

module.exports = { storeWithConsent, randomUUID };
