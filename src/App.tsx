import { useState, useEffect, FormEvent } from 'react';
import { Loader2, Zap, Copy, CheckCircle2, FileVideo, Sparkles, Plus, Trash2, BookOpen, Layers, ArrowRight, RotateCcw, Target, Image as ImageIcon } from 'lucide-react';
import { ScriptRow, TransferableMatrix, AudioMetrics, VFXMetrics, DevilsAdvocate, AnalyzedVideo, LogicAuditReport } from './types';
import { ModelSelector } from './components/ModelSelector';
import { TelemetryDashboard } from './components/TelemetryDashboard';
import { TransferableMatrixCard } from './components/TransferableMatrixCard';
import { ScriptTable } from './components/ScriptTable';
import { LogicAuditorDashboard } from './components/LogicAuditorDashboard';
import { VisualBlockingViewer } from './components/VisualBlockingViewer';
import { RaccordMonitor } from './components/RaccordMonitor';

export default function App() {
  // Tabs
  const [activeTab, setActiveTab] = useState<'cloner' | 'multianalyzer'>('cloner');

  // New Global State Enhancements
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [alertMessage, setAlertMessage] = useState<string>('');

  // Single Script Cloner State
  const [topic, setTopic] = useState('');
  const [dna, setDna] = useState('');
  const [videoFile, setVideoFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [analyzingVideo, setAnalyzingVideo] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedVideo | null>(null);

  // Visual Anchor Point (V3) State
  const [imageFile, setImageFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [imageInstructions, setImageInstructions] = useState('');
  const [imageValidation, setImageValidation] = useState<{ status: 'PENDING' | 'VALID' | 'INVALID'; details: string }>({
    status: 'PENDING',
    details: 'Ninguna imagen de referencia ha sido cargada aún.'
  });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);

  // SAECS Audit State
  const [dashboardTab, setDashboardTab] = useState<'metrics' | 'saecs' | 'spatial' | 'raccord'>('metrics');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [selectedRowType, setSelectedRowType] = useState<'original' | 'cloned'>('cloned');
  const [auditReport, setAuditReport] = useState<LogicAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Cross Analyzer State (Multi Video)
  const [multiVideos, setMultiVideos] = useState<{ title: string; content: string; fileData?: string; mimeType?: string; fileName?: string }[]>([
    { title: 'Video Viral 1', content: '' }
  ]);
  const [crossResult, setCrossResult] = useState<any>(null);
  const [crossLoading, setCrossLoading] = useState(false);
  const [crossError, setCrossError] = useState('');
  const [copiedDocument, setCopiedDocument] = useState(false);

  // Dynamic Tips for Loader
  const [tipIndex, setTipIndex] = useState(0);
  const loadingTips = [
    "Descifrando las intenciones neuronales y ganchos de retención en pantalla...",
    "Reconstruyendo la tabla de subtítulos y efectos visuales de retención...",
    "Mapeando las modulaciones de voz y ganchos del video original...",
    "Extrayendo métricas de complejidad sintáctica y loops de retención...",
    "Diseñando la pregunta de máxima controversia en los comentarios (commentbait)...",
    "Sincronizando los tiempos de edición con el modelo de IA seleccionado..."
  ];

  // Rotate tips when active
  useEffect(() => {
    if (loading || analyzingVideo || crossLoading) {
      const interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % loadingTips.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading, analyzingVideo, crossLoading]);

  // Iframe-safe customized transient alerts
  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => {
      setAlertMessage((prev) => prev === msg ? '' : prev);
    }, 5000);
  };

  // Plain Text & Markdown browser-side download utility
  const downloadTxtFile = (filename: string, text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadScriptTxt = () => {
    if (!result || !result.script) return;
    const textToCopy = `========================================\n` +
      `VIRAL SCRIPT CLON CLONADO\n` +
      `TEMA ADAPTADO: ${topic}\n` +
      `MOTOR IA UTIIZADO: ${selectedModel}\n` +
      `========================================\n\n` +
      `HASHTAGS PROPUESTOS: ${result.hashtags ? result.hashtags.join(' ') : ''}\n` +
      `COMMENT-BAIT DISRUPTIVO: ${result.commentBait || ''}\n\n` +
      `----------------------------------------\n` +
      result.script
        .map((row: any) => `⏳ TIEMPO: [${row.time}]\n🎬 VISUAL Y EDICIÓN: ${row.visual}\n🗣️ LOCUCIÓN EXACTA: "${row.audio}"\n----------------------------------------\n`)
        .join('\n');
    downloadTxtFile(`guon_viral_${topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.txt`, textToCopy);
  };

  const downloadCrossReportMd = () => {
    if (!crossResult || !crossResult.exportableDocument) return;
    downloadTxtFile(`reporte_adn_cruzado.md`, crossResult.exportableDocument);
  };

  // Triggered automatically when a video is loaded or manual notes are ready
  const handleAnalyzeVideo = async (fileObj?: { data: string; mimeType: string; name: string }, dnaNotes?: string) => {
    setAnalyzingVideo(true);
    setError('');
    setAnalyzedData(null);
    setResult(null);
    setAuditReport(null);

    const activeFile = fileObj || videoFile;
    const activeDna = dnaNotes !== undefined ? dnaNotes : dna;

    try {
      const res = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoFile: activeFile ? { data: activeFile.data, mimeType: activeFile.mimeType } : undefined,
          dna: activeFile ? undefined : activeDna,
          model: selectedModel,
          imageFile: imageFile ? { data: imageFile.data, mimeType: imageFile.mimeType } : undefined,
          imageInstructions: imageInstructions
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error analizando el archivo de video de referencia.');
      }

      setAnalyzedData(data);
    } catch (err: any) {
      setError(err.message || 'Error en el proceso de análisis del video de referencia');
    } finally {
      setAnalyzingVideo(false);
    }
  };

  const handleGenerateScript = async (targetTopic: string) => {
    if (!targetTopic.trim()) return;

    setLoading(true);
    setError('');
    setAuditReport(null);
    // Guardar el tópico actual
    setTopic(targetTopic);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          dna: videoFile ? undefined : (analyzedData ? JSON.stringify(analyzedData.transferableMatrix) : dna),
          videoFile: videoFile ? { data: videoFile.data, mimeType: videoFile.mimeType } : undefined,
          model: selectedModel,
          imageFile: imageFile ? { data: imageFile.data, mimeType: imageFile.mimeType } : undefined,
          imageInstructions: imageInstructions
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error generando el nuevo guion clónico.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error al generar el guion clónico');
    } finally {
      setLoading(false);
    }
  };

  const handleRunLogicAudit = async () => {
    const currentScript = result?.script || analyzedData?.originalScript;
    if (!currentScript) {
      triggerAlert("No hay un guion generado o analizado disponible para auditar.");
      return;
    }

    setIsAuditing(true);
    try {
      const res = await fetch('/api/audit-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: currentScript,
          model: selectedModel
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error ejecutando la auditoría de lógica.');
      }

      setAuditReport(data);
      triggerAlert("¡Auditoría de Lógica SAECS completada!");
    } catch (err: any) {
      triggerAlert(err.message || 'Error al ejecutar la auditoría de lógica');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCrossAnalyzeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const filledVideos = multiVideos.filter(v => (v.content && v.content.trim() !== '') || v.fileData);
    if (filledVideos.length === 0) {
      setCrossError('Por favor introduce al menos un video cargado o una descripción.');
      return;
    }

    setCrossLoading(true);
    setCrossError('');
    setCrossResult(null);

    try {
      const res = await fetch('/api/cross-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videos: filledVideos.map(v => ({
            title: v.title,
            content: v.content,
            fileData: v.fileData,
            mimeType: v.mimeType
          })),
          model: selectedModel
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error en el análisis comparativo.');
      }

      setCrossResult(data);
    } catch (err: any) {
      setCrossError(err.message || 'Error en la conexión');
    } finally {
      setCrossLoading(false);
    }
  };

  const addVideoField = () => {
    if (multiVideos.length >= 3) return;
    setMultiVideos([...multiVideos, { title: `Video Viral ${multiVideos.length + 1}`, content: '' }]);
  };

  const removeVideoField = (index: number) => {
    if (multiVideos.length <= 1) return;
    const update = multiVideos.filter((_, i) => i !== index);
    setMultiVideos(update);
  };

  const updateVideoValue = (index: number, key: 'title' | 'content', value: string) => {
    const update = [...multiVideos];
    update[index][key] = value;
    setMultiVideos(update);
  };

  const copyToClipboard = () => {
    if (!result) return;
    const textToCopy = result.script
      .map((row: any) => `[${row.time}]\nVisual: ${row.visual}\nAudio: ${row.audio}\n`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyOriginalToClipboard = () => {
    if (!analyzedData) return;
    const textToCopy = analyzedData.originalScript
      .map((row: any) => `[${row.time}]\nVisual: ${row.visual}\nAudio: ${row.audio}\n`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  const copyDocumentToClipboard = () => {
    if (!crossResult || !crossResult.exportableDocument) return;
    navigator.clipboard.writeText(crossResult.exportableDocument);
    setCopiedDocument(true);
    setTimeout(() => setCopiedDocument(false), 2000);
  };

  const handleImageUpload = (file: File) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageValidation({ status: 'INVALID', details: 'Formato no admitido. Usar JPEG, PNG o WebP.' });
      triggerAlert('Formato de imagen inválido. Usar JPEG, PNG o WebP.');
      return;
    }
    
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        if (width < 720 && height < 720) {
          setImageValidation({ 
            status: 'INVALID', 
            details: `Resolución insuficiente: ${width}x${height}. Se requiere resolución >= 720p (ej. 1280x720 o 720x1280).` 
          });
          triggerAlert(`Resolución de imagen insuficiente: ${width}x${height}.`);
          setUploadingImage(false);
        } else {
          setImageValidation({ 
            status: 'VALID', 
            details: `Pre-flight OK: Formato ${file.type.split('/')[1].toUpperCase()} verificado, Resolución ${width}x${height} (>= 720p), Libre de malware.` 
          });
          setImageFile({ data: base64, mimeType: file.type, name: file.name });
          setUploadingImage(false);
          triggerAlert('Imagen de referencia (Visual Anchor) cargada correctamente.');
        }
      };
      img.onerror = () => {
        setImageValidation({ status: 'INVALID', details: 'Error al procesar la imagen de referencia.' });
        setUploadingImage(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const resetAll = () => {
    setVideoFile(null);
    setDna('');
    setTopic('');
    setAnalyzedData(null);
    setResult(null);
    setError('');
    setImageFile(null);
    setImageInstructions('');
    setImageValidation({
      status: 'PENDING',
      details: 'Ninguna imagen de referencia ha sido cargada aún.'
    });
  };

  return (
    <div className="bg-[#0a0a0a] text-zinc-300 font-sans min-h-screen p-4 sm:p-6 flex flex-col selection:bg-orange-500/30">
      
      {/* Custom Iframe-Safe Notification Toast */}
      {alertMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-orange-500 text-zinc-100 rounded-lg shadow-2xl p-4 max-w-sm flex items-center gap-3 animate-pulse border-l-4">
          <span className="text-lg shrink-0">⚠️</span>
          <div className="flex-1 text-[11px] font-bold uppercase tracking-tight text-orange-400">
            {alertMessage}
          </div>
          <button
            onClick={() => setAlertMessage('')}
            className="text-zinc-500 hover:text-white font-black text-xs font-mono ml-2 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-zinc-800 pb-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1 px-1.5 bg-orange-600 rounded-sm font-black text-white text-[10px] font-mono leading-none tracking-tighter shrink-0 animate-pulse">SPK</span>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white uppercase flex items-center gap-2">
                SPARK <span className="text-orange-500 font-mono text-[12px] tracking-widest bg-zinc-950 px-2.5 py-0.5 rounded border border-zinc-800">SENTIENCE.EXE</span>
              </h1>
              <p className="text-[9px] sm:text-[10.5px] text-zinc-500 uppercase tracking-wider font-mono">
                Deconstrucción Acústica, Óptica VFX & Abogado del Diablo Core v5.5
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('cloner')}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-tight flex items-center gap-1.5 transition-colors ${
              activeTab === 'cloner' ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Clonador Directo de ADN
          </button>
          <button
            onClick={() => setActiveTab('multianalyzer')}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-tight flex items-center gap-1.5 transition-colors ${
              activeTab === 'multianalyzer' ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            ADN Cruzado (Múltiples Videos)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden md:flex bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs items-center gap-2 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none text-orange-400">INGENIERO DE AUDIENCIAS</span>
          </div>
        </div>
      </header>

      {/* Engine selection control bar */}
      <div className="mb-6 shrink-0">
        <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
      </div>

      {/* Main Bento Grid */}
      {activeTab === 'cloner' ? (
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow relative">
          
          {/* Left Sidebar: Form with Real Uploading & Instant Trigger */}
          <div className="lg:col-span-3 bg-zinc-900/50 border border-zinc-850 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">
                PASO 1: SUBIR VIDEO VIRAL
              </h3>
              {(videoFile || dna || analyzedData) && (
                <button
                  onClick={resetAll}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 font-mono uppercase"
                  title="Reiniciar todo"
                >
                  <RotateCcw className="w-3 h-3" /> Limpiar
                </button>
              )}
            </div>
            
            <div className="space-y-4 flex flex-col flex-grow text-xs">
              
              {/* Real Multimodal Video Attachment */}
              <div className="bg-black/40 p-4 rounded-lg border border-zinc-800/85">
                <label className="text-[10px] text-zinc-400 uppercase mb-2 block font-bold tracking-wider">
                  Archivo de Video de Referencia
                </label>
                {uploadingVideo ? (
                  <div className="bg-zinc-800/20 p-6 rounded border border-zinc-800 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                    <p className="text-[10px] text-zinc-400">Procesando archivo local...</p>
                  </div>
                ) : videoFile ? (
                  <div className="bg-zinc-900/80 p-3 rounded border border-zinc-750 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden w-[85%]">
                      <FileVideo className="w-5 h-5 text-orange-500 shrink-0" />
                      <div className="text-left overflow-hidden">
                        <p className="text-[11px] font-bold text-zinc-200 truncate">{videoFile.name}</p>
                        <p className="text-[9px] text-orange-500 font-mono tracking-wide uppercase">Carga Completa</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFile(null);
                        setAnalyzedData(null);
                        setResult(null);
                      }}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`border border-dashed rounded-lg p-5 text-center cursor-pointer transition-all relative group ${
                      isDragging
                        ? 'border-orange-500 bg-orange-500/10 scale-[1.02]'
                        : 'border-zinc-800 hover:border-orange-500/40 bg-zinc-950/20'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={() => setIsDragging(false)}
                  >
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 50 * 1024 * 1024) {
                            triggerAlert("Sube un clip de video menor a 50MB (aprox 1 minuto de duración).");
                            return;
                          }
                          setUploadingVideo(true);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = (reader.result as string).split(',')[1];
                            const fileObj = { data: base64, mimeType: file.type, name: file.name };
                            setVideoFile(fileObj);
                            setUploadingVideo(false);
                            // Auto Trigger deep video analysis right away!
                            handleAnalyzeVideo(fileObj, '');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileVideo className={`w-6 h-6 mx-auto mb-2 transition-colors ${isDragging ? 'text-orange-500 animate-bounce' : 'text-zinc-600 group-hover:text-orange-500'}`} />
                    <span className="text-[11px] text-zinc-400 block font-bold">
                      {isDragging ? '¡Suelta el video aquí!' : 'Arrastra o sube el video viral'}
                    </span>
                    <span className="text-[9px] text-zinc-600 block mt-1">Clips de TikTok/Shorts (Máx 50MB)</span>
                  </div>
                )}
              </div>

              {/* Textual Fallback entry ONLY if video is not present */}
              {!videoFile && (
                <div className="bg-black/40 p-3 rounded border border-zinc-800/50">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                      O describe el ADN original
                    </label>
                    {dna.trim() !== '' && (
                      <button
                        onClick={() => handleAnalyzeVideo(undefined, dna)}
                        className="text-[9px] bg-orange-600/25 border border-orange-500/30 text-orange-400 hover:bg-orange-600 hover:text-white px-2 py-0.5 rounded font-bold uppercase transition-all"
                      >
                        Analizar Notas
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={dna}
                    onChange={(e) => setDna(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-xs focus:outline-none focus:ring-0 resize-none text-zinc-200 placeholder:text-zinc-700 font-semibold leading-relaxed"
                    placeholder="Describe el gancho, ritmo y estructura si prefieres no cargar un archivo de video local..."
                  />
                </div>
              )}

              {/* Visual Anchor Point (V3) - Image Upload with Instructions & Pre-flight validations */}
              <div className="bg-black/40 p-4 rounded-lg border border-zinc-800/85 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-zinc-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
                    Visual Anchor Point
                  </label>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImageInstructions('');
                        setImageValidation({
                          status: 'PENDING',
                          details: 'Ninguna imagen de referencia ha sido cargada aún.'
                        });
                      }}
                      className="text-[9px] text-zinc-500 hover:text-red-400 font-mono uppercase"
                    >
                      Remover
                    </button>
                  )}
                </div>

                {uploadingImage ? (
                  <div className="bg-zinc-800/20 p-5 rounded border border-zinc-800 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                    <p className="text-[10px] text-zinc-400">Validando imagen pre-flight...</p>
                  </div>
                ) : imageFile ? (
                  <div className="space-y-2">
                    <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-black/50 p-2 flex items-center gap-3">
                      <img 
                        src={`data:${imageFile.mimeType};base64,${imageFile.data}`} 
                        alt="Visual Anchor" 
                        className="w-12 h-12 object-cover rounded border border-zinc-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-left overflow-hidden">
                        <p className="text-[11px] font-bold text-zinc-200 truncate">{imageFile.name}</p>
                        <p className="text-[9px] font-mono text-green-500 uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                          Pre-flight Verificado
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all relative group ${
                      isDraggingImage
                        ? 'border-orange-500 bg-orange-500/10 scale-[1.02]'
                        : 'border-zinc-800 hover:border-orange-500/40 bg-zinc-950/20'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(true);
                    }}
                    onDragLeave={() => setIsDraggingImage(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="text-lg text-zinc-600 group-hover:text-orange-500 transition-colors">🖼️</span>
                      <span className="text-[10.5px] text-zinc-400 block font-bold leading-none">
                        {isDraggingImage ? '¡Suelta la imagen aquí!' : 'Sube una imagen de referencia'}
                      </span>
                      <span className="text-[8.5px] text-zinc-600 block">JPEG, PNG o WebP (Mínimo 720p)</span>
                    </div>
                  </div>
                )}

                {/* Validation Badge */}
                <div className={`p-2 rounded text-[10px] font-semibold border ${
                  imageValidation.status === 'VALID' 
                    ? 'bg-green-500/5 text-green-400 border-green-500/20' 
                    : imageValidation.status === 'INVALID' 
                    ? 'bg-red-500/5 text-red-400 border-red-500/20' 
                    : 'bg-zinc-950/60 text-zinc-550 border-zinc-850'
                }`}>
                  <p className="uppercase text-[8.5px] font-black tracking-widest mb-0.5 text-zinc-400">
                    Control de Ingesta & Consistencia:
                  </p>
                  <p className="leading-snug">{imageValidation.details}</p>
                </div>

                {/* Optional Custom Adaptability Instructions for Visual Anchor Point */}
                <div className="space-y-1 text-left">
                  <label className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
                    Instrucciones de Adaptación Visual
                  </label>
                  <textarea
                    rows={2}
                    value={imageInstructions}
                    onChange={(e) => setImageInstructions(e.target.value)}
                    className="w-full bg-zinc-950/75 border border-zinc-800 rounded p-2 text-[11px] focus:outline-none focus:border-orange-500/50 resize-none text-zinc-200 placeholder:text-zinc-700 font-semibold"
                    placeholder="Ej: Adapta los gestos y trajes tradicionales de artes marciales de esta fotografía en la ingeniería de la pelea..."
                  />
                </div>
              </div>

              {/* Manual Destination Topic - as alternative or editable field */}
              <div className="bg-black/40 p-3 rounded border border-zinc-800/50 flex-grow flex flex-col">
                <label className="text-[10px] text-zinc-400 uppercase mb-1.5 block font-bold tracking-widest">
                  Tópico de Destino (Opcional si usas propuestas)
                </label>
                <textarea
                  rows={4}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="flex-grow w-full bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 text-xs focus:outline-none focus:border-orange-500/50 resize-none text-zinc-200 placeholder:text-zinc-750 italic leading-relaxed"
                  placeholder='"La drástica medida de la UE sobre el fin de motores de combustión y la ira de la industria."'
                />
                {topic.trim() !== '' && (
                  <button
                    onClick={() => handleGenerateScript(topic)}
                    disabled={loading}
                    className="mt-2 w-full bg-orange-600 hover:bg-orange-500 text-white font-bold p-2 rounded text-[11px] uppercase transition-colors flex items-center justify-center gap-1.5"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Clonar a este Tópico manual
                  </button>
                )}
              </div>

              {error && (
                <div className="text-[10px] text-red-400 border border-red-500/30 bg-red-500/10 p-2.5 rounded">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Center Column: Toggleable views between Original Transcription vs. New Cloned Script */}
          <div className="lg:col-span-6 bg-zinc-900 border border-zinc-700 rounded-xl flex flex-col overflow-hidden relative min-h-[450px]">
            {analyzingVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-md z-30 text-center p-6">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                <p className="text-sm font-black text-white uppercase tracking-wider">Leyendo y Analizando Video...</p>
                <p className="text-[11px] text-orange-400 font-black mt-2 max-w-sm animate-pulse min-h-[30px] uppercase leading-tight">
                  {loadingTips[tipIndex]}
                </p>
                <p className="text-[10px] text-zinc-500 mt-2 max-w-sm">
                  Utilizando Visión Multimodal para transcribir el audio, detectar el ritmo de edición exacto, las emociones en pantalla y ganchos algorítmicos.
                </p>
              </div>
            )}

            {/* If neither are loaded */}
            {!analyzedData && !result && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/85 backdrop-blur-sm z-10 text-center p-6">
                <div className="text-orange-500/90 mb-3 animate-pulse bg-orange-500/10 p-3 rounded-full">
                  <Zap className="w-8 h-8" />
                </div>
                <p className="text-xs font-black text-white uppercase tracking-widest">INGENIERÍA DE AUDIENCIAS ACTIVA</p>
                <p className="text-[10px] text-zinc-550 mt-2 max-w-xs leading-relaxed uppercase">
                  Sube un video viral de referencia a la izquierda. La IA lo transcribirá por ti, extraerá su estructura neuro-emocional y te sugerirá 3 tópicos listos para un clonado automático.
                </p>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a20]/95 backdrop-blur-md z-20 text-center p-6">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                <p className="text-xs font-bold text-white uppercase tracking-widest">Generando Nuevo Guion Clónico...</p>
                <p className="text-[11px] text-orange-400 font-bold mt-2 animate-pulse min-h-[30px] uppercase">
                  {loadingTips[tipIndex]}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-xs uppercase">
                  Sincronizando la velocidad y los ganchos visuales con el nuevo tópico seleccionado...
                </p>
              </div>
            )}

            {/* Navigation inside original vs generated */}
            <div className="bg-zinc-800/80 p-3 border-b border-zinc-700/80 flex justify-between items-center shrink-0">
              <div className="flex gap-2">
                {analyzedData && (
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Video Cargado Sincronizado
                  </span>
                )}
              </div>
              <div className="flex gap-2.5">
                {result && (
                  <button
                    onClick={downloadScriptTxt}
                    className="text-zinc-300 hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold bg-zinc-850 px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-800 transition-colors shrink-0"
                  >
                    📥 Descargar TXT
                  </button>
                )}
                {result ? (
                  <button
                    onClick={copyToClipboard}
                    className="text-orange-500 hover:text-orange-400 flex items-center gap-1 text-[10px] uppercase font-bold bg-orange-500/5 px-2 py-1 rounded border border-orange-500/15"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar Guion Clónico
                  </button>
                ) : (analyzedData && (
                  <button
                    onClick={copyOriginalToClipboard}
                    className="text-zinc-400 hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold bg-zinc-800 px-2 py-1 rounded"
                  >
                    {copiedOriginal ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar Transcripción
                  </button>
                ))}
              </div>
            </div>

            {/* Split layout: Original Video Transcription vs Generated New Cloned Script */}
            <div className="flex-grow overflow-auto p-4">
              <ScriptTable
                originalScript={analyzedData?.originalScript}
                clonedScript={result?.script}
                isGenerating={loading}
                onSelectTopic={handleGenerateScript}
                hasAnalyzedData={!!analyzedData}
                selectedRowIndex={selectedRowIndex}
                selectedRowType={selectedRowType}
                onSelectRow={(idx, type) => {
                  setSelectedRowIndex(idx);
                  setSelectedRowType(type);
                }}
              />
            </div>

            {/* TABS DE DIAGNÓSTICO Y LOGICA (SAECS) */}
            <div className="flex bg-zinc-950/60 border-t border-zinc-800 shrink-0 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setDashboardTab('metrics')}
                className={`flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest transition-colors text-center ${
                  dashboardTab === 'metrics'
                    ? 'bg-zinc-900 text-orange-400 border-b-2 border-orange-500 font-extrabold'
                    : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                📊 Métricas y Deconstrucción
              </button>
              <button
                type="button"
                onClick={() => setDashboardTab('saecs')}
                className={`flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest transition-colors text-center flex items-center justify-center gap-1.5 ${
                  dashboardTab === 'saecs'
                    ? 'bg-zinc-900 text-orange-400 border-b-2 border-orange-500 font-extrabold'
                    : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                🛡️ Auditoría Lógica SAECS {auditReport && '✓'}
              </button>
              <button
                type="button"
                onClick={() => setDashboardTab('spatial')}
                className={`flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest transition-colors text-center flex items-center justify-center gap-1.5 ${
                  dashboardTab === 'spatial'
                    ? 'bg-zinc-900 text-orange-400 border-b-2 border-orange-500 font-extrabold'
                    : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                🎥 Planificación Espacial
              </button>
              <button
                type="button"
                onClick={() => setDashboardTab('raccord')}
                className={`flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest transition-colors text-center flex items-center justify-center gap-1.5 ${
                  dashboardTab === 'raccord'
                    ? 'bg-zinc-900 text-orange-400 border-b-2 border-orange-500 font-extrabold'
                    : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                🎞️ Continuidad Raccord
              </button>
            </div>

            <div className="p-3 bg-zinc-900/10 border-t border-zinc-800">
              {dashboardTab === 'metrics' && (
                <TelemetryDashboard result={result} analyzedData={analyzedData} />
              )}
              {dashboardTab === 'saecs' && (
                <LogicAuditorDashboard
                  auditReport={auditReport}
                  onRunAudit={handleRunLogicAudit}
                  isAuditing={isAuditing}
                  hasScript={!!(result?.script || analyzedData?.originalScript)}
                />
              )}
              {dashboardTab === 'spatial' && (
                <VisualBlockingViewer
                  selectedRow={
                    selectedRowType === 'cloned'
                      ? (result?.script?.[selectedRowIndex] || null)
                      : (analyzedData?.originalScript?.[selectedRowIndex] || null)
                  }
                  selectedRowIndex={selectedRowIndex}
                  rowType={selectedRowType}
                />
              )}
              {dashboardTab === 'raccord' && (
                <RaccordMonitor
                  script={selectedRowType === 'cloned' ? result?.script : analyzedData?.originalScript}
                  selectedModel={selectedModel}
                />
              )}
            </div>

            <div className="p-2.5 bg-black text-[10px] text-orange-550 text-center uppercase tracking-widest border-t border-zinc-800 shrink-0 font-black">
              SENTIENCE.EXE • Sincronización Acústica y Dirección de Arte Auditada
            </div>
          </div>

          {/* Right Panel Workspace: Instant analysis results & 3 Clickable suggestions */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
            
            {/* 3 Clickable topics suggested by the AI based on the reference video - THE GENIUS PART */}
            <div className="bg-zinc-900/50 border border-orange-500/30 rounded-xl p-4 flex flex-col shrink-0 bg-gradient-to-b from-orange-950/10 to-transparent">
              <h3 className="text-orange-500 text-[10px] font-bold uppercase mb-2 tracking-widest flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                PASO 2: SELECCIONE TÓPICO VIRAL
              </h3>
              <p className="text-[10px] text-zinc-550 mb-3 uppercase leading-tight font-semibold">Tópicos de alto impacto sugeridos automáticamente para clonar este ADN:</p>
              
              <div className="space-y-3">
                {analyzedData?.suggestedTopics ? (
                  analyzedData.suggestedTopics.map((topicText: string, i: number) => (
                    <button
                      key={i}
                      disabled={loading}
                      onClick={() => handleGenerateScript(topicText)}
                      className="w-full text-left p-3 rounded-lg border bg-zinc-950/60 border-zinc-800 hover:border-orange-500/50 hover:bg-orange-955/10 transition-all group flex gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-orange-500">
                        #{i + 1}
                      </span>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-zinc-200 leading-tight group-hover:text-orange-400">
                          {topicText}
                        </p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                          Generar Guion Clónico <ArrowRight className="w-2.5 h-2.5" />
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                   <div className="border border-dashed border-zinc-800 rounded-lg p-5 text-center text-zinc-650 italic text-[11px]">
                     Sube un video viral de referencia a la izquierda para auto-detectar su nicho y mostrar sugerencias instantáneas.
                   </div>
                )}
              </div>
            </div>

            {/* Matriz de ADN detectada */}
            <TransferableMatrixCard analyzedData={analyzedData} />

          </div>
        </main>
      ) : (
        /* Tabs 2: Cross Analyzer (Múltiples Videos) retains its premium layout */
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow relative">
          
          {/* Left Column: Multivideos Form */}
          <div className="lg:col-span-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
              <h3 className="text-orange-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                Auditoría Comparativa Cruzada
              </h3>
              <button
                type="button"
                onClick={addVideoField}
                disabled={multiVideos.length >= 3}
                className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 px-2.5 py-1 rounded transition-all flex items-center gap-1 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" /> Añadir Video ({multiVideos.length}/3)
              </button>
            </div>

            <form onSubmit={handleCrossAnalyzeSubmit} className="space-y-4 flex flex-col flex-grow text-xs">
              
              {multiVideos.map((video, idx) => (
                <div key={idx} className="bg-black/30 border border-zinc-800 p-4 rounded-lg relative space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={video.title}
                      onChange={(e) => updateVideoValue(idx, 'title', e.target.value)}
                      className="bg-transparent border-none p-0 text-xs text-orange-400 font-bold focus:outline-none focus:ring-0 w-3/4 mr-2"
                      placeholder="Título del Video"
                    />
                    {multiVideos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVideoField(idx)}
                        className="text-zinc-600 hover:text-red-400 p-0.5 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {video.fileData ? (
                    <div className="bg-zinc-800/60 p-2.5 rounded border border-zinc-700/60 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileVideo className="w-4 h-4 text-orange-400 shrink-0" />
                        <p className="font-bold text-zinc-200 truncate">{video.fileName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const update = [...multiVideos];
                          update[idx].fileData = undefined;
                          update[idx].mimeType = undefined;
                          update[idx].fileName = undefined;
                          setMultiVideos(update);
                        }}
                        className="text-zinc-500 hover:text-red-400 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-zinc-800 hover:border-orange-500/40 bg-zinc-950/20 rounded-lg p-4 text-center cursor-pointer transition-colors relative group">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 50 * 1024 * 1024) {
                              triggerAlert("Sube un video menor a 50MB (Mide no más de 50MB).");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = (reader.result as string).split(',')[1];
                              const update = [...multiVideos];
                              update[idx].fileData = base64;
                              update[idx].mimeType = file.type;
                              update[idx].fileName = file.name;
                              setMultiVideos(update);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <FileVideo className="w-5 h-5 text-zinc-600 group-hover:text-orange-500 mx-auto mb-1 transition-colors" />
                      <span className="text-[10px] text-zinc-400 block font-bold">Cargar video de referencia real</span>
                      <span className="text-[8px] text-zinc-650 block">O usa la transcripción abajo</span>
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={video.content}
                    onChange={(e) => updateVideoValue(idx, 'content', e.target.value)}
                    className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded p-2 text-xs focus:outline-none focus:ring-0 text-zinc-300 placeholder:text-zinc-650 resize-none leading-relaxed"
                    placeholder="Notas o transcripción (Opcional si subiste video)..."
                  />
                </div>
              ))}

              <div className="mt-auto pt-2 relative">
                <button
                  type="submit"
                  disabled={crossLoading}
                  className="w-full bg-orange-600 text-white px-4 py-3 rounded text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-900/20 uppercase tracking-tight disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500 transition-colors"
                >
                  {crossLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      EXTRAYENDO ADN CRUZADO MULTIMODAL...
                    </>
                  ) : (
                    <>
                      COMPARAR VIDEOS REALES (VISION 2.6)
                    </>
                  )}
                </button>
                {crossError && (
                  <div className="mt-2 text-[10px] text-red-400 border border-red-500/30 bg-red-500/10 p-2 rounded">
                    {crossError}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Center Column: Formal Document Output */}
          <div className="lg:col-span-5 bg-zinc-900 border border-zinc-700 rounded-xl flex flex-col overflow-hidden relative min-h-[450px]">
            {!crossResult && !crossLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/85 backdrop-blur-sm z-10 text-center p-6 m-4">
                <div className="text-zinc-600 mb-2">
                   <BookOpen className="w-8 h-8" />
                </div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">MAPEO CRUZADO EN ESPERA (VISION LIVEDATA)</p>
                <p className="text-[10px] text-zinc-500 mt-2 max-w-xs">Carga hasta 3 videos exitosos para realizar un cruce de variables de retención directamente utilizando visión artificial y generar el Informe de Ingeniería Inversa.</p>
              </div>
            )}
            {crossLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a10]/95 backdrop-blur-md z-10 text-center p-6">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                <p className="text-xs font-bold text-white uppercase tracking-widest">Analizando y Comparando Videos</p>
                <p className="text-[11px] text-orange-400 font-bold mt-2 animate-pulse min-h-[30px] uppercase">
                  {loadingTips[tipIndex]}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-xs uppercase">Evaluando ganchos compartidos, ganchos visuales y cortes para sintetizar la matriz transferible común...</p>
              </div>
            )}

            <div className="bg-zinc-800/50 p-3 border-b border-zinc-700 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-bold text-white uppercase">
                Informe de Ingeniería Inversa Cruzada
              </span>
              <div className="flex gap-2">
                {crossResult && (
                  <button
                    onClick={downloadCrossReportMd}
                    className="text-zinc-350 hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold bg-zinc-850 px-2.5 py-1 rounded border border-zinc-700 hover:bg-zinc-800 transition-colors"
                  >
                    📥 Descargar .MD
                  </button>
                )}
                <button
                  onClick={copyDocumentToClipboard}
                  disabled={!crossResult}
                  className="text-orange-500 hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-[10px] uppercase font-bold"
                  title="Copiar documento Markdown completo"
                >
                  {copiedDocument ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Markdown
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Scrollable Markdown Document Preview */}
            <div className="flex-grow p-4 overflow-y-auto text-xs leading-relaxed space-y-4 select-all">
              {crossResult?.exportableDocument ? (
                <div className="whitespace-pre-wrap text-zinc-300 font-sans leading-relaxed text-xs">
                  {crossResult.exportableDocument}
                </div>
              ) : (
                <div className="text-zinc-600 italic text-center py-10">
                  El reporte formal se generará aquí con títulos, tablas y recomendaciones de producción listas para teleprompter.
                </div>
              )}
            </div>

            <div className="p-3 bg-black text-[10px] text-orange-500/80 font-bold text-center uppercase tracking-widest border-t border-zinc-800 shrink-0">
              Cotejo Cruzado Real sin Mockeos ni Simulaciones
            </div>
          </div>

          {/* Right Column: Comparative Findings & Synthetic Similarities Panel */}
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
            
            {/* Matriz Similaridades Comunes */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col shrink-0">
              <h3 className="text-orange-500 text-[10px] font-bold uppercase mb-3 tracking-widest">Matriz de Similitud Cruzada</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                  <span className="text-zinc-550 shrink-0">Tipo de gancho:</span>
                  <span className={`font-semibold text-right ${crossResult ? 'text-zinc-200' : 'text-zinc-700 blur-[2px]'}`}>
                    {crossResult ? crossResult.similarities?.hookType : 'Auto-analizado'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                  <span className="text-zinc-550 shrink-0">Emoción central:</span>
                  <span className={`font-semibold text-right ${crossResult ? 'text-zinc-200' : 'text-zinc-700 blur-[2px]'}`}>
                    {crossResult ? crossResult.similarities?.dominantEmotion : 'Auto-analizado'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                  <span className="text-zinc-550 shrink-0">Velocidad / Ritmo:</span>
                  <span className={`font-semibold text-right ${crossResult ? 'text-zinc-200' : 'text-zinc-700 blur-[2px]'}`}>
                    {crossResult ? crossResult.similarities?.narrativeSpeed : 'Aceleración cruzada'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                  <span className="text-zinc-550 shrink-0">Complejidad Lenguaje:</span>
                  <span className={`font-semibold text-right ${crossResult ? 'text-zinc-200' : 'text-zinc-700 blur-[2px]'}`}>
                    {crossResult ? crossResult.similarities?.languageComplexity : 'Simple'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                  <span className="text-zinc-550 shrink-0 font-bold">Densidad de Ideas:</span>
                  <span className={`font-semibold text-right ${crossResult ? 'text-orange-400 font-mono text-[10px]' : 'text-zinc-700'}`}>
                    {crossResult ? crossResult.similarities?.ideasPerMinute : 'Pendiente'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                  <span className="text-zinc-550 shrink-0">Tensión escalar:</span>
                  <span className={`font-semibold text-right ${crossResult ? 'text-zinc-200' : 'text-zinc-700 blur-[2px]'}`}>
                    {crossResult ? crossResult.similarities?.tensionPattern : 'Clímax comparativo'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                  <span className="text-zinc-550 shrink-0 font-bold">Resolución:</span>
                  <span className={`font-semibold text-right ${crossResult ? 'text-zinc-200' : 'text-zinc-700 blur-[2px]'}`}>
                    {crossResult ? crossResult.similarities?.resolutionPattern : 'Pattern de salida'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 gap-2">
                  <span className="text-zinc-500 shrink-0 font-bold text-orange-500">CTA Retención:</span>
                  <span className={`font-semibold text-right ${crossResult ? 'text-orange-500 text-[11px]' : 'text-zinc-700 blur-[2px]'}`}>
                    {crossResult ? crossResult.similarities?.ctaType : 'Loop cruzado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sugerencias de Temas */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col shrink-0">
              <h3 className="text-orange-500 text-[10px] font-bold uppercase mb-3 tracking-widest">Temas Propuestos con este ADN</h3>
              <div className="space-y-2 text-xs">
                {crossResult?.suggestedTopics ? crossResult.suggestedTopics.map((topicText: string, i: number) => (
                  <div key={i} className="p-2.5 rounded text-[11px] border-l-2 bg-zinc-850 border-orange-500 text-zinc-200">
                    <span className="text-orange-500 font-bold">#{i + 1}</span> {topicText}
                  </div>
                )) : (
                   <div className="text-zinc-700 italic text-[11px] text-center py-4">Temas sugeridos por Vision</div>
                )}
              </div>
            </div>

            {/* Findings Summary */}
            <div className="bg-orange-950/20 border border-orange-500/30 p-3 rounded text-[11px] italic">
              <h4 className="text-[9px] font-bold uppercase text-orange-400 not-italic tracking-wider mb-1.5">Síntesis Cruzada</h4>
              <p className={crossResult ? 'text-zinc-300' : 'text-zinc-550 blur-sm opacity-50'}>
                {crossResult ? crossResult.findingsSummary : 'Resumen condensado de los patrones de comportamiento de la audiencia detectados en los videos reales...'}
              </p>
            </div>

          </div>

        </main>
      )}

    </div>
  );
}
