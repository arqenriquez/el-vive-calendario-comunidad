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

// URL de la aplicación web de Google Apps Script que recibe los comentarios.
// (Pública, no secreta.) Los comentarios llegan a un Google Sheet privado del dueño.
const COMENTARIOS_URL = "https://script.google.com/macros/s/AKfycbzmlawCn-ajfGgoIe01zWkRbdrq_OUj3C_VLyR04N9rXebYRTrEoGYswELS1YYko4Rx_g/exec";

const ORDEN_MESES = ["Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Mes (texto) -> índice de mes de JavaScript (0 = enero)
const MES_NUM = {
  Enero: 0, Febrero: 1, Marzo: 2, Abril: 3, Mayo: 4, Junio: 5,
  Julio: 6, Agosto: 7, Septiembre: 8, Octubre: 9, Noviembre: 10, Diciembre: 11,
};

/* ===== Estado de la interfaz (vista Lista / Mes) ===== */
let vistaActual = "lista";   // 'lista' | 'mes'
let filtroActivo = "todos";  // categoría activa (compartida entre ambas vistas)
let mesActual = 0;           // índice dentro de ORDEN_MESES (grilla mostrada)

// Etiquetas para el modal de detalle del día (ej. "Martes 7 de julio").
const DOW_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MAX_EVENTOS_DIA = 3; // barras visibles por celda antes de "+N más"

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
  const nums = String(e.dia).match(/\d+/g);
  let mesFin = MES_NUM[e.mes];
  // Rango que cruza de mes (ej. "31 – 2" = 31 jul al 2 ago): el último día
  // es menor que el primero, así que el fin cae en el mes siguiente.
  if (nums && nums.length > 1 && Number(nums[nums.length - 1]) < Number(nums[0])) {
    mesFin += 1; // new Date maneja el desborde (dic -> enero del año siguiente)
  }
  const fin = new Date(ANIO, mesFin, diaFin(e));
  return fin < hoy;
}

// Clave única de un evento por mes y día (ej. "Junio-15"). Sirve para ligar su galería.
function claveEvento(e) {
  return `${e.mes}-${e.dia}`;
}

// ¿Es el evento de "Vacaciones"? Se pinta en un naranja más claro que los
// retiros para diferenciarlos (ambos son de categoría "especial").
function esVacaciones(e) {
  return /^vacaciones/i.test((e.titulo || "").trim());
}

