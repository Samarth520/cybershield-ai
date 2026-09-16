
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Shield, ShieldAlert, ShieldCheck, AlertTriangle, Activity, Users, CreditCard,
  Bot, FileWarning, Bell, ChevronRight, Search, Filter, LogIn, Radio,
  Lock, Unlock, Zap, Server, Database, Network, Smartphone, Cloud,
  CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw, Eye, EyeOff,
  Gauge, TrendingUp, MapPin, Wifi, UserX, FileText, Settings,
  ChevronDown, X, Play, ArrowUpRight, Fingerprint, KeyRound, Menu
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar
} from "recharts";

/* ============================================================
   DESIGN TOKENS
   bg-void:#070B12  panel:#0D1420  panel-raised:#121A28  border:#1C2635
   text-hi:#E7ECF3  text-mid:#8B98AC  text-dim:#59667A
   accent(cyan):#22D3EE  accent-blue:#3B82F6  safe:#34D399  warn:#FBBF24
   crit:#F87171  critical-deep:#EF4444
   display font: Manrope  |  data/mono font: IBM Plex Mono
   ============================================================ */

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

function useFonts() {
  useEffect(() => {
    if (!document.getElementById("cs-fonts")) {
      const l = document.createElement("link");
      l.id = "cs-fonts";
      l.rel = "stylesheet";
      l.href = FONT_LINK;
      document.head.appendChild(l);
    }
  }, []);
}

