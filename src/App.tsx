/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { TreePine, Heart, GraduationCap, Gavel, Users, Notebook as Outline, Lightbulb, MessageSquare, ListTodo, Recycle, Send, X, Bot, User, Leaf, BookOpen } from "lucide-react";
import { useState, ReactNode, useRef, useEffect } from "react";
import { CheckCircle2, XCircle, RefreshCcw, ChevronRight } from "lucide-react";
import { GoogleGenAI } from "@google/genai";

const QUIZ_QUESTIONS = [
  {
    question: "¿Qué es el Biocentrismo?",
    options: [
      "Una visión donde el ser humano es el centro del universo.",
      "Una visión donde la vida y la naturaleza tienen valor intrínseco.",
      "Una teoría sobre la explotación de recursos naturales.",
      "Un método para construir ciudades modernas."
    ],
    correct: 1,
    explanation: "El biocentrismo reconoce que todos los seres vivos tienen el mismo derecho a existir y desarrollarse."
  },
  {
    question: "Según la Ley 071 DERECHOS DE LA MADRE TIERRA de Bolivia, ¿qué derecho tiene la Madre Tierra?",
    options: [
      "Derecho a ser vendida por partes.",
      "Derecho a la regeneración y mantenimiento de sus ciclos vitales.",
      "Derecho a ser ignorada en el desarrollo industrial.",
      "Derecho a no tener humanos viviendo en ella."
    ],
    correct: 1,
    explanation: "La Madre Tierra tiene derecho a que sus ciclos y procesos no sean alterados irreversiblemente por la actividad humana."
  },
  {
    question: "La visión Antropocéntrica considera a la naturaleza como:",
    options: [
      "Un ser vivo sagrado.",
      "Un sujeto con personalidad jurídica.",
      "Un objeto o depósito de recursos para el beneficio humano.",
      "La madre de todos los seres."
    ],
    correct: 2,
    explanation: "El antropocentrismo pone las necesidades humanas por encima del equilibrio de la naturaleza, viéndola solo como un objeto útil."
  }
];

const MOTHER_EARTH_RIGHTS = [
  { title: "Derecho a la Vida", definition: "Mantenimiento de la integridad de los sistemas de vida y los procesos naturales que los sustentan, así como las capacidades y condiciones para su regeneración." },
  { title: "Derecho a la Diversidad de la Vida", definition: "Preservación de la diferenciación y la variedad de los seres que componen la Madre Tierra, sin ser alterados genéticamente ni modificados artificialmente." },
  { title: "Derecho al Agua", definition: "Preservación de la funcionalidad de los ciclos del agua, de su existencia en la cantidad y calidad necesarias, y su protección frente a la contaminación." },
  { title: "Derecho al Aire Limpio", definition: "Preservación de la calidad y composición del aire para el sostenimiento de los sistemas de vida y su protección frente a la contaminación." },
  { title: "Derecho al Equilibrio", definition: "Mantenimiento o restauración de la interrelación, interdependencia y complementariedad de los componentes de la Madre Tierra de forma equilibrada." },
  { title: "Derecho a la Restauración", definition: "Restauración oportuna y efectiva de los sistemas de vida afectados por las actividades humanas directa o indirectamente." },
  { title: "Derecho a Vivir libre de Contaminación", definition: "Preservación de la Madre Tierra de contaminación de cualquiera de sus componentes por residuos tóxicos y radioactivos." }
];

