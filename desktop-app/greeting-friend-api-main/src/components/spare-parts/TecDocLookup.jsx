/**
 * TecDocLookup — Search TecDoc catalog by OEM code, part number, or vehicle
 * Provides: part identification, cross-references, compatible vehicles
 *
 * Usage:
 *   <TecDocLookup onSelectPart={(partData) => { ... }} />
 *
 * @author haxies
 * @created 2026
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiSearch, FiX, FiLoader, FiAlertTriangle, FiCheck,
  FiChevronRight, FiPackage, FiTruck, FiRefreshCw, FiExternalLink,
  FiHash, FiTag, FiList, FiInfo
} from "react-icons/fi";
import {
  searchArticlesByNumber,
  searchByOemNumber,
  getManufacturers,
  getModels,
  getVehicleEngineTypes,
  getCategories,
  getCategoryV1,
  getArticlesList,
  getArticleCompleteDetails,
  checkConnection,
} from "@/lib/tecdoc";

/* ─── Helpers ─── */

/** Flatten V2 nested category object into array */
function flattenV2Categories(obj, prefix = "") {
  const result = [];
  for (const [, val] of Object.entries(obj)) {
    if (val?.categoryId) {
      result.push({ categoryId: val.categoryId, categoryName: prefix ? `${prefix} › ${val.categoryName}` : val.categoryName });
    }
    if (val?.children && typeof val.children === "object") {
      result.push(...flattenV2Categories(val.children, val.categoryName || prefix));
    }
  }
  return result;
}

/** Flatten V1 flat category rows (categoryName1/categoryId1, categoryName2/categoryId2, ...) */
function flattenV1Categories(rows) {
  const seen = new Set();
  const result = [];
  for (const row of rows) {
    for (let i = 1; i <= 4; i++) {
      const id = row[`categoryId${i}`];
      const name = row[`categoryName${i}`];
      if (id && name && !seen.has(id)) {
        seen.add(id);
        result.push({ categoryId: id, categoryName: i > 1 ? `${"› ".repeat(i - 1)}${name}` : name });
      }
    }
  }
  return result;
}

/** Parse any category response format into flat array */
function flattenCategories(data) {
  // V2 nested object
  if (typeof data === "object" && !Array.isArray(data)) {
    return flattenV2Categories(data);
  }
  // V1 array of flat rows
  if (Array.isArray(data) && data[0]?.categoryName1) {
    return flattenV1Categories(data);
  }
  return Array.isArray(data) ? data : [];
}

