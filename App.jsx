import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Newspaper, Map as MapIcon, Plus, HelpCircle, Users, User as UserIcon,
  Heart, CheckCircle2, MessageCircle, Flag, MapPin, Clock, Search,
  SlidersHorizontal, LogOut, Camera, X, Send, Car, Shield, CloudRain,
  CalendarDays, Users2, Construction, Info, Lock, Globe, ArrowLeft,
  Eye, EyeOff, Award, TrendingUp, Sparkles, ChevronLeft, Check, Radio,
  Image as ImageIcon, Video,
} from "lucide-react";

/* ============================================================
   StatusNow — עכשיו קורה
   Hebrew-first, RTL, location-based real-time social network.
   Single-file MVP with mock data structured for a real backend.
   ============================================================ */

/* ---------- Design tokens ---------- */
const T = {
  bg: "#EFF6FF",
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFF",
  ink: "#0F172A",
  inkSoft: "#64748B",
  inkFaint: "#94A3B8",
  line: "#BFDBFE",
  brand: "#0D9488",
  brandInk: "#0C5FD6",
  live: "#EF4444",
  gold: "#F59E0B",
  navBg: "#FFFFFF",
  sideHover: "#F8FAFF",
};

const CATEGORIES = {
  traffic:  { he: "תנועה ופקקים", short: "תנועה",     color: "#F59E0B", Icon: Car },
  security: { he: "ביטחון",       short: "ביטחון",     color: "#EF4444", Icon: Shield },
  weather:  { he: "מזג אוויר",    short: "מזג אוויר",  color: "#3BA3E8", Icon: CloudRain },
  event:    { he: "אירוע",        short: "אירוע",      color: "#8B5CF6", Icon: CalendarDays },
  crowd:    { he: "תור ועומס",    short: "עומס",       color: "#F97316", Icon: Users2 },
  road:     { he: "תקלת כביש",    short: "כביש",       color: "#A16207", Icon: Construction },
  general:  { he: "עדכון כללי",   short: "כללי",       color: "#64748B", Icon: Info },
};
const CAT_KEYS = Object.keys(CATEGORIES);

const CITIES = [
  { name: "תל אביב",      lat: 32.0853, lng: 34.7818 },
  { name: "ירושלים",      lat: 31.7683, lng: 35.2137 },
  { name: "חיפה",         lat: 32.7940, lng: 34.9896 },
  { name: "באר שבע",      lat: 31.2518, lng: 34.7913 },
  { name: "ראשון לציון",  lat: 31.9730, lng: 34.7925 },
  { name: "נתניה",        lat: 32.3215, lng: 34.8532 },
  { name: "פתח תקווה",    lat: 32.0840, lng: 34.8878 },
  { name: "הרצליה",       lat: 32.1663, lng: 34.8436 },
  { name: "אשדוד",        lat: 31.8014, lng: 34.6435 },
  { name: "אילת",         lat: 29.5581, lng: 34.9482 },
];

const AVCOLORS = ["#1F5EFF", "#E8A32B", "#12A594", "#E5484D", "#8B5CF6", "#F97316", "#0EA5E9"];

/* ---------- helpers ---------- */
const now = () => Date.now();
const MIN = 60_000, HR = 3_600_000;

function timeAgo(ts) {
  const d = now() - ts;
  if (d < 0) return "עוד רגע";
  if (d < MIN) return "עכשיו";
  if (d < HR) { const m = Math.floor(d / MIN); return `לפני ${m} דק׳`; }
  if (d < 24 * HR) { const h = Math.floor(d / HR); return `לפני ${h} שע׳`; }
  const dd = Math.floor(d / (24 * HR)); return `לפני ${dd} ימים`;
}

// freshness 1 (brand new) -> 0 (expired)
function freshness(createdAt, expiresAt) {
  if (!expiresAt) return 1;
  const total = expiresAt - createdAt;
  const left = expiresAt - now();
  if (left <= 0) return 0;
  return Math.max(0, Math.min(1, left / total));
}

function haversineKm(a, b) {
  const R = 6371, toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}
