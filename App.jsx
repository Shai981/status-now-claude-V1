import React, { useMemo, useState } from "react";
import "./styles.css";
import { Bell, Car, Check, ChevronLeft, CloudRain, Construction, Heart, Home, Map, MapPin, Menu, MessageCircle, Plus, Search, Shield, Sparkles, Users, X } from "lucide-react";

const categories = [
  { id: "all", label: "הכול", icon: Sparkles },
  { id: "traffic", label: "תנועה", icon: Car },
  { id: "security", label: "ביטחון", icon: Shield },
  { id: "weather", label: "מזג אוויר", icon: CloudRain },
  { id: "crowd", label: "עומסים", icon: Users },
  { id: "road", label: "כבישים", icon: Construction },
];

const initialUpdates = [
  { id: 1, category: "traffic", title: "עומס כבד באיילון דרום", body: "התנועה זוחלת ממחלף השלום עד לה גווארדיה. מומלץ לנסוע דרך דרך נמיר.", place: "נתיבי איילון, תל אביב", time: "לפני 8 דקות", distance: "1.2 ק״מ", author: "דן כהן", initials: "דכ", likes: 34, comments: 8, verified: true, urgent: true },
  { id: 2, category: "crowd", title: "תור ארוך בשוק מחנה יהודה", body: "כ-20 דקות המתנה בכניסה הראשית. הכניסה מרחוב אגריפס מהירה יותר.", place: "מחנה יהודה, ירושלים", time: "לפני 22 דקות", distance: "52 ק״מ", author: "מאיה בר", initials: "מב", likes: 18, comments: 4, verified: true },
  { id: 3, category: "weather", title: "גשם חזק התחיל בחיפה", body: "גשם מקומי חזק באזור הכרמל והדר. הכבישים חלקים והראות מוגבלת.", place: "מרכז הכרמל, חיפה", time: "לפני 31 דקות", distance: "88 ק״מ", author: "אבי פרץ", initials: "אפ", likes: 27, comments: 6 },
  { id: 4, category: "road", title: "נתיב חסום בעקבות עבודות", body: "הנתיב הימני סגור זמנית. עומס קל נוצר לפני הצומת.", place: "כביש 4, מחלף גהה", time: "לפני 44 דקות", distance: "9.8 ק״מ", author: "נועה לוי", initials: "נל", likes: 11, comments: 2, verified: true },
];

const categoryName = Object.fromEntries(categories.map(c => [c.id, c.label]));

