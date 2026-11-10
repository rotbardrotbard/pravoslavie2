"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { BaptismProfile, Interest, Level, ReaderTarget, Screen } from "@/lib/app-data";
import { STORAGE_KEYS } from "@/lib/app-data";
import type { ChurchSpot } from "@/lib/content/patriarchia";
import { computeStreak, lsGet, lsGetStrArray, lsSet, todayKey } from "@/lib/storage";
import {
  getGeoPoint,
  getMiniAppUser,
  initBridge,
  isInsideSocialApp,
  MOSCOW_CENTER,
  requestNotifications,
  type GeoPoint,
  type MiniAppUser,
} from "@/lib/bridge";
import { CrossInCircle } from "./bits";
import GiftModal from "./GiftModal";
import PostcardModal from "./PostcardModal";
import ReaderOverlay from "./ReaderOverlay";
import TempleSheet from "./TempleSheet";
import OnboardingScreen from "./screens/OnboardingScreen";
import HomeScreen from "./screens/HomeScreen";
import CalendarScreen from "./screens/CalendarScreen";
import PrayerScreen from "./screens/PrayerScreen";
import MapScreen from "./screens/MapScreen";
import WordScreen from "./screens/WordScreen";
import QuestionScreen from "./screens/QuestionScreen";
import MoreScreen from "./screens/MoreScreen";
import CommunityScreen from "./screens/CommunityScreen";
import BottomNav, { type TabId } from "./BottomNav";

/* ── Флаги сервисов ──
   «Вопрос священнику» скрыт (решение проекта): база готовых ответов
   переехала в библиотеку → «Ответы».  Код сохранён — вернуть: true.
   «Открытка близким» скрыта: вместо неё — «Отправить подарок» (GiftModal).
   Код модалки сохранён — вернуть: true.
   «Сообщество» убрано (решение проекта): поделиться можно кнопкой
   «Рассказать друзьям» и быстрым действием на Дому. Код экрана сохранён. */
const FEATURES = { askPriest: false, postcard: false, community: false } as const;