/* ===== Fechas para la vista Mes ===== */
// Fecha sin horas (para comparar solo por día).
function soloDia(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
// ¿Son el mismo día del calendario?
function mismaFecha(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
// Rango { inicio, fin } (objetos Date) que abarca un evento, o null si no tiene fecha.
// Soporta día único (número), rango en el mes ("24 – 26") y rango que cruza de
// mes ("31 – 2", donde el 2.º número es menor que el 1.º).
function rangoEvento(e) {
  const m1 = MES_NUM[e.mes];
  const dia = e.dia;
  if (dia === "" || dia === undefined || dia === null) return null;
  if (typeof dia === "number") {
    return { inicio: new Date(ANIO, m1, dia), fin: new Date(ANIO, m1, dia) };
  }
  const nums = String(dia).split(/[–-]/).map((s) => parseInt(s.trim(), 10));
  const d1 = nums[0];
  const d2 = nums.length > 1 && !isNaN(nums[1]) ? nums[1] : d1;
  const m2 = d2 < d1 ? m1 + 1 : m1; // el rango cruza al mes siguiente
  return { inicio: new Date(ANIO, m1, d1), fin: new Date(ANIO, m2, d2) };
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

  // ===== JULIO =====
  { mes: "Julio", dia: 1, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Hospital General del Estado (Blvd. Colosio y Quintero Arce)", hora: "8:00 p.m.", mapa: "https://maps.app.goo.gl/wZGdSHUt6B2ged2w8", reprogramado: true },
  { mes: "Julio", dia: 5, dow: "Dom", cat: "misa", titulo: "Misa mensual", desc: "Domingo", hora: "5:00 p.m." },
  { mes: "Julio", dia: 6, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación", hora: "8:00 p.m." },
  { mes: "Julio", dia: 13, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Julio", dia: 20, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Julio", dia: "24 – 26", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #121 de Monterrey", desc: "Nos unimos todos en oración", rango: true },
  { mes: "Julio", dia: 27, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Julio", dia: 29, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Julio", dia: "31 – 2", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #122 de Monterrey", desc: "Nos unimos todos en oración", rango: true },

  // ===== AGOSTO =====
  { mes: "Agosto", dia: "3 – 16", dow: "Lun a Dom", cat: "especial", titulo: "Vacaciones", desc: "Del lunes 3 al domingo 16 de agosto.", rango: true },
  { mes: "Agosto", dia: 11, dow: "Mar", cat: "misa", titulo: "Misa por el 30.º Aniversario de la Comunidad ÉL VIVE" },
  { mes: "Agosto", dia: 17, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Agosto", dia: 19, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Agosto", dia: 24, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación", hora: "8:00 p.m." },
  { mes: "Agosto", dia: 29, dow: "Sáb", cat: "economica", titulo: "Actividad económica chica" },
  { mes: "Agosto", dia: 30, dow: "Dom", cat: "misa", titulo: "Misa mensual", desc: "Domingo", hora: "5:00 p.m." },
  { mes: "Agosto", dia: 31, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },

  // ===== SEPTIEMBRE =====
  { mes: "Septiembre", dia: "4 – 6", dow: "Vie a Dom", cat: "especial", titulo: "Retiro #3 de Chihuahua", desc: "Nos unimos todos en oración", rango: true },
  { mes: "Septiembre", dia: 7, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Septiembre", dia: 14, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Septiembre", dia: 15, dow: "Mar", cat: "especial", titulo: "Kermés de la Parroquia La Resurrección" },
  { mes: "Septiembre", dia: 21, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Septiembre", dia: 23, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Septiembre", dia: 27, dow: "Dom", cat: "misa", titulo: "Misa Mensual - Misa de niños", desc: "Domingo", hora: "5:00 p.m." },
  { mes: "Septiembre", dia: 28, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación", hora: "8:00 p.m." },

  // ===== OCTUBRE =====
  { mes: "Octubre", dia: 5, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Octubre", dia: 10, dow: "Sáb", cat: "especial", titulo: "Primera limpieza de rancho con Comunidad de Iniciación 1", desc: "Incluye un momento de convivencia, oración y encuentro en el rancho." },
  { mes: "Octubre", dia: 12, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Octubre", dia: 14, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Octubre", dia: 19, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Octubre", dia: 24, dow: "Sáb", cat: "economica", titulo: "Actividad económica grande (Conferencias)" },
  { mes: "Octubre", dia: 25, dow: "Dom", cat: "misa", titulo: "Misa mensual", desc: "Domingo", hora: "5:00 p.m." },
  { mes: "Octubre", dia: 26, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación", hora: "8:00 p.m." },

  // ===== NOVIEMBRE =====
  { mes: "Noviembre", dia: 2, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Noviembre", dia: 2, dow: "Lun", cat: "economica", titulo: "Entrega de boletos de la Mega Rifa" },
  { mes: "Noviembre", dia: 9, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Noviembre", dia: 14, dow: "Sáb", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Noviembre", dia: 15, dow: "Dom", cat: "misa", titulo: "Misa mensual y convivencia con KIDS", desc: "(O apostolado con KIDS, por definir.)", hora: "5:00 p.m." },
  { mes: "Noviembre", dia: 16, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Noviembre", dia: 23, dow: "Lun", cat: "matrimonios", titulo: "Matrimonios ÉL VIVE, KIDS y Juntas de Comunidad e Iniciación", hora: "8:00 p.m." },
  { mes: "Noviembre", dia: 28, dow: "Sáb", cat: "especial", titulo: "Limpieza de rancho" },
  { mes: "Noviembre", dia: 30, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },

  // ===== DICIEMBRE =====
  { mes: "Diciembre", dia: 7, dow: "Lun", cat: "comunidad", titulo: "Junta de Comunidad / INI", hora: "8:00 p.m." },
  { mes: "Diciembre", dia: 8, dow: "Mar", cat: "economica", titulo: "Mega Rifa" },
  { mes: "Diciembre", dia: 9, dow: "Mié", cat: "apostolado", titulo: "Apostolado mensual", desc: "Lugar por definir" },
  { mes: "Diciembre", dia: 11, dow: "Vie", cat: "especial", titulo: "Peregrinación" },
  { mes: "Diciembre", dia: 12, dow: "Sáb", cat: "especial", titulo: "Día de la Virgen, misa y Posada KIDS" },
  { mes: "Diciembre", dia: 14, dow: "Lun", cat: "especial", titulo: "Posada durante la junta", desc: "Última junta del mes de diciembre." },
  { mes: "Diciembre", dia: 17, dow: "Jue", cat: "especial", titulo: "Última Hora Santa del año" },
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
  "Julio-13": {
    fotos: [
      { src: "assets/galerias/2026-07-13/imagen-01.jpg", caption: "Junta de Iniciación, tema de LA FE" },
      { src: "assets/galerias/2026-07-13/imagen-02.jpg", caption: "Junta de iniciación" },
      { src: "assets/galerias/2026-07-13/imagen-03.jpg", caption: "Junta de iniciación, nuestra hermana Citlali nos compartió el tema" },
      { src: "assets/galerias/2026-07-13/imagen-04.jpg", caption: "Comunidad de Iniciación" },
      { src: "assets/galerias/2026-07-13/imagen-05.jpg", caption: "Junta de comunidad, tema de LA ORACIÓN" },
      { src: "assets/galerias/2026-07-13/imagen-06.jpg", caption: "Junta de comunidad" },
    ],
  },
  "Julio-6": {
    fotos: [
      { src: "assets/galerias/2026-07-06/imagen-01.jpg", caption: "Junta de Comunidad + INI 1" },
      { src: "assets/galerias/2026-07-06/imagen-02.jpg", caption: "Junta de ÉL VIVE Matrimonios" },
      { src: "assets/galerias/2026-07-06/imagen-03.jpg", caption: "Junta de Comunidad + INI 1" },
      { src: "assets/galerias/2026-07-06/imagen-04.jpg", caption: "Junta de ÉL VIVE Kids" },
    ],
  },
  "Julio-1": {
    fotos: [
      { src: "assets/galerias/2026-07-01/imagen-01.jpg", caption: "Apostolado mensual · 1 de julio" },
      { src: "assets/galerias/2026-07-01/imagen-02.jpg", caption: "Apostolado mensual · 1 de julio" },
      { src: "assets/galerias/2026-07-01/imagen-03.jpg", caption: "Apostolado mensual · 1 de julio" },
      { src: "assets/galerias/2026-07-01/imagen-04.jpg", caption: "Apostolado mensual · 1 de julio" },
    ],
  },
  "Junio-29": {
    fotos: [
      { src: "assets/galerias/2026-06-29/imagen-01.jpg", caption: "Junta de Comunidad / INI · 29 de junio" },
      { src: "assets/galerias/2026-06-29/imagen-02.jpg", caption: "Junta de Comunidad / INI · 29 de junio" },
      { src: "assets/galerias/2026-06-29/imagen-03.jpg", caption: "Junta de Comunidad / INI · 29 de junio" },
      { src: "assets/galerias/2026-06-29/imagen-04.jpg", caption: "Junta de Comunidad / INI · 29 de junio" },
      { src: "assets/galerias/2026-06-29/imagen-05.jpg", caption: "Junta de Comunidad / INI · 29 de junio" },
      { src: "assets/galerias/2026-06-29/imagen-06.jpg", caption: "Junta de Comunidad / INI · 29 de junio" },
    ],
  },
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
      {
        src: "assets/galerias/2026-06-08/imagen-04.jpg",
        caption: "Matrimonios ÉL VIVE, KIDS y Juntas · 8 de junio",
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
  "Junio-1": {
    fotos: [
      { src: "assets/galerias/2026-06-01/imagen-01.jpg", caption: "Junta de Comunidad / INI · 1 de junio" },
      { src: "assets/galerias/2026-06-01/imagen-02.jpg", caption: "Junta de Comunidad / INI · 1 de junio" },
      { src: "assets/galerias/2026-06-01/imagen-03.jpg", caption: "Junta de Comunidad / INI · 1 de junio" },
      { src: "assets/galerias/2026-06-01/imagen-04.jpg", caption: "Junta de Comunidad / INI · 1 de junio" },
    ],
  },
};

/* ===================================================
   INFO (imagen informativa de un evento, ej. flyer)
   ---------------------------------------------------
   Igual que GALERIAS pero para eventos PRÓXIMOS: muestra un botón
   "ℹ️ Ver info" que abre la imagen a pantalla completa.
   Clave "Mes-Día" (debe coincidir con el evento del calendario).
   =================================================== */
const INFO = {
  "Julio-5": {
    fotos: [
      { src: "assets/galerias/2026-07-05/imagen-01.jpg", caption: "Misa mensual · domingo 5 de julio" },
    ],
  },
  "Julio-29": {
    fotos: [
      { src: "assets/galerias/2026-07-29/imagen-01.jpg", caption: "Apostolado mensual · miércoles 29 de julio" },
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
  const cont = document.getElementById("filter-dropdown");
  const opciones = [
    `<button class="filter-option is-active" role="menuitemradio" aria-checked="true" data-cat="todos" style="--cat:var(--verde)"><span class="dot"></span>Todos</button>`,
  ];
  for (const [key, c] of Object.entries(CATEGORIAS)) {
    opciones.push(
      `<button class="filter-option" role="menuitemradio" aria-checked="false" data-cat="${key}" style="--cat:${c.color}"><span class="dot"></span>${c.nombre}</button>`
    );
  }
  cont.innerHTML = opciones.join("");
  cont.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-option");
    if (!btn) return;
    seleccionarFiltro(btn.dataset.cat);
    cerrarMenuFiltro();
    document.getElementById("filter-toggle").focus();
  });
}

// Marca la opción activa, actualiza la etiqueta del botón y aplica el filtro.
function seleccionarFiltro(cat) {
  document.querySelectorAll(".filter-option").forEach((b) => {
    const on = b.dataset.cat === cat;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", on ? "true" : "false");
  });
  const toggle = document.getElementById("filter-toggle");
  const label = document.getElementById("filter-toggle-label");
  if (cat === "todos") {
    label.textContent = "Tipo de junta";
    toggle.classList.remove("has-filter");
    toggle.style.removeProperty("--cat");
  } else {
    label.textContent = CATEGORIAS[cat].nombre;
    toggle.classList.add("has-filter");
    toggle.style.setProperty("--cat", CATEGORIAS[cat].color);
  }
  aplicarFiltro(cat);
}

/* ===== Menú desplegable de filtros ===== */
function abrirMenuFiltro() {
  document.getElementById("filter-dropdown").hidden = false;
  document.getElementById("filter-toggle").setAttribute("aria-expanded", "true");
}
function cerrarMenuFiltro() {
  document.getElementById("filter-dropdown").hidden = true;
  document.getElementById("filter-toggle").setAttribute("aria-expanded", "false");
}
function initMenuFiltro() {
  const btn = document.getElementById("filter-toggle");
  const dd = document.getElementById("filter-dropdown");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dd.hidden ? abrirMenuFiltro() : cerrarMenuFiltro();
  });
  // Clic fuera del menú → cerrar.
  document.addEventListener("click", (e) => {
    if (!dd.hidden && !e.target.closest("#filter-menu")) cerrarMenuFiltro();
  });
  // Esc → cerrar (solo si no hay un modal encima que deba cerrarse primero).
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dd.hidden) cerrarMenuFiltro();
  });
}

// Meses que, aunque ya estén "cerrados" (todas sus fechas pasaron), queremos que
// carguen DESPLEGADOS por default. Siguen siendo colapsables: el toggle funciona
// igual y el usuario puede contraerlos con un clic.
// Vacío = todos los meses cerrados inician CONTRAÍDOS (incluido junio).
const MESES_ABIERTOS_INICIO = [];

function renderAgenda() {
  const agenda = document.getElementById("agenda");
  let html = "";
  for (const mes of ORDEN_MESES) {
    const eventos = EVENTOS.filter((e) => e.mes === mes);
    if (!eventos.length) continue;

    // Un mes está "cerrado" cuando TODAS sus fechas ya pasaron: se muestra
    // contraído (solo el título) y se despliega al dar clic. Así la página se
    // concentra en el mes vigente y los anteriores quedan como consulta.
    const cerrado = eventos.every(esPasado);
    // Algunos meses cerrados se cargan abiertos (ver MESES_ABIERTOS_INICIO),
    // pero conservan el toggle para poder contraerlos.
    const contraidoInicio = cerrado && !MESES_ABIERTOS_INICIO.includes(mes);

    const headInner = `
        <span class="month-name">${mes}</span>
        <span class="month-year">${ANIO}</span>
        <span class="month-line"></span>
        ${cerrado ? `<span class="month-count">Ver fechas anteriores</span><span class="month-chevron" aria-hidden="true">▾</span>` : ""}`;

    const head = cerrado
      ? `<button class="month-head month-head--toggle reveal" type="button" aria-expanded="${contraidoInicio ? "false" : "true"}" aria-controls="tl-${mes}">${headInner}</button>`
      : `<div class="month-head reveal">${headInner}</div>`;

    html += `<section class="month ${cerrado ? "month--collapsible" : ""}${contraidoInicio ? " is-collapsed" : ""}" data-mes="${mes}">
      ${head}
      <div class="timeline" id="tl-${mes}">
        ${eventos.map(eventoHTML).join("")}
      </div>
    </section>`;
  }
  agenda.innerHTML = html;
}

/* Despliega u oculta los meses ya cerrados (toggle contraído por default). */
function initColapsables() {
  const agenda = document.getElementById("agenda");
  agenda.addEventListener("click", (e) => {
    const head = e.target.closest(".month-head--toggle");
    if (!head) return;
    const section = head.closest(".month");
    const contraido = section.classList.toggle("is-collapsed");
    head.setAttribute("aria-expanded", contraido ? "false" : "true");
  });
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

  // Botón "Ver ubicación" (solo si el evento trae link de Google Maps).
  const mapa = e.mapa
    ? `<a class="event-map" href="${e.mapa}" target="_blank" rel="noopener noreferrer">📍 Ver ubicación</a>`
    : "";

  // Aviso de reprogramación / cambio de fecha.
  const reprog = e.reprogramado
    ? `<p class="event-reprog">🔁 Fecha actualizada</p>`
    : "";

  // Botón "Ver info" (imagen informativa, ej. flyer de un evento próximo).
  const infoBtn = INFO[clave]
    ? `<button class="event-info" type="button" data-info="${clave}">ℹ️ Ver info</button>`
    : "";

  // Botón "Enviar comentario": solo en juntas/eventos que ya se realizaron.
  const comentarBtn = seRealizo
    ? `<button class="event-comment" type="button" data-comentar="${clave}">💬 Enviar comentarios</button>`
    : "";

  return `<article class="event reveal ${e.rango ? "is-range" : ""} ${esVacaciones(e) ? "is-vacaciones" : ""} ${pasado} ${galClass}" data-cat="${e.cat}" ${galAttrs} style="--cat:${c.color}">
    ${doneCheck}
    <div class="event-date${sinFecha ? " event-date--tbd" : ""}">
      ${fechaBox}
    </div>
    <div class="event-body">
      <h3 class="event-title">${e.titulo}</h3>
      ${reprog}
      ${desc}
      <div class="event-meta">
        ${hora}
        ${mapa}
        ${infoBtn}
        <span class="event-tag">${c.nombre}</span>
        ${galHint}
        ${comentarBtn}
      </div>
    </div>
  </article>`;
}

/* ============ FILTRO (compartido entre Lista y Mes) ============ */
function aplicarFiltro(cat) {
  filtroActivo = cat;
  // Filtrado de la Lista (solo dentro de #agenda: no tocar tarjetas del modal).
  const eventos = document.querySelectorAll("#agenda .event");
  eventos.forEach((ev) => {
    const match = cat === "todos" || ev.dataset.cat === cat;
    ev.classList.toggle("filtered-out", !match);
  });
  // Ocultar meses que quedaron vacíos
  document.querySelectorAll(".month").forEach((m) => {
    const visibles = m.querySelectorAll(".event:not(.filtered-out)").length;
    m.classList.toggle("month-hidden", visibles === 0);
  });
  const algo = document.querySelectorAll("#agenda .event:not(.filtered-out)").length;
  // El aviso "sin actividades" de la Lista solo aplica cuando la Lista está visible.
  document.getElementById("empty-state").hidden = vistaActual !== "lista" || algo !== 0;
  // Si la grilla está activa, reflejar el filtro también ahí.
  if (vistaActual === "mes") renderMes();
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
  restaurarScroll();
}

function initGaleria() {
  const agenda = document.getElementById("agenda");
  const abrirDesde = (target) => {
    // No abrir la galería al tocar enlaces o botones dentro de la tarjeta
    // (ej. "Ver ubicación"): esos conservan su propia acción.
    if (target.closest("a, button")) return;
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
  const fig = img.closest(".lb-figure");
  // Si la imagen aún no se ha subido (404), mostramos un recuadro "pendiente"
  // en lugar del ícono de imagen rota.
  fig.classList.remove("is-empty");
  img.onerror = () => fig.classList.add("is-empty");
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
  // Si otro modal sigue abierto debajo, mantenemos el scroll bloqueado.
  restaurarScroll();
}

// Abre la imagen informativa ("Ver info") a pantalla completa en el lightbox.
function abrirInfo(clave) {
  const info = INFO[clave];
  if (!info) return;
  galeriaActual = info.fotos;
  abrirLightbox(0);
}

function initLightbox() {
  // Abrir al hacer clic en una foto real de la galería.
  document.getElementById("gallery-grid").addEventListener("click", (e) => {
    const wrap = e.target.closest(".gallery-imgwrap");
    if (!wrap || wrap.classList.contains("is-empty")) return;
    abrirLightbox(Number(wrap.dataset.index || 0));
  });

  // Botón "Ver info" de un evento (abre su imagen a pantalla completa).
  document.getElementById("agenda").addEventListener("click", (e) => {
    const btn = e.target.closest(".event-info");
    if (btn) abrirInfo(btn.dataset.info);
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
  restaurarScroll();
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

/* ===================================================
   VISTA MES (grilla mensual) + toggle Lista / Mes
   =================================================== */

// Restaura el scroll del body solo si NINGÚN modal sigue abierto.
function restaurarScroll() {
  const abierto = ["gallery-modal", "lightbox", "comment-modal", "dia-modal"]
    .some((id) => !document.getElementById(id).hidden);
  if (!abierto) document.body.style.overflow = "";
}

// Mes inicial de la grilla: el mes real actual si cae en el rango Jun–Dic 2026;
// si no, el extremo más cercano.
function mesInicial() {
  const hoy = new Date();
  if (hoy.getFullYear() !== ANIO) return hoy.getFullYear() < ANIO ? 0 : ORDEN_MESES.length - 1;
  const idx = hoy.getMonth() - MES_NUM["Junio"]; // Junio = índice 0 de ORDEN_MESES
  return Math.max(0, Math.min(ORDEN_MESES.length - 1, idx));
}

// Cambia entre vista Lista y vista Mes.
function setVista(v) {
  vistaActual = v;
  document.querySelectorAll(".view-btn").forEach((b) => {
    const on = b.dataset.vista === v;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const esMes = v === "mes";
  document.getElementById("agenda").hidden = esMes;
  document.getElementById("mes-view").hidden = !esMes;
  if (esMes) {
    document.getElementById("empty-state").hidden = true; // el aviso de la Lista no aplica aquí
    renderMes();
  } else {
    aplicarFiltro(filtroActivo); // recomputa el estado visible de la Lista
  }
}

// Reconstruye la grilla del mes actual aplicando el filtro activo.
function renderMes() {
  const mesNombre = ORDEN_MESES[mesActual];
  const jsMonth = MES_NUM[mesNombre];
  document.getElementById("mes-title").textContent = `${mesNombre} ${ANIO}`;

  // Flechas: deshabilitadas en los límites del rango permitido (Jun–Dic 2026).
  document.getElementById("mes-prev").disabled = mesActual === 0;
  document.getElementById("mes-next").disabled = mesActual === ORDEN_MESES.length - 1;

  // Eventos con fecha que pasan el filtro (los "sin fecha" no entran a la grilla).
  const visibles = EVENTOS.filter((e) => filtroActivo === "todos" || e.cat === filtroActivo);

  // Grilla lunes→domingo, 6 filas fijas (42 celdas) para altura consistente.
  const primero = new Date(ANIO, jsMonth, 1);
  const leadDow = (primero.getDay() + 6) % 7; // 0 = lunes
  const inicioGrid = new Date(ANIO, jsMonth, 1 - leadDow);
  const hoy = soloDia(new Date());

  let html = "";
  let hayEnMes = false;

  for (let i = 0; i < 42; i++) {
    const d = new Date(inicioGrid.getFullYear(), inicioGrid.getMonth(), inicioGrid.getDate() + i);
    const enMes = d.getMonth() === jsMonth;
    const esHoy = mismaFecha(d, hoy);

    // Eventos cuyo rango cubre este día.
    const delDia = visibles.filter((e) => {
      const r = rangoEvento(e);
      return r && d >= soloDia(r.inicio) && d <= soloDia(r.fin);
    });
    if (enMes && delDia.length) hayEnMes = true;

    const barras = delDia.slice(0, MAX_EVENTOS_DIA).map((e) => {
      const r = rangoEvento(e);
      const ini = mismaFecha(d, soloDia(r.inicio));
      const fin = mismaFecha(d, soloDia(r.fin));
      // Barra continua en rangos: solo se redondea en el 1.º y último día.
      const extremos = `${ini ? "is-start" : ""} ${fin ? "is-end" : ""}`.trim();
      const vac = esVacaciones(e) ? " is-vacaciones" : "";
      const texto = e.rango ? e.titulo : CATEGORIAS[e.cat].nombre;
      return `<span class="mes-bar ${extremos}${vac}" style="--cat:${CATEGORIAS[e.cat].color}" title="${e.titulo}">${texto}</span>`;
    }).join("");
    const extra = delDia.length - MAX_EVENTOS_DIA;
    const mas = extra > 0 ? `<span class="mes-more">+${extra} más</span>` : "";

    const clases = ["mes-cell", enMes ? "" : "mes-cell--out", delDia.length ? "has-eventos" : "", esHoy ? "is-today" : ""]
      .filter(Boolean).join(" ");
    const fechaKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    html += `<div class="${clases}" data-fecha="${fechaKey}">
      <span class="mes-daynum${esHoy ? " is-today" : ""}">${d.getDate()}</span>
      <div class="mes-bars">${barras}${mas}</div>
    </div>`;
  }

  document.getElementById("mes-grid").innerHTML = html;
  document.getElementById("mes-empty").hidden = hayEnMes;
}

// Abre el modal con el detalle de un día (reutiliza la tarjeta de la Lista).
function abrirDia(fecha) {
  const dia = soloDia(fecha);
  const delDia = EVENTOS.filter((e) => {
    if (filtroActivo !== "todos" && e.cat !== filtroActivo) return false;
    const r = rangoEvento(e);
    return r && dia >= soloDia(r.inicio) && dia <= soloDia(r.fin);
  });
  if (!delDia.length) return;

  document.getElementById("dia-title").textContent =
    `${DOW_LARGO[fecha.getDay()]} ${fecha.getDate()} de ${MESES_LARGO[fecha.getMonth()]}`;
  const cont = document.getElementById("dia-events");
  cont.innerHTML = delDia.map(eventoHTML).join("");
  // Las tarjetas nacen con .reveal (opacity:0); dentro del modal las mostramos ya.
  cont.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));

  const modal = document.getElementById("dia-modal");
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("dia-close").focus();
}

function cerrarDia() {
  const modal = document.getElementById("dia-modal");
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  restaurarScroll();
}

function initToggle() {
  document.getElementById("view-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest(".view-btn");
    if (btn) setVista(btn.dataset.vista);
  });
}

function initMes() {
  mesActual = mesInicial();
  document.getElementById("mes-prev").addEventListener("click", () => {
    if (mesActual > 0) { mesActual--; renderMes(); }
  });
  document.getElementById("mes-next").addEventListener("click", () => {
    if (mesActual < ORDEN_MESES.length - 1) { mesActual++; renderMes(); }
  });
  // Clic en una celda con eventos → abre el modal del día.
  document.getElementById("mes-grid").addEventListener("click", (e) => {
    const cell = e.target.closest(".mes-cell.has-eventos");
    if (!cell) return;
    const [y, m, dd] = cell.dataset.fecha.split("-").map(Number);
    abrirDia(new Date(y, m, dd));
  });
}

function initDiaModal() {
  const modal = document.getElementById("dia-modal");
  modal.addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-dclose")) cerrarDia();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || modal.hidden) return;
    // No cerrar el modal del día si hay otro modal encima (galería/comentario/lightbox).
    const encima = !document.getElementById("comment-modal").hidden
      || !document.getElementById("gallery-modal").hidden
      || !document.getElementById("lightbox").hidden;
    if (!encima) cerrarDia();
  });
  // Re-enganche de las acciones de la tarjeta dentro del modal del día
  // (los listeners originales viven en #agenda y no llegan hasta aquí).
  document.getElementById("dia-events").addEventListener("click", (e) => {
    const comentar = e.target.closest(".event-comment");
    if (comentar) { abrirComentario(comentar.dataset.comentar); return; }
    const info = e.target.closest(".event-info");
    if (info) { abrirInfo(info.dataset.info); return; }
    if (e.target.closest("a, button")) return; // links/botones conservan su acción
    const art = e.target.closest(".event.has-gallery");
    if (art) abrirGaleria(art.dataset.galeria);
  });
}

/* ============ INIT ============ */
document.addEventListener("DOMContentLoaded", () => {
  render();
  initColapsables();
  initToTop();
  initGaleria();
  initLightbox();
  initComentarios();
  initMenuFiltro();
  initToggle();
  initMes();
  initDiaModal();
});
