import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, BookOpen, GitBranch, Globe, Layers, Lock,
  Radar, Rocket, Shield, ShieldAlert, Sparkles, Target, Waypoints, Zap,
  Code, Eye, BarChart3, Users, Check, ChevronRight
} from 'lucide-react';

/* ─── Particle Background ─── */
const ParticleField = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.offsetWidth;
        this.y = Math.random() * canvas.offsetHeight;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.offsetWidth) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.offsetHeight) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 242, 194, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 60; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach(p => { p.update(); p.draw(); });

      // Draw connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(56, 242, 194, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }} />;
};

/* ─── Typing Effect ─── */
const TypingText = ({ texts, speed = 80, pause = 2000 }) => {
  const [currentText, setCurrentText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const text = texts[textIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(text.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
        if (charIndex + 1 === text.length) {
          setTimeout(() => setIsDeleting(true), pause);
        }
      } else {
        setCurrentText(text.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, speed, pause]);

  return (
    <span>
      {currentText}
      <span className="typing-cursor inline-block w-0">&nbsp;</span>
    </span>
  );
};

/* ─── Animated Counter ─── */
const AnimCounter = ({ target, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const num = parseFloat(target);
    if (isNaN(num)) { setCount(target); return; }
    let start = 0;
    const step = num / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{typeof count === 'number' ? count : target}{suffix}</span>;
};

/* ─── Section Wrapper ─── */
const Section = ({ children, className = '', id }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

/* ─── Map Nodes for Hero Visualization ─── */
const mapNodes = [
  { label: 'Auth', x: '14%', y: '28%', color: 'var(--ca-accent)' },
  { label: 'API', x: '38%', y: '20%', color: 'var(--ca-warning)' },
  { label: 'Parser', x: '58%', y: '42%', color: 'var(--ca-accent)' },
  { label: 'Graph', x: '28%', y: '58%', color: 'var(--ca-success)' },
  { label: 'Billing', x: '76%', y: '24%', color: 'var(--ca-danger)' },
  { label: 'Models', x: '70%', y: '70%', color: 'var(--ca-warning)' },
];

/* ═══════════════════════════════════════════════════════════════ */
/*  HOME PAGE                                                     */
/* ═══════════════════════════════════════════════════════════════ */
const Home = () => {
  const features = [
    {
      icon: Radar,
      title: 'Architecture Mapping',
      desc: 'Paste any GitHub URL and instantly generate a full interactive dependency graph of your repository.',
      color: 'var(--ca-accent)'
    },
    {
      icon: ShieldAlert,
      title: 'Blast Radius Analysis',
      desc: 'Before changing a file, see every downstream module it touches. Prevent cascading failures before they happen.',
      color: 'var(--ca-danger)'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Summaries',
      desc: 'Get intelligent insights about your codebase structure, risk hotspots, and refactoring suggestions.',
      color: 'var(--ca-warning)'
    },
    {
      icon: BarChart3,
      title: 'Churn Detection',
      desc: 'Identify frequently-changed files that may indicate technical debt or unstable architecture.',
      color: '#a78bfa'
    },
    {
      icon: Layers,
      title: 'Layer Visualization',
      desc: 'Color-code files by folder, layer, or churn rate. Switch layouts: force-directed, grid, tree, radial.',
      color: '#f472b6'
    },
    {
      icon: Lock,
      title: 'Security Scanning',
      desc: 'Detect hardcoded secrets, exposed API keys, and common vulnerability patterns in your codebase.',
      color: '#fb923c'
    },
  ];

  const steps = [
    { icon: Globe, title: 'Paste Repository URL', desc: 'Enter any public GitHub repository link into the intelligence console.', step: '01' },
    { icon: Zap, title: 'AI Scans Architecture', desc: 'Our parser analyzes imports, exports, dependencies, and file relationships in seconds.', step: '02' },
    { icon: Eye, title: 'Explore Interactive Map', desc: 'Navigate a live graph visualization. Click nodes to see connections, blast radius, and ownership.', step: '03' },
    { icon: Shield, title: 'Assess Risk & Ship Safely', desc: 'View health scores, churn analysis, and security warnings before pushing code changes.', step: '04' },
  ];

  return (
    <div className="min-h-screen overflow-hidden" style={{ color: 'var(--ca-text)' }}>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative min-h-[calc(100vh-72px)] px-6 py-10 lg:px-10 flex items-center architecture-grid overflow-hidden">
        <ParticleField />
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, var(--ca-accent), transparent)`, opacity: 0.6 }} />

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="space-y-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ border: '1px solid var(--ca-border-glass)', background: 'rgba(56,242,194,0.08)', color: 'var(--ca-accent)' }}>
              <Sparkles size={15} /> AI Repository Intelligence
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl" style={{ color: 'var(--ca-text)' }}>
                CodeAtlas maps your repo before{' '}
                <span className="gradient-text">
                  <TypingText texts={['your next change breaks it.', 'bugs reach production.', 'complexity spirals.']} speed={70} pause={2500} />
                </span>
              </h1>
              <p className="max-w-2xl text-lg leading-8" style={{ color: 'var(--ca-text-secondary)' }}>
                Turn GitHub repositories into interactive architecture maps, inspect dependency paths, and predict blast radius before code ships.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 font-bold shadow-lg transition-all duration-300 hover:scale-105"
                style={{ background: 'var(--ca-accent)', color: 'var(--ca-bg)', boxShadow: `0 0 34px var(--ca-accent-glow)` }}
              >
                <Rocket size={19} /> Get Started Free
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 font-bold transition-all duration-300 hover:scale-105"
                style={{ border: '1px solid var(--ca-border)', background: 'var(--ca-surface)', color: 'var(--ca-text)' }}
              >
                <Waypoints size={19} /> Sign In
              </Link>
            </div>
            <div className="grid max-w-2xl grid-cols-3 gap-3 pt-3">
              {[
                [142, 'files indexed'],
                [31, 'risk paths'],
                ['8.4', 'sec scan', 's'],
              ].map(([value, label, suffix]) => (
                <div key={label} className="glass-card p-4 text-center">
                  <div className="font-mono text-2xl font-bold" style={{ color: 'var(--ca-accent)' }}>
                    <AnimCounter target={value} suffix={suffix || ''} />
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--ca-text-secondary)' }}>{label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.7 }}
            className="relative min-h-[500px] overflow-hidden rounded-2xl shadow-2xl"
            style={{ border: '1px solid var(--ca-border-glass)', background: 'rgba(7,16,15,0.7)' }}
          >
            <div className="signal-line flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--ca-border)', background: 'var(--ca-surface)' }}>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: 'rgba(56,242,194,0.12)', color: 'var(--ca-accent)' }}>
                  <GitBranch size={20} />
                </div>
                <div>
                  <div className="font-mono text-sm font-bold" style={{ color: 'var(--ca-text)' }}>github.com/openai/codeatlas-demo</div>
                  <div className="text-xs" style={{ color: 'var(--ca-text-secondary)' }}>main branch architecture snapshot</div>
                </div>
              </div>
              <div className="rounded-full px-3 py-1 font-mono text-xs" style={{ background: 'rgba(255,200,87,0.15)', color: 'var(--ca-warning)' }}>RISK: MEDIUM</div>
            </div>
            <div className="relative h-[440px]">
              <div className="scan-beam absolute top-0 h-full w-32" style={{ background: 'linear-gradient(to right, transparent, rgba(56,242,194,0.1), transparent)' }} />
              <svg className="absolute inset-0 h-full w-full" style={{ color: 'rgba(56,242,194,0.3)' }} aria-hidden="true">
                <line x1="14%" y1="28%" x2="38%" y2="20%" stroke="currentColor" />
                <line x1="38%" y1="20%" x2="58%" y2="42%" stroke="currentColor" />
                <line x1="58%" y1="42%" x2="70%" y2="70%" stroke="currentColor" />
                <line x1="38%" y1="20%" x2="76%" y2="24%" stroke="currentColor" />
                <line x1="14%" y1="28%" x2="28%" y2="58%" stroke="currentColor" />
                <line x1="28%" y1="58%" x2="58%" y2="42%" stroke="currentColor" />
              </svg>
              {mapNodes.map((node, i) => (
                <motion.div
                  key={node.label}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: node.x, top: node.y }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                >
                  <div className="mx-auto h-4 w-4 rounded-full" style={{ background: node.color, boxShadow: `0 0 22px ${node.color}` }} />
                  <div className="mt-2 rounded-lg px-3 py-1 font-mono text-xs"
                    style={{ border: '1px solid var(--ca-border)', background: 'var(--ca-surface)', color: 'var(--ca-text)', opacity: 0.9 }}>
                    {node.label}
                  </div>
                </motion.div>
              ))}
              <div className="absolute bottom-5 left-5 right-5 grid gap-3 md:grid-cols-3">
                {[
                  [Activity, 'Change heat', 'Parser and API have 62% of churn'],
                  [ShieldAlert, 'Blast radius', 'Billing touches 9 downstream files'],
                  [Radar, 'AI summary', 'Extract gateway interfaces first'],
                ].map(([Icon, title, text]) => (
                  <div key={title} className="glass-card p-4">
                    <Icon size={18} style={{ color: 'var(--ca-accent)' }} className="mb-3" />
                    <div className="text-sm font-bold" style={{ color: 'var(--ca-text)' }}>{title}</div>
                    <div className="mt-1 text-xs leading-5" style={{ color: 'var(--ca-text-secondary)' }}>{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <Section className="px-6 py-24 lg:px-10" id="how-it-works">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] mb-6"
              style={{ border: '1px solid var(--ca-border-glass)', background: 'rgba(56,242,194,0.08)', color: 'var(--ca-accent)' }}>
              <BookOpen size={15} /> User Guide
            </div>
            <h2 className="text-4xl font-black md:text-5xl gradient-text mb-4">How CodeAtlas Works</h2>
            <p className="max-w-2xl mx-auto text-lg" style={{ color: 'var(--ca-text-secondary)' }}>
              From GitHub URL to full architecture intelligence in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="glass-card p-6 relative group hover:scale-[1.02] transition-transform duration-300"
                >
                  <div className="absolute -top-4 -left-2 font-mono text-6xl font-black" style={{ color: 'var(--ca-accent)', opacity: 0.08 }}>
                    {step.step}
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(56,242,194,0.1)', border: '1px solid var(--ca-border-glass)' }}>
                    <Icon size={26} style={{ color: 'var(--ca-accent)' }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--ca-text)' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--ca-text-secondary)' }}>{step.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                      <ChevronRight size={20} style={{ color: 'var(--ca-accent)', opacity: 0.4 }} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══ FEATURES ═══ */}
      <Section className="px-6 py-24 lg:px-10" id="features">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black md:text-5xl mb-4" style={{ color: 'var(--ca-text)' }}>
              Everything you need to <span className="gradient-text">understand your code</span>
            </h2>
            <p className="max-w-2xl mx-auto text-lg" style={{ color: 'var(--ca-text-secondary)' }}>
              Powerful tools designed for developers who want to ship with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-7 group hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}>
                    <Icon size={24} style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--ca-text)' }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--ca-text-secondary)' }}>{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══ STATS BAR ═══ */}
      <Section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-5xl glass-card p-10 rounded-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 1200, label: 'Repositories Scanned', suffix: '+' },
              { value: 50000, label: 'Files Indexed', suffix: '+' },
              { value: 98, label: 'Accuracy Rate', suffix: '%' },
              { value: 4.2, label: 'Avg Scan Time', suffix: 's' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-black font-mono" style={{ color: 'var(--ca-accent)' }}>
                  <AnimCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--ca-text-secondary)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ KEY HIGHLIGHTS ═══ */}
      <Section className="px-6 py-24 lg:px-10" id="highlights">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black md:text-5xl mb-4" style={{ color: 'var(--ca-text)' }}>
              Why developers <span className="gradient-text">love CodeAtlas</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: 'Zero Configuration', desc: 'Just paste a GitHub URL. No SDK to install, no config files, no CI integration needed.', icon: Zap },
              { title: 'Interactive Graph Explorer', desc: '5 layout modes (force, grid, tree, radial, layers), zoom, pan, and click-to-inspect.', icon: Target },
              { title: 'Ownership Tracking', desc: 'See who owns each module, when it was last modified, and which team is responsible.', icon: Users },
              { title: 'Export & Share', desc: 'Share architecture snapshots with your team. Export graphs as images or data.', icon: Globe },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-8 flex gap-5 items-start hover:scale-[1.01] transition-transform"
                >
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(56,242,194,0.1)', border: '1px solid var(--ca-border-glass)' }}>
                    <Icon size={22} style={{ color: 'var(--ca-accent)' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--ca-text)' }}>{item.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--ca-text-secondary)' }}>{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══ IMPORTANT NOTES ═══ */}
      <Section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-4xl glass-card p-10 rounded-2xl" style={{ borderColor: 'var(--ca-warning)', borderWidth: '1px' }}>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--ca-warning)' }}>
            <BookOpen size={24} /> Important Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Public Repos Only', text: 'Currently supports public GitHub repositories. Private repo support coming soon.' },
              { title: 'JavaScript Focus', text: 'Parser optimized for JavaScript/Node.js. Python and TypeScript support in development.' },
              { title: 'Data Privacy', text: 'Your code is never stored. We only save the generated graph structure and metadata.' },
              { title: 'Browser Support', text: 'Best experience on Chrome, Firefox, Edge. Safari supported with minor limitations.' },
              { title: 'Rate Limits', text: 'Free tier allows 10 scans per day. The analysis uses GitHub API under the hood.' },
              { title: 'Demo Mode', text: 'The app works in demo mode without backend. Connect MongoDB for full features.' },
            ].map(note => (
              <div key={note.title} className="flex gap-3 items-start">
                <Check size={18} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--ca-accent)' }} />
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--ca-text)' }}>{note.title}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--ca-text-secondary)' }}>{note.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ CTA ═══ */}
      <Section className="px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-black md:text-6xl gradient-text mb-6">Ready to map your code?</h2>
            <p className="text-lg mb-10" style={{ color: 'var(--ca-text-secondary)' }}>
              Join developers who use CodeAtlas to understand, analyze, and ship code with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-bold transition-all duration-300 hover:scale-105"
                style={{ background: 'var(--ca-accent)', color: 'var(--ca-bg)', boxShadow: `0 0 40px var(--ca-accent-glow)` }}
              >
                <Rocket size={20} /> Start Free — No Credit Card
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-bold transition-all duration-300"
                style={{ border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }}
              >
                Sign In <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-6 py-16 lg:px-10" style={{ borderTop: '1px solid var(--ca-border)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-glow"
                  style={{ background: 'var(--ca-accent)' }}>
                  <Code size={18} style={{ color: 'var(--ca-bg)' }} />
                </div>
                <span className="font-mono font-bold text-xl tracking-widest gradient-text">CODEATLAS</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--ca-text-secondary)' }}>
                AI-powered repository intelligence platform. Map your code, understand dependencies,
                and ship with confidence. Built for developers who care about code quality.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--ca-text)' }}>Platform</h4>
              <ul className="space-y-2.5">
                {['Architecture Maps', 'Blast Radius', 'AI Summaries', 'Churn Detection', 'Security Scan'].map(item => (
                  <li key={item}>
                    <span className="text-sm cursor-default" style={{ color: 'var(--ca-text-secondary)' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--ca-text)' }}>Quick Links</h4>
              <ul className="space-y-2.5">
                <li><Link to="/login" className="text-sm hover:underline" style={{ color: 'var(--ca-text-secondary)' }}>Login</Link></li>
                <li><Link to="/signup" className="text-sm hover:underline" style={{ color: 'var(--ca-text-secondary)' }}>Sign Up</Link></li>
                <li><Link to="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--ca-text-secondary)' }}>Dashboard</Link></li>
                <li><a href="#how-it-works" className="text-sm hover:underline" style={{ color: 'var(--ca-text-secondary)' }}>How It Works</a></li>
                <li><a href="#features" className="text-sm hover:underline" style={{ color: 'var(--ca-text-secondary)' }}>Features</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid var(--ca-border)' }}>
            <div className="text-sm" style={{ color: 'var(--ca-text-secondary)' }}>
              © {new Date().getFullYear()} CodeAtlas. Built with Dedication by <span className="font-bold gradient-text">Sadashiv Gawade</span>
            </div>
            <div className="flex gap-6">
              <span className="text-xs" style={{ color: 'var(--ca-text-secondary)' }}>SG</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
