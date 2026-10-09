export type DeviceKindType = 'audioinput' | 'videoinput' | 'audiooutput';

export interface DeviceInfoItem {
  deviceId: string;
  label: string;
  groupId: string;
  kind: DeviceKindType;
}

export type PermissionStatusType = 'idle' | 'prompt' | 'requesting' | 'granted' | 'denied' | 'error';

export interface HardwareErrorState {
  code: 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'OverconstrainedError' | 'SecurityError' | 'AbortError' | 'Unknown';
  title: string;
  message: string;
  solution: string;
  remediationSteps: string[];
}

export interface VideoStreamMetrics {
  width: number;
  height: number;
  fps: number;
  trueFps: number;
  aspectRatio: string;
  facingMode?: string;
  deviceId?: string;
  deviceLabel: string;
  isMirrored: boolean;
  isActive: boolean;
  hasTrack: boolean;
}

export interface AudioStreamMetrics {
  instantDb: number;
  peakDb: number;
  noiseFloorDb: number;
  isClipping: boolean;
  elevatedNoise: boolean;
  isSpeaking: boolean;
  dominantFrequency: number;
  hasHumDetected: boolean;
  humFrequency?: number;
  sampleRate: number;
}

export interface SpeakerTestState {
  isPlaying: boolean;
  activeChannel: 'left' | 'right' | 'both' | null;
  leftVerified: boolean;
  rightVerified: boolean;
  outputDeviceId: string;
  isSinkIdSupported: boolean;
}

export interface LoopbackRecorderState {
  status: 'idle' | 'countdown' | 'recording' | 'recorded';
  countdownSeconds: number;
  durationSeconds: number;
  blobUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  isVerified: boolean;
}

export interface PreflightChecklist {
  cameraActive: boolean;
  cameraFpsTargetMet: boolean;
  micActive: boolean;
  micNoClipping: boolean;
  speakerLeftVerified: boolean;
  speakerRightVerified: boolean;
  loopbackTested: boolean;
}

export interface SystemDiagnosticReport {
  timestamp: string;
  userAgent: string;
  platform: string;
  browserName: string;
  readinessScore: number;
  readinessTier: 'READY' | 'WARNING' | 'FAILED';
  camera: {
    label: string;
    resolution: string;
    fps: number;
    aspectRatio: string;
    status: string;
  };
  microphone: {
    label: string;
    peakDb: string;
    noiseFloorDb: string;
    clippingDetected: boolean;
    elevatedNoiseDetected: boolean;
    status: string;
  };
  speaker: {
    label: string;
    stereoVerified: boolean;
    sinkIdSupported: boolean;
    status: string;
  };
  loopback: {
    completed: boolean;
    codecUsed: string;
    fileSizeBytes: number;
  };
}

export interface AdUnitConfig {
  id: string;
  title: string;
  slotType: 'leaderboard' | 'medium-rectangle' | 'sticky-rail';
  width: number;
  height: number;
  refreshIntervalSec: number;
  minViewabilityRatio: number;
}
