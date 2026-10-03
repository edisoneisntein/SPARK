export interface ScriptRow {
  time: string;
  visual: string;
  audio: string;
  acoustics?: string;
  vfx?: string;
  charactersCount?: number;
  charactersDetail?: string;
  wardrobe?: string;
  propsAndEnvironment?: string;
}

export interface TransferableMatrix {
  hookType: string;
  dominantEmotion: string;
  narrativeSpeed: string;
  languageComplexity: string;
  ideasPerMinute: string;
  tensionPattern: string;
  resolutionPattern: string;
  ctaType: string;
}

export interface AudioMetrics {
  soundscape: string;
  foleySFX: string;
  musicScore: string;
  voiceTonal: string;
}

export interface VFXMetrics {
  pbrLighting: string;
  colorGradingLUT: string;
  opticalImperfection: string;
  transitionsSpeed: string;
}

export interface DevilsAdvocate {
  visualFidelityScore: number;
  foleyCoherenceScore: number;
  discrepancyAlerts: string[];
  antiSlopDirectives: string[];
}

export interface AnalyzedVideo {
  originalScript: ScriptRow[];
  transferableMatrix: TransferableMatrix;
  suggestedTopics: string[];
  commentBait: string;
  hashtags: string[];
  audioMetrics?: AudioMetrics;
  vfxMetrics?: VFXMetrics;
  devilsAdvocate?: DevilsAdvocate;
}

export interface LogicAuditFinding {
  id: string;
  title: string;
  severity: 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO' | 'INFORMATIVO';
  category: string; // 'Técnica' | 'Narrativa' | 'Audio' | 'Visual' | etc.
  description: string;
  evidence: string;
  triggerCase: string;
  impact: string;
  rootCause: string;
  consequences: string;
  recommendation: string;
  confidenceLevel: 'ALTO' | 'MEDIO' | 'BAJO';
  status: string; // 'VERIFICADO' | 'NO VERIFICADO: INFORMACIÓN INSUFICIENTE PARA AUDITAR'

  // V3-specific Forensic Audit fields
  technicalProblem?: string;
  evidenceObserved?: string;
  technicalGoal?: string;
  remediationStrategy?: string;
  stepByStepActions?: string[];
  exactLocation?: string;
  architecturalImpact?: string;
  measurableAcceptanceCriteria?: string;
  stressChaosTestingStrategy?: string;
  residualRisk?: string;
  detailedRollbackPlan?: string;
  estimatedEffort?: string;
  dependencies?: string;
  phase?: string;
}

export interface RemediationPlanItem {
  priority: 'CRÍTICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  description: string;
  risks: string;
  effort: string;
}

export interface PreFlightValidation {
  formatSpecs: string; // (a) Especificaciones de formato
  lightingColorimetry: string; // (b) Parámetros de iluminación/colorimetría
  cameraMovement: string; // (c) Restricciones de movimiento de cámara
  audioFrequency: string; // (d) Especificaciones de audio/frecuencia
  scriptIntegrity: string; // (e) Integridad del guion
}

export interface LogicAuditReport {
  executiveSummary: string;
  generalState: string;
  confidenceIndex: number;
  findings: LogicAuditFinding[];
  activeRefutations: string[];
  remediationPlan: RemediationPlanItem[];
  preFlightValidation?: PreFlightValidation; // V3 Pre-flight section
}

export interface SpatialElement {
  id: string;
  name: string;
  type: 'camera' | 'actor' | 'light_key' | 'light_back' | 'light_fill' | 'light_bg';
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  angle?: number; // 0 to 360 degrees
  intensity?: number; // 0 to 100 (for lights)
  color?: string; // Hex color or color name
  fov?: number; // field of view in degrees (camera)
  gazeAngle?: number; // for actors
  isActive?: boolean;
}

export interface SpatialSetup {
  elements: SpatialElement[];
  selectedLens: string;
}

export interface RaccordWarning {
  beatIndex: number;
  time: string;
  type: 'AXIS_JUMP' | 'CHAR_COUNT' | 'WARDROBE' | 'PROPS' | 'EXIT_ENTRY';
  severity: 'CRÍTICO' | 'MEDIO' | 'INFORMATIVO';
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
}

export interface RaccordReport {
  overallScore: number;
  summary: string;
  warnings: RaccordWarning[];
}


