/* Описания приложения «Православные» для каталога мини-приложений — docx */
/* eslint-disable @typescript-eslint/no-require-imports -- Node.js CLI script uses CommonJS imports. */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  Footer, PageNumber,
} = require("docx");
const fs = require("fs");

/* ── Палитра (Antipa-стиль: тёплая монохромная + благородный красный, без бордо) ── */
const INK = "23201C", BODY = "2A2723", SEC = "6E6560", ACC = "8A3B2E",
      SURF = "F6F2EC", LINE = "D8CFC2";
const F_HEAD = { ascii: "Georgia", hAnsi: "Georgia", cs: "Georgia" };
const F_BODY = { ascii: "Calibri", hAnsi: "Calibri", cs: "Calibri" };

/* ── Тексты кратких описаний (подсчёт символов — в консоль) ── */
const okText1 = "Православный ежедневник: церковный календарь и святцы, молитвослов, стих дня, Библия и жития святых с закладками, карта храмов поблизости. Все тексты — внутри приложения, без переходов на сторонние сайты. Светлая и тёмная темы.";
const okText2 = "Молитвослов и Библия в кармане: святцы, стих дня, жития святых с закладками и памятью чтения, храмы рядом. Короткая анкета при запуске подстроит приложение под вас.";
const vkText  = "Церковный календарь и святцы, молитвослов, стих дня, Библия и жития с закладками и памятью чтения, храмы рядом — всё внутри соцсети.";
const slogan  = "Православный ежедневник, который всегда с вами.";
const counts = [okText1, okText2, vkText, slogan].map(t => t.length);
console.log("Симв.: ОК-вариант1 =", counts[0], "| ОК-вариант2 =", counts[1], "| ВК =", counts[2], "| Слоган =", counts[3]);
if (counts[0] > 250 || counts[1] > 250) { console.error("ПРЕВЫШЕН ЛИМИТ 250 СИМВОЛОВ ДЛЯ ОК!"); process.exit(1); }

/* ── Хелперы ── */
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, font: F_HEAD, color: INK })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100, line: 312 },
    children: [new TextRun({ text, bold: true, font: F_HEAD, color: ACC })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 140, line: 312 },
    children: [new TextRun({ text, size: 22, font: F_BODY, color: BODY, ...opts })],
  });
}
function pLead(lead, rest) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 140, line: 312 },
    children: [
      new TextRun({ text: lead + " ", bold: true, size: 22, font: F_BODY, color: INK }),
      new TextRun({ text: rest, size: 22, font: F_BODY, color: BODY }),
    ],
  });
}
function note(text) {
  return new Paragraph({
    spacing: { after: 160, line: 312 },
    children: [new TextRun({ text, italics: true, size: 20, font: F_BODY, color: SEC })],
  });
}
const CELL_MARGINS = { top: 80, bottom: 80, left: 140, right: 140 };
function cell(text, { width, bold = false, fill = null, size = 20, color = BODY } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    margins: CELL_MARGINS,
    shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
    children: [new Paragraph({
      spacing: { line: 276 },
      children: [new TextRun({ text, bold, size, font: F_BODY, color })],
    })],
  });
}
function makeTable(widths, headerTexts, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        tableHeader: true, cantSplit: true,
        children: headerTexts.map((t, i) => cell(t, { width: widths[i], bold: true, fill: SURF, color: INK })),
      }),
      ...rows.map(r => new TableRow({
        cantSplit: true,
        children: r.map((t, i) => cell(t, { width: widths[i] })),
      })),
    ],
  });
}

/* ── Титульный блок ── */
const titleBlock = [
  new Paragraph({
    spacing: { before: 120, after: 60, line: 300 },
    children: [new TextRun({ text: "Мини-приложение «Православные» · Одноклассники · VK Mini Apps", size: 20, font: F_HEAD, italics: true, color: SEC })],
  }),
  new Paragraph({
    spacing: { after: 80, line: 520, lineRule: "atLeast" },
    children: [new TextRun({ text: "Описание для каталога мини-приложений", bold: true, size: 44, font: F_HEAD, color: INK })],
  }),
  new Paragraph({
    spacing: { after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACC, space: 6 } },
    children: [new TextRun({ text: "Краткое описание для витрины · подробный текст о функциональности · факты для модерации · 4 ноября 2026", size: 20, font: F_BODY, color: SEC })],
  }),
];

