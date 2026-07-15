let blobStore = null;

async function getStore() {
  if (blobStore) return blobStore;
  try {
    const { getStore } = await import("@netlify/blobs");
    blobStore = getStore({ name: "hm-email-sent", consistency: "strong" });
    return blobStore;
  } catch (err) {
    console.warn("Netlify Blobs niet beschikbaar:", err.message);
    return null;
  }
}

export async function wasEmailSent(paymentId) {
  const store = await getStore();
  if (!store) return false;
  const value = await store.get(paymentId);
  return Boolean(value);
}

export async function markEmailSent(paymentId, details = {}) {
  const store = await getStore();
  if (!store) return false;
  await store.setJSON(paymentId, {
    sentAt: new Date().toISOString(),
    ...details,
  });
  return true;
}
