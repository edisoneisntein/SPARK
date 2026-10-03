import { Layers, Sparkles, Brain, Cpu } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export function ModelSelector({ selectedModel, setSelectedModel }: ModelSelectorProps) {
  const models = [
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      badge: 'Predeterminado',
      desc: 'Máximo rendimiento y ganchos de alta fidelidad',
      icon: Cpu,
      color: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Lite',
      badge: 'Veloz',
      desc: 'Extremadamente ágil, óptimo para flujos rápidos',
      icon: Sparkles,
      color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
    },
    {
      id: 'gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro',
      badge: 'Complejo',
      desc: 'Precisión profunda para analizar microtonos gesticulares',
      icon: Brain,
      color: 'text-violet-400 border-violet-500/20 bg-violet-500/5',
    },
  ];

  return (
    <div className="flex flex-col gap-2 bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl">
      <div className="flex items-center gap-1.5 px-1 py-0.5">
        <Layers className="w-3.5 h-3.5 text-orange-500 shrink-0" />
        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none">
          Motor de Inteligencia de Contenido
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {models.map((m) => {
          const IconComponent = m.icon;
          const isSelected = selectedModel === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedModel(m.id)}
              className={`flex flex-col text-left p-2 rounded-lg border transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-orange-500/80 bg-orange-950/20 ring-1 ring-orange-500/30'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/80'
              }`}
            >
              <div className="flex justify-between items-center w-full mb-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-400' : 'text-zinc-400'}`} />
                  <span>{m.name}</span>
                </div>
                <span
                  className={`text-[8px] font-black uppercase font-mono px-1.5 py-0.2 rounded border leading-none ${
                    isSelected ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {m.badge}
                </span>
              </div>
              <p className="text-[9.5px] text-zinc-450 leading-snug font-medium line-clamp-1">{m.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
