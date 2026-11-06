/* ═══════════════════════════════════════════════════════════
   Обложки библиотеки — иконописные образы святых и книги
   (стиль Antipa: тёмный графит + золото, мягкий градиент).

   Пакет Г: 22 канонических образа по ликам святости —
   святители (3), священник, преподобные старцы (2), блаженные,
   целители, воины, князья, княгини, мученицы (2+группа),
   апостолы (2), архангел, пророк, диакон, пары святых (3).

   Принципы:
   • один лик святости — один тип образа (святители → епископы,
     преподобные → старцы, воины → воин и т.д.);
   • соседние авторы цитат не повторяют обложку;
   • у одного автора все цитаты с одной обложкой — автор узнаваем;
   • книги (lib-gospel, lib-psalter) — для раздела ответов и
     отдельных авторов, где метафора книги важнее лика;
   • для неизвестных id — детерминированный подбор: у одного
     святого обложка всегда одна.
   ═══════════════════════════════════════════════════════════ */

const ICONS = {
  bishop1: "/images/icon-bishop-1.jpg",   // святитель в белом клобуке
  bishop2: "/images/icon-bishop-2.jpg",   // святитель-богослов со свитком
  bishop3: "/images/icon-bishop-3.jpg",   // святитель в митре с Евангелием
  priest:  "/images/icon-priest.jpg",     // праведный священник с крестом
  elder1:  "/images/icon-elder-1.jpg",    // старец с чётками, благословляет
  elder2:  "/images/icon-elder-2.jpg",    // монах-подвижник со свитком
  blessed: "/images/icon-blessed.jpg",    // блаженная с иконкой
  healer:  "/images/icon-healer.jpg",     // целитель-бессребреник
  warrior: "/images/icon-warrior.jpg",    // воин с копьём и щитом
  prince:  "/images/icon-prince.jpg",     // благоверный князь
  princess:"/images/icon-princess.jpg",   // благоверная княгиня
  martyr1: "/images/icon-martyr-1.jpg",   // великомученица с диадемой
  martyr2: "/images/icon-martyr-2.jpg",   // мученица в мафории
  three:   "/images/icon-three.jpg",      // Вера, Надежда, Любовь и София
  apostle: "/images/icon-apostle.jpg",    // апостол с Евангелием
  apostles2:"/images/icon-apostles-2.jpg",// Пётр и Павел
  archangel:"/images/icon-archangel.jpg", // Архистратиг Михаил
  prophet: "/images/icon-prophet.jpg",    // пророк в власянице со свитком
  deacon:  "/images/icon-deacon.jpg",     // архидиакон с кадилом
  royal2:  "/images/icon-royal-2.jpg",    // пара благоверных
  scribes2:"/images/icon-scribes-2.jpg",  // двое с книгами (просветители)
  couple2: "/images/icon-couple-2.jpg",   // пара праведных
} as const;

/* Книги — вторая линия обложек библиотеки */
const BOOKS = {
  gospel:  "/images/lib-gospel.jpg",   // Евангелие на аналое
  psalter: "/images/lib-psalter.jpg",  // Псалтирь, старая книга
  cell:    "/images/lib-cell.jpg",     // келья со свечой и книгой
} as const;

const PHOTOS: string[] = [
  ...Object.values(ICONS),
  BOOKS.gospel,
  BOOKS.psalter,
  BOOKS.cell,
];

