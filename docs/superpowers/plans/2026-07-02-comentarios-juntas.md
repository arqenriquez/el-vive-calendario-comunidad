# Comentarios privados por junta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un botón "💬 Enviar comentario" en cada junta/evento ya cerrado que abre un modal con 3 campos y envía la retroalimentación, en privado, a un Google Sheet vía Google Apps Script.

**Architecture:** Sitio estático (HTML/CSS/JS vanilla) en GitHub Pages, sin backend. El envío se hace con `fetch` POST (cuerpo `URLSearchParams`) hacia una Web App de Google Apps Script que hace `appendRow` en un Sheet privado del dueño. El botón reutiliza `yaFue(e)` (ya existente en `app.js`) para saber si la junta está cerrada, y el modal reutiliza el patrón visual/interacción del modal de galería ya presente.

**Tech Stack:** HTML5, CSS (variables ya definidas en `styles.css`), JavaScript vanilla (`fetch`, `URLSearchParams`, delegación de eventos), Google Apps Script + Google Sheets.

## Global Constraints

- Sin frameworks ni build step: solo `index.html`, `styles.css`, `app.js`.
- Sin backend propio ni dependencias nuevas.
- Los comentarios NO se muestran en la página; solo llegan al Sheet.
- Campos obligatorios: **Nombre** y **"¿Qué te gustó de la junta?"**. Opcional: **"¿Qué pudo mejorar?"**.
- El botón aparece SOLO cuando `yaFue(e) === true` (cualquier evento cerrado, no solo juntas de comunidad).
- Cada comentario se liga a su junta con la clave `Mes-Día` de `claveEvento(e)`; el usuario nunca elige la junta.
- No hay commits durante el desarrollo. Se prueba en Live Server y se sube TODO junto en un commit al final (Task 7).
- Sin framework de pruebas: cada tarea se verifica manualmente en el navegador (Live Server / `python -m http.server 5599`).
- `COMENTARIOS_URL` (la URL `/exec` del Apps Script) es pública, no secreta; se puede commitear.
- Al final se actualiza el parámetro `?v=` de `styles.css` y `app.js` en `index.html` para romper caché.

---

### Task 1: Crear el Google Sheet + Apps Script (lo hace Jorge en su cuenta)

Esta tarea es de configuración en Google, no de código en el repo. Produce el valor
`COMENTARIOS_URL` que las tareas 5 y 6 necesitan. Claude no tiene acceso a la cuenta de
Google de Jorge: entrega el script y las instrucciones; Jorge ejecuta y comparte la URL.

**Files:**
- Ninguno en el repo. (El código del Apps Script vive en Google.)

**Interfaces:**
- Produce: `COMENTARIOS_URL` — string, la URL que termina en `/exec`, ej.
  `https://script.google.com/macros/s/AKfy.../exec`.
- Produce: el Apps Script acepta un POST con parámetros de formulario
  `juntaClave`, `juntaTitulo`, `nombre`, `gusto`, `mejorar` y agrega una fila
  `[timestamp, juntaClave, juntaTitulo, nombre, gusto, mejorar]` a la hoja "Comentarios".

- [ ] **Step 1: Jorge crea una hoja de Google Sheets nueva**

Instrucción para Jorge: entrar a https://sheets.google.com, crear una hoja en blanco y
nombrarla (ej. "Comentarios ÉL VIVE").

- [ ] **Step 2: Jorge abre el editor de Apps Script y pega el script**

Instrucción: en el Sheet, menú **Extensiones → Apps Script**. Borrar el contenido de
`Código.gs` y pegar exactamente esto:

