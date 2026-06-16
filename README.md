# Calendario ÉL VIVE · Junio – Diciembre 2026

Página web estática y visual con el calendario de actividades del Movimiento Juvenil Católico **ÉL VIVE**. Pensada para verse principalmente en celular, también responsiva en escritorio.

## Características
- **Agenda vertical por mes** (línea de tiempo) de Junio a Diciembre 2026.
- **Filtros por categoría** con colores: Junta de Consejo, Apostolado, Misa, Matrimonios·KIDS·Juntas, Económica y Especial.
- **Actividades permanentes** destacadas (lunes y jueves).
- **Animaciones suaves al hacer scroll**, tipografía **Poppins**.
- Sin frameworks ni backend: HTML + CSS + JS vanilla. Listo para **GitHub Pages**.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de la página |
| `styles.css` | Estilos, colores y animaciones |
| `app.js` | **Datos de los eventos** y lógica de filtros/animación |
| `assets/logo-el-vive.png` | Logotipo del encabezado y pie |
| `assets/favicon-el-vive.jpg` | Ícono de la pestaña |

## Cómo verlo localmente
Abre `index.html` en el navegador, o levanta un servidor estático:
```
python -m http.server 5599
```
y entra a `http://localhost:5599`.

## Editar fechas
Toda la información de eventos vive en el arreglo `EVENTOS` dentro de `app.js`.
Consulta **MANUAL-ACTUALIZACION.md** para el paso a paso.
