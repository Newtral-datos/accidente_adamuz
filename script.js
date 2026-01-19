// Coordenadas reales del accidente
const ACCIDENT_LOCATION = [-4.56501, 38.009188];
const ATOCHA_LOCATION = [-3.6888561997808353, 40.40483658419843];
const MARIA_ZAMBRANO_LOCATION = [-4.432355637473907, 36.71170431963949];
const CORDOBA_LOCATION = [-4.788825207081348, 37.88831972965772];
const MORON_LOCATION = [-5.45, 37.12];

// Configuración de cada capítulo
const CHAPTERS = {
    0: {
        center: [-3.8094642278958655, 39.1540240706266],  // Centro de España
        zoom: 5.5,
        pitch: 0,
        bearing: 0,
        duration: 2000
    },
    1: {
        center: ATOCHA_LOCATION,
        zoom: 7,
        pitch: 45,
        bearing: 0,
        duration: 2500
    },
    2: {
        center: MARIA_ZAMBRANO_LOCATION,
        zoom: 7,
        pitch: 45,
        bearing: 0,
        duration: 2500
    },
    3: {
        center: CORDOBA_LOCATION,
        zoom: 8,
        pitch: 45,
        bearing: 0,
        duration: 2500
    },
    4: {
        center: ACCIDENT_LOCATION,
        zoom: 17,
        pitch: 60,
        bearing: 0,
        duration: 3000
    },
    5: {
        center: ACCIDENT_LOCATION,
        zoom: 12,
        pitch: 45,
        bearing: 90,
        duration: 2500
    },
    6: {
        center: ACCIDENT_LOCATION,
        zoom: 12,
        pitch: 30,
        bearing: 0,
        duration: 2500
    },
    7: {
        center: MORON_LOCATION,
        zoom: 9,
        pitch: 30,
        bearing: 0,
        duration: 2500
    },
    8: {
        center: [-3.8094642278958655, 39.1540240706266],  // Centro de España
        zoom: 5.5,
        pitch: 0,
        bearing: 0,
        duration: 2000
    }
};

// Inicializar el mapa
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

// Variables para animaciones
let atochaMarker = null;
let mariaZambranoMarker = null;
let cordobaMarker = null;
let accidentMarker = null;
let moronMarker = null;
let currentChapter = -1;
let mapLoaded = false;
let accidentAnimationPlayed = false;

