
const { useState, useEffect, useRef } = React;
const { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, useReducedMotion, AnimatePresence, MotionConfig, LayoutGroup } = window.Motion || window.FramerMotion;
const IMG = window.IMG;
const ease = [0.22, 1, 0.36, 1];

/* ---------- small pieces ---------- */
function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 320, damping: 32 }), sy = useSpring(y, { stiffness: 320, damping: 32 });
  const [big, setBig] = useState(false);
  useEffect(() => {
    const m = (e) => { x.set(e.clientX); y.set(e.clientY); setBig(!!(e.target.closest && e.target.closest("a,button,input,select,[data-hover]"))); };
    window.addEventListener("mousemove", m); return () => window.removeEventListener("mousemove", m);
  }, []);
  return (
    <motion.div style={{ x: sx, y: sy }} className="cur fixed top-0 left-0 z-[95] pointer-events-none">
      <motion.div animate={{ width: big ? 76 : 16, height: big ? 76 : 16, backgroundColor: big ? "rgba(184,151,90,.16)" : "rgba(184,151,90,.9)" }} transition={{ duration: 0.35, ease }} className="-translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B8975A]" />
    </motion.div>
  );
}

function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const s = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return <motion.div style={{ scaleX: s }} className="fixed top-0 inset-x-0 h-[3px] origin-left bg-[#B8975A] z-[96]" />;
}

function Loader() {
  return (
    <motion.div initial={{ y: 0 }} animate={{ y: "-100%" }} transition={{ delay: 1.2, duration: 0.8, ease }} className="fixed inset-0 z-[90] flex items-center justify-center bg-[#F8F3E9]">
      <div className="text-center">
        <motion.img src={IMG.logo} alt="Lavender Plaza Hotel" initial={{ opacity: 0, scale: 0.8, filter: "blur(12px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 0.9, ease }} className="h-40 sm:h-48 w-auto mx-auto" />
        <div className="mt-6 h-px w-52 mx-auto bg-[#B8975A]/25 overflow-hidden"><motion.div className="h-full bg-[#B8975A]" initial={{ x: "-100%" }} animate={{ x: 0 }} transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1] }} /></div>
        
      </div>
    </motion.div>
  );
}

function Magnetic({ children }) {
  const r = useRef(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 14 }), sy = useSpring(y, { stiffness: 220, damping: 14 });
  const mv = (e) => { const b = r.current.getBoundingClientRect(); x.set((e.clientX - b.left - b.width / 2) * 0.35); y.set((e.clientY - b.top - b.height / 2) * 0.35); };
  return <motion.div ref={r} onMouseMove={mv} onMouseLeave={() => { x.set(0); y.set(0); }} style={{ x: sx, y: sy }} className="inline-block">{children}</motion.div>;
}

const Btn = ({ children, solid = true, href = "#", onClick }) => (
  <motion.a href={href} onClick={onClick} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
    className={"inline-flex items-center gap-3 rounded-full px-8 py-4 text-[15px] font-semibold " + (solid ? "lx-btn" : "lx-btn-ghost")}>
    {children}
  </motion.a>
);

const Eyebrow = ({ children, center }) => (
  <div className={"flex items-center gap-3 mb-6 " + (center ? "justify-center" : "")}>
    <span style={{ width: 8, height: 8, transform: "rotate(45deg)", background: "linear-gradient(135deg,#8a6d38,#d9bd7c)" }} />
    <span className="text-[13px] font-medium" style={{ color: "#5b4a8c", letterSpacing: ".02em" }}>{children}</span>
  </div>
);

/* ---------- header + full-screen menu ---------- */
const NAV = [
  ["Stay", "#stay", "kingA", "Rooms & suites"],
  ["Wellness", "#wellness", "pool2", "Pool, gym & spa"],
  ["Indian Restaurant", "#indian", "indian", "Live kitchen · Lucknowi Biryani"],
  ["Dine", "#tulip", "tulip1", "Tulip all-day dining & bar"],
  ["Gallery", "#gallery", "hotelExt", "Photographs of the whole hotel"],
  ["Location", "#location", "exterior", "Distances to key destinations"],
  ["Contact", "#contact", "exterior", "Al Nahda 1, Dubai"],
];
const NAVBAR = [["Home", "#", "home"], ["Overview", "#overview", "info"], ["Accommodation", "#stay", "bed"], ["Dining", "#tulip", "dine"], ["Contact", "#contact", "pin"]];
function useMinWidth(px) {
  const [m, setM] = useState(() => window.innerWidth >= px);
  useEffect(() => { const f = () => setM(window.innerWidth >= px); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, [px]);
  return m;
}
/* which section is on screen (home page only) */
function useActiveSection(enabled) {
  const [idx, setIdx] = useState(enabled ? 0 : -1);
  useEffect(() => {
    if (!enabled) { setIdx(-1); return; }
    let raf = 0;
    const calc = () => {
      raf = 0;
      const line = window.innerHeight * 0.4;
      let cur = 0;
      NAVBAR.forEach(([, href], i) => { if (i === 0) return; const el = document.querySelector(href); if (el && el.getBoundingClientRect().top <= line) cur = i; });
      setIdx(cur);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, [enabled]);
  return idx;
}
const navSpring = { type: "spring", stiffness: 380, damping: 34 };

/* phones & tablets: floating dock, the active section expands to show its name */
function Dock({ active, ready }) {
  const IC = {
    home: BI.home, info: BI.info, bed: FACT_ICONS.bed, pin: BI.pin,
    dine: <><path d="M7 3v6a2 2 0 0 0 4 0V3M9 3v18" /><path d="M17 21V3c-2.2 1.2-3 4-3 7 0 1.7 1 2.7 3 3" /></>,
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] flex justify-center pointer-events-none px-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
      <motion.nav aria-label="Main" initial={{ y: 90, opacity: 0 }} animate={ready ? { y: 0, opacity: 1 } : {}} transition={{ delay: 0.6, duration: 0.9, ease }}
        className="pointer-events-auto flex items-center gap-0.5 p-1.5 rounded-full border border-[#B8975A]/40 bg-white/85 backdrop-blur-xl shadow-[0_18px_40px_-18px_rgba(60,40,10,.5)] max-w-full">
        {NAVBAR.map(([label, href, ic], i) => (
          <motion.a key={label} href={href} layout transition={navSpring} aria-label={label}
            className={"relative flex items-center justify-center h-11 rounded-full outline-none " + (active === i ? "px-3.5 gap-1.5 text-[#2A2036]" : "w-10 text-[#2A2036]/70")}>
            {active === i && <motion.span layoutId="dock-pill" transition={navSpring} className="absolute inset-0 rounded-full bg-[#F1E8D6]" />}
            <span className="relative"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{IC[ic]}</svg></span>
            <AnimatePresence initial={false}>
              {active === i && <motion.span key="label" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.3, ease }} className="relative overflow-hidden whitespace-nowrap text-[9.5px] tracking-[0.1em] uppercase">{label}</motion.span>}
            </AnimatePresence>
          </motion.a>
        ))}
      </motion.nav>
    </div>
  );
}

