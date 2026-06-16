# Manual de actualización — Calendario ÉL VIVE

Todo lo que cambia (agregar, quitar o editar eventos) se hace en **`app.js`**, en el arreglo `EVENTOS`. No necesitas tocar `index.html` ni `styles.css`.

## 1. Agregar o editar un evento

Cada evento es una línea como esta:

```js
{ mes: "Junio", dia: 28, dow: "Dom", cat: "misa", titulo: "Misa mensual", hora: "5:00 p.m." },
```

Campos:

| Campo | Obligatorio | Qué poner | Ejemplo |
|---|:---:|---|---|
| `mes` | Sí | Mes del evento (con mayúscula) | `"Octubre"` |
| `dia` | Sí | Número del día (o texto para rangos) | `24` |
| `dow` | Sí | Día de la semana abreviado | `"Sáb"` |
| `cat` | Sí | Categoría (define el color) | `"economica"` |
| `titulo` | Sí | Nombre del evento | `"Actividad económica grande"` |
| `desc` | No | Texto secundario (segunda línea) | `"Incluye convivencia y oración."` |
| `hora` | No | Hora; aparece como etiqueta | `"5:00 p.m."` |
| `rango` | No | `true` si abarca varios días | `true` |

**Días de la semana válidos:** `Lun`, `Mar`, `Mié`, `Jue`, `Vie`, `Sáb`, `Dom`.

## 2. Categorías disponibles (campo `cat`)

| `cat` | Etiqueta y color |
|---|---|
| `consejo` | Junta de Consejo (borgoña) |
| `apostolado` | Apostolado (verde) |
| `misa` | Misa (azul) |
| `matrimonios` | Matrimonios · KIDS · Juntas (rosa) |
| `economica` | Económica (dorado) |
| `especial` | Especial (terracota) |

> Si necesitas una categoría nueva, agrégala en el objeto `CATEGORIAS` (arriba en `app.js`) y define su color en `styles.css` (variables `--c-...`).

## 3. Evento de varios días (rango)

Para algo como las vacaciones:

```js
{ mes: "Agosto", dia: "3 – 13", dow: "Lun a Jue", cat: "especial",
  titulo: "Vacaciones", desc: "Del lunes 3 al jueves 13 de agosto.", rango: true },
```

## 4. Quitar un evento
Borra su línea completa (incluida la coma al final).

## 5. Cambiar el orden
Los meses se ordenan solos según la lista `ORDEN_MESES`. Dentro de un mes, los eventos aparecen en el orden en que los escribes; lo más claro es escribirlos por día.

## 6. Publicar los cambios (GitHub Pages)
1. Guarda `app.js`.
2. Haz commit y push de los cambios.
3. GitHub Pages actualiza el sitio en uno o dos minutos.

## Consejo
Después de editar, abre la página y revisa que no haya errores: si un evento desaparece, casi siempre es por una **coma faltante** o un `cat` mal escrito.