```javascript
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Comentarios');
    if (!sheet) {
      sheet = ss.insertSheet('Comentarios');
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Fecha de envío', 'Junta (clave)', 'Junta (título)',
        'Nombre', 'Qué gustó', 'Qué mejorar'
      ]);
    }
    var p = (e && e.parameter) ? e.parameter : {};
    sheet.appendRow([
      new Date(),
      p.juntaClave || '',
      p.juntaTitulo || '',
      p.nombre || '',
      p.gusto || '',
      p.mejorar || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

Guardar (icono de disquete).

- [ ] **Step 3: Jorge implementa el script como aplicación web**

Instrucción: botón **Implementar → Nueva implementación** → tipo **Aplicación web**.
Configurar:
- "Ejecutar como": **Yo (tu cuenta)**.
- "Quién tiene acceso": **Cualquier usuario**.

Dar **Implementar**, autorizar los permisos que pida Google (es tu propio script), y al
final copiar la **URL de la aplicación web** (termina en `/exec`).

- [ ] **Step 4: Verificar el endpoint con una prueba manual**

Verificación (Claude puede hacerla con la URL que Jorge comparta, o Jorge desde una
terminal). Ejecutar un POST de prueba:

```bash
curl -L -d "juntaClave=Junio-29" -d "juntaTitulo=Prueba" -d "nombre=Test" -d "gusto=Todo" -d "mejorar=" "PEGAR_AQUI_LA_URL_/exec"
```

Esperado: respuesta `{"ok":true}` y una fila nueva visible en la pestaña "Comentarios"
del Sheet. Borrar esa fila de prueba después.

- [ ] **Step 5: Registrar la URL**

Guardar la URL para la Task 5 (irá en la constante `COMENTARIOS_URL` de `app.js`).
No se commitea nada en este paso.

---

### Task 2: Marcado HTML del modal de comentarios

**Files:**
- Modify: `index.html` (agregar el modal después del bloque LIGHTBOX, antes de `<script>`, ~línea 107).

**Interfaces:**
- Produce: elementos con IDs que consume la Task 5:
  `#comment-modal`, `#comment-form`, `#comment-junta` (encabezado),
  `#comment-nombre`, `#comment-gusto`, `#comment-mejorar`,
  `#comment-submit`, `#comment-status`, `#comment-close`.

- [ ] **Step 1: Insertar el HTML del modal**

En `index.html`, justo después del cierre del bloque LIGHTBOX (`</div>` de la línea 107)
y antes de `<script src="app.js...">`, agregar:

```html
  <!-- MODAL: ENVIAR COMENTARIO (privado, va a Google Sheets) -->
  <div class="comment-modal" id="comment-modal" role="dialog" aria-modal="true" aria-labelledby="comment-heading" aria-hidden="true" hidden>
    <div class="comment-backdrop" data-cclose></div>
    <div class="comment-box">
      <button class="comment-close" id="comment-close" type="button" aria-label="Cerrar" data-cclose>&times;</button>
      <h3 class="comment-heading" id="comment-heading">Enviar comentario</h3>
      <p class="comment-junta" id="comment-junta"></p>
      <form class="comment-form" id="comment-form" novalidate>
        <label class="comment-label" for="comment-nombre">Nombre <span class="req">*</span></label>
        <input class="comment-input" id="comment-nombre" name="nombre" type="text" autocomplete="name" maxlength="80" />

        <label class="comment-label" for="comment-gusto">¿Qué te gustó de la junta? <span class="req">*</span></label>
        <textarea class="comment-input" id="comment-gusto" name="gusto" rows="3" maxlength="1000"></textarea>

        <label class="comment-label" for="comment-mejorar">¿Qué crees que pudo mejorar en la junta? <span class="opt">(opcional)</span></label>
        <textarea class="comment-input" id="comment-mejorar" name="mejorar" rows="3" maxlength="1000"></textarea>

        <button class="comment-submit" id="comment-submit" type="submit">Enviar</button>
        <p class="comment-status" id="comment-status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>
```

- [ ] **Step 2: Verificar en el navegador que no rompe nada**

Abrir `index.html` en Live Server. Esperado: la página se ve igual que antes (el modal
está oculto por `hidden`). No hay errores en la consola (F12).

---

### Task 3: Estilos del modal y del botón

**Files:**
- Modify: `styles.css` (agregar al final del archivo).

**Interfaces:**
- Consume: clases del HTML de la Task 2 (`.comment-modal`, `.comment-box`, etc.).
- Produce: clase `.event-comment` usada por el botón que renderiza la Task 4.

- [ ] **Step 1: Agregar los estilos al final de `styles.css`**