/* ── Раздел 1. Краткие описания ── */
const section1 = [
  h1("1. Краткие описания для полей каталога"),
  p("Ниже — готовые варианты коротких текстов. В Одноклассниках поле «Описание» ограничено 250 символами, во ВКонтакте короткое описание ещё лаконичнее. Число символов указано рядом с каждым вариантом и посчитано без учёта названий разделов таблицы."),
  new Paragraph({
    keepNext: true, spacing: { after: 100 },
    children: [new TextRun({ text: "Таблица 1. Варианты краткого описания", bold: true, size: 20, font: F_BODY, color: INK })],
  }),
  makeTable(
    [20, 68, 12],
    ["Где использовать", "Текст", "Символов"],
    [
      ["ОК · вариант 1", okText1, String(counts[0])],
      ["ОК · вариант 2", okText2, String(counts[1])],
      ["ВКонтакте", vkText, String(counts[2])],
      ["Слоган (обложка, приглашения)", slogan, String(counts[3])],
    ]
  ),
  note("Слоган предназначен для обложки и приглашений — в поля каталога его вставлять не нужно."),
];

/* ── Раздел 2. Подробное описание ── */
const section2 = [
  h1("2. Подробное описание функциональности"),
  note("Текст ниже полностью готов для вставки в поле «Подробное описание» каталога (или в описание приложения / топик сообщества). Мини-заголовки внутри текста сохраняют структуру и при вставке в форму."),
  p("«Православные» — ежедневный помощник для духовной жизни внутри соцсети: молиться по утреннему и вечернему правилу, читать Библию и жития святых, следить за церковным календарём и находить храм рядом с домом. Приложение рассчитано и на тех, кто только начинает знакомство с верой, и на воцерковлённых читателей: при первом запуске короткая анкета из трёх шагов подбирает контент под уровень и интересы пользователя."),
  p("Все тексты хранятся внутри приложения и не требуют переходов на сторонние сайты: Библия, жития, молитвы, календарь и ответы на вопросы доступны всегда. Чтение можно прерывать в любой момент — закладки и память о месте чтения вернут к остановившемуся абзацу."),
  h2("Дом"),
  p("Главная страница собирает день воедино: приветствие по имени, карточка церковного дня со стихом Писания, счётчик молитвенной практики («Вы молитесь N дней»), блок «Храмы рядом» с расстоянием до ближайших храмов, а также именины близких с возможностью отправить православный подарок. Порядок карточек зависит от интересов, выбранных в анкете: для кого-то на первом месте Библия, для кого-то — молитвы или календарь."),
  h2("Календарь и святцы"),
  p("Церковный календарь на месяц и на каждый день: двунадесятые и великие праздники, память святых, постные дни (среда и пятница, Рождественский пост), недели и гласы по Пятидесятнице, родительские субботы — с расчётом от даты Пасхи. Даты приводятся по старому стилю с переводом на гражданский календарь. Карточка дня рассказывает, что сегодня за праздник и кому молиться."),
  h2("Молитвослов"),
  p("Утреннее и вечернее молитвенные правила в пошаговой читалке — молитва за молитвой, с отметками о прочитанном. Отдельный сборник молитв на разные нужды: о семье и детях, о болящих, о путешествии, перед началом дела. Приложение ведёт счётчик практики и напоминает о правиле в удобное время."),
  h2("Библиотека"),
  p("Отдельный раздел в нижнем меню приложения, шесть подразделов."),
  pLead("Библия.", "Синодальный перевод, 28 книг — Новый Завет целиком и Псалтирь, более 7 900 стихов прямо в приложении; план чтения «Евангелие по главе в день» с прогрессом."),
  pLead("Жития святых.", "Подробные рассказы о святых с поиском по именам."),
  pLead("Отцы.", "Изречения святых отцов — короткое назидание на каждый день."),
  pLead("Стих дня.", "Ежедневный отрывок Писания с архивом и точными ссылками; из карточки можно открыть стих прямо в Библии."),
  pLead("Ответы.", "Подборка вопросов и ответов о вере, посте и молитве, разложенная по рубрикам."),
  pLead("Закладки.", "Все сохранённые места чтения в одном списке."),
  h2("Читалка с закладками"),
  p("Библию и жития удобно читать в полноэкранной читалке: выбор главы, нумерация стихов, регулировка размера шрифта. На любой стих или абзац можно поставить закладку, а место, где чтение остановилось, запоминается автоматически — карточка «Продолжить чтение» возвращает к нему в один тап."),
  h2("Карта храмов"),
  p("Живая карта, построенная на официальной базе храмов Русской Православной Церкви, — десятки тысяч храмов, часовен и монастырей. Приложение показывает ближайшие с сортировкой по расстоянию, применяет фильтры, открывает карточку храма с описанием и строит маршрут через Яндекс.Карты."),
  h2("Подарки и «Поделиться»"),
  p("Кнопка «Отправить подарок» предлагает шесть православных тематических подборок — к именинам, празднику или просто с тёплым словом; отправка проходит в штатном разделе «Подарки» соцсети. Стихом дня можно поделиться на своей странице, а друзей — пригласить в приложение."),
  h2("Профиль и оформление"),
  p("В профиле указываются имя при крещении и дата крещения: по святцам приложение определит святого покровителя и день именин и напомнит о них. В настройках — уведомления, размер шрифта, геолокация и «Оформление интерфейса»: светлая или тёмная тема на выбор."),
  p("«Православные» — приложение для ежедневной практики: без рекламы на главном экране, без обязательных покупок и внешних переходов, со сдержанным дизайном в светлых тонах и фотографиями храмов."),
];

