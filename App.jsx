import React, { useEffect, useMemo, useState } from "react";
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
  { id: 1, author: "דן כהן", initials: "דכ", verified: true, time: "לפני 8 דקות", place: "נתיבי איילון, תל אביב", visibility: "ציבורי", title: "עומס כבד באיילון דרום", body: "התנועה זוחלת ממחלף השלום עד לה גווארדיה. מומלץ לבחור בדרך נמיר או להמתין כ-20 דקות לפני היציאה.", category: "תנועה", color: "amber", image: "traffic", likes: 128, comments: [{id: 11, author: "נועה", text: "תודה על העדכון!"}], shares: 11 },
  { id: 2, author: "מאיה בר", initials: "מב", verified: true, time: "לפני 22 דקות", place: "שוק מחנה יהודה, ירושלים", visibility: "חברי הקהילה", title: "תור ארוך בכניסה הראשית", body: "כ-20 דקות המתנה בכניסה הראשית. הכניסה מרחוב אגריפס כרגע מהירה משמעותית.", category: "עומסים", color: "rose", likes: 76, comments: [], shares: 4 },
  { id: 3, author: "אבי פרץ", initials: "אפ", verified: false, time: "לפני 31 דקות", place: "מרכז הכרמל, חיפה", visibility: "ציבורי", title: "גשם חזק התחיל בחיפה", body: "גשם מקומי חזק באזור הכרמל והדר. הכבישים חלקים והראות מוגבלת — סעו בזהירות.", category: "מזג אוויר", color: "blue", image: "rain", likes: 93, comments: [], shares: 7 },
];

const groups = [
  { id: 1, name: "תושבי תל אביב", members: "42K חברים", icon: "תא" },
  { id: 2, name: "עדכוני תנועה בגוש דן", members: "18K חברים", icon: "גד" },
  { id: 3, name: "הורים עוזרים להורים", members: "9.4K חברים", icon: "הע" },
];

const contacts = ["ליאור מזרחי", "נועה שמעוני", "יובל לוי", "שירה כהן", "איתי ברק"];

