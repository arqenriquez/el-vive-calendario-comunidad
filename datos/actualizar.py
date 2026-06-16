# -*- coding: utf-8 -*-
"""
Lee el Excel editado (datos/calendario-el-vive.xlsx) y:
  1) genera datos/eventos.json
  2) reescribe el bloque EVENTOS dentro de ../app.js
El día de la semana se recalcula automáticamente (salvo en eventos de rango).

Uso:
    python datos/actualizar.py
"""
import json
import os
import re
from datetime import date

import openpyxl

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
XLSX_PATH = os.path.join(AQUI, "calendario-el-vive.xlsx")
JSON_PATH = os.path.join(AQUI, "eventos.json")
APPJS_PATH = os.path.join(RAIZ, "app.js")

ANIO = 2026
ORDEN_MESES = ["Junio", "Julio", "Agosto", "Septiembre",
               "Octubre", "Noviembre", "Diciembre"]
MES_NUM = {m: i for i, m in enumerate(
    ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
     "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"], start=1)}

# nombre amigable (Excel) -> clave interna
NOMBRE_CAT = {
    "Lunes de Junta": "comunidad",
    "Junta de Comunidad / INI": "comunidad",
    "Junta de Consejo": "consejo",
    "Apostolado": "apostolado",
    "Misa": "misa",
    "Matrimonios · KIDS · Juntas": "matrimonios",
    "Económica": "economica",
    "Especial": "especial",
}
DOW_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]  # weekday(): Lun=0


def limpio(v):
    return "" if v is None else str(v).strip()


def parse_dia(v):
    """Devuelve int si es un día simple, o el texto tal cual si es un rango."""
    s = limpio(v)
    if re.fullmatch(r"\d+", s):
        return int(s)
    # ¿venía como float 8.0 desde Excel?
    if re.fullmatch(r"\d+\.0", s):
        return int(float(s))
    return s


def dow_es(mes, dia):
    try:
        return DOW_ES[date(ANIO, MES_NUM[mes], int(dia)).weekday()]
    except (ValueError, KeyError, TypeError):
        return ""


def leer_excel():
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws = wb["Calendario"]
    eventos = []
    for fila in ws.iter_rows(min_row=2, values_only=True):
        mes = limpio(fila[0])
        if not mes:
            continue  # fila vacía
        dia = parse_dia(fila[1])
        dow_excel = limpio(fila[2])
        cat_nombre = limpio(fila[3])
        titulo = limpio(fila[4])
        hora = limpio(fila[5])
        desc = limpio(fila[6])
        rango = limpio(fila[7]).lower() in ("sí", "si", "x", "verdadero", "true")

        cat = NOMBRE_CAT.get(cat_nombre, cat_nombre)
        # dow: para rangos respeta lo escrito; si no, recalcula desde la fecha
        dow = dow_excel if rango else (dow_es(mes, dia) or dow_excel)

        e = {"mes": mes, "dia": dia, "dow": dow, "cat": cat, "titulo": titulo}
        if hora:
            e["hora"] = hora
        if desc:
            e["desc"] = desc
        if rango:
            e["rango"] = True
        eventos.append(e)

    # Ordena por mes y día inicial
    def clave(e):
        try:
            d = int(re.split(r"[–\-]", str(e["dia"]))[0].strip())
        except ValueError:
            d = 0
        return (ORDEN_MESES.index(e["mes"]) if e["mes"] in ORDEN_MESES else 99, d)

    eventos.sort(key=clave)
    return eventos


def js_valor(v):
    if isinstance(v, int):
        return str(v)
    return json.dumps(v, ensure_ascii=False)


def evento_a_js(e):
    partes = [f'mes: {js_valor(e["mes"])}',
              f'dia: {js_valor(e["dia"])}',
              f'dow: {js_valor(e["dow"])}',
              f'cat: {js_valor(e["cat"])}',
              f'titulo: {js_valor(e["titulo"])}']
    if e.get("desc"):
        partes.append(f'desc: {js_valor(e["desc"])}')
    if e.get("hora"):
        partes.append(f'hora: {js_valor(e["hora"])}')
    if e.get("rango"):
        partes.append("rango: true")
    return "  { " + ", ".join(partes) + " },"


def construir_bloque(eventos):
    lineas = ["const EVENTOS = ["]
    for mes in ORDEN_MESES:
        delmes = [e for e in eventos if e["mes"] == mes]
        if not delmes:
            continue
        lineas.append(f"  // ===== {mes.upper()} =====")
        lineas.extend(evento_a_js(e) for e in delmes)
        lineas.append("")
    if lineas[-1] == "":
        lineas.pop()
    lineas.append("];")
    return "\n".join(lineas)


def actualizar_appjs(eventos):
    with open(APPJS_PATH, encoding="utf-8") as f:
        src = f.read()
    nuevo = construir_bloque(eventos)
    # Reemplaza desde "const EVENTOS = [" hasta el primer "];"
    patron = re.compile(r"const EVENTOS = \[.*?\n\];", re.DOTALL)
    if not patron.search(src):
        raise SystemExit("No encontré el bloque EVENTOS en app.js")
    src = patron.sub(lambda _: nuevo, src, count=1)
    with open(APPJS_PATH, "w", encoding="utf-8") as f:
        f.write(src)


def main():
    eventos = leer_excel()
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(eventos, f, ensure_ascii=False, indent=2)
    actualizar_appjs(eventos)
    print(f"Listo: {len(eventos)} eventos -> eventos.json y app.js actualizados.")


if __name__ == "__main__":
    main()