function distanceLabel(km) {
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)} מ׳ ממך`;
  return `${km.toFixed(1)} ק״מ ממך`;
}

let _id = 1000;
const uid = () => `id_${++_id}`;

/* ---------- map projection (stylized Israel) ---------- */
const MAP_W = 300, MAP_H = 600;
const LNG_MIN = 34.15, LNG_MAX = 35.95, LAT_MIN = 29.45, LAT_MAX = 33.35;
function project(lat, lng) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H;
  return { x, y };
}
// stylized silhouette of Israel
const ISRAEL_PATH =
  "M150 22 C168 30 182 52 184 78 C186 104 176 126 178 150 " +
  "C181 178 202 196 205 220 C207 240 188 252 172 262 " +
  "C176 300 178 330 168 360 C160 386 152 408 150 436 " +
  "C148 470 146 500 140 528 L132 592 L126 556 " +
  "C122 520 118 486 116 452 C114 410 112 372 104 340 " +
  "C96 306 90 282 92 254 C94 224 100 200 96 170 " +
  "C92 140 90 112 100 84 C108 60 126 34 150 22 Z";

/* ---------- example photos — Wikimedia Commons CC-licensed (Special:FilePath URLs) ---------- */
const PHOTOS = {
  // נתיבי איילון, תל אביב — CC BY-SA, Wikimedia Commons
  traffic: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ayalon_Highway_which_runs_through_Tel_Aviv.jpg/800px-Ayalon_Highway_which_runs_through_Tel_Aviv.jpg",

  // שוק מחנה יהודה, ירושלים — CC BY-SA 3.0, Deror avi
  market: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Mahane_Yehuda_Market_P1020256.JPG/800px-Mahane_Yehuda_Market_P1020256.JPG",

  // חיפה, נוף פנורמי — CC BY-SA
  rain: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Panorama_Haifa.jpg/800px-Panorama_Haifa.jpg",

  // הרצליה מרינה (ים) — CC BY-SA
  concert: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Herzliya_Marina_2015.jpg/800px-Herzliya_Marina_2015.jpg",

  // שדרות רוטשילד, תל אביב — CC BY 4.0
  cafe: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Cycling_Tel_Aviv_Rothschild_Boulevard.png/800px-Cycling_Tel_Aviv_Rothschild_Boulevard.png",

  // כביש ישראלי — PikiWiki CC BY 2.5
  road: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/PikiWiki_Israel_2232_Road_in_Israel.jpg/800px-PikiWiki_Israel_2232_Road_in_Israel.jpg",

  // מפרץ חיפה — CC BY-SA 2.5
  security: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Haifa_Bay.JPG/800px-Haifa_Bay.JPG",
};

/* ============================================================
   MOCK DATA
   ============================================================ */
function seedData() {
  const users = [
    { id: "u_me",  name: "נועה לוי",    color: AVCOLORS[0], bio: "אוהבת עיר, קפה ומידע בזמן אמת ☕", city: "תל אביב",  lat: CITIES[0].lat, lng: CITIES[0].lng, reputation: 128 },
    { id: "u_dan", name: "דן כהן",      color: AVCOLORS[1], bio: "נהג משאית, מדווח מהכבישים", city: "ראשון לציון", lat: CITIES[4].lat, lng: CITIES[4].lng, reputation: 214 },
    { id: "u_maya",name: "מאיה בר",     color: AVCOLORS[2], bio: "סטודנטית בירושלים", city: "ירושלים", lat: CITIES[1].lat, lng: CITIES[1].lng, reputation: 63 },
    { id: "u_avi", name: "אבי פרץ",     color: AVCOLORS[3], bio: "תושב חיפה", city: "חיפה", lat: CITIES[2].lat, lng: CITIES[2].lng, reputation: 91 },
    { id: "u_tal", name: "טל שגב",      color: AVCOLORS[4], bio: "רץ בפארק כל בוקר", city: "הרצליה", lat: CITIES[7].lat, lng: CITIES[7].lng, reputation: 45 },
  ];

  const t = now();
  const statuses = [
    { id: uid(), userId: "u_dan", category: "traffic", text: "פקק כבד בכניסה לתל אביב מכיוון דרום, איילון עמוס לגמרי. עדיף נתיבי איילון החדשים.", locationName: "נתיבי איילון", lat: 32.06, lng: 34.80, createdAt: t - 8 * MIN, expiresAt: t + 52 * MIN, likes: ["u_maya", "u_tal", "u_avi"], comments: [{ id: uid(), userId: "u_tal", text: "תודה! עוקף מיד", createdAt: t - 5 * MIN }], media: { type: "image", src: PHOTOS.traffic, caption: "נתיבי איילון" } },
    { id: uid(), userId: "u_maya", category: "crowd", text: "תור ענק בכניסה לשוק מחנה יהודה, בערך 20 דקות המתנה.", locationName: "שוק מחנה יהודה, ירושלים", lat: 31.785, lng: 35.212, createdAt: t - 22 * MIN, expiresAt: t + 38 * MIN, likes: ["u_me"], comments: [], media: { type: "image", src: PHOTOS.market, caption: "שוק מחנה יהודה" } },
    { id: uid(), userId: "u_avi", category: "weather", text: "התחיל לרדת גשם חזק בחיפה, קחו מטריות. ראות נמוכה בכרמל.", locationName: "הכרמל, חיפה", lat: 32.80, lng: 34.98, createdAt: t - 40 * MIN, expiresAt: t + 80 * MIN, likes: ["u_me", "u_dan"], comments: [], media: { type: "image", src: PHOTOS.rain, caption: "חיפה" } },
    { id: uid(), userId: "u_tal", category: "event", text: "הופעה ברחבת הנמל בהרצליה מתחילה ב-20:00, אווירה מעולה 🎶", locationName: "נמל הרצליה", lat: 32.163, lng: 34.797, createdAt: t - 70 * MIN, expiresAt: t + 3 * HR, likes: ["u_me", "u_maya", "u_dan", "u_avi"], comments: [{ id: uid(), userId: "u_me", text: "מגיעה!", createdAt: t - 60 * MIN }], media: { type: "image", src: PHOTOS.concert, caption: "נמל הרצליה" } },
    { id: uid(), userId: "u_dan", category: "road", text: "בור גדול בכביש 4 סמוך לצומת מסובים, סעו בזהירות בנתיב הימני.", locationName: "כביש 4, מסובים", lat: 32.05, lng: 34.88, createdAt: t - 95 * MIN, expiresAt: t + 5 * HR, likes: [], comments: [], media: { type: "image", src: PHOTOS.road, caption: "כביש 4" } },
    { id: uid(), userId: "u_me", category: "general", text: "פתיחה חגיגית של קפה חדש ברוטשילד, שבוע ראשון 1+1 על הקפה!", locationName: "שדרות רוטשילד, תל אביב", lat: 32.064, lng: 34.771, createdAt: t - 3 * HR, expiresAt: t + 6 * HR, likes: ["u_maya"], comments: [], media: { type: "image", src: PHOTOS.cafe, caption: "שדרות רוטשילד" } },
    { id: uid(), userId: "u_avi", category: "security", text: "פעילות משטרתית מוגברת ליד התחנה המרכזית, עדיף לעקוף.", locationName: "מרכזית מפרץ, חיפה", lat: 32.79, lng: 35.06, createdAt: t - 4 * HR, expiresAt: t - 10 * MIN /* expired */, likes: ["u_me"], comments: [], media: { type: "image", src: PHOTOS.security, caption: "מרכזית מפרץ חיפה" } },
  ];

  const requests = [
    { id: uid(), userId: "u_me", category: "crowd", text: "מישהו יודע כמה עמוס עכשיו בחוף גורדון? שווה להגיע?", locationName: "חוף גורדון, תל אביב", lat: 32.083, lng: 34.767, createdAt: t - 15 * MIN, status: "open", answers: [] },
    { id: uid(), userId: "u_tal", category: "traffic", text: "יש עומס עכשיו על כביש 2 צפונה מהרצליה?", locationName: "כביש 2, הרצליה", lat: 32.17, lng: 34.83, createdAt: t - 35 * MIN, status: "answered", answers: [{ id: uid(), userId: "u_dan", text: "זורם יפה כרגע, אין עומס עד נתניה.", createdAt: t - 20 * MIN }] },
    { id: uid(), userId: "u_maya", category: "general", text: "בית מרקחת פתוח עכשיו באזור המושבה הגרמנית?", locationName: "המושבה הגרמנית, ירושלים", lat: 31.762, lng: 35.216, createdAt: t - 2 * HR, status: "open", answers: [] },
    { id: uid(), userId: "u_avi", category: "weather", text: "יורד גשם עכשיו במרכז? יוצא לטיול", locationName: "מרכז", lat: 32.05, lng: 34.85, createdAt: t - 5 * HR, status: "expired", answers: [] },
  ];

  const groups = [
    { id: "g_tlv", name: "תל אביב עכשיו", description: "כל מה שקורה בעיר בזמן אמת — פקקים, אירועים, פתיחות.", cover: { emoji: "🌆", color: "#1F5EFF" }, privacy: "public", memberIds: ["u_me", "u_dan", "u_tal"] },
    { id: "g_jlm", name: "ירושלים בזמן אמת", description: "עדכונים מהעיר העתיקה ועד גבעת רם.", cover: { emoji: "🕌", color: "#E8A32B" }, privacy: "public", memberIds: ["u_maya"] },
    { id: "g_roads", name: "כבישי ישראל 🚗", description: "דיווחי תנועה, תקלות וכבישים חסומים מכל הארץ.", cover: { emoji: "🚗", color: "#12A594" }, privacy: "public", memberIds: ["u_dan", "u_avi", "u_me"] },
    { id: "g_haifa", name: "שכונת הכרמל", description: "קהילת שכונה פרטית לתושבי הכרמל.", cover: { emoji: "🏘️", color: "#8B5CF6" }, privacy: "private", memberIds: ["u_avi"] },
    { id: "g_run", name: "רצים בבוקר", description: "מזג אוויר, מסלולים ועומסים בפארקים.", cover: { emoji: "🏃", color: "#F97316" }, privacy: "public", memberIds: ["u_tal"] },
  ];
  // attach a couple of statuses to groups
  statuses[0].groupId = "g_roads";
  statuses[3].groupId = "g_run";

  return { users, statuses, requests, groups };
}

/* ============================================================
   SMALL UI PRIMITIVES
   ============================================================ */
function Avatar({ user, size = 40 }) {
  const initials = (user?.name || "?").trim().slice(0, 1);
  return (
    <div style={{
      width: size, height: size, borderRadius: size, flex: "0 0 auto",
      background: user?.color || T.inkFaint, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.42, userSelect: "none",
    }}>{initials}</div>
  );
}

function CategoryChip({ cat, small }) {
  const c = CATEGORIES[cat];
  if (!c) return null;
  const { Icon } = c;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: c.color + "1A", color: c.color,
      borderRadius: 999, padding: small ? "3px 9px" : "4px 11px",
      fontSize: small ? 11.5 : 12.5, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <Icon size={small ? 12 : 14} strokeWidth={2.4} />
      {small ? c.short : c.he}
    </span>
  );
}

function LivePulse({ color = T.live, size = 8 }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
      <span className="sn-ping" style={{ position: "absolute", inset: 0, borderRadius: 999, background: color, opacity: 0.55 }} />
      <span style={{ position: "relative", width: size, height: size, borderRadius: 999, background: color }} />
    </span>
  );
}

function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 5 }}>{hint}</div>}
    </label>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", border: `1.5px solid ${T.line}`,
  borderRadius: 12, padding: "12px 14px", fontSize: 15, background: T.surfaceAlt,
  color: T.ink, outline: "none", fontFamily: "inherit",
};

function PrimaryButton({ children, onClick, disabled, style, tone = "brand" }) {
  const bg = tone === "danger" ? T.live : T.brand;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", border: "none", borderRadius: 13, padding: "13px 16px",
      background: disabled ? T.inkFaint : bg, color: "#fff", fontSize: 15.5,
      fontWeight: 800, cursor: disabled ? "default" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      fontFamily: "inherit", boxShadow: disabled ? "none" : `0 8px 20px ${bg}33`,
      transition: "transform .06s ease", ...style,
    }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(.985)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >{children}</button>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px", color: T.inkFaint }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.inkSoft }}>{title}</div>
      {sub && <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function Spinner({ label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 40, color: T.inkSoft }}>
      <div className="sn-spin" style={{ width: 28, height: 28, borderRadius: 999, border: `3px solid ${T.line}`, borderTopColor: T.brand }} />
      {label && <div style={{ fontSize: 13.5 }}>{label}</div>}
    </div>
  );
}

/* ============================================================
   AUTH SCREENS
   ============================================================ */
function AuthShell({ children }) {
  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 22px" }}>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 900, fontSize: 30, letterSpacing: "-0.5px", color: T.ink }}>
          <span style={{ display: "inline-flex", padding: 9, borderRadius: 15, background: T.brand, color: "#fff", boxShadow: `0 10px 24px ${T.brand}40` }}>
            <Radio size={24} strokeWidth={2.6} />
          </span>
          <span dir="ltr">Status<span style={{ color: T.brand }}>&nbsp;Now</span></span>
        </div>
        <div style={{ color: T.inkSoft, marginTop: 8, fontSize: 14 }}>מה קורה עכשיו — בדיוק לידך.</div>
      </div>
      <div style={{ background: T.surface, borderRadius: 22, padding: 22, border: `1px solid ${T.line}`, boxShadow: "0 18px 40px rgba(20,22,28,.06)" }}>
        {children}
      </div>
    </div>
  );
}

function Login({ go, onLogin, toast }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 550);
  };

  return (
    <AuthShell>
      <div style={{ fontSize: 19, fontWeight: 900, marginBottom: 2, color: T.ink }}>התחברות</div>
      <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 20 }}>שמחים שחזרת 👋</div>

      <SocialBtn color="#DB4437" onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); onLogin({ name:"משתמש גוגל", provider:"google" }); }, 600); }}
        icon={<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.6 0 6.6 5.5 2.7 13.5l7.8 6C12.4 13.1 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/><path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2.1 1.4-4.7 2.3-7.8 2.3-6.3 0-11.6-3.6-13.5-8.8l-7.8 6.1C6.6 42.5 14.6 48 24 48z"/></svg>}
      >המשך עם Google</SocialBtn>

      <SocialBtn color="#0D9488" onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); onLogin({ name: randomAnon(), provider:"anon" }); }, 400); }}
        icon={<span style={{fontSize:18}}>🎭</span>}
      >כניסה אנונימית</SocialBtn>

      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 14px" }}>
        <div style={{ flex:1, height:1, background:T.line }}/><span style={{ fontSize:12.5, color:T.inkFaint }}>או עם אימייל</span><div style={{ flex:1, height:1, background:T.line }}/>
      </div>

      <Field label="אימייל">
        <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" />
      </Field>
      <Field label="סיסמה">
        <div style={{ position: "relative" }}>
          <input style={{ ...inputStyle, paddingInlineEnd: 42 }} type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} dir="ltr" />
          <button onClick={() => setShow(!show)} style={{ position: "absolute", insetInlineEnd: 12, top: 12, border: "none", background: "none", color: T.inkFaint, cursor: "pointer" }}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>
      <div style={{ textAlign: "end", marginBottom: 14 }}>
        <button onClick={() => go("forgot")} style={{ border: "none", background: "none", color: T.brand, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>שכחת סיסמה?</button>
      </div>
      <PrimaryButton onClick={submit} disabled={loading}>{loading ? "מתחבר…" : "כניסה עם אימייל"}</PrimaryButton>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13.5, color: T.inkSoft }}>
        אין לך חשבון? <button onClick={() => go("register")} style={{ border: "none", background: "none", color: T.brand, fontWeight: 800, cursor: "pointer" }}>הרשמה</button>
      </div>
    </AuthShell>
  );
}

// Random anonymous nicknames
const ANON_NAMES = ["ארנב מהיר","דג זהב","ברדלס סקרן","פרפר כחול","שועל חרמוני","דב צפוני","נמר שקט","זאב ירושלמי","עורב פיקח","צבי מהיר","דולפין שמח","נשר גבוה","קיפוד קטן","לוויתן כחול","חתול פרסי"];
const randomAnon = () => ANON_NAMES[Math.floor(Math.random() * ANON_NAMES.length)];

function SocialBtn({ onClick, icon, children, color }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      border: `1.5px solid ${color}33`, background: color + "0D", borderRadius: 12,
      padding: "11px 16px", fontSize: 14.5, fontWeight: 700, color, cursor: "pointer",
      fontFamily: "inherit", marginBottom: 10, transition: "all .12s",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = color + "18"; }}
      onMouseLeave={e => { e.currentTarget.style.background = color + "0D"; }}
    >{icon}{children}</button>
  );
}

function Register({ go, onLogin }) {
  const [mode, setMode] = useState("choose"); // choose | email
  const [f, setF] = useState({ name: "", email: "", pw: "", pw2: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const loginWith = (name, provider) => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ name, provider }); }, 600);
  };

  const submitEmail = () => {
    setErr("");
    if (f.name.trim().length < 2) return setErr("נא להזין שם או כינוי (לפחות 2 תווים)");
    if (!f.email.includes("@")) return setErr("כתובת אימייל לא תקינה");
    if (f.pw.length < 6) return setErr("סיסמה קצרה מדי (לפחות 6 תווים)");
    if (f.pw !== f.pw2) return setErr("הסיסמאות אינן תואמות");
    loginWith(f.name.trim(), "email");
  };

  return (
    <AuthShell>
      <div style={{ fontSize: 19, fontWeight: 900, marginBottom: 2 }}>הרשמה</div>
      <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 20 }}>הצטרפו לקהילה שמעדכנת בזמן אמת</div>

      {mode === "choose" ? (
        <>
          {/* Google */}
          <SocialBtn color="#DB4437" onClick={() => loginWith("משתמש גוגל", "google")}
            icon={<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.6 0 6.6 5.5 2.7 13.5l7.8 6C12.4 13.1 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/><path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.5-5.8c-2.1 1.4-4.7 2.3-7.8 2.3-6.3 0-11.6-3.6-13.5-8.8l-7.8 6.1C6.6 42.5 14.6 48 24 48z"/></svg>}
          >המשך עם Google</SocialBtn>

          {/* Anonymous */}
          <SocialBtn color="#0D9488" onClick={() => loginWith(randomAnon(), "anon")}
            icon={<span style={{fontSize:18}}>🎭</span>}
          >כניסה אנונימית (כינוי אקראי)</SocialBtn>

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 14px" }}>
            <div style={{ flex:1, height:1, background:T.line }}/>
            <span style={{ fontSize:12.5, color:T.inkFaint }}>או</span>
            <div style={{ flex:1, height:1, background:T.line }}/>
          </div>

          {/* Email */}
          <PrimaryButton onClick={() => setMode("email")} style={{ background: T.surface, color: T.ink, border: `1.5px solid ${T.line}`, boxShadow:"none" }}>
            הרשמה עם אימייל
          </PrimaryButton>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13.5, color: T.inkSoft }}>
            כבר רשום? <button onClick={() => go("login")} style={{ border:"none", background:"none", color:T.brand, fontWeight:800, cursor:"pointer" }}>התחברות</button>
          </div>
        </>
      ) : (
        <>
          <button onClick={() => setMode("choose")} style={{ border:"none", background:"none", color:T.inkSoft, display:"inline-flex", alignItems:"center", gap:4, cursor:"pointer", marginBottom:14, fontSize:13.5 }}>
            <ArrowLeft size={15}/> חזרה
          </button>
          <Field label="שם או כינוי" hint="יוצג בפרסומים שלך — אפשר גם כינוי">
            <input style={inputStyle} value={f.name} onChange={up("name")} placeholder="למשל: טל כ., רץ בוקר, אנונימי42" />
          </Field>
          <Field label="אימייל"><input style={inputStyle} value={f.email} onChange={up("email")} placeholder="name@example.com" dir="ltr" /></Field>
          <Field label="סיסמה"><input style={inputStyle} type="password" value={f.pw} onChange={up("pw")} dir="ltr" /></Field>
          <Field label="אימות סיסמה"><input style={inputStyle} type="password" value={f.pw2} onChange={up("pw2")} dir="ltr" /></Field>
          {err && <div style={{ background:"#FEECEC", color:T.live, borderRadius:10, padding:"9px 12px", fontSize:13, marginBottom:12, fontWeight:600 }}>{err}</div>}
          <PrimaryButton onClick={submitEmail} disabled={loading}>{loading ? "יוצר חשבון…" : "יצירת חשבון"}</PrimaryButton>
        </>
      )}
    </AuthShell>
  );
}

function Forgot({ go }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = () => {
    if (!email.includes("@")) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 700);
  };
  return (
    <AuthShell>
      <button onClick={() => go("login")} style={{ border: "none", background: "none", color: T.inkSoft, display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", marginBottom: 12, fontSize: 13.5 }}>
        <ArrowLeft size={16} /> חזרה להתחברות
      </button>
      <div style={{ fontSize: 19, fontWeight: 900, marginBottom: 2 }}>איפוס סיסמה</div>
      {!sent ? (
        <>
          <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 18 }}>נשלח אליך קישור לאיפוס הסיסמה</div>
          <Field label="אימייל"><input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" /></Field>
          <PrimaryButton onClick={submit} disabled={loading || !email.includes("@")}>{loading ? "שולח…" : "שליחת קישור איפוס"}</PrimaryButton>
        </>
      ) : (
        <>
          <div style={{ background: "#E8F5EE", color: "#12734A", borderRadius: 12, padding: 14, fontSize: 13.5, lineHeight: 1.5, marginBottom: 16 }}>
            שלחנו קישור לאיפוס אל <b dir="ltr">{email}</b>. בדוק את תיבת הדואר שלך.
          </div>
          <PrimaryButton onClick={() => go("reset")}>יש לי כבר קוד — לאיפוס</PrimaryButton>
        </>
      )}
    </AuthShell>
  );
}

function Reset({ go, toast }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = () => {
    setErr("");
    if (pw.length < 6) return setErr("סיסמה קצרה מדי");
    if (pw !== pw2) return setErr("הסיסמאות אינן תואמות");
    setLoading(true);
    setTimeout(() => { setLoading(false); toast("הסיסמה אופסה בהצלחה"); go("login"); }, 700);
  };
  return (
    <AuthShell>
      <div style={{ fontSize: 19, fontWeight: 900, marginBottom: 2 }}>סיסמה חדשה</div>
      <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 18 }}>בחר סיסמה חדשה לחשבון שלך</div>
      <Field label="סיסמה חדשה"><input style={inputStyle} type="password" value={pw} onChange={(e) => setPw(e.target.value)} dir="ltr" /></Field>
      <Field label="אימות סיסמה"><input style={inputStyle} type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} dir="ltr" /></Field>
      {err && <div style={{ background: "#FEECEC", color: T.live, borderRadius: 10, padding: "9px 12px", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{err}</div>}
      <PrimaryButton onClick={submit} disabled={loading}>{loading ? "שומר…" : "שמירת סיסמה"}</PrimaryButton>
    </AuthShell>
  );
}

/* ============================================================
   CARDS
   ============================================================ */
function StatusCard({ s, users, me, dist, onLike, onOpen, onReport, onUser }) {
  const author = users.find((u) => u.id === s.userId);
  const fr = freshness(s.createdAt, s.expiresAt);
  const expired = fr <= 0;
  const liked = s.likes.includes(me.id);
  const c = CATEGORIES[s.category];
  return (
    <div className="sn-card" style={{ opacity: expired ? 0.65 : 1, position: "relative" }}>
      {/* freshness accent bar */}
      <div style={{ height: 3, background: T.line, position: "absolute", top: 0, left: 0, right: 0 }}>
        <div style={{ height: "100%", width: `${fr * 100}%`, background: c.color, transition: "width 1s linear", borderRadius: "3px 0 0 0" }} />
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <button onClick={() => onUser(author.id)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}><Avatar user={author} size={42} /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => onUser(author.id)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontWeight: 800, fontSize: 14.5, color: T.ink }}>{author.name}</button>
              <CategoryChip cat={s.category} small />
              {fr > 0.85 && !expired && <LivePulse size={7} color={c.color} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.inkSoft, marginTop: 2, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Clock size={12} /> {expired ? "פג תוקף" : timeAgo(s.createdAt)}</span>
              <span>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><MapPin size={12} /> {s.locationName}</span>
              {dist != null && <><span>·</span><span>{distanceLabel(dist)}</span></>}
            </div>
          </div>
          <button onClick={() => onReport(s.id, "status")} style={{ border: "none", background: "none", color: T.inkFaint, cursor: "pointer", padding: "4px", borderRadius: 6, flexShrink: 0 }}><Flag size={15} /></button>
        </div>

        <div onClick={onOpen} style={{ fontSize: 15.5, lineHeight: 1.6, color: T.ink, margin: "10px 0 12px", cursor: "pointer" }}>{s.text}</div>
      </div>

      {s.media && (
        <div style={{ position: "relative", background: "#000" }}>
          {s.media.type === "video"
            ? <video src={s.media.src} controls playsInline preload="metadata" style={{ width: "100%", maxHeight: 400, display: "block" }} />
            : <img src={s.media.src} alt="" style={{ width: "100%", maxHeight: 400, objectFit: "cover", display: "block" }} />}
          {s.media.type === "video" && (
            <span style={{ position: "absolute", top: 8, insetInlineStart: 8, background: "rgba(0,0,0,.65)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Video size={11} /> {s.media.duration ? `${s.media.duration}ש׳` : "וידאו"}
            </span>
          )}
        </div>
      )}

      {/* counts row */}
      {(s.likes.length > 0 || s.comments.length > 0) && (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", fontSize: 13.5, color: T.inkSoft }}>
          {s.likes.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 18, height: 18, borderRadius: 50, background: c.color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={11} color="#fff" strokeWidth={2.5} /></span> {s.likes.length}</span>}
          {s.comments.length > 0 && <span onClick={onOpen} style={{ cursor: "pointer" }}>{s.comments.length} תגובות</span>}
        </div>
      )}

      {/* action buttons */}
      <div style={{ display: "flex", borderTop: `1px solid ${T.line}`, margin: "0 16px", padding: "4px 0" }}>
        <button className={`sn-react-btn${liked ? " active" : ""}`} onClick={() => onLike(s.id)}>
          <CheckCircle2 size={18} strokeWidth={2.2} /> אימות
        </button>
        <button className="sn-react-btn" onClick={onOpen}>
          <MessageCircle size={18} strokeWidth={2.2} /> תגובה
        </button>
        <button className="sn-react-btn" onClick={onOpen}>
          <Send size={18} strokeWidth={2.2} /> שתף
        </button>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, active, activeColor = T.brand, muted }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, border: "none",
      background: active ? activeColor + "16" : "none", color: active ? activeColor : (muted ? T.inkFaint : T.inkSoft),
      fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "7px 10px", borderRadius: 10, fontFamily: "inherit",
    }}>{icon}{label && <span>{label}</span>}</button>
  );
}

function RequestCard({ r, users, me, dist, onOpen, onReport, onUser }) {
  const author = users.find((u) => u.id === r.userId);
  const c = CATEGORIES[r.category];
  const statusMap = { open: { t: "פתוחה", color: T.brand }, answered: { t: "נענתה", color: "#12A594" }, expired: { t: "פג תוקף", color: T.inkFaint } };
  const st = statusMap[r.status];
  return (
    <div className="sn-card" style={{ opacity: r.status === "expired" ? 0.65 : 1, borderInlineStart: `4px solid ${c.color}` }}>
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <button onClick={() => onUser(author.id)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}><Avatar user={author} size={42} /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: 14.5, color: T.ink }}>{author.name}</span>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: st.color, background: st.color + "18", borderRadius: 999, padding: "2px 9px" }}>{st.t}</span>
            </div>
            <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Clock size={12} /> {timeAgo(r.createdAt)}</span>
              <span>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><MapPin size={12} /> {r.locationName}</span>
              {dist != null && <><span>·</span><span>{distanceLabel(dist)}</span></>}
            </div>
          </div>
          <button onClick={() => onReport(r.id, "request")} style={{ border: "none", background: "none", color: T.inkFaint, cursor: "pointer", padding: "4px", borderRadius: 6, flexShrink: 0 }}><Flag size={15} /></button>
        </div>
        <div onClick={onOpen} style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6, color: T.ink, margin: "10px 0 12px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <HelpCircle size={18} color={c.color} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{r.text}</span>
        </div>
      </div>
      <div style={{ display: "flex", borderTop: `1px solid ${T.line}`, margin: "0 16px", padding: "4px 0" }}>
        <button className="sn-react-btn active" style={{ color: c.color }} onClick={onOpen}>
          <Send size={18} strokeWidth={2.2} /> {r.answers.length ? `${r.answers.length} תשובות` : "ענה עכשיו"}
        </button>
        <button className="sn-react-btn" onClick={onOpen}>
          <MessageCircle size={18} strokeWidth={2.2} /> תגובה
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   FEED
   ============================================================ */
const FILTERS = [
  { key: "nearby", label: "לידך" },
  { key: "latest", label: "אחרונים" },
  { key: "statuses", label: "עדכונים" },
  { key: "requests", label: "בקשות" },
  { key: "groups", label: "הקבוצות שלי" },
];

function Feed({ data, me, myLoc, onLike, openStatus, openRequest, report, openUser, catFilter, setCatFilter, newCount, onRefresh }) {
  const [filter, setFilter] = useState("nearby");
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t); }, [filter, catFilter]);

  const myGroups = data.groups.filter((g) => g.memberIds.includes(me.id)).map((g) => g.id);

  const items = useMemo(() => {
    let list = [];
    if (filter !== "requests") list = list.concat(data.statuses.map((s) => ({ ...s, _type: "status" })));
    if (filter === "requests" || filter === "nearby" || filter === "latest") list = list.concat(data.requests.map((r) => ({ ...r, _type: "request" })));
    if (filter === "statuses") list = data.statuses.map((s) => ({ ...s, _type: "status" }));
    if (filter === "groups") list = data.statuses.filter((s) => s.groupId && myGroups.includes(s.groupId)).map((s) => ({ ...s, _type: "status" }));
    if (catFilter) list = list.filter((x) => x.category === catFilter);

    const withDist = list.map((x) => ({ ...x, _dist: myLoc ? haversineKm(myLoc, { lat: x.lat, lng: x.lng }) : null }));
    if (filter === "nearby" && myLoc) withDist.sort((a, b) => a._dist - b._dist);
    else withDist.sort((a, b) => b.createdAt - a.createdAt);
    return withDist;
  }, [data, filter, catFilter, myLoc]);

  return (
    <div>
      {/* new posts banner */}
      {newCount > 0 && (
        <button onClick={onRefresh} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", border: "none", background: T.brand, color: "#fff",
          padding: "10px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700,
          cursor: "pointer", marginBottom: 10, fontFamily: "inherit",
          boxShadow: `0 4px 14px ${T.brand}44`, animation: "snUp .25s ease",
        }}>
          <Sparkles size={16} /> {newCount} עדכון{newCount !== 1 ? "ים" : ""} חדש{newCount !== 1 ? "ים" : ""} — לחץ לרענון
        </button>
      )}

      {/* filter row */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: T.bg, paddingTop: 4 }}>
        <div className="sn-scroll-x" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10 }}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={chipBtn(filter === f.key)}>{f.label}</button>
          ))}
        </div>
        <div className="sn-scroll-x" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 12 }}>
          <button onClick={() => setCatFilter(null)} style={catBtn(!catFilter)}>הכל</button>
          {CAT_KEYS.map((k) => (
            <button key={k} onClick={() => setCatFilter(catFilter === k ? null : k)} style={catBtn(catFilter === k, CATEGORIES[k].color)}>
              {React.createElement(CATEGORIES[k].Icon, { size: 13, strokeWidth: 2.4 })}{CATEGORIES[k].short}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner label="טוען עדכונים לידך…" /> : items.length === 0 ? (
        <Empty icon="📍" title="אין עדכונים כרגע" sub="היה הראשון לדווח מה קורה באזורך — לחץ על ➕ למטה." />
      ) : items.map((x) =>
        x._type === "status"
          ? <StatusCard key={x.id} s={x} users={data.users} me={me} dist={x._dist} onLike={onLike} onOpen={() => openStatus(x.id)} onReport={report} onUser={openUser} />
          : <RequestCard key={x.id} r={x} users={data.users} me={me} dist={x._dist} onOpen={() => openRequest(x.id)} onReport={report} onUser={openUser} />
      )}
    </div>
  );
}

const chipBtn = (active) => ({
  border: `1.5px solid ${active ? T.brand : T.line}`, background: active ? T.brand : T.surface,
  color: active ? "#fff" : T.inkSoft, borderRadius: 999, padding: "8px 15px", fontSize: 13.5,
  fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit", flex: "0 0 auto",
});
const catBtn = (active, color = T.ink) => ({
  border: `1.5px solid ${active ? color : T.line}`, background: active ? color + "16" : T.surface,
  color: active ? color : T.inkSoft, borderRadius: 999, padding: "6px 12px", fontSize: 12.5,
  fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit", flex: "0 0 auto",
  display: "inline-flex", alignItems: "center", gap: 5,
});

/* ============================================================
   MAP VIEW (stylized SVG Israel)
   ============================================================ */
function MapView({ data, me, myLoc, openStatus, openRequest, catFilter, setCatFilter }) {
  const [sel, setSel] = useState(null); // {kind, id}
  const [showReq, setShowReq] = useState(true);
  const [showStat, setShowStat] = useState(true);

  const statuses = data.statuses.filter((s) => freshness(s.createdAt, s.expiresAt) > 0 && (!catFilter || s.category === catFilter));
  const requests = data.requests.filter((r) => r.status !== "expired" && (!catFilter || r.category === catFilter));

  const selItem = sel && (sel.kind === "status" ? data.statuses.find((s) => s.id === sel.id) : data.requests.find((r) => r.id === sel.id));

  return (
    <div>
      <div className="sn-scroll-x" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 10 }}>
        <button onClick={() => setShowStat(!showStat)} style={catBtn(showStat, T.brand)}><Radio size={13} /> עדכונים</button>
        <button onClick={() => setShowReq(!showReq)} style={catBtn(showReq, "#12A594")}><HelpCircle size={13} /> בקשות</button>
        <div style={{ width: 1, background: T.line, margin: "2px 2px" }} />
        <button onClick={() => setCatFilter(null)} style={catBtn(!catFilter)}>הכל</button>
        {CAT_KEYS.map((k) => (
          <button key={k} onClick={() => setCatFilter(catFilter === k ? null : k)} style={catBtn(catFilter === k, CATEGORIES[k].color)}>
            {React.createElement(CATEGORIES[k].Icon, { size: 13 })}{CATEGORIES[k].short}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", background: "linear-gradient(180deg,#EAF1FF,#F0F5EC)", borderRadius: 20, border: `1px solid ${T.line}`, overflow: "hidden", boxShadow: "inset 0 2px 12px rgba(20,22,28,.05)" }}>
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width="100%" style={{ display: "block", maxHeight: "58vh" }}>
          {/* sea */}
          <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="#DCEBFA" />
          {/* land */}
          <path d={ISRAEL_PATH} fill="#EDEAE0" stroke="#CBC7BA" strokeWidth="2" />
          {/* subtle city labels */}
          {CITIES.slice(0, 6).map((c) => { const p = project(c.lat, c.lng); return (
            <text key={c.name} x={p.x} y={p.y - 9} fontSize="8.5" fill="#A9A493" textAnchor="middle" style={{ pointerEvents: "none" }}>{c.name}</text>
          ); })}
          {/* me */}
          {myLoc && (() => { const p = project(myLoc.lat, myLoc.lng); return (
            <g><circle cx={p.x} cy={p.y} r="13" fill={T.brand} opacity="0.15"><animate attributeName="r" values="9;16;9" dur="2.4s" repeatCount="indefinite" /></circle>
            <circle cx={p.x} cy={p.y} r="5" fill={T.brand} stroke="#fff" strokeWidth="2" /></g>
          ); })()}
          {/* status markers */}
          {showStat && statuses.map((s) => { const p = project(s.lat, s.lng); const c = CATEGORIES[s.category]; const active = sel?.id === s.id; return (
            <g key={s.id} style={{ cursor: "pointer" }} onClick={() => setSel({ kind: "status", id: s.id })}>
              <circle cx={p.x} cy={p.y} r={active ? 11 : 8} fill={c.color} stroke="#fff" strokeWidth="2.5" />
              {freshness(s.createdAt, s.expiresAt) > 0.8 && <circle cx={p.x} cy={p.y} r="8" fill="none" stroke={c.color} strokeWidth="2" opacity="0.5"><animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" /></circle>}
            </g>
          ); })}
          {/* request markers (diamond) */}
          {showReq && requests.map((r) => { const p = project(r.lat, r.lng); const c = CATEGORIES[r.category]; const active = sel?.id === r.id; const sz = active ? 10 : 8; return (
            <g key={r.id} style={{ cursor: "pointer" }} onClick={() => setSel({ kind: "request", id: r.id })}>
              <rect x={p.x - sz} y={p.y - sz} width={sz * 2} height={sz * 2} rx="3" fill="#fff" stroke={c.color} strokeWidth="3" transform={`rotate(45 ${p.x} ${p.y})`} />
              <text x={p.x} y={p.y + 3.5} fontSize="10" fontWeight="800" fill={c.color} textAnchor="middle" style={{ pointerEvents: "none" }}>?</text>
            </g>
          ); })}
        </svg>

        <div style={{ position: "absolute", top: 12, insetInlineStart: 12, background: "rgba(255,255,255,.9)", borderRadius: 12, padding: "8px 11px", fontSize: 11.5, color: T.inkSoft, fontWeight: 600, backdropFilter: "blur(4px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 10, background: T.brand, display: "inline-block", border: "2px solid #fff" }} /> עדכון פעיל</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}><span style={{ width: 9, height: 9, background: "#fff", border: `2.5px solid #12A594`, display: "inline-block", transform: "rotate(45deg)" }} /> בקשת מידע</div>
        </div>
      </div>

      {/* selected card */}
      {selItem && (
        <div style={{ marginTop: 12 }}>
          {sel.kind === "status"
            ? <StatusCard s={selItem} users={data.users} me={me} dist={myLoc ? haversineKm(myLoc, selItem) : null} onLike={() => {}} onOpen={() => openStatus(selItem.id)} onReport={() => {}} onUser={() => {}} />
            : <RequestCard r={selItem} users={data.users} me={me} dist={myLoc ? haversineKm(myLoc, selItem) : null} onOpen={() => openRequest(selItem.id)} onReport={() => {}} onUser={() => {}} />}
        </div>
      )}
      {!selItem && <div style={{ textAlign: "center", color: T.inkFaint, fontSize: 13, marginTop: 14 }}>הקש על סמן במפה כדי לראות פרטים</div>}
    </div>
  );
}

