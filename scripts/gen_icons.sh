#!/bin/bash
# Пакет Г: иконописные образы святых для библиотеки (канон, золото, без текста).
cd /home/z/my-project
mkdir -p assets/src

STYLE="Orthodox Christian icon painting, canonical Russian-Byzantine style, front-facing figure, halo around head, gold leaf background, dark deep tones with gold highlights, tempera on wood panel, solemn and reverent, high quality, detailed, no text, no letters, no inscriptions, no watermark, no border ornaments"

gen() {
  name="$1"; prompt="$2"
  if [ -s "assets/src/${name}.png" ]; then echo "SKIP ${name}"; return; fi
  for attempt in 1 2 3; do
    if z-ai image -p "$prompt, $STYLE" -o "assets/src/${name}.png" -s 864x1152 >/dev/null 2>&1 \
       && [ -s "assets/src/${name}.png" ]; then
      echo "OK   ${name} (попытка ${attempt})"; return
    fi
    echo "ERR  ${name} попытка ${attempt}"; sleep 2
  done
  echo "FAIL ${name}"
}

BATCH="${1:-all}"

if [ "$BATCH" = "1" ] || [ "$BATCH" = "all" ]; then
  # ── Святители ──
  gen icon-bishop-1 "full figure of bearded bishop saint in white mitre and dark omophorion with crosses, holding closed Gospel book in left hand, right hand in blessing gesture"
  gen icon-bishop-2 "full figure of strict ascetic bishop saint in dark brown phelonion and white hood, holding unrolled parchment scroll, long dark beard, thin holy face"
  gen icon-bishop-3 "full figure of gentle bishop saint in bright blue and gold vestments with open book, medium beard, warm merciful expression"
  gen icon-priest    "full figure of righteous grey-bearded Orthodox priest saint in dark cassock with shining white epitrachelion stole, holding hand cross, humble face"
  # ── Преподобные ──
  gen icon-elder-1   "full figure of venerable elder monk saint with very long white beard, right hand blessing, prayer rope in left hand, dark monastic mantle and hood"
  gen icon-elder-2   "full figure of venerable monk saint in dark ryassa robe, holding unrolled scroll, long grey beard, ascetic thin face, deep eyes"
  # ── Блаженные ──
  gen icon-blessed   "full figure of blessed elderly woman saint in white headscarf and simple dark coat, holding small icon of the Mother of God, peaceful humble face"
fi

if [ "$BATCH" = "2" ] || [ "$BATCH" = "all" ]; then
  # ── Воины и целители ──
  gen icon-healer    "full figure of young beardless healer martyr saint in white tunic with dark red cloak, holding small medicine box, golden halo"
  gen icon-warrior   "full figure of warrior martyr saint in roman armor with red cape, holding spear and round shield, young bearded face"
  gen icon-prince    "full figure of righteous prince saint in dark blue princely robe with fur-trimmed cloak, holding sword pointing down, short beard"
  gen icon-princess  "full figure of princess martyr saint in dark red princely robe with white headscarf, holding small cross in hands"
  # ── Мученицы ──
  gen icon-martyr-1  "full figure of female great martyr saint with uncovered hair and golden diadem, dark red cloak, holding cross in both hands"
  gen icon-martyr-2  "full figure of female martyr saint in dark maphorion headscarf, holding small holy vessel, calm strong face"
  gen icon-three     "three young female martyr saints standing together with elder mother saint behind them, each holding small cross, united composition"
fi

if [ "$BATCH" = "3" ] || [ "$BATCH" = "all" ]; then
  # ── Апостолы и пророки ──
  gen icon-apostle    "full figure of apostle saint with curly beard in brown and blue robes, holding Gospel book"
  gen icon-apostles-2 "two chief apostle saints standing side by side, elder one holding keys, younger one holding sword, both with halos"
  gen icon-archangel  "mighty archangel in silver armor with spear and sword, large spread wings, stern beautiful face, imperial presence"
  gen icon-prophet    "prophet saint with long dark hair and beard in camel-skin garment over shoulders, holding unrolled scroll"
  gen icon-deacon     "young archdeacon martyr saint in ornate deacon vestments with long stole, holding burning church censer"
  # ── Пары святых ──
  gen icon-royal-2    "married royal saints couple standing together, prince saint and princess saint in dark red robes with white headscarf, holding cross between them"
  gen icon-scribes-2  "two brother saints standing side by side in dark robes, holding open books and unrolled scroll, scholarly faces"
  gen icon-couple-2   "two righteous saints standing together, elder bearded man and modest woman in maphorion, both holding small crosses"
fi

echo "── ГОТОВО (батч $BATCH) ──"
