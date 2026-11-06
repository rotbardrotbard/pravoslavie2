#!/usr/bin/env python3
"""Оптимизация сгенерированных фото для прототипа: 960px, JPEG q80."""
import os
from PIL import Image

SRC = "/home/z/my-project/assets/src"
DST = "/home/z/my-project/public/images"
os.makedirs(DST, exist_ok=True)

FILES = [
    "hero-church",  # онбординг — заставка
    "candles",      # дом — «С чего начать»
    "domes",        # дом — именины
    "day-header",   # календарь — шапка дня
    "bell",         # календарь — именины-баннер
    "interior",     # молитва — счётчик
    "monastery",    # ещё — профиль
    # Пакет А — витрина храмов
    "temple-white",      # белый пятиглавый храм
    "temple-winter",     # храм в снегу, рассвет
    "temple-wooden",     # деревянная часовня в лесу
    "temple-night",      # ночной храм с подсветкой куполов
    "temple-belltower",  # колокольня в утренней дымке
    "temple-autumn",     # храм в золотой осени
    # Пакет Б — открытки и подарки
    "card-angel",   # фигурка ангела при свече
    "card-easter",  # пасхальные яйца и верба
    "card-icon",    # красный угол с лампадой
    "card-flowers", # белые лилии у икон
    "card-candle",  # свеча в руке
    "card-gift",    # образок в подарочной коробке
    # Пакет В — обложки библиотеки
    "lib-gospel",   # Евангелие на аналое
    "lib-psalter",  # Псалтирь на полке
    "lib-cell",     # монашеская келья со свечой
    "lib-desert",   # пустыня на рассвете
    "lib-grove",    # сосновая роща
    "lib-inkwell",  # чернильница и письма
    # Пакет Г — иконописные образы святых для библиотеки
    "icon-bishop-1", "icon-bishop-2", "icon-bishop-3", "icon-priest",
    "icon-elder-1", "icon-elder-2", "icon-blessed",
    "icon-healer", "icon-warrior", "icon-prince", "icon-princess",
    "icon-martyr-1", "icon-martyr-2", "icon-three",
    "icon-apostle", "icon-apostles-2", "icon-archangel", "icon-prophet",
    "icon-deacon", "icon-royal-2", "icon-scribes-2", "icon-couple-2",
]

for name in FILES:
    src_path = os.path.join(SRC, f"{name}.png")
    dst_path = os.path.join(DST, f"{name}.jpg")
    im = Image.open(src_path).convert("RGB")
    w, h = im.size
    if w > 960:
        im = im.resize((960, round(h * 960 / w)), Image.LANCZOS)
    im.save(dst_path, "JPEG", quality=80, optimize=True, progressive=True)
    kb = os.path.getsize(dst_path) / 1024
    print(f"{name}.jpg  {im.size[0]}x{im.size[1]}  {kb:.0f} KB")

# Проверка, что файлы не пустые и не однотонные
import statistics
for name in FILES:
    p = os.path.join(DST, f"{name}.jpg")
    im = Image.open(p).convert("L").resize((64, 64))
    px = list(im.getdata())
    var = statistics.pvariance(px)
    assert var > 200, f"{name}: слишком однотонное изображение (var={var})"
print("OK: все изображения валидны и контрастны")
