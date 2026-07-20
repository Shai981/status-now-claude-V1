import React, { useMemo, useState } from "react";
import "./styles.css";
import {
  Bell, Bookmark, CalendarDays, Camera, Check, ChevronDown, Compass, Globe2,
  Heart, Home, Image, MapPin, Menu, MessageCircle, MoreHorizontal, Plus,
  Search, Send, Share2, ShieldCheck, Sparkles, TrendingUp, UserPlus, Users,
  Video, X, Zap
} from "lucide-react";

const stories = [
  { id: 1, title: "תל אביב", subtitle: "34 עדכונים", initials: "תא", tone: "blue" },
  { id: 2, title: "ירושלים", subtitle: "21 עדכונים", initials: "ים", tone: "purple" },
  { id: 3, title: "חיפה", subtitle: "16 עדכונים", initials: "חי", tone: "orange" },
  { id: 4, title: "חדשות בדרך", subtitle: "8 עדכונים", initials: "חד", tone: "green" },
];

const initialPosts = [
  {
    id: 1,
    author: "דן כהן",
    initials: "דכ",
    verified: true,
    time: "לפני 8 דקות",
    place: "נתיבי איילון, תל אביב",
    visibility: "ציבורי",
    title: "עומס כבד באיילון דרום",
    body: "התנועה זוחלת ממחלף השלום עד לה גווארדיה. מומלץ לבחור בדרך נמיר או להמתין כ-20 דקות לפני היציאה.",
    category: "תנועה",
    color: "amber",
    image: "traffic",
    likes: 128,
    comments: 23,
    shares: 11,
  },
  {
    id: 2,
    author: "מאיה בר",
    initials: "מב",
    verified: true,
    time: "לפני 22 דקות",
    place: "שוק מחנה יהודה, ירושלים",
    visibility: "חברי הקהילה",
    title: "תור ארוך בכניסה הראשית",
    body: "כ-20 דקות המתנה בכניסה הראשית. הכניסה מרחוב אגריפס כרגע מהירה משמעותית.",
    category: "עומסים",
    color: "rose",
    likes: 76,
    comments: 14,
    shares: 4,
  },
  {
    id: 3,
    author: "אבי פרץ",
    initials: "אפ",
    verified: false,
    time: "לפני 31 דקות",
    place: "מרכז הכרמל, חיפה",
    visibility: "ציבורי",
    title: "גשם חזק התחיל בחיפה",
    body: "גשם מקומי חזק באזור הכרמל והדר. הכבישים חלקים והראות מוגבלת — סעו בזהירות.",
    category: "מזג אוויר",
    color: "blue",
    image: "rain",
    likes: 93,
    comments: 18,
    shares: 7,
  },
];

const groups = [
  { name: "תושבי תל אביב", members: "42K חברים", icon: "תא" },
  { name: "עדכוני תנועה בגוש דן", members: "18K חברים", icon: "גד" },
  { name: "הורים עוזרים להורים", members: "9.4K חברים", icon: "הע" },
];

const contacts = ["ליאור מזרחי", "נועה שמעוני", "יובל לוי", "שירה כהן", "איתי ברק"];