/* ============================================================
   REQUESTS SCREEN
   ============================================================ */
function Requests({ data, me, myLoc, openRequest, report, openUser }) {
  const [tab, setTab] = useState("open");
  const list = data.requests
    .filter((r) => tab === "all" ? true : r.status === tab)
    .map((r) => ({ ...r, _dist: myLoc ? haversineKm(myLoc, r) : null }))
    .sort((a, b) => b.createdAt - a.createdAt);
  const tabs = [{ k: "open", t: "פתוחות" }, { k: "answered", t: "נענו" }, { k: "all", t: "הכל" }];
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {tabs.map((x) => <button key={x.k} onClick={() => setTab(x.k)} style={{ ...chipBtn(tab === x.k), flex: 1, justifyContent: "center" }}>{x.t}</button>)}
      </div>
      {list.length === 0
        ? <Empty icon="🙋" title="אין בקשות כאן" sub="שאל את הקהילה מה קורה במקום מסוים — לחץ על ➕ ובחר ״בקשת מידע״." />
        : list.map((r) => <RequestCard key={r.id} r={r} users={data.users} me={me} dist={r._dist} onOpen={() => openRequest(r.id)} onReport={report} onUser={openUser} />)}
    </div>
  );
}

/* ============================================================
   GROUPS
   ============================================================ */
