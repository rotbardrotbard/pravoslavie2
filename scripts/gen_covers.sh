#!/bin/bash
# Генерация пакетов изображений А/Б/В для «Православных».
# Стиль Antipa: тёмный графит + золото, мягкая виньетка, без текста.
cd /home/z/my-project
mkdir -p assets/src

gen() {
  name="$1"; size="$2"; prompt="$3"
  if [ -s "assets/src/${name}.png" ]; then echo "SKIP ${name}"; return; fi
  for attempt in 1 2 3; do
    if z-ai image -p "$prompt" -o "assets/src/${name}.png" -s "$size" >/dev/null 2>&1 \
       && [ -s "assets/src/${name}.png" ]; then
      echo "OK   ${name} (попытка ${attempt})"
      return
    fi
    echo "ERR  ${name} попытка ${attempt}"; sleep 2
  done
  echo "FAIL ${name}"
}

# ── Пакет А: витрина храмов ──────────────────────────────────────
gen temple-white    1152x864 "Photorealistic white stone Russian Orthodox church with five golden onion domes against deep blue evening sky, warm golden light on domes, dark graphite moody tones, soft vignette, dark edges, no people, no text, no watermark, high quality, detailed architecture photography"
gen temple-winter   1152x864 "Photorealistic white Russian Orthodox church in deep fresh snow at winter dawn, soft pink and golden sunrise light, dark blue shadows, moody graphite palette with golden highlights, soft vignette, no people, no text, no watermark, high quality"
gen temple-wooden   1152x864 "Photorealistic old wooden Russian Orthodox chapel with carved porch and small wooden dome among dark pine trees, warm golden evening light through branches, dark moody graphite and gold palette, soft vignette, no people, no text, no watermark, high quality"
gen temple-night    1152x864 "Photorealistic Russian Orthodox church at night, golden domes lit by warm floodlights against deep dark blue night sky, few lit windows, dark graphite moody atmosphere, soft vignette, no people, no text, no watermark, high quality"
gen temple-belltower 864x1152 "Photorealistic tall Russian Orthodox bell tower rising in light morning mist, golden domes in soft dawn light, dark graphite and gold moody palette, soft vignette, low angle view, no people, no text, no watermark, high quality"
gen temple-autumn   1152x864 "Photorealistic white Russian Orthodox church with golden domes among bright golden autumn foliage, warm amber light, dark moody graphite shadows, soft vignette, no people, no text, no watermark, high quality"

# ── Пакет Б: открытки и подарки ──────────────────────────────────
gen card-angel      864x1152 "Photorealistic small carved wooden angel figurine with golden wings standing on dark wooden table beside burning candle, warm golden candlelight, deep dark graphite background, moody atmosphere, soft vignette, no faces, no text, no watermark, high quality"
gen card-easter     1152x864 "Photorealistic Orthodox Easter still life: painted red and golden eggs with pussy willow branches on dark wooden table, warm candlelight, dark graphite background with golden highlights, moody, soft vignette, no text, no watermark, high quality"
gen card-icon       864x1152 "Photorealistic home Orthodox icon corner: old golden icon frame with oil lampada flame on dark wooden shelf, warm flickering light, deep dark graphite background, moody reverent atmosphere, soft vignette, no text, no watermark, high quality"
gen card-flowers    864x1152 "Photorealistic white lilies in front of dark blurred Orthodox church icon background, warm soft golden light, dark graphite moody palette with golden highlights, soft vignette, no text, no watermark, high quality"
gen card-candle     864x1152 "Photorealistic close-up of hand holding burning church candle with wax drops, warm golden flame light, deep dark graphite blurred background, moody atmosphere, soft vignette, no text, no watermark, high quality"
gen card-gift       864x1152 "Photorealistic small Orthodox desk icon in dark gift box tied with golden ribbon on dark wooden table, warm soft golden light, dark graphite moody background, elegant, soft vignette, no text, no watermark, high quality"

# ── Пакет В: обложки библиотеки ──────────────────────────────────
gen lib-gospel      864x1152 "Photorealistic old Gospel book with golden ornament cover on wooden lectern in dark church, burning candle beside it, warm golden light on pages, deep dark graphite background, moody reverent atmosphere, soft vignette, no readable text, no watermark, high quality"
gen lib-psalter     864x1152 "Photorealistic old worn Psalter prayer book with yellowed pages lying on dark wooden shelf, warm golden lamp light, deep dark graphite background, moody quiet atmosphere, soft vignette, no readable text, no watermark, high quality"
gen lib-cell        864x1152 "Photorealistic simple monastic cell: bare wooden table with burning candle, old book and small icon, dark graphite walls, warm golden candlelight, moody quiet atmosphere, soft vignette, no people, no readable text, no watermark, high quality"
gen lib-desert      1152x864 "Photorealistic vast desert landscape at dawn, lone rocky hill, golden sunrise light over sand, deep dark blue-graphite sky, moody ascetic atmosphere, soft vignette, no people, no text, no watermark, high quality"
gen lib-grove       864x1152 "Photorealistic quiet pine forest grove in soft golden morning light, sun rays between dark tree trunks, deep graphite shadows, moody peaceful atmosphere, soft vignette, no people, no text, no watermark, high quality"
gen lib-inkwell     864x1152 "Photorealistic old inkwell with feather quill pen and folded handwritten letters on dark wooden desk, warm golden candle light, deep dark graphite background, moody writer atmosphere, soft vignette, no readable text, no watermark, high quality"

echo "── Готово ──"
ls -la assets/src/ | tail -20
