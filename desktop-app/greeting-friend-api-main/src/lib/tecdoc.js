/**
 * TecDoc Auto Parts Catalog API Integration
 * Uses the "Auto Parts Catalog" API on RapidAPI (TecDoc alternative)
 *
 * API Host: auto-parts-catalog.p.rapidapi.com
 * Source:   https://github.com/catamc90/auto-parts-catalog (CatalogApi.php)
 * Docs:     https://rapidapi.com/makingdatameaningful/api/auto-parts-catalog
 *
 * IMPORTANT: Paths use REST segments, NOT query params.
 *   e.g. models/list/type-id/1/manufacturer-id/35/lang-id/7/country-filter-id/118
 *   NOTE: segment ORDER matters and differs per endpoint (verified from RapidAPI Playground)
 *
 * Flow:
 *   1. getManufacturers → pick brand
 *   2. getModels → pick model
 *   3. getVehicleEngineTypes → pick engine/variant
 *   4. getCategoryV2 → browse part categories
 *   5. getArticlesList → list parts for vehicle+category
 *   6. getArticleDetailsById → full part info + cross-refs
 *   7. searchArticlesByNumber → search by OEM / article number
 */

const API_HOST = "auto-parts-catalog.p.rapidapi.com";
const BASE_URL = `https://${API_HOST}/`;

// Defaults: Italian language (7), Italy country (118), Automobiles type (1)
const DEFAULTS = {
  langId: 7,           // Italiano (from /languages/list)
  countryFilterId: 118, // Italy (from /countries/list)
  typeId: 1,           // Automobiles / PC
};

// Language IDs (from /languages/list endpoint)
export const TECDOC_LANGUAGES = {
  de: 1, en: 4, fr: 6, it: 7, es: 8, pt: 13, nl: 10, pl: 14, ro: 15, cs: 2, hu: 9,
};

// Country IDs (from /countries/list endpoint)
export const TECDOC_COUNTRIES = {
  IT: 118, DE: 63, FR: 76, ES: 70, GB: 78, AT: 1, CH: 44, NL: 133, BE: 15, PT: 152,
};

/**
 * Get the API key from env. Supports both VITE_ prefix (browser) and plain (Electron main).
 */
function getApiKey() {
  const key =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_TECDOC_API_KEY) ||
    (typeof process !== "undefined" && process.env?.TECDOC_API_KEY) ||
    "";
  if (!key) {
    console.warn("[TecDoc] API key not configured. Set VITE_TECDOC_API_KEY in .env");
  }
  return key;
}

/**
 * Core fetch wrapper — path is appended directly to BASE_URL (no query params).
 */