/* ─── Styles ─── */
const inputCls = "w-full h-9 px-3 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500/30 outline-none transition bg-[#141c27] text-slate-200 placeholder-slate-600 border-[#243044]";
const selectCls = "w-full h-9 px-3 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500/30 outline-none transition bg-[#141c27] text-slate-200 border-[#243044]";
const btnPrimary = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium bg-[#1a2536] text-slate-300 border border-[#243044] hover:bg-[#243044] transition-colors disabled:opacity-50";

export default function TecDocLookup({ onSelectPart, initialCode = "" }) {
  /* ─── State ─── */
  const [mode, setMode] = useState("code"); // "code" | "vehicle"
  const [connected, setConnected] = useState(null); // null=checking, true, false
  const [plan, setPlan] = useState(null); // "basic" | "pro"

  // Code search
  const [searchCode, setSearchCode] = useState(initialCode);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);

  // Vehicle browse
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [engines, setEngines] = useState([]);
  const [categories_list, setCategoriesList] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedMfr, setSelectedMfr] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedEngine, setSelectedEngine] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loadingStep, setLoadingStep] = useState(null);

  // Article detail
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleDetail, setArticleDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const searchInputRef = useRef(null);

  const [connectionError, setConnectionError] = useState(null);

  /* ─── Check connection on mount ─── */
  const doCheckConnection = useCallback(() => {
    setConnectionError(null);
    checkConnection().then(r => {
      setConnected(r.ok);
      if (r.plan) setPlan(r.plan);
      if (!r.ok) setConnectionError(r.error || "Servizio non raggiungibile");
    });
  }, []);

  useEffect(() => { doCheckConnection(); }, [doCheckConnection]);

  /* ─── Auto-search if initialCode provided ─── */
  useEffect(() => {
    if (initialCode?.trim()) {
      setSearchCode(initialCode.trim());
      handleCodeSearch(initialCode.trim());
    }
  }, [initialCode]); // eslint-disable-line

  /* ─── Code Search ─── */
  const handleCodeSearch = useCallback(async (code) => {
    const q = (code || searchCode).trim();
    if (!q) return;

    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedArticle(null);
    setArticleDetail(null);

    try {
      // Try article number search first
      let data = await searchArticlesByNumber(q);
      let results = Array.isArray(data) ? data : (data?.articles || data?.data || data?.array || []);

      // If no results, try OEM number search as fallback
      if (results.length === 0) {
        try {
          data = await searchByOemNumber(q);
          results = Array.isArray(data) ? data : (data?.articles || data?.data || []);
        } catch { /* OEM search also failed */ }
      }

      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("Nessun risultato trovato per questo codice.");
      }
    } catch (err) {
      console.error("[TecDoc] Search error:", err);
      if (err.message?.includes("404")) {
        setSearchError("Ricerca articoli non disponibile con il piano Basic. Passa al piano Pro su RapidAPI per sbloccare questa funzione.");
      } else {
        setSearchError(err.message || "Errore nella ricerca");
      }
    } finally {
      setSearching(false);
    }
  }, [searchCode]);

  /* ─── Vehicle Browse: Load manufacturers ─── */
  const loadManufacturers = useCallback(async () => {
    setLoadingStep("manufacturers");
    try {
      const data = await getManufacturers();
      const list = Array.isArray(data) ? data : (data?.manufacturers || data?.data || []);
      setManufacturers(list);
    } catch (err) {
      console.error("[TecDoc] Manufacturers error:", err);
    } finally {
      setLoadingStep(null);
    }
  }, []);

  useEffect(() => {
    if (mode === "vehicle" && manufacturers.length === 0) {
      loadManufacturers();
    }
  }, [mode]); // eslint-disable-line

  /* ─── Vehicle Browse: Load models when manufacturer changes ─── */
  useEffect(() => {
    if (!selectedMfr) { setModels([]); setSelectedModel(""); return; }
    setLoadingStep("models");
    setModels([]);
    setSelectedModel("");
    setEngines([]);
    setSelectedEngine("");
    setCategoriesList([]);
    setSelectedCategory("");
    setArticles([]);

    getModels(selectedMfr)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.models || data?.data || []);
        setModels(list);
      })
      .catch(err => {
        console.error("[TecDoc] Models error:", err);
        if (err.message?.includes("404")) setPlan("basic");
      })
      .finally(() => setLoadingStep(null));
  }, [selectedMfr]);

  /* ─── Vehicle Browse: Load engines when model changes ─── */
  useEffect(() => {
    if (!selectedModel || !selectedMfr) { setEngines([]); setSelectedEngine(""); return; }
    setLoadingStep("engines");
    setEngines([]);
    setSelectedEngine("");
    setCategoriesList([]);
    setSelectedCategory("");
    setArticles([]);

    getVehicleEngineTypes(selectedModel, selectedMfr)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.modelTypes || data?.data || []);
        setEngines(list);
      })
      .catch(err => console.error("[TecDoc] Engines error:", err))
      .finally(() => setLoadingStep(null));
  }, [selectedModel, selectedMfr]);

  /* ─── Vehicle Browse: Load categories when engine changes ─── */
  useEffect(() => {
    if (!selectedEngine || !selectedMfr) { setCategoriesList([]); setSelectedCategory(""); return; }
    setLoadingStep("categories");
    setCategoriesList([]);
    setSelectedCategory("");
    setArticles([]);

    // Try V2 (tree) first, fallback to V1 (flat) if V2 fails (some vehicleIds cause 500)
    const parseResponse = (data) => {
      const inner = data?.categories || data?.data || data;
      return flattenCategories(inner);
    };

    getCategories(selectedEngine, selectedMfr)
      .then(data => setCategoriesList(parseResponse(data)))
      .catch(() => {
        // V2 failed (500) — fallback to V1
        return getCategoryV1(selectedEngine)
          .then(data => setCategoriesList(parseResponse(data)))
          .catch(err => console.error("[TecDoc] Categories V1 fallback error:", err));
      })
      .finally(() => setLoadingStep(null));
  }, [selectedEngine, selectedMfr]);

  /* ─── Vehicle Browse: Load articles when category changes ─── */
  useEffect(() => {
    if (!selectedCategory || !selectedEngine || !selectedMfr) { setArticles([]); return; }
    setLoadingStep("articles");
    setArticles([]);

    getArticlesList(selectedEngine, selectedCategory, selectedMfr)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.articles || data?.data || []);
        setArticles(list);
      })
      .catch(err => console.error("[TecDoc] Articles error:", err))
      .finally(() => setLoadingStep(null));
  }, [selectedCategory, selectedEngine, selectedMfr]);

  /* ─── Load article detail ─── */
  const loadArticleDetail = useCallback(async (article) => {
    setSelectedArticle(article);
    const artId = article.articleId || article.id;
    if (!artId) return;

    setLoadingDetail(true);
    setArticleDetail(null);
    try {
      const data = await getArticleCompleteDetails(artId);
      setArticleDetail(data);
    } catch (err) {
      console.error("[TecDoc] Article detail error:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  /* ─── Select part → callback to parent ─── */
  const handleSelectPart = useCallback((article, detail) => {
    const art = detail?.article || article;
    const partData = {
      tecdoc_article_id: art.articleId || article.articleId || "",
      name: art.articleProductName || article.articleProductName || "",
      oem_code: art.articleNo || article.articleNo || "",
      brand: art.supplierName || article.supplierName || "",
      description: art.articleProductName || article.articleProductName || "",
      ean_code: detail?.articleEanNo?.[0]?.eanNo || "",
      cross_references: detail?.articleOemNo || [],
      compatible_vehicles: detail?.compatibleCars || [],
      specifications: detail?.articleAllSpecifications || [],
      images: art.s3image ? [art.s3image] : (art.articleMediaFileName ? [`https://fsn1.your-objectstorage.com/tecdoc2025/media_files/images/${art.articleMediaFileName}`] : []),
    };
    onSelectPart?.(partData);
  }, [onSelectPart]);

  /* ─── Not connected ─── */
  if (connected === false) {
    const isTimeout = connectionError?.includes("timeout") || connectionError?.includes("502") || connectionError?.includes("503");
    const isMissingKey = connectionError?.includes("non configurata");
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <FiAlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium text-amber-400">
            {isTimeout ? "Servizio TecDoc temporaneamente non disponibile" : isMissingKey ? "TecDoc non configurato" : "Errore connessione TecDoc"}
          </span>
        </div>
        {isTimeout ? (
          <>
            <p className="text-xs text-slate-400 mb-3">
              Il servizio TecDoc su RapidAPI non risponde. Potrebbe essere un problema temporaneo del provider.
            </p>
            <button onClick={doCheckConnection} className={btnPrimary}>
              <FiRefreshCw className="w-3.5 h-3.5" /> Riprova
            </button>
          </>
        ) : isMissingKey ? (
          <>
            <p className="text-xs text-slate-400 mb-2">
              Per usare il catalogo TecDoc, aggiungi la chiave API nel file <code className="bg-[#141c27] px-1 rounded">.env</code>:
            </p>
            <pre className="text-[10px] bg-[#141c27] rounded-lg p-2 text-slate-300 overflow-x-auto">
{`VITE_TECDOC_API_KEY=la_tua_chiave_rapidapi`}
            </pre>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-1">{connectionError}</p>
            <button onClick={doCheckConnection} className={`${btnPrimary} mt-2`}>
              <FiRefreshCw className="w-3.5 h-3.5" /> Riprova
            </button>
          </>
        )}
        <p className="text-[10px] text-slate-500 mt-2">
          Verifica lo stato su{" "}
          <a href="https://rapidapi.com/makingdatameaningful/api/auto-parts-catalog" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            RapidAPI <FiExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        </p>
      </div>
    );
  }

  /* ─── Still checking ─── */
  if (connected === null) {
    return (
      <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-4 flex items-center gap-2">
        <FiLoader className="w-4 h-4 text-blue-400 animate-spin" />
        <span className="text-xs text-slate-400">Verifica connessione TecDoc...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#1a2536] border border-[#243044] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#243044] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-lg">
            <FiPackage className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-200">Catalogo TecDoc</h3>
            <p className="text-[10px] text-slate-500">Cerca ricambi per codice OEM o per veicolo</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FiCheck className="w-2.5 h-2.5" /> Connesso
          </span>
          {plan && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
              plan === "pro" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
            }`}>
              {plan === "pro" ? "Pro" : "Basic"}
            </span>
          )}
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-[#243044]">
        <button
          onClick={() => setMode("code")}
          className={`flex-1 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            mode === "code" ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <FiHash className="w-3 h-3 inline mr-1.5" />
          Cerca per Codice
        </button>
        <button
          onClick={() => setMode("vehicle")}
          className={`flex-1 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            mode === "vehicle" ? "border-blue-500 text-blue-400 bg-blue-500/5" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <FiTruck className="w-3 h-3 inline mr-1.5" />
          Cerca per Veicolo
        </button>
      </div>

      <div className="p-4">
        {/* ═══ CODE SEARCH MODE ═══ */}
        {mode === "code" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchCode}
                  onChange={e => setSearchCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCodeSearch()}
                  placeholder="Codice OEM, EAN, o numero articolo..."
                  className={`${inputCls} pl-9`}
                />
              </div>
              <button onClick={() => handleCodeSearch()} disabled={searching || !searchCode.trim()} className={btnPrimary}>
                {searching ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiSearch className="w-3 h-3" />}
                Cerca
              </button>
            </div>

            {/* Search Error */}
            {searchError && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-center gap-2">
                <FiAlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-amber-400 text-xs">{searchError}</p>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  {searchResults.length} risultat{searchResults.length === 1 ? "o" : "i"}
                </p>
                {searchResults.map((art, i) => (
                  <ArticleRow
                    key={art.articleId || art.id || i}
                    article={art}
                    selected={selectedArticle?.articleId === art.articleId || selectedArticle?.id === art.id}
                    onSelect={() => loadArticleDetail(art)}
                    onUse={() => handleSelectPart(art, articleDetail)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ VEHICLE BROWSE MODE ═══ */}
        {mode === "vehicle" && (
          <div className="space-y-3">
            {/* Step 1: Manufacturer */}
            <div>
              <label className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                1. Marca
              </label>
              <select
                value={selectedMfr}
                onChange={e => setSelectedMfr(e.target.value)}
                className={selectCls}
                disabled={loadingStep === "manufacturers"}
              >
                <option value="">
                  {loadingStep === "manufacturers" ? "Caricamento..." : "Seleziona marca..."}
                </option>
                {manufacturers.map((m, idx) => (
                  <option key={`mfr-${m.manufacturerId || m.id}-${idx}`} value={m.manufacturerId || m.id}>
                    {m.manufacturerName || m.name || m.mfrName}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Model */}
            {selectedMfr && (
              <div>
                <label className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                  2. Modello
                </label>
                {plan === "basic" && models.length === 0 && loadingStep !== "models" ? (
                  <UpgradePrompt feature="modelli, ricerca articoli e cross-reference" />
                ) : (
                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className={selectCls}
                    disabled={loadingStep === "models"}
                  >
                    <option value="">
                      {loadingStep === "models" ? "Caricamento..." : "Seleziona modello..."}
                    </option>
                    {models.map(m => (
                      <option key={m.modelId || m.id} value={m.modelId || m.id}>
                        {m.modelName || m.name}
                        {m.modelYearFrom ? ` (${m.modelYearFrom.substring(0,4)}${m.modelYearTo ? `–${m.modelYearTo.substring(0,4)}` : "+"})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Step 3: Engine */}
            {selectedModel && (
              <div>
                <label className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                  3. Motorizzazione
                </label>
                <select
                  value={selectedEngine}
                  onChange={e => setSelectedEngine(e.target.value)}
                  className={selectCls}
                  disabled={loadingStep === "engines"}
                >
                  <option value="">
                    {loadingStep === "engines" ? "Caricamento..." : "Seleziona motorizzazione..."}
                  </option>
                  {engines.map(e => (
                    <option key={e.vehicleId || e.id} value={e.vehicleId || e.id}>
                      {e.typeEngineName || e.typeName || e.name || e.description}
                      {e.powerKw ? ` — ${e.powerKw}kW/${e.powerPs}CV` : ""}
                      {e.engineCodes ? ` (${e.engineCodes})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 4: Category */}
            {selectedEngine && (
              <div>
                <label className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                  4. Categoria Ricambio
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className={selectCls}
                  disabled={loadingStep === "categories"}
                >
                  <option value="">
                    {loadingStep === "categories" ? "Caricamento..." : "Seleziona categoria..."}
                  </option>
                  {categories_list.map(c => (
                    <option key={c.categoryId || c.id} value={c.categoryId || c.id}>
                      {c.categoryName || c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Loading indicator */}
            {loadingStep === "articles" && (
              <div className="flex items-center gap-2 py-2">
                <FiLoader className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span className="text-xs text-slate-400">Caricamento ricambi...</span>
              </div>
            )}

            {/* Articles list */}
            {articles.length > 0 && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  {articles.length} ricambi trovati
                </p>
                {articles.map((art, i) => (
                  <ArticleRow
                    key={art.articleId || art.id || i}
                    article={art}
                    selected={selectedArticle?.articleId === art.articleId}
                    onSelect={() => loadArticleDetail(art)}
                    onUse={() => handleSelectPart(art, articleDetail)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ ARTICLE DETAIL PANEL ═══ */}
        {selectedArticle && (
          <div className="mt-4 pt-4 border-t border-[#243044]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <FiInfo className="w-3.5 h-3.5 text-blue-400" />
                Dettaglio Articolo
              </h4>
              <button onClick={() => { setSelectedArticle(null); setArticleDetail(null); }} className="p-1 text-slate-500 hover:text-slate-300">
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex items-center gap-2 py-4 justify-center">
                <FiLoader className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs text-slate-400">Caricamento dettagli...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Articolo:</span>
                    <div className="font-mono text-slate-200">{selectedArticle.articleNo || selectedArticle.articleNumber || "—"}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Marca:</span>
                    <div className="text-slate-200">{selectedArticle.supplierName || selectedArticle.brandName || "—"}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Descrizione:</span>
                    <div className="text-slate-200">{selectedArticle.articleProductName || selectedArticle.articleName || selectedArticle.description || "—"}</div>
                  </div>
                </div>

                {/* Article image */}
                {(articleDetail?.article?.s3image || selectedArticle.s3image) && (
                  <div className="flex justify-center">
                    <img
                      src={articleDetail?.article?.s3image || selectedArticle.s3image}
                      alt={selectedArticle.articleProductName || ""}
                      className="max-h-32 rounded-lg border border-[#243044]"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* EAN codes */}
                {articleDetail?.articleEanNo?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">EAN</p>
                    <div className="flex flex-wrap gap-1">
                      {articleDetail.articleEanNo.map((ean, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {ean.eanNo || ean}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cross-references (OEM numbers) */}
                {articleDetail?.articleOemNo?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                      <FiRefreshCw className="w-3 h-3 inline mr-1" />
                      Cross-Reference OEM ({articleDetail.articleOemNo.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {articleDetail.articleOemNo.slice(0, 30).map((oem, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {oem.oemDisplayNo || oem.oemNo || oem}
                          {oem.oemBrand ? <span className="ml-1 text-purple-500/60">({oem.oemBrand})</span> : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compatible vehicles */}
                {articleDetail?.compatibleCars?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                      <FiTruck className="w-3 h-3 inline mr-1" />
                      Veicoli Compatibili ({articleDetail.compatibleCars.length})
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-0.5">
                      {articleDetail.compatibleCars.slice(0, 30).map((vl, i) => (
                        <div key={i} className="text-[10px] text-slate-400 flex items-center gap-1">
                          <FiChevronRight className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
                          <span>{vl.manufacturerName || ""} {vl.modelName || ""} {vl.typeEngineName || ""}</span>
                          {vl.constructionIntervalStart && (
                            <span className="text-slate-600">({vl.constructionIntervalStart.substring(0,4)}{vl.constructionIntervalEnd ? `–${vl.constructionIntervalEnd.substring(0,4)}` : "+"})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specifications */}
                {articleDetail?.articleAllSpecifications?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                      <FiList className="w-3 h-3 inline mr-1" />
                      Specifiche Tecniche
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {articleDetail.articleAllSpecifications.slice(0, 20).map((attr, i) => (
                        <div key={i} className="text-[10px] flex justify-between">
                          <span className="text-slate-500">{attr.criteriaName || attr.attributeName || attr.name}:</span>
                          <span className="text-slate-300 font-medium">{attr.criteriaValue || attr.attributeValue || attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Use this part button */}
                <button
                  onClick={() => handleSelectPart(selectedArticle, articleDetail)}
                  className={`${btnPrimary} w-full justify-center py-2`}
                >
                  <FiCheck className="w-3.5 h-3.5" />
                  Usa questo ricambio
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Upgrade Prompt Sub-component ─── */
function UpgradePrompt({ feature }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <FiAlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-amber-400 font-medium">Piano Pro richiesto</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Per accedere a {feature}, è necessario il piano Pro ($29/mese) su RapidAPI.
          </p>
          <a
            href="https://rapidapi.com/makingdatameaningful/api/auto-parts-catalog/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 text-[10px] font-medium rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            <FiExternalLink className="w-2.5 h-2.5" />
            Vai ai piani RapidAPI
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Article Row Sub-component ─── */
function ArticleRow({ article, selected, onSelect, onUse }) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        selected ? "bg-blue-500/10 border border-blue-500/20" : "bg-[#141c27] border border-[#243044] hover:border-blue-500/20"
      }`}
      onClick={onSelect}
      onKeyDown={e => e.key === "Enter" && onSelect()}
      role="button"
      tabIndex={0}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {article.articleNo || article.articleNumber || "—"}
          </span>
          <span className="text-xs text-slate-400 truncate">
            {article.supplierName || article.brandName || ""}
          </span>
        </div>
        <p className="text-xs text-slate-200 mt-0.5 truncate">
          {article.articleProductName || article.articleName || article.description || "Articolo"}
        </p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onUse(); }}
        className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors flex-shrink-0"
        title="Usa questo ricambio"
      >
        <FiCheck className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
