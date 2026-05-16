import { useState, useEffect, useRef } from "react";
import {
  motion, AnimatePresence,
  useInView, useMotionValue, useSpring, useTransform,
} from "framer-motion";

// ── variants ─────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 18 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show:   { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 90, damping: 20 } },
};
const slideRight = {
  hidden: { opacity: 0, x: -20 },
  show:   { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
};
const stagger = (d = 0.08) => ({ hidden: {}, show: { transition: { staggerChildren: d } } });

// ── helpers ───────────────────────────────────────────
const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const SVC_ICONS = {
  "react-client":   { icon: "⚛", bg: "rgba(0,113,227,0.08)"  },
  "express-server": { icon: "🚀", bg: "rgba(52,199,89,0.08)"  },
  "nginx-proxy":    { icon: "🔀", bg: "rgba(255,159,10,0.08)" },
};

const TERM_LINES = [
  { type: "pr", cmd: "docker compose ps" },
  { type: "gr", txt: "NAME             STATUS     PORTS" },
  { type: "ok", txt: "express-server   Up         5000/tcp" },
  { type: "ok", txt: "react-client     Up         3000/tcp" },
  { type: "ok", txt: "nginx-proxy      Up         0.0.0.0:80->80/tcp" },
  { type: "pr", cmd: "curl -s localhost/api/health | jq" },
  { type: "in", txt: '{ "status": "healthy", "uptime": "2h 14m 9s" }' },
  { type: "pr", cmd: "docker stats --no-stream" },
  { type: "gr", txt: "CONTAINER     CPU %   MEM USAGE" },
  { type: "ok", txt: "react-client   0.01%   48.2MB / 15.7GB" },
  { type: "ok", txt: "express-srv    0.12%   72.8MB / 15.7GB" },
  { type: "ok", txt: "nginx-proxy    0.00%   6.1MB  / 15.7GB" },
  { type: "pr", cmd: "systemctl is-active nginx" },
  { type: "ok", txt: "active" },
  { type: "pr", cmd: "" },
];

const JOURNEY_STEPS = [
  { title: "React & Express Setup", desc: "Initialized Vite frontend and Express backend APIs.", cmd: "npm create vite@latest && npm init -y" },
  { title: "Proxy & CORS Configuration", desc: "Enabled cross-origin requests and local API proxying for seamless dev.", cmd: "app.use(cors())" },
  { title: "Dockerization", desc: "Wrote Dockerfiles for client & server for consistent environments.", cmd: "docker build -t react-client ." },
  { title: "Docker Compose Orchestration", desc: "Linked frontend, backend, and Nginx containers via internal network.", cmd: "docker compose up -d" },
  { title: "VPS & GitHub Actions CI/CD", desc: "Automated deployment pipeline to AWS EC2 on every push.", cmd: "git push origin main" },
  { title: "Nginx Reverse Proxy & SSL", desc: "Configured Let's Encrypt SSL and routed traffic to internal ports.", cmd: "certbot --nginx -d yourdomain.com" },
];

// ── AnimCounter ───────────────────────────────────────
function AnimCounter({ to, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv  = useMotionValue(0);
  const spr = useSpring(mv, { stiffness: 60, damping: 20 });
  const display = useTransform(spr, (v) => `${Math.round(v)}${suffix}`);
  useEffect(() => { if (inView) mv.set(to); }, [inView, to, mv]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

// ── ProgBar ───────────────────────────────────────────
function ProgBar({ label, value, colorClass }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div className="prog-row" ref={ref}>
      <div className="prog-header">
        <span className="prog-key">{label}</span>
        <span className="prog-pct">{value}%</span>
      </div>
      <div className="prog-track">
        <motion.div
          className={`prog-fill ${colorClass}`}
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : { width: 0 }}
          transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

// ── Terminal ──────────────────────────────────────────
function Terminal() {
  const [lines, setLines] = useState(0);
  const bodyRef = useRef(null);
  useEffect(() => {
    if (lines >= TERM_LINES.length) return;
    const delay = TERM_LINES[lines].type === "pr" ? 550 : 160;
    const t = setTimeout(() => setLines((v) => v + 1), delay);
    return () => clearTimeout(t);
  }, [lines]);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);
  return (
    <motion.div className="term-wrap" variants={scaleIn}>
      <div className="term-bar">
        <div className="td td-r" /><div className="td td-y" /><div className="td td-g" />
        <span className="term-title">production — bash</span>
      </div>
      <div className="term-body" ref={bodyRef}>
        {TERM_LINES.slice(0, lines).map((l, i) =>
          l.type === "pr"
            ? <div key={i}><span className="t-pr">ubuntu@vps:~$ </span><span className="t-cm">{l.cmd}</span></div>
            : <div key={i} className={`t-${l.type}`}>{l.txt}</div>
        )}
        {lines < TERM_LINES.length && <span className="t-cr" />}
      </div>
    </motion.div>
  );
}

// ── Section ───────────────────────────────────────────
function Section({ title, badge, children, id }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      id={id} className="section" ref={ref}
      initial="hidden" animate={inView ? "show" : "hidden"}
      variants={stagger(0.1)}
    >
      <motion.div className="section-head" variants={fadeUp}>
        <span className="section-label">{title}</span>
        {badge}
      </motion.div>
      {children}
    </motion.section>
  );
}

// ── StatStrip ─────────────────────────────────────────
function StatStrip({ services, deploys, metrics, health }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const items = [
    { label: "Services Healthy", to: services?.healthy ?? 0,         suffix: `/${services?.total ?? 3}`, color: "c-green",  sub: "All containers running" },
    { label: "Deployments",      to: deploys?.total    ?? 0,         suffix: "",                          color: "c-blue",   sub: `Success rate ${deploys?.successRate ?? "—"}` },
    { label: "Memory Used",      to: metrics?.memory.percent ?? 0,   suffix: "%",                         color: "c-purple", sub: metrics ? `${metrics.memory.used} / ${metrics.memory.total} GB` : "Loading…" },
    { label: "Server Uptime",    to: 0,                               suffix: "",                          color: "c-orange", sub: health?.environment ?? "production", raw: health?.uptime ?? "—" },
  ];
  return (
    <motion.div
      className="stats-grid" ref={ref}
      initial="hidden" animate={inView ? "show" : "hidden"}
      variants={stagger(0.1)}
    >
      {items.map(({ label, to, suffix, color, sub, raw }) => (
        <motion.div key={label} className="stat-card" variants={scaleIn}
          whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,0,0,0.1)" }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="stat-label">{label}</div>
          <div className={`stat-num ${color}`}>
            {raw ?? <AnimCounter to={to} suffix={suffix} />}
          </div>
          <div className="stat-sub">{sub}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Loader ────────────────────────────────────────────
function Loader() {
  return (
    <div className="loader">
      <motion.div className="loader-logo"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Deploii<span>.</span>
      </motion.div>
      <motion.div className="loader-track"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="loader-fill" />
      </motion.div>
      <motion.p className="loader-hint"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        Connecting to production environment…
      </motion.p>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────
function Dashboard({ health, metrics, services, deploys, stack, ping, pinging, err, doPing }) {
  return (
    <motion.div className="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
      {/* ambient orbs */}
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

      {/* NAVBAR */}
      <motion.nav className="navbar"
        initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        <div className="navbar-inner">
          <div className="logo-wrap">
            <motion.div className="logo-mark"
              whileHover={{ scale: 1.12, rotate: -6 }}
              transition={{ type: "spring", stiffness: 320, damping: 14 }}
            >D</motion.div>
            <span className="logo-name">Deploii <b>Dashboard</b></span>
          </div>
          <div className="nav-pills">
            {health && (
              <>
                <span className="pill pill-green"><span className="pill-dot pill-dot-live" />Live</span>
                <span className="pill pill-blue">v2.0.0</span>
                <span className="pill pill-purple">AWS EC2</span>
              </>
            )}
            {err && <span className="pill" style={{ borderColor: "rgba(255,59,48,.3)", color: "#ff3b30", background: "rgba(255,59,48,.08)" }}>Offline</span>}
          </div>
        </div>
      </motion.nav>

      {/* HERO */}
      <motion.section className="hero" initial="hidden" animate="show" variants={stagger(0.12)}>
        <motion.div className="hero-eyebrow" variants={fadeUp}>◈ Production Infrastructure</motion.div>
        <motion.h1 className="hero-title" variants={fadeUp}>
          Full-Stack Deployment<br /><span className="grad">on AWS EC2</span>
        </motion.h1>
        <motion.p className="hero-sub" variants={fadeUp}>
          React + Express + Nginx + Docker Compose,<br />shipped via GitHub Actions CI/CD.
        </motion.p>
        <motion.div className="hero-cta" variants={fadeUp}>
          <motion.button className="btn btn-primary" onClick={doPing} disabled={pinging}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 32px rgba(0,0,0,0.22)" }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          >
            {pinging ? "⏳ Pinging…" : "⚡ Ping Backend"}
          </motion.button>
          <motion.a className="btn btn-outline" href="https://github.com" target="_blank" rel="noreferrer"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          >
            ↗ View on GitHub
          </motion.a>
        </motion.div>
        <AnimatePresence mode="wait">
          {ping && (
            <motion.p key="ping" className="ping-result"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              {ping.ms !== null
                ? <><span className="ok">✓ {ping.msg}</span> — <b>{ping.ms}ms</b></>
                : <span className="err">✗ Request failed</span>}
            </motion.p>
          )}
          {err && (
            <motion.p key="err" className="ping-result" style={{ color: "var(--red)" }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              ⚠ {err}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.section>

      {/* STATS */}
      <StatStrip services={services} deploys={deploys} metrics={metrics} health={health} />

      {/* CONTAINER SERVICES */}
      <Section title="Container Services"
        badge={services && <span className="pill pill-green"><span className="pill-dot pill-dot-live" />{services.healthy} healthy</span>}
      >
        <motion.div className="grid-3" variants={stagger(0.1)}>
          {services
            ? services.services.map((svc) => {
                const ic = SVC_ICONS[svc.name] ?? { icon: "📦", bg: "rgba(0,0,0,0.06)" };
                return (
                  <motion.div key={svc.name} className="svc-card" variants={fadeUp}
                    whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,0,0,0.1)" }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <div className="svc-icon" style={{ background: ic.bg }}>{ic.icon}</div>
                    <div className="svc-info">
                      <div className="svc-name">{svc.name}</div>
                      <div className="svc-type">{svc.type}</div>
                    </div>
                    <div className="svc-right">
                      <span className="pill pill-green"><span className="pill-dot pill-dot-live" />{svc.status}</span>
                      <div className="svc-port">:{svc.port}</div>
                      <div className="svc-up">{svc.uptime}</div>
                    </div>
                  </motion.div>
                );
              })
            : <p style={{ color: "var(--text-4)", fontSize: 13 }}>Loading…</p>
          }
        </motion.div>
      </Section>

      {/* METRICS + TERMINAL */}
      <Section title="System Metrics & Live Terminal">
        <motion.div className="grid-2" variants={stagger(0.12)}>
          <motion.div className="card" variants={scaleIn}
            whileHover={{ boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span className="section-label" style={{ fontSize: 12 }}>Live Metrics</span>
              {metrics && <span className="pill pill-blue">{metrics.system.nodeVersion}</span>}
            </div>
            {metrics ? (
              <>
                <ProgBar label="CPU Usage"     value={metrics.cpu.usage}               colorClass="f-blue"   />
                <ProgBar label="Memory"         value={metrics.memory.percent}          colorClass="f-purple" />
                <ProgBar label="Load Avg (1m)"  value={parseFloat(metrics.network.loadAvg[0])} colorClass="f-green" />
                <motion.div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }} variants={stagger(0.07)}>
                  {[
                    ["Platform",     metrics.system.platform],
                    ["Architecture", metrics.cpu.architecture],
                    ["CPU Cores",    metrics.cpu.cores],
                    ["Hostname",     metrics.system.hostname],
                  ].map(([k, v]) => (
                    <motion.div key={k} className="info-chip" variants={fadeUp}>
                      <div className="ic-label">{k}</div>
                      <div className="ic-val">{v}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </>
            ) : <p style={{ color: "var(--text-4)", fontSize: 13 }}>Loading metrics…</p>}
          </motion.div>

          <motion.div variants={scaleIn}>
            <div style={{ marginBottom: 12 }}>
              <span className="section-label" style={{ fontSize: 12 }}>Live Terminal</span>
            </div>
            <Terminal />
          </motion.div>
        </motion.div>
      </Section>

      {/* CI/CD PIPELINE */}
      <Section title="CI/CD Pipeline"
        badge={deploys && <span className="pill pill-green">✓ {deploys.successRate} success</span>}
      >
        <motion.div variants={stagger(0.08)}>
          {deploys
            ? deploys.deployments.map((d) => (
                <motion.div key={d.id} className="pipe-row" variants={slideRight}
                  whileHover={{ x: 5, boxShadow: "0 10px 36px rgba(0,0,0,0.08)" }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <div className={`pipe-dot d-${d.status === "success" ? "ok" : "err"}`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pipe-commit">{d.commit}</div>
                    <div className="pipe-meta">
                      <span className="pipe-sha">{d.sha}</span>
                      <span>{d.branch}</span>
                      <span>{d.triggeredBy}</span>
                      <span>{timeAgo(d.timestamp)}</span>
                    </div>
                  </div>
                  <div className="pipe-steps">
                    {d.steps.map((s) => <span className="step" key={s}>✓ {s}</span>)}
                  </div>
                  <div className="pipe-dur">⏱ {d.duration}</div>
                </motion.div>
              ))
            : <p style={{ color: "var(--text-4)", fontSize: 13 }}>Loading…</p>
          }
        </motion.div>
      </Section>

      {/* PROJECT JOURNEY */}
      <Section title="Project Journey" badge={<span className="pill pill-blue">End-to-End</span>}>
        <motion.div variants={stagger(0.12)}>
          {JOURNEY_STEPS.map((step, i) => (
            <motion.div key={step.title} className="journey-row" variants={fadeUp}
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="j-line-wrap">
                <div className="j-dot">{i + 1}</div>
                <div className="j-line" />
              </div>
              <div className="j-content">
                <div className="j-title">{step.title}</div>
                <div className="j-desc">{step.desc}</div>
                <div className="j-cmd">&gt; {step.cmd}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* TECH STACK */}
      <Section title="Technology Stack">
        <motion.div className="card" variants={scaleIn}
          whileHover={{ boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}
        >
          {stack
            ? stack.stack.map((s, i) => (
                <motion.div key={s.layer} className="stack-row"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 100, damping: 20 }}
                >
                  <span className="s-layer">{s.layer}</span>
                  <span className="s-tech">{s.tech}</span>
                  <span className="s-desc">{s.purpose}</span>
                </motion.div>
              ))
            : <p style={{ color: "var(--text-4)", fontSize: 13 }}>Loading…</p>
          }
        </motion.div>
      </Section>

      {/* FOOTER */}
      <footer className="footer">
        Built with React + Express + Nginx + Docker + GitHub Actions · Deployed on{" "}
        <a href="#top">AWS EC2</a>
      </footer>
    </motion.div>
  );
}

// ── App (root) ────────────────────────────────────────
// ALL hooks are called unconditionally at the top — no early returns before hooks.
export default function App() {
  const [loading,  setLoading]  = useState(true);
  const [health,   setHealth]   = useState(null);
  const [metrics,  setMetrics]  = useState(null);
  const [services, setServices] = useState(null);
  const [deploys,  setDeploys]  = useState(null);
  const [stack,    setStack]    = useState(null);
  const [ping,     setPing]     = useState(null);
  const [pinging,  setPinging]  = useState(false);
  const [err,      setErr]      = useState(null);

  // loader timer
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  // data fetch — only runs once loading is done
  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        const [h, m, s, d, st] = await Promise.all([
          fetch("/api/health").then((r) => r.json()),
          fetch("/api/metrics").then((r) => r.json()),
          fetch("/api/services").then((r) => r.json()),
          fetch("/api/deployments").then((r) => r.json()),
          fetch("/api/stack").then((r) => r.json()),
        ]);
        setHealth(h); setMetrics(m); setServices(s); setDeploys(d); setStack(st);
      } catch {
        setErr("Cannot reach backend — start the server first.");
      }
    })();
  }, [loading]);

  const doPing = async () => {
    setPinging(true);
    const t0 = Date.now();
    try {
      const r = await fetch("/api/ping").then((r) => r.json());
      setPing({ ms: Date.now() - t0, msg: r.message });
    } catch {
      setPing({ ms: null });
    }
    setPinging(false);
  };

  // Conditional rendering — all hooks above are always called
  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loader" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <Loader />
        </motion.div>
      ) : (
        <motion.div key="dashboard">
          <Dashboard
            health={health} metrics={metrics} services={services}
            deploys={deploys} stack={stack}
            ping={ping} pinging={pinging} err={err} doPing={doPing}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}