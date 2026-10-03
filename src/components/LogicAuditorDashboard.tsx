import { useState } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, BadgeCheck, HelpCircle, ArrowRight, Zap, Play, Loader2, RefreshCw, Layers, Compass, CheckCircle2 } from 'lucide-react';
import { LogicAuditReport, LogicAuditFinding } from '../types';

interface LogicAuditorDashboardProps {
  auditReport: LogicAuditReport | null;
  onRunAudit: () => Promise<void>;
  isAuditing: boolean;
  hasScript: boolean;
}

export function LogicAuditorDashboard({
  auditReport,
  onRunAudit,
  isAuditing,
  hasScript
}: LogicAuditorDashboardProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

  // Filter findings
  const filteredFindings = auditReport?.findings.filter((finding) => {
    const matchesSeverity = severityFilter === 'todos' || finding.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesStatus = statusFilter === 'todos' || finding.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSeverity && matchesStatus;
  }) || [];

  const getSeverityStyles = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRÍTICO':
        return 'bg-red-500/10 text-red-400 border border-red-500/30 font-bold';
      case 'ALTO':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold';
      case 'MEDIO':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'BAJO':
        return 'bg-zinc-800 text-zinc-300 border border-zinc-700';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    return <Layers className="w-3.5 h-3.5 shrink-0" />;
  };

  const toggleExpand = (id: string) => {
    setExpandedFindingId(expandedFindingId === id ? null : id);
  };

  return (
    <div className="bg-zinc-950/40 rounded-xl border border-zinc-800/80 p-5 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-850 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-orange-600/10 border border-orange-500/20 text-orange-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                Auditoría de Lógica del Sistema y Coherencia Semántica (SAECS)
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono block">
                Fiel reflejo de la realidad observable: Hechos vs Hipótesis narrativas
              </span>
            </div>
          </div>
        </div>

        {hasScript ? (
          <button
            type="button"
            onClick={onRunAudit}
            disabled={isAuditing}
            className="w-full md:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-950/20 disabled:opacity-50 shrink-0"
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Auditando Lógica...
              </>
            ) : auditReport ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Volver a Auditar Guion
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Iniciar Auditoría SAECS
              </>
            )}
          </button>
        ) : (
          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-550 px-3 py-1.5 rounded font-mono uppercase">
            ⚠️ Genere o suba un guion para habilitar auditoría SAECS
          </span>
        )}
      </div>

      {isAuditing && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3.5">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Ejecutando Comprobaciones Estrictas SAECS
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono uppercase max-w-sm">
              Analizando consistencia de personajes, sincronía acústica foley, realismo en diálogos y refutando vacíos narrativos...
            </p>
          </div>
        </div>
      )}

      {!isAuditing && !auditReport && (
        <div className="py-10 text-center border border-dashed border-zinc-850 bg-zinc-950/10 rounded-lg">
          <ShieldAlert className="w-7 h-7 text-zinc-650 mx-auto mb-2.5" />
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Auditoría Lógica Pendiente
          </p>
          <p className="text-[10px] text-zinc-550 max-w-sm mx-auto mt-1 uppercase leading-normal">
            La auditoría SAECS desglosa inconsistencias, contradicciones, look IA artificial y analiza la coherencia temporal de personajes y gesticulación. Pulse el botón de arriba para iniciar.
          </p>
        </div>
      )}

      {!isAuditing && auditReport && (
        <div className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Score Ring / Bar */}
            <div className="md:col-span-4 bg-zinc-900/40 border border-zinc-850 rounded-lg p-4 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[9px] text-zinc-500 font-mono uppercase font-black tracking-wider block">
                  Índice de Confianza Lógica
                </span>
                <span className="text-[8px] text-zinc-600 font-mono block">Rigurosidad de Embedding y Producción</span>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                  {auditReport.confidenceIndex}%
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                  auditReport.confidenceIndex >= 85
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : auditReport.confidenceIndex >= 70
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {auditReport.confidenceIndex >= 85 ? 'ESTABLE' : auditReport.confidenceIndex >= 70 ? 'FRÁGIL' : 'CRÍTICO'}
                </span>
              </div>

              {/* Bar progression */}
              <div className="w-full bg-zinc-950 h-2 rounded border border-zinc-800 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded transition-all duration-500"
                  style={{ width: `${auditReport.confidenceIndex}%` }}
                />
              </div>
            </div>

            {/* General State Details */}
            <div className="md:col-span-8 bg-zinc-900/40 border border-zinc-850 rounded-lg p-4 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-orange-400 font-mono uppercase font-black tracking-wider block mb-1">
                  Resumen Ejecutivo de Coherencia (Auditoría Forense)
                </span>
                <p className="text-[11.5px] text-zinc-300 font-sans leading-relaxed">
                  {auditReport.executiveSummary}
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-850/60">
                <span className="text-[8.5px] text-zinc-500 font-mono uppercase font-bold block mb-0.5">
                  Estado de la Fidelidad Semántica:
                </span>
                <p className="text-[11px] text-zinc-400 italic font-mono leading-relaxed">
                  {auditReport.generalState}
                </p>
              </div>
            </div>
          </div>

          {/* Pre-flight Consistency Validation V3 */}
          {auditReport.preFlightValidation && (
            <div className="bg-zinc-900/30 border border-zinc-850 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-1.5 border-b border-zinc-850/60 pb-1.5">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest font-mono">
                  Validación de Consistencia Pre-flight Obligatoria: Observaciones sobre las Entradas
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="bg-black/25 p-3 rounded border border-zinc-850/40 space-y-1">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase font-black block">(a) Formato</span>
                  <p className="text-[10.5px] text-zinc-300 font-sans leading-relaxed">
                    {auditReport.preFlightValidation.formatSpecs}
                  </p>
                </div>
                <div className="bg-black/25 p-3 rounded border border-zinc-850/40 space-y-1">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase font-black block">(b) Iluminación/Color</span>
                  <p className="text-[10.5px] text-zinc-300 font-sans leading-relaxed">
                    {auditReport.preFlightValidation.lightingColorimetry}
                  </p>
                </div>
                <div className="bg-black/25 p-3 rounded border border-zinc-850/40 space-y-1">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase font-black block">(c) Mov. Cámara</span>
                  <p className="text-[10.5px] text-zinc-300 font-sans leading-relaxed">
                    {auditReport.preFlightValidation.cameraMovement}
                  </p>
                </div>
                <div className="bg-black/25 p-3 rounded border border-zinc-850/40 space-y-1">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase font-black block">(d) Audio/Frecuencia</span>
                  <p className="text-[10.5px] text-zinc-300 font-sans leading-relaxed">
                    {auditReport.preFlightValidation.audioFrequency}
                  </p>
                </div>
                <div className="bg-black/25 p-3 rounded border border-zinc-850/40 space-y-1">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase font-black block">(e) Integridad Guion</span>
                  <p className="text-[10.5px] text-zinc-300 font-sans leading-relaxed">
                    {auditReport.preFlightValidation.scriptIntegrity}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Active Refutation Tests Tried */}
          <div className="bg-zinc-900/20 border border-zinc-850 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-1.5 border-b border-zinc-850/60 pb-1.5">
              <Compass className="w-4 h-4 text-orange-500 shrink-0" />
              <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest font-mono">
                Pruebas de Refutación Activa Aplicadas (Anti-Inferencia)
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {auditReport.activeRefutations.map((refutation, idx) => (
                <div key={idx} className="flex gap-2 bg-black/25 p-2.5 rounded border border-zinc-850/40">
                  <BadgeCheck className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5 animate-pulse" />
                  <span className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                    {refutation}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables Prioritization Matrix V3 */}
          <div className="bg-zinc-900/20 border border-zinc-850 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-1.5 border-b border-zinc-850/60 pb-1.5">
              <Layers className="w-4 h-4 text-orange-500 shrink-0" />
              <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest font-mono">
                Matriz General de Priorización de Entregables (V3)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[9px]">
                    <th className="py-2 px-3 font-bold">ID</th>
                    <th className="py-2 px-3 font-bold">Título</th>
                    <th className="py-2 px-3 font-bold text-center">Severidad</th>
                    <th className="py-2 px-3 font-bold">Impacto (Render Pipeline)</th>
                    <th className="py-2 px-3 font-bold text-center">Esfuerzo</th>
                    <th className="py-2 px-3 font-bold">Dependencias</th>
                    <th className="py-2 px-3 font-bold">Riesgo Residual</th>
                    <th className="py-2 px-3 font-bold text-center">Fase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {auditReport.findings.map((f) => (
                    <tr key={f.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-2.5 px-3 text-orange-500 font-extrabold">{f.id}</td>
                      <td className="py-2.5 px-3 text-zinc-200 font-sans font-medium">{f.title}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getSeverityStyles(f.severity)}`}>
                          {f.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-sans leading-normal">
                        {f.architecturalImpact || f.impact || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-zinc-300">
                        {f.estimatedEffort || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {f.dependencies || 'Ninguna'}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-450 leading-normal">
                        {f.residualRisk || 'Ninguno'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-amber-500 font-bold uppercase">
                        {f.phase || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Findings Header with Filters */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <h3 className="text-[11px] font-black text-zinc-200 uppercase tracking-widest font-sans">
                  Hallazgos y Contradicciones de la Lógica ({filteredFindings.length})
                </h3>
              </div>
              
              {/* Filter controls */}
              <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Severidad:</span>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-orange-500"
                  >
                    <option value="todos">TODOS</option>
                    <option value="crítico">CRÍTICO</option>
                    <option value="alto">ALTO</option>
                    <option value="medio">MEDIO</option>
                    <option value="bajo">BAJO</option>
                    <option value="informativo">INFORMATIVO</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Estado:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-orange-500"
                  >
                    <option value="todos">TODOS</option>
                    <option value="verificado">VERIFICADO (Hecho)</option>
                    <option value="no verificado">NO VERIFICADO (Hipótesis)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Findings Accordion/List */}
            {filteredFindings.length === 0 ? (
              <div className="py-6 text-center text-zinc-650 text-[11px] border border-dashed border-zinc-850 rounded bg-zinc-950/5">
                No se encontraron anomalías lógicas con los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFindings.map((finding) => {
                  const isExpanded = expandedFindingId === finding.id;
                  const isVerified = finding.status.toUpperCase() === 'VERIFICADO';

                  return (
                    <div
                      key={finding.id}
                      className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                        isExpanded
                          ? 'bg-zinc-900/50 border-orange-500/40 shadow-md'
                          : 'bg-zinc-900/20 hover:bg-zinc-900/35 border-zinc-850/80'
                      }`}
                    >
                      {/* Header row */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(finding.id)}
                        className="w-full text-left p-3.5 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-grow">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9px] font-mono text-orange-500 font-extrabold tracking-wider">
                              [{finding.id}]
                            </span>
                            <span className="text-xs font-black text-zinc-200 leading-snug font-sans group-hover:text-orange-400">
                              {finding.title}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono">
                            <span className={`px-1.5 py-0.5 rounded uppercase ${getSeverityStyles(finding.severity)}`}>
                              {finding.severity}
                            </span>
                            <span className="text-zinc-550 flex items-center gap-1">
                              {getCategoryIcon(finding.category)} {finding.category}
                            </span>
                            <span className="text-zinc-550">| Ubicación: {finding.exactLocation || finding.evidence || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Status Badge & Arrow */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[8.5px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isVerified
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 border-dashed text-[8px]'
                          }`}>
                            {isVerified ? '● HECHO' : '○ HIPÓTESIS'}
                          </span>
                          <span className={`text-zinc-600 transition-transform ${isExpanded ? 'rotate-95 text-orange-400' : ''}`}>
                            ➔
                          </span>
                        </div>
                      </button>

                      {/* Expandable details V3 */}
                      {isExpanded && (
                        <div className="p-5 bg-zinc-950 border-t border-zinc-850/80 space-y-5 text-[11px] text-zinc-300">
                          
                          {/* Top row: Evidencia Observada vs Problema Técnico */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-850/60">
                              <span className="block text-[8.5px] text-zinc-500 font-mono font-black uppercase tracking-wider mb-1">
                                🔍 Evidencia Observada
                              </span>
                              <p className="text-zinc-200 italic leading-relaxed font-mono bg-black/30 p-2 rounded border border-zinc-900">
                                "{finding.evidenceObserved || finding.evidence || 'N/A'}"
                              </p>
                            </div>

                            <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-850/60">
                              <span className="block text-[8.5px] text-red-400 font-mono font-black uppercase tracking-wider mb-1">
                                ⚠️ Problema Técnico
                              </span>
                              <p className="text-zinc-200 leading-relaxed font-sans font-medium">
                                {finding.technicalProblem || finding.description || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Middle row: Causa Raíz vs Objetivo Técnico */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-zinc-900/20 p-3 rounded-lg border border-zinc-850/40">
                              <span className="block text-[8.5px] text-zinc-500 font-mono font-bold uppercase tracking-wider mb-1">
                                🧬 Causa Raíz
                              </span>
                              <p className="text-zinc-400 leading-relaxed">
                                {finding.rootCause || 'N/A'}
                              </p>
                            </div>

                            <div className="bg-zinc-900/20 p-3 rounded-lg border border-zinc-850/40">
                              <span className="block text-[8.5px] text-orange-400 font-mono font-bold uppercase tracking-wider mb-1">
                                🎯 Objetivo Técnico
                              </span>
                              <p className="text-zinc-200 leading-relaxed font-sans">
                                {finding.technicalGoal || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Step-by-Step Actions (Algorithm) & Remediation Strategy */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5 bg-orange-950/5 p-4 rounded-lg border border-orange-500/15 space-y-2">
                              <span className="block text-[8.5px] text-orange-400 font-mono font-black uppercase tracking-wider">
                                ⚡ Estrategia de Remediación
                              </span>
                              <p className="text-zinc-200 leading-relaxed font-sans font-semibold">
                                {finding.remediationStrategy || finding.recommendation || 'N/A'}
                              </p>
                              <div className="text-[9px] text-zinc-500 font-mono pt-1">
                                <span className="block font-bold">Ubicación Exacta:</span>
                                <span className="text-zinc-400 italic">{finding.exactLocation || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="md:col-span-7 bg-zinc-900/30 p-4 rounded-lg border border-zinc-850/50 space-y-2">
                              <span className="block text-[8.5px] text-emerald-400 font-mono font-black uppercase tracking-wider">
                                🛠️ Algoritmo de Corrección (Paso a Paso)
                              </span>
                              {finding.stepByStepActions && finding.stepByStepActions.length > 0 ? (
                                <ul className="space-y-1.5 list-none">
                                  {finding.stepByStepActions.map((action, idx) => (
                                    <li key={idx} className="flex gap-2 text-zinc-300 leading-relaxed">
                                      <span className="text-emerald-500 font-bold font-mono shrink-0">[{idx + 1}]</span>
                                      <span className="font-sans">{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-zinc-550 italic font-mono">No se detallan acciones paso a paso.</p>
                              )}
                            </div>
                          </div>

                          {/* Technical Pipeline details: Impact, Acceptance, Stress Testing */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-850/60 pt-4">
                            <div className="bg-zinc-950/50 p-3 rounded border border-zinc-900">
                              <span className="block text-[8.5px] text-zinc-500 font-mono font-bold uppercase mb-1">
                                ⚙️ Impacto Arquitectónico (Render Pipeline)
                              </span>
                              <p className="text-zinc-400 leading-relaxed font-sans">
                                {finding.architecturalImpact || finding.impact || 'N/A'}
                              </p>
                            </div>

                            <div className="bg-zinc-950/50 p-3 rounded border border-zinc-900">
                              <span className="block text-[8.5px] text-zinc-500 font-mono font-bold uppercase mb-1">
                                📐 Criterios de Aceptación Medibles
                              </span>
                              <p className="text-zinc-400 leading-relaxed font-sans">
                                {finding.measurableAcceptanceCriteria || 'N/A'}
                              </p>
                            </div>

                            <div className="bg-zinc-950/50 p-3 rounded border border-zinc-900">
                              <span className="block text-[8.5px] text-zinc-500 font-mono font-bold uppercase mb-1">
                                🌪️ Pruebas de Estrés y Caos
                              </span>
                              <p className="text-zinc-400 leading-relaxed font-sans">
                                {finding.stressChaosTestingStrategy || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Security & Lifecycle: Risk, Rollback, Effort */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/15 p-3.5 rounded-lg border border-zinc-850/40">
                            <div>
                              <span className="block text-[8.5px] text-zinc-500 font-mono uppercase mb-0.5 font-bold">
                                Riesgo Residual Post-Corrección:
                              </span>
                              <p className="text-zinc-400 leading-relaxed font-mono text-[10px]">
                                {finding.residualRisk || 'N/A'}
                              </p>
                            </div>

                            <div>
                              <span className="block text-[8.5px] text-zinc-500 font-mono uppercase mb-0.5 font-bold">
                                Plan de Rollback Detallado:
                              </span>
                              <p className="text-zinc-400 leading-relaxed font-sans text-[10px]">
                                {finding.detailedRollbackPlan || 'N/A'}
                              </p>
                            </div>

                            <div className="flex flex-col justify-between">
                              <div>
                                <span className="block text-[8.5px] text-zinc-500 font-mono uppercase mb-0.5 font-bold">
                                  Esfuerzo Estimado:
                                </span>
                                <p className="text-amber-500 font-bold font-mono text-xs">
                                  {finding.estimatedEffort || 'N/A'}
                                </p>
                              </div>
                              <div className="text-[8px] text-zinc-600 font-mono uppercase text-right mt-1 font-bold">
                                STATUS: {finding.status}
                              </div>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Remediation Plan */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1.5 border-b border-zinc-850 pb-2">
              <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest font-sans">
                Plan de Remediación Semántico Sugerido
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auditReport.remediationPlan.map((plan, idx) => (
                <div key={idx} className="bg-zinc-900/30 border border-zinc-850 p-3.5 rounded-lg space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[8.5px] px-2 py-0.5 rounded font-bold uppercase font-mono ${
                        plan.priority === 'CRÍTICA'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                          : plan.priority === 'ALTA'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      }`}>
                        Prioridad {plan.priority}
                      </span>
                      <span className="text-[8px] text-zinc-550 font-mono font-bold uppercase">Esfuerzo: {plan.effort}</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed font-sans font-medium">
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-[9px] text-zinc-500 italic border-t border-zinc-850/60 pt-1.5 font-mono">
                    Riesgo latente: {plan.risks}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
