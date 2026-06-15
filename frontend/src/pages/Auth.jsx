import { useState, useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, GitBranch, Lock, Mail, Moon, Sun, User, Shield, Sparkles, ArrowRight, Code } from 'lucide-react';

/* ─── Animated Graph Background ─── */
const AuthBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let nodes = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    class Node {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.offsetWidth;
        this.y = Math.random() * canvas.offsetHeight;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.4 + 0.1;
        const colors = ['56, 242, 194', '255, 200, 87', '255, 92, 122', '167, 139, 250'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
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
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity * 0.2})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 40; i++) nodes.push(new Node());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      nodes.forEach(n => { n.update(); n.draw(); });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(56, 242, 194, ${0.06 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

/* ─── Login Component ─── */
export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { login } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: 'var(--ca-bg)' }}>
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #020a09, #0a1a18, #071210)' }}>
        <AuthBackground />
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-pulse-glow"
              style={{ background: 'var(--ca-accent)' }}>
              <Code size={36} style={{ color: '#020a09' }} />
            </div>
            <h2 className="text-4xl font-black gradient-text mb-4">CodeAtlas</h2>
            <p className="text-lg" style={{ color: 'var(--ca-text-secondary)' }}>
              AI-powered repository intelligence. Map your code, understand dependencies, ship with confidence.
            </p>
            <div className="flex gap-4 justify-center mt-8">
              {[
                { icon: GitBranch, label: 'Graph Engine' },
                { icon: Shield, label: 'Risk Analysis' },
                { icon: Sparkles, label: 'AI Insights' },
              ].map(item => (
                <div key={item.label} className="glass-card px-4 py-3 flex items-center gap-2">
                  <item.icon size={16} style={{ color: 'var(--ca-accent)' }} />
                  <span className="text-xs font-mono" style={{ color: 'var(--ca-text-secondary)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="absolute top-6 right-6 p-3 rounded-xl transition-all"
          style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text-secondary)' }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-md ${shake ? 'animate-[shake_0.6s_ease-in-out]' : ''}`}
          style={{ animationName: shake ? 'shake' : 'none' }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse-glow"
              style={{ background: 'var(--ca-accent)' }}>
              <Code size={26} style={{ color: 'var(--ca-bg)' }} />
            </div>
            <span className="font-mono font-bold text-xl tracking-widest gradient-text">CODEATLAS</span>
          </div>

          <div className="glass-card p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black" style={{ color: 'var(--ca-text)' }}>Welcome Back</h1>
              <p className="mt-2" style={{ color: 'var(--ca-text-secondary)' }}>Sign in to your workspace</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="rounded-xl p-3 text-sm mb-6"
                  style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.3)', color: 'var(--ca-danger)' }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ca-text-secondary)' }}>Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-text-secondary)' }} />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all focus:ring-2"
                    style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-input-border)', color: 'var(--ca-text)', '--tw-ring-color': 'var(--ca-accent)' }}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ca-text-secondary)' }}>Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-text-secondary)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl pl-12 pr-12 py-3.5 outline-none transition-all focus:ring-2"
                    style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-input-border)', color: 'var(--ca-text)', '--tw-ring-color': 'var(--ca-accent)' }}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-text-secondary)' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--ca-accent)', color: 'var(--ca-bg)', boxShadow: `0 0 20px var(--ca-accent-glow)` }}>
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>Sign In <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center" style={{ color: 'var(--ca-text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold hover:underline" style={{ color: 'var(--ca-accent)' }}>Sign up</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ─── Signup Component ─── */
export const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showAdminField, setShowAdminField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { signup, adminSignup } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (showAdminField && adminKey) {
        await adminSignup(name, email, password, adminKey);
      } else {
        await signup(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: 'var(--ca-bg)' }}>
      {/* Right Panel — Form (swap sides for visual distinction) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        <button onClick={toggleTheme} className="absolute top-6 right-6 lg:left-6 lg:right-auto p-3 rounded-xl transition-all"
          style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text-secondary)' }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-md ${shake ? 'animate-[shake_0.6s_ease-in-out]' : ''}`}
        >
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse-glow"
              style={{ background: 'var(--ca-accent)' }}>
              <Code size={26} style={{ color: 'var(--ca-bg)' }} />
            </div>
            <span className="font-mono font-bold text-xl tracking-widest gradient-text">CODEATLAS</span>
          </div>

          <div className="glass-card p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black" style={{ color: 'var(--ca-text)' }}>Create Account</h1>
              <p className="mt-2" style={{ color: 'var(--ca-text-secondary)' }}>Join CodeAtlas today</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="rounded-xl p-3 text-sm mb-6"
                  style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.3)', color: 'var(--ca-danger)' }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ca-text-secondary)' }}>Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-text-secondary)' }} />
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all focus:ring-2"
                    style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-input-border)', color: 'var(--ca-text)' }}
                    placeholder="John Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ca-text-secondary)' }}>Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-text-secondary)' }} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all focus:ring-2"
                    style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-input-border)', color: 'var(--ca-text)' }}
                    placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ca-text-secondary)' }}>Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-text-secondary)' }} />
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl pl-12 pr-12 py-3.5 outline-none transition-all focus:ring-2"
                    style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-input-border)', color: 'var(--ca-text)' }}
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-text-secondary)' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Admin Key Toggle */}
              <div>
                <button type="button" onClick={() => setShowAdminField(!showAdminField)}
                  className="text-xs flex items-center gap-1 transition-colors"
                  style={{ color: 'var(--ca-text-secondary)' }}>
                  <Shield size={14} /> {showAdminField ? 'Hide' : 'Have an'} admin key?
                </button>
                <AnimatePresence>
                  {showAdminField && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <div className="relative">
                        <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-warning)' }} />
                        <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
                          className="w-full rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all focus:ring-2"
                          style={{ background: 'var(--ca-surface)', border: '1px solid rgba(255,200,87,0.3)', color: 'var(--ca-text)' }}
                          placeholder="Admin secret key" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--ca-accent)', color: 'var(--ca-bg)', boxShadow: `0 0 20px var(--ca-accent-glow)` }}>
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>Create Account <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center" style={{ color: 'var(--ca-text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--ca-accent)' }}>Sign in</Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #020a09, #0a1a18, #071210)' }}>
        <AuthBackground />
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-pulse-glow"
              style={{ background: 'var(--ca-accent)' }}>
              <Code size={36} style={{ color: '#020a09' }} />
            </div>
            <h2 className="text-4xl font-black gradient-text mb-4">Join CodeAtlas</h2>
            <p className="text-lg" style={{ color: 'var(--ca-text-secondary)' }}>
              Start mapping your repositories today. Get architecture insights, blast radius analysis, and AI-powered code understanding.
            </p>
            <div className="mt-8 glass-card p-6 text-left max-w-sm mx-auto">
              <div className="text-xs font-mono mb-3" style={{ color: 'var(--ca-accent)' }}>WHAT YOU GET:</div>
              {['Interactive architecture maps', 'Blast radius predictions', 'AI code summaries', 'Churn & security analysis'].map(item => (
                <div key={item} className="flex items-center gap-2 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ca-accent)' }} />
                  <span className="text-sm" style={{ color: 'var(--ca-text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