function App() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [liked, setLiked] = useState([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [updates, setUpdates] = useState(initialUpdates);

  const visible = useMemo(() => updates.filter(item => {
    const matchesCategory = active === "all" || item.category === active;
    const text = `${item.title} ${item.body} ${item.place}`;
    return matchesCategory && text.includes(query.trim());
  }), [active, query, updates]);

  function toggleLike(id) {
    setLiked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function addUpdate(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const title = data.get("title")?.trim();
    if (!title) return;
    setUpdates(prev => [{
      id: Date.now(), category: data.get("category"), title, body: data.get("body") || "עדכון חדש מהשטח.", place: data.get("place") || "המיקום שלי", time: "עכשיו", distance: "קרוב אליך", author: "נועה לוי", initials: "נל", likes: 0, comments: 0, verified: true
    }, ...prev]);
    setComposerOpen(false);
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-wrap">
        <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="פתח תפריט"><Menu size={20}/></button>
        <div className="brand-mark"><span></span></div>
        <div><strong>Status Now</strong><small>מה קורה עכשיו לידך</small></div>
      </div>
      <div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="חיפוש לפי מקום או אירוע"/></div>
      <div className="header-actions"><button className="icon-button"><Bell size={19}/><i></i></button><button className="avatar">נל</button></div>
    </header>

    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="sidebar-head mobile-only"><strong>תפריט</strong><button className="icon-button" onClick={() => setMenuOpen(false)}><X size={20}/></button></div>
      <nav>
        <button className="active"><Home size={19}/>העדכונים שלי</button>
        <button><Map size={19}/>מפה חיה</button>
        <button><Bell size={19}/>התראות</button>
      </nav>
      <div className="area-card"><span className="live-dot"></span><div><b>האזור שלך פעיל</b><small>128 דיווחים בשעה האחרונה</small></div></div>
      <div className="profile-card"><div className="avatar large">נל</div><div><b>נועה לוי</b><small>תל אביב · 128 נק׳ אמינות</small></div><ChevronLeft size={18}/></div>
    </aside>

    <main>
      <section className="hero">
        <div><span className="eyebrow"><span className="live-dot"></span>עדכונים בזמן אמת</span><h1>לדעת מה קורה,<br/><em>לפני שמגיעים.</em></h1><p>דיווחים מקומיים מהקהילה על תנועה, עומסים, מזג אוויר וביטחון — בדיוק איפה שזה חשוב לך.</p></div>
        <div className="hero-stat"><strong>47</strong><span>עדכונים חיים<br/>בסביבה שלך</span></div>
      </section>

      <section className="toolbar">
        <div className="category-strip">{categories.map(({id,label,icon:Icon}) => <button key={id} className={active===id?"active":""} onClick={() => setActive(id)}><Icon size={17}/>{label}</button>)}</div>
        <button className="primary" onClick={() => setComposerOpen(true)}><Plus size={19}/>דיווח חדש</button>
      </section>

      <section className="content-grid">
        <div className="feed">
          <div className="section-title"><div><h2>מה קורה עכשיו</h2><p>{visible.length} עדכונים רלוונטיים</p></div><button className="text-button">הכי קרוב אליי <ChevronLeft size={16}/></button></div>
          {visible.map(item => <article className={`status-card ${item.urgent ? "urgent" : ""}`} key={item.id}>
            <div className="card-top"><span className={`category-tag ${item.category}`}>{categoryName[item.category]}</span><span>{item.time}</span></div>
            <h3>{item.title}</h3><p>{item.body}</p>
            <div className="location-row"><MapPin size={16}/><b>{item.place}</b><span>·</span><span>{item.distance}</span></div>
            <div className="card-footer"><div className="author"><span className="avatar small">{item.initials}</span><div><b>{item.author}</b>{item.verified && <small><Check size={12}/>דיווח מאומת</small>}</div></div><div className="engagement"><button className={liked.includes(item.id)?"liked":""} onClick={() => toggleLike(item.id)}><Heart size={18} fill={liked.includes(item.id)?"currentColor":"none"}/>{item.likes + (liked.includes(item.id)?1:0)}</button><button><MessageCircle size={18}/>{item.comments}</button></div></div>
          </article>)}
        </div>

        <aside className="right-rail">
          <div className="map-card"><div className="map-head"><div><h3>מפה חיה</h3><p>עדכונים קרובים אליך</p></div><button className="icon-button"><Map size={18}/></button></div><div className="mini-map"><span className="road r1"></span><span className="road r2"></span><span className="road r3"></span><span className="pin p1 traffic"><Car size={15}/></span><span className="pin p2 weather"><CloudRain size={15}/></span><span className="pin p3 crowd"><Users size={15}/></span><span className="you-dot"></span></div><button className="map-link">פתיחת המפה המלאה <ChevronLeft size={16}/></button></div>
          <div className="trust-card"><Shield size={22}/><div><h3>מידע שאפשר לסמוך עליו</h3><p>דיווחים מאומתים על ידי הקהילה ומסומנים לפי רמת אמינות.</p></div></div>
        </aside>
      </section>
    </main>

    <nav className="bottom-nav mobile-only"><button className="active"><Home size={20}/><span>ראשי</span></button><button><Map size={20}/><span>מפה</span></button><button className="fab" onClick={() => setComposerOpen(true)}><Plus size={24}/></button><button><Bell size={20}/><span>התראות</span></button><button><Users size={20}/><span>פרופיל</span></button></nav>

    {composerOpen && <div className="modal-backdrop" onMouseDown={() => setComposerOpen(false)}><div className="modal" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">דיווח קהילתי</span><h2>מה קורה עכשיו?</h2></div><button className="icon-button" onClick={() => setComposerOpen(false)}><X size={20}/></button></div><form onSubmit={addUpdate}><label>כותרת<input name="title" placeholder="לדוגמה: עומס חריג בצומת" autoFocus required/></label><label>פרטים<textarea name="body" placeholder="מה כדאי לאנשים לדעת?" rows="4"/></label><div className="form-row"><label>קטגוריה<select name="category">{categories.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label>מיקום<input name="place" placeholder="רחוב, צומת או אזור"/></label></div><button className="primary submit" type="submit">פרסום עדכון</button></form></div></div>}
  </div>;
}

export default App;