function Groups({ data, me, onJoin, openGroup, openCreateGroup }) {
  const [q, setQ] = useState("");
  const list = data.groups.filter((g) => g.name.includes(q) || g.description.includes(q));
  const mine = list.filter((g) => g.memberIds.includes(me.id));
  const others = list.filter((g) => !g.memberIds.includes(me.id));
  return (
    <div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={17} style={{ position: "absolute", insetInlineStart: 13, top: 13, color: T.inkFaint }} />
        <input style={{ ...inputStyle, paddingInlineStart: 40 }} placeholder="חיפוש קבוצה…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <PrimaryButton onClick={openCreateGroup} style={{ marginBottom: 20 }}><Plus size={18} /> יצירת קבוצה חדשה</PrimaryButton>

      {mine.length > 0 && <SectionTitle>הקבוצות שלי</SectionTitle>}
      {mine.map((g) => <GroupCard key={g.id} g={g} me={me} onJoin={onJoin} openGroup={openGroup} />)}

      <SectionTitle>גלה קבוצות</SectionTitle>
      {others.length === 0 ? <Empty icon="🔍" title="לא נמצאו קבוצות" /> : others.map((g) => <GroupCard key={g.id} g={g} me={me} onJoin={onJoin} openGroup={openGroup} />)}
    </div>
  );
}

const SectionTitle = ({ children }) => <div style={{ fontSize: 13, fontWeight: 800, color: T.inkFaint, margin: "6px 2px 10px", letterSpacing: ".3px" }}>{children}</div>;

