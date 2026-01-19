// ===============================
// COORDENADAS
// ===============================
const ACCIDENT_LOCATION = [-4.56501, 38.009188];
const ATOCHA_LOCATION = [-3.6888561997808353, 40.40483658419843];
const MARIA_ZAMBRANO_LOCATION = [-4.432355637473907, 36.71170431963949];
const CORDOBA_LOCATION = [-4.788825207081348, 37.88831972965772];
const MORON_LOCATION = [-5.45, 37.12];

// ===============================
// CAPÍTULOS
// ===============================
const CHAPTERS = {
    0: { center: [-3.8094642278958655, 39.1540240706266], zoom: 5.5, pitch: 0, bearing: 0, duration: 2000 },
    1: { center: ATOCHA_LOCATION, zoom: 7, pitch: 45, bearing: 0, duration: 2500 },
    2: { center: MARIA_ZAMBRANO_LOCATION, zoom: 7, pitch: 45, bearing: 0, duration: 2500 },
    3: { center: CORDOBA_LOCATION, zoom: 8, pitch: 45, bearing: 0, duration: 2500 },
    4: { center: ACCIDENT_LOCATION, zoom: 17, pitch: 60, bearing: 0, duration: 3000 },
    5: { center: ACCIDENT_LOCATION, zoom: 12, pitch: 45, bearing: 90, duration: 2500 },
    6: { center: ACCIDENT_LOCATION, zoom: 12, pitch: 30, bearing: 0, duration: 2500 },
    7: { center: MORON_LOCATION, zoom: 9, pitch: 30, bearing: 0, duration: 2500 },
    8: { center: [-3.8094642278958655, 39.1540240706266], zoom: 5.5, pitch: 0, bearing: 0, duration: 2000 }
};

// ===============================
// MAPA
// ===============================
const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {
            'pnoa-wms': {
                type: 'raster',
                tiles: [
                    'https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OI.OrthoimageCoverage&STYLE=default&FORMAT=image/jpeg&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}'
                ],
                tileSize: 256,
                attribution: '© Instituto Geográfico Nacional de España'
            }
        },
        layers: [
            {
                id: 'base-pnoa',
                type: 'raster',
                source: 'pnoa-wms',
                minzoom: 0,
                maxzoom: 20
            }
        ]
    },
    center: [-3.8094642278958655, 39.1540240706266],
    zoom: 5.5,
    pitch: 0,
    bearing: 0,
    maxZoom: 20,
    minZoom: 5,
    interactive: false
});

// ===============================
// VARIABLES
// ===============================
let atochaMarker, mariaZambranoMarker, cordobaMarker, accidentMarker, moronMarker;
let currentChapter = -1;
let mapLoaded = false;
let accidentAnimationPlayed = false;

// ===============================
// LOAD
// ===============================
map.on('load', () => {

    // ===== PMTILES =====
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    // 🔹 PMTiles principal
    map.addSource('linea_madrid_malaga', {
        type: 'vector',
        url: 'pmtiles://./linea_madrid_malaga.pmtiles'
    });

    // 🔹 PMTiles secundario (desplazado)
    map.addSource('ruta2', {
        type: 'vector',
        url: 'pmtiles://./ruta2.pmtiles'
    });

    // Línea secundaria (primero, desplazada)
    map.addLayer({
        id: 'ruta2',
        type: 'line',
        source: 'ruta2',
        'source-layer': 'ruta2',
        paint: {
            'line-color': '#830065',
            'line-width': 4,
            'line-opacity': 0.9,
            'line-translate': [6, 0],
            'line-translate-anchor': 'map'
        }
    });

    // Línea principal (encima)
    map.addLayer({
        id: 'linea_madrid_malaga',
        type: 'line',
        source: 'linea_madrid_malaga',
        'source-layer': 'linea_madrid_malaga',
        paint: {
            'line-color': '#d40c15',
            'line-width': 4,
            'line-opacity': 0.9
        }
    });

    // ===============================
    // MARCADORES (SIN CAMBIOS)
    // ===============================
    const makeMarker = (color, size = 20, shadow = true) => {
        const el = document.createElement('div');
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = '50%';
        el.style.backgroundColor = color;
        el.style.border = '3px solid white';
        if (shadow) el.style.boxShadow = `0 0 10px ${color}`;
        el.style.display = 'none';
        return el;
    };

    atochaMarker = new maplibregl.Marker({ element: makeMarker('#9C27B0') }).setLngLat(ATOCHA_LOCATION).addTo(map);
    mariaZambranoMarker = new maplibregl.Marker({ element: makeMarker('#d40c15') }).setLngLat(MARIA_ZAMBRANO_LOCATION).addTo(map);
    cordobaMarker = new maplibregl.Marker({ element: makeMarker('#d40c15') }).setLngLat(CORDOBA_LOCATION).addTo(map);

    const accidentEl = document.createElement('div');
    accidentEl.className = 'pulse-marker';
    accidentEl.style.width = '30px';
    accidentEl.style.height = '30px';
    accidentEl.style.borderRadius = '50%';
    accidentEl.style.backgroundColor = '#01f3b3';
    accidentEl.style.border = '3px solid white';
    accidentEl.style.display = 'none';

    accidentMarker = new maplibregl.Marker({ element: accidentEl }).setLngLat(ACCIDENT_LOCATION).addTo(map);
    moronMarker = new maplibregl.Marker({ element: makeMarker('#01f3b3') }).setLngLat(MORON_LOCATION).addTo(map);

    mapLoaded = true;
});

// ===============================
// SCROLL / CHAPTERS
// ===============================
const chapters = document.querySelectorAll('.chapter');
const progressBar = document.getElementById('progress');

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            chapters.forEach(c => c.classList.remove('active'));
            entry.target.classList.add('active');
            activateChapter(parseInt(entry.target.dataset.chapter));
        }
    });
}, { threshold: 0.5 });

chapters.forEach(ch => observer.observe(ch));

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (scrollTop / docHeight) * 100 + '%';
});

// ===============================
// UTILIDADES
// ===============================
const show = m => m && (m.getElement().style.display = 'block');
const hide = m => m && (m.getElement().style.display = 'none');
const hideAll = () => [atochaMarker, mariaZambranoMarker, cordobaMarker, accidentMarker, moronMarker].forEach(hide);

// ===============================
// CAPÍTULOS
// ===============================
function activateChapter(n) {
    if (!mapLoaded || n === currentChapter) return;
    currentChapter = n;

    const c = CHAPTERS[n];
    map.flyTo({ ...c, essential: true });

    hideAll();

    if (n === 1) show(atochaMarker);
    if (n === 2) { show(atochaMarker); show(mariaZambranoMarker); }
    if (n === 3) { show(atochaMarker); show(mariaZambranoMarker); show(cordobaMarker); }
    if (n >= 4 && n <= 7) show(accidentMarker);
    if (n === 7) show(moronMarker);
}
