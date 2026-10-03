import { useState } from 'react';
import { Volume2, Video, ShieldAlert, BadgeCheck, Zap, AlertTriangle } from 'lucide-react';
import { AnalyzedVideo } from '../types';

interface TelemetryDashboardProps {
  result: any;
  analyzedData: AnalyzedVideo | null;
}

type TabType = 'acoustics' | 'optics' | 'devilsAdvocate';

export function TelemetryDashboard({ result, analyzedData }: TelemetryDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('acoustics');

  // Select source of metrics
  const displaySource = result || analyzedData;

  const acousticsInfo = [
    {
      title: 'Textura Ambiental & Soundscape',
      value: displaySource?.audioMetrics?.soundscape || 'Analizando frecuencias acústicas del video de referencia...',
    },
    {
      title: 'Efectos Foley (SFX & Transición)',
      value: displaySource?.audioMetrics?.foleySFX || 'Extrayendo transiciones foley de audio ambiental...',
    },
    {
      title: 'Rítmica Musical & Score',
      value: displaySource?.audioMetrics?.musicScore || 'Marcando patrones rítmicos de sincronización dramática...',
    },
    {
      title: 'Modulación Tonal de Voz',
      value: displaySource?.audioMetrics?.voiceTonal || 'Calculando frecuencia y velocidad vocal...',
    },
  ];

  const opticsInfo = [
    {
      title: 'Renders & Luces Físicas PBR',
      value: displaySource?.vfxMetrics?.pbrLighting || 'Analizando exposición física de luz...',
    },
    {
      title: 'LUT / Sabor Cromático Kelvin',
      value: displaySource?.vfxMetrics?.colorGradingLUT || 'Extrayendo matriz de color cinemática...',
    },
    {
      title: 'Grano & Imperfecciones de Lente',
      value: displaySource?.vfxMetrics?.opticalImperfection || 'Detectando grano fílmico y aberraciones ópticas...',
    },
    {
      title: 'Cadencia de Cortes / Transición',
      value: displaySource?.vfxMetrics?.transitionsSpeed || 'Contando ráfaga de cortes e interrupciones visuales...',
    },
  ];

  const visualFidelity = displaySource?.devilsAdvocate?.visualFidelityScore || 94;
  const foleyCoherence = displaySource?.devilsAdvocate?.foleyCoherenceScore || 91;

  return (
    <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
      {/* Tab bar header */}
      <div className="flex border-b border-zinc-805/80 bg-zinc-950/20">
        <button
          type="button"
          onClick={() => setActiveTab('acoustics')}
          className={`flex-1 py-3 px-3 transition-colors text-[10.5px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 ${
            activeTab === 'acoustics'
              ? 'bg-zinc-900 border-b-2 border-orange-500 text-orange-400 font-extrabold'
              : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          Acústica Integrada
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('optics')}
          className={`flex-1 py-3 px-3 transition-colors text-[10.5px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 ${
            activeTab === 'optics'
              ? 'bg-zinc-900 border-b-2 border-orange-500 text-orange-400 font-extrabold'
              : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <Video className="w-3.5 h-3.5 shrink-0" />
          Anatomía Óptica / VFX
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('devilsAdvocate')}
          className={`flex-1 py-3 px-3 transition-colors text-[10.5px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 ${
            activeTab === 'devilsAdvocate'
              ? 'bg-zinc-900 border-b-2 border-orange-500 text-orange-400 font-extrabold'
              : 'text-zinc-550 hover:text-zinc-300'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          Abogado del Diablo
        </button>
      </div>

      {/* Panel contents */}
      <div className="p-4 space-y-4">
        {activeTab === 'acoustics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {acousticsInfo.map((info, idx) => (
              <div key={idx} className="bg-zinc-950/40 p-3 rounded border border-zinc-850 hover:border-zinc-800 transition-colors">
                <span className="block text-[9px] text-zinc-500 uppercase font-mono font-bold tracking-wider mb-1">
                  {info.title}:
                </span>
                <p className="text-zinc-300 italic text-[11px] leading-relaxed">
                  {info.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'optics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {opticsInfo.map((info, idx) => (
              <div key={idx} className="bg-zinc-950/40 p-3 rounded border border-zinc-850 hover:border-zinc-800 transition-colors">
                <span className="block text-[9px] text-zinc-500 uppercase font-mono font-bold tracking-wider mb-1">
                  {info.title}:
                </span>
                <p className="text-zinc-300 italic text-[11px] leading-relaxed">
                  {info.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'devilsAdvocate' && (
          <div className="space-y-4">
            {/* Visual Dials / Scores with actual layout-bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-950/50 p-3.5 rounded border border-zinc-850 flex flex-col justify-between gap-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-450 uppercase font-mono font-black tracking-wide block">
                      Fidelidad Visual
                    </span>
                    <span className="text-[8.5px] text-zinc-500 font-mono">Original vs Clonación</span>
                  </div>
                  <span className="text-xl font-black font-mono text-orange-400">
                    {visualFidelity}%
                  </span>
                </div>
                {/* Visual progression bar */}
                <div className="w-full bg-zinc-900 h-2 rounded border border-zinc-800 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded transition-all duration-500"
                    style={{ width: `${visualFidelity}%` }}
                  />
                </div>
              </div>

              <div className="bg-zinc-950/50 p-3.5 rounded border border-zinc-850 flex flex-col justify-between gap-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-450 uppercase font-mono font-black tracking-wide block">
                      Armonía Foley
                    </span>
                    <span className="text-[8.5px] text-zinc-500 font-mono">Coherencia Acústica</span>
                  </div>
                  <span className="text-xl font-black font-mono text-cyan-400">
                    {foleyCoherence}%
                  </span>
                </div>
                {/* Visual progression bar */}
                <div className="w-full bg-zinc-900 h-2 rounded border border-zinc-800 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded transition-all duration-500"
                    style={{ width: `${foleyCoherence}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Warnings and Directives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-red-950/10 rounded border border-red-500/15">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <h4 className="text-[9.5px] font-bold text-red-400 uppercase tracking-widest font-mono">
                    Alertas de Discrepancia (Look IA Slop):
                  </h4>
                </div>
                <ul className="text-[10.5px] space-y-1.5 text-zinc-400 list-disc pl-4 leading-relaxed font-sans">
                  {displaySource?.devilsAdvocate?.discrepancyAlerts?.map((alert: string, idx: number) => (
                    <li key={idx} className="hover:text-zinc-300 transition-colors">{alert}</li>
                  )) || (
                    <li className="italic text-zinc-500 font-mono list-none">
                      Esperando análisis del video de referencia...
                    </li>
                  )}
                </ul>
              </div>

              <div className="p-3 bg-emerald-950/10 rounded border border-emerald-500/15">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <h4 className="text-[9.5px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
                    Directivas Quirúrgicas Anti-Slop:
                  </h4>
                </div>
                <ul className="text-[10.5px] space-y-1.5 text-zinc-300 list-disc pl-4 leading-relaxed font-sans">
                  {displaySource?.devilsAdvocate?.antiSlopDirectives?.map((directive: string, idx: number) => (
                    <li key={idx} className="text-emerald-300 hover:text-emerald-100 transition-colors">
                      {directive}
                    </li>
                  )) || (
                    <li className="italic text-zinc-500 font-mono list-none">
                      Esperando generación para inyectar directivas...
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