function Flashcard({ title, definition, index }: { title: string; definition: string; index: number; key?: any }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="h-64 [perspective:1000px] cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        className="w-full h-full relative [transform-style:preserve-3d]"
      >
        {/* Front */}
        <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col items-center justify-center p-6 bg-forest-700 text-white rounded-2xl border-4 border-earth-800 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Leaf className="w-12 h-12" />
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-4 text-lg font-bold font-serif">
            {index + 1}
          </div>
          <h3 className="text-xl font-bold font-serif leading-tight text-center px-2">{title}</h3>
          <p className="mt-6 text-[9px] uppercase tracking-[0.2em] font-bold text-amber-300 opacity-60 group-hover:opacity-100 transition-opacity">
            Click para definir
          </p>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center p-8 bg-earth-50 text-earth-900 rounded-2xl border-4 border-forest-600 shadow-inner"
        >
          <div className="absolute top-2 left-2 opacity-10">
            <Outline className="w-16 h-16 text-forest-300" />
          </div>
          <p className="text-sm font-medium leading-relaxed italic text-center text-forest-900 relative z-10">
            "{definition}"
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [activeMoment, setActiveMoment] = useState(0);
  const [quizState, setQuizState] = useState({
    currentQuestion: 0,
    score: 0,
    showResult: false,
    selectedOption: null as number | null,
    isFinished: false,
    isRevealed: false
  });
  const [isChecking, setIsChecking] = useState(false);
  const [capsuleMessage, setCapsuleMessage] = useState("");
  const [isCapsuleSaved, setIsCapsuleSaved] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Gallery Lightbox State
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<{url: string, title: string} | null>(null);
  
  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...chatMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: "Eres un tutor académico de alto nivel especializado en la Ley 071 DERECHOS DE LA MADRE TIERRA y la filosofía del 'Vivir Bien' en el Estado Plurinacional de Bolivia. Tu objetivo es proporcionar respuestas exhaustivas, pedagógicas y técnicamente precisas a estudiantes de secundaria y docentes.\n\nDirectrices Críticas para tu Respuesta:\n1. Profundidad Jurídica: No solo menciones la ley; explica el cambio de paradigma de la Madre Tierra como 'objeto' a 'sujeto colectivo de interés público'. Desglosa el carácter jurídico según el Artículo 5.\n2. Análisis Filosófico: Explica detalladamente la ruptura con el Antropocentrismo (el ser humano como centro) e introduce el Biocentrismo (la vida como centro) con matices sobre la interdependencia y complementariedad.\n3. Ejemplos Prácticos Bolivianos: Usa casos reales o hipotéticos específicos de la geografía boliviana: la protección del TIPNIS, la gestión del agua en Cochabamba, la conservación de bofedales en el Altiplano, o la lucha contra la contaminación minera en ríos del oriente.\n4. Desglose de los 7 Derechos (Art. 7): Cuando expliques un derecho (ej. Aire Limpio o Restauración), detalla qué implica su vulneración y qué acciones ciudadanas o estatales lo protegen.\n5. Estructura y Estilo: Usa viñetas, negritas para conceptos clave y un lenguaje que combine el rigor académico con la calidez de la cosmovisión andino-amazónica-chaqueña.\n6. Educación Integral: Vincula conceptos ambientales con la justicia social y el respeto a los saberes ancestrales de los pueblos indígenas.\n\nResponde siempre con generosidad en los detalles, fomentando el pensamiento crítico del estudiante."
        }
      });

      const botMsg = response.text || "Lo siento, no pude procesar tu pregunta. Inténtalo de nuevo.";
      setChatMessages(prev => [...prev, { role: 'bot', text: botMsg }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setChatMessages(prev => [...prev, { role: 'bot', text: "Hubo un error al conectar con el asistente. Asegúrate de que la API esté configurada." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleQuizAnswer = (index: number) => {
    if (quizState.selectedOption !== null || isChecking) return;
    
    setQuizState(prev => ({ ...prev, selectedOption: index }));
    setIsChecking(true);

    // Subtle delay for "visual feedback" before revealing
    setTimeout(() => {
      const isCorrect = index === QUIZ_QUESTIONS[quizState.currentQuestion].correct;
      setQuizState(prev => ({
        ...prev,
        score: isCorrect ? prev.score + 1 : prev.score,
        isRevealed: true
      }));
      setIsChecking(false);
    }, 800);
  };

  const nextQuestion = () => {
    if (quizState.currentQuestion + 1 < QUIZ_QUESTIONS.length) {
      setQuizState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        selectedOption: null,
        isRevealed: false
      }));
    } else {
      setQuizState(prev => ({ ...prev, isFinished: true }));
    }
  };

  const resetQuiz = () => {
    setQuizState({
      currentQuestion: 0,
      score: 0,
      showResult: false,
      selectedOption: null,
      isFinished: false,
      isRevealed: false
    });
  };

  const handleSaveCapsule = () => {
    if (!capsuleMessage.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsCapsuleSaved(true);
    }, 2000);
  };

  const moments = [
    {
      title: "PRÁCTICA",
      icon: <Users className="w-6 h-6" />,
      content: "Observación de la realidad local y contacto con la naturaleza. Diálogos con sabios de la comunidad (abuelos) sobre cómo era la relación con la tierra antiguamente.",
      activities: ["Caminata de observación en el entorno escolar/local", "Entrevista a familiares sobre prácticas de cuidado de la tierra"],
      image: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "TEORÍA",
      icon: <Outline className="w-6 h-6" />,
      content: "Análisis conceptual de la Madre Tierra y estudio de la Ley 071 DERECHOS DE LA MADRE TIERRA en Bolivia. Comparativa entre visión antropocéntrica vs biocéntrica.",
      activities: ["Mapa mental sobre los 7 derechos de la Madre Tierra", "Lectura guiada de fragmentos de la Ley 071 DERECHOS DE LA MADRE TIERRA"],
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800",
      hasQuiz: true
    },
    {
      title: "VALORACIÓN",
      icon: <Heart className="w-6 h-6" />,
      content: "Reflexión ética sobre nuestras acciones diarias. Análisis crítico de cómo el consumo desmedido afecta el equilibrio planetario y los derechos de la tierra.",
      activities: ["Debate: ¿Puede la economía crecer sin destruir la naturaleza?", "Círculo de reflexión sobre responsabilidades generacionales"],
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "PRODUCCIÓN",
      icon: <Recycle className="w-6 h-6" />,
      content: "Aplicación de lo aprendido mediante la creación de materiales educativos o acciones comunitarias concretas dentro o fuera de la escuela.",
      activities: ["Elaboración de un decálogo de 'Hijos de la Madre Tierra'", "Campaña de concienciación en redes sociales o carteles físicos"],
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="min-h-screen bg-earth-50 pb-20">
      {/* Hero Section */}
      <header className="relative bg-forest-900 text-earth-50 py-20 px-6 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto relative z-10 text-center"
        >
          <div className="flex justify-center mb-6">
            <TreePine className="w-16 h-16 text-forest-300" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            La Madre Tierra como <br />
            <span className="italic text-earth-300">Sujeto de Derecho</span>
          </h1>
          <p className="text-xl md:text-2xl text-forest-100/80 max-w-2xl mx-auto font-light leading-relaxed">
            Plan de clase para 1er Año de Educación Secundaria Comunitaria Productiva en la asignatura de Historia.
          </p>
        </motion.div>
        
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-forest-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-earth-500 rounded-full blur-3xl" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-12 px-6">
        
        {/* Introduction Section */}
        <section className="mb-20 grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-block px-4 py-1 bg-forest-100 text-forest-800 rounded-full text-sm font-semibold uppercase tracking-wider">
              Introducción
            </div>
            <p className="text-xl leading-relaxed text-earth-800 font-serif italic">
              "La Madre Tierra nos recuerda la profunda interconexión entre los humanos y el planeta en el que vivimos. La metáfora de la Tierra como madre evoca el cuidado, la protección y el respeto humanos por nuestra casa común."
            </p>
            <p className="text-lg text-earth-700 leading-relaxed">
              Como “hijos de la Madre Tierra", tenemos la responsabilidad de cuidar estos recursos y protegerlos para las generaciones futuras. Durante miles de años, se ha adaptado y se ha regenerado, enseñándonos sobre resistencia y equilibrio.
            </p>
          </motion.div>
          <div className="relative group">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="aspect-square bg-earth-200 rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000" 
                alt="Madre Tierra" 
                className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-forest-900/20 mix-blend-multiply" />
            </motion.div>
          </div>
        </section>

        {/* Problematizing Question */}
        <section className="mb-24 py-16 px-8 bg-forest-900 text-earth-50 rounded-3xl shadow-xl text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <MessageSquare className="w-12 h-12 text-forest-400 mx-auto mb-6" />
            <h2 className="text-2xl uppercase tracking-widest font-sans mb-4 text-forest-300">Pregunta Problematizadora</h2>
            <p className="text-3xl md:text-4xl font-serif italic leading-snug">
              ¿Por qué es necesario reconocer a la naturaleza como un ser con derechos y no simplemente como un depósito de recursos para el ser humano?
            </p>
          </div>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-forest-400 via-transparent to-transparent" />
        </section>

        {/* Holistic Objective */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-forest-900 mb-2">Objetivo Holístico</h2>
            <p className="text-earth-600 font-serif italic">Desarrollo integral del estudiante</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ObjectiveCard 
              title="SER" 
              color="bg-indigo-50 border-indigo-200 hover:border-indigo-400 shadow-sm shadow-indigo-100"
              icon={<Heart className="text-indigo-600 w-8 h-8" />}
              content="Fortalecemos valores de respeto, reciprocidad y complementariedad con todos los sistemas de vida de la naturaleza."
            />
            <ObjectiveCard 
              title="SABER" 
              color="bg-amber-50 border-amber-200 hover:border-amber-400 shadow-sm shadow-amber-100"
              icon={<GraduationCap className="text-amber-600 w-8 h-8" />}
              content="Analizamos los fundamentos legales y cosmológicos de la Madre Tierra como sujeto colectivo de interés público."
            />
            <ObjectiveCard 
              title="HACER" 
              color="bg-emerald-50 border-emerald-200 hover:border-emerald-400 shadow-sm shadow-emerald-100"
              icon={<ListTodo className="text-emerald-600 w-8 h-8" />}
              content="Participamos en diálogos comunitarios y reflexiones críticas sobre el impacto de la actividad humana."
            />
            <ObjectiveCard 
              title="DECIDIR" 
              color="bg-rose-50 border-rose-200 hover:border-rose-400 shadow-sm shadow-rose-100"
              icon={<Gavel className="text-rose-600 w-8 h-8" />}
              content="Asumimos compromisos reales para la protección y regeneración del ecosistema local como ciudadanos responsables."
            />
          </div>
        </section>

        {/* Methodological Moments */}
        <section className="mb-24 border-t border-earth-200 pt-16">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/3">
              <h2 className="text-3xl font-bold text-forest-900 mb-6">Momentos Metodológicos</h2>
              <div className="space-y-2">
                {moments.map((moment, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMoment(idx)}
                    className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 flex items-center gap-4 ${
                      activeMoment === idx 
                        ? "bg-forest-600 text-earth-50 shadow-lg scale-105" 
                        : "bg-white text-earth-700 hover:bg-earth-100"
                    }`}
                  >
                    {moment.icon}
                    <span className="font-bold tracking-wider">{moment.title}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="md:w-2/3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMoment} // Key forces animation on change
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-earth-200 h-full"
                >
                <div className="flex items-center gap-3 mb-6 text-forest-600">
                  <div className="p-3 bg-forest-50 rounded-full">
                    {moments[activeMoment].icon}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest">Fase de Aprendizaje</span>
                </div>
                <h3 className="text-4xl font-bold text-forest-900 mb-6 leading-tight">
                  {moments[activeMoment].title}
                </h3>
                
                {moments[activeMoment].image && (
                  <div className="mb-8 rounded-2xl overflow-hidden h-48 border border-earth-100">
                    <img 
                      src={moments[activeMoment].image} 
                      alt={moments[activeMoment].title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <p className="text-lg text-earth-800 leading-relaxed mb-8 font-serif">
                  {moments[activeMoment].content}
                </p>
                <div>
                  <h4 className="text-sm font-bold uppercase text-forest-500 mb-4 tracking-widest">Actividades Sugeridas</h4>
                  <ul className="space-y-3">
                    {moments[activeMoment].activities.map((act, i) => (
                      <li key={i} className="flex items-start gap-3 text-earth-700">
                        <div className="min-w-[8px] h-[8px] rounded-full bg-forest-400 mt-2.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interactive Quiz Integration for TEORIA */}
                {(moments[activeMoment] as any).hasQuiz && (
                  <div className="mt-12 bg-earth-50 border border-earth-200 rounded-2xl p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-bold text-forest-900 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        Quiz: Comprueba tu aprendizaje
                      </h4>
                      {!quizState.isFinished && (
                        <span className="text-xs font-bold text-earth-400">
                          Pregunta {quizState.currentQuestion + 1} de {QUIZ_QUESTIONS.length}
                        </span>
                      )}
                    </div>

                    {!quizState.isFinished ? (
                      <div className="space-y-6">
                        <p className="text-xl font-serif text-earth-900 font-medium">
                          {QUIZ_QUESTIONS[quizState.currentQuestion].question}
                        </p>
                        <div className="grid gap-3">
                          {QUIZ_QUESTIONS[quizState.currentQuestion].options.map((option, idx) => {
                            const isSelected = quizState.selectedOption === idx;
                            const isCorrect = idx === QUIZ_QUESTIONS[quizState.currentQuestion].correct;
                            const isWrong = isSelected && !isCorrect && quizState.isRevealed;
                            const showSuccess = isCorrect && quizState.isRevealed;
                            
                            let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all ";
                            if (quizState.selectedOption === null) {
                              btnClass += "border-earth-200 hover:border-forest-400 hover:bg-forest-50";
                            } else {
                              if (showSuccess) btnClass += "border-green-500 bg-green-50 text-green-900";
                              else if (isWrong) btnClass += "border-red-500 bg-red-50 text-red-900";
                              else if (isSelected && isChecking) btnClass += "border-forest-400 bg-forest-50 animate-pulse";
                              else btnClass += "border-earth-100 opacity-50";
                            }

                            return (
                              <motion.button
                                key={idx}
                                disabled={quizState.selectedOption !== null || isChecking}
                                onClick={() => handleQuizAnswer(idx)}
                                whileHover={quizState.selectedOption === null ? { x: 5 } : {}}
                                whileTap={quizState.selectedOption === null ? { scale: 0.98 } : {}}
                                className={btnClass}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{option}</span>
                                  {quizState.isRevealed && (
                                    <>
                                      {showSuccess && <CheckCircle2 className="w-5 h-5" />}
                                      {isWrong && <XCircle className="w-5 h-5" />}
                                    </>
                                  )}
                                  {isSelected && isChecking && (
                                    <RefreshCcw className="w-4 h-4 animate-spin text-forest-400" />
                                  )}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>

                        {quizState.isRevealed && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-amber-50 border border-amber-200 rounded-xl"
                          >
                            <p className="text-sm text-amber-900 leading-relaxed italic">
                              <strong>Reflexión:</strong> {QUIZ_QUESTIONS[quizState.currentQuestion].explanation}
                            </p>
                            <button
                              onClick={nextQuestion}
                              className="mt-4 w-full bg-forest-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-forest-700 transition-colors"
                            >
                              Continuar <ChevronRight className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-8"
                      >
                        <GraduationCap className="w-16 h-16 text-forest-500 mx-auto mb-4" />
                        <h5 className="text-2xl font-bold text-forest-900 mb-2">¡Completado!</h5>
                        <p className="text-earth-600 mb-6">
                          Has respondido correctamente {quizState.score} de {QUIZ_QUESTIONS.length} preguntas.
                        </p>
                        <button
                          onClick={resetQuiz}
                          className="px-6 py-3 bg-white border-2 border-forest-600 text-forest-600 rounded-xl font-bold hover:bg-forest-50 transition-colors flex items-center gap-2 mx-auto"
                        >
                          <RefreshCcw className="w-4 h-4" /> Reiniciar Quiz
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 7 Rights Flashcards Section */}
      <section className="mb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-forest-900 mb-4 font-serif">
              Los 7 Derechos de la Madre Tierra
            </h2>
            <p className="text-earth-600 max-w-2xl mx-auto text-lg italic">
              Explora las garantías fundamentales consagradas en la Ley 071. Haz clic en cada ficha para descubrir su definición.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOTHER_EARTH_RIGHTS.map((right, idx) => (
              <Flashcard 
                key={idx} 
                title={right.title} 
                definition={right.definition} 
                index={idx} 
              />
            ))}
            
            {/* Legend/Info Card */}
            <div className="hidden lg:flex h-64 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl items-center justify-center p-8 flex-col text-center">
              <BookOpen className="w-10 h-10 text-amber-500 mb-4" />
              <h4 className="text-lg font-bold text-amber-900 mb-2">Art. 7 - Ley 071</h4>
              <p className="text-xs text-amber-700 leading-relaxed">
                Estos derechos son de carácter público y colectivo, fundamentales para el Vivir Bien de las generaciones presentes y futuras.
              </p>
            </div>
          </div>
        </div>
      </section>

        {/* Interactive Critical Thinking Activity */}
        <section className="mb-24">
          <div className="bg-earth-900 text-white p-12 rounded-[2rem] relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Lightbulb className="text-amber-400 w-8 h-8" />
                <h2 className="text-3xl font-bold">Laboratorio de Pensamiento Crítico</h2>
              </div>
              <p className="text-earth-300 text-lg mb-10 max-w-2xl">
                Propuestas de actividades interactivas para fomentar la reflexión y el debate activo en el aula.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                  <div className="mb-6 rounded-xl overflow-hidden h-48 border border-white/20">
                    <img 
                      src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200" 
                      alt="Justicia y Naturaleza" 
                      className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-amber-300 italic font-serif tracking-wide">El Juicio a la Humanidad</h3>
                  
                  {/* Evidencias del Caso */}
                  <div className="mb-6">
                    <p className="text-[10px] uppercase font-bold text-forest-400 mb-3 tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                       Evidencias de Daño Ambiental
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1200", title: "Deforestación" },
                        { url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800", title: "Contaminación" },
                        { url: "https://images.unsplash.com/photo-1470104240373-bc1812eddc9f?auto=format&fit=crop&q=80&w=800", title: "Sequía" }
                      ].map((img, i) => (
                        <motion.div 
                          key={i}
                          layoutId={`gallery-${i}`}
                          whileHover={{ scale: 1.05, zIndex: 10 }}
                          onClick={() => setSelectedGalleryImage(img)}
                          className="aspect-video rounded-lg overflow-hidden border border-white/10 relative group/thumb shadow-lg cursor-zoom-in"
                        >
                          <img src={img.url} alt={img.title} className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[8px] font-bold text-white uppercase tracking-tighter">{img.title}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 text-sm text-earth-300 mb-6 leading-relaxed">
                    <p>Un simulacro jurídico donde se evalúa el cumplimiento de la Ley 071 DERECHOS DE LA MADRE TIERRA. Los estudiantes asumen roles específicos para defender los derechos de la vida.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <strong className="block text-forest-300 text-[10px] uppercase mb-1">Actores</strong>
                        <ul className="text-[11px] list-disc list-inside opacity-80">
                          <li>Madre Tierra (Víctima)</li>
                          <li>Industrias (Acusado)</li>
                          <li>Defensores Ambientales</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <strong className="block text-forest-300 text-[10px] uppercase mb-1">Objetivo</strong>
                        <p className="text-[11px] opacity-80">Sentenciar medidas de restauración basadas en la justicia biocéntrica.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-forest-500/20 text-forest-400 rounded text-[10px] uppercase font-bold tracking-tighter">Dinámica Grupal</span>
                    <span className="px-2 py-0.5 bg-forest-500/20 text-forest-400 rounded text-[10px] uppercase font-bold tracking-tighter">Ley 071</span>
                  </div>
                </div>
                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                  <div className="mb-6 rounded-xl overflow-hidden h-48 border border-white/20 relative">
                    <img 
                      src="https://www.biovie.fr/modules/prestablog/views/img/grid-for-1-7/up-img/thumb_708.jpg?f46f5788a3b947c13da942c4132e2ec7" 
                      alt="Futuro Biocéntrico 2050" 
                      className={`w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ${isSending ? 'blur-sm' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                    {isSending && (
                      <motion.div 
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: -100, opacity: [0, 1, 0] }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <div className="bg-amber-400 p-4 rounded-lg shadow-xl">
                          <MessageSquare className="w-8 h-8 text-earth-900" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-amber-300 italic font-serif tracking-wide">Cápsula del Tiempo 2050</h3>
                  
                  {!isCapsuleSaved ? (
                    <div className="space-y-4">
                      <p className="text-sm text-earth-300 leading-relaxed italic">
                        ¿Cómo imaginas tu comunidad en el 2050 si hoy respetamos los derechos de la Madre Tierra?
                      </p>
                      <textarea 
                        value={capsuleMessage}
                        onChange={(e) => setCapsuleMessage(e.target.value)}
                        placeholder="Escribe tu visión para el futuro..."
                        className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                        disabled={isSending}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/40 uppercase font-mono italic">Destino: Año 2050</span>
                        <button 
                          onClick={handleSaveCapsule}
                          disabled={!capsuleMessage.trim() || isSending}
                          className="px-6 py-2 bg-amber-400 text-earth-900 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isSending ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Recycle className="w-4 h-4" />}
                          {isSending ? 'Enviando...' : 'Sellar Cápsula'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-forest-500/20 border border-forest-400/40 p-6 rounded-xl text-center"
                    >
                      <CheckCircle2 className="w-12 h-12 text-forest-400 mx-auto mb-3" />
                      <h4 className="text-forest-300 font-bold mb-2 tracking-wide">¡Mensaje Sellado!</h4>
                      <p className="text-xs text-earth-200 italic mb-4">
                        Tu visión ha sido enviada a través del tiempo. Se abrirá en el solsticio de invierno del año 2050.
                      </p>
                      <button 
                        onClick={() => { setIsCapsuleSaved(false); setCapsuleMessage(""); }}
                        className="text-[10px] uppercase font-bold text-amber-300 hover:underline"
                      >
                        Escribir otro mensaje
                      </button>
                    </motion.div>
                  )}

                  <div className="mt-8 flex gap-2">
                    <span className="px-2 py-0.5 bg-forest-500/20 text-forest-400 rounded text-[10px] uppercase font-bold tracking-tighter">Proyección</span>
                    <span className="px-2 py-0.5 bg-forest-500/20 text-forest-400 rounded text-[10px] uppercase font-bold tracking-tighter">Decisión</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Bibliografía */}
      <section className="mb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-8 h-8 text-forest-700" />
            <h2 className="text-2xl font-bold text-forest-900 font-serif">BIBLIOGRAFÍA</h2>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-earth-200 italic">
            <p className="text-earth-800 leading-relaxed font-serif">
              Ley 071 Derechos de la Madre Tierra. En: <a href="https://www.planificacion.gob.bo/uploads/marco-legal/Ley%20N%C2%B0%20071%20DERECHOS%20DE%20LA%20MADRE%20TIERRA.pdf" target="_blank" rel="noopener noreferrer" className="text-forest-600 hover:underline break-all">https://www.planificacion.gob.bo/uploads/marco-legal/Ley%20N%C2%B0%20071%20DERECHOS%20DE%20LA%20MADRE%20TIERRA.pdf</a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 border-t border-earth-200">
        <p className="text-earth-400 text-sm italic font-serif">
          Plan de clase interactivo - Educación Secundaria Bolivia
        </p>
        <div className="mt-4 flex justify-center gap-6 text-earth-300">
          <TreePine className="w-5 h-5" />
          <Heart className="w-5 h-5" />
          <Users className="w-5 h-5" />
        </div>
      </footer>

      {/* Floating Chatbot UI */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-earth-200 w-[350px] md:w-[400px] h-[500px] flex flex-col mb-4 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-forest-900 p-4 text-earth-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-forest-700 rounded-full">
                    <Bot className="w-5 h-5 text-earth-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Asistente Madre Tierra</h4>
                    <span className="text-[10px] text-forest-300 animate-pulse">En línea</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 hover:bg-forest-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-earth-50/50">
                {chatMessages.length === 0 && (
                  <div className="text-center py-10 px-6">
                    <TreePine className="w-12 h-12 text-forest-200 mx-auto mb-4" />
                    <p className="text-earth-500 text-sm">¡Hola! Soy tu guía sobre la Madre Tierra. ¿En qué te puedo ayudar hoy?</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-forest-600 text-white rounded-tr-none shadow-md' 
                        : 'bg-white text-earth-800 border border-earth-200 rounded-tl-none shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {msg.role === 'bot' ? <Bot className="w-3 h-3 text-forest-500" /> : <User className="w-3 h-3 text-forest-200" />}
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                          {msg.role === 'bot' ? 'Guía' : 'Tú'}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-earth-200 p-3 rounded-2xl rounded-tl-none flex space-x-1 items-center">
                      <div className="w-1.5 h-1.5 bg-forest-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-forest-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-forest-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-earth-200 bg-white">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Haz una pregunta sobre la Ley..."
                    className="flex-1 bg-earth-50 border border-earth-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="p-2 bg-forest-600 text-white rounded-xl hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-forest-600/20"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`p-4 rounded-full shadow-2xl flex items-center justify-center transition-all ${
            isChatOpen ? 'bg-earth-200 text-earth-800 rotate-90' : 'bg-forest-600 text-white'
          }`}
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          {!isChatOpen && (
            <span className="absolute -top-2 -right-2 bg-amber-400 text-earth-900 text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
              IA
            </span>
          )}
        </motion.button>
      </div>

      {/* Gallery Lightbox Modal */}
      <AnimatePresence>
        {selectedGalleryImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedGalleryImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 md:p-12 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => setSelectedGalleryImage(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl border border-white/10">
                <img 
                  src={selectedGalleryImage.url} 
                  alt={selectedGalleryImage.title} 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="text-center">
                <h4 className="text-2xl font-bold text-amber-300 font-serif mb-2 tracking-wide">
                  {selectedGalleryImage.title}
                </h4>
                <p className="text-earth-400 text-sm uppercase tracking-[0.2em]">Evidencia del Daño Ambiental</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ObjectiveCard({ title, content, color, icon }: { title: string, content: string, color: string, icon: ReactNode }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-8 rounded-2xl border-2 transition-all ${color} flex flex-col items-center text-center`}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-black tracking-widest text-earth-950 mb-4">{title}</h3>
      <p className="text-sm text-earth-800 leading-relaxed font-serif uppercase tracking-tighter">{content}</p>
    </motion.div>
  );
}