```css
/* ============ BOTÓN Y MODAL DE COMENTARIOS ============ */
.event-comment {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: inherit;
  font-size: .82rem;
  font-weight: 600;
  color: var(--verde, #2e7d32);
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 999px;
  padding: 3px 10px;
  cursor: pointer;
}
.event-comment:hover { filter: brightness(1.1); }

.comment-modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.comment-modal[hidden] { display: none; }
.comment-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, .55);
}
.comment-box {
  position: relative;
  z-index: 1;
  width: min(460px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  padding: 26px 22px 22px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, .3);
}
.comment-close {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 1.7rem;
  line-height: 1;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}
.comment-heading { margin: 0 0 2px; font-size: 1.15rem; }
.comment-junta { margin: 0 0 16px; font-size: .9rem; color: #666; }
.comment-form { display: flex; flex-direction: column; gap: 4px; }
.comment-label { font-size: .85rem; font-weight: 600; margin-top: 10px; }
.comment-label .req { color: #d32f2f; }
.comment-label .opt { color: #999; font-weight: 400; }
.comment-input {
  font: inherit;
  font-size: .95rem;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  resize: vertical;
}
.comment-input:focus { outline: 2px solid var(--verde, #2e7d32); outline-offset: 1px; }
.comment-input.is-error { border-color: #d32f2f; }
.comment-submit {
  margin-top: 16px;
  font: inherit;
  font-weight: 700;
  color: #fff;
  background: var(--verde, #2e7d32);
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  cursor: pointer;
}
.comment-submit:disabled { opacity: .6; cursor: default; }
.comment-status { margin: 10px 0 0; font-size: .9rem; min-height: 1.2em; }
.comment-status.is-ok { color: var(--verde, #2e7d32); }
.comment-status.is-bad { color: #d32f2f; }
```

- [ ] **Step 2: Verificar los estilos manualmente (modal forzado visible)**

En Live Server, abrir la consola (F12) y ejecutar:
`document.getElementById('comment-modal').hidden = false`
Esperado: el modal aparece centrado, con caja blanca, los 3 campos, el botón verde
"Enviar" y la ✕ arriba a la derecha. Volver a ocultarlo con `.hidden = true`.

---

### Task 4: Renderizar el botón "Enviar comentario" en eventos cerrados

**Files:**
- Modify: `app.js` — función `eventoHTML` (líneas ~293-353).

**Interfaces:**
- Consume: `yaFue(e)` y `claveEvento(e)` (ya existentes en `app.js`).
- Produce: botón `<button class="event-comment" data-comentar="<clave>">` dentro de
  `.event-meta`, presente solo cuando `yaFue(e) === true`. Este `data-comentar` lo lee la Task 5.

- [ ] **Step 1: Definir el botón dentro de `eventoHTML`**

En `eventoHTML`, después de la línea que define `infoBtn` (~línea 333) y antes del
`return`, agregar:

```javascript
  // Botón "Enviar comentario": solo en juntas/eventos que ya se realizaron.
  const comentarBtn = seRealizo
    ? `<button class="event-comment" type="button" data-comentar="${clave}">💬 Enviar comentario</button>`
    : "";
```

(`seRealizo` ya está calculado en la línea ~297 como `yaFue(e)`; `clave` en la ~310.)

- [ ] **Step 2: Insertar el botón en el marcado de `.event-meta`**

En el `return` de `eventoHTML`, dentro del `<div class="event-meta">`, agregar
`${comentarBtn}` después de `${infoBtn}`:

```javascript
      <div class="event-meta">
        ${hora}
        ${mapa}
        ${infoBtn}
        ${comentarBtn}
        <span class="event-tag">${c.nombre}</span>
        ${galHint}
      </div>
```

- [ ] **Step 3: Verificar en el navegador**

Recargar Live Server. Esperado:
- Las juntas de junio y la del 1 de julio (ya pasadas / con fotos) muestran el botón
  "💬 Enviar comentario".
- Las juntas futuras (ej. Julio 13, Agosto...) NO lo muestran.
- Al tocar una tarjeta con galería, el clic en el botón no debe abrir la galería
  (la función `abrirDesde` ya ignora clics sobre `button`, ver `initGaleria`).

---

### Task 5: Lógica del modal — abrir, validar y enviar

**Files:**
- Modify: `app.js` — agregar constante `COMENTARIOS_URL`, la función `initComentarios()`, y su llamada en el `DOMContentLoaded`.

**Interfaces:**
- Consume: IDs del modal (Task 2), botón `[data-comentar]` (Task 4), `EVENTOS`,
  `claveEvento`, `ANIO` (ya existentes).
- Consume: `COMENTARIOS_URL` (Task 1).
- Produce: feedback visual en `#comment-status`; fila nueva en el Sheet vía POST.

- [ ] **Step 1: Agregar la constante de la URL**