/* Обложки житий — по каждому святому из подборки */
const CURATED: Record<string, string> = {
  /* Святители */
  nikolay: ICONS.bishop1,
  spiridon: ICONS.bishop3,
  luka: ICONS.bishop3,
  "ioann-zlatoust": ICONS.bishop2,
  "vasily-veliky": ICONS.bishop2,
  "ambrosiy-medio": ICONS.bishop2,
  "tihon-zadonsky": ICONS.bishop3,
  "nectariy-eginsky": ICONS.bishop3,
  "ignatiy-bryanchaninov": ICONS.bishop3,
  "feofan-zatvornik": ICONS.bishop2,
  /* Преподобные и старцы */
  serafim: ICONS.elder1,
  sergiy: ICONS.elder2,
  "amvrosiy-optinsky": ICONS.elder1,
  "pausiy-svyatogorets": ICONS.elder1,
  "efrem-sirin": ICONS.elder2,
  pecherskie: ICONS.elder2,
  /* Праведные священники */
  "ioann-kronstadt": ICONS.priest,
  "aleksey-mechov": ICONS.priest,
  /* Блаженные */
  matrona: ICONS.blessed,
  kseniya: ICONS.blessed,
  /* Целители */
  panteleimon: ICONS.healer,
  "kosma-damian": ICONS.healer,
  /* Воины и князья */
  georgiy: ICONS.warrior,
  "dimitry-solunsky": ICONS.warrior,
  "alexander-nevsky": ICONS.prince,
  ludmila: ICONS.princess,
  "petr-fevroniya": ICONS.royal2,
  "olga-vladimir": ICONS.royal2,
  /* Мученицы */
  ekaterina: ICONS.martyr1,
  tatiana: ICONS.martyr1,
  varvara: ICONS.martyr2,
  anastasia: ICONS.martyr2,
  "vera-nadezhda-lyubov": ICONS.three,
  /* Апостолы и пророки */
  andrey: ICONS.apostle,
  matfey: ICONS.apostle,
  filipp: ICONS.apostle,
  "petr-pavel": ICONS.apostles2,
  "arhangel-mihail": ICONS.archangel,
  iliya: ICONS.prophet,
  "ioann-predtecha": ICONS.prophet,
  stephan: ICONS.deacon,
  /* Просветители и пары праведных */
  "kirill-mefodiy": ICONS.scribes2,
  "ioakim-anna": ICONS.couple2,
  "kiprian-iustina": ICONS.couple2,
};

/* Обложки цитат святых отцов — по автору; соседние авторы
   различаются, внутри блока автора обложка едина. */
const FATHER_COVERS: Record<string, string> = {
  "Святитель Афанасий Великий": ICONS.bishop2,      // богослов «О воплощении»
  "Святитель Ириней Лионский": ICONS.bishop1,
  "Преподобный Ефрем Сирин": ICONS.elder2,
  "Преподобный авва Дорофей": ICONS.elder1,
  "Преподобный Иоанн Лествичник": ICONS.elder2,
  "Преподобный Исаак Сирин": BOOKS.psalter,         // «Слова подвижнические» — книга
  "Святитель Иоанн Златоуст": ICONS.bishop3,
  "Преподобный Лев Оптинский": ICONS.elder1,
  "Преподобный Амвросий Оптинский": ICONS.elder2,
  "Преподобный Нектарий Оптинский": ICONS.elder1,
  "Святитель Тихон Задонский": ICONS.bishop3,
  "Святитель Феофан Затворник": ICONS.bishop2,      // свиток — письма и наставления
  "Святитель Игнатий (Брянчанинов)": ICONS.bishop3,
  "Праведный Иоанн Кронштадтский": ICONS.priest,
  "Святитель Лука Крымский (Войно-Ясенецкий)": ICONS.bishop3,
  "Преподобный Серафим Саровский": ICONS.elder1,
  "Преподобный Паисий Святогорец": ICONS.elder2,
};

/* Обложка цитаты по автору; для неизвестного автора —
   детерминированный выбор по строке автора (стабильный). */
export function fatherCover(author: string): string {
  const curated = FATHER_COVERS[author];
  if (curated) return curated;
  let h = 0;
  for (let i = 0; i < author.length; i++) h = (h * 31 + author.charCodeAt(i)) >>> 0;
  return PHOTOS[h % PHOTOS.length];
}

export function lifeCover(id: string): string {
  const curated = CURATED[id];
  if (curated) return curated;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PHOTOS[h % PHOTOS.length];
}
