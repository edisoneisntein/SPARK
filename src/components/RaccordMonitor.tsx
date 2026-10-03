import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Zap, Shirt, Users, Backpack, ArrowRight, ShieldAlert, Sparkles, HelpCircle, Compass } from 'lucide-react';
import { ScriptRow, RaccordWarning, RaccordReport } from '../types';

interface RaccordMonitorProps {
  script: ScriptRow[] | undefined;
  selectedModel: string;
}

export function RaccordMonitor({ script, selectedModel }: RaccordMonitorProps) {
  const [warnings, setWarnings] = useState<RaccordWarning[]>([]);
  const [overallScore, setOverallScore] = useState<number>(100);
  const [summary, setSummary] = useState<string>('');
  const [selectedBeatIdx, setSelectedBeatIdx] = useState<number>(0);
  const [aiReport, setAiReport] = useState<RaccordReport | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Instant Local Heuristic Raccord Analyzer
  const runLocalRaccordAnalysis = (rows: ScriptRow[]) => {
    if (!rows || rows.length < 2) {
      setWarnings([]);
      setOverallScore(100);
      setSummary('Se necesitan al menos 2 intervalos para simular continuidad raccord.');
      return;
    }

    const detectedWarnings: RaccordWarning[] = [];

    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const curr = rows[i];

      const prevVisual = (prev.visual || '').toLowerCase();
      const currVisual = (curr.visual || '').toLowerCase();
      const prevVFX = (prev.vfx || '').toLowerCase();
      const currVFX = (curr.vfx || '').toLowerCase();

      // 1. Check Camera Angle / 180° Axis Jump (Heuristics)
      let prevSide = 'front';
      let currSide = 'front';
      if (prevVisual.includes('perfil derecho') || prevVisual.includes('lado derecho')) prevSide = 'right';
      if (prevVisual.includes('perfil izquierdo') || prevVisual.includes('lado izquierdo')) prevSide = 'left';
      if (prevVisual.includes('escorzo') || prevVisual.includes('ots') || prevVisual.includes('contraplano')) prevSide = 'reverse';
      if (prevVisual.includes('detrás') || prevVisual.includes('espalda')) prevSide = 'back';

      if (currVisual.includes('perfil derecho') || currVisual.includes('lado derecho')) currSide = 'right';
      if (currVisual.includes('perfil izquierdo') || currVisual.includes('lado izquierdo')) currSide = 'left';
      if (currVisual.includes('escorzo') || currVisual.includes('ots') || currVisual.includes('contraplano')) currSide = 'reverse';
      if (currVisual.includes('detrás') || currVisual.includes('espalda')) currSide = 'back';

      // Axis jump condition: front to back, or left side directly to right side, without camera motion
      const hasCameraMotion = currVisual.includes('travelling') || currVisual.includes('dolly') || currVisual.includes('paneo') || currVisual.includes('pan') || currVisual.includes('secuencia');
      
      if (!hasCameraMotion) {
        if ((prevSide === 'left' && currSide === 'right') || (prevSide === 'right' && currSide === 'left')) {
          detectedWarnings.push({
            beatIndex: i,
            time: curr.time,
            type: 'AXIS_JUMP',
            severity: 'CRÍTICO',
            title: 'Salto de Eje Potencial (Regla de 180°)',
            description: `La cámara salta abruptamente de perfil izquierdo a perfil derecho sin una toma de transición o movimiento fluido, lo cual desorienta al espectador.`,
            evidence: `[${prev.time}] "${prev.visual.substring(0, 45)}..." vs [${curr.time}] "${curr.visual.substring(0, 45)}..."`,
            recommendation: `Interpón un plano neutral (Plano Detalle del reloj o un Plano Objetivo frontal) entre ambos clips, o añade un travelling continuo.`
          });
        } else if (prevSide === 'front' && currSide === 'back') {
          detectedWarnings.push({
            beatIndex: i,
            time: curr.time,
            type: 'AXIS_JUMP',
            severity: 'MEDIO',
            title: 'Inversión de Ángulo de Cámara',
            description: `Se pasa de una toma frontal limpia a una toma de espalda completa. Sin justificación narrativa o transición, rompe el raccord visual del set.`,
            evidence: `De "${prevSide}" a "${currSide}"`,
            recommendation: `Asegura un plano escorzo (Over the Shoulder) previo para guiar el salto de eje.`
          });
        }
      }

      // 2. Character Count & Entry/Exit Consistency
      const prevCount = prev.charactersCount !== undefined ? prev.charactersCount : 1;
      const currCount = curr.charactersCount !== undefined ? curr.charactersCount : 1;

      if (prevCount !== currCount) {
        const mentionsEntryExit = 
          currVisual.includes('entra') || currVisual.includes('sale') || currVisual.includes('se va') ||
          currVisual.includes('llega') || currVisual.includes('aparece') || currVisual.includes('abandona') ||
          currVisual.includes('cruza') || currVisual.includes('marcha') ||
          (curr.audio || '').toLowerCase().includes('hola') || (curr.audio || '').toLowerCase().includes('adiós');

        if (!mentionsEntryExit) {
          detectedWarnings.push({
            beatIndex: i,
            time: curr.time,
            type: 'CHAR_COUNT',
            severity: 'CRÍTICO',
            title: 'Discrepancia Silenciosa en Conteo de Elenco',
            description: `El número de personajes cambia de ${prevCount} a ${currCount} sin explicación en pantalla. Un personaje aparece o desaparece sin que se describa su entrada o salida física.`,
            evidence: `Anterior: ${prevCount} pers. (${prev.charactersDetail || 'actor'}) vs Siguiente: ${currCount} pers. (${curr.charactersDetail || 'actor'})`,
            recommendation: `Modifica la columna visual del beat de ${curr.time} para describir explícitamente la acción de entrada/salida (ej: "Brad Pitt entra al encuadre por la izquierda") o mantén el mismo elenco.`
          });
        }
      }

      // 3. Wardrobe / Outfit Continuity
      const prevWardrobe = (prev.wardrobe || '').toLowerCase().trim();
      const currWardrobe = (curr.wardrobe || '').toLowerCase().trim();

      if (prevWardrobe && currWardrobe && prevWardrobe !== currWardrobe) {
        // Find major color/garment differences
        const garments = ['chaqueta', 'sudadera', 'gorra', 'gafas', 'guantes', 'camisa', 'suéter', 'pantalón'];
        let hasConflict = false;
        let conflictWord = '';

        garments.forEach(g => {
          if (prevWardrobe.includes(g) && currWardrobe.includes(g)) {
            // Compare substring details
            const prevGarmentDesc = prevWardrobe.substring(prevWardrobe.indexOf(g), prevWardrobe.indexOf(g) + 25);
            const currGarmentDesc = currWardrobe.substring(currWardrobe.indexOf(g), currWardrobe.indexOf(g) + 25);
            if (prevGarmentDesc !== currGarmentDesc && !currVisual.includes('cambia') && !currVisual.includes('quita') && !currVisual.includes('pone')) {
              hasConflict = true;
              conflictWord = g;
            }
          }
        });

        if (hasConflict || (prevWardrobe.length > 5 && currWardrobe.length > 5 && !prevWardrobe.split(' ').some(w => currWardrobe.includes(w)) && !currVisual.includes('cambia'))) {
          detectedWarnings.push({
            beatIndex: i,
            time: curr.time,
            type: 'WARDROBE',
            severity: 'MEDIO',
            title: `Raccord de Vestuario Comprometido (${conflictWord || 'Prenda'})`,
            description: `La descripción de vestuario cambia drásticamente de un beat al siguiente. Anterior: "${prev.wardrobe}" vs Siguiente: "${curr.wardrobe}".`,
            evidence: `[${prev.time}] vs [${curr.time}]`,
            recommendation: `Asegura consistencia en la indumentaria o añade una línea visual que explique la alteración (ej: "Se quita la gorra").`
          });
        }
      }

      // 4. Props (Atrezzo) Continuity
      const prevProps = (prev.propsAndEnvironment || '').toLowerCase();
      const currProps = (curr.propsAndEnvironment || '').toLowerCase();

      const activeProps = ['teléfono', 'celular', 'mapa', 'linterna', 'vaso', 'taza', 'llave', 'arma', 'pistola', 'cuchillo', 'reloj', 'libro', 'computadora', 'laptop'];
      activeProps.forEach(prop => {
        if (prevProps.includes(prop) && !currProps.includes(prop)) {
          // Prop disappeared
          const isPutAway = currVisual.includes('guarda') || currVisual.includes('suelta') || currVisual.includes('deja') || currVisual.includes('coloca') || currVisual.includes('tira');
          if (!isPutAway) {
            detectedWarnings.push({
              beatIndex: i,
              time: curr.time,
              type: 'PROPS',
              severity: 'INFORMATIVO',
              title: `Utilería Volátil: Desaparición de ${prop}`,
              description: `El objeto "${prop}" estaba activo en la escena anterior, pero ya no figura en la descripción física de este beat sin indicar si fue guardado o soltado.`,
              evidence: `Objeto "${prop}" no mencionado en ${curr.time}`,
              recommendation: `Especifica si el actor conserva el objeto en su mano, lo deja sobre la mesa, o lo guarda en su vestuario.`
            });
          }
        }
      });

      // 5. Direction of Exit and Entry
      let prevExitDir = '';
      if (prevVisual.includes('sale por la derecha') || prevVisual.includes('sale hacia la derecha')) prevExitDir = 'right';
      if (prevVisual.includes('sale por la izquierda') || prevVisual.includes('sale hacia la izquierda')) prevExitDir = 'left';

      let currEntryDir = '';
      if (currVisual.includes('entra por la derecha') || currVisual.includes('aparece por la derecha')) currEntryDir = 'right';
      if (currVisual.includes('entra por la izquierda') || currVisual.includes('aparece por la izquierda')) currEntryDir = 'left';

      if (prevExitDir && currEntryDir && prevExitDir === currEntryDir) {
        detectedWarnings.push({
          beatIndex: i,
          time: curr.time,
          type: 'EXIT_ENTRY',
          severity: 'CRÍTICO',
          title: 'Error de Raccord de Dirección en Pantalla',
          description: `El personaje sale por la ${prevExitDir === 'right' ? 'derecha' : 'izquierda'} en el clip anterior, pero entra de inmediato por la ${currEntryDir === 'right' ? 'derecha' : 'izquierda'} en el siguiente. Esto rompe la física visual del movimiento del espectador.`,
          evidence: `Salida: ${prevExitDir} vs Entrada: ${currEntryDir}`,
          recommendation: `Haz que entre por el lado contrario (${currEntryDir === 'right' ? 'izquierda' : 'derecha'}) para simular continuidad de recorrido correcta.`
        });
      }

      // 6. Advanced PBR Lighting & Colorimetry Match
      const prevWarm = prevVFX.includes('3200k') || prevVFX.includes('cálida') || prevVFX.includes('tungsteno') || prevVFX.includes('cálido');
      const currCool = currVFX.includes('5600k') || currVFX.includes('fría') || currVFX.includes('daylight') || currVFX.includes('frío');
      const prevCool = prevVFX.includes('5600k') || prevVFX.includes('fría') || prevVFX.includes('daylight') || prevVFX.includes('frío');
      const currWarm = currVFX.includes('3200k') || currVFX.includes('cálida') || currVFX.includes('tungsteno') || currVFX.includes('cálido');

      if ((prevWarm && currCool) || (prevCool && currWarm)) {
        detectedWarnings.push({
          beatIndex: i,
          time: curr.time,
          type: 'PROPS',
          severity: 'MEDIO',
          title: 'Discrepancia en Temperatura de Color PBR',
          description: `Se detecta un cambio térmico abrupto sin justificación narrativa de set (p. ej., de ${prevWarm ? '3200K Cálida' : '5600K Fría'} a ${currCool ? '5600K Fría' : '3200K Cálida'}). Esto causará parpadeos térmicos en la cara de los actores.`,
          evidence: `Anterior: "${prev.vfx.substring(0, 35)}..." vs Actual: "${curr.vfx.substring(0, 35)}..."`,
          recommendation: `Ajusta el balance de blancos (Kelvin) o la iluminación práctica en el set de rodaje virtual para mantener consistencia de tono cromático.`
        });
      }

      // 7. Biomechanical Velocity / Kinetic State Coherence
      const isPrevKinetic = prevVisual.includes('corriendo') || prevVisual.includes('salta') || prevVisual.includes('cae') || prevVisual.includes('golpe') || prevVisual.includes('vuela') || prevVisual.includes('gira rápido');
      const isCurrStatic = currVisual.includes('estático') || currVisual.includes('sentado') || currVisual.includes('quieto') || currVisual.includes('inmóvil') || currVisual.includes('pausa completa');
      const mentionsDeceleration = currVisual.includes('frena') || currVisual.includes('aterriza') || currVisual.includes('se detiene') || currVisual.includes('amortigua') || currVisual.includes('cae sentado');

      if (isPrevKinetic && isCurrStatic && !mentionsDeceleration) {
        detectedWarnings.push({
          beatIndex: i,
          time: curr.time,
          type: 'EXIT_ENTRY',
          severity: 'MEDIO',
          title: 'Ruido de Continuidad Cinética (Desaceleración Fantasma)',
          description: `El personaje pasa instantáneamente de un estado de alta velocidad/cinemática a un reposo absoluto sin fase de desaceleración o transición de choque.`,
          evidence: `Movimiento de "${prevVisual.substring(0, 30)}..." a estatismo sin transición.`,
          recommendation: `Describe una acción intermedia de amortiguación cinética (ej: "aterriza flexionando rodillas" o "se desliza hasta detenerse").`
        });
      }

      // 8. Optical Lens Distortion Coherence
      const isPrevAnamorphic = prevVFX.includes('anamórfico') || prevVFX.includes('135mm');
      const isCurrWide = currVFX.includes('18mm') || currVFX.includes('ojo de pez') || currVFX.includes('gran angular');

      if (isPrevAnamorphic && isCurrWide) {
        detectedWarnings.push({
          beatIndex: i,
          time: curr.time,
          type: 'AXIS_JUMP',
          severity: 'INFORMATIVO',
          title: 'Variación Óptica Extrema en Corte Consecutivo',
          description: `Se detecta un corte entre una lente anamórfica/telecompresión (135mm) y un súper gran angular (18mm). La deformación de barril de la cara del actor cambiará drásticamente.`,
          evidence: `Lente o compresión de fondo incompatible en cortes adyacentes.`,
          recommendation: `Asegura un plano de transición a 50mm esférico o mitiga la compresión mediante un tiro de cámara neutral.`
        });
      }
    }

    // Calculate score based on gravity of warnings
    let score = 100;
    detectedWarnings.forEach(w => {
      if (w.severity === 'CRÍTICO') score -= 15;
      else if (w.severity === 'MEDIO') score -= 8;
      else if (w.severity === 'INFORMATIVO') score -= 3;
    });
    score = Math.max(10, score);

    setWarnings(detectedWarnings);
    setOverallScore(score);

    // Dynamic Summary
    let summaryText = 'Análisis de raccord local completado de forma impecable. ';
    if (detectedWarnings.length === 0) {
      summaryText += '¡Excelente coherencia espacial y física! No se han detectado saltos de eje ni contradicciones de personajes o vestuario.';
    } else {
      const criticalCount = detectedWarnings.filter(w => w.severity === 'CRÍTICO').length;
      summaryText += `Se detectaron ${detectedWarnings.length} posibles anomalías físicas (${criticalCount} críticas, ${detectedWarnings.length - criticalCount} menores). Revisa las advertencias en la línea de tiempo para evitar regrabaciones costosas.`;
    }
    setSummary(summaryText);
  };

  useEffect(() => {
    if (script) {
      runLocalRaccordAnalysis(script);
      setSelectedBeatIdx(0);
    }
  }, [script]);

  // AI-Powered Continuity Audit Handler
  const handleAiContinuityAudit = async () => {
    if (!script || script.length === 0) return;

    setIsAuditing(true);
    try {
      const res = await fetch('/api/audit-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: script,
          model: selectedModel
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al ejecutar auditoría de continuidad.');
      }

      // Convert standard audit Findings to Raccord format
      const mappedWarnings: RaccordWarning[] = data.findings.map((f: any, idx: number) => {
        let type: RaccordWarning['type'] = 'PROPS';
        if (f.description.toLowerCase().includes('eje') || f.description.toLowerCase().includes('180') || f.description.toLowerCase().includes('cámara')) {
          type = 'AXIS_JUMP';
        } else if (f.description.toLowerCase().includes('personaje') || f.description.toLowerCase().includes('elenco') || f.description.toLowerCase().includes('conteo')) {
          type = 'CHAR_COUNT';
        } else if (f.description.toLowerCase().includes('vestuario') || f.description.toLowerCase().includes('ropa') || f.description.toLowerCase().includes('outfit')) {
          type = 'WARDROBE';
        } else if (f.description.toLowerCase().includes('entra') || f.description.toLowerCase().includes('sale') || f.description.toLowerCase().includes('dirección')) {
          type = 'EXIT_ENTRY';
        }

        const sev: RaccordWarning['severity'] = 
          f.severity === 'CRÍTICO' ? 'CRÍTICO' : 
          f.severity === 'ALTO' || f.severity === 'MEDIO' ? 'MEDIO' : 'INFORMATIVO';

        return {
          beatIndex: idx,
          time: f.evidence || '00:00',
          type,
          severity: sev,
          title: f.title,
          description: f.description,
          evidence: f.evidence + ' - ' + f.triggerCase,
          recommendation: f.recommendation
        };
      });

      const aiReportObj: RaccordReport = {
        overallScore: data.confidenceIndex,
        summary: `Auditoría Semántica Avanzada por IA: ${data.generalState}. ${data.executiveSummary}`,
        warnings: mappedWarnings
      };

      setAiReport(aiReportObj);
      setWarnings(mappedWarnings);
      setOverallScore(aiReportObj.overallScore);
      setSummary(aiReportObj.summary);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const getBeatWarnings = (idx: number) => warnings.filter(w => w.beatIndex === idx);

  const activeBeat = script ? script[selectedBeatIdx] : null;
  const prevBeat = (script && selectedBeatIdx > 0) ? script[selectedBeatIdx - 1] : null;
  const activeBeatWarnings = getBeatWarnings(selectedBeatIdx);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
      
      {/* Tab bar header */}
      <div className="bg-zinc-950/40 border-b border-zinc-800 px-4 py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange-500 animate-pulse" />
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">
              Simulador de Continuidad Temporal (Raccord Monitor)
            </h3>
            <span className="text-[9.5px] text-zinc-500 font-mono uppercase">
              Verificador automatizado de la Regla de 180°, conteo de actores, prendas y coherencia del set
            </span>
          </div>
        </div>

        {script && (
          <button
            onClick={handleAiContinuityAudit}
            disabled={isAuditing}
            className="self-start sm:self-auto text-[9.5px] bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded font-mono uppercase flex items-center gap-1.5 transition-colors font-bold disabled:opacity-40"
          >
            {isAuditing ? (
              <span className="animate-pulse">Analizando...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Auditoría de Continuidad IA
              </>
            )}
          </button>
        )}
      </div>

      {!script || script.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 italic text-[11px] uppercase tracking-wider leading-relaxed">
          Sube y analiza un video de referencia para proyectar el flujo de continuidad raccord y simular cortes de cámara consecutivos...
        </div>
      ) : (
        <div className="p-4 space-y-4">
          
          {/* General Continuity KPI & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Score dial indicator */}
            <div className="md:col-span-3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-850 flex flex-col justify-center items-center text-center">
              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">
                Índice Coherencia Raccord
              </span>
              <div className="relative flex items-center justify-center">
                <span className={`text-4xl font-black font-mono tracking-tighter ${
                  overallScore >= 85 ? 'text-green-400' : overallScore >= 65 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {overallScore}%
                </span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-3 border border-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    overallScore >= 85 ? 'bg-green-500' : overallScore >= 65 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${overallScore}%` }}
                />
              </div>
              <span className={`text-[8.5px] uppercase font-bold mt-2 px-2 py-0.5 rounded ${
                overallScore >= 85 ? 'bg-green-950/40 text-green-400 border border-green-900/30' : 
                overallScore >= 65 ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' : 
                'bg-red-950/40 text-red-400 border border-red-900/30'
              }`}>
                {overallScore >= 85 ? 'Continuidad Segura' : overallScore >= 65 ? 'Riesgo Moderado' : 'Continuidad Crítica'}
              </span>
            </div>

            {/* General diagnosis summary */}
            <div className="md:col-span-9 bg-zinc-950/30 p-4 rounded-xl border border-zinc-850 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-orange-500 font-mono uppercase font-black tracking-widest block mb-1">
                  Diagnóstico Predictivo de Raccord:
                </span>
                <p className="text-zinc-300 font-sans leading-relaxed text-[11px] whitespace-pre-line">
                  {summary}
                </p>
              </div>
              
              <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-850 text-[9px] text-zinc-500 font-mono uppercase">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Coherente (0 warnings)
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Warning Menor
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Salto de Eje / Vacío Crítico
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Timeline of scene beats */}
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono font-black tracking-wider block mb-2">
              Línea de Tiempo de Cortes y Transiciones:
            </span>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {script.map((row, idx) => {
                const beatWarnings = getBeatWarnings(idx);
                const hasCrit = beatWarnings.some(w => w.severity === 'CRÍTICO');
                const hasWarn = beatWarnings.some(w => w.severity === 'MEDIO');
                const isSel = idx === selectedBeatIdx;

                let borderStyle = 'border-zinc-850 hover:border-zinc-700 bg-zinc-950/40';
                let indicatorColor = 'bg-green-500';

                if (beatWarnings.length > 0) {
                  if (hasCrit) {
                    borderStyle = 'border-red-900/60 hover:border-red-500/80 bg-red-950/10';
                    indicatorColor = 'bg-red-500';
                  } else if (hasWarn) {
                    borderStyle = 'border-amber-900/60 hover:border-amber-500/80 bg-amber-950/10';
                    indicatorColor = 'bg-amber-500';
                  } else {
                    borderStyle = 'border-zinc-750 hover:border-zinc-600 bg-zinc-900/30';
                    indicatorColor = 'bg-zinc-500';
                  }
                }
                
                if (isSel) {
                  borderStyle = 'border-orange-500 bg-zinc-900 text-white ring-1 ring-orange-500/20';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedBeatIdx(idx)}
                    className={`flex-shrink-0 w-24 p-2 rounded-lg border text-left transition-all ${borderStyle}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[9px] font-bold text-zinc-400">{row.time}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor}`}></span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-zinc-300 block truncate">
                      Corte #{idx + 1}
                    </span>
                    <span className="text-[8.5px] font-mono text-zinc-550 block truncate">
                      {beatWarnings.length === 0 ? 'Sin advertencias' : `${beatWarnings.length} Alert${beatWarnings.length === 1 ? 'a' : 'as'}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Beat-by-Beat Comparison Area */}
          {activeBeat && (
            <div className="border border-zinc-850 rounded-xl bg-zinc-950/20 overflow-hidden">
              
              {/* Active selection banner */}
              <div className="bg-zinc-950/50 px-3 py-2 border-b border-zinc-850 flex justify-between items-center">
                <span className="text-[9.5px] font-black text-orange-400 font-mono uppercase">
                  Inspección de Raccord: Corte #{selectedBeatIdx + 1} ({activeBeat.time})
                </span>
                <span className="text-[8.5px] font-mono text-zinc-500 font-bold uppercase">
                  Dirección Escénica de Continuidad
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-850 text-xs">
                
                {/* 1. Left Side: Script comparative variables */}
                <div className="p-4 space-y-3">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono font-black tracking-wider block border-b border-zinc-850 pb-1">
                    Análisis Comparativo (Corte #{selectedBeatIdx} vs #{selectedBeatIdx + 1})
                  </span>

                  {selectedBeatIdx === 0 ? (
                    <div className="text-zinc-500 italic text-[10.5px] py-4">
                      Este es el primer plano del guion. Actúa como el anclaje inicial de raccord para todo el rodaje.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Cast Comparison */}
                      <div className="flex gap-2 items-start text-[10.5px] py-1 border-b border-zinc-850/40">
                        <Users className="w-3.5 h-3.5 text-pink-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-zinc-400 block font-mono text-[8.5px] uppercase">Elenco y Caracterización:</span>
                          <div className="grid grid-cols-2 gap-2 mt-0.5 text-[10px]">
                            <div className="bg-zinc-950/40 p-1 rounded">
                              <span className="text-[8px] font-mono text-zinc-500 block uppercase">Anterior (#{selectedBeatIdx}):</span>
                              <p className="truncate text-zinc-400">{prevBeat?.charactersDetail || 'Sin detalle'}</p>
                            </div>
                            <div className="bg-zinc-950/40 p-1 rounded border-l border-orange-500/20">
                              <span className="text-[8px] font-mono text-zinc-500 block uppercase">Actual (#{selectedBeatIdx + 1}):</span>
                              <p className="truncate text-zinc-300">{activeBeat.charactersDetail || 'Sin detalle'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Wardrobe Comparison */}
                      <div className="flex gap-2 items-start text-[10.5px] py-1 border-b border-zinc-850/40">
                        <Shirt className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-zinc-400 block font-mono text-[8.5px] uppercase">Vestuario y Ropa:</span>
                          <div className="grid grid-cols-2 gap-2 mt-0.5 text-[10px]">
                            <div className="bg-zinc-950/40 p-1 rounded">
                              <span className="text-[8px] font-mono text-zinc-500 block uppercase">Anterior:</span>
                              <p className="truncate text-zinc-400">{prevBeat?.wardrobe || 'Sin indumentaria'}</p>
                            </div>
                            <div className="bg-zinc-950/40 p-1 rounded border-l border-orange-500/20">
                              <span className="text-[8px] font-mono text-zinc-500 block uppercase">Actual:</span>
                              <p className="truncate text-zinc-300">{activeBeat.wardrobe || 'Sin indumentaria'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Props Comparison */}
                      <div className="flex gap-2 items-start text-[10.5px] py-1">
                        <Backpack className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-zinc-400 block font-mono text-[8.5px] uppercase">Utilería y Atrezzo:</span>
                          <div className="grid grid-cols-2 gap-2 mt-0.5 text-[10px]">
                            <div className="bg-zinc-950/40 p-1 rounded">
                              <span className="text-[8px] font-mono text-zinc-500 block uppercase">Anterior:</span>
                              <p className="truncate text-zinc-400">{prevBeat?.propsAndEnvironment || 'Sin objetos'}</p>
                            </div>
                            <div className="bg-zinc-950/40 p-1 rounded border-l border-orange-500/20">
                              <span className="text-[8px] font-mono text-zinc-500 block uppercase">Actual:</span>
                              <p className="truncate text-zinc-300">{activeBeat.propsAndEnvironment || 'Sin objetos'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Highlight current visual instruction */}
                  <div className="bg-zinc-950/50 p-2.5 rounded border border-zinc-850 mt-2">
                    <span className="text-[8.5px] font-mono text-zinc-550 uppercase block font-bold mb-1">Visual y Edición del plano:</span>
                    <p className="text-[10.5px] text-zinc-300 leading-snug">{activeBeat.visual}</p>
                  </div>
                </div>

                {/* 2. Right Side: Warnings specific to this beat */}
                <div className="p-4 space-y-3 bg-zinc-950/10">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono font-black tracking-wider block border-b border-zinc-850 pb-1">
                    Alertas del plano ({activeBeatWarnings.length} encontradas)
                  </span>

                  {activeBeatWarnings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500/50" />
                      <div>
                        <p className="text-[10.5px] font-bold text-zinc-400">¡COHERENCIA TOTAL SINOPSADA!</p>
                        <p className="text-[9px] text-zinc-550 uppercase font-mono mt-0.5">La física escénica, vestuario y cámara no registran anomalías en este corte.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[220px]">
                      {activeBeatWarnings.map((w, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border flex gap-2.5 ${
                            w.severity === 'CRÍTICO' ? 'bg-red-950/10 border-red-500/25' : 'bg-amber-950/10 border-amber-500/25'
                          }`}
                        >
                          <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                            w.severity === 'CRÍTICO' ? 'text-red-400' : 'text-amber-400'
                          }`} />
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[8.5px] font-black uppercase tracking-wider font-mono px-1.5 py-0.2 rounded ${
                                w.severity === 'CRÍTICO' ? 'bg-red-950 text-red-400 border border-red-900/30' : 'bg-amber-950 text-amber-400 border border-amber-900/30'
                              }`}>
                                {w.severity}
                              </span>
                              <h5 className="font-bold text-zinc-200 text-[10.5px] leading-tight">{w.title}</h5>
                            </div>
                            <p className="text-zinc-400 text-[10px] leading-relaxed">{w.description}</p>
                            
                            <div className="bg-black/30 p-1.5 rounded font-mono text-[9px] text-zinc-450 leading-normal border border-zinc-900">
                              <strong className="text-orange-500 uppercase text-[7.5px] block">Causa / Evidencia:</strong>
                              {w.evidence}
                            </div>

                            <div className="bg-zinc-900/50 p-1.5 rounded border border-zinc-800 text-[9.5px] text-zinc-300 leading-normal">
                              <strong className="text-green-400 uppercase text-[7.5px] block font-mono">Corrección de Rodaje:</strong>
                              {w.recommendation}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
