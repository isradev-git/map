// Importante: No compartir tokens privados en producción
const mapboxToken = 'pk.eyJ1IjoiZ2xpdGNoYmFuZSIsImEiOiJjbTZmMzFqMjYwMHU5MmlzMHg1dnJpOWk2In0.FM80xXm_N_P8QT1y4qZQkQ';

// Configurar el token de acceso de Mapbox
mapboxgl.accessToken = mapboxToken;

// Crear una nueva instancia del mapa
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/outdoors-v12',
  center: [-122.447303, 37.753574],
  zoom: 14,
  pitch: 60,
  bearing: -60
});

// Agregar controles de navegación
map.addControl(new mapboxgl.NavigationControl());

// Habilitar gestos de rotación e inclinación
map.dragRotate.enable();
map.touchZoomRotate.enable();

// Función para agregar la capa de edificios en 3D
function add3DBuildingsLayer() {
  if (!map.getLayer('3d-buildings')) {
    map.addLayer({
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      type: 'fill-extrusion',
      paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 1
      }
    });
  }
}

// Añadir terreno y capas al cargar el mapa
map.on('load', () => {
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1'
    });
  }
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
  map.addLayer({
    id: 'hillshading',
    type: 'hillshade',
    source: 'mapbox-dem',
    paint: { 'hillshade-exaggeration': 0.5 }
  });
  add3DBuildingsLayer();
});

// Reaplicar terreno y edificios al cambiar estilo
map.on('styledata', () => {
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1'
    });
  }
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
  add3DBuildingsLayer();
});

// Alternar vista 3D
document.getElementById('toggle-3d').addEventListener('click', () => {
  const pitch = map.getPitch() === 0 ? 60 : 0;
  map.easeTo({ pitch: pitch, duration: 1000 });
});

// Cambiar estilo del mapa
document.getElementById('style-selector').addEventListener('change', (event) => {
  const newStyle = event.target.value;
  map.setStyle(newStyle);
});

// Buscar direcciones
document.getElementById('search').addEventListener('input', (event) => {
  const query = event.target.value;
  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}`)
    .then(response => response.json())
    .then(data => {
      if (data.features.length > 0) {
        const coordinates = data.features[0].center;
        map.flyTo({ center: coordinates, zoom: 16, duration: 2000 });
        new mapboxgl.Marker()
          .setLngLat(coordinates)
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${data.features[0].place_name}</h3>`))
          .addTo(map);
      }
    });
});

// Obtener ruta
document.getElementById('get-route').addEventListener('click', async () => {
  const originQuery = document.getElementById('origin').value;
  const destinationQuery = document.getElementById('destination').value;
  try {
    const originCoordinates = await geocodeAddress(originQuery);
    const destinationCoordinates = await geocodeAddress(destinationQuery);
    fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${originCoordinates};${destinationCoordinates}?geometries=geojson&steps=true&access_token=${mapboxToken}`)
      .then(response => response.json())
      .then(data => {
        const route = data.routes[0].geometry;
        if (map.getSource('route')) {
          map.removeLayer('route');
          map.removeSource('route');
        }
        map.addLayer({
          id: 'route',
          type: 'line',
          source: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: route } },
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3887be', 'line-width': 5 }
        });
        const bounds = new mapboxgl.LngLatBounds();
        data.routes[0].legs.forEach(leg => {
          leg.steps.forEach(step => {
            step.intersections.forEach(intersection => bounds.extend(intersection.location));
          });
        });
        map.fitBounds(bounds, { padding: 50 });
      });
  } catch (error) {
    console.error('Error al obtener la ruta:', error);
    alert('No se pudo obtener la ruta. Verifica las direcciones ingresadas.');
  }
});

// Función para geocodificar direcciones
async function geocodeAddress(address) {
  const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`);
  const data = await response.json();
  if (data.features.length === 0) throw new Error('Dirección no encontrada');
  const coordinates = data.features[0].center;
  return `${coordinates[0]},${coordinates[1]}`;
}

// Volar a ubicación
document.getElementById('fly-to-location').addEventListener('click', () => {
  map.flyTo({
    center: [-122.447303, 37.753574],
    zoom: 14,
    pitch: 60,
    bearing: -60,
    duration: 3000
  });
});

// Nueva funcionalidad: Información al hacer clic
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point);
  let popupContent = '<h3>Información</h3>';
  
  if (features.length > 0) {
    const feature = features[0];
    popupContent += `<p><strong>Nombre:</strong> ${feature.properties.name || 'Sin nombre'}</p>`;
    if (feature.properties.height) {
      popupContent += `<p><strong>Altura:</strong> ${feature.properties.height}m</p>`;
    }
    if (feature.layer.id === 'hillshading') {
      popupContent += '<p><strong>Tipo:</strong> Terreno</p>';
    }
  } else {
    popupContent += `<p><strong>Coordenadas:</strong> ${e.lngLat.lng.toFixed(4)}, ${e.lngLat.lat.toFixed(4)}</p>`;
  }

  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(popupContent)
    .addTo(map);
});

// Nueva funcionalidad: Modo "Explorar"
let isExploring = false;
let angle = 0;

function rotateCamera() {
  if (isExploring) {
    map.rotateTo(angle, { duration: 100 });
    angle = (angle + 1) % 360;
    requestAnimationFrame(rotateCamera);
  }
}

document.getElementById('explore-mode').addEventListener('click', () => {
  isExploring = !isExploring;
  document.getElementById('explore-mode').textContent = isExploring ? 'Detener Exploración' : 'Modo Explorar';
  if (isExploring) {
    angle = map.getBearing();
    rotateCamera();
  }
});