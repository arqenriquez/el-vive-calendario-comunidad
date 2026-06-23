/* ===================================================
   CALENDARIO ÉL VIVE · Junio – Diciembre 2026
   Datos + render + filtros + animaciones
   ---------------------------------------------------
   ¿CÓMO EDITAR?  Modifica el arreglo EVENTOS de abajo.
   Cada evento:
     { mes, dia, dow, cat, titulo, desc?, hora?, rango? }
   - mes:    "Junio" ... "Diciembre"
   - dia:    número (o texto para rangos, ej. "3 – 13")
   - dow:    día de la semana (Lun, Mar, Mié, Jue, Vie, Sáb, Dom)
   - cat:    comunidad | apostolado | misa | matrimonios | economica | especial
   - hora:   opcional, ej. "5:00 p.m."
   - rango:  true si abarca varios días (vacaciones)
   =================================================== */

const CATEGORIAS = {
  comunidad:   { nombre: "Lunes de Junta", color: "var(--c-comunidad)" },
  apostolado:  { nombre: "Apostolado",        color: "var(--c-apostolado)" },
  misa:        { nombre: "Misa",              color: "var(--c-misa)" },
  matrimonios: { nombre: "Matrimonios · KIDS · Juntas", color: "var(--c-matrimonios)" },
  economica:   { nombre: "Económica",         color: "var(--c-economica)" },
  especial:    { nombre: "Especial",          color: "var(--c-especial)" },
};

const ANIO = 2026;