function GroupCard({ g, me, onJoin, openGroup }) {
  const joined = g.memberIds.includes(me.id);
  return (
    <div style={{ background: T.surface, borderRadius: 18, border: `1px solid ${T.line}`, padding: 13, marginBottom: 11, display: "flex", gap: 13, alignItems: "center" }}>
      <div style={{ width: 54, height: 54, borderRadius: 15, background: `linear-gradient(135deg,${g.cover.color},${g.cover.color}BB)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flex: "0 0 auto" }}>{g.cover.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }} onClick={() => openGroup(g.id)}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{g.name}</span>
          {g.privacy === "private" ? <Lock size={13} color={T.inkFaint} /> : <Globe size={13} color={T.inkFaint} />}
        </div>
        <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.description}</div>
        <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 3 }}>{g.memberIds.length} חברים</div>
      </div>
      <button onClick={() => onJoin(g.id)} style={{
        border: `1.5px solid ${joined ? T.line : T.brand}`, background: joined ? T.surface : T.brand, color: joined ? T.inkSoft : "#fff",
        borderRadius: 11, padding: "8px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", flex: "0 0 auto",
      }}>{joined ? "חבר" : "הצטרף"}</button>
    </div>
  );
}

function GroupFeed({ g, data, me, myLoc, onLike, openStatus, report, openUser, back, onPost }) {
  const posts = data.statuses.filter((s) => s.groupId === g.id).sort((a, b) => b.createdAt - a.createdAt);
  const joined = g.memberIds.includes(me.id);
  return (
    <div>
      <div style={{ height: 118, borderRadius: 20, background: `linear-gradient(135deg,${g.cover.color},${g.cover.color}AA)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, marginBottom: -34, position: "relative" }}>
        {g.cover.emoji}
        <button onClick={back} style={{ position: "absolute", top: 12, insetInlineStart: 12, background: "rgba(0,0,0,.25)", border: "none", borderRadius: 999, width: 34, height: 34, color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}><ChevronLeft size={20} /></button>
      </div>
      <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.line}`, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 900, fontSize: 18 }}>{g.name}</span>
          {g.privacy === "private" ? <Lock size={15} color={T.inkFaint} /> : <Globe size={15} color={T.inkFaint} />}
        </div>
        <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 6, lineHeight: 1.5 }}>{g.description}</div>
        <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 8 }}>{g.memberIds.length} חברים · {posts.length} עדכונים</div>
      </div>

      {joined && (
        <button onClick={() => onPost(g.id)} style={{ ...chipBtn(false), width: "100%", justifyContent: "center", padding: "13px", marginBottom: 16, borderStyle: "dashed", color: T.brand, borderColor: T.brand }}>
          <Plus size={17} style={{ verticalAlign: -3 }} /> פרסם עדכון בקבוצה
        </button>
      )}

      {posts.length === 0
        ? <Empty icon="💬" title="עדיין אין עדכונים בקבוצה" sub={joined ? "היה הראשון לפרסם!" : "הצטרף כדי לפרסם ולעקוב."} />
        : posts.map((s) => <StatusCard key={s.id} s={s} users={data.users} me={me} dist={myLoc ? haversineKm(myLoc, s) : null} onLike={onLike} onOpen={() => openStatus(s.id)} onReport={report} onUser={openUser} />)}
    </div>
  );
}

/* ============================================================
   PROFILE
   ============================================================ */
function Profile({ user, data, me, myLoc, onLogout, openStatus, openRequest, openGroup, isMe }) {
  const [tab, setTab] = useState("statuses");
  const myStatuses = data.statuses.filter((s) => s.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  const myReqs = data.requests.filter((r) => r.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  const myGroups = data.groups.filter((g) => g.memberIds.includes(user.id));
  const rep = user.reputation;
  const repTier = rep > 150 ? "מדווח מוביל" : rep > 80 ? "תורם פעיל" : "משתתף";

  return (
    <div>
      <div style={{ background: T.surface, borderRadius: 22, border: `1px solid ${T.line}`, padding: 20, marginBottom: 16, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Avatar user={user} size={78} /></div>
        <div style={{ fontWeight: 900, fontSize: 21 }}>{user.name}</div>
        <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><MapPin size={14} /> {user.city}</div>
        {user.bio && <div style={{ fontSize: 14, color: T.ink, marginTop: 10, lineHeight: 1.5 }}>{user.bio}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "center" }}>
          <Stat n={myStatuses.length} l="עדכונים" />
          <Stat n={myReqs.length} l="בקשות" />
          <Stat n={myGroups.length} l="קבוצות" />
        </div>

        <div style={{ marginTop: 16, background: `${T.gold}14`, borderRadius: 14, padding: 13, display: "flex", alignItems: "center", gap: 11, textAlign: "start" }}>
          <div style={{ background: T.gold, color: "#fff", borderRadius: 12, padding: 9, display: "grid", placeItems: "center" }}><Award size={22} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{repTier}</div>
            <div style={{ fontSize: 12, color: T.inkSoft }}>ציון אמון {rep} · מבוסס על אימותים ותשובות מועילות</div>
          </div>
          <TrendingUp size={18} color={T.gold} />
        </div>

        {isMe && <button onClick={onLogout} style={{ marginTop: 16, border: `1.5px solid ${T.line}`, background: T.surface, color: T.live, borderRadius: 12, padding: "10px 16px", fontWeight: 800, fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit" }}><LogOut size={16} /> התנתקות</button>}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[{ k: "statuses", t: "עדכונים" }, { k: "requests", t: "בקשות" }, { k: "groups", t: "קבוצות" }].map((x) =>
          <button key={x.k} onClick={() => setTab(x.k)} style={{ ...chipBtn(tab === x.k), flex: 1, justifyContent: "center" }}>{x.t}</button>)}
      </div>

      {tab === "statuses" && (myStatuses.length ? myStatuses.map((s) => <StatusCard key={s.id} s={s} users={data.users} me={me} dist={myLoc ? haversineKm(myLoc, s) : null} onLike={() => {}} onOpen={() => openStatus(s.id)} onReport={() => {}} onUser={() => {}} />) : <Empty icon="📝" title="אין עדכונים עדיין" />)}
      {tab === "requests" && (myReqs.length ? myReqs.map((r) => <RequestCard key={r.id} r={r} users={data.users} me={me} dist={myLoc ? haversineKm(myLoc, r) : null} onOpen={() => openRequest(r.id)} onReport={() => {}} onUser={() => {}} />) : <Empty icon="🙋" title="אין בקשות עדיין" />)}
      {tab === "groups" && (myGroups.length ? myGroups.map((g) => <GroupCard key={g.id} g={g} me={me} onJoin={() => {}} openGroup={openGroup} />) : <Empty icon="👥" title="עדיין לא בקבוצות" />)}
    </div>
  );
}
const Stat = ({ n, l }) => <div style={{ background: T.surfaceAlt, borderRadius: 14, padding: "10px 18px", minWidth: 70 }}><div style={{ fontWeight: 900, fontSize: 20, color: T.ink }}>{n}</div><div style={{ fontSize: 11.5, color: T.inkSoft }}>{l}</div></div>;

/* ============================================================
   DETAIL SHEETS (status / request with comments/answers)
   ============================================================ */
function Sheet({ children, onClose, title }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", background: "rgba(20,22,28,.35)" }} onClick={onClose}>
      <div style={{ marginTop: "auto", background: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "88%", display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,.2)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px" }}>
          <div style={{ fontWeight: 900, fontSize: 17 }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: T.surface, borderRadius: 999, width: 34, height: 34, display: "grid", placeItems: "center", cursor: "pointer", color: T.inkSoft }}><X size={19} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: "0 16px 16px" }}>{children}</div>
      </div>
    </div>
  );
}

function StatusDetail({ s, data, me, onClose, onLike, onComment, onUser }) {
  const [txt, setTxt] = useState("");
  return (
    <Sheet onClose={onClose} title="עדכון">
      <StatusCard s={s} users={data.users} me={me} dist={null} onLike={onLike} onOpen={() => {}} onReport={() => {}} onUser={onUser} />
      <SectionTitle>תגובות</SectionTitle>
      {s.comments.length === 0 && <div style={{ color: T.inkFaint, fontSize: 13.5, padding: "4px 2px 12px" }}>אין תגובות עדיין. היה הראשון.</div>}
      {s.comments.map((c) => { const u = data.users.find((x) => x.id === c.userId); return (
        <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <Avatar user={u} size={34} />
          <div style={{ background: T.surface, borderRadius: 14, padding: "9px 12px", flex: 1, border: `1px solid ${T.line}` }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{u.name} <span style={{ color: T.inkFaint, fontWeight: 500, fontSize: 11 }}>· {timeAgo(c.createdAt)}</span></div>
            <div style={{ fontSize: 14, marginTop: 2 }}>{c.text}</div>
          </div>
        </div>
      ); })}
      <Composer value={txt} setValue={setTxt} placeholder="הוסף תגובה…" onSend={() => { if (txt.trim()) { onComment(s.id, txt.trim()); setTxt(""); } }} />
    </Sheet>
  );
}

function RequestDetail({ r, data, me, onClose, onAnswer, onUser }) {
  const [txt, setTxt] = useState("");
  return (
    <Sheet onClose={onClose} title="בקשת מידע">
      <RequestCard r={r} users={data.users} me={me} dist={null} onOpen={() => {}} onReport={() => {}} onUser={onUser} />
      <SectionTitle>תשובות</SectionTitle>
      {r.answers.length === 0 && <div style={{ color: T.inkFaint, fontSize: 13.5, padding: "4px 2px 12px" }}>אף אחד לא ענה עדיין — עזור אם אתה יודע!</div>}
      {r.answers.map((a) => { const u = data.users.find((x) => x.id === a.userId); return (
        <div key={a.id} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <Avatar user={u} size={34} />
          <div style={{ background: "#E8F5EE", borderRadius: 14, padding: "9px 12px", flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{u.name} <span style={{ color: T.inkFaint, fontWeight: 500, fontSize: 11 }}>· {timeAgo(a.createdAt)}</span></div>
            <div style={{ fontSize: 14, marginTop: 2 }}>{a.text}</div>
          </div>
        </div>
      ); })}
      {r.status !== "expired" && <Composer value={txt} setValue={setTxt} placeholder="כתוב תשובה מועילה…" onSend={() => { if (txt.trim()) { onAnswer(r.id, txt.trim()); setTxt(""); } }} sendLabel="ענה" />}
    </Sheet>
  );
}

function Composer({ value, setValue, onSend, placeholder, sendLabel }) {
  return (
    <div style={{ display: "flex", gap: 8, position: "sticky", bottom: 0, background: T.bg, paddingTop: 8 }}>
      <input style={{ ...inputStyle, flex: 1 }} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}
        onKeyDown={(e) => { if (e.key === "Enter") onSend(); }} />
      <button onClick={onSend} disabled={!value.trim()} style={{ border: "none", background: value.trim() ? T.brand : T.inkFaint, color: "#fff", borderRadius: 12, padding: "0 16px", fontWeight: 800, cursor: value.trim() ? "pointer" : "default", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
        <Send size={16} />{sendLabel}
      </button>
    </div>
  );
}

/* ============================================================
   CREATE FORMS
   ============================================================ */
const uploadBtnStyle = {
  flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
  border: `1.5px dashed ${T.brand}`, background: `${T.brand}0D`, color: T.brand,
  borderRadius: 13, padding: "14px 10px", fontSize: 13.5, fontWeight: 800,
  cursor: "pointer", fontFamily: "inherit",
};

function CreateStatus({ me, myLoc, groups, presetGroup, onClose, onCreate, canPost, cooldown }) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState("general");
  const [locName, setLocName] = useState(myLoc?.name || "");
  const [loc, setLoc] = useState(myLoc || CITIES[0]);
  const [media, setMedia] = useState(null);
  const [mediaErr, setMediaErr] = useState("");
  const [expiry, setExpiry] = useState(1); // hours
  const [groupId, setGroupId] = useState(presetGroup || "");
  const [err, setErr] = useState("");
  const photoRef = useRef(null);
  const videoRef = useRef(null);
  const MAX_VIDEO_SEC = 15;

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 12 * 1024 * 1024) { setMediaErr("התמונה גדולה מדי (עד 12MB)."); e.target.value = ""; return; }
    setMedia({ type: "image", src: URL.createObjectURL(file), name: file.name });
    setMediaErr(""); e.target.value = "";
  };
  const pickVideo = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const src = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      if (v.duration > MAX_VIDEO_SEC + 0.5) {
        setMediaErr(`הסרטון ארוך מדי — ניתן להעלות עד ${MAX_VIDEO_SEC} שניות.`);
        URL.revokeObjectURL(src);
      } else {
        setMedia({ type: "video", src, duration: Math.max(1, Math.round(v.duration)) });
        setMediaErr("");
      }
    };
    v.onerror = () => { setMediaErr("לא ניתן לטעון את הסרטון."); URL.revokeObjectURL(src); };
    v.src = src;
    e.target.value = "";
  };

  const submit = () => {
    setErr("");
    if (!canPost) return setErr(`למניעת ספאם, המתן ${cooldown} שניות לפני פרסום נוסף.`);
    if (text.trim().length < 3) return setErr("כתוב לפחות כמה מילים על מה שקורה.");
    onCreate({
      userId: me.id, text: text.trim(), category: cat, locationName: locName,
      lat: loc.lat, lng: loc.lng, createdAt: now(), expiresAt: now() + expiry * HR,
      likes: [], comments: [], media, groupId: groupId || undefined,
    });
  };

  return (
    <Sheet onClose={onClose} title="מה קורה עכשיו?">
      <textarea style={{ ...inputStyle, minHeight: 90, resize: "none" }} placeholder="שתף עדכון בזמן אמת — מה קורה, איפה ומתי…" value={text} onChange={(e) => setText(e.target.value)} maxLength={280} />
      <div style={{ textAlign: "end", fontSize: 11, color: T.inkFaint, marginBottom: 12 }}>{text.length}/280</div>

      <Field label="קטגוריה">
        <div className="sn-scroll-x" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4 }}>
          {CAT_KEYS.map((k) => <button key={k} onClick={() => setCat(k)} style={catBtn(cat === k, CATEGORIES[k].color)}>{React.createElement(CATEGORIES[k].Icon, { size: 13 })}{CATEGORIES[k].short}</button>)}
        </div>
      </Field>

      <Field label="מיקום (רשות)" hint="לדוגמה: רחוב דיזנגוף, תל אביב">
        <input style={inputStyle} value={locName} onChange={(e) => setLocName(e.target.value)} placeholder="היכן זה קורה?" />
      </Field>

      <Field label="מדיה (רשות)" hint={`אפשר לצרף תמונה, או סרטון קצר של עד 15 שניות.`}>
        {!media ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => photoRef.current?.click()} style={uploadBtnStyle}><ImageIcon size={18} /> העלה תמונה</button>
            <button onClick={() => videoRef.current?.click()} style={uploadBtnStyle}><Video size={18} /> סרטון (15 ש׳)</button>
          </div>
        ) : (
          <div style={{ position: "relative", borderRadius: 13, overflow: "hidden", border: `1px solid ${T.line}` }}>
            {media.type === "image"
              ? <img src={media.src} alt="" style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />
              : <video src={media.src} controls playsInline style={{ width: "100%", maxHeight: 280, display: "block", background: "#000" }} />}
            <button onClick={() => setMedia(null)} style={{ position: "absolute", top: 8, insetInlineEnd: 8, background: "rgba(0,0,0,.55)", border: "none", color: "#fff", borderRadius: 999, width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer" }}><X size={17} /></button>
            {media.type === "video" && <span style={{ position: "absolute", bottom: 8, insetInlineStart: 8, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 4 }}><Video size={11} /> {media.duration}ש׳</span>}
          </div>
        )}
        <input ref={photoRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: "none" }} />
        <input ref={videoRef} type="file" accept="video/*" onChange={pickVideo} style={{ display: "none" }} />
        {mediaErr && <div style={{ color: T.live, fontSize: 12.5, fontWeight: 600, marginTop: 6 }}>{mediaErr}</div>}
      </Field>

      <Field label={`תוקף העדכון · ${expiry} שעות`} hint="עדכונים בזמן אמת מתיישנים ונעלמים אוטומטית.">
        <input type="range" min="1" max="12" value={expiry} onChange={(e) => setExpiry(+e.target.value)} style={{ width: "100%", accentColor: T.brand }} />
      </Field>

      {groups.length > 0 && (
        <Field label="פרסום בקבוצה (רשות)">
          <select style={inputStyle} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">ללא קבוצה — פיד ציבורי</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Field>
      )}

      {err && <div style={{ background: "#FEECEC", color: T.live, borderRadius: 10, padding: "9px 12px", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{err}</div>}
      <PrimaryButton onClick={submit}><Radio size={17} /> פרסם עדכון</PrimaryButton>
    </Sheet>
  );
}

function CreateRequest({ me, myLoc, onClose, onCreate, canPost, cooldown }) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState("general");
  const [locName, setLocName] = useState("");
  const [loc, setLoc] = useState(CITIES[0]);
  const [err, setErr] = useState("");
  const submit = () => {
    setErr("");
    if (!canPost) return setErr(`למניעת ספאם, המתן ${cooldown} שניות לפני פרסום נוסף.`);
    if (text.trim().length < 5) return setErr("נסח שאלה ברורה יותר.");
    onCreate({ userId: me.id, text: text.trim(), category: cat, locationName: locName, lat: loc.lat, lng: loc.lng, createdAt: now(), status: "open", answers: [] });
  };
  return (
    <Sheet onClose={onClose} title="בקשת מידע">
      <div style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 12 }}>שאל את הקהילה מה קורה במקום מסוים ברגע זה.</div>
      <textarea style={{ ...inputStyle, minHeight: 80, resize: "none" }} placeholder="לדוגמה: כמה עמוס עכשיו בחוף? יש חניה באזור?" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} />
      <div style={{ height: 12 }} />
      <Field label="קטגוריה">
        <div className="sn-scroll-x" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4 }}>
          {CAT_KEYS.map((k) => <button key={k} onClick={() => setCat(k)} style={catBtn(cat === k, CATEGORIES[k].color)}>{React.createElement(CATEGORIES[k].Icon, { size: 13 })}{CATEGORIES[k].short}</button>)}
        </div>
      </Field>
      <Field label="על איזה מקום?">
        <input style={inputStyle} value={locName} onChange={(e) => setLocName(e.target.value)} placeholder="לדוגמה: חוף גורדון, תל אביב" />
      </Field>
      {err && <div style={{ background: "#FEECEC", color: T.live, borderRadius: 10, padding: "9px 12px", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{err}</div>}
      <PrimaryButton onClick={submit}><HelpCircle size={17} /> פרסם בקשה</PrimaryButton>
    </Sheet>
  );
}

function CreateGroup({ me, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [cover, setCover] = useState(0);
  const [err, setErr] = useState("");
  const COVERS = [{ emoji: "🌆", color: "#1F5EFF" }, { emoji: "🏘️", color: "#8B5CF6" }, { emoji: "🚗", color: "#12A594" }, { emoji: "🎉", color: "#F97316" }, { emoji: "⚽", color: "#22A559" }, { emoji: "🏖️", color: "#3BA3E8" }];
  const submit = () => {
    setErr("");
    if (name.trim().length < 2) return setErr("נא לתת שם לקבוצה.");
    onCreate({ name: name.trim(), description: desc.trim() || "קבוצה חדשה", cover: COVERS[cover], privacy, memberIds: [me.id] });
  };
  return (
    <Sheet onClose={onClose} title="קבוצה חדשה">
      <Field label="שם הקבוצה"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: שכונת פלורנטין" /></Field>
      <Field label="תיאור"><textarea style={{ ...inputStyle, minHeight: 70, resize: "none" }} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="על מה הקבוצה?" /></Field>
      <Field label="תמונת שער">
        <div style={{ display: "flex", gap: 8 }}>
          {COVERS.map((o, i) => <button key={i} onClick={() => setCover(i)} style={{ width: 48, height: 48, borderRadius: 12, cursor: "pointer", fontSize: 22, border: `2px solid ${cover === i ? T.brand : T.line}`, background: `linear-gradient(135deg,${o.color},${o.color}AA)`, display: "grid", placeItems: "center" }}>{o.emoji}</button>)}
        </div>
      </Field>
      <Field label="פרטיות">
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPrivacy("public")} style={{ ...chipBtn(privacy === "public"), flex: 1, justifyContent: "center" }}><Globe size={15} /> ציבורית</button>
          <button onClick={() => setPrivacy("private")} style={{ ...chipBtn(privacy === "private"), flex: 1, justifyContent: "center" }}><Lock size={15} /> פרטית</button>
        </div>
      </Field>
      {err && <div style={{ background: "#FEECEC", color: T.live, borderRadius: 10, padding: "9px 12px", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{err}</div>}
      <PrimaryButton onClick={submit}><Plus size={17} /> יצירת קבוצה</PrimaryButton>
    </Sheet>
  );
}

/* create action menu */
function CreateMenu({ onClose, onStatus, onRequest }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(20,22,28,.35)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ padding: "0 16px calc(96px + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onStatus} style={menuItem(T.brand)}><Radio size={22} /><div style={{ textAlign: "start" }}><div style={{ fontWeight: 800, fontSize: 15 }}>עדכון סטטוס</div><div style={{ fontSize: 12.5, opacity: .9 }}>שתף מה קורה עכשיו לידך</div></div></button>
        <button onClick={onRequest} style={menuItem("#12A594")}><HelpCircle size={22} /><div style={{ textAlign: "start" }}><div style={{ fontWeight: 800, fontSize: 15 }}>בקשת מידע</div><div style={{ fontSize: 12.5, opacity: .9 }}>שאל מה קורה במקום מסוים</div></div></button>
      </div>
    </div>
  );
}
const menuItem = (color) => ({ width: "100%", display: "flex", alignItems: "center", gap: 13, background: color, color: "#fff", border: "none", borderRadius: 16, padding: 15, marginBottom: 10, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 10px 26px ${color}55` });

