# River Story

Juego narrativo de fans sobre la historia de River Plate, armado como una tira de cómic: elegís lugares y personajes, los arrastrás a las viñetas y la historia se reproduce. Sin fines comerciales ni vínculo oficial con el club. No usa escudos ni fotos con copyright.

## Desarrollo

```bash
npm install
npm run dev              # servidor local
npm test                 # tests de la lógica
npm run validate:content # valida el contenido contra el schema
npm run build
```

## Contenido

Está en `src/content/` (JSON). Solo las escenas con `verified: true` se muestran en producción. Las dudas sobre datos están en `CONTENT_TODO.md`. Regla: ningún dato sin dos fuentes que coincidan.

## Instalar en el celular (PWA)

Abrir la web publicada en Chrome del teléfono → menú ⋮ → "Instalar app" / "Agregar a pantalla principal".
