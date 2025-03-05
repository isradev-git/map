# Mapa Interactivo en 3D

[![Estado del proyecto](https://img.shields.io/badge/Estado-En%20desarrollo-yellow.svg)](https://github.com/tu-usuario/tu-repositorio)  
**Última actualización:** 05 de marzo de 2025

Este proyecto es una aplicación web que utiliza **Mapbox GL JS** para crear un mapa interactivo en 3D con funcionalidades avanzadas de navegación, visualización y exploración. Está construido con **HTML**, **Tailwind CSS** y **JavaScript**, y diseñado para ser completamente responsivo en dispositivos móviles, tablets y escritorios.

---

## Características principales

### Visualización
- **Terreno en 3D:** Muestra elevaciones del terreno con exageración ajustable (1.5x) y sombreado (`hillshading`) para una mejor percepción del relieve.
- **Edificios en 3D:** Renderiza edificios con extrusión basada en datos de altura, usando una capa de tipo `fill-extrusion`.
- **Estilos de mapa:** Permite alternar entre estilos predefinidos de Mapbox (Streets, Satellite Streets, Outdoors, Dark) desde un selector.

### Interactividad
- **Alternar 3D:** Botón para cambiar entre vista plana (0°) y vista inclinada (60°) con una transición suave.
- **Búsqueda de direcciones:** Campo de texto que usa la API de geocodificación de Mapbox para buscar lugares y "volar" al resultado, añadiendo un marcador con popup.
- **Rutas:** Calcula y muestra rutas entre un origen y un destino usando la API de direcciones de Mapbox (modo "driving"), con ajuste automático de la vista.
- **Información al hacer clic:** Al hacer clic en el mapa, muestra un popup con detalles como nombre del lugar, altura del edificio (si aplica) o coordenadas exactas.
- **Modo "Explorar":** Botón que activa una rotación continua del mapa alrededor de su centro, con opción para detenerla.

### Navegación
- **Controles estándar:** Incluye zoom, rotación y desplazamiento mediante el `NavigationControl` de Mapbox.
- **Gestos:** Soporta rotación e inclinación con el mouse y gestos táctiles en dispositivos móviles.
- **Volar a ubicación:** Botón para animar el mapa hacia una ubicación predefinida (actualmente Monte Tamalpais, California).

### Diseño responsivo
- **Panel lateral:** Fijo en pantallas grandes (≥768px) y colapsable en móviles mediante un botón de menú hamburguesa (`☰`), con transiciones suaves.
- **Adaptabilidad:** El mapa ocupa todo el espacio disponible, ajustándose al tamaño de la pantalla.

---

## Tecnologías utilizadas
- **Mapbox GL JS (v2.15.0):** Biblioteca para renderizar mapas interactivos en 3D.
- **Tailwind CSS:** Framework de estilos para un diseño moderno y responsivo.
- **HTML5:** Estructura básica de la aplicación.
- **JavaScript (ES6+):** Lógica interactiva con módulos y funciones asíncronas.

---
