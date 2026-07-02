# Diseño: Comentarios privados por junta

**Fecha:** 2026-07-02
**Proyecto:** Calendario ÉL VIVE (sitio estático en GitHub Pages)

## Objetivo

Permitir que los miembros de la comunidad envíen retroalimentación **privada** sobre
juntas/eventos **ya cerrados**. Los comentarios NO se muestran en la página: llegan
únicamente a los organizadores, acumulándose en una hoja de Google Sheets.

## Contexto del proyecto

- Sitio 100% estático: `index.html` + `styles.css` + `app.js` (JS vanilla), sin backend.
- Alojado en GitHub Pages.
- `app.js` ya define `yaFue(e)` (línea ~58): devuelve `true` cuando una junta ya pasó
  (por fecha, vía `esPasado`) o cuando ya tiene fotos en `GALERIAS`. Esta función es la
  fuente de verdad para "junta cerrada".
- Ya existe un patrón de modal (galería de fotos + lightbox) que sirve de referencia de
  estilo e interacción para el nuevo modal de comentarios.

Como el sitio es estático no puede recibir ni guardar datos por sí solo; se usa un
servicio externo (Google Apps Script + Google Sheets) como receptor.

## Alcance (qué SÍ y qué NO)

**SÍ:**
- Botón "💬 Enviar comentario" en cada evento donde `yaFue(e) === true`.
- Modal con el diseño del sitio, que muestra de qué junta se trata.
- Envío del comentario a un Google Sheet privado vía Apps Script.
- Ligado automático e inequívoco de cada comentario a su junta (clave `Mes-Día`).

**NO (YAGNI):**
- No se muestran comentarios en la página.
- No hay moderación, login, ni cuentas de usuario.
- No hay backend propio ni base de datos.
- No se editan/borran comentarios desde la web (se gestionan en el Sheet).

## Experiencia del miembro

1. En una tarjeta de junta cerrada aparece el botón **💬 Enviar comentario**, junto a
   "📷 Ver fotos" dentro de `.event-meta`.
2. Al dar clic se abre un modal con el estilo del sitio, encabezado con el nombre y la
   fecha de la junta (ej. *"Junta de Comunidad / INI · Lun 29 de junio · 2026"*).
3. Campos del formulario:
   - **Nombre** — *obligatorio*.
   - **¿Qué te gustó de la junta?** — *obligatorio*.
   - **¿Qué crees que pudo mejorar en la junta?** — *opcional*.
4. Botón **Enviar**.
5. Validación: nombre y "¿Qué te gustó?" obligatorios; si falta alguno, no envía y se
   resalta el campo faltante.
6. Al enviar con éxito: mensaje "¡Gracias! Recibimos tu comentario 🙏" y cierre del modal.
7. Si falla el envío: mensaje de error amable y opción de reintentar.

## Estructura de datos en el Sheet

Cada envío agrega una fila:

| Columna        | Origen                                             |
|----------------|----------------------------------------------------|
| Fecha de envío | Automática (timestamp del Apps Script)             |
| Junta (clave)  | Automática (`claveEvento`, ej. `Junio-29`)         |
| Junta (título) | Automática (título + fecha legible del evento)     |
| Nombre         | Campo del formulario                               |
| Qué gustó      | Campo del formulario                               |
| Qué mejorar    | Campo del formulario                               |

La columna Junta se llena sola desde el `data-*` del botón; el miembro nunca la elige,
por lo que no puede equivocarse de junta.

## Arquitectura técnica

Flujo:

```
Formulario (modal en la página)
   → fetch POST (URLSearchParams, sin cabeceras que disparen preflight)
   → Apps Script Web App (doPost)
   → appendRow() en el Google Sheet
```

Componentes y responsabilidades:

- **HTML del modal** (`index.html`): estructura estática oculta por defecto, análoga al
  modal de galería. Contiene el `<form>`, los 3 campos, zona de encabezado (junta) y
  zonas de estado (enviando / éxito / error).
- **Estilos** (`styles.css`): reutilizan variables y patrón visual del modal existente.
- **Lógica** (`app.js`):
  - En `eventoHTML`, cuando `yaFue(e)`, renderizar el botón con
    `data-comentar="<clave>"`.
  - `initComentarios()`: delegación de eventos para abrir el modal, precargar el
    encabezado de la junta, validar, enviar por `fetch`, y manejar estados.
  - Constante `COMENTARIOS_URL` con la URL `/exec` del Apps Script (pública, no secreta;
    se puede commitear).
- **Apps Script** (fuera del repo, en Google): `doPost(e)` que lee `e.parameter` y hace
  `appendRow`. Se implementa como aplicación web (ejecutar como el dueño; acceso:
  cualquiera con el enlace).

### Nota sobre CORS

El envío usa `fetch` con cuerpo `URLSearchParams`
(`application/x-www-form-urlencoded`), que es una "simple request" y no dispara
preflight CORS. Si leer la respuesta cross-origin diera problemas, se usa
`mode: "no-cors"` y se asume éxito al resolver el `fetch` (el Apps Script igual escribe
la fila). El mensaje de "¡Gracias!" se muestra al resolver el envío.

## Manejo de errores

- Nombre o "¿Qué te gustó?" vacíos → no envía; resalta el campo faltante.
- Fallo de red → mensaje amable "No se pudo enviar, revisa tu conexión e inténtalo de
  nuevo" y el botón vuelve a estar disponible.
- Doble clic en Enviar → el botón se deshabilita mientras se envía para evitar duplicados.

## Pruebas (antes de commit)

1. Jorge crea el Sheet, pega el script y despliega la Web App; comparte la URL `/exec`.
2. Se coloca la URL en `COMENTARIOS_URL`.
3. Se abre `index.html` localmente (o `python -m http.server 5599`).
4. Enviar un comentario de prueba en una junta pasada (ej. 29 de junio) y verificar que:
   - Aparece la fila correcta en el Sheet con la junta correcta.
   - Los campos obligatorios (nombre y "¿Qué te gustó?") se validan.
   - El botón NO aparece en juntas futuras.
5. No se hace commit durante el desarrollo. Se trabaja y se prueba en Live Server; solo
   cuando el feature esté terminado y verificado se sube todo junto en un commit.

## Costo

$0. Google Sheets, Apps Script y su implementación como aplicación web son gratuitos
para este volumen de uso.

## Pasos que Jorge realiza en Google (guiados)

1. Crear una hoja nueva de Google Sheets.
2. Extensiones → Apps Script; pegar el script provisto.
3. Implementar → Aplicación web (ejecutar como: yo; acceso: cualquiera con el enlace).
4. Copiar la URL `/exec` y compartirla para conectarla en `app.js`.

## Decisiones cerradas

- Botón en TODO evento cerrado (`yaFue(e)`), no solo en las "Junta de Comunidad / INI".
- Campos obligatorios: Nombre y "¿Qué te gustó?". Opcional: "¿Qué pudo mejorar?".
- Sin commits durante el desarrollo; se sube todo junto al terminar. Sin rama aparte.
- El Sheet y el Apps Script los crea Jorge en su cuenta de Google; Claude no tiene ni
  requiere acceso a esa cuenta, solo la URL `/exec` resultante.
