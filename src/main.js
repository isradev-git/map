// Importante: No compartir tokens privados en producción
const mapboxToken = 'pk.eyJ1IjoiZ2xpdGNoYmFuZSIsImEiOiJjbTZmMzFqMjYwMHU5MmlzMHg1dnJpOWk2In0.FM80xXm_N_P8QT1y4qZQkQ';

// Configurar el token de acceso de Mapbox
mapboxgl.accessToken = mapboxToken;

// Crear una nueva instancia del mapa
const map = new mapboxgl.Map({
  container: 'map', // ID del div donde se renderizará el mapa
  style: 'mapbox://styles/mapbox/outdoors-v12', // Estilo inicial del mapa con datos de elevación
  center: [-122.447303, 37.753574], // Coordenadas iniciales (Monte Tamalpais, California)
  zoom: 14, // Nivel de zoom inicial
  pitch: 60, // Inclinación del mapa (60 grados para vista 3D)
  bearing: -60 // Rotación del mapa (-60 grados)
});

// Agregar controles de navegación (zoom, rotación, etc.)
map.addControl(new mapboxgl.NavigationControl());

// Habilitar los gestos de rotación e inclinación
map.dragRotate.enable(); // Habilitar rotación con el mouse
map.touchZoomRotate.enable(); // Habilitar zoom y rotación táctil

// Función para agregar la capa de edificios en 3D
function add3DBuildingsLayer() {
  if (!map.getLayer('3d-buildings')) {
    map.addLayer({
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      type: 'fill-extrusion',
      paint: {
        'fill-extrusion-color': '#aaa', // Color de los edificios
        'fill-extrusion-height': ['get', 'height'], // Altura de los edificios
        'fill-extrusion-base': ['get', 'min_height'], // Base de los edificios
        'fill-extrusion-opacity': 1 // Edificios completamente opacos
      }
    });
  }
}

// Añadir terreno en 3D cuando el mapa termine de cargar
map.on('load', () => {
  // Verificar si el estilo incluye la fuente 'mapbox-dem'
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1' // Fuente de datos de elevación
    });
  }

  // Habilitar el terreno en 3D
  map.setTerrain({
    source: 'mapbox-dem', // Fuente de datos de elevación
    exaggeration: 1.5 // Factor de exageración del relieve (1 = real, >1 = más pronunciado)
  });

  // Agregar una capa de sombreado para mejorar la visualización del terreno
  map.addLayer({
    id: 'hillshading',
    type: 'hillshade',
    source: 'mapbox-dem',
    paint: {
      'hillshade-exaggeration': 0.5 // Intensidad del sombreado
    }
  });

  // Agregar la capa de edificios en 3D
  add3DBuildingsLayer();
});

// Escuchar cambios en el estilo del mapa
map.on('styledata', () => {
  // Reaplicar la fuente 'mapbox-dem' si no está presente
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1'
    });
  }

  // Reaplicar el terreno en 3D
  map.setTerrain({
    source: 'mapbox-dem',
    exaggeration: 1.5
  });

  // Reaplicar la capa de edificios en 3D
  add3DBuildingsLayer();
});

// Botón para alternar la vista en 3D
document.getElementById('toggle-3d').addEventListener('click', () => {
  const pitch = map.getPitch() === 0 ? 60 : 0; // Alternar entre 0 y 60 grados
  map.easeTo({
    pitch: pitch,
    duration: 1000 // Duración de la transición en milisegundos
  });
});

// Selector de estilos de mapa
document.getElementById('style-selector').addEventListener('change', (event) => {
  const newStyle = event.target.value;
  map.setStyle(newStyle);
});

// Buscador de direcciones
document.getElementById('search').addEventListener('input', (event) => {
  const query = event.target.value;

  // Usar la API de Geocodificación de Mapbox
  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}`)
    .then(response => response.json())
    .then(data => {
      if (data.features.length > 0) {
        const coordinates = data.features[0].center;
        map.flyTo({
          center: coordinates,
          zoom: 16,
          duration: 2000
        });

        // Añadir un marcador en la ubicación encontrada
        new mapboxgl.Marker()
          .setLngLat(coordinates)
          .setPopup(new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${data.features[0].place_name}</h3>`))
          .addTo(map);
      }
    });
});

// Obtener ruta entre dos puntos
document.getElementById('get-route').addEventListener('click', async () => {
  const originQuery = document.getElementById('origin').value;
  const destinationQuery = document.getElementById('destination').value;

  try {
    // Convertir las direcciones de origen y destino en coordenadas usando la API de Geocodificación
    const originCoordinates = await geocodeAddress(originQuery);
    const destinationCoordinates = await geocodeAddress(destinationQuery);

    // Usar la API de direcciones de Mapbox para obtener la ruta
    fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoordinates};${destinationCoordinates}?geometries=geojson&steps=true&access_token=${mapboxToken}`
    )
      .then(response => response.json())
      .then(data => {
        const route = data.routes[0].geometry;

        // Añadir la ruta al mapa
        if (map.getSource('route')) {
          map.removeLayer('route');
          map.removeSource('route');
        }

        map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route
            }
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3887be',
            'line-width': 5
          }
        });

        // Centrar el mapa en la ruta
        const bounds = new mapboxgl.LngLatBounds();
        data.routes[0].legs.forEach(leg => {
          leg.steps.forEach(step => {
            step.intersections.forEach(intersection => {
              bounds.extend(intersection.location);
            });
          });
        });
        map.fitBounds(bounds, { padding: 50 });
      });
  } catch (error) {
    console.error('Error al obtener la ruta:', error);
    alert('No se pudo obtener la ruta. Verifica las direcciones ingresadas.');
  }
});

// Función para geocodificar una dirección y obtener sus coordenadas
async function geocodeAddress(address) {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`
  );
  const data = await response.json();

  if (data.features.length === 0) {
    throw new Error('Dirección no encontrada');
  }

  const coordinates = data.features[0].center;
  return `${coordinates[0]},${coordinates[1]}`; // Formato: longitud,latitud
}

// Animación para volar a una ubicación específica
document.getElementById('fly-to-location').addEventListener('click', () => {
  map.flyTo({
    center: [-122.447303, 37.753574], // Coordenadas del Monte Tamalpais
    zoom: 14,
    pitch: 60,
    bearing: -60,
    duration: 3000 // Duración de la animación en milisegundos
  });
});

