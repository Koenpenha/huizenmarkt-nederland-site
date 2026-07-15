export const PRODUCTS = {
  "starter-pack": {
    amount: "14.95",
    name: "Starter Pack Q3 2026",
    description: "Huizenmarkt Nederland - Starter Pack Q3 2026",
    filename: "starter-pack-Q3-2026.pdf",
  },
  "beleggings-pack": {
    amount: "34.95",
    name: "Beleggings Pack Q3 2026",
    description: "Huizenmarkt Nederland - Beleggings Pack Q3 2026",
    filename: "beleggings-pack-Q3-2026.pdf",
  },
};

export function getProduct(slug) {
  return PRODUCTS[slug] || null;
}

export function getSiteUrl() {
  return (process.env.URL || process.env.DEPLOY_PRIME_URL || "https://huizenmarkt-nederland.nl").replace(/\/$/, "");
}