async function tecdocFetch(path, timeoutMs = 15000) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("TecDoc API key non configurata. Aggiungi VITE_TECDOC_API_KEY nel file .env");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: {
        "x-rapidapi-host": API_HOST,
        "x-rapidapi-key": apiKey,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`TecDoc API error ${res.status}: ${text || res.statusText}`);
    }

    return res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`TecDoc API timeout (${timeoutMs / 1000}s) per: ${path}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* ─────────────────────────────────────────────
 * REFERENCE / LOOKUP ENDPOINTS (Free tier)
 * ───────────────────────────────────────────── */

/** List all available languages */
export async function getAllLanguages() {
  return tecdocFetch("languages/list");
}

/** Get language details by ID */
export async function getLanguageById(langId) {
  return tecdocFetch(`languages/get-language/lang-id/${langId}`);
}

/** List all countries */
export async function getAllCountries() {
  return tecdocFetch("countries/list");
}

/** List countries localized by language */
export async function getCountriesByLang(langId = DEFAULTS.langId) {
  return tecdocFetch(`countries/list-countries-by-lang-id/${langId}`);
}

/** Get country details */
export async function getCountryById(langId, countryId) {
  return tecdocFetch(`countries/get-country/lang-id/${langId}/country-filter-id/${countryId}`);
}

/** List vehicle types (1=PC, 2=CV, 3=Motorcycle, etc.) */
export async function listVehicleTypes() {
  return tecdocFetch("types/list-vehicles-type");
}

/** List all suppliers/brands */
export async function getAllSuppliers() {
  return tecdocFetch("suppliers/list");
}

/* ─────────────────────────────────────────────
 * VEHICLE IDENTIFICATION ENDPOINTS (Pro tier)
 * ───────────────────────────────────────────── */

/** Get all car manufacturers for the given type (lang/country not supported in this endpoint) */
export async function getManufacturers(opts = {}) {
  const { typeId = DEFAULTS.typeId } = opts;
  return tecdocFetch(`manufacturers/list/type-id/${typeId}`);
}

/** Get manufacturer details by ID */
export async function getManufacturerById(manufacturerId) {
  return tecdocFetch(`manufacturers/find-by-id/${manufacturerId}`);
}

/** Get models for a manufacturer */
export async function getModels(manufacturerId, opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId, countryFilterId = DEFAULTS.countryFilterId } = opts;
  return tecdocFetch(`models/list/type-id/${typeId}/manufacturer-id/${manufacturerId}/lang-id/${langId}/country-filter-id/${countryFilterId}`);
}

/** Get model details */
export async function getModelById(modelId, opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId, countryFilterId = DEFAULTS.countryFilterId } = opts;
  return tecdocFetch(`models/find-by/type-id/${typeId}/model-id/${modelId}/lang-id/${langId}/country-filter-id/${countryFilterId}`);
}

/** Get model details by vehicle ID */
export async function getModelByVehicleId(vehicleId, opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId, countryFilterId = DEFAULTS.countryFilterId } = opts;
  return tecdocFetch(`models/get-model-details-by-vehicle-id/type-id/${typeId}/vehicle-id/${vehicleId}/lang-id/${langId}/country-filter-id/${countryFilterId}`);
}

/** Get engine types / variants for a model */
export async function getVehicleEngineTypes(modelId, manufacturerId, opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId, countryFilterId = DEFAULTS.countryFilterId } = opts;
  return tecdocFetch(`types/type-id/${typeId}/list-vehicles-types/${modelId}/lang-id/${langId}/country-filter-id/${countryFilterId}`);
}

/** Get detailed vehicle type information */
export async function getVehicleDetails(vehicleId, manufacturerId, opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId, countryFilterId = DEFAULTS.countryFilterId } = opts;
  return tecdocFetch(`types/type-id/${typeId}/vehicle-type-details/${vehicleId}/lang-id/${langId}/country-filter-id/${countryFilterId}`);
}

/* ─────────────────────────────────────────────
 * CATEGORIES ENDPOINTS (Pro tier)
 * ───────────────────────────────────────────── */

/** Get full category tree structure */
export async function getCategoryTree(opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`category/type-id/${typeId}/list-category-tree-structure/lang-id/${langId}`);
}

/** Get part categories V1 for a vehicle (flat list) */
export async function getCategoryV1(vehicleId, opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`category/type-id/${typeId}/products-groups-variant-1/${vehicleId}/lang-id/${langId}`);
}

/** Get part categories V2 for a vehicle (tree hierarchy) */
export async function getCategories(vehicleId, manufacturerId, opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`category/type-id/${typeId}/products-groups-variant-2/${vehicleId}/lang-id/${langId}`);
}

/** Search categories by description */
export async function searchCategories(searchText, opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`category/search-for-the-commodity-group-tree-by-description/type-id/${typeId}/lang-id/${langId}/search-text/${encodeURIComponent(searchText)}`);
}

/** List all product names */
export async function listProductNames(opts = {}) {
  const { langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`category/list-products-names/lang-id/${langId}`);
}

/* ─────────────────────────────────────────────
 * ARTICLES / PARTS ENDPOINTS (Pro tier)
 * ───────────────────────────────────────────── */

/** Get articles (parts) list for a vehicle + category */
export async function getArticlesList(vehicleId, categoryId, manufacturerId, opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`articles/list/type-id/${typeId}/vehicle-id/${vehicleId}/category-id/${categoryId}/lang-id/${langId}`);
}

/** Get article details (specs + info) by article ID */
export async function getArticleDetailsById(articleId, opts = {}) {
  const { langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`articles/details/article-id/${articleId}/lang-id/${langId}`);
}

/** Get complete article details (full info + media + cross-refs) */
export async function getArticleCompleteDetails(articleId, opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId, countryFilterId = DEFAULTS.countryFilterId } = opts;
  return tecdocFetch(`articles/article-complete-details/type-id/${typeId}/article-id/${articleId}/lang-id/${langId}/country-filter-id/${countryFilterId}`);
}

/** Get all article specifications/criteria */
export async function getArticleSpecifications(articleId, opts = {}) {
  const { langId = DEFAULTS.langId, countryFilterId = DEFAULTS.countryFilterId } = opts;
  return tecdocFetch(`articles/selection-of-all-specifications-criterias-for-the-article/article-id/${articleId}/lang-id/${langId}/country-filter-id/${countryFilterId}`);
}

/** Get all media (images, diagrams) for an article */
export async function getArticleMedia(articleId, opts = {}) {
  const { langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`articles/article-all-media-info/article-id/${articleId}/lang-id/${langId}`);
}

/** Get compatible cars for an article number */
export async function getCompatibleCars(articleNo, opts = {}) {
  const { typeId = DEFAULTS.typeId, langId = DEFAULTS.langId, countryFilterId = DEFAULTS.countryFilterId } = opts;
  return tecdocFetch(`articles/get-compatible-cars-by-article-number/type-id/${typeId}/article-no/${encodeURIComponent(articleNo)}/lang-id/${langId}/country-filter-id/${countryFilterId}`);
}

/** Get cross-references for an article */
export async function getArticleCrossReferences(articleId, opts = {}) {
  const { langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`artlookup/select-article-cross-references/article-id/${articleId}/lang-id/${langId}`);
}

/** Search for analog spare parts by article number */
export async function searchAnalogParts(articleNo, opts = {}) {
  const { langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`artlookup/search-for-analog-spare-parts-by-the-articles-numbers/lang-id/${langId}/articleNo/${encodeURIComponent(articleNo)}`);
}

/** Search OEM cross-references through aftermarket part references */
export async function searchOemCrossReferences(oemNo) {
  return tecdocFetch(`artlookup/search-for-the-oem-cross-references-through-aftermarket-parts-references/article-oem-no/${encodeURIComponent(oemNo)}`);
}

/* ─────────────────────────────────────────────
 * SEARCH ENDPOINTS (Pro tier)
 * ───────────────────────────────────────────── */

/** Search articles by article number (e.g. "C2029") */
export async function searchArticlesByNumber(articleSearchNr, opts = {}) {
  const { langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`articles/search-by-article-no/lang-id/${langId}/article-no/${encodeURIComponent(articleSearchNr)}`);
}

/** Search articles by article number + supplier ID */
export async function searchArticlesByNumberAndSupplier(articleSearchNr, supplierId, opts = {}) {
  const { langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`articles/search-by-article-no/lang-id/${langId}/supplier-id/${supplierId}/article-no/${encodeURIComponent(articleSearchNr)}`);
}

/** Search by OEM number — returns all equal OEM cross-references */
export async function searchByOemNumber(oemNo, opts = {}) {
  const { langId = DEFAULTS.langId } = opts;
  return tecdocFetch(`articles-oem/search-all-equal-oem-no/lang-id/${langId}/article-oem-no/${encodeURIComponent(oemNo)}`);
}

/* ─────────────────────────────────────────────
 * VIN ENDPOINTS (Pro tier)
 * ───────────────────────────────────────────── */

/** VIN check — returns matching TecDoc vehicles for a VIN */
export async function vinCheck(vin) {
  return tecdocFetch(`vin/tecdoc-vin-check/${encodeURIComponent(vin)}`);
}

/** VIN decode v1 — basic info (make, model, year) */
export async function vinDecodeV1(vin) {
  return tecdocFetch(`vin/decoder-v1/${encodeURIComponent(vin)}`);
}

/** VIN decode v2 — full vehicle info (make, model, engine, specs) */
export async function vinDecode(vin) {
  return tecdocFetch(`vin/decoder-v2/${encodeURIComponent(vin)}`);
}

/** VIN decode v3 — detailed vehicle info with sections */
export async function vinDecodeV3(vin) {
  return tecdocFetch(`vin/decoder-v3/${encodeURIComponent(vin)}`);
}

/* ─────────────────────────────────────────────
 * HIGH-LEVEL HELPERS
 * ───────────────────────────────────────────── */

/**
 * Quick lookup: given an OEM code or part number, return matching articles
 * with cross-references and compatible vehicles.
 * Returns { articles: [...], crossRefs: [...], vehicles: [...] }
 */
export async function lookupByCode(code) {
  if (!code?.trim()) return { articles: [], crossRefs: [], vehicles: [] };

  const cleanCode = code.trim().replace(/[\s-]/g, "");

  // Try article number search first, then OEM search as fallback
  let data;
  try {
    data = await searchArticlesByNumber(cleanCode);
  } catch {
    data = null;
  }

  let articles = Array.isArray(data) ? data : (data?.articles || data?.data || []);

  // If no results from article search, try OEM search
  if (articles.length === 0) {
    try {
      const oemData = await searchByOemNumber(cleanCode);
      articles = Array.isArray(oemData) ? oemData : (oemData?.articles || oemData?.data || []);
    } catch { /* OEM search also failed */ }
  }

  // Extract cross-references and vehicle applications from articles
  const crossRefs = [];
  const vehicles = [];

  for (const art of articles) {
    // Cross-references (OEM numbers that match)
    if (art.oemNumbers && Array.isArray(art.oemNumbers)) {
      for (const oem of art.oemNumbers) {
        crossRefs.push({
          articleId: art.articleId || art.id,
          articleNo: art.articleNo || art.articleNumber,
          brandName: art.brandName || art.supplier,
          oemNumber: oem.oemNumber || oem,
          manufacturer: oem.manufacturer || oem.mfrName || "",
        });
      }
    }
    // Vehicle linkages
    if (art.vehicleLinkages && Array.isArray(art.vehicleLinkages)) {
      for (const vl of art.vehicleLinkages) {
        vehicles.push({
          articleId: art.articleId || art.id,
          vehicleId: vl.vehicleId || vl.id,
          make: vl.make || vl.manufacturer || "",
          model: vl.model || "",
          type: vl.type || vl.typeName || "",
          yearFrom: vl.yearFrom || vl.from || "",
          yearTo: vl.yearTo || vl.to || "",
        });
      }
    }
  }

  return { articles, crossRefs, vehicles };
}

/**
 * Check if TecDoc API is configured and reachable.
 * Uses the free-tier endpoint types/list-vehicles-type.
 */
export async function checkConnection() {
  try {
    const key = getApiKey();
    if (!key) return { ok: false, error: "API key non configurata", plan: null };
    // Use languages/list as health check (most reliable, free-tier)
    await tecdocFetch("languages/list", 8000);
    // Probe a Pro-only endpoint to detect plan level
    let plan = "basic";
    try {
      await tecdocFetch("manufacturers/list/type-id/1", 8000);
      plan = "pro";
    } catch { /* 404/timeout = basic plan */ }
    return { ok: true, plan };
  } catch (err) {
    return { ok: false, error: err.message, plan: null };
  }
}