Cerca del inicio de `app.js` (ej. después de `const ANIO = 2026;`, línea ~25), agregar:

```javascript
// URL de la aplicación web de Google Apps Script que recibe los comentarios.
// (Pública, no secreta.) Se obtiene al implementar el script — ver plan Task 1.
const COMENTARIOS_URL = "PEGAR_AQUI_LA_URL_/exec";
```

- [ ] **Step 2: Agregar la función `initComentarios`**

Antes del bloque `/* ============ INIT ============ */` (~línea 548), agregar:

```javascript
/* ============ COMENTARIOS DE JUNTAS ============ */
function textoJunta(e) {
  if (!e) return "";
  const dia = String(e.dia).trim();
  const fecha = dia ? `${e.dow} ${e.dia} de ${e.mes} · ${ANIO}` : `${e.mes} · ${ANIO}`;
  return `${e.titulo} · ${fecha}`;
}

function abrirComentario(clave) {
  const ev = EVENTOS.find((e) => claveEvento(e) === clave);
  const modal = document.getElementById("comment-modal");
  modal.dataset.clave = clave;
  document.getElementById("comment-junta").textContent = textoJunta(ev);
  // Limpiar el formulario y el estado previos.
  document.getElementById("comment-form").reset();
  const status = document.getElementById("comment-status");
  status.textContent = "";
  status.className = "comment-status";
  document.querySelectorAll("#comment-form .is-error").forEach((el) => el.classList.remove("is-error"));
  document.getElementById("comment-submit").disabled = false;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("comment-nombre").focus();
}

function cerrarComentario() {
  const modal = document.getElementById("comment-modal");
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  if (document.getElementById("gallery-modal").hidden) document.body.style.overflow = "";
}

async function enviarComentario() {
  const modal = document.getElementById("comment-modal");
  const clave = modal.dataset.clave || "";
  const ev = EVENTOS.find((e) => claveEvento(e) === clave);
  const nombre = document.getElementById("comment-nombre");
  const gusto = document.getElementById("comment-gusto");
  const mejorar = document.getElementById("comment-mejorar");
  const status = document.getElementById("comment-status");
  const submit = document.getElementById("comment-submit");

  // Validación: nombre y "¿qué te gustó?" son obligatorios.
  [nombre, gusto].forEach((el) => el.classList.remove("is-error"));
  let faltante = null;
  if (!nombre.value.trim()) faltante = nombre;
  else if (!gusto.value.trim()) faltante = gusto;
  if (faltante) {
    faltante.classList.add("is-error");
    faltante.focus();
    status.textContent = "Por favor llena los campos marcados con *.";
    status.className = "comment-status is-bad";
    return;
  }

  submit.disabled = true;
  status.textContent = "Enviando…";
  status.className = "comment-status";

  const body = new URLSearchParams({
    juntaClave: clave,
    juntaTitulo: textoJunta(ev),
    nombre: nombre.value.trim(),
    gusto: gusto.value.trim(),
    mejorar: mejorar.value.trim(),
  });

  try {
    await fetch(COMENTARIOS_URL, { method: "POST", body });
    status.textContent = "¡Gracias! Recibimos tu comentario 🙏";
    status.className = "comment-status is-ok";
    setTimeout(cerrarComentario, 1400);
  } catch (err) {
    submit.disabled = false;
    status.textContent = "No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.";
    status.className = "comment-status is-bad";
  }
}

function initComentarios() {
  document.getElementById("agenda").addEventListener("click", (e) => {
    const btn = e.target.closest(".event-comment");
    if (btn) abrirComentario(btn.dataset.comentar);
  });
  const modal = document.getElementById("comment-modal");
  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-cclose")) cerrarComentario();
  });
  document.getElementById("comment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    enviarComentario();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) cerrarComentario();
  });
}
```

- [ ] **Step 3: Llamar `initComentarios` en el arranque**

En el `DOMContentLoaded` (~línea 549), agregar la llamada:

```javascript
document.addEventListener("DOMContentLoaded", () => {
  render();
  initColapsables();
  initToTop();
  initGaleria();
  initLightbox();
  initComentarios();
});
```

- [ ] **Step 4: Verificar la validación (sin enviar todavía)**