/* location prompt */
function LocationPrompt({ onManual, onGPS, onSkip }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(20,22,28,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}>
      <div style={{ background: T.surface, borderRadius: 22, padding: 24, maxWidth: 340, textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 999, background: `${T.brand}16`, display: "grid", placeItems: "center", margin: "0 auto 14px" }}><MapPin size={30} color={T.brand} /></div>
        <div style={{ fontWeight: 900, fontSize: 18 }}>איפה אתה נמצא?</div>
        <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 8, lineHeight: 1.5 }}>נשתמש במיקום כדי להראות לך עדכונים רלוונטיים לידך. אפשר גם לבחור מיקום ידנית.</div>
        <div style={{ marginTop: 18 }}>
          <PrimaryButton onClick={onGPS}><MapPin size={17} /> שתף מיקום נוכחי</PrimaryButton>
          <button onClick={onManual} style={{ width: "100%", marginTop: 10, border: `1.5px solid ${T.line}`, background: T.surface, borderRadius: 13, padding: "12px", fontWeight: 800, fontSize: 14.5, cursor: "pointer", fontFamily: "inherit" }}>בחירת מיקום ידנית</button>
          <button onClick={onSkip} style={{ width: "100%", marginTop: 8, border: "none", background: "none", color: T.inkFaint, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>דלג</button>
        </div>
      </div>
    </div>
  );
}

function ManualLocation({ onPick, onClose }) {
  return (
    <Sheet onClose={onClose} title="בחר מיקום">
      {CITIES.map((c) => (
        <button key={c.name} onClick={() => onPick(c)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: 14, marginBottom: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700 }}>
          <MapPin size={18} color={T.brand} /> {c.name}
        </button>
      ))}
    </Sheet>
  );
}

/* ============================================================
   BOTTOM NAV
   ============================================================ */