export default function OrthodoxApp() {
  /* ── Онбординг и профиль ── */
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [level, setLevel] = useState<Level | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [profile, setProfile] = useState<BaptismProfile | null>(null);
  const [notif, setNotif] = useState(true);

  /* ── Пользователь и гео (VK Bridge) ── */
  const [user, setUser] = useState<MiniAppUser>({ firstName: "гость", isDemo: true });
  const [geo, setGeo] = useState<GeoPoint>(MOSCOW_CENTER);
  const [geoAsked, setGeoAsked] = useState(false);

  /* ── Практика ── */
  const [prayerLog, setPrayerLog] = useState<string[]>([]);
  const streak = computeStreak(prayerLog);

  const [likedVerses, setLikedVerses] = useState<string[]>([]);
  const [textScale, setTextScale] = useState(100); // % масштаба интерфейса
  const [dark, setDark] = useState(false);

  /* ── Оверлеи ── */
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [readerTarget, setReaderTarget] = useState<ReaderTarget | null>(null);
  const [libTick, setLibTick] = useState(0); // перечитать закладки после закрытия читалки
  const [selectedSpot, setSelectedSpot] = useState<ChurchSpot | null>(null);
  const [visitedTemples, setVisitedTemples] = useState<string[]>([]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  /* ── Восстановление состояния и инициализация моста ── */
  useEffect(() => {
    const onboarded = lsGet<boolean>(STORAGE_KEYS.onboarded, false);
    const lv = lsGet<Level | null>(STORAGE_KEYS.level, null);
    /* Интересы: новый формат — массив; миграция со старого одиночного значения.
       Если в хранилище не массив (данные старой версии) — читаем одиночное значение. */
    let ints = lsGet<Interest[] | null>(STORAGE_KEYS.interests, null);
    if (!Array.isArray(ints)) {
      const single = lsGet<Interest | null>(STORAGE_KEYS.interest, null);
      ints = single ? [single] : [];
    }
    const prof = lsGet<BaptismProfile | null>(STORAGE_KEYS.profile, null);
    /* Молитвы/избранные стихи: данные старых версий могли лежать строкой или картой —
       lsGetStrArray приводит любой формат к массиву строк (иначе белый экран). */
    const log = lsGetStrArray(STORAGE_KEYS.prayerLog);
    const likes = lsGetStrArray(STORAGE_KEYS.likedVerses);
    /* Размер текста: новый ключ pr.textScale; миграция со старого pr.fontBig */
    const savedScale = lsGet<number | null>(STORAGE_KEYS.textScale, null);
    const oldFontBig = lsGet<boolean>(STORAGE_KEYS.fontBig, false);
    const scale = savedScale ?? (oldFontBig ? 115 : 100);
    setTextScale(scale);
    document.documentElement.style.fontSize = `${Math.round(16 * scale) / 100}px`;
    /* Тема: миграция со старого ключа «Вечернее чтение» */
    const theme = lsGet<"light" | "dark" | null>(STORAGE_KEYS.theme, null);
    const oldEvening = lsGet<boolean>(STORAGE_KEYS.evening, false);
    const isDark = theme ? theme === "dark" : oldEvening;
    /* Ранее посещения хранились числами статических храмов — мигрируем в ключи */
    const visitedRaw = lsGet<unknown[]>(STORAGE_KEYS.visitedTemples, []);
    const visited = (Array.isArray(visitedRaw) ? visitedRaw : []).map((x) =>
      typeof x === "number" ? "s" + x : String(x)
    );

    setLevel(lv);
    setInterests(ints);
    setProfile(prof);
    setPrayerLog(log);
    setLikedVerses(likes);
    setDark(isDark);
    setVisitedTemples(visited);
    setScreen(onboarded ? "home" : "onboarding");

    (async () => {
      await initBridge();
      const u = await getMiniAppUser();
      /* Вне соцсети (демо) показываем сохранённое имя — чтобы баннер именин работал */
      if (u.isDemo) {
        const saved = lsGet<string>(STORAGE_KEYS.userName, "");
        if (saved) setUser({ firstName: saved, isDemo: true });
        else setUser(u);
      } else {
        setUser(u);
        lsSet(STORAGE_KEYS.userName, u.firstName);
      }
      setReady(true);
      /* Гео — только если пользователь разрешил ранее (кнопкой в онбординге/Ещё) */
      const geoAllowed = lsGet<boolean>(STORAGE_KEYS.geo, false);
      if (geoAllowed) {
        const p = await getGeoPoint();
        if (p) {
          setGeo(p);
          setGeoAsked(true);
        }
      }
    })();
  }, []);

  const finishOnboarding = (
    lv: Level,
    ints: Interest[],
    g: boolean,
    n: boolean,
    prof: BaptismProfile
  ) => {
    setLevel(lv);
    setInterests(ints);
    setProfile(prof);
    setNotif(n);
    lsSet(STORAGE_KEYS.onboarded, true);
    lsSet(STORAGE_KEYS.level, lv);
    lsSet(STORAGE_KEYS.interests, ints);
    lsSet(STORAGE_KEYS.profile, prof);
    lsSet(STORAGE_KEYS.geo, g);
    setScreen("home");
    toast(lv === "beginner" ? "Мир вам! Начнём с малого — всё подскажем" : "Мир вам! Рады видеть снова");
    if (g) {
      getGeoPoint().then((p) => {
        if (p) {
          setGeo(p);
          setGeoAsked(true);
        }
      });
    }
    if (n) {
      requestNotifications().then((ok) => {
        if (!ok) toast("Уведомления включатся после публикации приложения в ОК");
      });
    }
  };

  /* ── Отметки молитвенного правила ── */
  const completeRule = (kind: "morning" | "evening") => {
    setPrayerLog((log) => {
      const t = todayKey();
      const stamp = `${t}:${kind}`;
      if (log.includes(stamp)) return log;
      const next = [...log, stamp];
      lsSet(STORAGE_KEYS.prayerLog, next);
      return next;
    });
    toast(
      kind === "morning"
        ? "Утреннее правило отмечено. Мир вашему дому!"
        : "Вечернее правило отмечено. Храни вас Господь!"
    );
  };

  const toggleLikeVerse = (ref: string) => {
    setLikedVerses((v) => {
      const next = v.includes(ref) ? v.filter((x) => x !== ref) : [...v, ref];
      lsSet(STORAGE_KEYS.likedVerses, next);
      if (!v.includes(ref)) {
        toast("Сохранено в ваших избранных стихах");
      }
      return next;
    });
  };

  const toggleVisitTemple = (key: string) => {
    setVisitedTemples((v) => {
      const next = v.includes(key) ? v : [...v, key];
      lsSet(STORAGE_KEYS.visitedTemples, next);
      return next;
    });
  };

  const setDarkPersist = (v: boolean) => {
    setDark(v);
    lsSet(STORAGE_KEYS.theme, v ? "dark" : "light");
  };

  const setTextScalePersist = (v: number) => {
    setTextScale(v);
    lsSet(STORAGE_KEYS.textScale, v);
    document.documentElement.style.fontSize = `${Math.round(16 * v) / 100}px`;
  };

  const reRunSurvey = () => {
    setScreen("onboarding");
  };

  const go = useCallback((s: Screen) => {
    setScreen(s);
    if (s !== "onboarding") window.scrollTo({ top: 0 });
  }, []);

  /* ── Гео обновляется с экрана карты («Где я») через событие ── */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ lat: number; lng: number }>).detail;
      if (detail && typeof detail.lat === "number" && typeof detail.lng === "number") {
        setGeo({ lat: detail.lat, lng: detail.lng, accurate: true });
      }
    };
    window.addEventListener("pr-geo", handler);
    return () => window.removeEventListener("pr-geo", handler);
  }, []);

  const openReader = useCallback((t: ReaderTarget) => {
    setReaderTarget(t);
  }, []);

  const closeReader = useCallback(() => {
    setReaderTarget(null);
    setLibTick((t) => t + 1);
  }, []);

  const tabFor = (s: Screen): TabId => {
    if (s === "home") return "home";
    if (s === "calendar") return "calendar";
    if (s === "prayer") return "prayer";
    if (s === "word") return "library";
    if (s === "map") return "map";
    return "more";
  };

  const subScreenTitle =
    screen === "word"
      ? "Библиотека"
      : screen === "question"
        ? "Вопрос священнику"
        : null;

  const firstName = user.firstName || "гость";
  const inside = isInsideSocialApp();

  return (
    <div
      className={`pr-root min-h-dvh w-full flex justify-center ${dark ? "pr-dark" : ""}`}
      style={{ background: "var(--an-bg)" }}
    >
      <div className="app-column relative w-full max-w-[480px] flex flex-col">
        {/* Аппбар */}
        <header
          className="sticky top-0 z-30 flex items-center gap-2.5 px-3.5 py-2.5 border-b backdrop-blur-sm"
          style={{ background: "var(--an-bar)", borderColor: "var(--an-line)" }}
        >
          {subScreenTitle ? (
            <button
              aria-label="Назад"
              onClick={() => go("home")}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
              style={{ color: "var(--an-ink)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18 L9 12 L15 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <CrossInCircle size={32} />
          )}
          <div className="flex-1 min-w-0">
            <div className="pr-display text-[1.08rem] leading-tight truncate" style={{ color: "var(--an-ink)" }}>
              {subScreenTitle ?? "Православные"}
            </div>
            <div className="text-[0.6rem] leading-tight truncate" style={{ color: "var(--an-ink-soft)" }}>
              {screen === "home" && (firstName ? `Мир вам, ${firstName}` : "Мир вам!")}
              {screen === "calendar" && "Календарь и святцы"}
              {screen === "prayer" && "Молитвослов"}
              {screen === "map" && "Храмы рядом"}
              {screen === "more" && "Ещё"}
              {screen === "word" && "Библия, жития, отцы — с закладками"}
              {screen === "question" && "Писание и вопросы"}
            </div>
          </div>
          {user.photo ? (
            <img
              src={user.photo}
              alt={firstName}
              className="w-8 h-8 rounded-full object-cover shrink-0"
              style={{ border: "1px solid var(--an-line-strong)" }}
            />
          ) : null}
          <button
            aria-label="Уведомления"
            onClick={() => {
              if (notif) {
                toast("Уведомления включены: правило, праздники, именины");
                return;
              }
              requestNotifications().then((ok) => {
                setNotif(ok);
                toast(ok ? "Уведомления ОК подключены" : "Уведомления включатся после публикации в ОК");
              });
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
            style={{ color: "var(--an-ink)" }}
          >
            <Bell size={17} />
          </button>
        </header>

        {/* Контент экрана */}
        <main className="flex-1 w-full text-[0.9rem]" style={{ color: "var(--an-ink)" }}>
          {screen === "onboarding" && (
            <OnboardingScreen onFinish={finishOnboarding} toast={toast} />
          )}
          {screen === "home" && (
            <HomeScreen
              level={level}
              interests={interests}
              userName={firstName}
              baptismName={profile?.baptismName ?? null}
              geo={geo}
              go={go}
              openGifts={() => setGiftOpen(true)}
              likedVerses={likedVerses}
              toggleLikeVerse={toggleLikeVerse}
              morningDone={prayerLog.some((x) => x.startsWith(todayKey()))}
              streak={streak}
              toast={toast}
              ready={ready}
              inside={inside}
            />
          )}
          {screen === "calendar" && <CalendarScreen go={go} toast={toast} />}
          {screen === "prayer" && (
            <PrayerScreen
              level={level}
              streak={streak}
              onComplete={completeRule}
              toast={toast}
            />
          )}
          {screen === "map" && (
            <MapScreen
              geo={geo}
              geoAsked={geoAsked}
              toast={toast}
              onSelectSpot={setSelectedSpot}
              setGeoAsked={setGeoAsked}
            />
          )}
          {screen === "word" && (
            <WordScreen
              likedVerses={likedVerses}
              toggleLikeVerse={toggleLikeVerse}
              share={async (text) => {
                const { shareApp } = await import("@/lib/bridge");
                const how = await shareApp(text);
                toast(
                  how === "clipboard"
                    ? "Стих скопирован — вставьте в пост или сообщение ОК"
                    : "Открываем окно публикации ОК"
                );
              }}
              openReader={openReader}
              libTick={libTick}
              toast={toast}
            />
          )}
          {FEATURES.askPriest && screen === "question" && <QuestionScreen toast={toast} />}
          {FEATURES.community && screen === "community" && (
            <CommunityScreen
              openGifts={() => setGiftOpen(true)}
              share={async (text) => {
                const { shareApp, inviteFriends } = await import("@/lib/bridge");
                void inviteFriends;
                const how = await shareApp(text);
                toast(
                  how === "clipboard"
                    ? "Текст скопирован — вставьте в ленту ОК"
                    : "Открываем окно публикации ОК"
                );
              }}
              toast={toast}
            />
          )}
          {screen === "more" && (
            <MoreScreen
              level={level}
              userName={firstName}
              userPhoto={user.photo}
              profile={profile}
              go={go}
              reRunSurvey={reRunSurvey}
              openGifts={() => setGiftOpen(true)}
              dark={dark}
              setDark={setDarkPersist}
              textScale={textScale}
              setTextScale={setTextScalePersist}
              toast={toast}
              inside={inside}
            />
          )}
        </main>

        {/* Нижняя навигация */}
        {screen !== "onboarding" && (
          <div
            className="sticky bottom-0 z-30"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <BottomNav active={tabFor(screen)} onChange={go} />
          </div>
        )}

        {/* Тост */}
        {toastMsg && (
          <div
            className="animate-toast fixed left-1/2 bottom-20 z-50 max-w-[86%] px-4 py-2.5 rounded-xl text-center text-[0.78rem] text-white shadow-xl"
            style={{ background: "#181d24", border: "1px solid rgba(255,255,255,.12)" }}
            role="status"
          >
            {toastMsg}
          </div>
        )}

        {/* Оверлеи */}
        {giftOpen && <GiftModal onClose={() => setGiftOpen(false)} toast={toast} />}
        {readerTarget && <ReaderOverlay target={readerTarget} onClose={closeReader} toast={toast} />}
        {/* Скрытая открытка — возвращается флагом FEATURES.postcard */}
        {FEATURES.postcard && postcardOpen && (
          <PostcardModal onClose={() => setPostcardOpen(false)} toast={toast} />
        )}
        {selectedSpot !== null && (
          <TempleSheet
            spot={selectedSpot}
            visited={visitedTemples.includes(selectedSpot.key)}
            geo={geo}
            onClose={() => setSelectedSpot(null)}
            onVisit={() => {
              toggleVisitTemple(selectedSpot.key);
              toast("Отметка сохранена — поделитесь в ленту!");
            }}
            toast={toast}
          />
        )}
      </div>
    </div>
  );
}