map.on('load', () => {
    console.log('Mapa cargado');

    // ========== AÑADIR PMTILES ==========
    try {
        let protocol = new pmtiles.Protocol();
        maplibregl.addProtocol('pmtiles', protocol.tile);

        map.addSource('linea_madrid_malaga', {
            type: 'vector',
            url: 'pmtiles://./linea_madrid_malaga.pmtiles'
        });

        // Línea 1 - Vía izquierda
        map.addLayer({
            id: 'linea_madrid_malaga_1',
            type: 'line',
            source: 'linea_madrid_malaga',
            'source-layer': 'linea_madrid_malaga',
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
                'visibility': 'visible'
            },
            paint: {
                'line-color': '#830065',
                'line-width': 4,
                'line-opacity': 0.9,
                'line-offset': -3
            }
        });

        // Línea 2 - Vía derecha
        map.addLayer({
            id: 'linea_madrid_malaga_2',
            type: 'line',
            source: 'linea_madrid_malaga',
            'source-layer': 'linea_madrid_malaga',
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
                'visibility': 'visible'
            },
            paint: {
                'line-color': '#d40c15',
                'line-width': 4,
                'line-opacity': 0.9,
                'line-offset': 3
            }
        });

        console.log('✅ PMTiles con 2 líneas cargado correctamente');
    } catch (error) {
        console.error('❌ Error al cargar PMTiles:', error);
    }

    // ========== MARCADORES ==========
    
    // Marcador Atocha (MORADO)
    const atochaEl = document.createElement('div');
    atochaEl.style.width = '20px';
    atochaEl.style.height = '20px';
    atochaEl.style.borderRadius = '50%';
    atochaEl.style.backgroundColor = '#9C27B0';
    atochaEl.style.border = '3px solid white';
    atochaEl.style.boxShadow = '0 0 10px rgba(156, 39, 176, 0.5)';
    atochaEl.style.display = 'none';
    
    atochaMarker = new maplibregl.Marker({ element: atochaEl })
        .setLngLat(ATOCHA_LOCATION)
        .addTo(map);

    // Marcador María Zambrano (ROJO)
    const mariaEl = document.createElement('div');
    mariaEl.style.width = '20px';
    mariaEl.style.height = '20px';
    mariaEl.style.borderRadius = '50%';
    mariaEl.style.backgroundColor = '#d40c15';
    mariaEl.style.border = '3px solid white';
    mariaEl.style.boxShadow = '0 0 10px rgba(212, 12, 21, 0.5)';
    mariaEl.style.display = 'none';
    
    mariaZambranoMarker = new maplibregl.Marker({ element: mariaEl })
        .setLngLat(MARIA_ZAMBRANO_LOCATION)
        .addTo(map);

    // Marcador Córdoba (ROJO)
    const cordobaEl = document.createElement('div');
    cordobaEl.style.width = '20px';
    cordobaEl.style.height = '20px';
    cordobaEl.style.borderRadius = '50%';
    cordobaEl.style.backgroundColor = '#d40c15';
    cordobaEl.style.border = '3px solid white';
    cordobaEl.style.boxShadow = '0 0 10px rgba(212, 12, 21, 0.5)';
    cordobaEl.style.display = 'none';
    
    cordobaMarker = new maplibregl.Marker({ element: cordobaEl })
        .setLngLat(CORDOBA_LOCATION)
        .addTo(map);

    // Marcador del accidente (VERDE con pulso)
    const accidentEl = document.createElement('div');
    accidentEl.className = 'pulse-marker';
    accidentEl.style.width = '30px';
    accidentEl.style.height = '30px';
    accidentEl.style.borderRadius = '50%';
    accidentEl.style.backgroundColor = '#01f3b3';
    accidentEl.style.border = '3px solid white';
    accidentEl.style.display = 'none';

    accidentMarker = new maplibregl.Marker({ element: accidentEl })
        .setLngLat(ACCIDENT_LOCATION)
        .addTo(map);

    // Marcador Morón (VERDE)
    const moronEl = document.createElement('div');
    moronEl.style.width = '20px';
    moronEl.style.height = '20px';
    moronEl.style.borderRadius = '50%';
    moronEl.style.backgroundColor = '#01f3b3';
    moronEl.style.border = '3px solid white';
    moronEl.style.boxShadow = '0 0 10px rgba(1, 243, 179, 0.5)';
    moronEl.style.display = 'none';
    
    moronMarker = new maplibregl.Marker({ element: moronEl })
        .setLngLat(MORON_LOCATION)
        .addTo(map);

    mapLoaded = true;
    console.log('Todos los elementos cargados');
});

// Detectar scroll y cambiar capítulos
const chapters = document.querySelectorAll('.chapter');
const progressBar = document.getElementById('progress');

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            chapters.forEach(ch => ch.classList.remove('active'));
            entry.target.classList.add('active');
            
            const chapterNum = parseInt(entry.target.dataset.chapter);
            activateChapter(chapterNum);
        }
    });
}, observerOptions);

chapters.forEach(chapter => observer.observe(chapter));

// Actualizar barra de progreso
window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progressBar.style.width = scrollPercent + '%';
});

// Funciones de animación del accidente
function triggerAccidentAnimation() {
    if (accidentAnimationPlayed) return;
    accidentAnimationPlayed = true;

    const mapContainer = document.getElementById('map');
    const flashOverlay = document.getElementById('flash-overlay');
    const explosionOverlay = document.getElementById('explosion-overlay');

    flashOverlay.classList.add('active');
    setTimeout(() => flashOverlay.classList.remove('active'), 300);

    mapContainer.classList.add('shake-effect');
    setTimeout(() => mapContainer.classList.remove('shake-effect'), 500);

    createExplosionRings(explosionOverlay);
    createSmokeParticles(explosionOverlay);
    createDebrisParticles(explosionOverlay);

    setTimeout(() => explosionOverlay.innerHTML = '', 3000);
}