function Header({ ready, page, member, onSignIn, onLogout }) {
  const wide = useMinWidth(1000);
  const active = useActiveSection(page === "home");
  const [hov, setHov] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const shown = hov !== null ? hov : active;
  return (
    <>
      <motion.header initial={{ y: -100 }} animate={ready ? { y: 0 } : {}} transition={{ delay: 0.1, duration: 1, ease }} className="lx-hdr fixed top-0 inset-x-0 z-[80]">
        <motion.div animate={{ paddingTop: scrolled ? 6 : 12, paddingBottom: scrolled ? 6 : 12 }} transition={{ duration: 0.4, ease }} className="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3">
          <motion.a href="#" whileHover={{ scale: 1.03 }} className="flex items-center shrink-0" aria-label="Lavender Plaza Hotel">
            <motion.img src={IMG.mark} alt="" initial={false} animate={{ height: scrolled ? 46 : 56 }} transition={{ duration: 0.4, ease }} className="w-auto" style={{ height: 56 }} />
            <span className="hidden sm:flex flex-col leading-none ml-3 self-center text-left"><span className="serif lx-hdr-name text-[19px] tracking-[0.04em]">Lavender Plaza</span><span className="text-[11px] tracking-[0.5em] uppercase text-[#8a6d38] mt-1.5">Hotel · Dubai</span></span>
          </motion.a>
          <div className="flex items-center gap-3">
            {member ? (
              <DD align="right" panelClass="w-64 bg-white rounded-2xl shadow-[0_30px_70px_-25px_rgba(60,40,10,.45)] border border-[#B8975A]/25 p-4"
                trigger={() => (
                  <span className="flex items-center gap-2 rounded-full border border-[#B8975A]/40 bg-white/80 hover:bg-[#F8F3E9] transition-colors pl-1 pr-3 py-1">
                    {member.picture ? <img src={member.picture} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover" /> : <span className="w-8 h-8 rounded-full bg-[#B8975A] text-white flex items-center justify-center text-sm">{String(member.name || member.email || "?").charAt(0).toUpperCase()}</span>}
                    <span className="hidden sm:inline max-w-[8rem] truncate text-[11px] tracking-[0.12em] text-[#2A2036]">{member.name ? member.name.split(" ")[0] : member.email}</span>
                  </span>
                )}>
                {(close) => (
                  <div>
                    <div className="text-sm font-medium text-[#2A2036] truncate">{member.name || member.email}</div>
                    {member.name && <div className="text-xs text-[#2A2036]/70 truncate">{member.email}</div>}
                    <button type="button" onClick={() => { close(); onLogout(); }} className="mt-4 w-full rounded-xl border border-[#B8975A]/40 py-2.5 text-[11px] tracking-[0.2em] uppercase text-[#8a6d38] hover:bg-[#F8F3E9] transition-colors">Log out</button>
                  </div>
                )}
              </DD>
            ) : null}
            <motion.a href="#reserve" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="shrink-0 rounded-full bg-[#2A2036] hover:bg-[#B8975A] transition-colors text-white text-[11px] tracking-[0.25em] uppercase px-6 py-3.5">Book</motion.a>
            {wide && (
              <motion.nav aria-label="Main" initial={{ opacity: 0, x: 30 }} animate={ready ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.5, duration: 0.9, ease }} onMouseLeave={() => setHov(null)}
                className="relative flex items-center gap-0.5 p-1.5 rounded-full border border-[#B8975A]/40 bg-white/80 shadow-[0_10px_30px_-18px_rgba(100,75,30,.55)]">
                {NAVBAR.map(([label, href], i) => (
                  <a key={label} href={href} onMouseEnter={() => setHov(i)} onFocus={() => setHov(i)} onBlur={() => setHov(null)}
                    className={"relative px-4 py-2.5 text-[11px] tracking-[0.2em] uppercase whitespace-nowrap rounded-full outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#B8975A] " + (shown === i ? "text-[#2A2036]" : "text-[#2A2036]/65")}>
                    {shown === i && <motion.span layoutId="nav-pill" transition={navSpring} className="absolute inset-0 rounded-full bg-[#F1E8D6]" />}
                    <span className="relative">{label}</span>
                    {active === i && <motion.span layoutId="nav-dot" transition={navSpring} className="absolute left-1/2 bottom-0.5 -ml-0.5 w-1 h-1 rounded-full bg-[#B8975A]" />}
                  </a>
                ))}
              </motion.nav>
            )}
          </div>
        </motion.div>
      </motion.header>
      {!wide && <Dock active={active} ready={ready} />}
    </>
  );
}

/* ---------- hero ---------- */
const Letters = ({ text, ready, base, gold }) => text.split("").map((c, i) => (
  <motion.span key={i} initial={{ x: -70, opacity: 0, filter: "blur(14px)", skewX: -18 }} animate={ready ? { x: 0, opacity: 1, filter: "blur(0px)", skewX: 0 } : {}}
    transition={{ duration: 1.2, delay: base + i * 0.055, ease }} whileHover={{ y: -16, transition: { type: "spring", stiffness: 260, damping: 11 } }}
    style={{ "--i": i }} className={"inline-block cursor-default " + (gold ? "shine italic" : "hover:text-[#7d5f27] transition-colors duration-300")}>{c}</motion.span>
));

function Badge({ text = "LAVENDER PLAZA · DUBAI · FOUR STAR ·" }) {
  return (
    <div className="relative w-28 h-28 lg:w-36 lg:h-36 rounded-full lx-glass flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="absolute inset-0 spin-slow" style={{ animationDuration: "24s" }}>
        <defs><path id="c" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" /></defs>
        <text fontSize="13" fill="#8a6d38" textLength="458" lengthAdjust="spacing"><textPath href="#c" textLength="458" lengthAdjust="spacing">{text}</textPath></text>
      </svg>
      <span className="serif text-3xl lx-gold-fill">4★</span>
    </div>
  );
}

/* ---------- POV hotel tour: a first-person walk from the street, through the doors, to the dining room, a room, the pool and the hall ---------- */
const CHAPTERS = [[0, "Arrival"], [4.8, "The entrance"], [9.6, "All-day dining"], [14.4, "Your room"], [19.2, "Pool and sun deck"], [24, "Banquet hall"], [28.8, "Arrival"]];

function Hero({ ready }) {
  const vref = useRef(null);
  const reduce = useReducedMotion();
  const [chap, setChap] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const up = (d) => ({ initial: { opacity: 0, y: 30 }, animate: ready ? { opacity: 1, y: 0 } : {}, transition: { delay: d, duration: 1, ease } });
  const lab = "block text-[13px] font-medium mb-1";
  useEffect(() => {
    const v = vref.current;
    const sd = typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData;
    if (!v || !ready || reduce || sd) return;
    const p = v.play(); if (p && p.catch) p.catch(() => {});
  }, [ready, reduce]);
  const onTime = () => {
    const v = vref.current; if (!v) return;
    const t = v.currentTime; let c = 0;
    for (let i = 0; i < CHAPTERS.length; i++) if (t >= CHAPTERS[i][0]) c = i;
    setChap((o) => (o === c ? o : c)); setProg(t / (v.duration || 31.4));
  };
  const toggle = () => { const v = vref.current; if (!v) return; if (v.paused) v.play().catch(() => {}); else v.pause(); };
  return (
    <section className="hero-h lx-hero2 relative lx-povh">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <video ref={vref} className="lx-pov" poster={IMG.tourPoster} muted loop playsInline preload="auto" disablePictureInPicture onTimeUpdate={onTime} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}><source src={IMG.tourVideo720} type="video/mp4" media="(max-width: 900px)" /><source src={IMG.tourVideo} type="video/mp4" /></video>
        <div className="lx-h2-shade" />
      </div>
      <div className="lx-h2-inner relative z-10 max-w-[96rem] mx-auto px-6 lg:px-10 w-full">
        <motion.div {...up(0)} className="lx-eyebrow"><i /><span>Four-star hotel · Al Nahda, Dubai</span></motion.div>
        <h1 className="serif lx-h2-title" aria-label="Lavender Plaza Hotel">
          <span className="block"><Letters text="Lavender" ready={ready} base={0.1} /></span>
          <span className="block whitespace-nowrap"><Letters text="Plaza" ready={ready} base={0.55} /><span className="inline-block" style={{ width: "0.22em" }} /><Letters text="Hotel" gold ready={ready} base={0.9} /></span>
        </h1>
        <div className="lx-h2-row">
          <motion.p {...up(1.5)} className="lx-h2-tag">A four-star stay on Al Ittihad Road, ten minutes from the metro and twelve from Dubai Airport.</motion.p>
          <motion.div {...up(1.7)} className="lx-chap lx-glass-dark">
            <div className="lx-chap-name" key={chap} aria-live="off">{CHAPTERS[chap][1]}</div>
            <div className="lx-chap-bar"><i style={{ transform: "scaleX(" + prog + ")" }} /></div>
            <button onClick={toggle} className="lx-guide-pp" aria-label={playing ? "Pause the hotel tour video" : "Play the hotel tour video"}>{playing ? "Pause tour" : "Play tour"}</button>
          </motion.div>
        </div>
      </div>
      <div id="booking" className="absolute inset-x-0 bottom-0 translate-y-1/2 z-30 flex justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.9, duration: 1, ease }} className="w-full max-w-5xl lx-glass rounded-2xl p-3 sm:p-4 grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 shadow-[0_40px_80px_-30px_rgba(60,40,10,.4)]">
          {["Check-in", "Check-out"].map((l) => (
            <label key={l} className="min-w-0 rounded-xl px-4 sm:px-5 py-3 hover:bg-[#F8F3E9] transition-colors block"><span className={lab} style={{ color: "#5b4a8c" }}>{l}</span><input id={l === "Check-in" ? "hb-in" : "hb-out"} type="date" className="w-full min-w-0 bg-transparent outline-none text-sm" /></label>
          ))}
          <label className="min-w-0 rounded-xl px-4 sm:px-5 py-3 hover:bg-[#F8F3E9] transition-colors block"><span className={lab} style={{ color: "#5b4a8c" }}>Guests</span><select id="hb-guests" className="w-full min-w-0 bg-transparent outline-none text-sm"><option>2 Adults</option><option>1 Adult</option><option>Family</option></select></label>
          <motion.button onClick={heroGo} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="lx-btn rounded-xl text-[15px] font-semibold px-8 py-4 col-span-2 md:col-span-1">Check availability</motion.button>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- getting here: the hotel as a stop on the line ---------- */
const STOPS = [
  { you: true, big: "You are here", t: "Lavender Plaza Hotel", s: "Al Ittihad Road, Al Nahda, Dubai" },
  { big: "10", unit: "minutes", t: "The Stadium metro station", s: "Green Line" },
  { big: "12", unit: "minutes", t: "Dubai International Airport", s: "Terminal 2" },
];
function Route() {
  const wide = useMinWidth(701);
  const from = wide ? "inset(0 100% 0 0)" : "inset(0 0 100% 0)";
  return (
    <section className="lx-sec-gold pt-40 pb-16 lg:pb-20" aria-label="Getting here">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <h2 className="serif text-[clamp(1.7rem,3.2vw,2.5rem)] leading-tight max-w-[22ch]" style={{ fontWeight: 400 }}>Close to everything that gets you in and out of Dubai</h2>
        <div className="lx-route mt-12">
          <motion.div className="lx-route-line" initial={{ clipPath: from }} whileInView={{ clipPath: "inset(0 0 0 0)" }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 1.4, ease: [0.77, 0, 0.175, 1] }} />
          {STOPS.map((st, i) => (
            <div key={st.t} className="lx-stop">
              <span className={"lx-node" + (st.you ? " you" : "")} />
              {st.you ? <div className="serif italic text-[1.7rem] leading-none" style={{ color: "#7d5f27" }}>{st.big}</div>
                : <div className="flex items-baseline gap-2"><span className="serif leading-none text-[3.6rem] lg:text-[4.4rem]" style={{ color: "#5b4a8c", fontWeight: 300 }}>{st.big}</span><span className="text-base" style={{ color: "#2A2036", opacity: 0.75 }}>{st.unit}</span></div>}
              <div className="mt-3 text-lg font-medium text-[#2A2036]">{st.t}</div>
              <div className="mt-1 text-[15px] text-[#2A2036]/70">{st.s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- scroll-lit statement ---------- */
const FACILITIES = ["141 Guest rooms and Suites", "All Day Dining and Bar", "Swimming Pool with Pool Bar", "Specialty Restaurant & Lobby Café", "Recreation: Gymnasium / Health Center", "BANQUETING: Yasmeen Banquet Hall", "Five Resto Bar & Lounge outlets (35 to 130 guests)", "Complimentary Parking & Internet"];
const FACTS = [
  { n: 141, unit: "", title: "Guest rooms & suites", sub: "4 room categories: King, Twin and two suites", icon: "bed" },
  { n: 10, unit: "min", title: "to the Green Line metro", sub: "Metro station: The Stadium", icon: "train" },
  { n: 12, unit: "min", title: "to Dubai Airport", sub: "Terminal 2 · DXB", icon: "plane" },
  { n: 4, unit: "star", title: "Four-star hotel", sub: "Refined comfort in Al Nahda", icon: "star" },
];
const FACT_ICONS = {
  bed: <><path d="M3 19V8" /><path d="M3 15h18v4" /><path d="M21 15v-3a3 3 0 0 0-3-3h-7v6" /><circle cx="7" cy="11.5" r="1.7" /></>,
  train: <><rect x="5" y="3" width="14" height="14" rx="3" /><path d="M5 11h14M9 21l2-4M15 21l-2-4" /><circle cx="9" cy="14" r="0.8" fill="currentColor" /><circle cx="15" cy="14" r="0.8" fill="currentColor" /></>,
  plane: <path d="M10.5 13.5L3 11l1-2 8 .5 5-5c1-1 3-1 3 0s-1 2-2 3l-5 5 .5 8-2 1-2.5-7.5z" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
};
function CountUp({ to }) {
  const [v, setV] = useState(0);
  const ran = useRef(false);
  const start = () => {
    if (ran.current) return; ran.current = true;
    const t0 = performance.now();
    const tick = (now) => { const k = Math.min(1, (now - t0) / 1500); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  return <motion.span onViewportEnter={start} viewport={{ once: true, amount: 0.6 }}>{v}</motion.span>;
}
function Statement() {
  const up = (d = 0) => ({ initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.25 }, transition: { delay: d, duration: 0.8, ease } });
  return (
    <section id="overview" className="py-20 lg:py-28 overflow-hidden" style={{ background: "linear-gradient(180deg,#fff 0,#f6f2fb 100%)" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-6">
          <motion.h2 {...up(0)} className="serif leading-[1.08] text-[clamp(2.1rem,4.6vw,3.9rem)]" style={{ fontWeight: 400 }}>Comfort with a <span className="italic gold-text">Personal Touch</span></motion.h2>
          <motion.p {...up(0.1)} className="mt-5 text-lg leading-relaxed text-[#2A2036]/75" style={{ maxWidth: "34rem" }}>A welcoming stay for business, leisure and memorable occasions.</motion.p>
          <div className="mt-8 space-y-5 text-[#2A2036]/75 leading-relaxed text-[16px]" style={{ maxWidth: "36rem" }}>
            <motion.p {...up(0.15)}>Discover contemporary comfort and genuine hospitality at Lavender Plaza Hotel, an exclusive 4-star hotel in Al Nahda-1, Dubai, near the Dubai-Sharjah border. Featuring 141 well-appointed rooms and spacious suites, we welcome business travellers, families and holidaymakers for short visits and extended stays.</motion.p>
            <motion.p {...up(0.2)}>Enjoy our swimming pool with pool bar, gymnasium, wellness spa, all-day dining, specialty restaurant “TULIP”, lobby café and the Yasmeen Banquet Hall for celebrations and social gatherings.</motion.p>
            <motion.p {...up(0.25)}>With convenient access to key destinations across Dubai and Sharjah, we bring together modern amenities, attentive service and a warm, welcoming atmosphere. Make Lavender Plaza Hotel your home in Dubai. Contact us today to check availability and book your stay!</motion.p>
          </div>
        </div>
        <div className="lg:col-span-6 lg:pt-3">
          <motion.h3 {...up(0)} className="serif text-2xl mb-2" style={{ fontWeight: 400 }}>What is on site</motion.h3>
          <ul>
            {FACILITIES.map((f, i) => (
              <motion.li key={f} {...up(0.05 + i * 0.04)} className="flex items-center gap-4 py-4" style={{ borderBottom: "1px solid rgba(138,119,191,.28)" }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#7d5f27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                <span className="text-[17px] text-[#2A2036]">{f}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- the building: an index of everything under one roof ---------- */
const UNDER_ROOF = [
  { n: "Rooms and suites", d: "Deluxe Double and Twins rooms with sea view, Junior and Executive suites", img: "kingA", href: "#stay" },
  { n: "Indian restaurant", d: "A live kitchen, Lucknowi biryani and tandoori", img: "indian", href: "#indian" },
  { n: "Tulip all-day dining", d: "Restaurant & bar for breakfast, lunch, dinner and casual meals", img: "tulip1", href: "#tulip" },
  { n: "Banquets and events", d: "Yasmeen Banquet Hall (533 m²) for weddings and celebrations", img: "yb3", href: "#events" },
  { n: "Pool, gym and wellness", d: "Outdoor pool, gymnasium, sauna, steam room and Jacuzzi", img: "poolC", href: "#wellness" },
];
function UnderRoof() {
  const [a, setA] = useState(0);
  return (
    <section className="lx-idx-sec" aria-label="Everything under one roof">
      <div className="max-w-[88rem] mx-auto px-6 lg:px-10">
        <h2 className="serif lx-idx-h" style={{ fontWeight: 300 }}>Everything under one roof</h2>
        <div className="lx-idx">
          <div className="lx-idx-photo" aria-hidden="true">
            {UNDER_ROOF.map((r, i) => <img key={r.n} src={IMG[r.img]} alt="" loading="lazy" className={i === a ? "on" : ""} />)}
            <div className="lx-gloss" />
          </div>
          <ul className="lx-idx-list">
            {UNDER_ROOF.map((r, i) => (
              <li key={r.n}>
                <a href={r.href} className={"lx-idx-row" + (i === a ? " on" : "")} onMouseEnter={() => setA(i)} onFocus={() => setA(i)}>
                  <img src={IMG[r.img]} alt="" loading="lazy" className="lx-idx-thumb" />
                  <span className="lx-idx-txt"><span className="serif lx-idx-name">{r.n}</span><span className="lx-idx-desc">{r.d}</span></span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- horizontal-scroll rooms ---------- */
const ROOMS = [
  { n: "Deluxe Double Room with Sea View", detail: true, tag: "Your peaceful retreat", size: "26 m²", bed: "1 King Bed", d: "Warm tones, soft lighting and crisp linen. Suited to individual travellers, couples and families.", a: "kingA", b: "kingB" },
  { n: "Deluxe Twins Room with Sea View", detail: true, tag: "Comfort, shared", size: "26 m²", bed: "2 Twin Beds", d: "Two generous beds, a cosy seating nook and a desk by the window. Suited to friends, colleagues and families.", a: "twinB", b: "twinA" },
  { n: "One Bedroom Junior Suite Room", detail: true, tag: "Space to spread out", size: "48 m²", bed: "1 King Bed · Living & Dining Area", d: "A king bedroom with a separate living room and dining area, two bathrooms and room for the whole family.", a: "juniorA", b: "juniorB" },
  { n: "One Bedroom Executive Suite Sea View", detail: true, tag: "A little more indulgence", size: "50 m²", bed: "1 King Bed · Living & Dining Area", d: "A king bedroom with a separate living room and dining area, two bathrooms and room for the whole family.", a: "execB", b: "execA" },
];
/* ---------- room detail sheet ---------- */
const AMEN = ["Flat-screen LCD TV", "Variety of TV channels", "Tea / coffee making facility", "24-hour room service", "Free internet Wi-Fi", "Mini fridge", "2 complimentary bottles of mineral water daily"];
const SUITE = {
  t1: "One Bedroom Executive", t2: "Suite Sea View", noun: "suite", cta: "Reserve this suite", stats: [["50", "m²"], ["2", "Bathrooms"], ["1", "King bed"]],
  title: "One Bedroom Executive Suite Sea View", tag: "A little more indulgence", gallery: ["execB", "execA", "execC", "bathB"],
  occ: "2 adults + 1 child (0–12 yrs)", baths: "2",
  about: "A king bed with a separate living room area with TV and dining, a separate bedroom and two bathrooms, ideal for families. The suite is 50 m² and has a flat-screen LCD TV with a variety of channels, tea and coffee making facilities, a mini fridge and free Wi-Fi. Enjoy 24-hour room service and two complimentary bottles of mineral water daily.",
  highlights: [["home", "Separate living room"], ["area", "50 m²"], ["bath", "Two bathrooms"], ["tv", "Flat-screen LCD TV"], ["coffee", "Tea / coffee facility"], ["minibar", "Mini fridge"], ["wifi", "Free Wi-Fi"]],
  bathroom: [],
  facilities: AMEN.concat(["Living room with TV and dining area", "Two bathrooms"]),
};
const JUNIOR = {
  ...SUITE,
  t1: "One Bedroom Junior", t2: "Suite Room", title: "One Bedroom Junior Suite Room", tag: "Space to spread out", gallery: ["juniorA", "juniorB", "bathB"],
  stats: [["48", "m²"], ["2", "Bathrooms"], ["1", "King bed"]],
  about: "A king bed with a separate living room area with TV and dining, a separate bedroom and two bathrooms, ideal for families. The suite is 48 m² and has a flat-screen LCD TV with a variety of channels, tea and coffee making facilities, a mini fridge and free Wi-Fi. Enjoy 24-hour room service and two complimentary bottles of mineral water daily.",
  highlights: [["home", "Separate living room"], ["area", "48 m²"], ["bath", "Two bathrooms"], ["tv", "Flat-screen LCD TV"], ["coffee", "Tea / coffee facility"], ["minibar", "Mini fridge"], ["wifi", "Free Wi-Fi"]],
};
const KING = {
  t1: "Deluxe Double", t2: "Room with Sea View", noun: "room", cta: "Reserve this room", stats: [["26", "m²"], ["1", "King bed"], ["3", "Guests"]],
  title: "Deluxe Double Room with Sea View", tag: "Your peaceful retreat", gallery: ["kingA", "kingB", "bathA"],
  occ: "2 adults + 1 child (0–12 yrs)",
  about: "One king bed, suited to individual travellers, couples and families. The room is 26 m² and has a flat-screen LCD TV with a variety of channels, tea and coffee making facilities, a mini fridge and free Wi-Fi. Enjoy 24-hour room service and two complimentary bottles of mineral water daily.",
  highlights: [["home", "King bed"], ["area", "26 m²"], ["tv", "Flat-screen LCD TV"], ["coffee", "Tea / coffee facility"], ["minibar", "Mini fridge"], ["wifi", "Free Wi-Fi"]],
  bathroom: [],
  facilities: AMEN,
};
const TWIN = {
  ...KING,
  t1: "Deluxe Twins", t2: "Room with Sea View", title: "Deluxe Twins Room with Sea View", tag: "Comfort, shared", gallery: ["twinB", "twinA", "bathA"],
  stats: [["26", "m²"], ["2", "Twin beds"], ["3", "Guests"]],
  about: "Two twin beds, suited to friends or colleagues sharing, and to families. The room is 26 m² and has a flat-screen LCD TV with a variety of channels, tea and coffee making facilities, a mini fridge and free Wi-Fi. Enjoy 24-hour room service and two complimentary bottles of mineral water daily.",
  highlights: [["home", "Twin beds"], ["area", "26 m²"], ["tv", "Flat-screen LCD TV"], ["coffee", "Tea / coffee facility"], ["minibar", "Mini fridge"], ["wifi", "Free Wi-Fi"]],
};
const DETAILS = [KING, TWIN, JUNIOR, SUITE];
const ICONS = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  area: <><path d="M3 17L17 3l4 4L7 21z" /><path d="M7 13l2 2M10 10l2 2M13 7l2 2" /></>,
  pool: <><path d="M2 19c2 0 2-1.5 4-1.5S8 19 10 19s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" /><circle cx="17" cy="6" r="2" /><path d="M5 14l5-4 3 2 3-3" /></>,
  ac: <><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" /><path d="M9 4l3 2 3-2M9 20l3-2 3 2" /></>,
  bath: <><path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" /><path d="M6 12V6a2 2 0 0 1 4 0" /><path d="M6 19l-1 2M18 19l1 2" /></>,
  tv: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  coffee: <><path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" /><path d="M16 10h2a2 2 0 0 1 0 4h-2" /><path d="M7 2v3M11 2v3" /></>,
  minibar: <><path d="M5 3h6l-1 8a2 2 0 0 1-4 0z" /><path d="M13 3h6l-1 8a2 2 0 0 1-4 0z" /><path d="M8 13v6M16 13v6M6 21h4M14 21h4" /></>,
  wifi: <><path d="M2 9a15 15 0 0 1 20 0" /><path d="M5 12.5a10 10 0 0 1 14 0" /><path d="M8.5 16a5 5 0 0 1 7 0" /><circle cx="12" cy="19.5" r="1" fill="currentColor" /></>,
};
const Icon = ({ n }) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{ICONS[n]}</svg>;

function ChipGroup({ title, items }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }} className="mt-16">
      <motion.h3 variants={{ hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0, transition: { duration: 0.7, ease } } }} className="serif text-3xl lg:text-4xl">{title}</motion.h3>
      <motion.div variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.3, ease } } }} className="h-[3px] origin-left my-6 rounded-full bg-gradient-to-r from-[#9c7a3f] via-[#e0c78f] to-[#9c7a3f]" />
      <div className="flex flex-wrap gap-2.5">
        {items.map((c) => (
          <motion.span key={c} variants={{ hidden: { opacity: 0, y: 16, scale: 0.92 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } } }} whileHover={{ y: -3, backgroundColor: "#F8F3E9" }} className="rounded-full bg-white border border-[#B8975A]/25 px-4 py-2.5 text-[13px] text-[#2A2036]/80 flex items-center gap-2">
            <span className="text-[#7d5f27] text-[11px]">✦</span>{c}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

function RoomDetail({ d, onClose }) {
  const S = d;
  const [p, setP] = useState(0);
  useEffect(() => {
    const prev = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
    const k = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => { window.removeEventListener("keydown", k); document.documentElement.style.overflow = prev; };
  }, []);
  const reserve = (e) => { e.preventDefault(); const rk = (ROOM_OPTS.find((r) => r.n === S.title) || {}).k; window.__bkPrefill = rk ? { room: rk } : {}; onClose(); setTimeout(() => { if (window.__lphNavigate) window.__lphNavigate("booking"); }, 700); };
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.6 } } };
  const up = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } };
  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.95, ease }} className="fixed inset-0 z-[100] bg-[#F8F3E9] overflow-y-auto overscroll-contain">
      <div className="sticky top-0 z-20 bg-[#F8F3E9]/80 backdrop-blur-xl border-b border-[#B8975A]/20">
        <div className="max-w-[88rem] mx-auto px-6 lg:px-10 h-[76px] flex items-center justify-between">
          <motion.button onClick={onClose} whileHover={{ x: -5 }} className="text-[11px] tracking-[0.25em] uppercase text-[#8a6d38] hover:text-[#7d5f27] transition-colors">← Back to rooms</motion.button>
          <img src={IMG.mark} alt="Lavender Plaza Hotel" className="hidden sm:block h-12 w-auto" />
          <motion.button onClick={onClose} aria-label="Close" whileHover={{ rotate: 90, scale: 1.08 }} className="w-11 h-11 rounded-full bg-[#2A2036] text-white text-2xl leading-none">×</motion.button>
        </div>
      </div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[88rem] mx-auto px-6 lg:px-10 pt-10 lg:pt-14 pb-24">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-14">
          <motion.div variants={up} className="lg:col-span-7">
            <div className="relative h-[40svh] lg:h-[62svh] rounded-3xl overflow-hidden shadow-[0_40px_80px_-40px_rgba(100,75,30,.55)] bg-white">
              <AnimatePresence mode="wait"><motion.img key={p} src={IMG[S.gallery[p]]} alt={S.title} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease }} className="absolute inset-0 w-full h-full object-cover" /></AnimatePresence>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {S.gallery.map((k, i) => (
                <motion.button key={k} onClick={() => setP(i)} whileHover={{ y: -4 }} className={"rounded-xl overflow-hidden h-16 w-24 lg:h-20 lg:w-28 lx-tr duration-200 " + (i === p ? "ring-2 ring-[#B8975A] ring-offset-2 ring-offset-[#F8F3E9]" : "opacity-60 hover:opacity-100")}><img src={IMG[k]} alt="" className="w-full h-full object-cover" /></motion.button>
              ))}
            </div>
          </motion.div>
          <div className="lg:col-span-5 lg:pt-4">
            <motion.div variants={up}><Eyebrow>{S.tag}</Eyebrow></motion.div>
            <motion.h1 variants={up} className="serif text-5xl lg:text-7xl leading-[1]">{S.t1} <span className="italic gold-text">{S.t2}</span></motion.h1>
            <motion.div variants={up} className="mt-8 rounded-2xl bg-white border border-[#B8975A]/20 p-6"><div className="text-[11px] tracking-[0.25em] uppercase text-[#7d5f27]">Maximum occupancy</div><div className="serif text-3xl mt-2">{S.occ}</div></motion.div>
            <motion.div variants={up} className="mt-4 grid grid-cols-3 gap-3 text-center">
              {S.stats.map(([n, l]) => <div key={l} className="rounded-2xl bg-white border border-[#B8975A]/20 py-4"><div className="serif text-3xl">{n}</div><div className="text-[11px] tracking-[0.2em] uppercase text-[#2A2036]/70 mt-1">{l}</div></div>)}
            </motion.div>
            <motion.div variants={up} className="mt-8 flex flex-wrap gap-3"><Btn href="#booking" onClick={reserve}>{S.cta}</Btn></motion.div>
          </div>
        </div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }} className="mt-20">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
            {S.highlights.map(([ic, l]) => (
              <motion.div key={l} variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } }} whileHover={{ y: -6, boxShadow: "0 24px 44px -22px rgba(184,151,90,.6)" }} className="rounded-2xl bg-white border border-[#B8975A]/15 px-5 py-5 flex items-center gap-4">
                <span className="w-12 h-12 shrink-0 rounded-full bg-[#F8F3E9] text-[#7d5f27] flex items-center justify-center"><Icon n={ic} /></span>
                <span className="serif text-lg lg:text-xl leading-tight">{l}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }} className="mt-20 grid lg:grid-cols-12 gap-8 items-start">
          <motion.div variants={up} className="lg:col-span-4"><Eyebrow>About</Eyebrow><h3 className="serif text-4xl lg:text-5xl leading-[1.05]">About this <span className="italic gold-text">{S.noun}</span></h3>{S.baths && <p className="mt-5 text-sm"><span className="font-semibold">Bathrooms</span>: {S.baths}</p>}</motion.div>
          <motion.p variants={up} className="lg:col-span-8 text-[16px] lg:text-[17px] leading-[1.9] font-light text-[#2A2036]/75">{S.about}</motion.p>
        </motion.div>

        
        <ChipGroup title="In your room:" items={S.facilities} />

        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 1, ease }} className="mt-20 rounded-3xl p-10 lg:p-14 text-center bg-gradient-to-br from-[#e8d6a8] via-[#d9bd80] to-[#c9a35f]">
          <h3 className="serif text-3xl lg:text-5xl text-[#2A2036]">Ready to stay in the {S.title}?</h3>
          <div className="mt-8 flex flex-wrap justify-center gap-4"><Btn href="#booking" onClick={reserve}>{S.cta}</Btn><Btn solid={false} href="#room" onClick={(e) => { e.preventDefault(); onClose(); }}>Back to rooms</Btn></div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function useDesktop() {
  const [d, setD] = useState(window.innerWidth >= 1024);
  useEffect(() => { const f = () => setD(window.innerWidth >= 1024); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return d;
}
function RoomsPinned({ onOpen }) {
  const ref = useRef(null);
  const desk = useDesktop();
  const introW = desk ? 40 : 80, panelW = desk ? 72 : 84;
  const travel = 6 + introW + 4 + ROOMS.length * (panelW + 4) + 10 - 100;
  const tr = useRef(travel); tr.current = travel;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const sp = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.7, restDelta: 0.00005 });
  const xv = useTransform(sp, (v) => -v * tr.current);
  const x = useMotionTemplate`${xv}vw`;
  return (
    <section id="stay" ref={ref} className="relative bg-[#F8F3E9]" style={{ height: `calc(100${VH} + ${travel}vw)` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden flex items-center">
        <motion.div style={{ x }} className="flex items-center gap-[4vw] pl-[6vw] pr-[10vw] will-change-transform transform-gpu">
          <div className="shrink-0" style={{ width: introW + "vw" }}>
            <Eyebrow>Accommodation</Eyebrow>
            <h2 className="serif text-[clamp(2.8rem,5.4vw,6rem)] leading-[1]">Your own little <span className="italic gold-text">sanctuary</span></h2>
            <p className="mt-5 text-[#2A2036]/70 font-light max-w-md">Space to unwind. Comfort to settle in. A stay to remember.</p>
            <motion.div animate={{ x: [0, 18, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="mt-10 text-[11px] tracking-[0.3em] uppercase text-[#7d5f27]">Keep scrolling →</motion.div>
          </div>
          {ROOMS.map((r, i) => (
            <motion.article key={r.n} whileHover="h" style={{ width: panelW + "vw" }} className="shrink-0 h-[74svh] grid lg:grid-cols-12 gap-5 lg:gap-8 items-center">
              <div className={"lg:col-span-7 relative " + (r.full ? "aspect-[3/2] lg:aspect-auto lg:h-auto lg:self-center" : "h-[30svh] lg:h-full")}>
                <div className={(r.full ? "relative aspect-[3/2] " : "absolute inset-0 ") + "overflow-hidden shadow-[0_30px_50px_-30px_rgba(100,75,30,.55)] " + (!r.full && i === 1 ? "rounded-t-[40svh] rounded-b-3xl" : "rounded-3xl")}>
                  <motion.img loading="lazy" decoding="async" src={IMG[r.a]} alt={r.n} variants={{ h: { scale: 1.06 } }} transition={{ duration: 1.2, ease }} className="w-full h-full object-cover" />
                </div>
                {r.b && <motion.div variants={{ h: { y: -12, rotate: -2 } }} transition={{ duration: 0.6, ease }} className="hidden lg:block absolute -bottom-6 -right-8 w-[38%] h-[34%] rounded-2xl overflow-hidden border-[6px] border-[#F8F3E9] shadow-xl"><img loading="lazy" decoding="async" src={IMG[r.b]} alt="" className="w-full h-full object-cover" /></motion.div>}
              </div>
              <div className="lg:col-span-5">
                <div className="serif text-5xl lg:text-8xl outline leading-none">0{i + 1}</div>
                <div className="mt-3 text-[11px] tracking-[0.3em] uppercase text-[#7d5f27]">{r.tag}</div>
                <h3 className="serif text-3xl lg:text-5xl mt-2 leading-tight">{r.n}</h3>
                <div className="mt-3 text-[11px] tracking-[0.18em] uppercase text-[#2A2036]/70">{r.size} · {r.bed}</div>
                <p className="hidden sm:block mt-4 text-sm text-[#2A2036]/65 font-light leading-relaxed max-w-xs">{r.d}</p>
                <div className="mt-5">{r.detail ? <Btn solid={false} href="#room" onClick={(e) => { e.preventDefault(); onOpen(i); }}>Discover room</Btn> : <Btn solid={false} href="#booking">Discover room</Btn>}</div>
              </div>
            </motion.article>
          ))}
        </motion.div>
        <motion.div style={{ scaleX: sp }} className="absolute bottom-8 left-[6vw] right-[6vw] h-px origin-left bg-[#B8975A]" />
      </div>
    </section>
  );
}

/* phones & tablets: native swipe carousel (the browser does the scrolling = smoothest possible) */
function usePinned() {
  const calc = () => window.innerWidth >= 1024 && !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  const [p, setP] = useState(calc);
  useEffect(() => { const f = () => setP(calc()); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return p;
}
function RoomCardM({ r, i, onOpen, ratio, eager, compact }) {
  return (
    <article className="snap-center shrink-0 w-[84vw] max-w-[26rem] sm:max-w-[30rem]">
      <div className="relative">
        <div className={"overflow-hidden shadow-[0_30px_50px_-30px_rgba(100,75,30,.55)] " + (r.full ? "aspect-[3/2] rounded-3xl" : ratio + " " + (i === 1 ? "rounded-t-[40vw] rounded-b-3xl" : "rounded-3xl"))}>
          <img loading={eager ? "eager" : "lazy"} decoding="async" src={IMG[r.a]} alt={r.n} className="w-full h-full object-cover" />
        </div>
        {r.b && <div className="absolute -bottom-5 -right-2 w-[36%] aspect-[4/3] rounded-2xl overflow-hidden border-[5px] border-[#F8F3E9] shadow-lg"><img loading={eager ? "eager" : "lazy"} decoding="async" src={IMG[r.b]} alt="" className="w-full h-full object-cover" /></div>}
      </div>
      <div className={r.full ? "pt-6 px-1" : "pt-9 px-1"}>
        <div className={"serif outline leading-none " + (compact ? "text-4xl" : "text-5xl")}>0{i + 1}</div>
        <div className="mt-2 text-[11px] tracking-[0.3em] uppercase text-[#7d5f27]">{r.tag}</div>
        <h3 className="serif text-3xl mt-1 leading-tight">{r.n}</h3>
        <div className="mt-2 text-[11px] tracking-[0.18em] uppercase text-[#2A2036]/70">{r.size} · {r.bed}</div>
        {!compact && <p className="mt-4 text-sm text-[#2A2036]/65 font-light leading-relaxed">{r.d}</p>}
        <div className="mt-4">{r.detail ? <Btn solid={false} href="#room" onClick={(e) => { e.preventDefault(); onOpen(i); }}>Discover room</Btn> : <Btn solid={false} href="#booking">Discover room</Btn>}</div>
      </div>
    </article>
  );
}

/* trial switch: lets you compare the two phone modes */
function ModeToggle({ mode, setMode }) {
  if (CFG.roomsToggle === false) return null;
  const flip = () => {
    setMode(mode === "auto" ? "swipe" : "auto");
    setTimeout(() => { const el = document.getElementById("stay"); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "instant" }); }, 80);
  };
  return <button type="button" onClick={flip} className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#B8975A]/50 bg-white/70 px-4 py-2 text-[11px] tracking-[0.2em] uppercase text-[#8a6d38]">{mode === "auto" ? "Try swipe mode" : "Try auto-scroll mode"}</button>;
}

function RoomsSwipe({ onOpen, mode, setMode }) {
  const scroller = useRef(null);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    const calc = () => {
      raf = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0, bd = 1e9;
      for (let k = 0; k < el.children.length; k++) { const c = el.children[k]; const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = k; } }
      setIdx(best);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(calc); };
    el.addEventListener("scroll", on, { passive: true });
    return () => { el.removeEventListener("scroll", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const go = (k) => { const el = scroller.current; const c = el && el.children[k]; if (c) el.scrollTo({ left: c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2, behavior: "smooth" }); };
  return (
    <section id="stay" className="relative bg-[#F8F3E9] pt-20 pb-16 overflow-hidden">
      <div className="px-6 sm:px-10 max-w-3xl">
        <Eyebrow>Accommodation</Eyebrow>
        <h2 className="serif text-[clamp(2.6rem,9vw,4.5rem)] leading-[1]">Your own little <span className="italic gold-text">sanctuary</span></h2>
        <p className="mt-4 text-[#2A2036]/70 font-light max-w-md">Space to unwind. Comfort to settle in. A stay to remember.</p>
        <div className="mt-6 text-[11px] tracking-[0.3em] uppercase text-[#7d5f27]">Swipe to explore →</div>
        <ModeToggle mode={mode} setMode={setMode} />
      </div>
      <div ref={scroller} className="mt-8 flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar px-6 sm:px-10 pb-10" style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}>
        {ROOMS.map((r, i) => <RoomCardM key={r.n} r={r} i={i} onOpen={onOpen} ratio="aspect-[4/5]" eager={i === 0} />)}
      </div>
      <div className="flex justify-center gap-2">
        {ROOMS.map((r, k) => <button key={r.n} type="button" aria-label={"Show " + r.n} onClick={() => go(k)} className={"h-1.5 rounded-full lx-tr duration-300 " + (k === idx ? "w-8 bg-[#B8975A]" : "w-2 bg-[#B8975A]/30")} />)}
      </div>
    </section>
  );
}

/* phones & tablets, "auto-scroll" mode: scrolling down moves the rooms sideways.
   No spring, no React in the loop: one rAF per scroll frame writes a GPU transform directly. */
function RoomsAuto({ onOpen, mode, setMode }) {
  const sec = useRef(null), track = useRef(null), bar = useRef(null);
  useEffect(() => {
    const s = sec.current, tr = track.current, br = bar.current;
    if (!s || !tr) return;
    let travel = 0, top = 0, raf = 0, last = -1;
    const measure = () => {
      const vh = svhUnit() * 100 || window.innerHeight;
      travel = Math.max(0, tr.scrollWidth - window.innerWidth);
      s.style.height = Math.round(vh + travel) + "px";
      top = s.getBoundingClientRect().top + window.scrollY;
    };
    const apply = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, (window.scrollY - top) / (travel || 1)));
      if (p === last) return;
      last = p;
      tr.style.transform = "translate3d(" + (-p * travel).toFixed(1) + "px,0,0)";
      if (br) br.style.transform = "scaleX(" + p.toFixed(4) + ")";
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const rs = () => { measure(); last = -1; apply(); };
    measure(); apply();
    window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", rs);
    const t1 = setTimeout(rs, 700), t2 = setTimeout(rs, 2800);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", rs); clearTimeout(t1); clearTimeout(t2); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <section id="stay" ref={sec} className="relative bg-[#F8F3E9]" style={{ height: "340" + VH }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden pt-[72px] flex items-center">
        <div ref={track} className="flex items-center gap-4 pl-6 pr-8 w-max will-change-transform" style={{ transform: "translate3d(0,0,0)" }}>
          <div className="shrink-0 w-[80vw] max-w-[24rem]">
            <Eyebrow>Accommodation</Eyebrow>
            <h2 className="serif text-[clamp(2.6rem,11vw,4rem)] leading-[1]">Your own little <span className="italic gold-text">sanctuary</span></h2>
            <p className="mt-4 text-[#2A2036]/70 font-light">Space to unwind. Comfort to settle in. A stay to remember.</p>
            <div className="mt-6 text-[11px] tracking-[0.3em] uppercase text-[#7d5f27]">Keep scrolling →</div>
            <ModeToggle mode={mode} setMode={setMode} />
          </div>
          {ROOMS.map((r, i) => <RoomCardM key={r.n} r={r} i={i} onOpen={onOpen} ratio="aspect-[4/3]" eager compact />)}
        </div>
        <div ref={bar} className="absolute bottom-5 left-6 right-6 h-px origin-left bg-[#B8975A]" style={{ transform: "scaleX(0)" }} />
      </div>
    </section>
  );
}

function Rooms() {
  const pinned = usePinned();
  const [mode, setMode] = useState("auto");
  const [open, setOpen] = useState(null);
  return (
    <>
      {pinned ? <RoomsPinned onOpen={setOpen} /> : mode === "auto" ? <RoomsAuto onOpen={setOpen} mode={mode} setMode={setMode} /> : <RoomsSwipe onOpen={setOpen} mode={mode} setMode={setMode} />}
      <AnimatePresence>{open !== null && DETAILS[open] && <RoomDetail key={"d" + open} d={DETAILS[open]} onClose={() => setOpen(null)} />}</AnimatePresence>
    </>
  );
}

/* ---------- stacking spaces ---------- */
const SPACES = [
  { k: "lobby", no: "01", eb: "Hotel Lobby", title: "A warm welcome awaits", text: "Step into the Lavender Plaza lobby: a welcoming reception, comfortable lounge seating and our lobby café.", chips: ["Reception", "Lounge seating", "Lobby café"], imgs: ["lobbyA", "lobbyB", "lobbyC"], bg: "#F8F3E9" },
  { k: "events", no: "03", eb: "Banquets & Events", title: "Rooms to celebrate in", text: "Yasmeen Banquet Hall is a 533 m² venue for 100 to 350 guests, ideal for weddings, receptions and social gatherings, and for corporate conferences, seminars, product launches, training sessions and business events. Subject to venue configuration and availability.", chips: ["533 m²", "Theatre · 350", "Round tables · 200+", "Weddings", "Conferences", "Receptions"], imgs: ["yb2", "yb1", "yb4"], bg: "#F8F3E9" },
  { k: "wellness", no: "04", eb: "Recreation & Wellness", title: "A sanctuary of peace & calm", text: "Outdoor swimming pool with poolside seating and pool bar, subject to current operating status. Wellness facilities including sauna, steam room and Jacuzzi, subject to current availability and operating hours. Complimentary parking and internet.", chips: ["Outdoor pool", "Pool bar", "Sauna", "Steam room", "Jacuzzi", "Complimentary parking", "Complimentary internet"], imgs: ["poolC", "poolA", "poolB"], bg: "#F1E8D6" },
  { k: "gym", no: "05", eb: "Gymnasium & Fitness Facilities", title: "Stay fit, stay energized, anytime", text: "Modern fitness equipment, strength training facilities and cardio workouts, with convenient amenities to keep you healthy and energized during your stay.", chips: ["Modern fitness equipment", "Strength training", "Cardio workouts", "Stay healthy & energized", "Convenient amenities"], imgs: ["gymA", "gymB", "gymC"], bg: "#F8F3E9" },
];
const rise = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } };
const GAP = 60, TAIL = 50;
const cl = (v) => Math.min(1, Math.max(0, v));

/* 1svh in px (stable on phones even when the browser toolbar shows/hides) */
const VH = (typeof CSS !== "undefined" && CSS.supports && CSS.supports("height", "100svh")) ? "svh" : "vh";
function svhUnit() { const p = document.getElementById("svh-probe"); const h = p ? p.offsetHeight : 0; return (h > 0 ? h : window.innerHeight) / 100; }
function useStackMode() {
  const calc = () => window.innerWidth >= 1024 && window.innerHeight >= 640;
  const [s, setS] = useState(calc);
  useEffect(() => { const f = () => setS(calc()); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return s;
}
/* live scroll distance inside the stack, in svh */
function useStackScroll(ref) {
  const sv = useMotionValue(0);
  useEffect(() => {
    let raf = 0;
    let u = svhUnit(); const upd = () => { raf = 0; const el = ref.current; if (el) sv.set(-el.getBoundingClientRect().top / u); };
    const on = () => { if (!raf) raf = requestAnimationFrame(upd); };
    upd();
    const rs = () => { u = svhUnit(); on(); };
    window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", rs);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", rs); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return sv;
}
/* covered card: shrinks + fades back while the next card slides over it */
function useCover(p, i, n) {
  const a = (100 + GAP) * i + GAP, b = (100 + GAP) * (i + 1), last = i === n - 1;
  return { scale: useTransform(p, [a, b], [1, last ? 1 : 0.92]), veil: useTransform(p, [a, b], [0, last ? 0 : 0.55]) };
}
/* entry progress 0→1 while THIS card slides up from the bottom of the screen */
function useEntry(p, i) {
  const stack = useStackMode();
  const flow = useMotionValue(0);
  const st = useTransform(p, [(100 + GAP) * i - 95, (100 + GAP) * i + 10], [0, 1]);
  useEffect(() => {
    if (stack) return;
    const el = document.querySelector('[data-card="' + i + '"]');
    if (!el) return;
    let raf = 0, vis = true, io = null;
    const upd = () => { raf = 0; const r = el.getBoundingClientRect(); flow.set(cl((window.innerHeight * 0.95 - r.top) / (window.innerHeight * 0.5))); };
    const on = () => { if (vis && !raf) raf = requestAnimationFrame(upd); };
    if ("IntersectionObserver" in window) { io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; if (vis) on(); }, { rootMargin: "250px 0px" }); io.observe(el); }
    upd(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { if (io) io.disconnect(); window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, [stack]);
  return stack ? st : flow;
}

/* scroll-scrubbed building blocks: every one moves exactly as fast as you scroll */
function Scrub({ e, k = 0, className, children, hover }) {
  const o = useTransform(e, (v) => cl((v - 0.15 - k * 0.07) / 0.35));
  const y = useTransform(o, (v) => (1 - v) * 46);
  return <motion.div style={{ opacity: o, y }} whileHover={hover ? { scale: 1.03, zIndex: 20 } : undefined} className={className}>{children}</motion.div>;
}
function Pop({ e, from = 0.55, className, children }) {
  const o = useTransform(e, [from, from + 0.3], [0, 1]);
  const s = useTransform(e, [from, from + 0.3], [0.3, 1]);
  const r = useTransform(e, [from, from + 0.3], [-90, 0]);
  return <motion.div style={{ opacity: o, scale: s, rotate: r }} className={className}>{children}</motion.div>;
}
function Placeholder({ label }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#8a6d38]" style={{ background: "linear-gradient(135deg,#efe3cb,#d9c29a 60%,#f6efe0)" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 16l-5-5-8 8" /></svg>
      <span className="text-[11px] tracking-[0.3em] uppercase text-center px-4">{label} · photo</span>
    </div>
  );
}
function Shot({ e, j = 0, dir = 1, src, alt = "", className, inner, style }) {
  const clip = useTransform(e, (v) => { const k = cl((v - j * 0.1) / 0.6); return dir > 0 ? `inset(0 ${(1 - k) * 100}% 0 0)` : `inset(0 0 0 ${(1 - k) * 100}%)`; });
  const op = useTransform(e, (v) => (v - j * 0.1 > 0.01 ? 1 : 0));
  const sc = useTransform(e, [0, 1], [1.3, 1]);
  return (
    <motion.div style={{ opacity: op, ...style }} whileHover={{ scale: 1.03, zIndex: 20 }} className={className}>
      <motion.div style={{ clipPath: clip }} className={"w-full h-full overflow-hidden " + inner}>
        {IMG[src] ? <motion.img loading="lazy" decoding="async" src={IMG[src]} alt={alt} style={{ scale: sc }} className="w-full h-full object-cover" /> : <Placeholder label={alt} />}
      </motion.div>
    </motion.div>
  );
}
function Shell({ id, p, i, n, bg, children }) {
  const stack = useStackMode();
  const { scale, veil } = useCover(p, i, n);
  return (
    <div id={id} data-card={i} className={stack ? "sticky top-0 h-[100svh]" : "relative"}>
      <motion.div style={stack ? { scale, background: bg, transformOrigin: "top center", willChange: "transform" } : { background: bg }}
        className={"relative rounded-t-[2.2rem] shadow-[0_-30px_70px_-30px_rgba(90,65,20,.35)] overflow-hidden " + (stack ? "h-full pt-[96px] pb-6" : "pt-14 pb-16 " + (i === 0 ? "" : "-mt-8"))}>
        {stack && <motion.div style={{ opacity: veil }} className="absolute inset-0 z-30 pointer-events-none bg-[#F8F3E9]" />}
        {children}
      </motion.div>
    </div>
  );
}

function Space({ s, i, p, n }) {
  const e = useEntry(p, i);
  const flip = i % 2 === 1;
  const pos = ["left-0 top-0 w-[82%] h-[88%]", "right-0 bottom-0 w-[44%] h-[42%]", "right-[4%] top-[2%] w-[28%] h-[28%]"];
  return (
    <Shell id={s.k} p={p} i={i} n={n} bg={s.bg}>
      <div className="h-full max-w-[88rem] mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-5 lg:gap-14 items-center content-center">
        <div className={"relative h-[40svh] sm:h-[46svh] lg:h-[68svh] " + (flip ? "lg:order-2" : "")}>
          {s.imgs.map((im, j) => (
            <Shot key={im} e={e} j={j} dir={j % 2 ? -1 : 1} src={im} style={{ borderColor: s.bg }} inner={j ? "rounded-[1.1rem]" : "rounded-3xl"}
              className={"absolute rounded-3xl shadow-[0_40px_80px_-35px_rgba(100,75,30,.6)] " + (j ? "border-[6px] " : "") + pos[j] + (j === 2 ? " hidden lg:block" : "")} />
          ))}
        </div>
        <div className={flip ? "lg:order-1" : ""}>
          <Scrub e={e} k={0} className="serif text-6xl lg:text-7xl outline leading-none">{s.no}</Scrub>
          <Scrub e={e} k={1} className="sm:mt-3"><Eyebrow>{s.eb}</Eyebrow></Scrub>
          <Scrub e={e} k={2}><h2 className="serif text-3xl lg:text-[3.2rem] leading-[1.08]">{s.title}</h2></Scrub>
          <Scrub e={e} k={3}><p className="mt-4 text-[#2A2036]/70 font-light leading-relaxed max-w-md text-[15px]">{s.text}</p></Scrub>
          <Scrub e={e} k={4} className="mt-5 flex flex-wrap gap-2">{s.chips.map((c) => <span key={c} className="rounded-full bg-white/80 border border-[#B8975A]/30 px-4 py-2 text-[11px] tracking-[0.15em] uppercase">{c}</span>)}</Scrub>
          <Scrub e={e} k={5} className="mt-6"><Btn>Learn more</Btn></Scrub>
        </div>
      </div>
    </Shell>
  );
}

function IndianCard({ p, i, n }) {
  const e = useEntry(p, i);
  const chips = ["Live chef kitchen", "Seafood", "Meat & poultry", "Vegetable dishes", "Freshly baked bread"];
  return (
    <Shell id="indian" p={p} i={i} n={n} bg="#ffffff">
      <div className="h-full max-w-[88rem] mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-5 lg:gap-0 items-center content-center">
        <div className="lg:col-span-7 relative h-[40svh] sm:h-[46svh] lg:h-[68svh]">
          <Shot e={e} src="indian" alt="Indian Restaurant" className="absolute inset-0 rounded-3xl shadow-[0_40px_70px_-40px_rgba(100,75,30,.55)]" inner="rounded-3xl" />
          <Pop e={e} className="absolute -top-6 -left-2 lg:-left-8 z-10"><div className="scale-75 lg:scale-100 origin-top-left"><Badge text="LIVE KITCHEN · SIGNATURE TANDOORI ·" /></div></Pop>
        </div>
        <Scrub e={e} k={0} className="lg:col-span-5 lg:-ml-20 relative z-10 bg-white/90 backdrop-blur-md rounded-3xl p-6 lg:p-9 shadow-[0_40px_80px_-40px_rgba(100,75,30,.5)] border border-[#B8975A]/15">
          <Scrub e={e} k={1}><Eyebrow>Specialty Dining</Eyebrow></Scrub>
          <Scrub e={e} k={2}><h2 className="serif text-3xl lg:text-[3rem] leading-[1.05]">Indian <span className="italic gold-text">Restaurant</span></h2></Scrub>
          <Scrub e={e} k={3}><p className="mt-4 text-[14px] font-light leading-relaxed text-[#2A2036]/70">Our Indian restaurant serves Indian cuisine and has a unique kitchen display where you can see the Chefs cooking live. Our guests can choose from a wide range of seafood, meat, poultry, and vegetable dishes along with freshly baked bread. Signature dishes such as Lucknowi Biryani and Tandoori made to international taste is a must-have for food lovers.</p></Scrub>
          <Scrub e={e} k={4} className="mt-5 flex flex-wrap gap-2">
            {["Lucknowi Biryani", "Tandoori"].map((c) => <span key={c} className="rounded-full bg-[#2A2036] text-white px-4 py-2 text-[11px] tracking-[0.2em] uppercase">✦ {c}</span>)}
            {chips.map((c) => <span key={c} className="rounded-full bg-[#F8F3E9] border border-[#B8975A]/30 px-3.5 py-2 text-[11px] tracking-[0.15em] uppercase">{c}</span>)}
          </Scrub>
          <Scrub e={e} k={5} className="mt-5"><Btn href="#booking">Reserve a table</Btn></Scrub>
        </Scrub>
      </div>
    </Shell>
  );
}

const TULIP_PICS = ["tulip1", "tulip4", "tulip3", "tulip2", "tulip5"];
function TulipShow() {
  const reduce = useReducedMotion();
  const N = TULIP_PICS.length;
  const [a, setA] = useState(0);
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const [hov, setHov] = useState(false);
  const st = useRef({ x: 0, y: 0, on: false, moved: false });
  const box = useRef(null);
  const go = (d) => setA((v) => (v + d + N) % N);
  useEffect(() => {
    if (reduce || hov || drag) return;
    const t = setInterval(() => setA((v) => (v + 1) % N), 5200);
    return () => clearInterval(t);
  }, [reduce, hov, drag, a]);
  const down = (e) => { st.current = { x: e.clientX, y: e.clientY, on: true, moved: false }; setDrag(true); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} };
  const move = (e) => {
    if (!st.current.on) return;
    const d = e.clientX - st.current.x;
    if (Math.abs(d) > 4) st.current.moved = true;
    setDx(a === 0 && d > 0 || a === N - 1 && d < 0 ? d * 0.35 : d);
  };
  const up = (e) => {
    if (!st.current.on) return;
    const w = box.current ? box.current.offsetWidth : 400;
    const d = e.clientX - st.current.x;
    st.current.on = false; setDrag(false); setDx(0);
    if (d < -Math.min(60, w * 0.12) && a < N - 1) setA(a + 1);
    else if (d > Math.min(60, w * 0.12) && a > 0) setA(a - 1);
  };
  const arrow = (side) => (
    <button onClick={(e) => { e.stopPropagation(); go(side === "l" ? -1 : 1); }} onPointerDown={(e) => e.stopPropagation()} aria-label={side === "l" ? "Previous photo" : "Next photo"}
      style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: 38, border: "1px solid rgba(255,255,255,.7)", background: "rgba(30,20,45,.38)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: hov ? 1 : 0.0, transition: "opacity .3s ease" }} className={"lx-tl-arrow " + (side === "l" ? "lx-tl-l" : "lx-tl-r")}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{side === "l" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}</svg>
    </button>
  );
  return (
    <div ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      role="group" aria-roledescription="carousel" aria-label="Tulip All-Day Dining photos" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }}
      style={{ position: "absolute", inset: 0, borderRadius: "1.5rem", overflow: "hidden", boxShadow: hov ? "0 50px 80px -34px rgba(100,75,30,.65)" : "0 40px 70px -40px rgba(100,75,30,.55)", background: "#EADFC9", touchAction: "pan-y", cursor: drag ? "grabbing" : "grab", userSelect: "none", WebkitUserSelect: "none", transition: "box-shadow .5s ease" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate3d(calc(${-a * 100}% + ${dx}px),0,0)`, transition: drag ? "none" : "transform .7s cubic-bezier(.22,1,.36,1)", willChange: "transform" }}>
        {TULIP_PICS.map((k, j) => <img key={k} src={IMG[k]} alt="Tulip All-Day Dining, restaurant and bar" draggable={false} loading={j < 2 ? "eager" : "lazy"} decoding="async" style={{ position: "absolute", top: 0, left: j * 100 + "%", width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", transform: hov && j === a ? "scale(1.05)" : "scale(1)", transition: "transform 1.1s cubic-bezier(.22,1,.36,1)" }} />)}
      </div>
      {arrow("l")}{arrow("r")}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, display: "flex", justifyContent: "center", gap: 8 }}>
        {TULIP_PICS.map((k, j) => <button key={k} onClick={(e) => { e.stopPropagation(); setA(j); }} onPointerDown={(e) => e.stopPropagation()} aria-label={"Photo " + (j + 1)} style={{ width: j === a ? 22 : 8, height: 8, borderRadius: 8, border: 0, padding: 0, cursor: "pointer", background: j === a ? "#fff" : "rgba(255,255,255,.55)", boxShadow: "0 1px 4px rgba(0,0,0,.35)", transition: "width .4s ease" }} />)}
      </div>
    </div>
  );
}
function TulipCard({ p, i, n }) {
  const e = useEntry(p, i);
  return (
    <Shell id="tulip" p={p} i={i} n={n} bg="#F3EBDD">
      <div className="h-full max-w-[88rem] mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-5 lg:gap-0 items-center content-center">
        <Scrub e={e} k={0} className="order-2 lg:order-1 lg:col-span-7 lg:-mr-20 relative z-10 bg-white/90 backdrop-blur-md rounded-3xl p-6 lg:p-10 shadow-[0_40px_80px_-40px_rgba(100,75,30,.5)] border border-[#B8975A]/15">
          <Scrub e={e} k={0} className="serif text-6xl lg:text-7xl outline leading-none mb-3">02</Scrub>
          <Scrub e={e} k={1}><Eyebrow>All-day dining · Restaurant &amp; bar</Eyebrow></Scrub>
          <Scrub e={e} k={2}><h2 className="serif text-3xl lg:text-[3.2rem] leading-[1.05]">Tulip <span className="italic gold-text">All-Day Dining</span></h2></Scrub>
          <Scrub e={e} k={3}><p className="mt-4 text-[14px] font-light leading-relaxed text-[#2A2036]/70 max-w-xl">Tulip is our all-day dining restaurant and bar: multi-cuisine dining for breakfast, lunch, dinner and casual meals. Alongside it, our specialty restaurant offers Indian and international dining, with a lounge / bar and a lobby café. Five distinctive Resto Bar &amp; Lounge outlets, seating 35 to 130 guests, offer vibrant dining and inviting spaces for memorable evenings.</p></Scrub>
          <Scrub e={e} k={4} className="mt-5 flex flex-wrap gap-2">{["Breakfast", "Lunch", "Dinner", "Casual meals", "Indian & international", "Lounge / bar", "Lobby café"].map((c) => <span key={c} className="rounded-full bg-[#F8F3E9] border border-[#B8975A]/30 px-3.5 py-2 text-[11px] tracking-[0.15em] uppercase">{c}</span>)}</Scrub>
          <Scrub e={e} k={5} className="mt-5"><Btn href="#booking">Reserve a table</Btn></Scrub>
        </Scrub>
        <div className="order-1 lg:order-2 lg:col-span-5 relative" style={{ aspectRatio: "4 / 3" }}>
          <Scrub e={e} k={1} hover className="absolute inset-0"><TulipShow /></Scrub>
        </div>
      </div>
    </Shell>
  );
}

function RoomCard({ p, i, n, id, bg, flip, t1, t2, cap, text, src, src2, chips }) {
  const e = useEntry(p, i);
  return (
    <Shell id={id} p={p} i={i} n={n} bg={bg}>
      <div className="h-full max-w-[88rem] mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-5 lg:gap-0 items-center content-center">
        <div className={"lg:col-span-7 relative h-[40svh] sm:h-[46svh] lg:h-[68svh] " + (flip ? "lg:order-2" : "")}>
          <Shot e={e} dir={flip ? -1 : 1} src={src} alt={t1 + " " + t2} className="absolute inset-0 rounded-3xl shadow-[0_40px_70px_-40px_rgba(100,75,30,.55)]" inner="rounded-3xl" />
          {src2 && <Shot e={e} j={1} dir={flip ? 1 : -1} src={src2} alt={t1 + " detail"} className="hidden lg:block absolute z-10 -bottom-7 right-8 w-[34%] h-[32%] rounded-3xl border-[6px] shadow-[0_40px_70px_-35px_rgba(100,75,30,.6)]" style={{ borderColor: bg }} inner="rounded-[1.1rem]" />}
          <Pop e={e} className={"absolute z-10 -top-5 " + (flip ? "-right-2 lg:-right-8" : "-left-2 lg:-left-8")}>
            <div className="scale-75 lg:scale-100 origin-top-left w-36 h-36 rounded-full bg-white shadow-xl border border-[#B8975A]/30 flex flex-col items-center justify-center">
              <div className="text-[11px] tracking-[0.3em] uppercase text-[#8a6d38]">Capacity</div>
              <div className="serif text-4xl gold-text leading-none my-1">{cap}</div>
              <div className="text-[11px] tracking-[0.3em] uppercase text-[#8a6d38]">Persons</div>
            </div>
          </Pop>
        </div>
        <Scrub e={e} k={0} className={"lg:col-span-5 relative z-10 bg-white/90 backdrop-blur-md rounded-3xl p-6 lg:p-9 shadow-[0_40px_80px_-40px_rgba(100,75,30,.5)] border border-[#B8975A]/15 " + (flip ? "lg:order-1 lg:-mr-20" : "lg:-ml-20")}>
          <Scrub e={e} k={1}><Eyebrow>Meeting & Events</Eyebrow></Scrub>
          <Scrub e={e} k={2}><h2 className="serif text-3xl lg:text-[3rem] leading-[1.05]">{t1} <span className="italic gold-text">{t2}</span></h2></Scrub>
          <Scrub e={e} k={3}><p className="mt-4 text-[14px] font-light leading-relaxed text-[#2A2036]/70">{text}</p></Scrub>
          <Scrub e={e} k={4} className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#2A2036] text-white px-4 py-2 text-[11px] tracking-[0.2em] uppercase">✦ {cap} persons</span>
            {chips.map((c) => <span key={c} className="rounded-full bg-[#F8F3E9] border border-[#B8975A]/30 px-3.5 py-2 text-[11px] tracking-[0.15em] uppercase">{c}</span>)}
          </Scrub>
          <Scrub e={e} k={5} className="mt-5"><Btn href="#booking">Enquire</Btn></Scrub>
        </Scrub>
      </div>
    </Shell>
  );
}

function Spaces() {
  const ref = useRef(null);
  const n = SPACES.length + 2;
  const sv = useStackScroll(ref);
  const stack = useStackMode();
  return (
    <section ref={ref} className="relative bg-[#F8F3E9]">
      {SPACES.map((s, idx) => {
        const i = idx >= 1 ? idx + 1 : idx;
        return (
          <React.Fragment key={s.k}>
            <Space s={s} i={i} p={sv} n={n} /><div style={{ height: stack ? GAP + VH : 0 }} />
            {idx === 0 && <><TulipCard p={sv} i={1} n={n} /><div style={{ height: stack ? GAP + VH : 0 }} /></>}
          </React.Fragment>
        );
      })}
      <IndianCard p={sv} i={SPACES.length + 1} n={n} />
      <div style={{ height: stack ? TAIL + VH : 0 }} />
    </section>
  );
}

/* ---------- gallery ---------- */
const GALLERY = [
  ["hotelExt", "Lavender Plaza Hotel", "Al Nahda 1, Dubai"],
  ["kingA", "Deluxe Double Room", "Calm, elegant comfort"], ["kingB", "Deluxe Double Room", "Soft light & fine linens"], ["twinA", "Deluxe Twins Room", "Two beds, one bright space"],
  ["twinB", "Deluxe Twins Room", "Made for sharing"], ["juniorA", "One Bedroom Junior Suite", "Room to unwind"], ["juniorB", "One Bedroom Junior Suite", "Sitting area & style"],
  ["execA", "One Bedroom Executive Suite", "Spacious and refined"], ["execB", "One Bedroom Executive Suite", "Lounge & bedroom"], ["execC", "One Bedroom Executive Suite", "Every detail considered"],
  ["bathA", "Guest Bathroom", "Marble & warm light"], ["bathB", "Guest Bathroom", "Fresh and spotless"],
  ["tulip1", "Tulip All Day Dining", "Where every meal is easy"], ["tulip2", "Tulip All Day Dining", "Warm, welcoming interiors"], ["tulip3", "Tulip All Day Dining", "Set for a long lunch"],
  ["tulip4", "Tulip Restaurant & Bar", "Evenings that linger"], ["tulip5", "Tulip Restaurant & Bar", "Good food, good company"],
  ["yb1", "Yasmeen Entrance", "A floral welcome arch"], ["yb2", "Banquet Dinner", "Round tables, gold sashes"], ["yb3", "Blue & Gold Stage", "A floral ring backdrop"],
  ["yb4", "Conference Setup", "Theatre-style seating"], ["yb5", "Grand Hall", "Stage, seating & lights"], ["yb6", "The Ballroom", "Stage and screen, ready for you"],
  ["g1", "Golden Stage", "Candlelit gold & ivory"], ["g2", "Ivory Floral Stage", "Blush blooms & white"], ["g7", "Floral Walkway", "Red-carpet arrival"],
];
function useSectionProgress(ref) {
  const pv = useMotionValue(0);
  useEffect(() => {
    let raf = 0;
    const upd = () => { raf = 0; const el = ref.current; if (!el) return; const r = el.getBoundingClientRect(); pv.set(cl((window.innerHeight - r.top) / (window.innerHeight + r.height))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(upd); };
    upd(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return pv;
}

function GTile({ i, prog, desk, onOpen }) {
  const [id, title, sub] = GALLERY[i];
  const col = i % 3, row = Math.floor(i / 3), dl = col * 0.12 + row * 0.1;
  const y = useTransform(prog, [0, 1], desk ? [[70, -70], [-70, 70], [70, -70]][col] : [0, 0]);
  return (
    <motion.div style={{ y }} >
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={{ hidden: { opacity: 0, y: 70 }, show: { opacity: 1, y: 0, transition: { duration: 1, ease, delay: dl } } }}>
        <button onClick={(e) => onOpen(i, e.clientX, e.clientY)} aria-label={"Open " + title} className={"group relative block w-full rounded-3xl overflow-hidden text-left shadow-[0_30px_60px_-35px_rgba(100,75,30,.55)] " + "aspect-[4/5]"}>
          <motion.div variants={{ hidden: { clipPath: "inset(100% 0 0 0)" }, show: { clipPath: "inset(0% 0 0 0)", transition: { duration: 1.3, ease, delay: dl } } }} className="absolute inset-0">
            <div className="w-full h-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]">
              <motion.img loading="lazy" decoding="async" variants={{ hidden: { scale: 1.4 }, show: { scale: 1, transition: { duration: 1.8, ease, delay: dl } } }} src={IMG[id]} alt={title} className="w-full h-full object-cover" />
            </div>
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="absolute top-4 left-4 rounded-full bg-white/85 backdrop-blur px-3 py-1.5 text-[11px] tracking-[0.25em] text-[#2A2036]">{String(i + 1).padStart(2, "0")}</span>
          <div className="absolute left-5 right-16 bottom-5 text-white translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 lx-tr duration-500">
            <div className="serif text-xl leading-tight">{title}</div>
            <div className="text-[11px] tracking-[0.22em] uppercase text-[#f0dcaa] mt-1">{sub}</div>
          </div>
          <span className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-white/90 flex items-center justify-center text-xl text-[#2A2036] lx-tr duration-500 group-hover:rotate-90 group-hover:scale-110 group-hover:bg-[#B8975A] group-hover:text-white">+</span>
        </button>
      </motion.div>
    </motion.div>
  );
}

const slide = { enter: (d) => ({ x: d * 140, opacity: 0, scale: 0.94 }), center: { x: 0, opacity: 1, scale: 1 }, exit: (d) => ({ x: d * -140, opacity: 0, scale: 0.96 }) };
function Lightbox({ s, setS, onClose }) {
  const n = GALLERY.length;
  const [play, setPlay] = useState(false);
  const dir = useRef(1);
  const go = (d) => { dir.current = d; setS((v) => ({ ...v, i: (v.i + d + n) % n })); };
  const jump = (k) => { dir.current = k > s.i ? 1 : -1; setS((v) => ({ ...v, i: k })); };
  useEffect(() => {
    const prev = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
    const k = (e) => { if (e.key === "Escape") onClose(); else if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", k);
    return () => { window.removeEventListener("keydown", k); document.documentElement.style.overflow = prev; };
  }, []);
  useEffect(() => { if (!play) return; const t = setTimeout(() => go(1), 4200); return () => clearTimeout(t); }, [play, s.i]);
  const [id, title, sub] = GALLERY[s.i];
  const stop = (e) => e.stopPropagation();
  const arrow = "absolute z-10 w-12 h-12 rounded-full bg-white shadow-lg text-xl text-[#2A2036] hover:bg-[#B8975A] hover:text-white transition-colors";
  return (
    <motion.div onClick={onClose} initial={{ clipPath: `circle(0% at ${s.x}px ${s.y}px)` }} animate={{ clipPath: `circle(160% at ${s.x}px ${s.y}px)`, transition: { duration: 1, ease } }} exit={{ clipPath: `circle(0% at ${s.x}px ${s.y}px)`, transition: { duration: 0.6, ease } }} className="fixed inset-0 z-[120] flex flex-col bg-[#F8F3E9]">
      <div className="flex items-center justify-between px-6 lg:px-10 pt-6" onClick={stop}>
        <div className="flex items-baseline gap-3">
          <AnimatePresence mode="wait"><motion.span key={s.i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.3 }} className="serif text-4xl gold-text">{String(s.i + 1).padStart(2, "0")}</motion.span></AnimatePresence>
          <span className="text-xs tracking-[0.3em] text-[#2A2036]/70">/ {String(n).padStart(2, "0")}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setPlay(!play)} className="rounded-full border border-[#B8975A]/50 px-5 py-3 text-[11px] tracking-[0.25em] uppercase hover:bg-[#B8975A] hover:text-white transition-colors">{play ? "Pause" : "Play"}</button>
          <motion.button onClick={onClose} aria-label="Close album" whileHover={{ rotate: 90, scale: 1.08 }} className="w-12 h-12 rounded-full bg-[#2A2036] text-white text-2xl leading-none">×</motion.button>
        </div>
      </div>
      <div className="mx-6 lg:mx-10 mt-4 h-px bg-[#B8975A]/20 overflow-hidden" onClick={stop}>
        <motion.div key={s.i + "-" + play} className="h-full bg-[#B8975A] origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: play ? 1 : 0 }} transition={{ duration: 4.2, ease: "linear" }} />
      </div>
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 lg:px-24 py-4">
        <motion.button onClick={(e) => { stop(e); go(-1); }} aria-label="Previous" whileHover={{ x: -4, scale: 1.08 }} className={arrow + " left-3 lg:left-8"}>←</motion.button>
        <AnimatePresence mode="wait" custom={dir.current} initial={false}>
          <motion.img key={s.i} custom={dir.current} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.55, ease }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25} onDragEnd={(e, info) => { if (info.offset.x < -80) go(1); else if (info.offset.x > 80) go(-1); }}
            src={IMG[id]} alt={title} draggable={false} onClick={stop} style={{ maxHeight: "100%", maxWidth: "100%" }} className="object-contain rounded-2xl shadow-[0_40px_80px_-30px_rgba(100,75,30,.55)] select-none" />
        </AnimatePresence>
        <motion.button onClick={(e) => { stop(e); go(1); }} aria-label="Next" whileHover={{ x: 4, scale: 1.08 }} className={arrow + " right-3 lg:right-8"}>→</motion.button>
      </div>
      <div className="px-6 text-center h-14" onClick={stop}>
        <AnimatePresence mode="wait"><motion.div key={s.i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
          <div className="serif text-2xl lg:text-3xl">{title}</div><div className="text-[11px] tracking-[0.25em] uppercase text-[#7d5f27] mt-1">{sub}</div>
        </motion.div></AnimatePresence>
      </div>
      <div className="flex gap-2 px-4 py-5 overflow-x-auto sm:justify-center" onClick={stop}>
        {GALLERY.map(([gid], k) => (
          <motion.button key={gid} onClick={() => jump(k)} aria-label={"Photo " + (k + 1)} whileHover={{ y: -4 }} animate={{ opacity: k === s.i ? 1 : 0.5, scale: k === s.i ? 1.1 : 1 }}
            className={"shrink-0 w-16 h-12 lg:w-20 lg:h-14 rounded-xl overflow-hidden " + (k === s.i ? "ring-2 ring-[#B8975A] ring-offset-2 ring-offset-[#F8F3E9]" : "")}><img src={IMG[gid]} alt="" className="w-full h-full object-cover" /></motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function Gallery() {
  const ref = useRef(null);
  const desk = useDesktop();
  const prog = useSectionProgress(ref);
  const [open, setOpen] = useState(null);
  const onOpen = (i, x, y) => setOpen({ i, x, y });
  const line = { hidden: { y: "105%" }, show: { y: 0, transition: { duration: 1.1, ease } } };
  return (
    <section id="gallery" ref={ref} className="relative bg-white pt-32 lg:pt-44 pb-40 overflow-hidden min-h-[100svh]">
      <div className="hidden lg:block absolute right-8 top-16 serif text-[16rem] leading-none outline opacity-60 select-none pointer-events-none">{String(GALLERY.length).padStart(2, "0")}</div>
      <div className="relative max-w-[88rem] mx-auto px-6 lg:px-10">
        <motion.a href="#" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.9, ease }} whileHover={{ x: -6 }} className="inline-flex items-center gap-3 mb-12 text-[11px] tracking-[0.25em] uppercase text-[#8a6d38] hover:text-[#7d5f27] transition-colors">← Back to home</motion.a>
        <div className="grid lg:grid-cols-12 gap-8 items-end mb-16 lg:mb-24">
          <motion.div className="lg:col-span-8" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} transition={{ staggerChildren: 0.14 }}>
            <Eyebrow>Lavender Plaza Hotel · The Album</Eyebrow>
            <h2 className="serif text-[clamp(2.6rem,6vw,5.5rem)] leading-[1.02]">
              <span className="block overflow-hidden pb-2"><motion.span variants={line} className="block">Every corner,</motion.span></span>
              <span className="block overflow-hidden pb-2"><motion.span variants={line} className="block italic gold-text">beautifully kept</motion.span></span>
            </h2>
          </motion.div>
          <motion.div className="lg:col-span-4 lg:flex lg:justify-end" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease }}>
            <Btn onClick={(e) => { e.preventDefault(); setOpen({ i: 0, x: e.clientX, y: e.clientY }); }}>View the album</Btn>
          </motion.div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-7">
          {GALLERY.map((_, i) => <GTile key={i} i={i} prog={prog} desk={desk} onOpen={onOpen} />)}
        </div>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 1 }} className="mt-20 text-center text-[11px] tracking-[0.3em] uppercase text-[#2A2036]/70">Tap any photo to open the album</motion.p>
      </div>
      <AnimatePresence>{open && <Lightbox key="lb" s={open} setS={setOpen} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  );
}

/* ---------- home: "View Gallery" teaser ---------- */
const FAN = ["g7", "g2", "g1", "yb3", "yb2"];
function FanCard({ i, open, desk }) {
  const k = i - 2;
  const rotate = useTransform(open, (v) => k * 9 * v);
  const x = useTransform(open, (v) => k * (desk ? 175 : 52) * v);
  const y = useTransform(open, (v) => Math.abs(k) * 28 * v + (1 - v) * 50);
  return (
    <motion.a href="#gallery" aria-label="Open the gallery" style={{ rotate, x, y, zIndex: 10 - Math.abs(k) }} className="absolute">
      <motion.div whileHover={{ y: -22, scale: 1.07 }} transition={{ type: "spring", stiffness: 220, damping: 16 }} className="w-40 h-56 lg:w-56 lg:h-72 rounded-3xl overflow-hidden border-[6px] border-white shadow-[0_40px_70px_-30px_rgba(100,75,30,.6)]">
        <img loading="lazy" decoding="async" src={IMG[FAN[i]]} alt="" className="w-full h-full object-cover" />
      </motion.div>
    </motion.a>
  );
}
function GalleryTeaser() {
  const ref = useRef(null);
  const desk = useDesktop();
  const p = useSectionProgress(ref);
  const open = useTransform(p, [0.12, 0.5], [0, 1]);
  const up = (d = 0) => ({ initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.4 }, transition: { delay: d, duration: 0.9, ease } });
  return (
    <section id="album" ref={ref} className="relative bg-white pt-28 lg:pt-40 pb-32 lg:pb-44 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <motion.div {...up(0)}><Eyebrow center>The Album</Eyebrow></motion.div>
        <motion.h2 {...up(0.1)} className="serif text-[clamp(2.6rem,7vw,6.5rem)] leading-[1]">Moments worth <span className="italic gold-text">remembering</span></motion.h2>
        <motion.p {...up(0.2)} className="mt-5 text-[#2A2036]/70 font-light max-w-md mx-auto">Rooms, dining, the banquet hall and more — explore all {GALLERY.length} photographs.</motion.p>
      </div>
      <div className="relative h-[22rem] lg:h-[27rem] mt-16 flex items-center justify-center">
        {FAN.map((_, i) => <FanCard key={i} i={i} open={open} desk={desk} />)}
      </div>
      <div className="relative z-20 -mt-10 lg:-mt-12 flex justify-center">
        <Magnetic>
          <a href="#gallery" className="group relative flex items-center justify-center w-36 h-36 lg:w-44 lg:h-44 rounded-full bg-[#2A2036] text-white shadow-[0_30px_60px_-20px_rgba(60,40,10,.6)] hover:bg-[#B8975A] transition-colors duration-500">
            <svg viewBox="0 0 200 200" className="absolute inset-0 spin-slow" style={{ animationDuration: "18s" }}>
              <defs><path id="gc" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" /></defs>
              <text fontSize="13" fill="#f0dcaa" textLength="446" lengthAdjust="spacing"><textPath href="#gc" textLength="446" lengthAdjust="spacing">VIEW GALLERY · 26 PHOTOS · VIEW GALLERY · </textPath></text>
            </svg>
            <span className="text-4xl transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
          </a>
        </Magnetic>
      </div>
    </section>
  );
}

/* ---------- booking page ---------- */
const CFG = window.LPH_CONFIG || {};
const MAP_URL = "https://www.google.com/maps/search/?api=1&query=Lavender+Plaza+Hotel+Al+Nahda+Dubai";
const BL = {
  en: { dir: "ltr", home: "Home page", info: "Information", map: "Show on map", member: "Member Login", welcome: "Welcome, Guest", eb: "Reservations", t1: "Reserve your", t2: "stay", sub: "Choose your dates and tell us who is travelling. We will take care of the rest.", dates: "Select Dates", arrival: "Arrival", departure: "Departure", nights: "Overnights", persons: "Persons", request: "Request Room", steps: ["Dates & guests", "Choose a room", "Your details"], pick: "Choose your room", pickSub: "Every room has a private bathroom, air conditioning, free WiFi and a pool with a view.", select: "Select this room", back: "Back", sel: "Selected", details: "Your details", name: "Full name", email: "Email", phone: "Phone (optional)", notes: "Special requests (optional)", send: "Send request", summary: "Your stay", room: "Room", guests: "Guests", night: "night", nightsW: "nights", anyRoom: "Any room", thanksT: "Thank you", thanksS: "Your room request is ready. Send it to the hotel with one of the options below.", copy: "Copy request", copied: "Copied", emailBtn: "Send by email", wa: "Send on WhatsApp", newReq: "Start a new request", req: "Please check this field", infoT: "Hotel information", addr: "Address", near: "Nearby", facil: "Facilities", rooms: "141 guest rooms and suites", close: "Close", loginT: "Member Login", member2: "Member / Email", pass: "Password", login: "LOGIN", fb: "Login with Facebook", gg: "Sign in with Google", em: "Continue with email", soon: "Member login is not available yet. You can still send a room request.", pickA: "Choose your arrival date", pickD: "Now choose your departure date", currency: "Currency", top: "Top currencies", all: "All currencies" },
  ar: { dir: "rtl", home: "الصفحة الرئيسية", info: "معلومات", map: "عرض على الخريطة", member: "تسجيل دخول الأعضاء", welcome: "مرحباً بك", eb: "الحجوزات", t1: "احجز", t2: "إقامتك", sub: "اختر التواريخ وأخبرنا بعدد المسافرين وسنتولى الباقي.", dates: "اختر التواريخ", arrival: "الوصول", departure: "المغادرة", nights: "عدد الليالي", persons: "الأشخاص", request: "اطلب غرفة", steps: ["التواريخ والضيوف", "اختر الغرفة", "بياناتك"], pick: "اختر غرفتك", pickSub: "تضم كل غرفة حماماً خاصاً وتكييفاً وواي فاي مجاني وإطلالة على المسبح.", select: "اختر هذه الغرفة", back: "رجوع", sel: "تم الاختيار", details: "بياناتك", name: "الاسم الكامل", email: "البريد الإلكتروني", phone: "الهاتف (اختياري)", notes: "طلبات خاصة (اختياري)", send: "إرسال الطلب", summary: "إقامتك", room: "الغرفة", guests: "الضيوف", night: "ليلة", nightsW: "ليالٍ", anyRoom: "أي غرفة", thanksT: "شكراً لك", thanksS: "طلب الغرفة جاهز. أرسله إلى الفندق بإحدى الطرق أدناه.", copy: "نسخ الطلب", copied: "تم النسخ", emailBtn: "إرسال بالبريد الإلكتروني", wa: "إرسال عبر واتساب", newReq: "طلب جديد", req: "يرجى التحقق من هذا الحقل", infoT: "معلومات الفندق", addr: "العنوان", near: "على مقربة", facil: "المرافق", rooms: "141 غرفة وجناحاً", close: "إغلاق", loginT: "تسجيل دخول الأعضاء", member2: "العضو / البريد الإلكتروني", pass: "كلمة المرور", login: "تسجيل الدخول", fb: "الدخول عبر فيسبوك", gg: "الدخول عبر جوجل", em: "المتابعة بالبريد الإلكتروني", soon: "تسجيل دخول الأعضاء غير متاح حالياً. يمكنك إرسال طلب غرفة.", pickA: "اختر تاريخ الوصول", pickD: "الآن اختر تاريخ المغادرة", currency: "العملة", top: "أهم العملات", all: "كل العملات" },
};
const ROOM_OPTS = [
  { k: "king", n: "Deluxe Double Room with Sea View", ar: "غرفة ديلوكس مزدوجة مع إطلالة على البحر", img: "kingA", f: ["26 m²", "1 king bed", "2 adults + 1 child"], fa: ["26 م²", "سرير كينج", "بالغان + طفل"] },
  { k: "twin", n: "Deluxe Twins Room with Sea View", ar: "غرفة ديلوكس توين (سريران) مع إطلالة على البحر", img: "twinB", f: ["26 m²", "2 twin beds", "2 adults + 1 child"], fa: ["26 م²", "سريران منفصلان", "بالغان + طفل"] },
  { k: "junior", n: "One Bedroom Junior Suite Room", ar: "جناح جونيور بغرفة نوم واحدة", img: "juniorA", f: ["48 m², living & dining area", "2 bathrooms", "1 king bed"], fa: ["48 م²، غرفة معيشة وطعام", "حمامان", "سرير كينج"] },
  { k: "suite", n: "One Bedroom Executive Suite Sea View", ar: "جناح تنفيذي بغرفة نوم واحدة مع إطلالة على البحر", img: "execB", f: ["50 m², living & dining area", "2 bathrooms", "1 king bed"], fa: ["50 م²، غرفة معيشة وطعام", "حمامان", "سرير كينج"] },
];
const CURR_TOP = [["EUR", "Euro (€)"], ["USD", "US Dollar (US$)"], ["CAD", "Canadian Dollar (CAD)"], ["AUD", "Australian Dollar (AUD)"], ["GBP", "British Pound Sterling (£)"], ["JPY", "Japanese Yen (¥)"]];
const CURR_ALL = [["AED", "United Arab Emirates Dirham (AED)"], ["ANG", "Netherlands Antillean Guilder (ANG)"], ["ARS", "Argentine Peso (ARS)"], ["BHD", "Bahraini Dinar (BHD)"], ["BND", "Brunei Dollar (BND)"], ["BOB", "Bolivian Boliviano (BOB)"], ["BRL", "Brazilian Real (R$)"], ["BWP", "Botswanan Pula (BWP)"], ["CHF", "Swiss Franc (CHF)"], ["CLP", "Chilean Peso (CLP)"], ["CNY", "Chinese Yuan (CNY)"], ["EGP", "Egyptian Pound (EGP)"], ["INR", "Indian Rupee (INR)"], ["KWD", "Kuwaiti Dinar (KWD)"], ["OMR", "Omani Rial (OMR)"], ["PKR", "Pakistani Rupee (PKR)"], ["QAR", "Qatari Riyal (QAR)"], ["SAR", "Saudi Riyal (SAR)"]];
const BI = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  pin: <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  chev: <path d="M6 9l6 6 6-6" />, check: <path d="M5 13l4 4 10-10" />, close: <path d="M6 6l12 12M18 6L6 18" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></>, home: <path d="M3 11l9-8 9 8M5 10v10h14V10" />,
};
const Ic = ({ n, s = 18 }) => <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{BI[n]}</svg>;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const parseISO = (s) => { if (!s || typeof s !== "string") return null; const p = s.split("-").map(Number); if (p.length !== 3) return null; const x = new Date(p[0], p[1] - 1, p[2]); return isNaN(x.getTime()) ? null : x; };
function heroGo() {
  const v = (id) => (document.getElementById(id) || {}).value || "";
  const g = v("hb-guests");
  window.__bkPrefill = { arrival: v("hb-in"), departure: v("hb-out"), persons: /^Family/.test(g) ? 4 : parseInt(g, 10) || 2 };
  if (window.__lphNavigate) window.__lphNavigate("booking");
}

function DD({ trigger, children, panelClass = "", align = "left" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", f); document.addEventListener("touchstart", f); window.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", f); document.removeEventListener("touchstart", f); window.removeEventListener("keydown", k); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="block w-full">{trigger(open)}</button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, transition: { duration: 0.14, ease } }} transition={{ duration: 0.22, ease }} style={{ transformOrigin: align === "right" ? "top right" : "top left" }} className={"absolute z-40 mt-2 " + (align === "right" ? "right-0 " : "left-0 ") + panelClass}>
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
const fieldBox = "flex items-center justify-between w-full rounded-xl bg-white border border-[#B8975A]/30 px-5 py-4 text-left hover:border-[#B8975A] transition-colors";
const optCls = (on) => "block w-full text-left px-5 py-2.5 text-sm transition-colors " + (on ? "bg-[#F8F3E9] text-[#8a6d38] font-semibold" : "hover:bg-[#F8F3E9]");
const panelBox = "bg-white rounded-2xl shadow-[0_30px_70px_-25px_rgba(60,40,10,.45)] border border-[#B8975A]/25 py-2";
const Chev = ({ open }) => <span className={"inline-block transition-transform duration-300 " + (open ? "rotate-180" : "")}><Ic n="chev" s={16} /></span>;

function BCalendar({ lang, arrival, departure, hint, onPick }) {
  const loc = lang === "ar" ? "ar-AE" : "en-GB";
  const today = startOfDay(new Date());
  const [view, setView] = useState(new Date(arrival.getFullYear(), arrival.getMonth(), 1));
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  const wk = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(loc, { weekday: "narrow" }));
  const canPrev = first > new Date(today.getFullYear(), today.getMonth(), 1);
  const go = (n) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button type="button" disabled={!canPrev} onClick={() => go(-1)} aria-label="Previous month" className="w-9 h-9 rounded-full text-xl hover:bg-[#F8F3E9] disabled:opacity-30">‹</button>
        <AnimatePresence mode="wait"><motion.div key={view.getTime()} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="serif text-lg">{view.toLocaleDateString(loc, { month: "long", year: "numeric" })}</motion.div></AnimatePresence>
        <button type="button" onClick={() => go(1)} aria-label="Next month" className="w-9 h-9 rounded-full text-xl hover:bg-[#F8F3E9]">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] tracking-[0.15em] uppercase text-[#8a6d38] mb-1">{wk.map((w, i) => <span key={i}>{w}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const past = d < today, isA = sameDay(d, arrival), isD = sameDay(d, departure), inR = d > arrival && d < departure;
          return <button key={i} type="button" disabled={past} onClick={() => onPick(d)} className={"h-10 rounded-full text-sm transition-colors " + (isA || isD ? "bg-[#B8975A] text-white font-semibold" : inR ? "bg-[#F1E8D6]" : past ? "text-[#2A2036]/25" : "hover:bg-[#F8F3E9]")}>{d.getDate()}</button>;
        })}
      </div>
      <div className="mt-3 text-center text-[11px] tracking-[0.15em] uppercase text-[#8a6d38]">{hint}</div>
    </div>
  );
}

function DateTile({ label, date, lang, active, onClick }) {
  const loc = lang === "ar" ? "ar-AE" : "en-GB";
  return (
    <motion.button type="button" onClick={onClick} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} className={"rounded-2xl text-center py-5 px-3 border transition-colors duration-300 " + (active ? "bg-white border-[#B8975A] shadow-[0_18px_40px_-20px_rgba(184,151,90,.7)]" : "bg-[#F8F3E9] border-transparent hover:border-[#B8975A]/50")}>
      <div className="text-[11px] tracking-[0.3em] uppercase text-[#7d5f27]">{label}</div>
      <div className="mx-auto my-2 h-px w-10 bg-[#B8975A]/40" />
      <div className="text-sm text-[#2A2036]/70">{date.toLocaleDateString(loc, { weekday: "long" })}</div>
      <AnimatePresence mode="wait"><motion.div key={date.getTime()} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.25 }} className="serif text-6xl leading-none gold-text my-1">{date.getDate()}</motion.div></AnimatePresence>
      <div className="text-sm text-[#2A2036]/70">{date.toLocaleDateString(loc, { month: "short", year: "numeric" })}</div>
    </motion.button>
  );
}

function Modal({ onClose, title, dir, children }) {
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    const prev = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.documentElement.style.overflow = prev; };
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={onClose} className="fixed inset-0 z-[105] bg-[#2A2036]/45 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <motion.div dir={dir} initial={{ y: 40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.5, ease }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md my-8 bg-white rounded-3xl p-7 sm:p-9 shadow-[0_50px_100px_-30px_rgba(0,0,0,.5)]">
        <div className="flex items-center justify-between pb-4 border-b border-[#B8975A]/30">
          <h3 className="serif text-2xl gold-text">{title}</h3>
          <motion.button whileHover={{ rotate: 90 }} onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full hover:bg-[#F8F3E9] flex items-center justify-center"><Ic n="close" s={20} /></motion.button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

const FbIcon = ({ s = 26 }) => <svg viewBox="0 0 48 48" width={s} height={s} aria-hidden="true"><path fill="#3F51B5" d="M42 37c0 2.762-2.238 5-5 5H11c-2.761 0-5-2.238-5-5V11c0-2.762 2.239-5 5-5h26c2.762 0 5 2.238 5 5v26z" /><path fill="#FFF" d="M34.368 25H31v13h-5V25h-3v-4h3v-2.41c.002-3.508 1.459-5.59 5.592-5.59H35v4h-2.287C31.104 17 31 17.6 31 18.723V21h4l-.632 4z" /></svg>;
const GoogleIcon = ({ s = 26 }) => <svg viewBox="0 0 48 48" width={s} height={s} aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" /><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" /><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" /><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" /></svg>;
const GmailIcon = ({ s = 26 }) => <svg viewBox="0 0 48 48" width={s} height={s} aria-hidden="true"><path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.05v21h7c1.657 0 3-1.343 3-3V16.2z" /><path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V45H6c-1.657 0-3-1.343-3-3V16.2z" /><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" /><path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.877 8.859A4.298 4.298 0 0 0 7.298 8C4.924 8 3 9.924 3 12.298z" /><path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.123-2.341A4.298 4.298 0 0 1 40.702 8C43.076 8 45 9.924 45 12.298z" /></svg>;

Object.assign(BL.en, { tabLogin: "Login", tabReg: "Register", forgot: "Forgot password?", remember: "Remember me", show: "Show", hide: "Hide", create: "Create account", confirm: "Confirm password", fullName: "Full name", orWith: "or continue with", badEmail: "Enter a valid email address", badPass: "Password must be at least 6 characters", noMatch: "Passwords do not match", needName: "Please enter your name", soon2: "Member accounts are coming soon. For now you can send a room request as a guest.", guest: "Continue as guest", forgotMsg: "Password reset will be available when member accounts go live.", loginSub: "Sign in to manage your stays.", regSub: "Create a member account in a minute." });
Object.assign(BL.ar, { tabLogin: "تسجيل الدخول", tabReg: "إنشاء حساب", forgot: "هل نسيت كلمة المرور؟", remember: "تذكرني", show: "إظهار", hide: "إخفاء", create: "إنشاء حساب", confirm: "تأكيد كلمة المرور", fullName: "الاسم الكامل", orWith: "أو تابع باستخدام", badEmail: "أدخل بريداً إلكترونياً صحيحاً", badPass: "يجب ألا تقل كلمة المرور عن 6 أحرف", noMatch: "كلمتا المرور غير متطابقتين", needName: "يرجى إدخال اسمك", soon2: "حسابات الأعضاء ستتوفر قريباً. يمكنك الآن إرسال طلب غرفة كضيف.", guest: "المتابعة كضيف", forgotMsg: "ستتوفر إعادة تعيين كلمة المرور عند إطلاق حسابات الأعضاء.", loginSub: "سجّل الدخول لإدارة إقاماتك.", regSub: "أنشئ حساب عضو في دقيقة." });

const readMember = () => { try { return JSON.parse(window.localStorage.getItem("lph_member") || "null"); } catch (e) { return null; } };
const writeMember = (m) => { try { if (m) window.localStorage.setItem("lph_member", JSON.stringify(m)); else window.localStorage.removeItem("lph_member"); } catch (e) {} };
const loadScript = (src) => new Promise((res, rej) => { if (document.querySelector('script[src="' + src + '"]')) { res(); return; } const s = document.createElement("script"); s.src = src; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
Object.assign(BL.en, { noSocial: "Sign-in with this option is not available yet. You can still send a room request as a guest.", signFail: "Sign-in could not be completed. Please try again.", logout: "Log out" });
Object.assign(BL.ar, { noSocial: "تسجيل الدخول بهذه الطريقة غير متاح حالياً. يمكنك إرسال طلب غرفة كضيف.", signFail: "تعذّر إكمال تسجيل الدخول. حاول مرة أخرى.", logout: "تسجيل الخروج" });

Object.assign(BL.en, { qSub: "Enter your email and we will save your details on this device, so booking is faster.", qName: "Your name (optional)", qContinue: "Continue", soonPill: "Soon" });
Object.assign(BL.ar, { qSub: "أدخل بريدك الإلكتروني وسنحفظ بياناتك على هذا الجهاز لتسريع الحجز.", qName: "اسمك (اختياري)", qContinue: "متابعة", soonPill: "قريباً" });

const MailIcon = ({ s = 24 }) => <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="#2A2036" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
Object.assign(BL.en, { gm: "Continue with Gmail", noSocial: "This sign-in is coming soon. You can continue with your email above." });
Object.assign(BL.ar, { gm: "المتابعة عبر Gmail", noSocial: "طريقة الدخول هذه ستتوفر قريباً. يمكنك المتابعة ببريدك الإلكتروني أعلاه." });

function SocialBtn({ icon, label, onClick, disabled, soon, soonText, hint }) {
  return (
    <motion.button type="button" onClick={soon ? undefined : onClick} disabled={disabled} title={soon ? hint : undefined} aria-disabled={soon ? true : undefined}
      whileHover={soon ? {} : { y: -2, boxShadow: "0 16px 30px -18px rgba(100,75,30,.55)" }} whileTap={soon ? {} : { scale: 0.98 }}
      className={"w-full flex items-center gap-4 rounded-xl bg-white border border-[#B8975A]/30 px-4 py-3 text-[14px] font-medium text-[#2A2036] transition-colors disabled:opacity-60 " + (soon ? "opacity-70 cursor-not-allowed" : "hover:border-[#B8975A]")}>
      <span className="w-9 h-9 shrink-0 flex items-center justify-center">{icon}</span>
      <span className="flex-1 text-center">{label}</span>
      {soon ? <span className="text-[11px] tracking-[0.2em] uppercase rounded-full bg-[#F8F3E9] text-[#8a6d38] px-2.5 py-1">{soonText}</span> : <span className="w-9" />}
    </motion.button>
  );
}

const API = CFG.authApi || "api/auth.php";
const apiPost = (body) => fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" }).then((r) => r.json());
Object.assign(BL.en, { joinSub: "Create your account in one tap with Gmail or Facebook. Your details will fill the booking form for you.", orEmail: "or use your email" });
Object.assign(BL.ar, { joinSub: "أنشئ حسابك بنقرة واحدة عبر Gmail أو فيسبوك. وستُملأ بياناتك تلقائياً في نموذج الحجز.", orEmail: "أو استخدم بريدك الإلكتروني" });

function LoginModal({ t, onClose, onMember }) {
  const [f, setF] = useState({ name: "", email: "" });
  const [er, setEr] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [srv, setSrv] = useState({});
  const emailRef = useRef(null);
  const gId = CFG.googleClientId || srv.googleClientId || "", fId = CFG.facebookAppId || srv.facebookAppId || "";
  const hasUrl = !!CFG.loginUrl;
  useEffect(() => { fetch(API + "?config=1").then((r) => r.json()).then((j) => { if (j && j.ok) setSrv(j); }).catch(() => {}); }, []);
  useEffect(() => { if (gId) loadScript("https://accounts.google.com/gsi/client").catch(() => {}); }, [gId]);
  useEffect(() => { if (fId) loadScript("https://connect.facebook.net/en_US/sdk.js").then(() => { if (window.FB) window.FB.init({ appId: fId, cookie: true, xfbml: false, version: "v19.0" }); }).catch(() => {}); }, [fId]);
  const done = (m) => { setBusy(false); writeMember(m); if (onMember) onMember(m); onClose(); };
  const viaServer = (action, access_token, fallback) => {
    apiPost({ action, access_token }).then((res) => {
      if (res && res.ok) done({ ...res.member, token: res.token, via: action });
      else { setBusy(false); setNote(t.signFail); }
    }).catch(() => { if (fallback) fallback(); else { setBusy(false); setNote(t.signFail); } });
  };
  const googleSignIn = () => {
    if (!(window.google && window.google.accounts && window.google.accounts.oauth2)) { setNote(t.signFail); return; }
    setBusy(true);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: gId, scope: "openid email profile",
      callback: (resp) => {
        if (!resp || !resp.access_token) { setBusy(false); setNote(t.signFail); return; }
        const local = () => fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: "Bearer " + resp.access_token } })
          .then((r) => r.json()).then((u) => done({ name: u.name || "", email: u.email || "", picture: u.picture || "", via: "google", local: true }))
          .catch(() => { setBusy(false); setNote(t.signFail); });
        viaServer("google", resp.access_token, local);
      },
      error_callback: () => { setBusy(false); setNote(t.signFail); },
    });
    client.requestAccessToken();
  };
  const facebookSignIn = () => {
    if (!window.FB) { setNote(t.signFail); return; }
    setBusy(true);
    window.FB.login((resp) => {
      if (!(resp && resp.authResponse)) { setBusy(false); return; }
      const local = () => window.FB.api("/me", { fields: "name,email,picture" }, (u) => {
        if (u && !u.error) done({ name: u.name || "", email: u.email || "", picture: (u.picture && u.picture.data && u.picture.data.url) || "", via: "facebook", local: true });
        else { setBusy(false); setNote(t.signFail); }
      });
      viaServer("facebook", resp.authResponse.accessToken, local);
    }, { scope: "public_profile,email" });
  };
  const social = (p) => {
    setNote("");
    if (p === "google" && gId) { googleSignIn(); return; }
    if (p === "facebook" && fId) { facebookSignIn(); return; }
    if (hasUrl) { window.open(CFG.loginUrl, "_blank", "noopener"); onClose(); }
  };
  const submit = (e) => {
    e.preventDefault();
    const em = f.email.trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) { setEr(t.badEmail); return; }
    done({ name: f.name.trim() || em.split("@")[0], email: em, picture: "", via: "email" });
  };
  const inp = (bad) => "w-full rounded-xl border bg-white text-[#2A2036] placeholder:text-[#2A2036]/70 px-4 py-3.5 text-[15px] outline-none transition-colors " + (bad ? "border-red-400" : "border-[#B8975A]/30 focus:border-[#B8975A]");
  const lbl = "block text-[11px] tracking-[0.2em] uppercase text-[#8a6d38] mb-2";
  return (
    <Modal onClose={onClose} title={t.loginT} dir={t.dir}>
      <div className="pt-5">
        <p className="text-sm leading-relaxed text-[#2A2036]/65">{t.joinSub}</p>
        <div className="mt-5 grid gap-3">
          <SocialBtn icon={<GmailIcon />} label={t.gm} onClick={() => social("google")} disabled={busy} soon={!gId && !hasUrl} soonText={t.soonPill} hint={t.noSocial} />
          <SocialBtn icon={<FbIcon />} label={t.fb} onClick={() => social("facebook")} disabled={busy} soon={!fId && !hasUrl} soonText={t.soonPill} hint={t.noSocial} />
        </div>
        {note && <div className="mt-4 rounded-xl bg-[#F8F3E9] px-4 py-3 text-sm text-[#8a6d38]">{note}</div>}
        <div className="flex items-center gap-3 py-5"><span className="h-px flex-1 bg-[#B8975A]/25" /><span className="text-[11px] tracking-[0.3em] uppercase text-[#7d5f27]">{t.orEmail}</span><span className="h-px flex-1 bg-[#B8975A]/25" /></div>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div><label className={lbl}>{t.qName}</label><input className={inp(false)} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></div>
          <div>
            <label className={lbl}>{t.email}</label>
            <input ref={emailRef} type="email" className={inp(er)} value={f.email} onChange={(e) => { setF({ ...f, email: e.target.value }); setEr(""); }} placeholder="name@email.com" autoComplete="email" />
            {er && <p className="mt-1.5 text-xs text-red-500">{er}</p>}
          </div>
          <motion.button type="submit" disabled={busy} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#2A2036] hover:bg-[#B8975A] transition-colors text-white py-4 text-[11px] tracking-[0.25em] uppercase disabled:opacity-70">{t.qContinue} →</motion.button>
        </form>
      </div>
    </Modal>
  );
}

function InfoModal({ t, onClose }) {
  return (
    <Modal onClose={onClose} title={t.infoT} dir={t.dir}>
      <div className="pt-6 space-y-5 text-sm leading-relaxed text-[#2A2036]/75">
        <div><div className="text-[11px] tracking-[0.3em] uppercase text-[#7d5f27] mb-1">{t.addr}</div>Lavender Plaza Hotel<br />Al Ittihad Road, Al Nahda, Dubai, United Arab Emirates</div>
        <div><div className="text-[11px] tracking-[0.3em] uppercase text-[#7d5f27] mb-1">{t.near}</div>Stadium Metro · 4.4 km · Al Nahda Metro · 4.2 km<br />Terminal 2, Dubai International Airport · 12 min<br />Al Mamzar Beach · 4 km · Dubai Frame · 13 km · Burj Khalifa · 17 km<br />Dubai World Trade Centre · 15 km · Expo Centre Sharjah · 10–15 min<br />Reservations: +971 50 757 8767 · Banquets: +971 55 137 0286<br />lavenderplazahotel@gmail.com</div>
        <div><div className="text-[11px] tracking-[0.3em] uppercase text-[#7d5f27] mb-2">{t.facil}</div>
          <div className="flex items-start gap-2 mb-2 font-medium text-[#2A2036]"><span className="text-[#7d5f27]">✦</span>{t.rooms}</div>
          <div className="grid gap-1.5">{FACILITIES.slice(1).map((f) => <div key={f} className="flex items-start gap-2"><span className="text-[#7d5f27]">✦</span>{f}</div>)}</div>
        </div>
        <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#B8975A] px-6 py-3 text-[11px] tracking-[0.2em] uppercase hover:bg-[#B8975A] hover:text-white transition-colors"><Ic n="pin" s={16} />{t.map}</a>
      </div>
    </Modal>
  );
}

function BSummary({ t, lang, arrival, departure, nights, persons, roomObj, cur }) {
  const loc = lang === "ar" ? "ar-AE" : "en-GB";
  const f = (d) => d.toLocaleDateString(loc, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const rows = [[t.arrival, f(arrival)], [t.departure, f(departure)], [t.nights, nights + " " + (nights === 1 ? t.night : t.nightsW)], [t.guests, persons], [t.room, roomObj ? (lang === "ar" ? roomObj.ar : roomObj.n) : t.anyRoom], [t.currency, cur]];
  return (
    <div className="rounded-2xl bg-[#F8F3E9] p-6">
      <div className="serif text-2xl mb-4">{t.summary}</div>
      <dl className="space-y-3 text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-[#B8975A]/20 pb-2"><dt className="text-[#8a6d38]">{k}</dt><dd className="font-medium text-end">{v}</dd></div>)}</dl>
    </div>
  );
}

function BookingPage({ member, onSignIn, onLogout, lang, setLang }) {
  const pre = useRef(null);
  if (pre.current === null) { pre.current = window.__bkPrefill || {}; window.__bkPrefill = null; }
  const p0 = pre.current;
  const today = startOfDay(new Date());
  const t = BL[lang];
  const [cur, setCur] = useState("AED");
  const [arrival, setArrival] = useState(() => { const d = parseISO(p0.arrival); return d && d >= today ? d : today; });
  const [departure, setDeparture] = useState(() => { const a = parseISO(p0.arrival); const d = parseISO(p0.departure); const base = a && a >= today ? a : today; return d && d > base ? d : addDays(base, 1); });
  const [persons, setPersons] = useState(() => { const n = parseInt(p0.persons, 10); return n >= 1 && n <= 4 ? n : 1; });
  const [room, setRoom] = useState(p0.room || null);
  const [step, setStep] = useState(1);
  const [cal, setCal] = useState(false);
  const [phase, setPhase] = useState("arrival");
  const [info, setInfo] = useState(false);
  const [form, setForm] = useState(() => { const m = readMember() || {}; return { name: m.name || "", email: m.email || "", phone: "", notes: "" }; });
  const [err, setErr] = useState({});
  const [copied, setCopied] = useState(false);
  const calRef = useRef(null), cardRef = useRef(null), first = useRef(true);
  const nights = Math.max(1, Math.round((departure - arrival) / 864e5));
  const roomObj = ROOM_OPTS.find((r) => r.k === room) || null;
  useEffect(() => { if (member) setForm((f) => ({ ...f, name: f.name || member.name || "", email: f.email || member.email || "" })); }, [member]);

  useEffect(() => {
    if (!cal) return;
    const f = (e) => { if (calRef.current && !calRef.current.contains(e.target)) setCal(false); };
    document.addEventListener("mousedown", f); document.addEventListener("touchstart", f);
    return () => { document.removeEventListener("mousedown", f); document.removeEventListener("touchstart", f); };
  }, [cal]);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (cardRef.current) window.scrollTo({ top: cardRef.current.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  }, [step]);

  const pick = (d) => {
    if (phase === "arrival" || d <= arrival) { setArrival(d); setDeparture(addDays(d, 1)); setPhase("departure"); }
    else { setDeparture(d); setPhase("arrival"); setCal(false); }
  };
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!form.name.trim()) er.name = true;
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) er.email = true;
    setErr(er);
    if (Object.keys(er).length === 0) setStep(4);
  };
  const dl = (d) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const text = ["Room request - Lavender Plaza Hotel", "", "Arrival: " + dl(arrival), "Departure: " + dl(departure), "Nights: " + nights, "Guests: " + persons, "Room: " + (roomObj ? roomObj.n : "Any room"), "Currency: " + cur, "", "Name: " + form.name, "Email: " + form.email, form.phone ? "Phone: " + form.phone : null, form.notes ? "Notes: " + form.notes : null].filter((x) => x !== null).join("\n");
  const copy = () => { try { navigator.clipboard.writeText(text); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const reset = () => { setStep(1); setRoom(null); setForm({ name: "", email: "", phone: "", notes: "" }); setErr({}); };
  const mail = CFG.bookingEmail ? "mailto:" + CFG.bookingEmail + "?subject=" + encodeURIComponent("Room request - " + form.name) + "&body=" + encodeURIComponent(text) : null;
  const wa = CFG.whatsapp ? "https://wa.me/" + String(CFG.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent(text) : null;
  const inputCls = (bad) => "mt-2 w-full rounded-xl border bg-white text-[#2A2036] placeholder:text-[#2A2036]/70 px-4 py-3.5 text-[15px] outline-none transition-colors " + (bad ? "border-red-400 bg-red-50/40" : "border-[#B8975A]/30 focus:border-[#B8975A]");
  const lbl = "block text-[11px] tracking-[0.2em] uppercase text-[#8a6d38]";
  const stepsDone = step === 4;

  return (
    <section dir={t.dir} className="relative min-h-[100svh] pt-[104px] pb-24 overflow-hidden" style={{ background: "linear-gradient(180deg,#F8F3E9 0%,#fff 55%)" }}>
      <div aria-hidden="true" className="drift-b absolute -right-32 top-20 w-[30rem] h-[30rem] rounded-full opacity-60 pointer-events-none" style={{ background: "radial-gradient(circle,#ecdcb4,transparent 65%)" }} />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="relative z-30 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl bg-white/80 backdrop-blur-md border border-[#B8975A]/20 px-4 sm:px-6 py-3 text-[12px] sm:text-[13px]">
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="#" className="flex items-center gap-2 font-medium hover:text-[#7d5f27] transition-colors"><Ic n="home" s={17} />{t.home}</a>
            <button type="button" onClick={() => setInfo(true)} className="flex items-center gap-2 font-medium hover:text-[#7d5f27] transition-colors"><Ic n="info" s={17} />{t.info}</button>
            <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium hover:text-[#7d5f27] transition-colors"><Ic n="pin" s={17} />{t.map}</a>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            {member ? (
              <div className="flex items-center gap-2 text-[#8a6d38] font-medium">
                {member.picture ? <img src={member.picture} alt="" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" /> : <Ic n="user" s={17} />}
                <span className="hidden sm:inline max-w-[9rem] truncate">{member.name ? member.name.split(" ")[0] : member.email}</span>
                <button type="button" onClick={onLogout} className="underline underline-offset-4 hover:text-[#7d5f27] transition-colors">{t.logout}</button>
              </div>
            ) : (
              <button type="button" onClick={onSignIn} className="flex items-center gap-2 text-[#8a6d38] font-medium hover:text-[#7d5f27] transition-colors"><Ic n="user" s={17} /><span className="hidden sm:inline">{t.welcome} ·</span> {t.member}</button>
            )}
            <div className="w-24 sm:w-28">
              <DD align="right" panelClass={"w-72 max-h-72 overflow-y-auto " + panelBox} trigger={(o) => <span className="flex items-center justify-between gap-2 rounded-lg border border-[#B8975A]/30 px-3 py-2 font-medium text-[#8a6d38] hover:border-[#B8975A]"><span>{cur}</span><Chev open={o} /></span>}>
                {(close) => (<div>
                  <div className="px-5 pt-2 pb-1 text-[11px] tracking-[0.3em] uppercase text-[#7d5f27]">{t.top}</div>
                  {CURR_TOP.map(([c, n]) => <button key={c} type="button" onClick={() => { setCur(c); close(); }} className={optCls(c === cur)}>{n}</button>)}
                  <div className="px-5 pt-3 pb-1 text-[11px] tracking-[0.3em] uppercase text-[#7d5f27]">{t.all}</div>
                  {CURR_ALL.map(([c, n]) => <button key={c} type="button" onClick={() => { setCur(c); close(); }} className={optCls(c === cur)}>{n}</button>)}
                </div>)}
              </DD>
            </div>
            <div className="w-28">
              <DD align="right" panelClass={"w-40 " + panelBox} trigger={(o) => <span className="flex items-center justify-between gap-2 rounded-lg border border-[#B8975A]/30 px-3 py-2 font-medium text-[#8a6d38] hover:border-[#B8975A]"><span>{lang === "ar" ? "العربية" : "English"}</span><Chev open={o} /></span>}>
                {(close) => [["en", "English"], ["ar", "العربية"]].map(([k, n]) => <button key={k} type="button" onClick={() => { setLang(k); close(); }} className={optCls(k === lang)}>{n}</button>)}
              </DD>
            </div>
          </div>
        </motion.div>

        <div className="text-center mt-14 mb-10">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}><Eyebrow center>{t.eb}</Eyebrow></motion.div>
          <h1 className="serif text-[clamp(2.6rem,7vw,5.5rem)] leading-[1.02]">
            <motion.span initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 1, ease }} className="inline-block">{t.t1}</motion.span>{" "}
            <motion.span initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, duration: 1, ease }} className="inline-block italic gold-text">{t.t2}</motion.span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.9, ease }} className="mt-5 text-[#2A2036]/70 font-light max-w-lg mx-auto">{t.sub}</motion.p>
        </div>

        <motion.div ref={cardRef} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1, ease }} className="bg-white rounded-3xl border border-[#B8975A]/20 shadow-[0_40px_90px_-45px_rgba(100,75,30,.5)] p-5 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3 mb-8">
            {t.steps.map((s, i) => {
              const n = i + 1, done = step > n || stepsDone, on = step === n;
              return (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-3">
                    <span className={"w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm lx-tr duration-500 " + (done ? "bg-[#B8975A] text-white" : on ? "bg-[#2A2036] text-white" : "bg-[#F8F3E9] text-[#8a6d38]")}>{done ? <Ic n="check" s={16} /> : n}</span>
                    <span className={"hidden sm:block text-[11px] tracking-[0.2em] uppercase " + (on ? "text-[#2A2036]" : "text-[#2A2036]/70")}>{s}</span>
                  </div>
                  {i < 2 && <div className="flex-1 h-px bg-[#B8975A]/25 overflow-hidden"><motion.div className="h-full bg-[#B8975A] origin-left" animate={{ scaleX: step > n ? 1 : 0 }} transition={{ duration: 0.8, ease }} /></div>}
                </React.Fragment>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease }}>
              {step === 1 && (
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                  <div className="lg:col-span-7" ref={calRef}>
                    <div className="relative">
                      <div className="text-[11px] tracking-[0.3em] uppercase text-[#7d5f27] mb-4 font-medium">{t.dates}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <DateTile label={t.arrival} date={arrival} lang={lang} active={cal && phase === "arrival"} onClick={() => { setPhase("arrival"); setCal(true); }} />
                        <DateTile label={t.departure} date={departure} lang={lang} active={cal && phase === "departure"} onClick={() => { setPhase("departure"); setCal(true); }} />
                      </div>
                      <AnimatePresence>
                        {cal && (
                          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease }} className="absolute z-30 left-0 right-0 mt-3 sm:max-w-[23rem] bg-white rounded-2xl shadow-[0_30px_70px_-25px_rgba(60,40,10,.45)] border border-[#B8975A]/25 p-4">
                            <BCalendar lang={lang} arrival={arrival} departure={departure} hint={phase === "arrival" ? t.pickA : t.pickD} onPick={pick} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="mt-3">
                      <DD panelClass={"w-full max-h-64 overflow-y-auto " + panelBox} trigger={(o) => <span className={fieldBox}><span className="text-sm font-medium">{t.nights}</span><span className="flex items-center gap-2 font-semibold">{nights}<Chev open={o} /></span></span>}>
                        {(close) => Array.from({ length: 30 }, (_, i) => i + 1).map((n) => <button key={n} type="button" onClick={() => { setDeparture(addDays(arrival, n)); close(); }} className={optCls(n === nights)}>{n}</button>)}
                      </DD>
                    </div>
                  </div>
                  <div className="lg:col-span-5 flex flex-col gap-4 lg:pt-9">
                    <DD panelClass={"w-full " + panelBox} trigger={(o) => <span className={fieldBox}><span className="text-sm font-medium">{t.persons}</span><span className="flex items-center gap-2 font-semibold">{persons}<Chev open={o} /></span></span>}>
                      {(close) => [1, 2, 3, 4].map((n) => <button key={n} type="button" onClick={() => { setPersons(n); close(); }} className={optCls(n === persons)}>{n}</button>)}
                    </DD>
                    <motion.button type="button" onClick={() => setStep(2)} whileHover={{ scale: 1.03, boxShadow: "0 24px 50px -16px rgba(184,151,90,.7)" }} whileTap={{ scale: 0.97 }} className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#B8975A] to-[#d8bd85] text-white py-5 text-[12px] tracking-[0.25em] uppercase font-medium"><Ic n="search" s={20} />{t.request}</motion.button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="serif text-3xl lg:text-4xl">{t.pick}</h2>
                  <p className="mt-2 text-[#2A2036]/70 font-light max-w-2xl">{t.pickSub}</p>
                  <div className="mt-8 grid md:grid-cols-3 gap-4 lg:gap-6">
                    {ROOM_OPTS.map((r, i) => (
                      <motion.div key={r.k} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.12, duration: 0.8, ease }} whileHover={{ y: -8 }} className={"group rounded-2xl overflow-hidden border bg-white transition-shadow duration-500 " + (room === r.k ? "border-[#B8975A] shadow-[0_30px_60px_-30px_rgba(184,151,90,.7)]" : "border-[#B8975A]/20")}>
                        <div className="h-48 overflow-hidden"><img loading="lazy" src={IMG[r.img]} alt={r.n} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
                        <div className="p-5">
                          <div className="serif text-2xl">{lang === "ar" ? r.ar : r.n}</div>
                          <ul className="mt-3 space-y-1.5 text-sm text-[#2A2036]/70">{(lang === "ar" ? r.fa : r.f).map((x) => <li key={x} className="flex gap-2"><span className="text-[#7d5f27]">✦</span>{x}</li>)}</ul>
                          <button type="button" onClick={() => { setRoom(r.k); setStep(3); }} className={"mt-5 w-full rounded-xl py-3.5 text-[11px] tracking-[0.22em] uppercase transition-colors " + (room === r.k ? "bg-[#B8975A] text-white" : "bg-[#2A2036] text-white hover:bg-[#B8975A]")}>{room === r.k ? t.sel + " ✓" : t.select}</button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="mt-8 text-[11px] tracking-[0.25em] uppercase text-[#8a6d38] hover:text-[#7d5f27] transition-colors">← {t.back}</button>
                </div>
              )}

              {step === 3 && (
                <form onSubmit={submit} noValidate className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                  <div className="lg:col-span-7 space-y-5">
                    <h2 className="serif text-3xl lg:text-4xl">{t.details}</h2>
                    <div><label className={lbl}>{t.name}</label><input className={inputCls(err.name)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />{err.name && <p className="mt-1 text-xs text-red-500">{t.req}</p>}</div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div><label className={lbl}>{t.email}</label><input type="email" className={inputCls(err.email)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />{err.email && <p className="mt-1 text-xs text-red-500">{t.req}</p>}</div>
                      <div><label className={lbl}>{t.phone}</label><input type="tel" className={inputCls(false)} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /></div>
                    </div>
                    <div><label className={lbl}>{t.notes}</label><textarea rows="3" className={inputCls(false)} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                    <div className="flex flex-wrap items-center gap-5 pt-2">
                      <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl bg-gradient-to-r from-[#B8975A] to-[#d8bd85] text-white px-10 py-4 text-[12px] tracking-[0.25em] uppercase font-medium">{t.send}</motion.button>
                      <button type="button" onClick={() => setStep(2)} className="text-[11px] tracking-[0.25em] uppercase text-[#8a6d38] hover:text-[#7d5f27] transition-colors">← {t.back}</button>
                    </div>
                  </div>
                  <div className="lg:col-span-5"><BSummary t={t} lang={lang} arrival={arrival} departure={departure} nights={nights} persons={persons} roomObj={roomObj} cur={cur} /></div>
                </form>
              )}

              {step === 4 && (
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  <div className="lg:col-span-7 text-center lg:text-start">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.1 }} className="mx-auto lg:mx-0 w-20 h-20 rounded-full bg-[#B8975A] text-white flex items-center justify-center">
                      <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><motion.path d="M5 13l4 4 10-10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.7, ease }} /></svg>
                    </motion.div>
                    <h2 className="serif text-4xl lg:text-5xl mt-6">{t.thanksT}, <span className="italic gold-text">{form.name.split(" ")[0]}</span></h2>
                    <p className="mt-3 text-[#2A2036]/65 font-light max-w-md mx-auto lg:mx-0">{t.thanksS}</p>
                    <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
                      {mail && <Btn href={mail}>{t.emailBtn}</Btn>}
                      {wa && <Btn href={wa} solid={!mail}>{t.wa}</Btn>}
                      <Btn solid={!mail && !wa} href="#copy" onClick={(e) => { e.preventDefault(); copy(); }}>{copied ? t.copied + " ✓" : t.copy}</Btn>
                    </div>
                    <button type="button" onClick={reset} className="mt-8 text-[11px] tracking-[0.25em] uppercase text-[#8a6d38] hover:text-[#7d5f27] transition-colors">{t.newReq}</button>
                  </div>
                  <div className="lg:col-span-5"><BSummary t={t} lang={lang} arrival={arrival} departure={departure} nights={nights} persons={persons} roomObj={roomObj} cur={cur} /></div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      <AnimatePresence>{info && <InfoModal key="info" t={t} onClose={() => setInfo(false)} />}</AnimatePresence>
    </section>
  );
}


/* ---------- location & connectivity (from the factsheet) ---------- */
const LOCATION = [
  { t: "Government offices", r: [["Dubai Chamber of Commerce and Industry", "1.8 km · walking distance"], ["Dubai Municipality", "6.18 km"], ["Department of Tourism", "16 km"], ["Department of Economic Development", "6.7 km"], ["Amer", "Walking distance"], ["Tadbeer", "Walking distance"], ["Altwar Centre", "6.8 km"]] },
  { t: "Banks & corporate offices", r: [["Emirates Bank", "Walking distance"], ["National Bank of Dubai (NBD)", "1.9 km"], ["Etisalat", "3.5 km"]] },
  { t: "Healthcare", r: [["NMC Hospital", "1.7 km"], ["Zulekha Hospital", "7.7 km"]] },
  { t: "Metro access", r: [["Stadium Metro", "4.4 km"], ["Al Nahda Metro", "4.2 km"]] },
  { t: "Business hubs & key destinations", r: [["Dubai World Trade Centre", "15 km"], ["Knowledge Village", "35 km"], ["Media City", "37 km"], ["Internet City", "35 km"], ["Jebel Ali Free Zone", "64 km"], ["Expo Centre Sharjah", "10–15 min"], ["Dubai Exhibition Centre (Expo City Dubai)", "50 min"]] },
  { t: "Popular destinations", r: [["Dubai Frame", "13 km"], ["Future Museum", "15 km"], ["Global Village", "33 km"], ["Burj Khalifa", "17 km"], ["Al Mamzar Beach", "4 km"], ["Atlantis, The Palm", "36 km"], ["Dubai Marina", "35 km"]] },
];
function Location() {
  const up = (d = 0) => ({ initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { delay: d, duration: 0.8, ease } });
  return (
    <section id="location" className="lx-loc">
      <div className="lx-loc-in">
        <motion.div {...up(0)} className="lx-loc-head">
          <Eyebrow>Location &amp; Connectivity</Eyebrow>
          <h2 className="serif lx-loc-h">Distance to corporate offices <span className="italic gold-text">&amp; key destinations</span></h2>
          <p className="lx-loc-sub">Convenient access to business, government offices, healthcare and key destinations across Dubai.</p>
        </motion.div>
        <div className="lx-loc-grid">
          {LOCATION.map((g, i) => (
            <motion.div key={g.t} {...up(0.05 * (i % 2))} className="lx-loc-card">
              <h3 className="lx-loc-t">{g.t}</h3>
              <ul>{g.r.map(([n, d]) => <li key={n}><span>{n}</span><b>{d}</b></li>)}</ul>
            </motion.div>
          ))}
        </div>
        <motion.div {...up(0)} className="lx-loc-foot"><span className="serif">Lavender Plaza Hotel</span> · Al Nahda 1, Dubai, United Arab Emirates<i>Ideally located for business &amp; beyond</i></motion.div>
      </div>
    </section>
  );
}

/* ---------- footer ---------- */
function Footer({ page }) {
  return (
    <footer id="contact" className="relative bg-white pt-32 pb-8 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <Eyebrow center>Your comfort, our hospitality</Eyebrow>
        <motion.h2 initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1.1, ease }} className="serif text-[clamp(2.8rem,8.5vw,8rem)] leading-[1]">Come home to <span className="italic gold-text">Lavender Plaza</span></motion.h2>
        <div className="mt-12 flex flex-wrap justify-center gap-4">{page !== "booking" && <Magnetic><Btn href="#reserve">Book Your Stay</Btn></Magnetic>}{page === "home" ? <Btn solid={false} href="#gallery">View Gallery</Btn> : <Btn solid={false} href="#">Back to home</Btn>}</div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-24 grid md:grid-cols-3 gap-10 text-sm text-[#2A2036]/65">
        <div><img src={IMG.logo} alt="Lavender Plaza Hotel" className="h-28 w-auto mb-5 -ml-1" /><div className="text-[11px] tracking-[0.3em] uppercase text-[#7d5f27] mb-3">Find us</div><p>Al Nahda 1, Al Ittihad Road<br />Dubai, United Arab Emirates</p><div className="text-[11px] tracking-[0.3em] uppercase text-[#7d5f27] mt-6 mb-3">Reservations</div><p>Rooms: Ms. Reena Shehria<br /><a href="tel:+971507578767" className="hover:text-[#7d5f27]">+971 50 757 8767</a></p><p className="mt-3">Banquets: Mr. Sonu<br /><a href="tel:+971551370286" className="hover:text-[#7d5f27]">+971 55 137 0286</a></p><p className="mt-3"><a href="mailto:lavenderplazahotel@gmail.com" className="hover:text-[#7d5f27] break-all">lavenderplazahotel@gmail.com</a></p></div>
        <div><div className="text-[11px] tracking-[0.3em] uppercase text-[#7d5f27] mb-3">Explore</div>{NAV.map(([l, h]) => <a key={l} href={h} className="block hover:text-[#7d5f27] transition-colors">{l}</a>)}</div>
        <div><div className="text-[11px] tracking-[0.3em] uppercase text-[#7d5f27] mb-3">Nearby</div><p>Stadium Metro · 4.4 km<br />Al Nahda Metro · 4.2 km<br />Terminal 2, DXB · 12 min<br />Al Mamzar Beach · 4 km<br />Dubai Frame · 13 km<br />Burj Khalifa · 17 km<br />Dubai World Trade Centre · 15 km<br />Expo Centre Sharjah · 10–15 min</p></div>
      </div>
      <motion.div initial={{ y: 80, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease }} className="serif outline text-[11.5vw] leading-none text-center whitespace-nowrap mt-16 select-none hover:text-[#7d5f27]/20 transition-colors duration-700">Lavender Plaza</motion.div>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-6 border-t border-[#B8975A]/15 text-[11px] tracking-[0.2em] uppercase text-[#2A2036]/70 flex flex-wrap justify-between gap-3"><span>© 2026 Lavender Plaza Hotel</span><span>All rights reserved</span></div>
    </footer>
  );
}

function PageCurtain({ phase }) {
  const into = phase === "in";
  return (
    <motion.div key={phase} initial={{ y: into ? "100%" : "0%" }} animate={{ y: into ? "0%" : "-100%" }} transition={{ duration: 0.75, ease }} className="fixed inset-0 z-[110] bg-[#F8F3E9] flex items-center justify-center pointer-events-none">
      <motion.img src={IMG.logo} alt="" initial={{ opacity: into ? 0 : 1, scale: into ? 0.85 : 1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="h-28 w-auto" />
    </motion.div>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const [loader, setLoader] = useState(true);
  const initial = () => (window.location.hash === "#/gallery" ? "gallery" : window.location.hash === "#/booking" ? "booking" : "home");
  const [page, setPage] = useState(initial);
  const [phase, setPhase] = useState(null);
  const [member, setMember] = useState(readMember);
  const [login, setLogin] = useState(false);
  const [lang, setLang] = useState("en");
  const busy = useRef(false);
  const logout = () => { const m = readMember(); if (m && m.token) apiPost({ action: "logout", token: m.token }).catch(() => {}); writeMember(null); setMember(null); };
  useEffect(() => {
    const m = readMember();
    if (m && m.token) apiPost({ action: "me", token: m.token }).then((res) => {
      if (res && res.ok) { const nm = { ...m, ...res.member }; writeMember(nm); setMember(nm); }
      else if (res && res.error === "session") { writeMember(null); setMember(null); }
    }).catch(() => {});
  }, []);
  const pageRef = useRef(page); pageRef.current = page;

  const navigate = (to, anchor) => {
    if (busy.current) return; busy.current = true;
    setPhase("in");
    setTimeout(() => {
      setPage(to); if (to !== "booking") setLang("en"); window.scrollTo({ top: 0, behavior: "instant" });
      try { window.history.replaceState(null, "", to === "gallery" ? "#/gallery" : to === "booking" ? "#/booking" : "#"); } catch (e) {}
      setPhase("out");
      if (anchor) setTimeout(() => { const el = document.querySelector(anchor); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "instant" }); }, 150);
      setTimeout(() => { setPhase(null); busy.current = false; }, 850);
    }, 800);
  };

  useEffect(() => {
    window.__lphNavigate = (to) => { if (pageRef.current !== to) navigate(to); };
    const h = (e) => {
      if (e.defaultPrevented) return;
      const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
      const href = a.getAttribute("href"), cur = pageRef.current;
      if (href === "#gallery") { e.preventDefault(); if (cur !== "gallery") navigate("gallery"); else window.scrollTo({ top: 0, behavior: "smooth" }); }
      else if (href === "#reserve") { e.preventDefault(); if (cur !== "booking") navigate("booking"); else window.scrollTo({ top: 0, behavior: "smooth" }); }
      else if (cur !== "home") { e.preventDefault(); navigate("home", href === "#" ? null : href); }
    };
    document.addEventListener("click", h);
    return () => { document.removeEventListener("click", h); window.__lphNavigate = null; };
  }, []);

  useEffect(() => {
    const kick = () => window.dispatchEvent(new Event("resize"));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(kick);
    const id = setTimeout(kick, 3500); window.addEventListener("load", kick);
    return () => { clearTimeout(id); window.removeEventListener("load", kick); };
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    const a = setTimeout(() => setReady(true), 1500);
    const b = setTimeout(() => { setLoader(false); document.documentElement.style.overflow = ""; }, 2100);
    return () => { clearTimeout(a); clearTimeout(b); document.documentElement.style.overflow = ""; };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <div>
      <ProgressBar /><Cursor />
      {loader && <Loader />}
      <Header ready={ready} page={page} member={member} onSignIn={() => setLogin(true)} onLogout={logout} />
      {page === "home" ? <><Hero ready={ready} /><Route /><Statement /><UnderRoof /><Rooms /><Spaces /><GalleryTeaser /><Location /></> : page === "gallery" ? <Gallery /> : <BookingPage member={member} onSignIn={() => setLogin(true)} onLogout={logout} lang={lang} setLang={setLang} />}
      <Footer page={page} />
      <AnimatePresence>{login && <LoginModal key="login" t={BL[lang]} onClose={() => setLogin(false)} onMember={(m) => setMember(m)} />}</AnimatePresence>
      {phase && <PageCurtain phase={phase} />}
    </div>
    </MotionConfig>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
