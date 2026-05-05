import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  Brain, 
  MessageSquare, 
  AlertCircle, 
  Play, 
  Pause, 
  RefreshCw,
  BookOpen,
  ChevronRight,
  Info,
  MousePointer2,
  Trophy,
  User,
  LayoutDashboard,
  GraduationCap,
  Settings,
  Search,
  Bell,
  Zap,
  Timer,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { analizarAtencion, EyeTrackingData, AIResponse } from './services/geminiService';
import { guardarSesionDB, obtenerHistorialDB } from './firebase';

const SAMPLE_TEXT = [
  "La distracción visual ocurre cuando estímulos externos capturan nuestra atención de forma involuntaria, interrumpiendo el flujo de procesamiento de la información.",
  "En entornos digitales, las notificaciones y el exceso de elementos gráficos pueden saturar la capacidad cognitiva, dificultando la retención de lo que estamos leyendo.",
  "Mantener un entorno de lectura limpio y utilizar herramientas de seguimiento puede ayudarnos a identificar y mitigar estos lapsos de concentración para mejorar el aprendizaje."
];

export default function App() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [parrafoActual, setParrafoActual] = useState(0);
  const [ultimoParrafo, setUltimoParrafo] = useState(0);
  const [duracionFijacion, setDuracionFijacion] = useState(0);
  const [regresiones, setRegresiones] = useState(0);
  const [tiempoInactivo, setTiempoInactivo] = useState(0);
  const [puntuacion, setPuntuacion] = useState(100);
  const [perfil, setPerfil] = useState("normal");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [leidos, setLeidos] = useState<number[]>([]);
  const [palabrasLeidas, setPalabrasLeidas] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [highlightedParagraph, setHighlightedParagraph] = useState<number | null>(null);

  const handleSaveSession = async () => {
    setIsSaving(true);
    try {
      await guardarSesionDB({
        puntuacion,
        perfil,
        regresiones,
        tiempoInactivo,
        parrafoActual,
        tema: "Distracción Visual"
      });
      alert("¡Sesión guardada con éxito!");
    } catch (error) {
      alert("Error al guardar la sesión. Verifica tu configuración de Firebase.");
    } finally {
      setIsSaving(false);
    }
  };

  const marcarLeido = (index: number) => {
    if (!leidos.includes(index)) {
      setLeidos([...leidos, index]);
    }
  };

  const marcarPalabra = (palabra: string, index: number) => {
    const id = palabra + index;
    if (!palabrasLeidas.includes(id)) {
      setPalabrasLeidas([...palabrasLeidas, id]);
    }
  };

  const mostrar = (texto: string) => {
    setMensaje(texto);
    setMostrarMensaje(true);

    setTimeout(() => {
      setMostrarMensaje(false);
    }, 3000);
  };

  // Detectar mouse
  useEffect(() => {
    if (!isSimulating) return;
    const move = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
      setTiempoInactivo(0);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [isSimulating]);

  // Inactividad
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setTiempoInactivo((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Detectar párrafo por posición del mouse
  useEffect(() => {
    if (!isSimulating) return;
    const parrafos = document.querySelectorAll(".parrafo");
    parrafos.forEach((p, index) => {
      const rect = p.getBoundingClientRect();
      if (
        mouse.x >= rect.left &&
        mouse.x <= rect.right &&
        mouse.y >= rect.top &&
        mouse.y <= rect.bottom
      ) {
        setParrafoActual(index);
      }
    });
  }, [mouse, isSimulating]);

  // Fijación y regresiones
  useEffect(() => {
    if (!isSimulating) return;
    if (parrafoActual === ultimoParrafo) {
      setDuracionFijacion((d) => d + 100);
    } else {
      if (parrafoActual < ultimoParrafo) {
        setRegresiones((r) => r + 1);
      }
      setDuracionFijacion(0);
      setUltimoParrafo(parrafoActual);
    }
  }, [parrafoActual, ultimoParrafo, isSimulating]);

  // Calcular puntuación y perfil
  useEffect(() => {
    if (!isSimulating) return;
    let score = 100;
    if (tiempoInactivo > 5) score -= 20;
    if (regresiones > 3) score -= 10;
    if (duracionFijacion > 2000) score -= 5;
    score = Math.max(0, Math.min(100, score));
    setPuntuacion(score);

    if (regresiones > 5) setPerfil("analitico");
    else if (tiempoInactivo > 10) setPerfil("distraido");
    else setPerfil("normal");
  }, [tiempoInactivo, regresiones, duracionFijacion, isSimulating]);

  useEffect(() => {
    if (!isSimulating) return;
    
    // 😴 distraído
    if (tiempoInactivo > 5) {
      mostrar("⚠️ Concéntrate un poco más");
    }
    // 🤯 muchas regresiones
    else if (regresiones > 5) {
      mostrar("🔁 Estás retrocediendo mucho, intenta avanzar continuo");
    }
    // 🔥 buen rendimiento
    else if (puntuacion > 80) {
      mostrar("🔥 ¡Vas muy bien, sigue así!");
    }
  }, [tiempoInactivo, regresiones, puntuacion, isSimulating]);

  useEffect(() => {
    if (palabrasLeidas.length > 20) {
      mostrar("🎉 ¡Muy bien, terminaste la lectura!");
    }
  }, [palabrasLeidas]);

  // Enviar a Gemini periódicamente
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(async () => {
      setIsAnalyzing(true);
      const data: EyeTrackingData = {
        tipo_distraccion: tiempoInactivo > 5 ? "externa" : "ninguna",
        tema_lectura: "Distracción Visual",
        parrafo_actual: parrafoActual,
        duracion_fijacion: duracionFijacion,
        regresiones,
        tiempo_fuera_pantalla: tiempoInactivo,
        progreso_lineal: Math.min(100, (parrafoActual / (SAMPLE_TEXT.length - 1)) * 100),
        perfil,
        puntuacion,
      };

      try {
        const res = await analizarAtencion(data);
        if (res) {
          setLastResponse(res);
          if (res.intervencion_tipo !== "ninguna") {
            if (res.accion_ui === "mostrar_notificacion") {
              setShowNotification(true);
              setTimeout(() => setShowNotification(false), 8000);
            }
            if (res.accion_ui === "resaltar_texto") {
              setHighlightedParagraph(parrafoActual);
              setTimeout(() => setHighlightedParagraph(null), 5000);
            }
          }
        }
      } catch (error) {
        console.error("Analysis failed", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isSimulating, duracionFijacion, regresiones, tiempoInactivo, parrafoActual, perfil, puntuacion]);

  return (
    <div className="flex min-h-screen">
      <style>
        {`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        `}
      </style>
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col py-8 px-4 bg-slate-50 dark:bg-slate-900 border-none z-50">
        <div className="mb-10 px-4">
          <h1 className="text-2xl font-bold tracking-tight text-violet-700 dark:text-violet-300">Focused Playroom</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Escolar Nivel 12</p>
        </div>
        <nav className="flex-grow space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-violet-500 hover:bg-violet-50 transition-all">
            <LayoutDashboard size={20} />
            <span className="font-medium">Panel</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-violet-700 font-bold border-r-4 border-violet-600 bg-violet-50 transition-all">
            <GraduationCap size={20} />
            <span className="font-medium">Aprender</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-violet-500 hover:bg-violet-50 transition-all">
            <Eye size={20} />
            <span className="font-medium">Simulador</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-violet-500 hover:bg-violet-50 transition-all">
            <Settings size={20} />
            <span className="font-medium">Ajustes</span>
          </a>
        </nav>
        <div className="mt-auto px-4 py-6 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-container">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWWOXcEby2SNNdtaoEDKuuCwCiuEXURXcZzhF3AnKAnbMxb34xsN-jgXzMoYw45ZRCXKjkKmyxR7K2K0EJP_XvkRF7mjwYuhO8E9eSrYV8Cy0RFdVlTiKs8lB0HE8ecJ7YsdQp7s781XVNS40MWan-pPreCp1uXEOUbldXXhyUytRRZ_hd8Oeu9-6C0eoYbrJhgE8EETeDALLMgqEkLsZ9PdVLTZg4zwrfMXo22zRREEnyAzt7sqhHURv1NNJ_g7CBv_4Dp5-OwYSe" 
                alt="Student Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Escolar Nivel 12</p>
              <p className="text-[10px] text-on-surface-variant">Sesión Activa</p>
            </div>
          </div>
          <button 
            onClick={handleSaveSession}
            disabled={isSaving}
            className="w-full py-2 px-4 signature-gradient text-white font-bold rounded-full text-sm scale-105 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Sesión'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 min-h-screen bg-surface">
        {/* TopAppBar */}
        <header className="h-20 sticky top-0 z-40 bg-white/70 backdrop-blur-xl shadow-sm flex justify-between items-center px-12">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-extrabold tracking-tight text-on-background">Maestría en Distracción Visual</h1>
            <div className="flex items-center gap-2">
              <span className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden">
                <motion.span 
                  initial={{ width: 0 }}
                  animate={{ width: `${(leidos.length / SAMPLE_TEXT.length) * 100}%` }}
                  className="block h-full signature-gradient"
                ></motion.span>
              </span>
              <span className="text-xs font-bold text-primary">{Math.round((leidos.length / SAMPLE_TEXT.length) * 100)}% Completado</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar lecciones..." 
                className="pl-10 pr-4 py-2 bg-surface-container-high border-none rounded-full text-sm focus:ring-2 focus:ring-primary/30 w-64"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            </div>
            <div className="flex items-center gap-4">
              <button className="hover:opacity-80 transition-opacity flex items-center gap-1">
                <Zap size={18} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-on-background">542 XP</span>
              </button>
              <button className="hover:opacity-80 transition-opacity text-slate-400">
                <Bell size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-12 max-w-7xl mx-auto grid grid-cols-12 gap-8">
          {/* Central Learning Area */}
          <div className="col-span-8 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Módulo de Lectura</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPalabrasLeidas([]);
                    setLeidos([]);
                  }}
                  className="px-6 py-2 rounded-full text-sm font-bold transition-all bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  🧼 Borrar resaltado
                </button>
                <button 
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                    isSimulating 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isSimulating ? '⏹️ Detener Seguimiento' : '▶️ Iniciar Seguimiento'}
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-10 rounded-xl shadow-sm border border-surface-container">
              {SAMPLE_TEXT.map((text, index) => (
                <p
                  key={index}
                  className="parrafo"
                  onMouseEnter={() => marcarLeido(index)}
                  onMouseMove={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                  style={{
                    fontSize: "18px",
                    marginBottom: "20px",
                    padding: "12px",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    lineHeight: "1.8",
                    background: leidos.includes(index)
                      ? "rgba(254, 240, 138, 0.3)" 
                      : hoverIndex === index 
                        ? "var(--color-surface-container-low)" 
                        : "transparent",
                    opacity: parrafoActual === index ? 1 : 0.5,
                    transform: parrafoActual === index ? "translateX(8px)" : "none",
                    borderLeft: parrafoActual === index ? "4px solid var(--color-primary)" : "4px solid transparent"
                  }}
                >
                  {text.split(" ").map((palabra, pIndex) => {
                    const id = palabra + pIndex;
                    return (
                      <span
                        key={pIndex}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          marcarPalabra(palabra, pIndex);
                        }}
                        style={{
                          background: palabrasLeidas.includes(id)
                            ? "#fef08a"
                            : "transparent",
                          transition: "0.2s",
                          padding: "2px 4px",
                          marginRight: "2px",
                          borderRadius: "4px",
                          display: "inline-block"
                        }}
                      >
                        {palabra}
                      </span>
                    );
                  })}
                </p>
              ))}
              
              <div className="mt-8 pt-6 border-t border-surface-container flex items-center gap-4 text-on-surface-variant italic text-sm">
                <Info size={16} />
                <span>Mueve el cursor sobre los párrafos para simular el seguimiento ocular y el análisis de atención en tiempo real.</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-surface-container-low p-8 rounded-lg">
                <h3 className="text-lg font-bold mb-3 text-on-surface">La Ciencia del Flujo</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">El ruido visual aumenta la carga cognitiva en un 40%. Al identificar estos patrones, puedes reconfigurar tu cerebro para un enfoque profundo.</p>
              </div>
              <div className="bg-tertiary-container/20 p-8 rounded-lg flex items-center gap-4">
                <div className="p-3 bg-tertiary-container rounded-full text-on-tertiary-container">
                  <Zap size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-tertiary-container">Consejo Profesional</p>
                  <p className="text-xs text-on-tertiary-container/80">Limpia tu escritorio de todo lo innecesario antes de iniciar el simulador.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: AI Assistant & Stats */}
          <div className="col-span-4 flex flex-col gap-6">
            {/* AI Assistant Card */}
            <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center text-center relative overflow-hidden shadow-sm">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-container/30 rounded-full blur-3xl"></div>
              <div className="w-32 h-32 rounded-full signature-gradient p-1 mb-6 focus-glow">
                <div className="w-full h-full rounded-full bg-white overflow-hidden p-1">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKq3EWp3CuoPXdUu_a99POENcGa8y1GwFalnUTK2CipKXO5JCAVuLwk_Mkv47GAcHv5nxPqtQz48JILVBJg9D4muFzm7nknUZKdi-S_U72D3Aof5WoblYEC3LPiMH9R27xTUZWKhIkkoWV_HmKgqnhCpb5Wvh9N9kHsboNysEzVf2EnNcv6Gj-JzU9-hQ-8KylP46zD0rb28pIeqEkmjUOR6FIIZmKsBMjyUx8J_qS0FVS9zRBSk4M7aUM2VW9QtkTlRU6ANY_dHTy" 
                    alt="AI Tutor" 
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="mb-6">
                <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold rounded-full uppercase tracking-widest mb-3 inline-block">Escucha Activa</span>
                <h2 className="text-xl font-bold text-on-surface mb-2">¡Soy Lumi, tu guía!</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {lastResponse?.mensaje_estudiante || "Estoy analizando tu patrón de lectura para ayudarte a optimizar tu enfoque."}
                </p>
              </div>
              <div className="w-full space-y-3">
                <button className="w-full py-4 px-6 signature-gradient text-white rounded-full font-bold flex items-center justify-between group hover:scale-105 active:scale-95 transition-all">
                  <span>Continuar</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                {isAnalyzing && (
                  <div className="flex items-center justify-center gap-2 text-primary text-xs animate-pulse font-bold uppercase tracking-widest">
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Analizando...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bento */}
            <div className="bg-surface-container-low p-6 rounded-xl">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Estado de Enfoque</h4>
              <div className="space-y-4">
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Brain size={18} />
                    </div>
                    <span className="text-sm font-bold">Nivel de Atención</span>
                  </div>
                  <span className="text-lg font-black text-primary">{puntuacion}%</span>
                </div>
                
                <div className="bg-surface-container-lowest p-4 rounded-xl">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-on-surface-variant">PROGRESO</span>
                    <span className="text-secondary">{Math.round((leidos.length / SAMPLE_TEXT.length) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(leidos.length / SAMPLE_TEXT.length) * 100}%` }}
                      className="h-full bg-secondary"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 h-12 bg-tertiary-container rounded-md flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-on-tertiary-container fill-on-tertiary-container/20" />
                  </div>
                  <div className="flex-1 h-12 bg-tertiary-container rounded-md flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-on-tertiary-container fill-on-tertiary-container/20" />
                  </div>
                  <div className="flex-1 h-12 bg-surface-container-highest rounded-md flex items-center justify-center">
                    <Lock size={20} className="text-on-surface-variant" />
                  </div>
                  <div className="flex-1 h-12 bg-surface-container-highest rounded-md flex items-center justify-center">
                    <Lock size={20} className="text-on-surface-variant" />
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Card */}
            <div className="bg-surface-container-low p-6 rounded-xl">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Métricas Detalladas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Regresiones</p>
                  <p className="text-xl font-black text-on-surface">{regresiones}</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Inactividad</p>
                  <p className={`text-xl font-black ${tiempoInactivo > 5 ? 'text-red-500' : 'text-on-surface'}`}>{tiempoInactivo}s</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notifications */}
      <AnimatePresence>
        {showNotification && lastResponse && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-24 right-8 z-[60] w-96 glass-panel rounded-lg shadow-2xl border border-primary/20 p-1"
          >
            <div className="bg-gradient-to-br from-white/90 to-surface-container-low rounded-[1.75rem] p-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                  <AlertCircle className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="font-extrabold text-on-surface mb-1">Mensaje de Lumi</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{lastResponse.intervencion_mensaje}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setShowNotification(false)}
                  className="text-xs font-bold text-slate-500 px-4 py-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  Ignorar
                </button>
                <button 
                  onClick={() => setShowNotification(false)}
                  className="text-xs font-bold bg-primary text-on-primary px-6 py-2 rounded-full shadow-md shadow-primary/10 hover:translate-y-[-1px] active:scale-95 transition-all"
                >
                  Entendido
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Feedback Messages */}
      {mostrarMensaje && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#111827",
            color: "white",
            padding: "15px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            animation: "fadeIn 0.5s ease",
            zIndex: 999,
          }}
        >
          {mensaje}
        </div>
      )}
    </div>
  );
}