const ORDEN_MESES = ["Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Mes (texto) -> índice de mes de JavaScript (0 = enero)
const MES_NUM = {
  Enero: 0, Febrero: 1, Marzo: 2, Abril: 3, Mayo: 4, Junio: 5,
  Julio: 6, Agosto: 7, Septiembre: 8, Octubre: 9, Noviembre: 10, Diciembre: 11,
};

// Último día que abarca el evento (para rangos como "3 – 13" usa el 13)
function diaFin(e) {
  if (typeof e.dia === "number") return e.dia;
  const nums = String(e.dia).match(/\d+/g);
  return nums && nums.length ? Number(nums[nums.length - 1]) : 1;
}

// ¿El evento ya terminó respecto a la fecha de HOY? (se recalcula en cada carga)
function esPasado(e) {
  if (!String(e.dia).trim()) return false; // sin fecha definida: nunca se atenúa
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(ANIO, MES_NUM[e.mes], diaFin(e));
  return fin < hoy;
}

// Clave única de un evento por mes y día (ej. "Junio-15"). Sirve para ligar su galería.
function claveEvento(e) {
  return `${e.mes}-${e.dia}`;
}

// ¿La junta ya se realizó? Sí cuando pasó su fecha, o cuando ya tiene fotos
// cargadas (si hay fotos, es porque ya ocurrió, aunque sea hoy mismo).
function yaFue(e) {
  return esPasado(e) || Boolean(GALERIAS[claveEvento(e)]);
}

const EVENTOS = [
  // ===== JUNIO =====
  { mes: "Junio", dia: 1, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Junio", dia: 8, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación", hora: "8:00 p.m." },
  { mes: "Junio", dia: 15, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Junio", dia: 22, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Junio", dia: 29, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Junio", dia: 30, dow: "Mar", cat: "apostolado", titulo: "Apostolado mensual", desc: "Hospital General del Estado (Blvd. Colosio y Quintero Arce)", hora: "7:30 p.m." },

  // ===== JULIO =====
  { mes: "Julio", dia: 5, dow: "Dom", cat: "misa", titulo: "Misa mensual", desc: "Domingo", hora: "5:00 p.m." },
  { mes: "Julio", dia: 6, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación", hora: "8:00 p.m." },
  { mes: "Julio", dia: 13, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Julio", dia: 20, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Julio", dia: "24 – 26", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #121 de Monterrey", desc: "Nos unimos todos en oración", rango: true },
  { mes: "Julio", dia: 27, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Julio", dia: "31 – 2", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #122 de Monterrey", desc: "Nos unimos todos en oración", rango: true },
  { mes: "Julio", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y Fecha exacta por definir" },

  // ===== AGOSTO =====
  { mes: "Agosto", dia: "3 – 16", dow: "Lun a Dom", cat: "especial", titulo: "Vacaciones", desc: "Del lunes 3 al domingo 16 de agosto.", rango: true },
  { mes: "Agosto", dia: 11, dow: "Mar", cat: "misa", titulo: "Misa por el 30.º Aniversario de la Comunidad ÉL VIVE" },
  { mes: "Agosto", dia: 17, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Agosto", dia: 24, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Agosto", dia: 29, dow: "Sáb", cat: "economica", titulo: "Actividad económica chica" },
  { mes: "Agosto", dia: 29, dow: "Sáb", cat: "misa", titulo: "Misa mensual", desc: "Sabado", hora: "5:00 p.m." },
  { mes: "Agosto", dia: 31, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación", hora: "8:00 p.m." },
  { mes: "Agosto", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y Fecha exacta por definir" },

  // ===== SEPTIEMBRE =====
  { mes: "Septiembre", dia: "4 – 6", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #3 de Chihuahua", desc: "Nos unimos todos en oración", rango: true },
  { mes: "Septiembre", dia: 5, dow: "Sáb", cat: "misa", titulo: "Misa de Niños", desc: "Sabado", hora: "5:00 p.m." },
  { mes: "Septiembre", dia: 7, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Septiembre", dia: 14, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Septiembre", dia: 15, dow: "Mar", cat: "especial", titulo: "Kermés de la Parroquia La Resurrección" },
  { mes: "Septiembre", dia: 21, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Septiembre", dia: 26, dow: "Sáb", cat: "misa", titulo: "Misa mensual", desc: "Sabado", hora: "5:00 p.m." },
  { mes: "Septiembre", dia: 28, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación", hora: "8:00 p.m." },
  { mes: "Septiembre", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y Fecha exacta por definir" },

  // ===== OCTUBRE =====
  { mes: "Octubre", dia: 5, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Octubre", dia: 10, dow: "Sáb", cat: "especial", titulo: "Primera limpieza de rancho con Comunidad de Iniciación 1", desc: "Incluye un momento de convivencia, oración y encuentro en el rancho." },
  { mes: "Octubre", dia: 12, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Octubre", dia: 19, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Octubre", dia: 24, dow: "Sáb", cat: "economica", titulo: "Actividad económica grande (Conferencias)" },
  { mes: "Octubre", dia: 24, dow: "Sáb", cat: "misa", titulo: "Misa mensual", desc: "Sabado", hora: "5:00 p.m." },
  { mes: "Octubre", dia: 26, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación", hora: "8:00 p.m." },
  { mes: "Octubre", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y Fecha exacta por definir" },

  // ===== NOVIEMBRE =====
  { mes: "Noviembre", dia: 2, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Noviembre", dia: 2, dow: "Lun", cat: "economica", titulo: "Entrega de boletos de la Mega Rifa" },
  { mes: "Noviembre", dia: 9, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Noviembre", dia: 14, dow: "Sáb", cat: "misa", titulo: "Misa mensual y convivencia con KIDS", desc: "(O apostolado con KIDS, por definir.)", hora: "5:00 p.m." },
  { mes: "Noviembre", dia: 16, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Noviembre", dia: 23, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación", hora: "8:00 p.m." },
  { mes: "Noviembre", dia: 28, dow: "Sáb", cat: "especial", titulo: "Limpieza de rancho" },
  { mes: "Noviembre", dia: 30, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Noviembre", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y Fecha exacta por definir" },

  // ===== DICIEMBRE =====
  { mes: "Diciembre", dia: 7, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Diciembre", dia: 8, dow: "Mar", cat: "economica", titulo: "Mega Rifa" },
  { mes: "Diciembre", dia: 11, dow: "Vie", cat: "especial", titulo: "Peregrinación" },
  { mes: "Diciembre", dia: 12, dow: "Sáb", cat: "especial", titulo: "Día de la Virgen, misa y Posada KIDS" },
  { mes: "Diciembre", dia: 14, dow: "Lun", cat: "especial", titulo: "Posada durante la junta", desc: "Última junta del mes de diciembre." },
  { mes: "Diciembre", dia: 17, dow: "Jue", cat: "especial", titulo: "Última Hora Santa del año" },
  { mes: "Diciembre", dia: "", dow: "", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar y Fecha exacta por definir" },
];

/* ===================================================
   GALERÍAS DE FOTOS (juntas que ya pasaron)
   ---------------------------------------------------
   Esto NO se toca al "actualizar el calendario" desde el Excel:
   vive aparte del arreglo EVENTOS, así que tus fotos no se borran.

   ¿CÓMO AGREGAR FOTOS A UNA JUNTA?
   1. La clave es "Mes-Día" y debe coincidir con la junta del calendario
      (ej. "Junio-15" = la junta del 15 de junio).
   2. Cada foto tiene "src" (ruta del archivo) y "caption" (texto debajo).
   3. Sube los archivos a la carpeta indicada en "src".
   Las fotos solo se ven al dar clic en juntas que YA pasaron.
   =================================================== */
const GALERIAS = {
  "Junio-22": {
    fotos: [
      { src: "assets/galerias/2026-06-22/imagen-01.jpg", caption: "Junta de Iniciación #1" },
      { src: "assets/galerias/2026-06-22/imagen-02.jpg", caption: "Junta de Iniciación #1" },
      { src: "assets/galerias/2026-06-22/imagen-03.jpg", caption: "Junta de Comunidad" },
      { src: "assets/galerias/2026-06-22/imagen-04.jpg", caption: "Junta de Comunidad" },
    ],
  },
  "Junio-8": {
    fotos: [
      {
        src: "assets/galerias/2026-06-08/imagen-01-junta-matrimonios.jpg",
        caption: "Este Lunes tuvimos nuestra 1er junta de ÉL VIVE Matrimonios",
      },
      {
        src: "assets/galerias/2026-06-08/imagen-02-junta-kids.jpg",
        caption: "Este Lunes tuvimos nuestra 1er junta de ÉL VIVE Kids",
      },
      {
        src: "assets/galerias/2026-06-08/imagen-03-junta-comunidad.jpg",
        caption: "Este lunes nos compartió tema CODEPRO de la Arquidiócesis de Hermosillo",
      },
    ],
  },
  "Junio-15": {
    fotos: [
      {
        src: "assets/galerias/2026-06-15/imagen-01-junta-ini.jpg",
        caption: "Este día platicamos del tema del Pecado y sus consecuencias",
      },
      {
        src: "assets/galerias/2026-06-15/imagen-02-junta-comunidad.jpg",
        caption: "Este día estuvimos hablando acerca de la vida de grandes santos de nuestra Iglesia",
      },
    ],
  },
};

/* ============ RENDER ============ */
function render() {
  renderFiltros();
  renderAgenda();
  observarReveal();
}

function renderFiltros() {
  const cont = document.getElementById("filters-inner");
  const chips = [`<button class="chip active" data-cat="todos"><span class="dot" style="--cat:var(--verde)"></span>Todos</button>`];
  for (const [key, c] of Object.entries(CATEGORIAS)) {
    chips.push(
      `<button class="chip" data-cat="${key}" style="--cat:${c.color}"><span class="dot"></span>${c.nombre}</button>`
    );
  }
  cont.innerHTML = chips.join("");
  cont.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    cont.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    aplicarFiltro(btn.dataset.cat);
  });
}

function renderAgenda() {
  const agenda = document.getElementById("agenda");
  let html = "";
  for (const mes of ORDEN_MESES) {
    const eventos = EVENTOS.filter((e) => e.mes === mes);
    if (!eventos.length) continue;
    html += `<section class="month" data-mes="${mes}">
      <div class="month-head reveal">
        <span class="month-name">${mes}</span>
        <span class="month-year">${ANIO}</span>
        <span class="month-line"></span>
      </div>
      <div class="timeline">
        ${eventos.map(eventoHTML).join("")}
      </div>
    </section>`;
  }
  agenda.innerHTML = html;
}

function eventoHTML(e) {
  const c = CATEGORIAS[e.cat];
  const hora = e.hora ? `<span class="event-time">🕐 ${e.hora}</span>` : "";
  const desc = e.desc ? `<p class="event-desc">${e.desc}</p>` : "";
  const seRealizo = yaFue(e);
  const pasado = seRealizo ? "past" : "";
  const doneCheck = seRealizo
    ? `<span class="event-done" title="Ya se realizó" aria-label="Ya se realizó">✓</span>`
    : "";

  // Eventos sin día definido (ej. apostolado "fecha por definir"): casilla especial.
  const sinFecha = !String(e.dia).trim();
  const fechaBox = sinFecha
    ? `<span class="event-num event-num--tbd">📅</span><span class="event-dow">por definir</span>`
    : `<span class="event-dow">${e.dow}</span><span class="event-num">${e.dia}</span>`;

  // Galería: juntas que ya se realizaron y tienen fotos registradas.
  const clave = claveEvento(e);
  const tieneGaleria = seRealizo && GALERIAS[clave];
  const galClass = tieneGaleria ? "has-gallery" : "";
  const galAttrs = tieneGaleria
    ? `data-galeria="${clave}" tabindex="0" role="button" aria-label="Ver fotos de ${e.titulo}"`
    : "";
  const galHint = tieneGaleria
    ? `<span class="event-photos-hint">📷 Ver fotos</span>`
    : "";

  return `<article class="event reveal ${e.rango ? "is-range" : ""} ${pasado} ${galClass}" data-cat="${e.cat}" ${galAttrs} style="--cat:${c.color}">
    ${doneCheck}
    <div class="event-date${sinFecha ? " event-date--tbd" : ""}">
      ${fechaBox}
    </div>
    <div class="event-body">
      <h3 class="event-title">${e.titulo}</h3>
      ${desc}
      <div class="event-meta">
        ${hora}
        <span class="event-tag">${c.nombre}</span>
        ${galHint}
      </div>
    </div>
  </article>`;
}

/* ============ FILTRO ============ */
function aplicarFiltro(cat) {
  const eventos = document.querySelectorAll(".event");
  eventos.forEach((ev) => {
    const match = cat === "todos" || ev.dataset.cat === cat;
    ev.classList.toggle("filtered-out", !match);
  });
  // Ocultar meses que quedaron vacíos
  document.querySelectorAll(".month").forEach((m) => {
    const visibles = m.querySelectorAll(".event:not(.filtered-out)").length;
    m.classList.toggle("month-hidden", visibles === 0);
  });
  const algo = document.querySelectorAll(".event:not(.filtered-out)").length;
  document.getElementById("empty-state").hidden = algo !== 0;
}

/* ============ ANIMACIONES AL SCROLL ============ */
function observarReveal() {
  const mostrar = (el) => el.classList.add("in");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Revela al entrar en pantalla, o si ya quedó por encima del viewport
        // (p. ej. tras un salto de scroll o recarga con posición restaurada).
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          mostrar(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => {
    // Lo que ya está visible o por encima al cargar, se muestra sin esperar.
    if (el.getBoundingClientRect().top < window.innerHeight) mostrar(el);
    else io.observe(el);
  });
}

/* ============ BOTÓN ARRIBA ============ */
function initToTop() {
  const btn = document.getElementById("to-top");
  btn.hidden = false;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ============ GALERÍA DE FOTOS ============ */
let galeriaActual = []; // fotos de la galería abierta (las usa el lightbox)

function fotoHTML(f, i) {
  const cap = f.caption ? `<figcaption class="gallery-caption">${f.caption}</figcaption>` : "";
  return `<figure class="gallery-item">
    <div class="gallery-imgwrap" data-index="${i}">
      <img src="${f.src}" alt="${f.caption || "Foto " + (i + 1)}" loading="lazy"
           onerror="this.closest('.gallery-imgwrap').classList.add('is-empty')" />
      <div class="gallery-placeholder">
        <span class="ph-icon">📷</span>
        <span class="ph-text">Imagen pendiente</span>
      </div>
    </div>
    ${cap}
  </figure>`;
}

function abrirGaleria(clave) {
  const gal = GALERIAS[clave];
  if (!gal) return;
  galeriaActual = gal.fotos;
  const ev = EVENTOS.find((e) => claveEvento(e) === clave);
  const modal = document.getElementById("gallery-modal");
  document.getElementById("gallery-title").textContent = ev ? ev.titulo : "Fotos de la junta";
  document.getElementById("gallery-date").textContent = ev ? `${ev.dow} ${ev.dia} de ${ev.mes} · ${ANIO}` : "";
  document.getElementById("gallery-grid").innerHTML = gal.fotos.map(fotoHTML).join("");
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("gallery-close").focus();
}

function cerrarGaleria() {
  const modal = document.getElementById("gallery-modal");
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function initGaleria() {
  const agenda = document.getElementById("agenda");
  const abrirDesde = (target) => {
    const art = target.closest(".event.has-gallery");
    if (art) abrirGaleria(art.dataset.galeria);
  };
  agenda.addEventListener("click", (e) => abrirDesde(e.target));
  agenda.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      abrirDesde(e.target);
    }
  });
  const modal = document.getElementById("gallery-modal");
  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close")) cerrarGaleria();
  });
  document.addEventListener("keydown", (e) => {
    // Esc cierra la galería, salvo cuando el lightbox está encima (ese se cierra primero).
    const lbAbierto = !document.getElementById("lightbox").hidden;
    if (e.key === "Escape" && !modal.hidden && !lbAbierto) cerrarGaleria();
  });
}

/* ============ LIGHTBOX (foto en pantalla completa) ============ */
let lbIndex = 0;

function mostrarFotoLb() {
  const f = galeriaActual[lbIndex];
  if (!f) return;
  const img = document.getElementById("lb-img");
  img.src = f.src;
  img.alt = f.caption || `Foto ${lbIndex + 1}`;
  document.getElementById("lb-caption").textContent = f.caption || "";
}

function abrirLightbox(i) {
  if (!galeriaActual.length) return;
  lbIndex = i;
  const lb = document.getElementById("lightbox");
  const varias = galeriaActual.length > 1;
  document.getElementById("lb-prev").hidden = !varias;
  document.getElementById("lb-next").hidden = !varias;
  mostrarFotoLb();
  lb.hidden = false;
  lb.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("lb-close").focus();
}

function lbMover(dir) {
  if (!galeriaActual.length) return;
  lbIndex = (lbIndex + dir + galeriaActual.length) % galeriaActual.length;
  mostrarFotoLb();
}

function cerrarLightbox() {
  const lb = document.getElementById("lightbox");
  lb.hidden = true;
  lb.setAttribute("aria-hidden", "true");
  // Si la galería sigue abierta debajo, mantenemos el scroll bloqueado.
  if (document.getElementById("gallery-modal").hidden) document.body.style.overflow = "";
}

function initLightbox() {
  // Abrir al hacer clic en una foto real de la galería.
  document.getElementById("gallery-grid").addEventListener("click", (e) => {
    const wrap = e.target.closest(".gallery-imgwrap");
    if (!wrap || wrap.classList.contains("is-empty")) return;
    abrirLightbox(Number(wrap.dataset.index || 0));
  });

  const lb = document.getElementById("lightbox");
  document.getElementById("lb-prev").addEventListener("click", () => lbMover(-1));
  document.getElementById("lb-next").addEventListener("click", () => lbMover(1));
  lb.addEventListener("click", (e) => {
    // Cierra al tocar el fondo o la ✕ (no al tocar la imagen o las flechas).
    if (e.target.hasAttribute("data-lb-close") || e.target === lb) cerrarLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") cerrarLightbox();
    else if (e.key === "ArrowLeft") lbMover(-1);
    else if (e.key === "ArrowRight") lbMover(1);
  });
}

/* ============ INIT ============ */
document.addEventListener("DOMContentLoaded", () => {
  render();
  initToTop();
  initGaleria();
  initLightbox();
});