const disp = { fontFamily: "'Manrope', sans-serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

/* ============================================================
   MOCK DATA GENERATORS
   ============================================================ */
const THREAT_TYPES = ["ACCOUNT_TAKEOVER", "FRAUD_TRANSACTION", "PII_LEAK", "BOT_ACTIVITY", "SMURF_ACCOUNT", "SESSION_HIJACK"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const CITIES = ["Jaipur", "Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Pune", "Kolkata", "Chennai"];
const STATUSES = ["BLOCKED", "INVESTIGATING", "FLAGGED", "RESOLVED"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pad(n) { return n.toString().padStart(2, "0"); }
function nowTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

let eventCounter = 1000;
function makeThreatEvent() {
  eventCounter++;
  const type = rand(THREAT_TYPES);
  const severity = rand(SEVERITIES);
  const risk = severity === "CRITICAL" ? randInt(85, 99) : severity === "HIGH" ? randInt(65, 84) : severity === "MEDIUM" ? randInt(40, 64) : randInt(10, 39);
  const templates = {
    ACCOUNT_TAKEOVER: { icon: "takeover", title: "Possible account takeover", detail: `Account: player_${randInt(1000, 9999)}` },
    FRAUD_TRANSACTION: { icon: "fraud", title: "Suspicious transaction detected", detail: `Amount: ₹${randInt(500, 25000).toLocaleString("en-IN")}` },
    PII_LEAK: { icon: "pii", title: "PII exposure prevented", detail: `Source: Game Chat` },
    BOT_ACTIVITY: { icon: "bot", title: "Bot behavior detected", detail: `Confidence: ${randInt(70, 99)}%` },
    SMURF_ACCOUNT: { icon: "smurf", title: "Smurf account pattern flagged", detail: `New account, elite-tier stats` },
    SESSION_HIJACK: { icon: "session", title: "Session anomaly detected", detail: `Simultaneous logins, 2 regions` },
  };
  const t = templates[type];
  return {
    id: `EVT-${eventCounter}`,
    type, severity, risk,
    title: t.title,
    detail: t.detail,
    account: `user_${randInt(1000, 9999)}`,
    status: risk > 80 ? "BLOCKED" : risk > 55 ? "INVESTIGATING" : "FLAGGED",
    time: nowTime(),
    icon: t.icon,
  };
}

function seedEvents(n) {
  return Array.from({ length: n }, () => makeThreatEvent()).sort((a, b) => b.risk - a.risk);
}

function seedTransactions(n) {
  return Array.from({ length: n }, (_, i) => {
    const risk = randInt(5, 99);
    return {
      id: `TX-${83000 + i}`,
      user: `user_${randInt(1000, 9999)}`,
      amount: randInt(99, 30000),
      device: rand(["Known Device", "New Device", "Emulator Flagged"]),
      location: rand(CITIES),
      risk,
      threat: risk > 80 ? "Fraud Pattern" : risk > 50 ? "Anomaly" : "Normal",
      status: risk > 85 ? "BLOCKED" : risk > 60 ? "INVESTIGATING" : "ALLOWED",
    };
  }).sort((a, b) => b.risk - a.risk);
}

function seedIncidents(n) {
  const stages = ["DETECTED", "ANALYZING", "RISK_ASSESSED", "RESPONSE", "RESOLVED"];
  return Array.from({ length: n }, (_, i) => ({
    id: `INC-${5100 + i}`,
    type: rand(THREAT_TYPES),
    severity: rand(SEVERITIES),
    user: `player_${randInt(1000, 9999)}`,
    detected: nowTime(),
    risk: randInt(40, 99),
    stage: rand(stages),
  }));
}

const CHART_TREND = Array.from({ length: 12 }, (_, i) => ({
  t: `${i * 2}:00`,
  threats: randInt(10, 60),
  blocked: randInt(5, 40),
}));

const RISK_DIST = [
  { name: "Low", value: randInt(30, 50), color: "#34D399" },
  { name: "Medium", value: randInt(20, 35), color: "#FBBF24" },
  { name: "High", value: randInt(10, 20), color: "#FB923C" },
  { name: "Critical", value: randInt(5, 15), color: "#F87171" },
];

const CATEGORY_DATA = [
  { name: "Fraud", value: 34 },
  { name: "Takeover", value: 21 },
  { name: "PII", value: 18 },
  { name: "Bot", value: 27 },
];

/* ============================================================
   SMALL UI PRIMITIVES
   ============================================================ */
function Panel({ children, className = "", style = {}, glow = false, corners = true }) {
  return (
    <div
      className={`relative rounded-xl border overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(18,26,40,0.85), rgba(10,15,24,0.9))",
        borderColor: glow ? "rgba(34,211,238,0.4)" : "#1C2635",
        boxShadow: glow ? "0 0 0 1px rgba(34,211,238,0.08), 0 12px 40px rgba(34,211,238,0.06)" : "0 8px 24px rgba(0,0,0,0.25)",
        backdropFilter: "blur(6px)",
        ...style,
      }}
    >
      {corners && (
        <>
          <span className="absolute top-0 left-0 w-3 h-3 border-t border-l pointer-events-none" style={{ borderColor: "rgba(34,211,238,0.5)" }} />
          <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r pointer-events-none" style={{ borderColor: "rgba(34,211,238,0.5)" }} />
        </>
      )}
      {children}
    </div>
  );
}

function SeverityPill({ severity }) {
  const map = {
    LOW: { c: "#34D399", bg: "rgba(52,211,153,0.12)" },
    MEDIUM: { c: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
    HIGH: { c: "#FB923C", bg: "rgba(251,146,60,0.12)" },
    CRITICAL: { c: "#F87171", bg: "rgba(248,113,113,0.14)" },
  };
  const s = map[severity] || map.LOW;
  return (
    <span
      className="px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide"
      style={{ color: s.c, background: s.bg, ...mono }}
    >
      {severity}
    </span>
  );
}

function StatusPill({ status }) {
  const map = {
    BLOCKED: { c: "#F87171", bg: "rgba(248,113,113,0.12)" },
    INVESTIGATING: { c: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
    FLAGGED: { c: "#FB923C", bg: "rgba(251,146,60,0.12)" },
    RESOLVED: { c: "#34D399", bg: "rgba(52,211,153,0.12)" },
    ALLOWED: { c: "#34D399", bg: "rgba(52,211,153,0.12)" },
  };
  const s = map[status] || map.FLAGGED;
  return (
    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold" style={{ color: s.c, background: s.bg, ...mono }}>
      {status}
    </span>
  );
}

function KPI({ label, value, sub, tone = "neutral", icon: Icon }) {
  const toneColor = { neutral: "#22D3EE", safe: "#34D399", warn: "#FBBF24", crit: "#F87171" }[tone];
  const numeric = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;
  const suffix = typeof value === "string" ? value.replace(/^[₹$]?[0-9.,]+/, "") : "";
  const prefix = typeof value === "string" && /^[₹$]/.test(value) ? value[0] : "";
  const decimals = typeof value === "string" && /\.\d/.test(value) ? (value.match(/\.(\d+)/)[1].length) : 0;
  return (
    <Panel className="p-4 flex flex-col gap-2 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider" style={{ color: "#59667A", ...mono }}>{label}</span>
        {Icon && <Icon size={15} style={{ color: toneColor }} />}
      </div>
      <div className="text-2xl font-bold" style={{ color: "#E7ECF3", ...disp }}>
        {!isNaN(numeric) ? <>{prefix}<AnimatedCounter value={numeric} decimals={decimals} />{suffix}</> : value}
      </div>
      {sub && <div className="text-xs" style={{ color: toneColor }}>{sub}</div>}
    </Panel>
  );
}

/* ---- Shared premium primitives ---- */

/** Counts up from 0 to `value` whenever `value` changes. Formats with locale separators. */
function AnimatedCounter({ value, duration = 900, decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString("en-IN");
  return <>{formatted}</>;
}

/** Fades/slides content in once it scrolls into view. Pure IntersectionObserver, no extra deps. */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/** Small glowing-dot section header used instead of plain <h1>/<h2> on inner pages. */
function SectionEyebrow({ children }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22D3EE", boxShadow: "0 0 8px #22D3EE" }} />
      <span className="text-[11px] uppercase tracking-[0.15em]" style={{ color: "#22D3EE", ...mono }}>{children}</span>
    </div>
  );
}

/** Large animated radial score — the centerpiece for Command Center / Risk Quantification. */
function RadialScore({ value, size = 200, label, sublabel, color = "#22D3EE", trackColor = "#141C28", thickness = 10 }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(animated, 100) / 100) * c;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={thickness} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-extrabold" style={{ fontSize: size * 0.22, color: "#E7ECF3", ...disp, lineHeight: 1 }}>
          <AnimatedCounter value={value} />
        </div>
        {label && <div className="text-[11px] mt-1" style={{ color: "#59667A", ...mono }}>{label}</div>}
        {sublabel && <div className="text-[10px] mt-0.5" style={{ color, ...mono }}>{sublabel}</div>}
      </div>
    </div>
  );
}

/** Small radial ring used for category breakdowns clustered around a main RadialScore. */
function MiniRing({ value, label, color, size = 76 }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(value), 150); return () => clearTimeout(t); }, [value]);
  const r = (size - 7) / 2, c = 2 * Math.PI * r, offset = c - (animated / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#141C28" strokeWidth={6} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: "#E7ECF3", ...disp }}>{value}</div>
      </div>
      <span className="text-[10px] text-center" style={{ color: "#8B98AC", ...mono }}>{label}</span>
    </div>
  );
}

/** Animated node-link network — reused for the command-center pulse and the threat-intel map. */
function NetworkViz({ nodes, activeId, onHover, height = 260 }) {
  const cx = 300, cy = height / 2;
  return (
    <svg viewBox={`0 0 600 ${height}`} className="w-full" style={{ height }}>
      <defs>
        <radialGradient id="netCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={70} fill="url(#netCoreGlow)" />
      {nodes.map((n, i) => {
        const active = activeId === n.id;
        return (
          <line
            key={`l-${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y}
            stroke={n.severity === "CRITICAL" ? "#F87171" : n.severity === "HIGH" ? "#FB923C" : "#22D3EE"}
            strokeWidth={active ? 2 : 1} strokeOpacity={active ? 0.7 : 0.22} strokeDasharray="4 5"
          >
            <animate attributeName="stroke-dashoffset" values="0;-18" dur="1s" repeatCount="indefinite" />
          </line>
        );
      })}
      <circle cx={cx} cy={cy} r={26} fill="#0D1420" stroke="#22D3EE" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={26} fill="none" stroke="#22D3EE" strokeWidth="1" strokeDasharray="3 5" opacity="0.7">
        <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="10s" repeatCount="indefinite" />
      </circle>
      <foreignObject x={cx - 11} y={cy - 11} width="22" height="22">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2">
            <path d="M12 2 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4Z" />
          </svg>
        </div>
      </foreignObject>
      {nodes.map((n, i) => {
        const active = activeId === n.id;
        const color = n.severity === "CRITICAL" ? "#F87171" : n.severity === "HIGH" ? "#FB923C" : n.severity === "MEDIUM" ? "#FBBF24" : "#34D399";
        return (
          <g key={n.id} style={{ cursor: "pointer" }} onMouseEnter={() => onHover && onHover(n.id)} onMouseLeave={() => onHover && onHover(null)}>
            <circle cx={n.x} cy={n.y} r={active ? 9 : 6} fill={color} opacity="0.9" />
            <circle cx={n.x} cy={n.y} r={active ? 9 : 6} fill={color} opacity="0.5">
              <animate attributeName="r" values={`${active ? 9 : 6};${active ? 20 : 15}`} dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {active && n.label && (
              <text x={n.x} y={n.y - 16} fontSize="9.5" textAnchor="middle" fill="#E7ECF3" fontFamily="'IBM Plex Mono', monospace" fontWeight="600">{n.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DemoBadge({ small }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}`}
      style={{ borderColor: "rgba(34,211,238,0.35)", color: "#22D3EE", background: "rgba(34,211,238,0.06)", ...mono }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22D3EE" }} />
      DEMO MODE — simulated data
    </span>
  );
}

function EventIcon({ icon, size = 16 }) {
  const map = {
    takeover: <UserX size={size} />, fraud: <CreditCard size={size} />, pii: <FileWarning size={size} />,
    bot: <Bot size={size} />, smurf: <Users size={size} />, session: <Wifi size={size} />,
  };
  return map[icon] || <AlertTriangle size={size} />;
}

/* ============================================================
   LANDING PAGE
   ============================================================ */
function StarField({ count = 90 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 1.4 + 0.3,
        delay: Math.random() * 4,
        dur: 3 + Math.random() * 4,
      })),
    [count]
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r * 2,
            height: s.r * 2,
            background: "#E7ECF3",
            opacity: 0.5,
            animation: `csTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

const TICKER_ITEMS = [
  { text: "Fraud pattern blocked — TX-83921 · Mumbai", color: "#F87171" },
  { text: "Account takeover attempt stopped — player_1842", color: "#FB923C" },
  { text: "PII redacted in chat stream — Game Chat", color: "#34D399" },
  { text: "Bot cluster flagged — 94% confidence", color: "#FBBF24" },
  { text: "Smurf account pattern detected — new signup", color: "#22D3EE" },
  { text: "Session hijack attempt blocked — 2 regions", color: "#F87171" },
];

// Faint isometric wordmarks in the background, evoking "protected platforms"
// without depicting any real, trademarked brand.
const PARTNER_MARKS = [
  { label: "NimbusPlay", pos: "top-6 left-2 md:left-10" },
  { label: "Vertex Arena", pos: "top-6 right-2 md:right-10" },
  { label: "Solstice", pos: "bottom-10 left-4 md:left-16" },
  { label: "Voltage", pos: "bottom-10 right-4 md:right-16" },
];

function PartnerMark({ label, pos }) {
  return (
    <div className={`hidden sm:flex absolute ${pos} items-center gap-1.5 opacity-30`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B98AC" strokeWidth="1.5">
        <path d="M12 2 21 7v10l-9 5-9-5V7Z" />
      </svg>
      <span className="text-xs" style={{ color: "#8B98AC", ...mono }}>{label}</span>
    </div>
  );
}

/** Glassmorphic KPI card that floats beside the cube, joined to it by a thin animated connector line. */
function FloatingStatCard({ side, children, delay = 0 }) {
  const align = side === "left" ? "items-start text-left" : "items-end text-right";
  return (
    <div
      className={`relative rounded-xl border p-4 flex flex-col ${align} backdrop-blur-sm`}
      style={{
        background: "rgba(13,20,32,0.72)",
        borderColor: "rgba(34,211,238,0.22)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        animation: `csFloat 5s ease-in-out ${delay}s infinite`,
      }}
    >
      {children}
    </div>
  );
}

/** CSS 3D isometric cube with a glowing shield floating at its center — the hero centerpiece. */
function GlassCube() {
  const faceBase = { position: "absolute", inset: 0, borderRadius: 10 };
  return (
    <div className="relative flex items-center justify-center" style={{ perspective: 1100 }}>
      <div
        className="relative"
        style={{
          width: 176, height: 176, transformStyle: "preserve-3d",
          transform: "rotateX(-24deg) rotateY(38deg)",
          animation: "csCubeFloat 6s ease-in-out infinite",
        }}
      >
        {/* top */}
        <div style={{ ...faceBase, width: 176, height: 176, background: "linear-gradient(135deg, rgba(103,232,249,0.55), rgba(34,211,238,0.28))", border: "1px solid rgba(34,211,238,0.55)", transform: "rotateX(90deg) translateZ(88px)" }} />
        {/* front / right */}
        <div style={{ ...faceBase, width: 176, height: 176, background: "linear-gradient(160deg, rgba(34,211,238,0.28), rgba(6,20,28,0.65))", border: "1px solid rgba(34,211,238,0.4)", transform: "translateZ(88px)" }} />
        {/* side / left */}
        <div style={{ ...faceBase, width: 176, height: 176, background: "linear-gradient(200deg, rgba(8,28,38,0.85), rgba(4,12,18,0.9))", border: "1px solid rgba(34,211,238,0.25)", transform: "rotateY(90deg) translateZ(88px)" }} />
      </div>
      {/* glowing shield, flat-front so it stays crisp regardless of the cube's 3D tilt */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ filter: "drop-shadow(0 0 22px rgba(34,211,238,0.65))" }}>
        <svg width="72" height="72" viewBox="0 0 24 24" fill="rgba(231,236,243,0.92)" stroke="#0B1626" strokeWidth="0.6">
          <path d="M12 2 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4Z" />
        </svg>
      </div>
    </div>
  );
}

function LandingPage({ onLaunch, onHowItWorks }) {
  const [stats, setStats] = useState({ detected: 17, blocked: 12, events: 1284 });
  useEffect(() => {
    const iv = setInterval(() => {
      setStats((s) => ({
        detected: s.detected + (Math.random() > 0.7 ? 1 : 0),
        blocked: s.blocked + (Math.random() > 0.8 ? 1 : 0),
        events: s.events + randInt(1, 4),
      }));
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  const features = [
    { icon: CreditCard, title: "Real-Time Fraud Detection", desc: "Flags suspicious in-game transactions and account activity as it happens." },
    { icon: Gauge, title: "Explainable Risk Scoring", desc: "Every score comes with the exact signals that produced it — no black box." },
    { icon: FileWarning, title: "Data Leak Prevention", desc: "Scans chat and text streams for emails, phone numbers, cards and addresses." },
    { icon: Bot, title: "Bot & Smurf Detection", desc: "Separates real players from automated and smurf accounts using behavior." },
    { icon: Zap, title: "Automated Incident Response", desc: "Blocks, alerts, logs and escalates — without waiting on a human first." },
    { icon: Lock, title: "Privacy-First Security", desc: "Sensitive fields are tokenized and redacted before they ever reach storage." },
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: "#070B12", color: "#E7ECF3", ...disp }}>
      {/* NAV — pill style */}
      <div className="sticky top-0 z-30 backdrop-blur border-b" style={{ background: "rgba(7,11,18,0.85)", borderColor: "#1C2635" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Shield size={20} style={{ color: "#22D3EE" }} />
            <span className="font-bold tracking-tight">SCyber</span>
          </div>
          <div className="hidden md:flex items-center gap-1 rounded-full border p-1" style={{ borderColor: "#1C2635" }}>
            {["Home", "Services", "Tech stack", "Cases", "Contacts"].map((label, i) => (
              <button
                key={label}
                onClick={i === 1 ? onHowItWorks : undefined}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={i === 0 ? { background: "#E7ECF3", color: "#070B12" } : { color: "#8B98AC" }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={onLaunch}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0"
            style={{ background: "#22D3EE", color: "#04121A" }}
          >
            Contact us <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* HERO — isometric shield core, live protection at a glance */}
      <div className="relative overflow-hidden" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 10%, #0B1626 0%, #070B12 65%)" }}>
        <StarField count={50} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(34,211,238,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 75% 65% at 50% 30%, black 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 30%, black 30%, transparent 100%)",
          }}
        />

        <div className="max-w-4xl mx-auto px-6 pt-16 pb-4 relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6" style={{ borderColor: "rgba(251,191,36,0.4)", color: "#FBBF24" }}>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#FBBF24", color: "#221A03" }}>NEW</span>
            <span className="text-[11px]" style={mono}>Try the live threat simulation</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] mb-4" style={disp}>
            Intelligent <span style={{ color: "#22D3EE" }}>AI protection</span><br className="hidden sm:block" /> for your gaming platform
          </h1>
          <p className="text-sm md:text-base mb-8 max-w-xl mx-auto" style={{ color: "#8B98AC" }}>
            SCyber watches gaming ecosystems worldwide in real time — catching fraud, account takeovers,
            leaked personal data, bots and smurf accounts, then responding automatically before damage spreads.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-2">
            <button onClick={onLaunch} className="px-5 py-3 rounded-lg font-semibold text-sm flex items-center gap-2" style={{ background: "#22D3EE", color: "#04121A" }}>
              Launch Security Console <ArrowRight size={16} />
            </button>
            <button onClick={onHowItWorks} className="px-5 py-3 rounded-lg font-semibold text-sm border" style={{ borderColor: "#1C2635", color: "#E7ECF3" }}>
              Explore How It Works
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 relative py-2" style={{ color: "#59667A" }}>
          <span className="text-[11px]" style={mono}>Scroll down</span>
          <div className="w-4 h-6 rounded-full border flex justify-center pt-1" style={{ borderColor: "#59667A" }}>
            <span className="w-1 h-1.5 rounded-full" style={{ background: "#59667A", animation: "csScrollDot 1.6s ease-in-out infinite" }} />
          </div>
        </div>

        {/* Core visual: floating glass shield cube + connected live-stat cards */}
        <div className="relative max-w-4xl mx-auto px-6 pt-6 pb-10" style={{ animation: "csArrive 1.2s cubic-bezier(0.16,1,0.3,1) both" }}>
          {PARTNER_MARKS.map((m) => <PartnerMark key={m.label} {...m} />)}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-4 order-2 md:order-1">
              <FloatingStatCard side="left" delay={0}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(251,146,60,0.15)" }}>
                    <AlertTriangle size={13} style={{ color: "#FB923C" }} />
                  </span>
                  <span className="text-xs font-semibold">Warning</span>
                </div>
                <div className="text-2xl font-bold" style={disp}>17<span className="text-sm font-medium" style={{ color: "#8B98AC" }}> threats</span></div>
                <div className="text-xs mb-2" style={{ color: "#59667A" }}>blocked today</div>
                <span className="text-[11px] px-2 py-1 rounded-md" style={{ background: "#141C28", color: "#C3CCDA" }}>View report</span>
              </FloatingStatCard>
              <FloatingStatCard side="left" delay={0.5}>
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="text-2xl font-bold" style={disp}>78<span className="text-sm">%</span></div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold" style={{ background: "rgba(52,211,153,0.15)", color: "#34D399" }}>+2.4%</span>
                </div>
                <div className="text-xs mb-2" style={{ color: "#59667A" }}>PII exfiltration reduced</div>
                <div className="w-full h-1.5 rounded-full" style={{ background: "#1C2635" }}>
                  <div className="h-1.5 rounded-full" style={{ width: "78%", background: "#34D399" }} />
                </div>
              </FloatingStatCard>
            </div>

            <div className="order-1 md:order-2">
              <GlassCube />
            </div>

            <div className="space-y-4 order-3">
              <FloatingStatCard side="right" delay={0.25}>
                <div className="text-2xl font-bold" style={disp}>39.4K</div>
                <div className="text-xs mb-2" style={{ color: "#59667A" }}>accounts protected</div>
                <span className="text-[11px] px-2 py-1 rounded-md font-semibold" style={{ background: "rgba(34,211,238,0.15)", color: "#22D3EE" }}>84% coverage</span>
              </FloatingStatCard>
              <FloatingStatCard side="right" delay={0.75}>
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="text-2xl font-bold" style={disp}>42<span className="text-sm">%</span></div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold" style={{ background: "rgba(251,146,60,0.15)", color: "#FB923C" }}>+7.3%</span>
                </div>
                <div className="text-xs" style={{ color: "#59667A" }}>live system load</div>
              </FloatingStatCard>
            </div>
          </div>

          <div className="mt-6 flex justify-center"><DemoBadge small /></div>
        </div>

        {/* live threat ticker */}
        <div className="relative border-t border-b overflow-hidden py-2.5" style={{ borderColor: "#1C2635", background: "rgba(13,20,32,0.6)" }}>
          <div className="flex whitespace-nowrap" style={{ animation: "csTicker 26s linear infinite" }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <span key={i} className="mx-6 text-xs flex items-center gap-2" style={{ color: "#8B98AC", ...mono }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                {t.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="how-it-works" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-2" style={disp}>What SCyber watches for</h2>
        <p className="text-sm mb-10" style={{ color: "#8B98AC" }}>Six detection surfaces, one automated response pipeline.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group p-5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "#0D1420", borderColor: "#1C2635" }}
            >
              <f.icon size={20} style={{ color: "#22D3EE" }} className="mb-4 transition-transform duration-200 group-hover:scale-110" />
              <div className="font-semibold mb-1.5 text-sm">{f.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: "#8B98AC" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t py-8" style={{ borderColor: "#1C2635" }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs" style={{ color: "#59667A" }}>
          <span>SCyber — SIH 2026 Prototype</span>
          <span style={mono}>SIH26105</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CONSOLE LAYOUT (sidebar + topbar)
   ============================================================ */
const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: Activity, roles: ["PLAYER", "SECURITY", "ADMIN"] },
  { key: "monitor", label: "Threat Monitor", icon: Radio, roles: ["SECURITY", "ADMIN"] },
  { key: "transactions", label: "Transactions", icon: CreditCard, roles: ["SECURITY", "ADMIN"] },
  { key: "accounts", label: "Account Security", icon: KeyRound, roles: ["PLAYER", "SECURITY", "ADMIN"] },
  { key: "pii", label: "PII Scanner", icon: FileWarning, roles: ["SECURITY", "ADMIN"] },
  { key: "bot", label: "Bot Detection", icon: Bot, roles: ["SECURITY", "ADMIN"] },
  { key: "risk", label: "Risk Analyzer", icon: Gauge, roles: ["SECURITY", "ADMIN"] },
  { key: "incidents", label: "Incidents", icon: AlertTriangle, roles: ["SECURITY", "ADMIN"] },
  { key: "attack", label: "Simulate Attack", icon: Zap, roles: ["SECURITY", "ADMIN"] },
  { key: "analytics", label: "Analytics", icon: TrendingUp, roles: ["SECURITY", "ADMIN"] },
  { key: "audit", label: "Audit Logs", icon: FileText, roles: ["ADMIN"] },
  { key: "architecture", label: "System Architecture", icon: Network, roles: ["SECURITY", "ADMIN"] },
  { key: "report", label: "Report Activity", icon: ShieldAlert, roles: ["PLAYER"] },
];

function ThreatLevelBadge({ level }) {
  const map = {
    LOW: "#34D399", MEDIUM: "#FBBF24", HIGH: "#FB923C", CRITICAL: "#F87171",
  };
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: "#1C2635" }}>
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: map[level] }} />
      <span className="text-xs font-semibold" style={{ color: map[level], ...mono }}>{level} THREAT LEVEL</span>
    </div>
  );
}

function ConsoleShell({ children, tab, setTab, role, setRole, onExit, addAudit }) {
  // Sidebar visibility is driven entirely by JS state (not CSS breakpoints),
  // so the toggle button is always present and always works regardless of
  // how this gets embedded/resized.
  const [navOpen, setNavOpen] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const check = () => {
      const narrow = window.innerWidth < 860;
      setIsNarrow(narrow);
      setNavOpen((prev) => (narrow ? false : true));
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));
  const activeItem = items.find((i) => i.key === tab);

  return (
    <div className="min-h-screen w-full flex relative" style={{ background: "#070B12", color: "#E7ECF3", ...disp }}>
      {/* ambient background grid + glow, consistent with the landing page environment */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(34,211,238,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.045) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black 0%, transparent 75%)",
        }}
      />

      {/* Backdrop, only meaningful (and clickable) when the drawer is open on a narrow layout */}
      {navOpen && isNarrow && (
        <div className="fixed inset-0 z-30 bg-black/60" onClick={() => setNavOpen(false)} />
      )}

      {/* SIDEBAR */}
      <div
        className="fixed md:static z-40 top-0 left-0 h-full w-64 border-r flex flex-col transition-transform duration-200 shrink-0"
        style={{
          background: "linear-gradient(180deg, rgba(10,15,24,0.98), rgba(7,11,18,0.98))",
          borderColor: "#1C2635",
          transform: navOpen ? "translateX(0)" : "translateX(-100%)",
          position: isNarrow ? "fixed" : "relative",
        }}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: "#1C2635" }}>
          <span className="relative flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "rgba(34,211,238,0.1)" }}>
            <Shield size={15} style={{ color: "#22D3EE" }} />
          </span>
          <span className="font-bold text-sm tracking-tight">SCyber</span>
          <button className="ml-auto" onClick={() => setNavOpen(false)} title="Collapse menu">
            <X size={16} style={{ color: "#59667A" }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-0.5">
          {items.map((it) => {
            const active = tab === it.key;
            return (
              <button
                key={it.key}
                onClick={() => { setTab(it.key); if (isNarrow) setNavOpen(false); }}
                className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
                style={{
                  background: active ? "linear-gradient(90deg, rgba(34,211,238,0.14), rgba(34,211,238,0.02))" : "transparent",
                  color: active ? "#67E8F9" : "#8B98AC",
                }}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full" style={{ background: "#22D3EE", boxShadow: "0 0 8px #22D3EE" }} />
                )}
                <it.icon size={16} />
                {it.label}
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t" style={{ borderColor: "#1C2635" }}>
          <button onClick={onExit} className="w-full text-xs px-3 py-2 rounded-lg border transition-colors hover:border-cyan-800" style={{ borderColor: "#1C2635", color: "#59667A" }}>
            ← Exit to landing page
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        {/* TOPBAR */}
        <div className="sticky top-0 z-20 border-b px-4 md:px-6 py-3 flex items-center gap-3 backdrop-blur" style={{ background: "rgba(7,11,18,0.85)", borderColor: "#1C2635" }}>
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors"
            style={{ borderColor: "#1C2635", color: "#C3CCDA" }}
            title="Toggle menu"
          >
            <Menu size={16} />
          </button>
          {activeItem && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: "#59667A", ...mono }}>
              <span>SCYBER</span><ChevronRight size={12} /><span style={{ color: "#C3CCDA" }}>{activeItem.label.toUpperCase()}</span>
            </div>
          )}
          <DemoBadge small />
          <div className="ml-auto flex items-center gap-3">
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setTab("overview"); addAudit("ADMIN", `Switched role view to ${e.target.value}`); }}
              className="text-xs rounded-lg px-2.5 py-1.5 border outline-none"
              style={{ background: "#0D1420", borderColor: "#1C2635", color: "#C3CCDA", ...mono }}
            >
              <option value="PLAYER">PLAYER</option>
              <option value="SECURITY">SECURITY TEAM</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <Bell size={16} style={{ color: "#8B98AC" }} />
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "#1C2635", color: "#22D3EE" }}>
              {role[0]}
            </div>
          </div>
        </div>
        <div key={tab} className="flex-1 overflow-y-auto p-4 md:p-6" style={{ animation: "csPageIn 0.45s cubic-bezier(0.16,1,0.3,1) both" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   OVERVIEW PAGE
   ============================================================ */
function OverviewPage({ events }) {
  const critCount = events.filter((e) => e.severity === "CRITICAL").length;
  const highCount = events.filter((e) => e.severity === "HIGH").length;
  const level = critCount > 3 ? "CRITICAL" : critCount > 1 ? "HIGH" : critCount > 0 ? "MEDIUM" : "LOW";
  const posture = Math.max(48, 96 - critCount * 9 - highCount * 3);

  const [hoverId, setHoverId] = useState(null);
  const nodes = useMemo(() => {
    const sample = events.slice(0, 8);
    return sample.map((e, i) => {
      const angle = (i / sample.length) * Math.PI * 2 - Math.PI / 2;
      return { id: e.id, x: 300 + Math.cos(angle) * 220, y: 130 + Math.sin(angle) * 95, severity: e.severity, label: e.title };
    });
  }, [events]);

  return (
    <div className="space-y-6">
      <Reveal>
        <SectionEyebrow>Command Center</SectionEyebrow>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold" style={disp}>Security Overview</h1>
          <ThreatLevelBadge level={level} />
        </div>
        <p className="text-xs mt-1" style={{ color: "#59667A" }}>Live posture across all connected gaming platforms</p>
      </Reveal>

      {/* HERO ROW — posture score + live network pulse, unequal hierarchy on purpose */}
      <Reveal delay={0.05}>
        <div className="grid lg:grid-cols-5 gap-4">
          <Panel glow className="p-6 lg:col-span-2 flex flex-col items-center justify-center text-center">
            <SectionEyebrow>Security Posture</SectionEyebrow>
            <RadialScore value={posture} size={168} label="/ 100" sublabel={level} color={posture > 80 ? "#34D399" : posture > 60 ? "#FBBF24" : "#F87171"} />
            <div className="grid grid-cols-2 gap-3 w-full mt-5 text-left">
              <div>
                <div className="text-[10px] uppercase" style={{ color: "#59667A", ...mono }}>Active Alerts</div>
                <div className="text-lg font-bold" style={disp}><AnimatedCounter value={17} /></div>
              </div>
              <div>
                <div className="text-[10px] uppercase" style={{ color: "#59667A", ...mono }}>Blocked Today</div>
                <div className="text-lg font-bold" style={disp}><AnimatedCounter value={12} /></div>
              </div>
            </div>
          </Panel>

          <Panel glow className="p-4 lg:col-span-3">
            <div className="flex items-center justify-between mb-1">
              <SectionEyebrow>Live Network Pulse</SectionEyebrow>
              <span className="text-[10px] flex items-center gap-1.5" style={{ color: "#34D399", ...mono }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} /> LIVE
              </span>
            </div>
            <NetworkViz nodes={nodes} activeId={hoverId} onHover={setHoverId} height={240} />
          </Panel>
        </div>
      </Reveal>

      {/* Secondary metrics */}
      <Reveal delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Live Events" value="1284" tone="neutral" icon={Activity} />
          <KPI label="Suspicious Tx" value="8" tone="warn" icon={CreditCard} />
          <KPI label="Protected Users" value="24891" tone="safe" icon={Users} />
          <KPI label="Avg Response" value="1.8s" tone="neutral" icon={Clock} />
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="grid lg:grid-cols-3 gap-4">
          <Panel glow className="p-4 lg:col-span-2">
            <SectionEyebrow>Threats over time</SectionEyebrow>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={CHART_TREND}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1C2635" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke="#59667A" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#59667A" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid #1C2635", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="threats" stroke="#22D3EE" fill="url(#g1)" strokeWidth={2} name="Threats" />
                <Line type="monotone" dataKey="blocked" stroke="#F87171" strokeWidth={2} dot={false} name="Blocked" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
          <Panel glow className="p-4">
            <SectionEyebrow>Risk distribution</SectionEyebrow>
            <div style={{ fontFamily: "'Manrope', sans-serif" }}>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={RISK_DIST}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    labelStyle={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fill: "#E7ECF3" }}
                  >
                    {RISK_DIST.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0D1420", border: "1px solid #1C2635", borderRadius: 8, fontSize: 12, fontFamily: "'Manrope', sans-serif" }}
                    labelStyle={{ fontFamily: "'Manrope', sans-serif" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {RISK_DIST.map((e, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px]" style={{ color: "#8B98AC", fontFamily: "'Manrope', sans-serif" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: e.color }} /> {e.name}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="grid lg:grid-cols-2 gap-4">
          <Panel glow className="p-4">
            <SectionEyebrow>Threat categories</SectionEyebrow>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={CATEGORY_DATA}>
                <CartesianGrid stroke="#1C2635" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#59667A" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#59667A" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid #1C2635", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel glow className="p-4">
            <SectionEyebrow>Alert feed</SectionEyebrow>
            <div className="space-y-0 max-h-[190px] overflow-y-auto pr-1">
              {events.slice(0, 6).map((e) => {
                const color = e.severity === "CRITICAL" ? "#F87171" : e.severity === "HIGH" ? "#FB923C" : e.severity === "MEDIUM" ? "#FBBF24" : "#34D399";
                return (
                  <div key={e.id} className="relative flex items-center gap-2.5 text-xs py-2 pl-3 border-b" style={{ borderColor: "#141C28" }}>
                    <span className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full" style={{ background: color }} />
                    <span style={{ color: "#22D3EE" }}><EventIcon icon={e.icon} size={13} /></span>
                    <span className="flex-1 truncate" style={{ color: "#C3CCDA" }}>{e.title}</span>
                    <SeverityPill severity={e.severity} />
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </Reveal>
    </div>
  );
}

/* ============================================================
   LIVE THREAT MONITOR
   ============================================================ */
function ThreatMonitorPage({ events, setEvents }) {
  const [filter, setFilter] = useState("All");
  const [flash, setFlash] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const iv = setInterval(() => {
      const ev = makeThreatEvent();
      setEvents((prev) => [ev, ...prev].slice(0, 60));
      setFlash(ev.id);
      setTimeout(() => setFlash(null), 1200);
    }, 4500);
    return () => clearInterval(iv);
  }, [setEvents]);

  const filters = ["All", "Critical", "High", "Medium", "Low", "Blocked", "Investigating"];
  const filtered = events.filter((e) => {
    if (filter === "All") return true;
    if (["Critical", "High", "Medium", "Low"].includes(filter)) return e.severity === filter.toUpperCase();
    return e.status === filter.toUpperCase();
  });

  const critical = filtered.filter((e) => e.severity === "CRITICAL").length;
  const blocked = filtered.filter((e) => e.status === "BLOCKED").length;

  const nodes = useMemo(() => {
    const sample = filtered.slice(0, 9);
    return sample.map((e, i) => {
      const angle = (i / sample.length) * Math.PI * 2 - Math.PI / 2;
      return { id: e.id, x: 300 + Math.cos(angle) * 230, y: 130 + Math.sin(angle) * 100, severity: e.severity, label: e.title };
    });
  }, [filtered]);

  return (
    <div className="space-y-5">
      <Reveal>
        <SectionEyebrow>Threat Intelligence</SectionEyebrow>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold" style={disp}>Live Threat Monitor</h1>
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ color: "#34D399", background: "rgba(52,211,153,0.1)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} /> LIVE
          </div>
        </div>
        <p className="text-xs mt-1" style={{ color: "#59667A" }}>New signals stream in automatically — hover the map to trace a threat path</p>
      </Reveal>

      {/* Live threat map + at-a-glance counters, unequal hierarchy */}
      <Reveal delay={0.05}>
        <div className="grid lg:grid-cols-5 gap-4">
          <Panel glow className="p-4 lg:col-span-3">
            <SectionEyebrow>Active Threat Map</SectionEyebrow>
            <NetworkViz nodes={nodes} activeId={hoverId} onHover={setHoverId} height={240} />
          </Panel>
          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
            <KPI label="Total Signals" value={String(filtered.length)} tone="neutral" icon={Radio} />
            <KPI label="Critical" value={String(critical)} tone="crit" icon={AlertTriangle} />
            <KPI label="Blocked" value={String(blocked)} tone="safe" icon={ShieldCheck} />
            <KPI label="Avg Risk" value={String(Math.round((filtered.reduce((s, e) => s + e.risk, 0) / (filtered.length || 1)) || 0))} tone="warn" icon={Gauge} />
          </div>
        </div>
      </Reveal>

      {/* Attack progression timeline */}
      <Reveal delay={0.08}>
        <Panel glow className="p-4">
          <SectionEyebrow>Attack Progression Timeline</SectionEyebrow>
          <div className="flex items-center gap-0 overflow-x-auto pb-1 pt-2">
            {events.slice(0, 16).reverse().map((e, i, arr) => {
              const color = e.severity === "CRITICAL" ? "#F87171" : e.severity === "HIGH" ? "#FB923C" : e.severity === "MEDIUM" ? "#FBBF24" : "#34D399";
              return (
                <div key={e.id} className="flex items-center shrink-0">
                  <div className="flex flex-col items-center gap-1 px-1.5 group cursor-pointer" title={`${e.title} — ${e.time}`}>
                    <span className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-150" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                    <span className="text-[8.5px]" style={{ color: "#59667A", ...mono }}>{e.time.slice(0, 5)}</span>
                  </div>
                  {i < arr.length - 1 && <div className="w-6 h-px" style={{ background: "#1C2635" }} />}
                </div>
              );
            })}
          </div>
        </Panel>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={{
                borderColor: filter === f ? "#22D3EE" : "#1C2635",
                color: filter === f ? "#22D3EE" : "#8B98AC",
                background: filter === f ? "rgba(34,211,238,0.08)" : "transparent",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="space-y-2">
        {filtered.slice(0, 25).map((e, i) => {
          const expanded = expandedId === e.id;
          return (
            <Reveal key={e.id} delay={Math.min(i * 0.03, 0.3)}>
              <Panel
                glow={expanded}
                className="p-3.5 transition-all duration-500 cursor-pointer"
                style={{ borderColor: flash === e.id ? "#22D3EE" : undefined, background: flash === e.id ? "rgba(34,211,238,0.05)" : undefined }}
              >
                <div className="flex items-center gap-3" onClick={() => setExpandedId(expanded ? null : e.id)}>
                  <div className="shrink-0">
                    <MiniRing value={e.risk} label="" color={e.risk > 80 ? "#F87171" : e.risk > 55 ? "#FBBF24" : "#34D399"} size={44} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.title}</div>
                    <div className="text-xs flex flex-wrap gap-x-3" style={{ color: "#59667A", ...mono }}>
                      <span>{e.account}</span><span>{e.detail}</span><span>{e.time}</span>
                    </div>
                  </div>
                  <SeverityPill severity={e.severity} />
                  <StatusPill status={e.status} />
                  <ChevronDown size={15} className="transition-transform duration-300 shrink-0" style={{ color: "#59667A", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                </div>
                {expanded && (
                  <div className="mt-3 pt-3 border-t grid sm:grid-cols-3 gap-3 text-xs" style={{ borderColor: "#1C2635" }}>
                    <div><div style={{ color: "#59667A" }}>Threat type</div><div style={{ color: "#C3CCDA" }}>{e.type.replaceAll("_", " ")}</div></div>
                    <div><div style={{ color: "#59667A" }}>Detected via</div><div style={{ color: "#C3CCDA" }}>Behavioral anomaly engine</div></div>
                    <div><div style={{ color: "#59667A" }}>Recommended action</div><div style={{ color: "#22D3EE" }}>{e.status === "BLOCKED" ? "Already contained" : "Escalate to Incident Response"}</div></div>
                  </div>
                )}
              </Panel>
            </Reveal>
          );
        })}
        {filtered.length === 0 && (
          <Panel className="p-8 text-center text-sm" style={{ color: "#59667A" }}>No events match this filter right now.</Panel>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   RISK ANALYZER
   ============================================================ */
function RiskAnalyzerPage() {
  const [form, setForm] = useState({
    userId: "player_4821", amount: 12000, frequency: "High", deviceChange: true,
    ipChange: true, location: "Mumbai", spendPattern: "Deviating", accountAge: 6, gameplayAnomaly: true,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function analyze() {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const factors = [
        { label: "Unusual transaction frequency", pts: form.frequency === "High" ? 24 : form.frequency === "Medium" ? 12 : 4, cat: "behavior" },
        { label: "New device", pts: form.deviceChange ? 18 : 0, cat: "device" },
        { label: "IP anomaly", pts: form.ipChange ? 15 : 0, cat: "device" },
        { label: "Spending pattern deviation", pts: form.spendPattern === "Deviating" ? 21 : 5, cat: "financial" },
        { label: "Gameplay anomaly", pts: form.gameplayAnomaly ? 16 : 0, cat: "behavior" },
        { label: "Account age factor", pts: form.accountAge < 3 ? 10 : form.accountAge < 12 ? 4 : 0, cat: "account" },
      ].filter((f) => f.pts > 0);
      const total = Math.min(99, factors.reduce((s, f) => s + f.pts, 0) + randInt(0, 4));
      const level = total > 80 ? "CRITICAL" : total > 55 ? "HIGH" : total > 30 ? "MEDIUM" : "LOW";
      const catMax = { behavior: 40, device: 33, financial: 21, account: 10 };
      const catPts = { behavior: 0, device: 0, financial: 0, account: 0 };
      factors.forEach((f) => { catPts[f.cat] += f.pts; });
      const categories = [
        { key: "behavior", label: "Behavioral", value: Math.round((catPts.behavior / catMax.behavior) * 100) },
        { key: "device", label: "Device/Network", value: Math.round((catPts.device / catMax.device) * 100) },
        { key: "financial", label: "Financial", value: Math.round((catPts.financial / catMax.financial) * 100) },
        { key: "account", label: "Account", value: Math.round((catPts.account / catMax.account) * 100) },
      ];
      setResult({ factors, total, level, categories });
      setLoading(false);
    }, 900);
  }

  const levelColor = (lvl) => (lvl === "CRITICAL" ? "#F87171" : lvl === "HIGH" ? "#FB923C" : lvl === "MEDIUM" ? "#FBBF24" : "#34D399");

  return (
    <div className="space-y-5">
      <Reveal>
        <SectionEyebrow>Risk Quantification</SectionEyebrow>
        <h1 className="text-2xl font-bold" style={disp}>AI Risk Analyzer</h1>
        <p className="text-xs mt-1" style={{ color: "#59667A" }}>Demo inference — connect to SCyber ML API for production inference.</p>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-4">
        <Reveal delay={0.05}>
          <Panel glow className="p-5 space-y-4 h-full">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="User ID"><input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="cs-input" /></Field>
              <Field label="Transaction Amount (₹)"><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="cs-input" /></Field>
              <Field label="Transaction Frequency">
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="cs-input">
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </Field>
              <Field label="Login Location"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="cs-input" /></Field>
              <Field label="Spending Pattern">
                <select value={form.spendPattern} onChange={(e) => setForm({ ...form, spendPattern: e.target.value })} className="cs-input">
                  <option>Consistent</option><option>Deviating</option>
                </select>
              </Field>
              <Field label="Account Age (months)"><input type="number" value={form.accountAge} onChange={(e) => setForm({ ...form, accountAge: e.target.value })} className="cs-input" /></Field>
            </div>
            <div className="flex flex-wrap gap-4 pt-1">
              <Toggle label="Device change" checked={form.deviceChange} onChange={(v) => setForm({ ...form, deviceChange: v })} />
              <Toggle label="IP change" checked={form.ipChange} onChange={(v) => setForm({ ...form, ipChange: v })} />
              <Toggle label="Gameplay anomaly" checked={form.gameplayAnomaly} onChange={(v) => setForm({ ...form, gameplayAnomaly: v })} />
            </div>
            <button onClick={analyze} disabled={loading} className="w-full py-3 rounded-lg font-semibold text-sm mt-2 transition-transform active:scale-[0.98]" style={{ background: "#22D3EE", color: "#04121A", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Analyzing…" : "ANALYZE THREAT"}
            </button>
          </Panel>
        </Reveal>

        <Reveal delay={0.1}>
          <Panel glow={!!result} className="p-5 h-full">
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10" style={{ color: "#59667A" }}>
                <Gauge size={30} className="mb-3 opacity-50" />
                <div className="text-sm">Run an analysis to see the risk score and explanation</div>
              </div>
            )}
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10" style={{ color: "#22D3EE" }}>
                <div className="text-sm animate-pulse">Scoring behavioral signals…</div>
              </div>
            )}
            {result && (
              <div>
                <div className="flex flex-col items-center mb-4">
                  <RadialScore value={result.total} size={160} label="/ 100 RISK" sublabel={result.level} color={levelColor(result.level)} />
                </div>
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {result.categories.map((c) => (
                    <MiniRing key={c.key} value={c.value} label={c.label} color={levelColor(result.level)} size={62} />
                  ))}
                </div>
                <SectionEyebrow>Explainable breakdown</SectionEyebrow>
                <div className="space-y-2.5">
                  {result.factors.map((f, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: "#C3CCDA" }}>{f.label}</span>
                        <span className="font-semibold tabular-nums" style={{ color: "#F87171", ...mono }}>+{f.pts}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "#141C28" }}>
                        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, f.pts * 3)}%`, background: "#F87171" }} />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm pt-3 font-bold border-t mt-3" style={{ borderColor: "#1C2635" }}>
                    <span>Total Risk Score</span>
                    <span style={mono}>{result.total}</span>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </Reveal>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "#59667A", ...mono }}>{label}</div>
      {children}
    </label>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-2 text-xs" style={{ color: "#C3CCDA" }}>
      <span className="w-9 h-5 rounded-full relative transition-colors" style={{ background: checked ? "#22D3EE" : "#1C2635" }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: checked ? 18 : 2 }} />
      </span>
      {label}
    </button>
  );
}

/* ============================================================
   PII SCANNER
   ============================================================ */
function scanPII(text) {
  const matches = [];
  const patterns = [
    { type: "EMAIL", re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { type: "PHONE", re: /\b[6-9]\d{9}\b/g },
    { type: "CARD", re: /\b(?:\d[ -]?){13,16}\b/g },
    { type: "ADDRESS", re: /\b\d{1,4}\s+[A-Za-z]+\s+(Street|St|Road|Rd|Avenue|Nagar|Colony)\b/gi },
  ];
  patterns.forEach((p) => {
    let m;
    while ((m = p.re.exec(text)) !== null) matches.push({ type: p.type, value: m[0], index: m.index });
  });
  return matches.sort((a, b) => a.index - b.index);
}

function PiiScannerPage({ addAudit }) {
  const [text, setText] = useState("My name is Rahul and my phone number is 9876543210. My email is rahul@example.com.");
  const [matches, setMatches] = useState(null);
  const [mode, setMode] = useState(null);

  function scan() {
    const m = scanPII(text);
    setMatches(m);
    setMode(null);
    addAudit("PII SCANNER", `Scanned text block, found ${m.length} PII item(s)`);
  }

  function apply(action) {
    setMode(action);
    addAudit("PII SCANNER", `${action === "redact" ? "Redacted" : action === "tokenize" ? "Tokenized" : "Allowed"} ${matches.length} PII item(s)`);
  }

  const processed = useMemo(() => {
    if (!matches || !mode) return text;
    let out = text;
    if (mode === "redact") {
      matches.forEach((m) => { out = out.split(m.value).join(`[REDACTED_${m.type}]`); });
    } else if (mode === "tokenize") {
      matches.forEach((m, i) => { out = out.split(m.value).join(`«TOKEN_${m.type}_${i}»`); });
    }
    return out;
  }, [matches, mode, text]);

  return (
    <div className="space-y-5">
      <Reveal>
        <SectionEyebrow>Data Leak Prevention</SectionEyebrow>
        <h1 className="text-2xl font-bold" style={disp}>PII Scanner</h1>
        <p className="text-xs mt-1" style={{ color: "#59667A" }}>Demo NLP scanner — pattern-based detection, no data leaves the browser.</p>
      </Reveal>

      <Reveal delay={0.05}>
      <Panel glow className="p-5 space-y-4">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="cs-input w-full resize-none" />
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={scan} className="px-4 py-2.5 rounded-lg font-semibold text-sm" style={{ background: "#22D3EE", color: "#04121A" }}>
            SCAN FOR PII
          </button>
          {matches && (
            <span className="text-sm font-semibold" style={{ color: matches.length ? "#F87171" : "#34D399" }}>
              PII DETECTED: {matches.length}
            </span>
          )}
        </div>

        {matches && matches.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {matches.map((m, i) => (
                <span key={i} className="px-2 py-1 rounded-md text-[11px]" style={{ background: "rgba(248,113,113,0.12)", color: "#F87171", ...mono }}>
                  {m.type}: {m.value}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => apply("redact")} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: "#F87171", color: "#F87171" }}>REDACT</button>
              <button onClick={() => apply("tokenize")} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: "#22D3EE", color: "#22D3EE" }}>TOKENIZE</button>
              <button onClick={() => apply("allow")} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: "#34D399", color: "#34D399" }}>ALLOW</button>
            </div>
            {mode && (
              <div className="p-3 rounded-lg text-sm" style={{ background: "#121A28", color: "#C3CCDA", ...mono }}>
                {processed}
              </div>
            )}
          </>
        )}
        {matches && matches.length === 0 && (
          <div className="text-sm" style={{ color: "#34D399" }}>No PII detected in this text.</div>
        )}
      </Panel>
      </Reveal>
    </div>
  );
}

/* ============================================================
   BOT & SMURF DETECTION
   ============================================================ */
function BotDetectionPage() {
  const botConf = 94, smurfProb = 82, normal = 18;
  const metrics = [
    { label: "Match frequency", value: "38 matches/day", flag: true },
    { label: "Avg session duration", value: "2.1 hrs (constant)", flag: true },
    { label: "Movement patterns", value: "Repetitive, sub-100ms", flag: true },
    { label: "Reaction timing", value: "±3ms variance", flag: true },
    { label: "Account age", value: "4 days", flag: true },
    { label: "Device similarity", value: "98% match to known bot cluster", flag: true },
    { label: "IP similarity", value: "Shared subnet, 6 accounts", flag: true },
  ];
  const behaviorTrend = Array.from({ length: 10 }, (_, i) => ({ t: `S${i + 1}`, bot: randInt(70, 98), human: randInt(5, 30) }));

  return (
    <div className="space-y-5">
      <Reveal>
        <SectionEyebrow>Behavioral Analysis</SectionEyebrow>
        <h1 className="text-2xl font-bold" style={disp}>Bot & Smurf Detection</h1>
        <p className="text-xs mt-1" style={{ color: "#59667A" }}>Behavioral analysis for account player_782</p>
      </Reveal>

      <Reveal delay={0.05}>
        <Panel glow className="p-5 flex flex-wrap items-center justify-center gap-8">
          <RadialScore value={botConf} size={140} label="/ 100" sublabel="BOT CONFIDENCE" color="#F87171" />
          <MiniRing value={smurfProb} label="Smurf Probability" color="#FBBF24" size={84} />
          <MiniRing value={normal} label="Normal Behavior" color="#34D399" size={84} />
        </Panel>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="grid lg:grid-cols-2 gap-4">
          <Panel glow className="p-4">
            <SectionEyebrow>Signals contributing to score</SectionEyebrow>
            <div className="space-y-2">
              {metrics.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b" style={{ borderColor: "#141C28" }}>
                  <span style={{ color: "#8B98AC" }}>{m.label}</span>
                  <span style={{ color: m.flag ? "#FB923C" : "#34D399", ...mono }} className="text-xs">{m.value}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel glow className="p-4">
            <SectionEyebrow>Behavioral anomaly across recent sessions</SectionEyebrow>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={behaviorTrend}>
                <CartesianGrid stroke="#1C2635" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke="#59667A" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#59667A" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid #1C2635", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="bot" stroke="#F87171" strokeWidth={2} dot={false} name="Bot score" />
                <Line type="monotone" dataKey="human" stroke="#34D399" strokeWidth={2} dot={false} name="Human score" />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </Reveal>
    </div>
  );
}

/* ============================================================
   TRANSACTIONS
   ============================================================ */
function TransactionsPage({ addAudit }) {
  const [rows] = useState(() => seedTransactions(18));
  const [selected, setSelected] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  function act(action) {
    addAudit("SYSTEM", `${action} applied to transaction ${selected.id}`);
    setConfirmAction(null);
    setSelected(null);
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <SectionEyebrow>Fraud Detection</SectionEyebrow>
        <h1 className="text-2xl font-bold" style={disp}>Transaction Fraud Detection</h1>
      </Reveal>
      <Reveal delay={0.05}>
      <Panel glow className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "#1C2635" }}>
              {["Transaction ID", "User", "Amount", "Device", "Location", "Risk", "Threat Type", "Status"].map((h) => (
                <th key={h} className="py-2.5 px-3 text-[11px] uppercase tracking-wide" style={{ color: "#59667A", ...mono }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} onClick={() => setSelected(r)} className="border-b cursor-pointer hover:bg-white/[0.02]" style={{ borderColor: "#141C28" }}>
                <td className="py-2.5 px-3" style={mono}>{r.id}</td>
                <td className="py-2.5 px-3">{r.user}</td>
                <td className="py-2.5 px-3" style={mono}>₹{r.amount.toLocaleString("en-IN")}</td>
                <td className="py-2.5 px-3 text-xs" style={{ color: "#8B98AC" }}>{r.device}</td>
                <td className="py-2.5 px-3 text-xs" style={{ color: "#8B98AC" }}>{r.location}</td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: r.risk > 80 ? "#F87171" : r.risk > 50 ? "#FBBF24" : "#34D399", ...mono }}>{r.risk}</td>
                <td className="py-2.5 px-3 text-xs">{r.threat}</td>
                <td className="py-2.5 px-3"><StatusPill status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      </Reveal>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border p-5 max-h-[90vh] overflow-y-auto" style={{ background: "#0D1420", borderColor: "#1C2635" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold" style={mono}>{selected.id}</div>
              <button onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><div className="text-[11px]" style={{ color: "#59667A" }}>User</div>{selected.user}</div>
              <div><div className="text-[11px]" style={{ color: "#59667A" }}>Amount</div>₹{selected.amount.toLocaleString("en-IN")}</div>
              <div><div className="text-[11px]" style={{ color: "#59667A" }}>Device</div>{selected.device}</div>
              <div><div className="text-[11px]" style={{ color: "#59667A" }}>Location</div>{selected.location}</div>
            </div>
            <div className="mb-4">
              <div className="text-[11px] uppercase mb-1" style={{ color: "#59667A", ...mono }}>AI Explanation</div>
              <div className="text-sm" style={{ color: "#C3CCDA" }}>
                Flagged due to device change combined with a {selected.risk > 70 ? "large" : "moderate"} amount relative to account history and a spending pattern deviation from the 30-day baseline.
              </div>
            </div>
            <div className="mb-5">
              <div className="text-[11px] uppercase mb-2" style={{ color: "#59667A", ...mono }}>Timeline</div>
              <div className="space-y-1.5 text-xs" style={{ color: "#8B98AC" }}>
                <div>10:12 — Transaction initiated</div>
                <div>10:12 — Risk engine scored {selected.risk}/100</div>
                <div>10:12 — Routed to {selected.status.toLowerCase()} queue</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmAction("BLOCK")} className="py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>BLOCK</button>
              <button onClick={() => setConfirmAction("ALLOW")} className="py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399" }}>ALLOW</button>
              <button onClick={() => setConfirmAction("INVESTIGATE")} className="py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>INVESTIGATE</button>
              <button onClick={() => setConfirmAction("ESCALATE")} className="py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(34,211,238,0.12)", color: "#22D3EE" }}>ESCALATE</button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6" onClick={() => setConfirmAction(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl border p-5" style={{ background: "#0D1420", borderColor: "#1C2635" }}>
            <div className="text-sm mb-4">Confirm: <b>{confirmAction}</b> transaction {selected?.id}?</div>
            <div className="flex gap-2">
              <button onClick={() => act(confirmAction)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: "#22D3EE", color: "#04121A" }}>Confirm</button>
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 rounded-lg text-sm border" style={{ borderColor: "#1C2635" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ACCOUNT SECURITY / TAKEOVER DETECTION
   ============================================================ */
function AccountSecurityPage({ addAudit, role }) {
  const [status, setStatus] = useState("UNRESOLVED");
  const account = { user: "player_4821", prevLoc: "Jaipur", curLoc: "Mumbai", ip: "Changed", behavior: "Unusual", risk: 89 };

  function act(action) {
    setStatus(action);
    addAudit(role === "PLAYER" ? "USER" : "ADMIN", `${action.replace("_", " ")} for ${account.user}`);
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <SectionEyebrow>Account Takeover Detection</SectionEyebrow>
        <h1 className="text-2xl font-bold" style={disp}>{role === "PLAYER" ? "Your Account Security" : "Account Takeover Detection"}</h1>
      </Reveal>
      <Reveal delay={0.05}>
      <div className="grid lg:grid-cols-3 gap-4">
        <Panel glow className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold" style={mono}>{account.user}</div>
            <span className="text-2xl font-extrabold" style={{ color: "#F87171", ...disp }}>{account.risk}<span className="text-sm" style={{ color: "#59667A" }}>/100</span></span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm mb-5">
            <div className="flex items-center gap-2"><Smartphone size={14} style={{ color: "#FBBF24" }} /> Login: <b>New Device</b></div>
            <div className="flex items-center gap-2"><MapPin size={14} style={{ color: "#8B98AC" }} /> Previous: {account.prevLoc}</div>
            <div className="flex items-center gap-2"><MapPin size={14} style={{ color: "#F87171" }} /> Current: {account.curLoc}</div>
            <div className="flex items-center gap-2"><Wifi size={14} style={{ color: "#F87171" }} /> IP: {account.ip}</div>
          </div>
          <div className="text-[11px] uppercase mb-2" style={{ color: "#59667A", ...mono }}>Activity timeline</div>
          <div className="space-y-1.5 text-xs mb-5" style={{ color: "#8B98AC" }}>
            <div>09:58 — Login from known device, Jaipur</div>
            <div>10:31 — New login from Mumbai, device unrecognized</div>
            <div>10:31 — IP address changed mid-session</div>
            <div>10:32 — Behavioral anomaly score raised to {account.risk}</div>
          </div>
          {status === "UNRESOLVED" ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button onClick={() => act("BLOCK_ACCOUNT")} className="py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>BLOCK ACCOUNT</button>
              <button onClick={() => act("FORCE_LOGOUT")} className="py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>FORCE LOGOUT</button>
              <button onClick={() => act("RESET_SESSION")} className="py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(34,211,238,0.12)", color: "#22D3EE" }}>RESET SESSION</button>
              <button onClick={() => act("MARK_SAFE")} className="py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399" }}>MARK SAFE</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#34D399" }}>
              <CheckCircle2 size={16} /> Action applied: {status.replace("_", " ")}
            </div>
          )}
        </Panel>
        <Panel glow className="p-5">
          <div className="text-sm font-semibold mb-3">Why this was flagged</div>
          <ul className="space-y-2 text-xs" style={{ color: "#8B98AC" }}>
            <li>• Login from a city ~1,100km from the last known location within minutes</li>
            <li>• Device fingerprint not seen on this account before</li>
            <li>• IP address changed mid-session</li>
            <li>• Behavior diverges from the account's typical pattern</li>
          </ul>
        </Panel>
      </div>
      </Reveal>
    </div>
  );
}

/* ============================================================
   INCIDENT RESPONSE CENTER
   ============================================================ */
const STAGES = ["DETECTED", "ANALYZING", "RISK_ASSESSED", "RESPONSE", "RESOLVED"];
function IncidentResponsePage({ addAudit }) {
  const [incidents, setIncidents] = useState(() => seedIncidents(9));

  function advance(id, newStage, action) {
    setIncidents((prev) => prev.map((inc) => (inc.id === id ? { ...inc, stage: newStage } : inc)));
    addAudit("SECURITY TEAM", `${action} on ${id}`);
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <SectionEyebrow>Automated Incident Response</SectionEyebrow>
        <h1 className="text-2xl font-bold" style={disp}>Incident Response Center</h1>
      </Reveal>
      <Reveal delay={0.05}>
      <Panel glow className="p-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide mb-1" style={{ color: "#59667A", ...mono }}>
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              {s.replace("_", " ")}{i < STAGES.length - 1 && <ArrowRight size={11} />}
            </div>
          ))}
        </div>
      </Panel>
      </Reveal>
      <div className="grid md:grid-cols-2 gap-3">
        {incidents.map((inc, idx) => {
          const stageIdx = STAGES.indexOf(inc.stage);
          return (
          <Reveal key={inc.id} delay={Math.min(idx * 0.04, 0.3)}>
          <Panel glow={inc.stage === "RESOLVED"} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm" style={mono}>{inc.id}</span>
              <SeverityPill severity={inc.severity} />
            </div>
            <div className="text-sm mb-1">{inc.type.replaceAll("_", " ")}</div>
            <div className="text-xs mb-3" style={{ color: "#59667A", ...mono }}>{inc.user} · risk {inc.risk} · {inc.detected}</div>
            <div className="flex items-center gap-1 mb-3">
              {STAGES.map((s, i) => (
                <div key={s} className="h-1 flex-1 rounded-full transition-colors duration-500" style={{ background: i <= stageIdx ? "#22D3EE" : "#1C2635" }} />
              ))}
            </div>
            <div className="text-xs mb-3">
              Stage: <span className="font-semibold" style={{ color: "#22D3EE" }}>{inc.stage.replace("_", " ")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => advance(inc.id, "RESPONSE", "Blocked account")} className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: "rgba(248,113,113,0.12)", color: "#F87171" }}>BLOCK</button>
              <button onClick={() => advance(inc.id, "RESPONSE", "Froze transaction")} className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: "rgba(251,146,60,0.12)", color: "#FB923C" }}>FREEZE TX</button>
              <button onClick={() => advance(inc.id, "ANALYZING", "Alerted security team")} className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>ALERT TEAM</button>
              <button onClick={() => advance(inc.id, "RISK_ASSESSED", "Escalated incident")} className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: "rgba(34,211,238,0.12)", color: "#22D3EE" }}>ESCALATE</button>
              <button onClick={() => advance(inc.id, "RESOLVED", "Resolved incident")} className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399" }}>RESOLVE</button>
            </div>
          </Panel>
          </Reveal>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   SIMULATE CYBER ATTACK
   ============================================================ */
const PIPELINE = ["NORMAL ACTIVITY", "SUSPICIOUS EVENT", "FEATURE ENGINEERING", "ANOMALY DETECTION", "THREAT CLASSIFICATION", "RISK SCORING", "THREAT DETECTED", "AUTOMATED RESPONSE"];
function SimulateAttackPage({ addAudit }) {
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);

  function start() {
    setRunning(true);
    setStep(0);
    let s = 0;
    timer.current = setInterval(() => {
      s++;
      setStep(s);
      if (s >= PIPELINE.length - 1) {
        clearInterval(timer.current);
        setRunning(false);
        addAudit("AI ENGINE", "Detected account takeover — automated response executed");
      }
    }, 700);
  }
  function reset() {
    clearInterval(timer.current);
    setStep(-1);
    setRunning(false);
  }
  useEffect(() => () => clearInterval(timer.current), []);

  const done = step === PIPELINE.length - 1;

  return (
    <div className="space-y-6">
      <Reveal>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <SectionEyebrow>Automated Response</SectionEyebrow>
          <h1 className="text-2xl font-bold" style={disp}>Automated Response Demo</h1>
          <p className="text-xs mt-1" style={{ color: "#59667A" }}>Watch the full detection-to-response pipeline run end to end</p>
        </div>
        <div className="flex gap-2">
          <button onClick={start} disabled={running} className="px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2" style={{ background: "#22D3EE", color: "#04121A", opacity: running ? 0.6 : 1 }}>
            <Play size={14} /> SIMULATE CYBER ATTACK
          </button>
          <button onClick={reset} className="px-4 py-2.5 rounded-lg font-semibold text-sm border flex items-center gap-2" style={{ borderColor: "#1C2635" }}>
            <RotateCcw size={14} /> RESET
          </button>
        </div>
      </div>
      </Reveal>

      <Reveal delay={0.05}>
      <Panel glow className="p-5">
        <div className="flex flex-col gap-0 relative">
          {PIPELINE.map((p, i) => {
            const active = i === step;
            const done_ = i < step || (i === step && done);
            return (
              <div key={p} className="flex items-center gap-3 relative pb-4 last:pb-0">
                {i < PIPELINE.length - 1 && (
                  <span className="absolute left-[13px] top-7 bottom-0 w-px" style={{ background: done_ ? "#34D399" : "#1C2635" }} />
                )}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-300 relative z-10"
                  style={{
                    background: done_ ? "#34D399" : active ? "#22D3EE" : "#141C28",
                    color: done_ || active ? "#04121A" : "#59667A",
                    boxShadow: active ? "0 0 12px #22D3EE" : "none",
                  }}
                >
                  {done_ ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <div className="text-sm transition-colors" style={{ color: active || done_ ? "#E7ECF3" : "#59667A" }}>{p}</div>
                {active && !done && <span className="ml-1 text-xs animate-pulse" style={{ color: "#22D3EE" }}>processing…</span>}
              </div>
            );
          })}
        </div>
      </Panel>
      </Reveal>

      {done && (
        <Reveal>
        <Panel glow className="p-5" style={{ borderColor: "#F87171" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} style={{ color: "#F87171" }} />
            <span className="font-bold" style={{ color: "#F87171" }}>THREAT DETECTED</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4 text-sm">
            <div><div className="text-[11px]" style={{ color: "#59667A" }}>Risk Score</div><div className="font-extrabold text-2xl" style={disp}>96/100</div></div>
            <div><div className="text-[11px]" style={{ color: "#59667A" }}>Threat</div><div className="font-bold">ACCOUNT TAKEOVER</div></div>
          </div>
          <div className="text-[11px] uppercase mb-2" style={{ color: "#59667A", ...mono }}>Response</div>
          <div className="grid sm:grid-cols-2 gap-1.5 text-sm">
            {["Account blocked", "Session terminated", "Transaction frozen", "Security team alerted", "Incident logged"].map((r) => (
              <div key={r} className="flex items-center gap-2" style={{ color: "#34D399" }}><CheckCircle2 size={14} /> {r}</div>
            ))}
          </div>
        </Panel>
        </Reveal>
      )}
    </div>
  );
}

/* ============================================================
   ANALYTICS
   ============================================================ */
function AnalyticsPage() {
  const [range, setRange] = useState("7D");
  const data = useMemo(() => Array.from({ length: range === "24H" ? 8 : range === "7D" ? 7 : 30 }, (_, i) => ({
    t: range === "24H" ? `${i * 3}:00` : range === "7D" ? `Day ${i + 1}` : `D${i + 1}`,
    threats: randInt(20, 90), blocked: randInt(10, 60), fraud: randInt(5, 30), pii: randInt(2, 15),
  })), [range]);

  return (
    <div className="space-y-5">
      <Reveal>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <SectionEyebrow>Threat Analytics</SectionEyebrow>
          <h1 className="text-2xl font-bold" style={disp}>Threat Analytics</h1>
        </div>
        <div className="flex gap-1.5">
          {["24H", "7D", "30D"].map((r) => (
            <button key={r} onClick={() => setRange(r)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: range === r ? "#22D3EE" : "#1C2635", color: range === r ? "#22D3EE" : "#8B98AC" }}>{r}</button>
          ))}
        </div>
      </div>
      </Reveal>
      <Reveal delay={0.05}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Threats Detected" value="482" tone="neutral" icon={Activity} />
        <KPI label="Threats Blocked" value="311" tone="crit" icon={ShieldAlert} />
        <KPI label="Fraud Attempts" value="96" tone="warn" icon={CreditCard} />
        <KPI label="Avg Response Time" value="1.8s" tone="safe" icon={Clock} />
      </div>
      </Reveal>
      <Reveal delay={0.1}>
      <Panel glow className="p-4">
        <SectionEyebrow>Detection volume ({range})</SectionEyebrow>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid stroke="#1C2635" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="t" stroke="#59667A" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis stroke="#59667A" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#0D1420", border: "1px solid #1C2635", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="threats" fill="#22D3EE" radius={[3, 3, 0, 0]} name="Threats" />
            <Bar dataKey="blocked" fill="#F87171" radius={[3, 3, 0, 0]} name="Blocked" />
            <Bar dataKey="fraud" fill="#FBBF24" radius={[3, 3, 0, 0]} name="Fraud" />
            <Bar dataKey="pii" fill="#34D399" radius={[3, 3, 0, 0]} name="PII" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      </Reveal>
    </div>
  );
}

/* ============================================================
   AUDIT LOGS
   ============================================================ */
function AuditLogsPage({ log }) {
  const [filter, setFilter] = useState("All");
  const sources = ["All", "SYSTEM", "ADMIN", "AI ENGINE", "PII SCANNER", "SECURITY TEAM", "USER"];
  const filtered = filter === "All" ? log : log.filter((l) => l.source === filter);
  return (
    <div className="space-y-5">
      <Reveal>
        <SectionEyebrow>Compliance</SectionEyebrow>
        <h1 className="text-2xl font-bold" style={disp}>Audit Logs</h1>
      </Reveal>
      <Reveal delay={0.05}>
      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className="px-3 py-1.5 rounded-full text-xs font-medium border" style={{ borderColor: filter === s ? "#22D3EE" : "#1C2635", color: filter === s ? "#22D3EE" : "#8B98AC" }}>{s}</button>
        ))}
      </div>
      </Reveal>
      <Reveal delay={0.1}>
      <Panel glow className="divide-y" style={{ borderColor: "#1C2635" }}>
        {filtered.length === 0 && <div className="p-6 text-sm text-center" style={{ color: "#59667A" }}>No log entries yet — actions taken in the console will appear here.</div>}
        {filtered.map((l, i) => (
          <div key={i} className="relative p-3.5 pl-4 flex items-start gap-3 text-sm" style={{ borderColor: "#141C28" }}>
            <span className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: "rgba(34,211,238,0.4)" }} />
            <span className="text-xs shrink-0 w-16" style={{ color: "#59667A", ...mono }}>{l.time}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ background: "#141C28", color: "#22D3EE", ...mono }}>{l.source}</span>
            <span style={{ color: "#C3CCDA" }}>{l.message}</span>
          </div>
        ))}
      </Panel>
      </Reveal>
    </div>
  );
}

/* ============================================================
   SYSTEM ARCHITECTURE
   ============================================================ */
const ARCH_LAYERS = [
  { title: "Client Layer", items: [{ n: "Player Web / Mobile App", icon: Smartphone }, { n: "Game Server Events", icon: Server }, { n: "Security Dashboard", icon: Shield }] },
  { title: "Gateway", items: [{ n: "API Gateway + RBAC Auth", icon: Lock }] },
  { title: "Streaming", items: [{ n: "Kafka Event Stream", icon: Network }] },
  { title: "Detection Services", items: [{ n: "Fraud Detection Service", icon: CreditCard }, { n: "PII Scanner Service", icon: FileWarning }] },
  { title: "Intelligence", items: [{ n: "Risk Scoring & Alert Correlation", icon: Gauge }] },
  { title: "Storage", items: [{ n: "PostgreSQL / Secure DB", icon: Database }] },
  { title: "Response", items: [{ n: "SMS / Push Alerts", icon: Bell }, { n: "Audit & Compliance Log", icon: FileText }] },
];
const ARCH_DESC = {
  "Player Web / Mobile App": "Where players interact with the game; the source of raw client-side telemetry.",
  "Game Server Events": "Authoritative gameplay and transaction events emitted by the game backend.",
  "Security Dashboard": "This console — used by security teams and admins to monitor and respond.",
  "API Gateway + RBAC Auth": "Single entry point that authenticates requests and enforces role-based access.",
  "Kafka Event Stream": "Durable, ordered event pipeline that decouples producers from detection services.",
  "Fraud Detection Service": "Scores transactions for fraud using behavioral and transactional features.",
  "PII Scanner Service": "Scans text streams for personal data and applies redaction/tokenization.",
  "Risk Scoring & Alert Correlation": "Combines signals across services into a single explainable risk score.",
  "PostgreSQL / Secure DB": "Encrypted store for user, transaction and incident records.",
  "SMS / Push Alerts": "Notifies players and security teams of high-risk events in real time.",
  "Audit & Compliance Log": "Immutable record of every automated and human action for compliance.",
};

function ArchitecturePage() {
  const [active, setActive] = useState(null);
  return (
    <div className="space-y-5">
      <Reveal>
        <SectionEyebrow>System Architecture</SectionEyebrow>
        <h1 className="text-2xl font-bold" style={disp}>System Architecture</h1>
        <p className="text-xs mt-1" style={{ color: "#59667A" }}>Click any component to see what it does</p>
      </Reveal>
      <div className="space-y-3">
        {ARCH_LAYERS.map((layer, li) => (
          <Reveal key={li} delay={Math.min(li * 0.06, 0.3)}>
            <div className="flex items-center gap-3">
              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${layer.items.length}, minmax(0,1fr))` }}>
                {layer.items.map((it, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(it.n)}
                    className="flex items-center gap-2 p-3 rounded-lg border text-left transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      borderColor: active === it.n ? "#22D3EE" : "#1C2635",
                      background: active === it.n ? "rgba(34,211,238,0.1)" : "rgba(13,20,32,0.7)",
                      boxShadow: active === it.n ? "0 0 16px rgba(34,211,238,0.25)" : "none",
                    }}
                  >
                    <it.icon size={16} style={{ color: "#22D3EE" }} />
                    <span className="text-xs font-medium">{it.n}</span>
                  </button>
                ))}
              </div>
            </div>
            {li < ARCH_LAYERS.length - 1 && (
              <div className="flex justify-center py-1">
                <div className="w-px h-4" style={{ background: "linear-gradient(#22D3EE, transparent)" }} />
              </div>
            )}
          </Reveal>
        ))}
      </div>
      {active && (
        <Panel glow className="p-4">
          <div className="text-sm font-semibold mb-1">{active}</div>
          <div className="text-xs" style={{ color: "#8B98AC" }}>{ARCH_DESC[active]}</div>
        </Panel>
      )}
    </div>
  );
}

/* ============================================================
   REPORT SUSPICIOUS ACTIVITY (player)
   ============================================================ */
function ReportPage({ addAudit }) {
  const [submitted, setSubmitted] = useState(false);
  const [incId, setIncId] = useState("");
  function submit(e) {
    e.preventDefault();
    const id = `INC-${randInt(6000, 6999)}`;
    setIncId(id);
    setSubmitted(true);
    addAudit("USER", `Player submitted report, generated ${id}`);
  }
  if (submitted) {
    return (
      <Reveal>
      <Panel glow className="p-8 text-center max-w-md mx-auto">
        <CheckCircle2 size={32} style={{ color: "#34D399" }} className="mx-auto mb-3" />
        <div className="font-bold mb-1">REPORT RECEIVED</div>
        <div className="text-sm mb-1" style={{ color: "#8B98AC" }}>Incident ID generated: <span style={mono}>{incId}</span></div>
        <div className="text-xs" style={{ color: "#59667A" }}>Security team notified.</div>
        <button onClick={() => setSubmitted(false)} className="mt-5 px-4 py-2 rounded-lg text-xs border" style={{ borderColor: "#1C2635" }}>Submit another report</button>
      </Panel>
      </Reveal>
    );
  }
  return (
    <div className="space-y-5">
      <Reveal>
        <SectionEyebrow>Player Self-Service</SectionEyebrow>
        <h1 className="text-2xl font-bold" style={disp}>Report Suspicious Activity</h1>
      </Reveal>
      <Reveal delay={0.05}>
      <Panel glow className="p-5 max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Report Type">
            <select className="cs-input" required>
              <option>Suspicious transaction</option><option>Account compromise</option><option>Bot / cheating</option><option>Harassment / chat abuse</option>
            </select>
          </Field>
          <Field label="Description"><textarea rows={3} className="cs-input resize-none" placeholder="Describe what happened…" required /></Field>
          <Field label="Transaction ID (optional)"><input className="cs-input" placeholder="TX-xxxxx" /></Field>
          <Field label="Screenshot / file"><input type="file" className="cs-input" /></Field>
          <button type="submit" className="w-full py-3 rounded-lg font-semibold text-sm" style={{ background: "#22D3EE", color: "#04121A" }}>SUBMIT REPORT</button>
        </form>
      </Panel>
      </Reveal>
    </div>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */
export default function SCyberApp() {
  useFonts();
  const [page, setPage] = useState("landing"); // landing | console
  const [tab, setTab] = useState("overview");
  const [role, setRole] = useState("SECURITY");
  const [events, setEvents] = useState(() => seedEvents(20));
  const [auditLog, setAuditLog] = useState(() => [
    { time: nowTime(), source: "SYSTEM", message: "Blocked transaction TX-83921" },
    { time: nowTime(), source: "AI ENGINE", message: "Detected account takeover for player_1842" },
    { time: nowTime(), source: "PII SCANNER", message: "Redacted phone number in chat stream" },
  ]);

  const addAudit = useCallback((source, message) => {
    setAuditLog((prev) => [{ time: nowTime(), source, message }, ...prev].slice(0, 100));
  }, []);

  const goHowItWorks = () => {
    setPage("landing");
    setTimeout(() => {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const style = `
    .cs-input {
      width: 100%;
      background: #121A28;
      border: 1px solid #1C2635;
      border-radius: 8px;
      padding: 9px 11px;
      font-size: 13px;
      color: #E7ECF3;
      outline: none;
    }
    .cs-input:focus { border-color: #22D3EE; }
    * { box-sizing: border-box; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-thumb { background: #1C2635; border-radius: 4px; }
    @keyframes csTwinkle {
      0%, 100% { opacity: 0.15; }
      50% { opacity: 0.9; }
    }
    @keyframes csArrive {
      0% { opacity: 0; transform: scale(0.82) translateY(24px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes csTicker {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes csFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes csCubeFloat {
      0%, 100% { transform: rotateX(-24deg) rotateY(38deg) translateY(0); }
      50% { transform: rotateX(-24deg) rotateY(38deg) translateY(-10px); }
    }
    @keyframes csScrollDot {
      0%, 100% { transform: translateY(0); opacity: 1; }
      50% { transform: translateY(6px); opacity: 0.4; }
    }
  `;

  return (
    <div style={disp}>
      <style>{style}</style>
      {page === "landing" ? (
        <LandingPage onLaunch={() => { setPage("console"); setTab("overview"); }} onHowItWorks={goHowItWorks} />
      ) : (
        <ConsoleShell tab={tab} setTab={setTab} role={role} setRole={setRole} onExit={() => setPage("landing")} addAudit={addAudit}>
          {tab === "overview" && <OverviewPage events={events} />}
          {tab === "monitor" && <ThreatMonitorPage events={events} setEvents={setEvents} />}
          {tab === "transactions" && <TransactionsPage addAudit={addAudit} />}
          {tab === "accounts" && <AccountSecurityPage addAudit={addAudit} role={role} />}
          {tab === "pii" && <PiiScannerPage addAudit={addAudit} />}
          {tab === "bot" && <BotDetectionPage />}
          {tab === "risk" && <RiskAnalyzerPage />}
          {tab === "incidents" && <IncidentResponsePage addAudit={addAudit} />}
          {tab === "attack" && <SimulateAttackPage addAudit={addAudit} />}
          {tab === "analytics" && <AnalyticsPage />}
          {tab === "audit" && <AuditLogsPage log={auditLog} />}
          {tab === "architecture" && <ArchitecturePage />}
          {tab === "report" && <ReportPage addAudit={addAudit} />}
        </ConsoleShell>
      )}
    </div>
  );
}