function App() {
  const [posts, setPosts] = useState(initialPosts);
  const [liked, setLiked] = useState([]);
  const [saved, setSaved] = useState([]);
  const [query, setQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const filteredPosts = useMemo(() => {
    const q = query.trim();
    if (!q) return posts;
    return posts.filter((post) => `${post.author} ${post.place} ${post.title} ${post.body} ${post.category}`.includes(q));
  }, [posts, query]);

  function toggle(setter, list, id) {
    setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  function addPost(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = form.get("body")?.trim();
    if (!body) return;
    setPosts((current) => [{
      id: Date.now(), author: "נועה לוי", initials: "נל", verified: true,
      time: "עכשיו", place: form.get("place") || "תל אביב", visibility: "ציבורי",
      title: form.get("title") || "עדכון חדש מהקהילה", body,
      category: form.get("category") || "קהילה", color: "green",
      likes: 0, comments: 0, shares: 0,
    }, ...current]);
    setComposerOpen(false);
  }

  return (
    <div className="social-app" dir="rtl">
      <header className="topbar">
        <div className="topbar__brand">
          <button className="icon-btn mobile-menu-btn" onClick={() => setMobileMenu(true)} aria-label="פתיחת תפריט"><Menu size={22}/></button>
          <div className="logo"><Zap size={21} fill="currentColor"/></div>
          <strong>Status Now</strong>
        </div>
        <label className="global-search"><Search size={19}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש ב-Status Now"/></label>
        <nav className="top-nav">
          <button className="active" aria-label="בית"><Home size={22}/></button>
          <button aria-label="קהילות"><Users size={22}/></button>
          <button aria-label="גילוי"><Compass size={22}/></button>
          <button aria-label="אירועים"><CalendarDays size={22}/></button>
        </nav>
        <div className="top-actions">
          <button className="round-btn"><Plus size={20}/></button>
          <button className="round-btn"><Bell size={20}/><span className="notification-dot">3</span></button>
          <button className="profile-pill"><span className="avatar">נל</span><b>נועה</b><ChevronDown size={16}/></button>
        </div>
      </header>

      <aside className={`left-sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="mobile-drawer-head"><strong>תפריט</strong><button className="icon-btn" onClick={() => setMobileMenu(false)}><X size={21}/></button></div>
        <div className="sidebar-profile"><span className="avatar avatar-lg">נל</span><div><b>נועה לוי</b><small>צפייה בפרופיל שלך</small></div></div>
        <nav className="side-menu">
          <button className="active"><Home size={21}/>הפיד שלי</button>
          <button><Users size={21}/>חברים וקהילות</button>
          <button><MapPin size={21}/>מה קורה לידך</button>
          <button><TrendingUp size={21}/>פופולרי עכשיו</button>
          <button><Bookmark size={21}/>פריטים שמורים</button>
        </nav>
        <div className="sidebar-divider"/>
        <p className="sidebar-label">הקהילות שלך</p>
        {groups.slice(0, 3).map((group) => <button className="group-row" key={group.name}><span>{group.icon}</span><div><b>{group.name}</b><small>{group.members}</small></div></button>)}
      </aside>

      <main className="feed-column">
        <section className="stories-card">
          <button className="story create-story" onClick={() => setComposerOpen(true)}><div className="story-avatar"><Plus size={23}/></div><b>יצירת עדכון</b><small>שתפו מה קורה</small></button>
          {stories.map((story) => <button className="story" key={story.id}><div className={`story-ring ${story.tone}`}><span>{story.initials}</span></div><b>{story.title}</b><small>{story.subtitle}</small></button>)}
        </section>

        <section className="composer-card">
          <div className="composer-line"><span className="avatar">נל</span><button onClick={() => setComposerOpen(true)}>נועה, מה קורה עכשיו?</button></div>
          <div className="composer-actions">
            <button><Video size={20}/>שידור חי</button>
            <button><Image size={20}/>תמונה</button>
            <button onClick={() => setComposerOpen(true)}><MapPin size={20}/>עדכון מיקום</button>
          </div>
        </section>

        <div className="feed-heading"><div><h1>עדכונים בשבילך</h1><p>חדשות מקומיות, חברים וקהילות שאתה עוקב אחריהם</p></div><button><Sparkles size={17}/>המומלצים</button></div>

        {filteredPosts.map((post) => {
          const isLiked = liked.includes(post.id);
          const isSaved = saved.includes(post.id);
          return <article className="post-card" key={post.id}>
            <header className="post-head">
              <span className={`avatar post-avatar ${post.color}`}>{post.initials}</span>
              <div className="post-meta"><div><b>{post.author}</b>{post.verified && <ShieldCheck size={15}/>}</div><small>{post.time} · {post.place} · <Globe2 size={12}/></small></div>
              <button className="ghost-btn"><MoreHorizontal size={22}/></button>
            </header>
            <div className="post-copy"><span className={`topic-chip ${post.color}`}>{post.category}</span><h2>{post.title}</h2><p>{post.body}</p></div>
            {post.image && <div className={`post-visual ${post.image}`}><div className="visual-overlay"><MapPin size={18}/><div><b>{post.place}</b><small>עדכון חי מהשטח</small></div></div></div>}
            <div className="post-stats"><div><span className="reaction-stack"><i>❤</i><i>👍</i></span><span>{post.likes + (isLiked ? 1 : 0)}</span></div><div><span>{post.comments} תגובות</span><span> · </span><span>{post.shares} שיתופים</span></div></div>
            <div className="post-actions">
              <button className={isLiked ? "active" : ""} onClick={() => toggle(setLiked, liked, post.id)}><Heart size={20} fill={isLiked ? "currentColor" : "none"}/>אהבתי</button>
              <button><MessageCircle size={20}/>תגובה</button>
              <button><Share2 size={20}/>שיתוף</button>
              <button className={isSaved ? "active" : ""} onClick={() => toggle(setSaved, saved, post.id)}><Bookmark size={20} fill={isSaved ? "currentColor" : "none"}/></button>
            </div>
            <div className="quick-comment"><span className="avatar avatar-sm">נל</span><div><input placeholder="כתיבת תגובה..."/><button><Send size={17}/></button></div></div>
          </article>;
        })}
      </main>

      <aside className="right-sidebar">
        <section className="rail-card pulse-card"><div className="rail-title"><div><span className="pulse-dot"/><h3>עכשיו באזור שלך</h3></div><button>הכול</button></div><strong>47 עדכונים חיים</strong><p>12 אנשים שאתה עוקב אחריהם פעילים כרגע.</p><div className="mini-avatars"><span>דכ</span><span>מב</span><span>אפ</span><span>+9</span></div></section>
        <section className="rail-card"><div className="rail-title"><h3>קהילות שאולי יעניינו אותך</h3><button>הצג הכול</button></div>{groups.map((group) => <div className="suggested-group" key={group.name}><span>{group.icon}</span><div><b>{group.name}</b><small>{group.members}</small></div><button><UserPlus size={17}/>הצטרפות</button></div>)}</section>
        <section className="contacts-section"><div className="rail-title"><h3>אנשי קשר</h3><div><button><Search size={17}/></button><button><MoreHorizontal size={19}/></button></div></div>{contacts.map((name, index) => <button className="contact-row" key={name}><span className={`avatar avatar-sm c${index}`}>{name.split(" ").map((n) => n[0]).join("")}</span><b>{name}</b><i/></button>)}</section>
      </aside>

      <nav className="mobile-bottom-nav"><button className="active"><Home size={21}/><span>בית</span></button><button><Users size={21}/><span>קהילות</span></button><button className="mobile-create" onClick={() => setComposerOpen(true)}><Plus size={25}/></button><button><Bell size={21}/><span>התראות</span></button><button><span className="avatar avatar-sm">נל</span><span>פרופיל</span></button></nav>

      {composerOpen && <div className="modal-backdrop" onMouseDown={() => setComposerOpen(false)}><div className="composer-modal" onMouseDown={(e) => e.stopPropagation()}><header><h2>יצירת עדכון</h2><button className="round-btn" onClick={() => setComposerOpen(false)}><X size={20}/></button></header><form onSubmit={addPost}><div className="modal-user"><span className="avatar">נל</span><div><b>נועה לוי</b><select name="visibility"><option>ציבורי</option><option>חברים</option><option>חברי הקהילה</option></select></div></div><input className="title-input" name="title" placeholder="כותרת לעדכון"/><textarea name="body" rows="6" placeholder="מה קורה עכשיו?" autoFocus required/><div className="modal-fields"><label><MapPin size={17}/><input name="place" placeholder="הוספת מיקום"/></label><label><Sparkles size={17}/><select name="category"><option>קהילה</option><option>תנועה</option><option>מזג אוויר</option><option>ביטחון</option><option>עומסים</option></select></label></div><div className="modal-media"><span>הוספה לעדכון</span><div><button type="button"><Image size={20}/></button><button type="button"><Camera size={20}/></button><button type="button"><MapPin size={20}/></button></div></div><button className="publish-btn" type="submit">פרסום</button></form></div></div>}
    </div>
  );
}

export default App;
