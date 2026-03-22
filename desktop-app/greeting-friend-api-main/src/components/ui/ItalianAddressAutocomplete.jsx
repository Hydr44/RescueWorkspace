/**
 * ItalianAddressAutocomplete
 * Autocomplete per Comune, CAP, Indirizzo italiani
 * Usa il dataset completo ~7900 comuni da comuniItaliani.js (GitHub matteocontrini/comuni-json)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { FiMapPin, FiLoader } from "react-icons/fi";
import { searchComuni as searchComuniAPI } from "../../lib/comuniItaliani";

/* ─── Fallback locale per ricerca CAP (comuni principali) ─── */
const CAP_FALLBACK = [
  { c: "MILANO", p: "MI", cap: ["20121","20122","20123","20124","20125"] },
  { c: "ROMA", p: "RM", cap: ["00118","00119","00121","00122","00123","00124","00125","00126","00127","00128","00129","00130","00131","00132","00133","00134","00135","00136","00137","00138","00139","00140","00141","00142","00143","00144","00145","00146","00147","00148","00149","00150","00151","00152","00153","00154","00155","00156","00157","00158","00159","00160","00161","00162","00163","00164","00165","00166","00167","00168","00169","00170","00171","00172","00173","00174","00175","00176","00177","00178","00179","00180","00181","00182","00183","00184","00185","00186","00187","00188","00189","00190","00191","00192","00193","00194","00195","00196","00197","00198","00199"] },
  { c: "NAPOLI", p: "NA", cap: ["80121","80122","80123","80124","80125","80126","80127","80128","80129","80130","80131","80132","80133","80134","80135","80136","80137","80138","80139","80140","80141","80142","80143","80144","80145","80146","80147"] },
  { c: "TORINO", p: "TO", cap: ["10121","10122","10123","10124","10125","10126","10127","10128","10129","10130","10131","10132","10133","10134","10135","10136","10137","10138","10139","10140","10141","10142","10143","10144","10145","10146","10147","10148","10149","10150","10151","10152","10153","10154","10155","10156"] },
  { c: "PALERMO", p: "PA", cap: ["90121","90122","90123","90124","90125","90126","90127","90128","90129","90130","90131","90132","90133","90134","90135","90136","90137","90138","90139","90140","90141","90142","90143","90144","90145","90146","90147","90148","90149","90151"] },
  { c: "GENOVA", p: "GE", cap: ["16121","16122","16123","16124","16125","16126","16127","16128","16129","16130","16131","16132","16133","16134","16135","16136","16137","16138","16139","16140","16141","16142","16143","16144","16145","16146","16147","16148","16149","16150","16151","16152","16153","16154","16155","16156","16157","16158","16159","16160","16161","16162","16163","16164","16165","16166","16167"] },
  { c: "BOLOGNA", p: "BO", cap: ["40121","40122","40123","40124","40125","40126","40127","40128","40129","40130","40131","40132","40133","40134","40135","40136","40137","40138","40139","40140","40141","40142","40143","40144","40145"] },
  { c: "FIRENZE", p: "FI", cap: ["50121","50122","50123","50124","50125","50126","50127","50128","50129","50130","50131","50132","50133","50134","50135","50136","50137","50138","50139","50140","50141","50142","50143","50144","50145"] },
  { c: "BARI", p: "BA", cap: ["70121","70122","70123","70124","70125","70126","70127","70128","70129","70130","70131","70132"] },
  { c: "CATANIA", p: "CT", cap: ["95121","95122","95123","95124","95125","95126","95127","95128","95129","95130","95131"] },
  { c: "VENEZIA", p: "VE", cap: ["30121","30122","30123","30124","30125","30126","30127","30128","30129","30130","30131","30132","30133","30134","30135","30136","30137","30138","30139","30140","30141","30142","30143","30144","30145","30146","30147","30148","30149","30150","30151","30152","30153","30154","30155","30156","30157","30158","30159","30160","30161","30162","30163","30164","30165","30166","30167","30168","30169","30170","30171","30172","30173","30174","30175","30176","30177","30178","30179","30180","30181","30182","30183","30184","30185","30186","30187","30188","30189","30190","30191","30192","30193","30194","30195","30196","30197","30198","30199"] },
  { c: "VERONA", p: "VR", cap: ["37121","37122","37123","37124","37125","37126","37127","37128","37129","37130","37131","37132","37133","37134","37135","37136","37137","37138","37139","37140","37141","37142","37143","37144"] },
  { c: "BRESCIA", p: "BS", cap: ["25121","25122","25123","25124","25125","25126","25127","25128","25129","25130","25131","25132","25133","25134","25135","25136"] },
  { c: "BERGAMO", p: "BG", cap: ["24121","24122","24123","24124","24125","24126","24127","24128","24129"] },
  { c: "PADOVA", p: "PD", cap: ["35121","35122","35123","35124","35125","35126","35127","35128","35129","35130","35131","35132","35133","35134","35135","35136","35137","35138","35139","35140","35141","35142","35143","35144"] },
  { c: "TRIESTE", p: "TS", cap: ["34121","34122","34123","34124","34125","34126","34127","34128","34129","34130","34131","34132","34133","34134","34135","34136","34137","34138","34139","34140","34141","34142","34143","34144","34145","34146","34147","34148","34149","34150","34151","34152","34153","34154","34155","34156","34157","34158","34159","34160","34161","34162","34163","34164","34165","34166","34167","34168","34169","34170","34171","34172","34173","34174","34175","34176","34177","34178","34179","34180","34181","34182","34183","34184","34185","34186","34187","34188","34189","34190","34191","34192","34193","34194","34195","34196","34197","34198","34199"] },
  { c: "MODENA", p: "MO", cap: ["41121","41122","41123","41124","41125","41126"] },
  { c: "PARMA", p: "PR", cap: ["43121","43122","43123","43124","43125","43126"] },
  { c: "REGGIO EMILIA", p: "RE", cap: ["42121","42122","42123","42124"] },
  { c: "PIACENZA", p: "PC", cap: ["29121","29122"] },
  { c: "RAVENNA", p: "RA", cap: ["48121","48122","48123","48124","48125"] },
  { c: "RIMINI", p: "RN", cap: ["47921","47922","47923","47924","47925"] },
  { c: "FERRARA", p: "FE", cap: ["44121","44122","44123","44124","44125","44126"] },
  { c: "FORLÌ", p: "FC", cap: ["47121","47122"] },
  { c: "CESENA", p: "FC", cap: ["47521","47522","47523"] },
  { c: "ANCONA", p: "AN", cap: ["60121","60122","60123","60124","60125","60126","60127","60128","60129","60130","60131"] },
  { c: "PERUGIA", p: "PG", cap: ["06121","06122","06123","06124","06125","06126","06127","06128","06129","06130","06131","06132","06133","06134","06135"] },
  { c: "TERNI", p: "TR", cap: ["05100"] },
  { c: "PESCARA", p: "PE", cap: ["65121","65122","65123","65124","65125","65126","65127","65128","65129"] },
  { c: "CHIETI", p: "CH", cap: ["66100"] },
  { c: "L'AQUILA", p: "AQ", cap: ["67100"] },
  { c: "TERAMO", p: "TE", cap: ["64100"] },
  { c: "CAMPOBASSO", p: "CB", cap: ["86100"] },
  { c: "SALERNO", p: "SA", cap: ["84121","84122","84123","84124","84125","84126","84127","84128","84129","84130","84131","84132","84133","84134","84135"] },
  { c: "CASERTA", p: "CE", cap: ["81100"] },
  { c: "AVELLINO", p: "AV", cap: ["83100"] },
  { c: "BENEVENTO", p: "BN", cap: ["82100"] },
  { c: "TARANTO", p: "TA", cap: ["74121","74122","74123"] },
  { c: "LECCE", p: "LE", cap: ["73100"] },
  { c: "BRINDISI", p: "BR", cap: ["72100"] },
  { c: "FOGGIA", p: "FG", cap: ["71100","71121","71122"] },
  { c: "BARLETTA", p: "BT", cap: ["76121"] },
  { c: "ANDRIA", p: "BT", cap: ["76123"] },
  { c: "TRANI", p: "BT", cap: ["76125"] },
  { c: "POTENZA", p: "PZ", cap: ["85100"] },
  { c: "MATERA", p: "MT", cap: ["75100"] },
  { c: "COSENZA", p: "CS", cap: ["87100"] },
  { c: "CATANZARO", p: "CZ", cap: ["88100"] },
  { c: "REGGIO CALABRIA", p: "RC", cap: ["89121","89122","89123","89124","89125","89126","89127","89128","89129","89130","89131","89132","89133","89134","89135","89136"] },
  { c: "CROTONE", p: "KR", cap: ["88900"] },
  { c: "VIBO VALENTIA", p: "VV", cap: ["89900"] },
  { c: "MESSINA", p: "ME", cap: ["98121","98122","98123","98124","98125","98126","98127","98128","98129","98130","98131","98132","98133","98134","98135","98136","98137","98138","98139","98140","98141","98142","98143","98144","98145","98146","98147","98148","98149","98150","98151","98152","98153","98154","98155","98156","98157","98158","98159","98160","98161","98162","98163","98164","98165","98166","98167","98168","98169","98170","98171","98172","98173","98174","98175","98176","98177","98178","98179","98180","98181","98182","98183","98184","98185","98186","98187","98188","98189","98190","98191","98192","98193","98194","98195","98196","98197","98198","98199"] },
  { c: "SIRACUSA", p: "SR", cap: ["96100"] },
  { c: "RAGUSA", p: "RG", cap: ["97100"] },
  { c: "AGRIGENTO", p: "AG", cap: ["92100"] },
  { c: "CALTANISSETTA", p: "CL", cap: ["93100"] },
  { c: "ENNA", p: "EN", cap: ["94100"] },
  { c: "TRAPANI", p: "TP", cap: ["91100"] },
  { c: "CAGLIARI", p: "CA", cap: ["09121","09122","09123","09124","09125","09126","09127","09128","09129","09130","09131","09132","09133","09134"] },
  { c: "SASSARI", p: "SS", cap: ["07100"] },
  { c: "NUORO", p: "NU", cap: ["08100"] },
  { c: "ORISTANO", p: "OR", cap: ["09170"] },
  { c: "OLBIA", p: "SS", cap: ["07026"] },
  { c: "TRENTO", p: "TN", cap: ["38121","38122","38123"] },
  { c: "BOLZANO", p: "BZ", cap: ["39100"] },
  { c: "UDINE", p: "UD", cap: ["33100"] },
  { c: "PORDENONE", p: "PN", cap: ["33170"] },
  { c: "GORIZIA", p: "GO", cap: ["34170"] },
  { c: "VICENZA", p: "VI", cap: ["36100"] },
  { c: "TREVISO", p: "TV", cap: ["31100"] },
  { c: "ROVIGO", p: "RO", cap: ["45100"] },
  { c: "BELLUNO", p: "BL", cap: ["32100"] },
  { c: "VARESE", p: "VA", cap: ["21100"] },
  { c: "COMO", p: "CO", cap: ["22100"] },
  { c: "LECCO", p: "LC", cap: ["23900"] },
  { c: "SONDRIO", p: "SO", cap: ["23100"] },
  { c: "LODI", p: "LO", cap: ["26900"] },
  { c: "CREMONA", p: "CR", cap: ["26100"] },
  { c: "MANTOVA", p: "MN", cap: ["46100"] },
  { c: "PAVIA", p: "PV", cap: ["27100"] },
  { c: "MONZA", p: "MB", cap: ["20900"] },
  { c: "BUSTO ARSIZIO", p: "VA", cap: ["21052"] },
  { c: "NOVARA", p: "NO", cap: ["28100"] },
  { c: "VERBANIA", p: "VB", cap: ["28900"] },
  { c: "BIELLA", p: "BI", cap: ["13900"] },
  { c: "VERCELLI", p: "VC", cap: ["13100"] },
  { c: "ASTI", p: "AT", cap: ["14100"] },
  { c: "ALESSANDRIA", p: "AL", cap: ["15100","15121","15122"] },
  { c: "CUNEO", p: "CN", cap: ["12100"] },
  { c: "AOSTA", p: "AO", cap: ["11100"] },
  { c: "IMPERIA", p: "IM", cap: ["18100"] },
  { c: "SAVONA", p: "SV", cap: ["17100"] },
  { c: "LA SPEZIA", p: "SP", cap: ["19121","19122","19123","19124","19125","19126"] },
  { c: "SANREMO", p: "IM", cap: ["18038"] },
  { c: "LIVORNO", p: "LI", cap: ["57121","57122","57123","57124","57125","57126","57127","57128","57129","57130"] },
  { c: "PISA", p: "PI", cap: ["56121","56122","56123","56124","56125","56126","56127","56128","56129"] },
  { c: "LUCCA", p: "LU", cap: ["55100"] },
  { c: "PISTOIA", p: "PT", cap: ["51100"] },
  { c: "PRATO", p: "PO", cap: ["59100"] },
  { c: "AREZZO", p: "AR", cap: ["52100"] },
  { c: "SIENA", p: "SI", cap: ["53100"] },
  { c: "GROSSETO", p: "GR", cap: ["58100"] },
  { c: "MACERATA", p: "MC", cap: ["62100"] },
  { c: "ASCOLI PICENO", p: "AP", cap: ["63100"] },
  { c: "FERMO", p: "FM", cap: ["63900"] },
  { c: "PESARO", p: "PU", cap: ["61121","61122"] },
  { c: "LATINA", p: "LT", cap: ["04100"] },
  { c: "FROSINONE", p: "FR", cap: ["03100"] },
  { c: "VITERBO", p: "VT", cap: ["01100"] },
  { c: "RIETI", p: "RI", cap: ["02100"] },
  { c: "GIUGLIANO IN CAMPANIA", p: "NA", cap: ["80014"] },
  { c: "TORRE DEL GRECO", p: "NA", cap: ["80059"] },
  { c: "MESTRE", p: "VE", cap: ["30170","30171","30172","30173","30174","30175"] },
  { c: "IMOLA", p: "BO", cap: ["40026"] },
  { c: "CARPI", p: "MO", cap: ["41012"] },
  { c: "SASSUOLO", p: "MO", cap: ["41049"] },
  { c: "FAENZA", p: "RA", cap: ["48018"] },
  { c: "FOLIGNO", p: "PG", cap: ["06034"] },
  { c: "SPOLETO", p: "PG", cap: ["06049"] },
  { c: "SENIGALLIA", p: "AN", cap: ["60019"] },
  { c: "FANO", p: "PU", cap: ["61032"] },
  { c: "VASTO", p: "CH", cap: ["66054"] },
  { c: "ALTAMURA", p: "BA", cap: ["70022"] },
  { c: "MOLFETTA", p: "BA", cap: ["70056"] },
  { c: "MARSALA", p: "TP", cap: ["91025"] },
  { c: "GELA", p: "CL", cap: ["93012"] },
  { c: "ALGHERO", p: "SS", cap: ["07041"] },
  { c: "ROVERETO", p: "TN", cap: ["38068"] },
  { c: "MERANO", p: "BZ", cap: ["39012"] },
  { c: "BRESSANONE", p: "BZ", cap: ["39042"] },
];

