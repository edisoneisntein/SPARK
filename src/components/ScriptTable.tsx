import { useState } from 'react';
import { Copy, Check, Users, Shirt, Backpack, Radio, Eye } from 'lucide-react';
import { ScriptRow } from '../types';

interface ScriptTableProps {
  originalScript: ScriptRow[] | undefined;
  clonedScript: ScriptRow[] | undefined;
  isGenerating: boolean;
  onSelectTopic: (topic: string) => void;
  hasAnalyzedData: boolean;
  selectedRowIndex?: number;
  selectedRowType?: 'original' | 'cloned';
  onSelectRow?: (index: number, type: 'original' | 'cloned') => void;
}

export function ScriptTable({
  originalScript,
  clonedScript,
  isGenerating,
  onSelectTopic,
  hasAnalyzedData,
  selectedRowIndex,
  selectedRowType,
  onSelectRow,
}: ScriptTableProps) {
  const [copiedCell, setCopiedCell] = useState<string>('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(id);
    setTimeout(() => setCopiedCell(''), 1500);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-grow">
      {/* LEFT COLUMN: Original Script Deconstruction */}
      <div className="flex flex-col bg-zinc-900/30 rounded-xl border border-zinc-805 overflow-hidden shadow-xl min-h-[350px]">
        <div className="bg-zinc-950/40 px-3 py-2.5 border-b border-zinc-850 text-[10px] font-black text-zinc-400 uppercase tracking-widest flex justify-between items-center shrink-0">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-zinc-500" />
            Transcripción y Deconstrucción Original
          </span>
          {originalScript && (
            <span className="text-zinc-550 text-[9px] font-mono font-bold uppercase">
              {originalScript.length} Segmentos Detectados
            </span>
          )}
        </div>
        <div className="p-1.5 flex-grow overflow-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-zinc-800/40">
              {originalScript && originalScript.length > 0 ? (
                originalScript.map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onSelectRow && onSelectRow(idx, 'original')}
                    className={`hover:bg-zinc-950/20 transition-colors group cursor-pointer border-l-4 ${
                      selectedRowIndex === idx && selectedRowType === 'original'
                        ? 'bg-orange-500/10 border-orange-500 hover:bg-orange-500/15'
                        : 'border-transparent'
                    }`}
                  >
                    <td className="p-3 font-mono text-zinc-500 w-12 align-top text-[10px] font-bold">
                      {row.time}
                    </td>
                    <td className="p-3 align-top">
                      {/* Visual instructions section */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-zinc-550 text-[9px] uppercase font-black tracking-wider font-mono">
                            Visual y Edición original:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(row.visual, `orig_v_${idx}`)}
                            className="opacity-0 group-hover:opacity-100 text-[8px] font-extrabold text-zinc-400 hover:text-orange-500 font-mono transition-opacity uppercase px-1.5 py-0.5 bg-zinc-800 rounded"
                          >
                            {copiedCell === `orig_v_${idx}` ? <Check className="w-2.5 h-2.5 inline" /> : 'Copiar'}
                          </button>
                        </div>
                        <p className="text-zinc-300 leading-relaxed text-[11px] font-medium whitespace-pre-line">
                          {row.visual}
                        </p>
                      </div>

                      {/* Speaking track section */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-zinc-550 text-[9px] uppercase font-black tracking-wider font-mono">
                            Locución Exacta (Audio original):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(row.audio, `orig_a_${idx}`)}
                            className="opacity-0 group-hover:opacity-100 text-[8px] font-extrabold text-zinc-400 hover:text-orange-500 font-mono transition-opacity uppercase px-1.5 py-0.5 bg-zinc-800 rounded"
                          >
                            {copiedCell === `orig_a_${idx}` ? <Check className="w-2.5 h-2.5 inline" /> : 'Copiar'}
                          </button>
                        </div>
                        <p className="text-white italic leading-relaxed text-[11.5px] bg-zinc-950/50 px-2.5 py-1.5 rounded border border-zinc-800">
                          "{row.audio}"
                        </p>
                      </div>

                      {/* Acoustics and optical details inside original scripts */}
                      {(row.acoustics || row.vfx) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 bg-zinc-950/20 p-2 rounded border border-zinc-850">
                          {row.acoustics && (
                            <div>
                              <span className="text-[8px] uppercase font-bold tracking-wider text-cyan-400 font-mono block mb-0.5">
                                Atmosfera y Foley Original
                              </span>
                              <p className="text-[10px] text-zinc-450 leading-snug">{row.acoustics}</p>
                            </div>
                          )}
                          {row.vfx && (
                            <div className="border-t sm:border-t-0 sm:border-l border-zinc-800/60 pt-1.5 sm:pt-0 sm:pl-2">
                              <span className="text-[8px] uppercase font-bold tracking-wider text-amber-500 font-mono block mb-0.5">
                                Iluminación & Óptica
                              </span>
                              <p className="text-[10px] text-zinc-450 leading-snug">{row.vfx}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cast, wardrobe and props section for original script */}
                      {(row.charactersDetail || row.wardrobe || row.propsAndEnvironment || row.charactersCount !== undefined) && (
                        <div className="mt-2.5 bg-zinc-950/30 rounded border border-zinc-800/60 p-2 space-y-1.5">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-[8.5px] uppercase font-bold tracking-wider text-pink-500 font-mono px-1.5 py-0.2 bg-pink-950/25 rounded border border-pink-900/30">
                              👥 Elenco: {row.charactersCount !== undefined ? row.charactersCount : 1} {row.charactersCount === 1 ? 'Persona/Animal' : 'Personas/Animales'}
                            </span>
                            {row.wardrobe && (
                              <span className="text-[8.5px] uppercase font-bold tracking-wider text-emerald-400 font-mono px-1.5 py-0.2 bg-emerald-950/25 rounded border border-emerald-900/30">
                                👕 Vestuario
                              </span>
                            )}
                            {row.propsAndEnvironment && (
                              <span className="text-[8.5px] uppercase font-bold tracking-wider text-violet-400 font-mono px-1.5 py-0.2 bg-violet-950/25 rounded border border-violet-900/30">
                                🎒 Atrezzo
                              </span>
                            )}
                          </div>
                          {row.charactersDetail && (
                            <div className="text-[10.5px] text-zinc-400 leading-normal">
                              <strong className="text-pink-400 font-bold font-mono text-[8px] block uppercase">Rasgos & Caras:</strong>
                              {row.charactersDetail}
                            </div>
                          )}
                          {row.wardrobe && (
                            <div className="text-[10.5px] text-zinc-400 leading-normal">
                              <strong className="text-emerald-400 font-bold font-mono text-[8px] block uppercase">Indumentaria:</strong>
                              {row.wardrobe}
                            </div>
                          )}
                          {row.propsAndEnvironment && (
                            <div className="text-[10.5px] text-zinc-400 leading-normal">
                              <strong className="text-violet-400 font-bold font-mono text-[8px] block uppercase">Muebles, Entorno & Atrezzo:</strong>
                              {row.propsAndEnvironment}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-8 text-center text-zinc-500 italic text-[11px] uppercase tracking-wide leading-relaxed font-sans">
                    Sube un video viral de referencia a la izquierda para deconstruir y transcribir el guion original automáticamente...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT COLUMN: New Cloned Script */}
      <div className="flex flex-col bg-zinc-900/30 rounded-xl border border-zinc-805 overflow-hidden shadow-xl min-h-[350px]">
        <div className="bg-orange-950/10 px-3 py-2.5 border-b border-zinc-850 text-[10px] font-black text-orange-400 uppercase tracking-widest flex justify-between items-center shrink-0">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-orange-500" />
            Guion Clónico Generado (Nuevo Tema)
          </span>
          {clonedScript && (
            <span className="text-orange-500 animate-pulse text-[9px] font-mono font-black border border-orange-500/20 px-1.5 py-0.2 bg-orange-500/5 rounded">
              LISTO PARA GRABAR
            </span>
          )}
        </div>
        <div className="p-1.5 flex-grow overflow-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-zinc-800/40">
              {clonedScript && clonedScript.length > 0 ? (
                clonedScript.map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onSelectRow && onSelectRow(idx, 'cloned')}
                    className={`hover:bg-zinc-950/20 transition-colors group cursor-pointer border-l-4 ${
                      selectedRowIndex === idx && selectedRowType === 'cloned'
                        ? 'bg-orange-500/10 border-orange-500 hover:bg-orange-500/15'
                        : 'border-transparent'
                    }`}
                  >
                    <td className="p-3 font-mono text-orange-500 w-12 align-top text-[10px] font-bold">
                      {row.time}
                    </td>
                    <td className="p-3 align-top">
                      {/* Cloned Visual section */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-zinc-550 text-[9px] uppercase font-black tracking-wider font-mono">
                            Visual y Edición Adaptada:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(row.visual, `clon_v_${idx}`)}
                            className="opacity-0 group-hover:opacity-100 text-[8px] font-extrabold text-zinc-400 hover:text-orange-500 font-mono transition-opacity uppercase px-1.5 py-0.5 bg-zinc-800 rounded"
                          >
                            {copiedCell === `clon_v_${idx}` ? <Check className="w-2.5 h-2.5 inline" /> : 'Copiar'}
                          </button>
                        </div>
                        <div
                          className="text-zinc-300 leading-relaxed text-[11px] font-medium whitespace-pre-line"
                          dangerouslySetInnerHTML={{
                            __html: row.visual.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-orange-400">$1</span>'),
                          }}
                        />
                      </div>

                      {/* Cloned audio section */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-orange-500 text-[9px] uppercase font-black tracking-wider font-mono">
                            Locución Clónica (Di esto):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(row.audio, `clon_a_${idx}`)}
                            className="opacity-0 group-hover:opacity-100 text-[8px] font-extrabold text-zinc-400 hover:text-orange-500 font-mono transition-opacity uppercase px-1.5 py-0.5 bg-zinc-800 rounded"
                          >
                            {copiedCell === `clon_a_${idx}` ? <Check className="w-2.5 h-2.5 inline" /> : 'Copiar'}
                          </button>
                        </div>
                        <p className="text-white font-bold leading-relaxed text-[12px] bg-orange-950/15 p-2.5 rounded border border-orange-500/20 italic">
                          "{row.audio}"
                        </p>
                      </div>

                      {/* Segment-level acoustics and optical specs */}
                      {(row.acoustics || row.vfx) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 bg-zinc-950/30 p-2 rounded border border-zinc-850">
                          {row.acoustics && (
                            <div>
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[8px] uppercase font-bold tracking-wider text-cyan-400 font-mono">
                                  🔊 Acústica Adaptada
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(row.acoustics || '', `clon_ac_${idx}`)}
                                  className="opacity-0 group-hover:opacity-100 text-[7px] text-zinc-500 hover:text-cyan-400 font-mono transition-opacity uppercase"
                                >
                                  {copiedCell === `clon_ac_${idx}` ? 'Listo!' : 'Copiar'}
                                </button>
                              </div>
                              <p className="text-[10px] text-zinc-400 font-mono leading-tight">{row.acoustics}</p>
                            </div>
                          )}
                          {row.vfx && (
                            <div className="border-t sm:border-t-0 sm:border-l border-zinc-800/60 pt-1.5 sm:pt-0 sm:pl-2">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[8px] uppercase font-bold tracking-wider text-amber-500 font-mono">
                                  🎬 Óptica / VFX Clon
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(row.vfx || '', `clon_vfx_${idx}`)}
                                  className="opacity-0 group-hover:opacity-100 text-[7px] text-zinc-500 hover:text-amber-500 font-mono transition-opacity uppercase"
                                >
                                  {copiedCell === `clon_vfx_${idx}` ? 'Listo!' : 'Copiar'}
                                </button>
                              </div>
                              <p className="text-[10px] text-zinc-400 font-mono leading-tight">{row.vfx}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Character/Wardrobe/Props Adapted section */}
                      {(row.charactersDetail || row.wardrobe || row.propsAndEnvironment || row.charactersCount !== undefined) && (
                        <div className="mt-3 bg-zinc-900/40 rounded border border-zinc-805 p-2.5 space-y-2">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-[8.5px] uppercase font-bold tracking-wider text-pink-500 font-mono px-1.5 py-0.2 bg-pink-950/20 rounded border border-pink-900/30">
                              👥 Elenco Adaptado: {row.charactersCount !== undefined ? row.charactersCount : 1} {row.charactersCount === 1 ? 'Personaje' : 'Personajes'}
                            </span>
                            {row.wardrobe && (
                              <span className="text-[8.5px] uppercase font-bold tracking-wider text-emerald-400 font-mono px-1.5 py-0.2 bg-emerald-950/20 rounded border border-emerald-900/30">
                                👕 Vestuario Adaptado
                              </span>
                            )}
                            {row.propsAndEnvironment && (
                              <span className="text-[8.5px] uppercase font-bold tracking-wider text-violet-400 font-mono px-1.5 py-0.2 bg-violet-950/20 rounded border border-violet-900/30">
                                🎒 Atrezzo Clon
                              </span>
                            )}
                          </div>
                          {row.charactersDetail && (
                            <div className="text-[10.5px] text-zinc-400 leading-snug">
                              <strong className="text-pink-400 font-semibold font-mono text-[8px] block uppercase mb-0.5">Identificación y Rasgos Adaptados:</strong>
                              <p className="leading-snug text-zinc-300">{row.charactersDetail}</p>
                            </div>
                          )}
                          {row.wardrobe && (
                            <div className="text-[10.5px] text-zinc-400 leading-snug">
                              <strong className="text-emerald-400 font-semibold font-mono text-[8px] block uppercase mb-0.5">Indumentaria / Outfit Clon:</strong>
                              <p className="leading-snug text-zinc-300">{row.wardrobe}</p>
                            </div>
                          )}
                          {row.propsAndEnvironment && (
                            <div className="text-[10.5px] text-zinc-400 leading-snug">
                              <strong className="text-violet-400 font-semibold font-mono text-[8px] block uppercase mb-0.5">Fondo y Objetos Activos Clon:</strong>
                              <p className="leading-snug text-zinc-300">{row.propsAndEnvironment}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-8 text-center text-zinc-550 italic text-[11px] leading-relaxed uppercase">
                    {isGenerating ? (
                      <span className="text-orange-500 font-extrabold animate-pulse tracking-wide block">
                        Cincelando el nuevo guión con adaptación de tiempos y transiciones foley...
                      </span>
                    ) : hasAnalyzedData ? (
                      <span className="text-orange-400/80 font-black animate-pulse block">
                        🔴 HAGA CLICK en cualquiera de las 3 propuestas del panel derecho "Sugerencias Virales" para clónar la estructura de inmediato!
                      </span>
                    ) : (
                      "Los nuevos diálogos técnicos adaptados para redes aparecerán aquí..."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
