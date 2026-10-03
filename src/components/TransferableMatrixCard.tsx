import { Activity, Disc, Zap, Flame, Compass, MessageSquare, Hash } from 'lucide-react';
import { AnalyzedVideo } from '../types';

interface TransferableMatrixCardProps {
  analyzedData: AnalyzedVideo | null;
}

export function TransferableMatrixCard({ analyzedData }: TransferableMatrixCardProps) {
  const isLoaded = !!analyzedData;

  const matrixItems = [
    {
      label: 'Tipo de Gancho',
      value: analyzedData?.transferableMatrix?.hookType || 'Auto-extraído del video',
    },
    {
      label: 'Emoción Dominante',
      value: analyzedData?.transferableMatrix?.dominantEmotion || 'Auto-extraído del video',
    },
    {
      label: 'Velocidad / Ritmo',
      value: analyzedData?.transferableMatrix?.narrativeSpeed || 'Aceleración calculada',
    },
    {
      label: 'Complejidad Lingüística',
      value: analyzedData?.transferableMatrix?.languageComplexity || 'Sencillo',
    },
    {
      label: 'Ideas por Minuto',
      value: analyzedData?.transferableMatrix?.ideasPerMinute || 'N/D',
      highlight: true,
    },
    {
      label: 'Patrón de Tensión',
      value: analyzedData?.transferableMatrix?.tensionPattern || 'Cruce tonal',
    },
    {
      label: 'CTA Retención',
      value: analyzedData?.transferableMatrix?.ctaType || 'Loop automático',
      cta: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Retention Matrix */}
      <div className="bg-zinc-900/60 border border-zinc-805 rounded-xl p-4 flex flex-col shadow-lg">
        <div className="flex items-center gap-1.5 mb-3">
          <Activity className="w-3.5 h-3.5 text-orange-500" />
          <h3 className="text-orange-500 text-[10px] font-black uppercase tracking-widest leading-none">
            ADN de Retención Extraído
          </h3>
        </div>
        <div className="space-y-2.5 text-xs">
          {matrixItems.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-1.5 border-b border-zinc-800/40 last:border-0 last:pb-0 gap-3"
            >
              <span className="text-zinc-550 shrink-0 font-medium">{item.label}:</span>
              <span
                className={`font-semibold text-right text-[11px] leading-snug ${
                  !isLoaded
                    ? 'text-zinc-700 blur-[2.5px] select-none'
                    : item.cta
                    ? 'text-orange-500 font-extrabold'
                    : item.highlight
                    ? 'text-orange-400 font-bold'
                    : 'text-zinc-250'
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Original Discussion / Commentbait */}
      <div className="bg-zinc-900/60 border border-zinc-805 rounded-xl p-4 flex flex-col shadow-lg">
        <div className="flex items-center gap-1.5 mb-2.5">
          <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
          <h3 className="text-orange-500 text-[10px] font-black uppercase tracking-widest leading-none">
            Trigger de Discusión Original
          </h3>
        </div>
        <div
          className={`bg-orange-950/10 border border-orange-500/15 p-3 rounded-lg text-[11px] italic leading-relaxed ${
            isLoaded ? 'text-zinc-200' : 'text-zinc-700 blur-sm opacity-50 select-none'
          }`}
        >
          {isLoaded ? `"${analyzedData?.commentBait}"` : '"Pregunta polarizante inducida..."'}
        </div>

        {/* 3. Strategic Hashtags */}
        <div className="flex items-center gap-1.5 mt-2 mb-2">
          <Hash className="w-3.5 h-3.5 text-zinc-500" />
          <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest leading-none">
            Hashtags Estratégicos
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {isLoaded && analyzedData?.hashtags && analyzedData.hashtags.length > 0 ? (
            analyzedData.hashtags.map((tag: string, i: number) => (
              <span
                key={i}
                className="bg-zinc-950/60 border border-zinc-800 px-2 py-0.5 rounded text-[9.5px] text-zinc-300 font-mono font-bold hover:border-orange-500/30 hover:text-orange-400 transition-colors cursor-default"
              >
                {tag}
              </span>
            ))
          ) : (
            <div className="text-zinc-750 text-[10px] italic font-mono font-bold px-1.5 uppercase leading-none">
              Aún no indexados
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