function createExplosionRings(container) {
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const ring = document.createElement('div');
            ring.className = 'explosion-ring';
            container.appendChild(ring);
            setTimeout(() => ring.remove(), 1000);
        }, i * 200);
    }
}

function createSmokeParticles(container) {
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const smoke = document.createElement('div');
            smoke.className = 'smoke-particle';
            smoke.style.left = `${45 + Math.random() * 10}%`;
            smoke.style.top = `${45 + Math.random() * 10}%`;
            container.appendChild(smoke);
            setTimeout(() => smoke.remove(), 2000);
        }, i * 100);
    }
}

function createDebrisParticles(container) {
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const debris = document.createElement('div');
            debris.className = 'debris-particle';
            debris.style.left = `${48 + Math.random() * 4}%`;
            debris.style.top = `${48 + Math.random() * 4}%`;
            debris.style.transform = `rotate(${Math.random() * 360}deg)`;
            debris.style.animationDuration = `${1 + Math.random() * 0.5}s`;

            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            debris.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            debris.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);

            container.appendChild(debris);
            setTimeout(() => debris.remove(), 1500);
        }, i * 50);
    }
}

function resetAccidentAnimation() {
    accidentAnimationPlayed = false;
}

// Mostrar/ocultar marcadores
function showMarker(marker) {
    if (marker) marker.getElement().style.display = 'block';
}

function hideMarker(marker) {
    if (marker) marker.getElement().style.display = 'none';
}

function hideAllMarkers() {
    hideMarker(atochaMarker);
    hideMarker(mariaZambranoMarker);
    hideMarker(cordobaMarker);
    hideMarker(accidentMarker);
    hideMarker(moronMarker);
}

// Activar un capítulo específico
function activateChapter(chapterNum) {
    if (!mapLoaded) {
        console.log('Esperando a que el mapa cargue...');
        return;
    }

    if (chapterNum === currentChapter) return;
    currentChapter = chapterNum;

    const config = CHAPTERS[chapterNum];
    if (!config) return;

    console.log(`Capítulo ${chapterNum} activado`);

    map.flyTo({
        center: config.center,
        zoom: config.zoom,
        pitch: config.pitch || 0,
        bearing: config.bearing || 0,
        duration: config.duration,
        essential: true
    });

    switch(chapterNum) {
        case 0:
            hideAllMarkers();
            resetAccidentAnimation();
            break;

        case 1:
            // 18:05 - Atocha
            hideAllMarkers();
            showMarker(atochaMarker);
            break;

        case 2:
            // 18:40 - María Zambrano
            hideAllMarkers();
            showMarker(atochaMarker);
            showMarker(mariaZambranoMarker);
            break;

        case 3:
            // 19:39 - Córdoba
            hideAllMarkers();
            showMarker(atochaMarker);
            showMarker(mariaZambranoMarker);
            showMarker(cordobaMarker);
            break;

        case 4:
            // 19:45 - Accidente
            setTimeout(() => {
                triggerAccidentAnimation();
                hideAllMarkers();
                showMarker(accidentMarker);
            }, config.duration - 500);
            break;

        case 5:
            // 19:50 - 112
            hideAllMarkers();
            showMarker(accidentMarker);
            break;

        case 6:
            // 21:50 - Fase 1
            hideAllMarkers();
            showMarker(accidentMarker);
            break;

        case 7:
            // 23:43 - UME
            hideAllMarkers();
            showMarker(accidentMarker);
            showMarker(moronMarker);
            break;

        case 8:
            hideAllMarkers();
            break;
    }
}

console.log(`
Scrollytelling cargado
${chapters.length} capítulos disponibles
Haz scroll para navegar por la historia
Mapa bloqueado - solo se mueve con scroll
PMTiles siempre visible
`);
