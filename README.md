# Inferno Survival — Demonios (Mobile-first PWA)

Juego de supervivencia: mueve tu héroe, dispara automáticamente a demonios, sobrevive oleadas, sube de nivel y supera tu récord. PWA mobile-first (funciona offline y se instala en Chrome).

## 🎮 Controles
- **Arrastra el dedo**: mover.
- **Disparo automático** al enemigo más cercano (máx. 320 px).
- Botón 🔥: fuerza un disparo inmediato.
- Escritorio: WASD/flechas, puntero.

## ✨ Características
- Oleadas progresivas, curación (❤️) y bonus (💎).
- Vida, puntuación, nivel/oleada.
- PWA: manifest + Service Worker, instalable y offline.
- Optimizado para móvil (portrait, touch).

## ▶️ Probar local
Abre `index.html` en Chrome (desktop o móvil en la misma red con `http://TU_IP:PUERTO`).

## 🚀 Publicar en Google Play Store (resumen realista)
Esta PWA se convierte en app Android con **PWABuilder** (TWA). Necesitarás:
- Cuenta de **Google Play Developer** (pago único 25 USD).
- **Hosting HTTPS** (GitHub Pages sirve).
- (Recomendado) **Digital Asset Links** para que la app se abra sin barra del navegador.

### Pasos
1. **Publica la app en GitHub Pages** (igual que otros proyectos): sube esta carpeta y activa Pages en rama `main` → `/`.
2. Abre **https://www.pwabuilder.com/** e introduce tu URL de Pages.
3. PWABuilder genera el paquete: descarga el **AAB** (Android App Bundle) y (si lo pide) el zip de assets.
4. Crea una app en **Google Play Console** → “Crear app” → rellena datos, clasificación, política de privacidad, capturas.
5. En “Versiones de producción” sube el **AAB**.
6. Sigue la guía de Digital Asset Links que PWABuilder te da (archivo en `/.well-known/assetlinks.json` del hosting) para ocultar la barra del navegador.
7. Revisa y publica (revisión típica 1–3 días).

### Archivos clave
- `manifest.json` (incluye orientación portrait, icono SVG)
- `sw.js` (caché offline)
- `icon.svg` (puedes generar PNG 512x512 con cualquier editor/convertidor para la Play Store)

## 🛠️ Mejoras opcionales antes de publicar
- Añadir sonido de fondo y más enemigos/boss.
- Generar `icon-512.png` real (Play Store lo exige como captura del store).
- Añadir política de privacidad (obligatoria).
- Analítica (opcional) y Crashlytics.

## Licencia
Uso libre con fines educativos.
