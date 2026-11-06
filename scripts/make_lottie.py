#!/usr/bin/env python3
"""Анимированная иконка загрузки мини-приложения «Православные» (Lottie JSON).
Требования каталога: 96x96, Lottie JSON, не больше 24 КБ.
Стиль бренда: тёмный графит + золото, без бордо.
Сюжет: тёмный диск -> золотая дуга-спиннер на орбите -> пульсирующий
восьмиконечный крест в центре. Бесшовный цикл 90 кадров @ 60 fps (1.5 c).
"""
import json
import os

OUT = "/home/z/my-project/download/loading-96x96.json"

# --- палитра (RGB в 0..1) ----------------------------------------------------
GOLD = [0.894, 0.722, 0.298, 1.0]        # #E4B84C
GOLD_LIGHT = [0.976, 0.886, 0.608, 1.0]  # #F9E29B
BG_TOP = [0.145, 0.188, 0.251]           # #253040
BG_MID = [0.102, 0.133, 0.176]           # #1A222D
BG_EDGE = [0.063, 0.082, 0.110]          # #10151C

FR = 60      # fps
OP = 90      # длительность цикла в кадрах (1.5 c)

# --- помощники ---------------------------------------------------------------
LIN = ({"x": [0.5], "y": [0.5]}, {"x": [0.5], "y": [0.5]})          # линейно
SOFT = ({"x": [0.42], "y": [1.0]}, {"x": [0.58], "y": [0.0]})       # синусоида


def kf(t, s, ease=LIN):
    k = {"t": t, "s": s}
    i, o = ease
    k["i"], k["o"] = i, o
    return k


def val(k):
    return {"a": 0, "k": k}


def tr(p=[0, 0], r=0):
    return {"ty": "tr", "p": val(p), "a": val([0, 0]), "s": val([100, 100]),
            "r": val(r), "o": val(100), "sk": val(0), "sa": val(0), "nm": "tr"}


def layer(ind, nm, ks, shapes):
    return {"ddd": 0, "ind": ind, "ty": 4, "nm": nm, "sr": 1, "ks": ks,
            "ao": 0, "shapes": shapes, "ip": 0, "op": OP, "st": 0, "bm": 0}


# --- слой 4: фон (тёмный диск с радиальным градиентом + золотое свечение) ----
bg_ks = {"o": val(100), "r": val(0), "p": val([48, 48, 0]),
         "a": val([0, 0, 0]), "s": val([100, 100, 100])}
bg_shapes = [
    # свечение за крестом
    {"ty": "gr", "nm": "glow", "it": [
        {"ty": "el", "d": 1, "s": val([30, 30]), "p": val([0, 2]), "nm": "g"},
        {"ty": "fl", "c": val(GOLD), "o": val(9), "nm": "gf"},
        tr(),
    ]},
    # диск с радиальным градиентом как у иконки
    {"ty": "gr", "nm": "disc", "it": [
        {"ty": "el", "d": 1, "s": val([88, 88]), "p": val([0, 0]), "nm": "d"},
        {"ty": "gf", "o": val(100), "t": 2,
         "s": val([0, -6]), "e": val([46, 0]), "h": val(0), "a": val(0),
         "g": {"p": 3, "k": val(
             [0, *BG_TOP, 0.55, *BG_MID, 1, *BG_EDGE])},
         "nm": "bgGrad"},
        tr(),
    ]},
]

# --- слой 3: бледная орбита (статичный трек) ---------------------------------
track_ks = {"o": val(20), "r": val(0), "p": val([48, 48, 0]),
            "a": val([0, 0, 0]), "s": val([100, 100, 100])}
track_shapes = [
    {"ty": "gr", "nm": "orbit", "it": [
        {"ty": "el", "d": 1, "s": val([58, 58]), "p": val([0, 0]), "nm": "ring"},
        {"ty": "st", "c": val(GOLD), "o": val(100), "w": val(6.5),
         "lc": 2, "lj": 2, "ml": 1, "nm": "stroke"},
        tr(),
    ]},
]

# --- слой 2: золотая дуга-спиннер (вращение 360° + «дыхание» длины) ----------
spin_ks = {
    "o": val(100),
    "r": {"a": 1, "k": [kf(0, [0]), kf(OP, [360])]},
    "p": val([48, 48, 0]),
    "a": val([0, 0, 0]),
    "s": val([100, 100, 100]),
}
spin_shapes = [
    {"ty": "gr", "nm": "arc", "it": [
        {"ty": "el", "d": 1, "s": val([58, 58]), "p": val([0, 0]), "nm": "ring"},
        {"ty": "st", "c": val(GOLD_LIGHT), "o": val(100), "w": val(6.5),
         "lc": 2, "lj": 2, "ml": 1, "nm": "stroke"},
        {"ty": "tm", "s": val(0),
         "e": {"a": 1, "k": [kf(0, [18]), kf(45, [75]), kf(OP, [18])]},
         "o": val(0), "m": 1, "nm": "trim"},
        tr(),
    ]},
]

# --- слой 1: пульсирующий восьмиконечный крест в центре ----------------------
cross_ks = {
    "o": {"a": 1, "k": [kf(0, [62], SOFT), kf(45, [100], SOFT), kf(OP, [62], SOFT)]},
    "r": val(0),
    "p": val([48, 48, 0]),
    "a": val([0, 0, 0]),
    "s": {"a": 1, "k": [kf(0, [100, 100, 100], SOFT),
                        kf(45, [114, 114, 100], SOFT),
                        kf(OP, [100, 100, 100], SOFT)]},
}
cross_shapes = [
    # наклонная нижняя перекладина (левый конец приподнят, как на иконке)
    {"ty": "gr", "nm": "slant", "it": [
        {"ty": "rc", "d": 1, "s": val([10, 3]), "p": val([0, 0]),
         "r": val(1.2), "nm": "bar"},
        {"ty": "fl", "c": val(GOLD), "o": val(100), "nm": "f"},
        tr(p=[0, 7.8], r=24),
    ]},
    # вертикаль и верхняя перекладина
    {"ty": "gr", "nm": "main", "it": [
        {"ty": "rc", "d": 1, "s": val([3.4, 21]), "p": val([0, 0]),
         "r": val(1.4), "nm": "v"},
        {"ty": "rc", "d": 1, "s": val([11.5, 3.2]), "p": val([0, -4]),
         "r": val(1.4), "nm": "h"},
        {"ty": "fl", "c": val(GOLD_LIGHT), "o": val(100), "nm": "f"},
        tr(),
    ]},
]

# --- сборка -------------------------------------------------------------------
anim = {
    "v": "5.7.4",
    "fr": FR,
    "ip": 0,
    "op": OP,
    "w": 96,
    "h": 96,
    "nm": "pravoslavie-loading",
    "ddd": 0,
    "assets": [],
    # в Lottie первый слой в массиве рисуется поверх остальных
    "layers": [
        layer(1, "cross", cross_ks, cross_shapes),
        layer(2, "spinner", spin_ks, spin_shapes),
        layer(3, "orbit", track_ks, track_shapes),
        layer(4, "bg", bg_ks, bg_shapes),
    ],
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(anim, f, separators=(",", ":"), ensure_ascii=False)

size = os.path.getsize(OUT)
json.load(open(OUT))  # проверка валидности
kb = size / 1024
print(f"OK: {OUT}  {size} bytes ({kb:.1f} KB)  лимит 24 КБ -> {'PASSED' if size <= 24 * 1024 else 'FAIL'}")