/* ── Раздел 3. Факты для модерации ── */
const section3 = [
  h1("3. Ключевые факты для модерации"),
  p("Сводка ответов на типовые вопросы платформ при проверке приложения."),
  new Paragraph({
    keepNext: true, spacing: { after: 100 },
    children: [new TextRun({ text: "Таблица 2. Факты о приложении", bold: true, size: 20, font: F_BODY, color: INK })],
  }),
  makeTable(
    [28, 72],
    ["Параметр", "Описание"],
    [
      ["Внешние переходы", "Не используются. Все тексты — Библия, жития, молитвы, календарь, ответы на вопросы — хранятся внутри приложения и доступны офлайн."],
      ["Действия от имени пользователя", "Публикация записи, приглашение друзей и отправка подарка выполняются только по явному нажатию соответствующей кнопки в интерфейсе."],
      ["Персональные данные", "Имя при крещении, дата крещения, закладки и прогресс чтения хранятся локально на устройстве пользователя и никуда не передаются."],
      ["Реклама", "Главный экран без рекламы. Рекламные слоты платформы подключаются только после публикации и не на главном экране."],
      ["Контент", "Духовно-просветительский, для всех возрастов. Библия — Синодальный перевод 1876 года, общественное достояние; молитвы и жития — канонические тексты."],
      ["Оформление", "Светлая и тёмная темы интерфейса; фотографии православных храмов с мягкой виньеткой."],
    ]
  ),
];

/* ── Сборка документа ── */
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: F_BODY, size: 22, color: BODY },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: F_HEAD, size: 30, bold: true, color: INK },
        paragraph: { spacing: { before: 400, after: 160, line: 312 } },
      },
      heading2: {
        run: { font: F_HEAD, size: 25, bold: true, color: ACC },
        paragraph: { spacing: { before: 260, after: 100, line: 312 } },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, font: F_BODY, color: SEC })],
        })],
      }),
    },
    children: [...titleBlock, ...section1, ...section2, ...section3],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/download/pravoslavnye-opisanie-katalog.docx", buf);
  console.log("OK: документ создан");
});
