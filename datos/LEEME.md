# Edición del calendario por Excel

Esta carpeta contiene la fuente editable del calendario y las herramientas para
convertirla en lo que usa la página web.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| **calendario-el-vive.xlsx** | El Excel que editas tú. Una fila por actividad. |
| `eventos.json` | Datos en formato JSON (se genera solo; no lo edites a mano). |
| `actualizar.py` | Convierte el Excel → `eventos.json` y actualiza `app.js`. |
| `_generar_excel.py` | Regenera el Excel desde el JSON (raras veces se necesita). |

## Cómo actualizar fechas

1. Abre **calendario-el-vive.xlsx**.
2. Cambia lo que necesites:
   - Para mover una fecha: edita la columna **Día** (y **Mes** si cambia de mes).
   - El **Día semana** se recalcula automáticamente; no hace falta tocarlo.
   - **Categoría** y **Mes** tienen menú desplegable.
   - **Hora** y **Descripción** son opcionales.
   - **Rango (varios días)**: pon `Sí` solo en eventos de varios días (ej. Vacaciones);
     ahí escribe el rango en **Día** (ej. `3 – 13`) y el **Día semana** a mano (ej. `Lun a Jue`).
   - Para **agregar** un evento: añade una fila. Para **eliminar**: borra la fila.
3. Guarda el Excel.
4. Pídeme: **"actualiza el calendario"**. Yo ejecuto `actualizar.py`, se regenera el
   JSON, se actualiza `app.js` y se publica en la web.

## Comando manual (si lo quieres correr tú)

```bash
python datos/actualizar.py
```

> Requiere Python con `openpyxl` (`pip install openpyxl`).