function App() {
  const [posts, setPosts] = useState(() => JSON.parse(localStorage.getItem("status-posts") || "null") || initialPosts);
  const [liked, setLiked] = useState(() => JSON.parse(localStorage.getItem("status-liked") || "[]"));
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem("status-saved") || "[]"));
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState("feed");
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [toast, setToast] = useState("");

  useEffect(() => localStorage.setItem("status-posts", JSON.stringify(posts)), [posts]);
  useEffect(() => localStorage.setItem("status-liked", JSON.stringify(liked)), [liked]);
  useEffect(() => localStorage.setItem("status-saved", JSON.stringify(saved)), [saved]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2200); return () => clearTimeout(timer); }, [toast]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeView === "saved") result = result.filter((post) => saved.includes(post.id));
    if (activeView === "nearby") result = result.filter((post) => post.place.includes("תל אביב"));
    if (activeView === "trending") result = [...result].sort((a, b) => (b.likes + b.shares) - (a.likes + a.shares));
    const q = query.trim();
    if (q) result = result.filter((post) => `${post.author} ${post.place} ${post.title} ${post.body} ${post.category}`.includes(q));
    return result;
  }, [posts, query, activeView, saved]);

  function toggle(setter, list, id) { setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]); }
  function chooseView(view) { setActiveView(view); setMobileMenu(false); setNotificationsOpen(false); setProfileOpen(false); }

  function addPost(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = form.get("body")?.trim();
    if (!body) return;
    setPosts((current) => [{ id: Date.now(), author: "נועה לוי", initials: "נל", verified: true, time: "עכשיו", place: form.get("place") || "תל אביב", visibility: form.get("visibility") || "ציבורי", title: form.get("title") || "עדכון חדש מהקהילה", body, category: form.get("category") || "קהילה", color: "green", likes: 0, comments: [], shares: 0 }, ...current]);
    setComposerOpen(false); setActiveView("feed"); setToast("העדכון פורסם בהצלחה");
  }

  function addComment(postId) {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, comments: [...post.comments, { id: Date.now(), author: "נועה", text }] } : post));
    setCommentDrafts((drafts) => ({ ...drafts, [postId]: "" }));
    setExpandedComments((items) => items.includes(postId) ? items : [...items, postId]);
    setToast("התגובה נוספה");
  }

  async function sharePost(post) {
    const shareData = { title: post.title, text: post.body, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(`${post.title}\n${post.body}\n${window.location.href}`); setToast("הקישור הועתק"); }
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, shares: item.shares + 1 } : item));
    } catch (error) { if (error?.name !== "AbortError") setToast("לא ניתן לשתף כרגע"); }
  }

  function joinGroup(id) { setJoinedGroups((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); setToast(joinedGroups.includes(id) ? "עזבת את הקהילה" : "הצטרפת לקהילה"); }

  const viewTitle = { feed: "עדכונים בשבילך", communities: "קהילות וחברים", nearby: "מה קורה לידך", trending: "פופולרי עכשיו", saved: "פריטים שמורים", events: "אירועים קרובים" }[activeView];

  return (
    <div className="social-app" dir="rtl">
      <header className="topbar">
        <div className="topbar__brand"><button className="icon-btn mobile-menu-btn" onClick={() => setMobileMenu(true)} aria-label="פתיחת תפריט"><Menu size={22}/></button><button className="brand-button" onClick={() => chooseView("feed")}><div className="logo"><Zap size={21} fill="currentColor"/></div><strong>Status Now</strong></button></div>
        <label className="global-search"><Search size={19}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש ב-Status Now"/></label>
        <nav className="top-nav">
          <button className={activeView === "feed" ? "active" : ""} onClick={() => chooseView("feed")} aria-label="בית"><Home size={22}/></button>
          <button className={activeView === "communities" ? "active" : ""} onClick={() => chooseView("communities")} aria-label="קהילות"><Users size={22}/></button>
          <button className={activeView === "nearby" ? "active" : ""} onClick={() => chooseView("nearby")} aria-label="גילוי"><Compass size={22}/></button>
          <button className={activeView === "events" ? "active" : ""} onClick={() => chooseView("events")} aria-label="אירועים"><CalendarDays size={22}/></button>
        </nav>
        <div className="top-actions">
          <button className="round-btn" onClick={() => setComposerOpen(true)} aria-label="יצירת עדכון"><Plus size={20}/></button>
          <div className="popover-wrap"><button className="round-btn" onClick={() => setNotificationsOpen((open) => !open)} aria-label="התראות"><Bell size={20}/><span className="notification-dot">3</span></button>{notificationsOpen && <div className="popover notification-popover"><h3>התראות</h3><button>מאיה הגיבה לעדכון שלך<small>לפני 5 דקות</small></button><button>הצטרפת לקהילת תל אביב<small>לפני שעה</small></button><button>יש 12 עדכונים חדשים באזור שלך<small>עכשיו</small></button></div>}</div>
          <div className="popover-wrap"><button className="profile-pill" onClick={() => setProfileOpen((open) => !open)}><span className="avatar">נל</span><b>נועה</b><ChevronDown size={16}/></button>{profileOpen && <div className="popover profile-popover"><button onClick={() => setToast("הפרופיל ייפתח בגרסה הבאה")}>הפרופיל שלי</button><button onClick={() => chooseView("saved")}>פריטים שמורים</button><button onClick={() => setToast("ההגדרות נשמרו")}>הגדרות</button></div>}</div>
        </div>
      </header>

      <aside className={`left-sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="mobile-drawer-head"><strong>תפריט</strong><button className="icon-btn" onClick={() => setMobileMenu(false)}><X size={21}/></button></div>
        <button className="sidebar-profile" onClick={() => setToast("הפרופיל ייפתח בגרסה הבאה")}><span className="avatar avatar-lg">נל</span><div><b>נועה לוי</b><small>צפייה בפרופיל שלך</small></div></button>
        <nav className="side-menu">
          <button className={activeView === "feed" ? "active" : ""} onClick={() => chooseView("feed")}><Home size={21}/>הפיד שלי</button>
          <button className={activeView === "communities" ? "active" : ""} onClick={() => chooseView("communities")}><Users size={21}/>חברים וקהילות</button>
          <button className={activeView === "nearby" ? "active" : ""} onClick={() => chooseView("nearby")}><MapPin size={21}/>מה קורה לידך</button>
          <button className={activeView === "trending" ? "active" : ""} onClick={() => chooseView("trending")}><TrendingUp size={21}/>פופולרי עכשיו</button>
          <button className={activeView === "saved" ? "active" : ""} onClick={() => chooseView("saved")}><Bookmark size={21}/>פריטים שמורים</button>
        </nav>
        <div className="sidebar-divider"/><p className="sidebar-label">הקהילות שלך</p>
        {groups.map((group) => <button className="group-row" key={group.id} onClick={() => { chooseView("communities"); setQuery(group.name); }}><span>{group.icon}</span><div><b>{group.name}</b><small>{group.members}</small></div></button>)}
      </aside>

      <main className="feed-column">
        <section className="stories-card"><button className="story create-story" onClick={() => setComposerOpen(true)}><div className="story-avatar"><Plus size={23}/></div><b>יצירת עדכון</b><small>שתפו מה קורה</small></button>{stories.map((story) => <button className="story" key={story.id} onClick={() => { setQuery(story.title); setToast(`מציג עדכונים מ${story.title}`); }}><div className={`story-ring ${story.tone}`}><span>{story.initials}</span></div><b>{story.title}</b><small>{story.subtitle}</small></button>)}</section>
        <section className="composer-card"><div className="composer-line"><span className="avatar">נל</span><button onClick={() => setComposerOpen(true)}>נועה, מה קורה עכשיו?</button></div><div className="composer-actions"><button onClick={() => setToast("שידור חי דורש חיבור למצלמה ולשרת וידאו")}><Video size={20}/>שידור חי</button><button onClick={() => setComposerOpen(true)}><Image size={20}/>תמונה</button><button onClick={() => setComposerOpen(true)}><MapPin size={20}/>עדכון מיקום</button></div></section>
        <div className="feed-heading"><div><h1>{viewTitle}</h1><p>{query ? `תוצאות עבור “${query}”` : "חדשות מקומיות, חברים וקהילות שאתה עוקב אחריהם"}</p></div><button onClick={() => chooseView("trending")}><Sparkles size={17}/>המומלצים</button></div>

        {activeView === "communities" && <section className="community-grid">{groups.map((group) => <article className="community-card" key={group.id}><span>{group.icon}</span><h3>{group.name}</h3><p>{group.members}</p><button onClick={() => joinGroup(group.id)}>{joinedGroups.includes(group.id) ? <><Check size={17}/>הצטרפת</> : <><UserPlus size={17}/>הצטרפות</>}</button></article>)}</section>}
        {activeView === "events" && <section className="empty-state"><CalendarDays size={42}/><h2>אירועים קרובים</h2><p>כאן יוצגו מפגשים, אירועי קהילה ועדכונים מתוזמנים.</p><button onClick={() => setToast("יצירת אירוע תתווסף בגרסה הבאה")}>יצירת אירוע</button></section>}

        {activeView !== "communities" && activeView !== "events" && filteredPosts.map((post) => {
          const isLiked = liked.includes(post.id), isSaved = saved.includes(post.id), commentsOpen = expandedComments.includes(post.id);
          return <article className="post-card" key={post.id}>
            <header className="post-head"><span className={`avatar post-avatar ${post.color}`}>{post.initials}</span><div className="post-meta"><div><b>{post.author}</b>{post.verified && <ShieldCheck size={15}/>}</div><small>{post.time} · {post.place} · <Globe2 size={12}/></small></div><button className="ghost-btn" onClick={() => setToast("תפריט הפוסט יתווסף בגרסה הבאה")}><MoreHorizontal size={22}/></button></header>
            <div className="post-copy"><span className={`topic-chip ${post.color}`}>{post.category}</span><h2>{post.title}</h2><p>{post.body}</p></div>
            {post.image && <div className={`post-visual ${post.image}`}><div className="visual-overlay"><MapPin size={18}/><div><b>{post.place}</b><small>עדכון חי מהשטח</small></div></div></div>}
            <div className="post-stats"><button onClick={() => toggle(setLiked, liked, post.id)}><span className="reaction-stack"><i>❤</i><i>👍</i></span><span>{post.likes + (isLiked ? 1 : 0)}</span></button><button onClick={() => toggle(setExpandedComments, expandedComments, post.id)}>{post.comments.length} תגובות · {post.shares} שיתופים</button></div>
            <div className="post-actions"><button className={isLiked ? "active" : ""} onClick={() => toggle(setLiked, liked, post.id)}><Heart size={20} fill={isLiked ? "currentColor" : "none"}/>אהבתי</button><button onClick={() => toggle(setExpandedComments, expandedComments, post.id)}><MessageCircle size={20}/>תגובה</button><button onClick={() => sharePost(post)}><Share2 size={20}/>שיתוף</button><button className={isSaved ? "active" : ""} onClick={() => { toggle(setSaved, saved, post.id); setToast(isSaved ? "הוסר מהשמורים" : "נשמר"); }}><Bookmark size={20} fill={isSaved ? "currentColor" : "none"}/></button></div>
            {commentsOpen && <div className="comments-list">{post.comments.length ? post.comments.map((comment) => <div className="comment" key={comment.id}><span className="avatar avatar-sm">{comment.author[0]}</span><div><b>{comment.author}</b><p>{comment.text}</p></div></div>) : <p className="no-comments">עדיין אין תגובות. אפשר להיות הראשונים.</p>}</div>}
            <div className="quick-comment"><span className="avatar avatar-sm">נל</span><div><input value={commentDrafts[post.id] || ""} onChange={(e) => setCommentDrafts((drafts) => ({...drafts, [post.id]: e.target.value}))} onKeyDown={(e) => { if (e.key === "Enter") addComment(post.id); }} placeholder="כתיבת תגובה..."/><button onClick={() => addComment(post.id)} aria-label="שליחת תגובה"><Send size={17}/></button></div></div>
          </article>;
        })}
        {activeView !== "communities" && activeView !== "events" && filteredPosts.length === 0 && <section className="empty-state"><Search size={42}/><h2>לא נמצאו עדכונים</h2><p>נסו חיפוש אחר או חזרו לפיד הראשי.</p><button onClick={() => { setQuery(""); chooseView("feed"); }}>חזרה לפיד</button></section>}
      </main>

      <aside className="right-sidebar"><section className="rail-card pulse-card"><div className="rail-title"><div><span className="pulse-dot"/><h3>עכשיו באזור שלך</h3></div><button onClick={() => chooseView("nearby")}>הכול</button></div><strong>47 עדכונים חיים</strong><p>12 אנשים שאתה עוקב אחריהם פעילים כרגע.</p><div className="mini-avatars"><span>דכ</span><span>מב</span><span>אפ</span><span>+9</span></div></section><section className="rail-card"><div className="rail-title"><h3>קהילות שאולי יעניינו אותך</h3><button onClick={() => chooseView("communities")}>הצג הכול</button></div>{groups.map((group) => <div className="suggested-group" key={group.id}><span>{group.icon}</span><div><b>{group.name}</b><small>{group.members}</small></div><button onClick={() => joinGroup(group.id)}>{joinedGroups.includes(group.id) ? <><Check size={17}/>הצטרפת</> : <><UserPlus size={17}/>הצטרפות</>}</button></div>)}</section><section className="contacts-section"><div className="rail-title"><h3>אנשי קשר</h3><div><button onClick={() => setToast("חיפוש אנשי קשר יתווסף בגרסה הבאה")}><Search size={17}/></button><button onClick={() => setToast("אפשרויות אנשי קשר יתווספו בגרסה הבאה")}><MoreHorizontal size={19}/></button></div></div>{contacts.map((name, index) => <button className="contact-row" key={name} onClick={() => setToast(`פתיחת שיחה עם ${name}`)}><span className={`avatar avatar-sm c${index}`}>{name.split(" ").map((n) => n[0]).join("")}</span><b>{name}</b><i/></button>)}</section></aside>

      <nav className="mobile-bottom-nav"><button className={activeView === "feed" ? "active" : ""} onClick={() => chooseView("feed")}><Home size={21}/><span>בית</span></button><button className={activeView === "communities" ? "active" : ""} onClick={() => chooseView("communities")}><Users size={21}/><span>קהילות</span></button><button className="mobile-create" onClick={() => setComposerOpen(true)}><Plus size={25}/></button><button onClick={() => setNotificationsOpen((open) => !open)}><Bell size={21}/><span>התראות</span></button><button onClick={() => setProfileOpen((open) => !open)}><span className="avatar avatar-sm">נל</span><span>פרופיל</span></button></nav>

      {composerOpen && <div className="modal-backdrop" onMouseDown={() => setComposerOpen(false)}><div className="composer-modal" onMouseDown={(e) => e.stopPropagation()}><header><h2>יצירת עדכון</h2><button className="round-btn" onClick={() => setComposerOpen(false)}><X size={20}/></button></header><form onSubmit={addPost}><div className="modal-user"><span className="avatar">נל</span><div><b>נועה לוי</b><select name="visibility"><option>ציבורי</option><option>חברים</option><option>חברי הקהילה</option></select></div></div><input className="title-input" name="title" placeholder="כותרת לעדכון"/><textarea name="body" rows="6" placeholder="מה קורה עכשיו?" autoFocus required/><div className="modal-fields"><label><MapPin size={17}/><input name="place" placeholder="הוספת מיקום"/></label><label><Sparkles size={17}/><select name="category"><option>קהילה</option><option>תנועה</option><option>מזג אוויר</option><option>ביטחון</option><option>עומסים</option></select></label></div><div className="modal-media"><span>הוספה לעדכון</span><div><button type="button" onClick={() => setToast("העלאת תמונות דורשת שירות אחסון קבצים")}><Image size={20}/></button><button type="button" onClick={() => setToast("גישה למצלמה תתווסף בגרסה הבאה")}><Camera size={20}/></button><button type="button" onClick={() => setToast("אפשר להזין מיקום בשדה למעלה")}><MapPin size={20}/></button></div></div><button className="publish-btn" type="submit">פרסום</button></form></div></div>}
      {mobileMenu && <button className="drawer-scrim" onClick={() => setMobileMenu(false)} aria-label="סגירת תפריט"/>}
      {toast && <div className="toast"><Check size={18}/>{toast}</div>}
    </div>
  );
}

export default App;
