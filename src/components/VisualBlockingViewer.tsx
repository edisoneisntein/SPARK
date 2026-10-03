import React, { useState, useEffect, useRef } from 'react';
import { Camera, User, Lightbulb, RotateCw, SlidersHorizontal, RefreshCw, Layers, ZoomIn } from 'lucide-react';
import { ScriptRow, SpatialElement } from '../types';

interface VisualBlockingViewerProps {
  selectedRow: ScriptRow | null;
  selectedRowIndex: number;
  rowType: 'original' | 'cloned';
}

export function VisualBlockingViewer({ selectedRow, selectedRowIndex, rowType }: VisualBlockingViewerProps) {
  const [elements, setElements] = useState<SpatialElement[]>([]);
  const [selectedLens, setSelectedLens] = useState<string>('35mm esférico');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Auto-generate starting layout using natural heuristics from the script text!
  const generateLayoutFromText = (row: ScriptRow): SpatialElement[] => {
    const list: SpatialElement[] = [];
    const textVFX = (row.vfx || '').toLowerCase();
    const textVisual = (row.visual || '').toLowerCase();
    const charsDetail = (row.charactersDetail || '').toLowerCase();
    const charsCount = row.charactersCount || 1;

    // Determine camera type and lens based on VFX & Visual
    let camDistance = 75; // Y position of camera (higher is bottom)
    let camX = 50;
    let camAngle = 270; // pointing up
    let fovAngle = 55;

    if (textVisual.includes('primerísimo') || textVisual.includes('ppp') || textVisual.includes('extreme close')) {
      camDistance = 45; // very close to center
      fovAngle = 25;
    } else if (textVisual.includes('primer plano') || textVisual.includes('pp') || textVisual.includes('close-up')) {
      camDistance = 55;
      fovAngle = 35;
    } else if (textVisual.includes('plano medio') || textVisual.includes('pm') || textVisual.includes('medium shot')) {
      camDistance = 68;
      fovAngle = 50;
    } else if (textVisual.includes('plano general') || textVisual.includes('pg') || textVisual.includes('long shot')) {
      camDistance = 88;
      fovAngle = 75;
    }

    if (textVisual.includes('escorzo') || textVisual.includes('ots') || textVisual.includes('over the shoulder')) {
      camX = 35;
      camAngle = 315; // pointing diagonally
    }

    // Camera element
    list.push({
      id: 'camera',
      name: 'Cámara Principal',
      type: 'camera',
      x: camX,
      y: camDistance,
      angle: camAngle,
      fov: fovAngle,
    });

    // Detect actor names/characters
    const characters: string[] = [];
    if (charsDetail) {
      // Split on commas or common connectors
      const rawNames = charsDetail.split(/[,y]/);
      rawNames.forEach(n => {
        const trimmed = n.replace(/con\s+.*|de\s+.*|de\s+edad.*/, '').replace(/[.():]/g, '').trim();
        if (trimmed && trimmed.length > 2 && characters.length < charsCount) {
          characters.push(trimmed.substring(0, 20));
        }
      });
    }

    // Fallback if detail lacks explicit names
    while (characters.length < charsCount) {
      characters.push(`Actor ${characters.length + 1}`);
    }

    // Distribute actors geometrically
    characters.forEach((name, idx) => {
      let actX = 50;
      let actY = 30;
      let gaze = 90; // pointing down towards camera

      if (charsCount === 2) {
        actX = idx === 0 ? 38 : 62;
        gaze = idx === 0 ? 45 : 135; // slightly facing each other
      } else if (charsCount > 2) {
        // semicircle
        const angleStep = 120 / (charsCount - 1);
        const startAngle = 30;
        const currentAngle = startAngle + (idx * angleStep);
        const rad = (currentAngle * Math.PI) / 180;
        actX = 50 + Math.cos(rad) * 20;
        actY = 30 - Math.sin(rad) * 12;
        gaze = 270; // facing front/camera
      }

      list.push({
        id: `actor-${idx}`,
        name: name,
        type: 'actor',
        x: actX,
        y: actY,
        gazeAngle: gaze,
      });
    });

    // Parse Lighting Setup
    let lightColor = '#ffbb66'; // warm tungsten default
    if (textVFX.includes('5600k') || textVFX.includes('fría') || textVFX.includes('daylight') || textVFX.includes('frío')) {
      lightColor = '#88ddff'; // cool daylight LED
    } else if (textVFX.includes('neon') || textVFX.includes('rgb') || textVFX.includes('color')) {
      lightColor = '#ff00aa'; // creative magenta/neon
    }

    // Key Light (usually diagonal front)
    list.push({
      id: 'light_key',
      name: 'Luz Principal (Key)',
      type: 'light_key',
      x: 22,
      y: 50,
      angle: 45, // pointing towards center
      intensity: 85,
      color: lightColor,
    });

    // Fill Light (opposite side, soft)
    list.push({
      id: 'light_fill',
      name: 'Luz Relleno (Fill)',
      type: 'light_fill',
      x: 78,
      y: 55,
      angle: 135,
      intensity: 35,
      color: '#e2f0ff',
    });

    // Backlight / Rim Light (contra-recorte, from behind actors)
    let rimX = 50;
    let rimY = 10;
    let rimAngle = 270; // pointing down at actors
    if (textVFX.includes('contra-recorte') || textVFX.includes('backlight') || textVFX.includes('recorte')) {
      rimX = 45;
      rimY = 8;
      rimAngle = 270;
    }

    list.push({
      id: 'light_back',
      name: 'Contra-Recorte (Backlight)',
      type: 'light_back',
      x: rimX,
      y: rimY,
      angle: rimAngle,
      intensity: 75,
      color: '#ffffff',
    });

    // If background light is mentioned
    if (textVFX.includes('fondo') || textVFX.includes('background light')) {
      list.push({
        id: 'light_bg',
        name: 'Luz de Fondo (BG Light)',
        type: 'light_bg',
        x: 82,
        y: 15,
        angle: 180,
        intensity: 50,
        color: '#ff3300',
      });
    }

    return list;
  };

  // Re-generate layout when the selected row changes
  useEffect(() => {
    if (selectedRow) {
      const parsedElements = generateLayoutFromText(selectedRow);
      setElements(parsedElements);
      setSelectedElementId('camera'); // select camera by default
    } else {
      setElements([]);
      setSelectedElementId(null);
    }
  }, [selectedRowIndex, rowType]);

  // Handle drag mechanics on standard Cartesian coordinate map (0-100)
  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedElementId(id);
    setDraggedElementId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedElementId || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    // Convert client coordinates to percentage (0 to 100)
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain inside grid limits
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));

    setElements(prev =>
      prev.map(el => (el.id === draggedElementId ? { ...el, x: Math.round(x), y: Math.round(y) } : el))
    );
  };

  const handleMouseUp = () => {
    setDraggedElementId(null);
  };

  // Update selected element property
  const updateSelectedProperty = (property: 'angle' | 'intensity' | 'color' | 'fov' | 'gazeAngle', value: any) => {
    if (!selectedElementId) return;
    setElements(prev =>
      prev.map(el => {
        if (el.id === selectedElementId) {
          return { ...el, [property]: value };
        }
        return el;
      })
    );
  };

  const getSelectedElement = () => elements.find(el => el.id === selectedElementId) || null;

  const resetToHeuristic = () => {
    if (selectedRow) {
      setElements(generateLayoutFromText(selectedRow));
      setSelectedElementId('camera');
    }
  };

  const selectedElement = getSelectedElement();

  // Helper to draw camera FOV wedge
  const renderCameraFOV = (el: SpatialElement) => {
    const fov = el.fov || 50;
    const angle = el.angle !== undefined ? el.angle : 270;
    const radCenter = (angle * Math.PI) / 180;
    const radLeft = ((angle - fov / 2) * Math.PI) / 180;
    const radRight = ((angle + fov / 2) * Math.PI) / 180;

    const length = 28; // visual beam length
    const xEndLeft = el.x + Math.cos(radLeft) * length;
    const yEndLeft = el.y + Math.sin(radLeft) * length;
    const xEndRight = el.x + Math.cos(radRight) * length;
    const yEndRight = el.y + Math.sin(radRight) * length;

    return (
      <path
        d={`M ${el.x} ${el.y} L ${xEndLeft} ${yEndLeft} A ${length} ${length} 0 0 1 ${xEndRight} ${yEndRight} Z`}
        fill="rgba(249, 115, 22, 0.08)"
        stroke="rgba(249, 115, 22, 0.45)"
        strokeWidth="1.5"
        strokeDasharray="2,2"
        className="pointer-events-none"
      />
    );
  };

  // Helper to draw light beam cone
  const renderLightBeam = (el: SpatialElement) => {
    const intensity = el.intensity || 50;
    const angle = el.angle !== undefined ? el.angle : 0;
    const radLeft = ((angle - 30) * Math.PI) / 180;
    const radRight = ((angle + 30) * Math.PI) / 180;

    const length = 25 + (intensity / 100) * 15;
    const xEndLeft = el.x + Math.cos(radLeft) * length;
    const yEndLeft = el.y + Math.sin(radLeft) * length;
    const xEndRight = el.x + Math.cos(radRight) * length;
    const yEndRight = el.y + Math.sin(radRight) * length;

    const beamColor = el.color || '#ff9000';

    return (
      <path
        d={`M ${el.x} ${el.y} L ${xEndLeft} ${yEndLeft} A ${length} ${length} 0 0 1 ${xEndRight} ${yEndRight} Z`}
        fill={`radial-gradient(circle, ${beamColor}22 0%, transparent 80%)`}
        style={{ fill: beamColor, opacity: 0.12 }}
        className="pointer-events-none"
      />
    );
  };

  // Lens preset configurations
  const lensPresets = [
    { name: '18mm Ultra Gran Angular', angle: 88, desc: 'Ideal para paisajes amplios o tensión física de cerca.' },
    { name: '35mm Esférico Estándar', angle: 58, desc: 'Encuadre cinematográfico clásico de documental y reportaje.' },
    { name: '50mm Esférico Retrato', angle: 40, desc: 'Lente estándar de paridad facial, libre de distorsiones.' },
    { name: '85mm Anamórfico', angle: 28, desc: 'Compresión de fondo exquisita, flares azules y bokeh elíptico.' },
    { name: '135mm Teleobjetivo', angle: 18, desc: 'Aislamiento dramático extremo del rostro del actor.' }
  ];

  const handleLensChange = (lensName: string) => {
    setSelectedLens(lensName);
    const preset = lensPresets.find(p => p.name === lensName);
    if (preset && selectedElementId === 'camera') {
      updateSelectedProperty('fov', preset.angle);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
      {/* Header Panel */}
      <div className="bg-zinc-950/40 border-b border-zinc-800 px-4 py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-500 animate-pulse" />
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">
              Planificación Espacial & Visual Blocking
            </h3>
            <span className="text-[9.5px] text-zinc-500 font-mono uppercase">
              Set de Rodaje virtual interactivo para la escena [Beat #{selectedRowIndex + 1} - {selectedRow?.time || '00:00'}]
            </span>
          </div>
        </div>
        
        {selectedRow && (
          <button
            onClick={resetToHeuristic}
            className="self-start sm:self-auto text-[9.5px] bg-zinc-800/80 border border-zinc-700 text-zinc-400 hover:text-white px-2.5 py-1 rounded font-mono uppercase flex items-center gap-1.5 transition-colors"
            title="Restablecer posiciones deducidas por la IA"
          >
            <RefreshCw className="w-3 h-3" /> Auto-Ajustar ADN
          </button>
        )}
      </div>

      {!selectedRow ? (
        <div className="p-12 text-center text-zinc-500 italic text-[11px] uppercase tracking-wider leading-relaxed">
          No hay ninguna escena seleccionada. Haga click en un intervalo de tiempo del guion de arriba para proyectar su plano espacial de rodaje interactivo...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* Interactive SVG Set Area */}
          <div className="lg:col-span-8 p-4 bg-zinc-950/40 flex justify-center items-center border-b lg:border-b-0 lg:border-r border-zinc-800 relative">
            
            {/* Visual Studio Indicators */}
            <div className="absolute top-2 left-3 text-[8.5px] text-zinc-600 font-mono tracking-widest uppercase pointer-events-none select-none">
              [PUESTA EN ESCENA: CORTE {selectedRowIndex + 1}]
            </div>
            <div className="absolute top-2 right-3 text-[8.5px] text-orange-500/70 font-mono tracking-widest uppercase pointer-events-none select-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> VIRTUAL STUDIO GRID (10m x 10m)
            </div>

            {/* Core Blueprint Canvas */}
            <div className="w-full max-w-[420px] aspect-square bg-[#0c0c10] border border-zinc-800/80 rounded-xl relative overflow-hidden shadow-inner">
              
              {/* Radial HUD lines for technical look */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-20">
                <div className="w-3/4 aspect-square rounded-full border border-zinc-700 border-dashed" />
                <div className="absolute w-1/2 aspect-square rounded-full border border-zinc-700 border-dashed" />
                <div className="absolute w-1/4 aspect-square rounded-full border border-zinc-700 border-dashed" />
                {/* Horizontal & Vertical Crosshair */}
                <div className="absolute w-full h-[1px] bg-zinc-800" />
                <div className="absolute h-full w-[1px] bg-zinc-800" />
              </div>

              {/* Set Bounds indicators */}
              <div className="absolute bottom-2 left-2 text-[8px] text-zinc-700 font-mono">[X-COORD]</div>
              <div className="absolute top-2 left-2 text-[8px] text-zinc-700 font-mono">[Y-COORD]</div>

              <svg
                ref={svgRef}
                viewBox="0 0 100 100"
                className="w-full h-full relative z-10 select-none cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Render Light Beams background */}
                {elements
                  .filter(el => el.type.startsWith('light_'))
                  .map(el => (
                    <g key={`beam-${el.id}`}>{renderLightBeam(el)}</g>
                  ))}

                {/* Render Camera FOV background */}
                {elements
                  .filter(el => el.type === 'camera')
                  .map(el => (
                    <g key={`fov-${el.id}`}>{renderCameraFOV(el)}</g>
                  ))}

                {/* Draw connection lines or sound vectors for visual feedback */}
                {elements
                  .filter(el => el.type === 'actor')
                  .map(actor => {
                    const cam = elements.find(c => c.type === 'camera');
                    if (!cam) return null;
                    return (
                      <line
                        key={`line-${actor.id}`}
                        x1={cam.x}
                        y1={cam.y}
                        x2={actor.x}
                        y2={actor.y}
                        stroke="rgba(249, 115, 22, 0.15)"
                        strokeWidth="0.5"
                        strokeDasharray="1,2"
                        className="pointer-events-none"
                      />
                    );
                  })}

                {/* Draw Elements */}
                {elements.map(el => {
                  const isSel = el.id === selectedElementId;
                  
                  // Decide Icon Colors
                  let iconColor = '#a1a1aa'; // default zinc
                  let symbol = '●';
                  if (el.type === 'camera') iconColor = '#f97316'; // orange
                  else if (el.type === 'actor') iconColor = '#ec4899'; // pink
                  else if (el.type.startsWith('light_')) iconColor = el.color || '#eab308'; // yellow or custom

                  return (
                    <g
                      key={el.id}
                      transform={`translate(${el.x}, ${el.y})`}
                      className="cursor-pointer group"
                      onMouseDown={(e) => handleMouseDown(el.id, e)}
                    >
                      {/* Selection Ring */}
                      {isSel && (
                        <circle
                          r="6.5"
                          fill="transparent"
                          stroke={el.type === 'camera' ? '#f97316' : el.type === 'actor' ? '#ec4899' : '#eab308'}
                          strokeWidth="0.8"
                          strokeDasharray="2,1"
                          className="animate-spin"
                          style={{ transformOrigin: 'center', animationDuration: '8s' }}
                        />
                      )}
                      
                      {/* Active Element Ring */}
                      <circle
                        r="5.2"
                        fill="rgba(12, 12, 16, 0.95)"
                        stroke={isSel ? iconColor : 'rgba(255,255,255,0.1)'}
                        strokeWidth="0.85"
                        className="transition-all hover:stroke-zinc-300"
                      />

                      {/* Direction Pointer / Gaze indicator */}
                      {el.type === 'camera' && (
                        <line
                          x1="0"
                          y1="0"
                          x2={Math.cos(((el.angle || 270) * Math.PI) / 180) * 8}
                          y2={Math.sin(((el.angle || 270) * Math.PI) / 180) * 8}
                          stroke="#f97316"
                          strokeWidth="1.2"
                        />
                      )}

                      {el.type === 'actor' && (
                        <line
                          x1="0"
                          y1="0"
                          x2={Math.cos(((el.gazeAngle || 90) * Math.PI) / 180) * 8}
                          y2={Math.sin(((el.gazeAngle || 90) * Math.PI) / 180) * 8}
                          stroke="#ec4899"
                          strokeWidth="1.2"
                        />
                      )}

                      {el.type.startsWith('light_') && (
                        <line
                          x1="0"
                          y1="0"
                          x2={Math.cos(((el.angle || 0) * Math.PI) / 180) * 8}
                          y2={Math.sin(((el.angle || 0) * Math.PI) / 180) * 8}
                          stroke={el.color || '#eab308'}
                          strokeWidth="1.2"
                        />
                      )}

                      {/* Node Icon inside center */}
                      <g transform="translate(-2.5, -2.5) scale(0.35)">
                        {el.type === 'camera' ? (
                          <path
                            d="M23 7l-7 5 7 5V7zm-9 11V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z"
                            fill={iconColor}
                          />
                        ) : el.type === 'actor' ? (
                          <path
                            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                            fill={iconColor}
                          />
                        ) : (
                          <path
                            d="M15 17h-6M12 2v2M4.9 4.9l1.4 1.4M19.1 4.9l-1.4 1.4M12 18a6 6 0 0 0 6-6c0-1.66-1.34-3-3-3H9c-1.66 0-3 1.34-3 3a6 6 0 0 0 6 6z"
                            fill={iconColor}
                          />
                        )}
                      </g>

                      {/* Interactive Label on hover/select */}
                      <text
                        x="0"
                        y="8.5"
                        fill={isSel ? '#ffffff' : '#a1a1aa'}
                        fontSize="3"
                        fontWeight={isSel ? 'bold' : 'normal'}
                        textAnchor="middle"
                        className="font-mono pointer-events-none bg-black/60 px-1 py-0.2 select-none"
                      >
                        {el.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Configuration and Control Sliders Panel */}
          <div className="lg:col-span-4 p-4 flex flex-col gap-4 text-xs">
            
            {/* Elements Selector chips */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono font-black tracking-wider block mb-2">
                Objetos Activos en Escena:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {elements.map(el => {
                  const isSel = el.id === selectedElementId;
                  return (
                    <button
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`px-2 py-1 rounded font-mono text-[9.5px] uppercase font-bold flex items-center gap-1.5 border transition-all ${
                        isSel
                          ? 'bg-zinc-800 text-white border-orange-500/50 shadow-md shadow-orange-500/5'
                          : 'bg-zinc-950/40 text-zinc-500 border-zinc-850 hover:text-zinc-300'
                      }`}
                    >
                      {el.type === 'camera' && <Camera className="w-3 h-3 text-orange-500" />}
                      {el.type === 'actor' && <User className="w-3 h-3 text-pink-500" />}
                      {el.type.startsWith('light_') && <Lightbulb className="w-3 h-3 text-yellow-500" />}
                      {el.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Element Controls */}
            {selectedElement ? (
              <div className="bg-zinc-950/40 border border-zinc-850 p-3.5 rounded-lg space-y-3.5">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-1.5">
                  <span className="font-black text-orange-400 font-mono text-[10px] uppercase flex items-center gap-1">
                    {selectedElement.type === 'camera' && <Camera className="w-3.5 h-3.5" />}
                    {selectedElement.type === 'actor' && <User className="w-3.5 h-3.5 text-pink-500" />}
                    {selectedElement.type.startsWith('light_') && <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />}
                    Ajustar: {selectedElement.name}
                  </span>
                  <span className="text-[8.5px] font-mono text-zinc-500 font-bold uppercase bg-zinc-900 px-1.5 py-0.2 border border-zinc-800 rounded">
                    X: {selectedElement.x}m | Y: {selectedElement.y}m
                  </span>
                </div>

                {/* 1. Camera specific Controls */}
                {selectedElement.type === 'camera' && (
                  <div className="space-y-3.5">
                    
                    {/* Lens Selector Dropdown */}
                    <div>
                      <label className="text-[9.5px] text-zinc-500 uppercase font-mono font-bold tracking-wider mb-1.5 block">
                        Óptica y Distancia Focal (Lente):
                      </label>
                      <select
                        value={selectedLens}
                        onChange={(e) => handleLensChange(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 font-mono text-[10px] text-zinc-200 focus:outline-none focus:border-orange-500/50"
                      >
                        {lensPresets.map(preset => (
                          <option key={preset.name} value={preset.name}>
                            {preset.name} ({preset.angle}°)
                          </option>
                        ))}
                      </select>
                      <p className="text-[9px] text-zinc-550 italic mt-1 font-semibold">
                        {lensPresets.find(p => p.name === selectedLens)?.desc}
                      </p>
                    </div>

                    {/* Camera Angle Rotation */}
                    <div>
                      <div className="flex justify-between text-[9.5px] uppercase font-mono font-bold text-zinc-500 mb-1">
                        <span>Ángulo de Giro (Pan):</span>
                        <span className="text-zinc-300 font-bold">{selectedElement.angle || 270}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={selectedElement.angle || 270}
                          onChange={(e) => updateSelectedProperty('angle', parseInt(e.target.value))}
                          className="flex-1 accent-orange-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                        <button
                          onClick={() => updateSelectedProperty('angle', 270)}
                          className="p-1 bg-zinc-900 hover:bg-zinc-850 rounded border border-zinc-800 text-zinc-400 hover:text-white"
                          title="Apuntar al frente (270°)"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Field of view slider */}
                    <div>
                      <div className="flex justify-between text-[9.5px] uppercase font-mono font-bold text-zinc-500 mb-1">
                        <span>Apertura de Cono (FOV):</span>
                        <span className="text-zinc-300 font-bold">{selectedElement.fov || 55}°</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={selectedElement.fov || 55}
                        onChange={(e) => updateSelectedProperty('fov', parseInt(e.target.value))}
                        className="w-full accent-orange-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Actor specific Controls */}
                {selectedElement.type === 'actor' && (
                  <div className="space-y-3.5">
                    {/* Gaze Orientation Angle */}
                    <div>
                      <div className="flex justify-between text-[9.5px] uppercase font-mono font-bold text-zinc-500 mb-1">
                        <span>Dirección de Mirada:</span>
                        <span className="text-zinc-300 font-bold text-pink-400">{selectedElement.gazeAngle || 90}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={selectedElement.gazeAngle || 90}
                          onChange={(e) => updateSelectedProperty('gazeAngle', parseInt(e.target.value))}
                          className="flex-1 accent-pink-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                        <button
                          onClick={() => updateSelectedProperty('gazeAngle', 90)}
                          className="p-1 bg-zinc-900 hover:bg-zinc-850 rounded border border-zinc-800 text-zinc-400 hover:text-white"
                          title="Mirar a cámara (90°)"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[9px] text-zinc-550 italic mt-1 font-semibold uppercase leading-tight">
                        Detalle del Actor: {selectedRow?.charactersDetail || 'Sin rasgos detallados.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Lights specific Controls */}
                {selectedElement.type.startsWith('light_') && (
                  <div className="space-y-3.5">
                    {/* Light Angle Rotation */}
                    <div>
                      <div className="flex justify-between text-[9.5px] uppercase font-mono font-bold text-zinc-500 mb-1">
                        <span>Dirección del Haz:</span>
                        <span className="text-zinc-300 font-bold">{selectedElement.angle || 0}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={selectedElement.angle || 0}
                        onChange={(e) => updateSelectedProperty('angle', parseInt(e.target.value))}
                        className="w-full accent-yellow-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Light Intensity */}
                    <div>
                      <div className="flex justify-between text-[9.5px] uppercase font-mono font-bold text-zinc-500 mb-1">
                        <span>Intensidad Lumínica:</span>
                        <span className="text-yellow-400 font-mono font-bold">{selectedElement.intensity || 50}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={selectedElement.intensity || 50}
                        onChange={(e) => updateSelectedProperty('intensity', parseInt(e.target.value))}
                        className="w-full accent-yellow-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Light Color Temperature Picker */}
                    <div>
                      <label className="text-[9.5px] text-zinc-500 uppercase font-mono font-bold tracking-wider mb-2 block">
                        Temperatura de Color:
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { name: 'Cálida (3200K)', value: '#ffaa33', border: 'border-orange-500/20' },
                          { name: 'Fría (5600K)', value: '#88ddff', border: 'border-cyan-500/20' },
                          { name: 'Blanco Puro', value: '#ffffff', border: 'border-zinc-500/20' },
                          { name: 'Neon RGB', value: '#ff00aa', border: 'border-pink-500/20' },
                        ].map(c => {
                          const isSelColor = selectedElement.color === c.value;
                          return (
                            <button
                              key={c.value}
                              onClick={() => updateSelectedProperty('color', c.value)}
                              className={`py-1 rounded text-[8px] font-mono font-bold uppercase border transition-all ${
                                isSelColor
                                  ? 'bg-zinc-800 text-white border-yellow-500'
                                  : 'bg-zinc-950/40 text-zinc-550 border-zinc-850 hover:text-zinc-300'
                              }`}
                              style={{ borderLeftColor: c.value, borderLeftWidth: '3px' }}
                              title={c.name}
                            >
                              {c.name.split(' ')[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-950/20 border border-dashed border-zinc-850 p-6 text-center text-zinc-600 font-mono text-[10px] rounded-lg">
                HAGA CLICK sobre cualquier objeto en el plano de arriba para abrir sus controles de precisión.
              </div>
            )}

            {/* Quick Director Tips */}
            <div className="bg-orange-950/10 border border-orange-500/10 p-3 rounded-lg flex items-start gap-2">
              <span className="text-base shrink-0">🎥</span>
              <div className="space-y-0.5">
                <span className="text-[9.5px] font-black text-orange-400 uppercase tracking-wider block">
                  Regla de los 180 Grados:
                </span>
                <p className="text-[10px] text-zinc-400 leading-snug">
                  Mantén la cámara del mismo lado del eje de acción (el vector imaginario entre los actores) para evitar desorientar al espectador en cortes consecutivos.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