function BottomNav({ tab, setTab, onCreate }) {
  const items = [
    { k: "feed", label: "פיד", Icon: Newspaper },
    { k: "map", label: "מפה", Icon: MapIcon },
    { k: "requests", label: "בקשות", Icon: HelpCircle },
    { k: "groups", label: "קבוצות", Icon: Users },
    { k: "profile", label: "פרופיל", Icon: UserIcon },
  ];
  return (
    <div className="sn-bottom-nav">
      {items.map((it) => {
        const active = tab === it.k;
        return (
          <button key={it.k} onClick={() => setTab(it.k)} style={{ flex: 1, border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? T.brand : T.inkFaint, fontFamily: "inherit", padding: "4px 0" }}>
            <it.Icon size={23} strokeWidth={active ? 2.6 : 2} fill={active ? `${T.brand}22` : "none"} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 800 : 600 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   PERSISTENCE HELPERS
   ============================================================ */
const LS_SESSION = "sn_session_v1";
const LS_DATA    = "sn_data_v1";

function loadSession() {
  try { return JSON.parse(localStorage.getItem(LS_SESSION)) || {}; } catch { return {}; }
}
function saveSession(obj) {
  try { localStorage.setItem(LS_SESSION, JSON.stringify(obj)); } catch {}
}
function loadData() {
  try {
    const raw = localStorage.getItem(LS_DATA);
    if (!raw) return null;
    const d = JSON.parse(raw);
    // Merge saved user-created content on top of seed data
    // to keep seed photos/example posts intact
    const seed = seedData();
    return {
      users:    [...seed.users,    ...(d.users    || []).filter(u => !seed.users.find(x=>x.id===u.id))],
      statuses: [...(d.statuses || seed.statuses)],
      requests: [...(d.requests || seed.requests)],
      groups:   [...(d.groups   || seed.groups)],
    };
  } catch { return null; }
}
function saveData(d) {
  try {
    // Only persist user-added content on top of seed, to keep size small
    const seed = seedData();
    const seedStatusIds = new Set(seed.statuses.map(s=>s.id));
    const seedReqIds    = new Set(seed.requests.map(r=>r.id));
    const seedUserIds   = new Set(seed.users.map(u=>u.id));
    localStorage.setItem(LS_DATA, JSON.stringify({
      statuses: d.statuses, // save all (includes seed + new)
      requests: d.requests,
      groups:   d.groups,
      users:    d.users.filter(u => !seedUserIds.has(u.id)), // only new users
    }));
  } catch {}
}

/* ============================================================
   ROOT APP
   ============================================================ */
export default function App() {
  // ── Session (survives page refresh) ──────────────────────────
  const savedSession = loadSession();
  const [authed, setAuthed] = useState(savedSession.authed || false);
  const [authScreen, setAuthScreen] = useState("login");
  const [meId, setMeId] = useState(savedSession.meId || "u_me");

  // ── Data (survives page refresh) ─────────────────────────────
  const [data, setData] = useState(() => loadData() || seedData());

  // Persist data whenever it changes
  useEffect(() => { saveData(data); }, [data]);

  // Persist session whenever authed/meId changes
  useEffect(() => { saveSession({ authed, meId }); }, [authed, meId]);

  const me = data.users.find((u) => u.id === meId) || data.users[0];

  const [tab, setTab] = useState("feed");
  const [modal, setModal] = useState(null);
  const [viewGroup, setViewGroup] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [presetGroupForPost, setPresetGroupForPost] = useState(null);

  const [myLoc, setMyLoc] = useState(null);
  const [askedLoc, setAskedLoc] = useState(false);
  const [catFilter, setCatFilter] = useState(null);

  // ── New-posts indicator ───────────────────────────────────────
  const [newCount, setNewCount] = useState(0);
  const lastSeenRef = useRef(now());
  const checkNew = () => {
    const fresh = data.statuses.filter(s => s.createdAt > lastSeenRef.current).length;
    setNewCount(fresh);
  };
  // Poll every 30s (simulated — in production this would be a websocket/SSE)
  useEffect(() => {
    const i = setInterval(checkNew, 30000);
    return () => clearInterval(i);
  }, [data.statuses]);

  const handleRefresh = () => {
    lastSeenRef.current = now();
    setNewCount(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("הפיד עודכן ✓");
  };

  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const lastPostRef = useRef(0);
  const COOLDOWN = 20; // seconds
  const canPost = () => now() - lastPostRef.current > COOLDOWN * 1000;
  const cooldownLeft = () => Math.max(0, Math.ceil(COOLDOWN - (now() - lastPostRef.current) / 1000));

  // tick to refresh time-ago / freshness
  const [, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick((t) => t + 1), 30000); return () => clearInterval(i); }, []);

  // no location prompt — user location is optional
  useEffect(() => { if (authed && !askedLoc) { setAskedLoc(true); } }, [authed]);

  /* ---- data mutations ---- */
  const handleLogout = () => {
    saveSession({ authed: false, meId: "u_me" });
    setAuthed(false);
    setAuthScreen("login");
    setViewUser(null);
    setTab("feed");
  };

  /* ---- data mutations ---- */
  const likeStatus = (id) => setData((d) => ({ ...d, statuses: d.statuses.map((s) => s.id === id ? { ...s, likes: s.likes.includes(meId) ? s.likes.filter((x) => x !== meId) : [...s.likes, meId] } : s) }));
  const addComment = (id, text) => setData((d) => ({ ...d, statuses: d.statuses.map((s) => s.id === id ? { ...s, comments: [...s.comments, { id: uid(), userId: meId, text, createdAt: now() }] } : s) }));
  const addAnswer = (id, text) => { setData((d) => ({ ...d, statuses: d.statuses, requests: d.requests.map((r) => r.id === id ? { ...r, status: "answered", answers: [...r.answers, { id: uid(), userId: meId, text, createdAt: now() }] } : r) })); showToast("התשובה פורסמה — תודה שעזרת! ⭐"); };
  const joinGroup = (id) => setData((d) => ({ ...d, groups: d.groups.map((g) => g.id === id ? { ...g, memberIds: g.memberIds.includes(meId) ? g.memberIds.filter((x) => x !== meId) : [...g.memberIds, meId] } : g) }));
  const report = (id, kind) => showToast("הדיווח התקבל. הצוות יבדוק את התוכן. 🚩");

  const createStatus = (obj) => { setData((d) => ({ ...d, statuses: [{ id: uid(), ...obj }, ...d.statuses] })); lastPostRef.current = now(); setModal(null); showToast("העדכון פורסם! 🚀"); };
  const createRequest = (obj) => { setData((d) => ({ ...d, requests: [{ id: uid(), ...obj }, ...d.requests] })); lastPostRef.current = now(); setModal(null); setTab("requests"); showToast("הבקשה פורסמה!"); };
  const createGroup = (obj) => { const id = uid(); setData((d) => ({ ...d, groups: [{ id, ...obj }, ...d.groups] })); setModal(null); setViewGroup(id); showToast("הקבוצה נוצרה! 🎉"); };

  /* ---- navigation helpers ---- */
  const openStatus = (id) => setModal({ type: "statusDetail", id });
  const openRequest = (id) => setModal({ type: "requestDetail", id });
  const openUser = (id) => { setViewUser(id); setTab("profile"); };
  const openGroup = (id) => { setViewGroup(id); setTab("groups"); };
  const goTab = (t) => { setTab(t); setViewGroup(null); setViewUser(null); };

  /* ---------- render auth ---------- */
  if (!authed) {
    const handleLogin = (userInfo) => {
      let newMeId = "u_me";
      if (userInfo && userInfo.name) {
        const newId = uid();
        const newUser = {
          id: newId,
          name: userInfo.name,
          color: AVCOLORS[Math.floor(Math.random() * AVCOLORS.length)],
          bio: userInfo.provider === "anon" ? "משתמש אנונימי 🎭" : userInfo.provider === "google" ? "מחובר דרך Google" : "משתמש חדש",
          city: "",
          lat: CITIES[0].lat, lng: CITIES[0].lng,
          reputation: 0,
        };
        setData(d => ({ ...d, users: [...d.users, newUser] }));
        newMeId = newId;
        setMeId(newId);
      }
      setAuthed(true);
      setTab("feed");
      saveSession({ authed: true, meId: newMeId });
    };
    const props = { go: setAuthScreen, onLogin: handleLogin, toast: showToast };
    return (
      <Shell>
        {authScreen === "login" && <Login {...props} />}
        {authScreen === "register" && <Register {...props} />}
        {authScreen === "forgot" && <Forgot {...props} />}
        {authScreen === "reset" && <Reset {...props} />}
        <ToastView toast={toast} />
      </Shell>
    );
  }

  const currentModal = modal;
  const detailStatus = currentModal?.type === "statusDetail" && data.statuses.find((s) => s.id === currentModal.id);
  const detailRequest = currentModal?.type === "requestDetail" && data.requests.find((r) => r.id === currentModal.id);
  const myGroups = data.groups.filter((g) => g.memberIds.includes(meId));

  /* ---------- main screens ---------- */
  let screen = null;
  if (tab === "feed") screen = <Feed data={data} me={me} myLoc={myLoc} onLike={likeStatus} openStatus={openStatus} openRequest={openRequest} report={report} openUser={openUser} catFilter={catFilter} setCatFilter={setCatFilter} newCount={newCount} onRefresh={handleRefresh} />;
  else if (tab === "map") screen = <MapView data={data} me={me} myLoc={myLoc} openStatus={openStatus} openRequest={openRequest} catFilter={catFilter} setCatFilter={setCatFilter} />;
  else if (tab === "requests") screen = <Requests data={data} me={me} myLoc={myLoc} openRequest={openRequest} report={report} openUser={openUser} />;
  else if (tab === "groups") screen = viewGroup
    ? <GroupFeed g={data.groups.find((g) => g.id === viewGroup)} data={data} me={me} myLoc={myLoc} onLike={likeStatus} openStatus={openStatus} report={report} openUser={openUser} back={() => setViewGroup(null)} onPost={(gid) => { setPresetGroupForPost(gid); setModal({ type: "createStatus" }); }} />
    : <Groups data={data} me={me} onJoin={joinGroup} openGroup={(id) => setViewGroup(id)} openCreateGroup={() => setModal({ type: "createGroup" })} />;
  else if (tab === "profile") { const u = data.users.find((x) => x.id === (viewUser || meId)); screen = <Profile user={u} data={data} me={me} myLoc={myLoc} isMe={!viewUser || viewUser === meId} onLogout={handleLogout} openStatus={openStatus} openRequest={openRequest} openGroup={(id) => setViewGroup(id)} />; }

  const titles = { feed: "Status Now", map: "מפת אירועים", requests: "בקשות מידע", groups: viewGroup ? "קבוצה" : "קבוצות", profile: viewUser && viewUser !== meId ? "פרופיל" : "הפרופיל שלי" };

  return (
    <Shell>
      {/* ── FIXED TOP NAV BAR ── */}
      <header className="sn-topbar">
        {/* Logo */}
        <div className="sn-topbar-logo">
          <span style={{ display:"inline-flex", padding:7, borderRadius:10, background:"rgba(255,255,255,.95)", color:"#0D9488", boxShadow:"0 2px 6px rgba(0,0,0,.12)" }}><Radio size={18} strokeWidth={2.8}/></span>
          <span dir="ltr" style={{ fontSize:19, color:"#ffffff", fontWeight:900, letterSpacing:"-.3px" }}>Status<span style={{ color:"rgba(255,255,255,.7)" }}> Now</span></span>
        </div>
        {/* Center tabs — desktop */}
        <div className="sn-topbar-tabs">
          {[{k:"feed",Icon:Newspaper},{k:"map",Icon:MapIcon},{k:"requests",Icon:HelpCircle},{k:"groups",Icon:Users}].map(({k,Icon})=>(
            <button key={k} className={`sn-topbar-tab${tab===k?" active":""}`} onClick={()=>goTab(k)}>
              <Icon size={22} strokeWidth={tab===k?2.6:2}/>
            </button>
          ))}
        </div>
        {/* Right actions */}
        <div className="sn-topbar-actions">
          <button onClick={()=>setModal({type:"createMenu"})} title="פרסם עדכון" style={{display:"flex",alignItems:"center",gap:7,border:"none",background:"rgba(255,255,255,.95)",color:"#0F766E",borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",border:"none",boxShadow:"0 1px 4px rgba(0,0,0,.12)",transition:"all .12s"}}><Plus size={17} strokeWidth={2.6}/>פרסם</button>
          <button className="sn-topbar-btn" onClick={()=>goTab("profile")} title="פרופיל"><Avatar user={me} size={36}/></button>
        </div>
      </header>

      {/* ── PAGE BODY (below topbar) ── */}
      <div className="sn-page">
        <div className="sn-page-inner">

        {/* LEFT SIDEBAR (desktop only) */}
        <aside className="sn-sidebar">
          {/* profile mini-card on white bg */}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 6px 14px", marginBottom:2 }}>
            <button onClick={()=>goTab("profile")} style={{border:"none",background:"none",padding:0,cursor:"pointer",position:"relative"}}>
              <Avatar user={me} size={44}/>
              <span style={{position:"absolute",bottom:1,insetInlineEnd:1,width:11,height:11,borderRadius:999,background:"#22C55E",border:"2px solid #BFDBFE"}}/>
            </button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:14.5,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{me.name}</div>
              <div style={{fontSize:12,color:"#64748B",marginTop:1}}>{me.city}</div>
            </div>
          </div>
          <div className="sn-nav-divider"/>
          <nav>
            {[
              { k:"feed",    label:"פיד",           Icon:Newspaper  },
              { k:"map",     label:"מפת אירועים",   Icon:MapIcon    },
              { k:"requests",label:"בקשות מידע",    Icon:HelpCircle },
              { k:"groups",  label:"קבוצות",        Icon:Users      },
              { k:"profile", label:"הפרופיל שלי",   Icon:UserIcon   },
            ].map(({k,label,Icon})=>(
              <button key={k} className={`sn-nav-btn${tab===k?" active":""}`} onClick={()=>goTab(k)}>
                <span className="sn-nav-icon"><Icon size={18} strokeWidth={tab===k?2.5:2}/></span>
                {label}
              </button>
            ))}
          </nav>
          <div className="sn-nav-divider" style={{marginTop:"auto"}}/>
          <button className="sn-nav-btn" style={{color:"#EF4444",marginTop:"auto"}} onClick={handleLogout}>
            <span className="sn-nav-icon" style={{background:"#FEF2F2"}}><LogOut size={17} color="#EF4444"/></span>
            התנתקות
          </button>
        </aside>

        {/* ── MAIN FEED COLUMN ── */}
        <div className="sn-main">
          {/* ── FROZEN COMPOSE BAR ── */}
          {tab === "feed" && (
            <div className="sn-compose-wrap">
              <div className="sn-compose">
                {/* top row: avatar + prompt */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <Avatar user={me} size={42}/>
                  <button className="sn-compose-btn" onClick={()=>setModal({type:"createMenu"})}>
                    מה קורה עכשיו לידך, {me.name.split(" ")[0]}?
                  </button>
                </div>
                {/* action buttons row */}
                <div style={{display:"flex",gap:6,paddingTop:10,borderTop:`1px solid ${T.line}`}}>
                  <button className="sn-quick-btn sn-quick-green"
                    onClick={()=>{setPresetGroupForPost(null);setModal({type:"createStatus"});}}>
                    <ImageIcon size={18}/> תמונה/וידאו
                  </button>
                  <button className="sn-quick-btn sn-quick-amber"
                    onClick={()=>setModal({type:"createRequest"})}>
                    <HelpCircle size={18}/> בקשת מידע
                  </button>
                  <button className="sn-quick-btn sn-quick-red"
                    onClick={()=>setModal({type:"createStatus"})}>
                    <Radio size={18}/> עדכון חי
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ── SCROLLING FEED ── */}
          <div className="sn-feed-area">{screen}</div>
        </div>

        {/* ── RIGHT PANEL (desktop only) ── */}
        <div className="sn-right-panel">
          {/* categories card — glass on violet */}
          <div style={{background:"#EFF6FF",borderRadius:12,border:"1px solid #BFDBFE",padding:"14px 14px",marginBottom:12,boxShadow:"0 1px 4px rgba(13,148,136,.07)"}}>
            <div style={{fontWeight:700,fontSize:13,color:"#94A3B8",letterSpacing:".5px",textTransform:"uppercase",marginBottom:10}}>
              קטגוריות פעילות
            </div>
            {Object.entries(CATEGORIES).map(([k,c])=>{
              const count = data.statuses.filter(s=>s.category===k&&freshness(s.createdAt,s.expiresAt)>0).length;
              if(!count) return null;
              return (
                <div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #BFDBFE",cursor:"pointer"}} onClick={()=>setCatFilter(catFilter===k?null:k)}>
                  <span style={{width:32,height:32,borderRadius:8,background:c.color+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {React.createElement(c.Icon,{size:15,color:c.color})}
                  </span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,color:"#0F172A"}}>{c.he}</div>
                    <div style={{fontSize:11,color:"#94A3B8"}}>{count} פעיל{count!==1?"ים":""}</div>
                  </div>
                  {catFilter===k && <Check size={14} color="#1D4ED8"/>}
                </div>
              );
            })}
          </div>
          {/* top reporters — glass on violet */}
          <div style={{background:"#EFF6FF",borderRadius:12,border:"1px solid #BFDBFE",padding:"14px 14px",boxShadow:"0 1px 4px rgba(13,148,136,.07)"}}>
            <div style={{fontWeight:700,fontSize:13,color:"#94A3B8",letterSpacing:".5px",textTransform:"uppercase",marginBottom:10}}>
              מדווחים מובילים
            </div>
            {[...data.users].sort((a,b)=>b.reputation-a.reputation).slice(0,4).map(u=>(
              <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #BFDBFE",cursor:"pointer"}} onClick={()=>{openUser(u.id);}}>
                <Avatar user={u} size={34}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                  <div style={{fontSize:11,color:"#94A3B8"}}>{u.city} · {u.reputation} נק׳</div>
                </div>
                <Award size={14} color="#F59E0B"/>
              </div>
            ))}
          </div>
        </div>
        </div>{/* end sn-page-inner */}
      </div>{/* end sn-page */}

      {/* ── FIXED FAB (mobile only) ── */}
      <button className="sn-fab" onClick={() => setModal({ type: "createMenu" })} style={{
        position: "fixed", bottom: "calc(72px + env(safe-area-inset-bottom))", insetInlineEnd: 20,
        width: 58, height: 58, borderRadius: 999, background: "#0D9488", color: "#fff",
        border: "none", boxShadow: "0 10px 28px rgba(13,148,136,.4)",
        cursor: "pointer", display: "grid", placeItems: "center", zIndex: 30,
      }}><Plus size={28} strokeWidth={2.6} /></button>

      {/* ── BOTTOM NAV (mobile only) ── */}
      <BottomNav tab={tab} setTab={goTab} onCreate={() => setModal({ type: "createMenu" })} />

      {/* modals */}
      {currentModal?.type === "createMenu" && <CreateMenu onClose={() => setModal(null)} onStatus={() => { setPresetGroupForPost(null); setModal({ type: "createStatus" }); }} onRequest={() => setModal({ type: "createRequest" })} />}
      {currentModal?.type === "createStatus" && <CreateStatus me={me} myLoc={myLoc} groups={myGroups} presetGroup={presetGroupForPost} onClose={() => setModal(null)} onCreate={createStatus} canPost={canPost()} cooldown={cooldownLeft()} />}
      {currentModal?.type === "createRequest" && <CreateRequest me={me} myLoc={myLoc} onClose={() => setModal(null)} onCreate={createRequest} canPost={canPost()} cooldown={cooldownLeft()} />}
      {currentModal?.type === "createGroup" && <CreateGroup me={me} onClose={() => setModal(null)} onCreate={createGroup} />}
      {detailStatus && <StatusDetail s={detailStatus} data={data} me={me} onClose={() => setModal(null)} onLike={likeStatus} onComment={addComment} onUser={openUser} />}
      {detailRequest && <RequestDetail r={detailRequest} data={data} me={me} onClose={() => setModal(null)} onAnswer={addAnswer} onUser={openUser} />}
      {currentModal?.type === "manualLoc" && <ManualLocation onClose={() => setModal(null)} onPick={(c) => { setMyLoc({ ...c, name: c.name }); setAskedLoc(true); setModal(null); showToast(`מיקום עודכן: ${c.name} 📍`); }} />}

      <ToastView toast={toast} />
    </Shell>
  );
}

/* app frame — social-network layout, RTL */
function Shell({ children }) {
  return (
    <div dir="rtl" lang="he" style={{ minHeight: "100vh", background: "#EFF6FF", fontFamily: "'Heebo','Assistant','Rubik',system-ui,'Arial Hebrew',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; overflow-x: hidden; background: #EFF6FF; }
        .sn-scroll-x::-webkit-scrollbar{display:none} .sn-scroll-x{scrollbar-width:none}
        ::-webkit-scrollbar{width:0}
        @keyframes snPing{75%,100%{transform:scale(2.2);opacity:0}}
        .sn-ping{animation:snPing 1.6s cubic-bezier(0,0,.2,1) infinite}
        @keyframes snSpin{to{transform:rotate(360deg)}} .sn-spin{animation:snSpin .8s linear infinite}
        @keyframes snUp{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
        input,textarea,select{font-family:inherit}

        /* ═══ TOP NAV BAR — clean white ═══ */
        .sn-topbar {
          position: fixed; top: 0; left: 0; right: 0; height: 58px;
          background: linear-gradient(135deg, #0F766E 0%, #0D9488 60%, #14B8A6 100%);
          border-bottom: none;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; z-index: 100;
          box-shadow: 0 2px 12px rgba(13,148,136,.25);
        }
        .sn-topbar-logo {
          display: flex; align-items: center; gap: 10px;
          font-weight: 900; font-size: 20px; color: #ffffff; letter-spacing: -.5px;
          text-decoration: none; flex-shrink: 0;
        }
        .sn-topbar-tabs {
          display: none; align-items: center; gap: 2px;
        }
        .sn-topbar-tab {
          border: none; background: none; cursor: pointer;
          padding: 0 16px; height: 58px; border-radius: 0;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,.75); font-size: 13px; font-weight: 600;
          font-family: inherit; transition: all .12s;
          position: relative; white-space: nowrap;
        }
        .sn-topbar-tab:hover { color: #fff; background: rgba(255,255,255,.18); border-radius: 8px; }
        .sn-topbar-tab.active { color: #0F766E; font-weight: 800; background: rgba(255,255,255,.92); border-radius: 8px; }
        .sn-topbar-tab.active::after {
          content: ''; position: absolute; bottom: 0; left: 12px; right: 12px;
          height: 0;
        }
        .sn-topbar-actions { display: flex; align-items: center; gap: 8px; }
        .sn-topbar-btn {
          width: 38px; height: 38px; border-radius: 10px; border: none;
          background: rgba(255,255,255,.92); color: #0F766E;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: all .12s;
          box-shadow: 0 1px 3px rgba(0,0,0,.12);
        }
        .sn-topbar-btn:hover { background: #fff; color: #0D9488; box-shadow: 0 2px 8px rgba(0,0,0,.15); }

        /* ═══ MOBILE-FIRST LAYOUT ═══ */

        /* Page sits below the fixed topbar */
        .sn-page {
          padding-top: 58px;
          min-height: 100vh;
          width: 100%;
        }
        .sn-page-inner { width: 100%; }

        /* Sidebars hidden on mobile */
        .sn-sidebar { display: none; }
        .sn-right-panel { display: none; }

        /* Main column fills full width on mobile */
        .sn-main {
          display: flex; flex-direction: column;
          width: 100%; min-width: 0;
        }

        /* Compose wrapper — sticky at top of main */
        .sn-compose-wrap {
          position: sticky;
          top: 58px;
          z-index: 10;
          padding: 10px 12px 6px;
          background: #EFF6FF;
        }

        /* Feed scrolls naturally in page flow on mobile */
        .sn-feed-area {
          padding: 8px 12px calc(80px + env(safe-area-inset-bottom)) 12px;
          min-height: 0;
        }

        .sn-mobile-header { display: none; }
        .sn-fab { display: grid; }

        /* Bottom nav — full width on mobile */
        .sn-bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: #fff;
          border-top: 1px solid #BFDBFE;
          display: flex;
          padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
          z-index: 50;
        }

        /* ═══ DESKTOP ≥768px ═══ */
        @media (min-width: 768px) {
          .sn-topbar-tabs { display: flex; }

          /* page is a fixed viewport below the topbar */
          .sn-page {
            position: fixed;
            top: 58px; left: 0; right: 0; bottom: 0;
            padding-top: 0;
            overflow: hidden;
            display: flex;
            justify-content: center;
          }

          /* inner row: full height, max width cap */
          .sn-page-inner {
            display: flex;
            width: 100%;
            max-width: 1280px;
            height: 100%;
          }

          /* left sidebar: fixed, scrolls internally */
          .sn-sidebar {
            display: flex; flex-direction: column;
            width: 240px; flex-shrink: 0;
            height: 100%;
            overflow-y: auto; padding: 16px 10px;
            background: #DBEAFE;
            border-left: 1px solid #BFDBFE;
          }
          .sn-sidebar::-webkit-scrollbar { display: none; }

          /* center column: compose pinned, feed scrolls */
          .sn-main {
            flex: 1;
            max-width: 820px;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .sn-compose-wrap {
            position: static;
            flex-shrink: 0;
            padding: 12px 0 0;
            background: #EFF6FF;
            z-index: auto;
          }
          .sn-feed-area {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 12px 0 32px;
          }
          .sn-feed-area::-webkit-scrollbar { display: none; }

          /* right panel: fixed, scrolls internally */
          .sn-right-panel {
            display: flex; flex-direction: column;
            width: 220px; flex-shrink: 0;
            height: 100%;
            overflow-y: auto; padding: 16px 10px;
            background: #EFF6FF;
            border-right: 1px solid #BFDBFE;
          }
          .sn-right-panel::-webkit-scrollbar { display: none; }

          /* hide mobile-only elements */
          .sn-fab { display: none !important; }
          .sn-bottom-nav { display: none !important; }
        }

        /* ═══ WIDE DESKTOP ≥1280px ═══ */
        @media (min-width: 1280px) {
          .sn-sidebar { width: 260px; }
          .sn-right-panel { width: 240px; }
        }

        /* ═══ SIDEBAR NAV BUTTONS ═══ */
        .sn-nav-btn {
          width: 100%; display: flex; align-items: center; gap: 10px;
          border: none; background: none; border-radius: 10px;
          padding: 9px 10px; cursor: pointer; font-family: inherit;
          font-size: 14px; font-weight: 500; color: #1E3A5F;
          transition: all .12s; margin-bottom: 2px; text-align: start;
        }
        .sn-nav-btn:hover {
          background: #EFF6FF;
          color: #0F172A;
        }
        .sn-nav-btn.active {
          background: #EFF6FF;
          color: #1D4ED8; font-weight: 700;
        }
        .sn-nav-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: #EFF6FF;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background .12s; color: #64748B;
        }
        .sn-nav-btn.active .sn-nav-icon {
          background: #BFDBFE; color: #1D4ED8;
        }
        .sn-nav-divider {
          height: 1px; background: #BFDBFE;
          margin: 10px 4px;
        }

        /* ═══ POST CARD ═══ */
        .sn-card {
          background: #fff; border-radius: 14px;
          border: 1px solid #BFDBFE;
          margin-bottom: 14px;
          box-shadow: 0 1px 4px rgba(13,148,136,.07);
          overflow: hidden;
          transition: box-shadow .15s, transform .12s;
        }
        .sn-card:hover {
          box-shadow: 0 4px 16px rgba(13,148,136,.12);
          transform: translateY(-1px);
        }

        /* ═══ COMPOSE BOX ═══ */
        .sn-compose-wrap {
          padding: 14px 14px 0;
        }
        .sn-compose {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #BFDBFE;
          padding: 14px 16px 12px;
          box-shadow: 0 1px 4px rgba(15,23,42,.05);
          position: relative; overflow: hidden;
        }
        /* thin brand accent top */
        .sn-compose::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #3B82F6, #06B6D4, #0D9488, #34D399, #6366F1);
          border-radius: 14px 14px 0 0;
        }
        .sn-compose-btn {
          flex: 1; border: 1px solid #BFDBFE;
          background: #EFF6FF;
          border-radius: 999px; padding: 9px 18px;
          text-align: start; color: #94A3B8; font-size: 14.5px;
          cursor: pointer; font-family: inherit; transition: all .12s;
        }
        .sn-compose-btn:hover {
          background: #DBEAFE; border-color: #93C5FD; color: #1D4ED8;
        }
        /* quick action buttons */
        .sn-quick-btn {
          flex: 1; border: 1px solid #BFDBFE; border-radius: 10px;
          padding: 8px 6px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 13px; font-weight: 600; background: #fff;
          cursor: pointer; font-family: inherit;
          transition: all .12s; white-space: nowrap; color: #1E40AF;
        }
        .sn-quick-btn:hover { background: #DBEAFE; border-color: #93C5FD; color: #1D4ED8; }
        .sn-quick-green  { color: #16A34A; }
        .sn-quick-green:hover  { background: #F0FDF4; border-color: #BBF7D0; color: #15803D; }
        .sn-quick-amber  { color: #D97706; }
        .sn-quick-amber:hover  { background: #FFFBEB; border-color: #FDE68A; color: #B45309; }
        .sn-quick-red    { color: #DC2626; }
        .sn-quick-red:hover    { background: #FEF2F2; border-color: #FECACA; color: #B91C1C; }

        /* ═══ REACTION BUTTONS ═══ */
        .sn-react-btn {
          flex: 1; border: none; background: none;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 9px 8px; border-radius: 8px; cursor: pointer;
          font-size: 13.5px; font-weight: 600; color: #64748B;
          font-family: inherit; transition: all .12s;
        }
        .sn-react-btn:hover { background: #EFF6FF; color: #1E3A5F; }
        .sn-react-btn.active { color: #1D4ED8; background: #DBEAFE; }
      `}</style>
      {children}
    </div>
  );
}

function ToastView({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", bottom: 84, insetInlineStart: 0, insetInlineEnd: 0, display: "flex", justifyContent: "center", zIndex: 200, pointerEvents: "none" }}>
      <div style={{ background: T.ink, color: "#fff", borderRadius: 999, padding: "11px 20px", fontSize: 13.5, fontWeight: 700, boxShadow: "0 12px 30px rgba(0,0,0,.25)", animation: "snUp .25s ease", maxWidth: "88%", textAlign: "center" }}>{toast}</div>
    </div>
  );
}