Con `COMENTARIOS_URL` aún en el placeholder, recargar Live Server. Abrir una junta
pasada → botón "💬 Enviar comentario". En el modal:
- Dar "Enviar" vacío → aparece el mensaje rojo y se resalta "Nombre".
- Llenar Nombre, dejar "¿Qué te gustó?" vacío → se resalta ese campo.
- Esc y clic en el fondo / ✕ cierran el modal.
- El encabezado muestra la junta correcta (ej. "Junta de Comunidad / INI · Lun 29 de junio · 2026").

(El envío real se prueba en la Task 6, cuando ya esté la URL.)

---

### Task 6: Conectar la URL real y probar de punta a punta

**Files:**
- Modify: `app.js` — reemplazar el placeholder de `COMENTARIOS_URL`.

**Interfaces:**
- Consume: `COMENTARIOS_URL` real (Task 1).

- [ ] **Step 1: Pegar la URL real**

Reemplazar `"PEGAR_AQUI_LA_URL_/exec"` en `app.js` por la URL `/exec` que entregó la
Task 1.

- [ ] **Step 2: Enviar un comentario de prueba real desde Live Server**

Recargar. Abrir la junta del 29 de junio → "💬 Enviar comentario". Llenar:
- Nombre: "Prueba"
- ¿Qué te gustó?: "Todo estuvo bien"
- ¿Qué mejorar?: (dejar vacío)

Dar "Enviar". Esperado: aparece "¡Gracias! Recibimos tu comentario 🙏" y el modal se
cierra solo.

- [ ] **Step 3: Verificar la fila en el Sheet**

Abrir el Google Sheet, pestaña "Comentarios". Esperado: una fila nueva con
`[fecha/hora, "Junio-29", "Junta de Comunidad / INI · Lun 29 de junio · 2026", "Prueba", "Todo estuvo bien", ""]`.
Borrar la fila de prueba.

- [ ] **Step 4: Verificar que el botón no aparece en juntas futuras**

En la agenda, confirmar que una junta futura (ej. Julio 13) NO tiene el botón de
comentario.

---

### Task 7: Cache-busting y commit final (todo junto)

**Files:**
- Modify: `index.html` (parámetros `?v=` de `styles.css` y `app.js`).

- [ ] **Step 1: Actualizar el `?v=` de los assets**

En `index.html`, cambiar el timestamp de ambas referencias a la fecha/hora actual, ej.:
- `<link rel="stylesheet" href="styles.css?v=202607021230" />`
- `<script src="app.js?v=202607021230"></script>`

(Usar el mismo timestamp en ambos.)

- [ ] **Step 2: Verificación final en Live Server**

Recargar con caché limpio (Ctrl+F5). Reconfirmar rápidamente: botón en juntas pasadas,
modal abre/valida/envía, fila llega al Sheet, botón ausente en juntas futuras, y el resto
de la página (filtros, galerías, lightbox, meses colapsables) sigue funcionando igual.

- [ ] **Step 3: Commit de todo el feature**

```bash
git add index.html styles.css app.js docs/superpowers/
git commit -m "Comentarios privados por junta: botón + modal que envía a Google Sheets"
```

(Confirmar con Jorge antes de `git push`, según su flujo habitual.)

---

## Self-Review

- **Cobertura del spec:** experiencia del miembro → Tasks 2-5; ligado a la junta →
  Task 4 (`data-comentar`) + Task 5 (`juntaClave`/`juntaTitulo`); solo juntas cerradas →
  Task 4 (`yaFue`); estructura del Sheet → Task 1; arquitectura fetch→Apps Script→Sheet →
  Tasks 1 y 5; validación (nombre + "qué gustó") → Task 5 Step 2/4; manejo de errores →
  Task 5 (try/catch, is-error, submit disabled); pruebas antes de commit → Tasks 5-6, sin
  commit hasta Task 7; costo $0 y pasos en Google → Task 1. Sin huecos.
- **Placeholders:** el único intencional es `PEGAR_AQUI_LA_URL_/exec`, resuelto en Task 6
  Step 1 con la URL de Task 1. Todo lo demás lleva código completo.
- **Consistencia de tipos/nombres:** IDs del modal (`comment-*`) usados igual en Tasks 2 y 5;
  `data-comentar` producido en Task 4 y leído en Task 5; `COMENTARIOS_URL` definido en
  Task 5 Step 1 y usado en Step 2 y Task 6; parámetros POST (`juntaClave`, `juntaTitulo`,
  `nombre`, `gusto`, `mejorar`) idénticos entre el Apps Script (Task 1) y el `fetch` (Task 5).