function searchCapFallback(cap) {
  if (!cap || cap.length < 4) return null;
  for (const c of CAP_FALLBACK) {
    if (c.cap.some(p => p.startsWith(cap))) return c;
  }
  return null;
}

const inputCls = "w-full px-2.5 py-1.5 bg-gray-900 border border-gray-700 rounded text-gray-100 text-sm disabled:opacity-50 focus:border-blue-500 focus:outline-none transition-colors";

export default function ItalianAddressAutocomplete({
  prefix,
  form,
  onChange,
  disabled = false,
  showIndirizzo = true,
  sectionLabel = "",
}) {
  const [comuneQuery, setComuneQuery] = useState(form[`${prefix}_comune_id`] || "");
  const [comuneSuggestions, setComuneSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingComuni, setLoadingComuni] = useState(false);
  const [capSuggestions, setCapSuggestions] = useState([]);
  const [showCapSuggestions, setShowCapSuggestions] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setComuneQuery(form[`${prefix}_comune_id`] || "");
  }, [form, prefix]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setShowCapSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleComuneChange = useCallback((e) => {
    const val = e.target.value;
    setComuneQuery(val);
    onChange(`${prefix}_comune_id`, val);
    clearTimeout(debounceRef.current);
    if (val.length < 2) { setComuneSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingComuni(true);
      try {
        const results = await searchComuniAPI(val);
        setComuneSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setComuneSuggestions([]);
      } finally {
        setLoadingComuni(false);
      }
    }, 250);
  }, [onChange, prefix]);

  const handleComuneSelect = useCallback((comune) => {
    const lbl = `${comune.nome} (${comune.sigla})`;
    setComuneQuery(lbl);
    onChange(`${prefix}_comune_id`, lbl);
    if (comune.cap) {
      onChange(`${prefix}_cap`, comune.cap);
    }
    setShowSuggestions(false);
    setShowCapSuggestions(false);
  }, [onChange, prefix]);

  const handleCapChange = useCallback((e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 5);
    onChange(`${prefix}_cap`, val);
    if (val.length >= 4) {
      const found = searchCapFallback(val);
      if (found) {
        const lbl = `${found.c} (${found.p})`;
        setComuneQuery(lbl);
        onChange(`${prefix}_comune_id`, lbl);
        if (val.length === 5) {
          const matchCap = found.cap.find(c => c === val) || found.cap[0];
          if (matchCap) onChange(`${prefix}_cap`, matchCap);
        }
      }
    }
  }, [onChange, prefix]);

  return (
    <div ref={containerRef} className="space-y-2">
      {sectionLabel && (
        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{sectionLabel}</p>
      )}

      {showIndirizzo && (
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-3">
            <label className="block text-xs text-gray-400 mb-1">Indirizzo</label>
            <input
              type="text"
              value={form[`${prefix}_indirizzo`] || ""}
              onChange={(e) => onChange(`${prefix}_indirizzo`, e.target.value)}
              disabled={disabled}
              placeholder="Via Roma"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Civico</label>
            <input
              type="text"
              value={form[`${prefix}_civico`] || ""}
              onChange={(e) => onChange(`${prefix}_civico`, e.target.value)}
              disabled={disabled}
              placeholder="1"
              maxLength={10}
              className={inputCls}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-2">
        {/* Comune autocomplete — dataset completo ~7900 comuni */}
        <div className="col-span-3 relative">
          <label className="block text-xs text-gray-400 mb-1">
            <FiMapPin className="inline w-3 h-3 mr-0.5" />Comune
          </label>
          <div className="relative">
            <input
              type="text"
              value={comuneQuery}
              onChange={handleComuneChange}
              onFocus={() => {
                if (comuneQuery.length >= 2 && comuneSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              disabled={disabled}
              placeholder="Es. Milano"
              className={inputCls}
              autoComplete="off"
            />
            {loadingComuni && (
              <FiLoader className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 animate-spin" />
            )}
          </div>
          {showSuggestions && comuneSuggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-gray-800 border border-gray-600 rounded shadow-xl max-h-48 overflow-y-auto">
              {comuneSuggestions.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => handleComuneSelect(c)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center justify-between"
                >
                  <span className="font-medium">{c.nome}</span>
                  <span className="text-xs text-gray-400 ml-2">({c.sigla}) {c.cap && `— ${c.cap}`}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CAP con reverse-lookup fallback */}
        <div className="relative">
          <label className="block text-xs text-gray-400 mb-1">CAP</label>
          <input
            type="text"
            value={form[`${prefix}_cap`] || ""}
            onChange={handleCapChange}
            onFocus={() => {
              const cap = form[`${prefix}_cap`];
              if (cap && cap.length >= 4) {
                const found = searchCapFallback(cap);
                if (found && found.cap.length > 1) {
                  setCapSuggestions(found.cap.filter(c => c.startsWith(cap)));
                  setShowCapSuggestions(true);
                }
              }
            }}
            disabled={disabled}
            placeholder="20121"
            maxLength={5}
            className={`${inputCls} font-mono`}
            autoComplete="off"
          />
          {showCapSuggestions && capSuggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-gray-800 border border-gray-600 rounded shadow-xl max-h-32 overflow-y-auto">
              {capSuggestions.map((cap, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => {
                    onChange(`${prefix}_cap`, cap);
                    setShowCapSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm font-mono text-gray-200 hover:bg-gray-700"
                >
                  {cap}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nazione */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nazione</label>
          <input
            type="text"
            value={form[`${prefix}_nazione_id`] || "IT"}
            onChange={(e) => onChange(`${prefix}_nazione_id`, e.target.value.toUpperCase().slice(0, 2))}
            disabled={disabled}
            placeholder="IT"
            maxLength={2}
            className={`${inputCls} uppercase font-mono`}
          />
        </div>
      </div>
    </div>
  );
}
