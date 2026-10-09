'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DeviceInfoItem, HardwareErrorState, PermissionStatusType } from '@/types/preflight';

export interface UseMediaDevicesReturn {
  devices: DeviceInfoItem[];
  microphones: DeviceInfoItem[];
  cameras: DeviceInfoItem[];
  speakers: DeviceInfoItem[];
  selectedMicId: string;
  selectedCameraId: string;
  selectedSpeakerId: string;
  setSelectedMicId: (id: string) => void;
  setSelectedCameraId: (id: string) => void;
  setSelectedSpeakerId: (id: string) => void;
  permissionStatus: PermissionStatusType;
  errorState: HardwareErrorState | null;
  activeStream: MediaStream | null;
  videoStream: MediaStream | null;
  audioStream: MediaStream | null;
  isSinkIdSupported: boolean;
  requestPermissions: () => Promise<void>;
  stopAllMedia: () => void;
  clearError: () => void;
  refreshDevices: () => Promise<void>;
  isStreamActive: boolean;
}

export function useMediaDevices(): UseMediaDevicesReturn {
  const [devices, setDevices] = useState<DeviceInfoItem[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatusType>('prompt');
  const [errorState, setErrorState] = useState<HardwareErrorState | null>(null);

  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isSinkIdSupported, setIsSinkIdSupported] = useState<boolean>(false);

  // References to keep track of active stream for robust synchronous cleanup
  const currentStreamRef = useRef<MediaStream | null>(null);

  // Check setSinkId browser compatibility
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audioElem = document.createElement('audio');
      setIsSinkIdSupported('setSinkId' in audioElem);
    }
  }, []);

  // Map DOMExceptions to detailed actionable diagnostics
  const handleHardwareError = useCallback((err: unknown) => {
    const error = err as Error;
    let errState: HardwareErrorState;

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errState = {
        code: 'NotAllowedError',
        title: 'Camera & Microphone Access Blocked',
        message: 'The browser or your operating system denied access to media hardware.',
        solution: 'Click the padlock or tune icon in the browser address bar, toggle Camera and Microphone to "Allow", and reload.',
        remediationSteps: [
          'Browser: Click the icon next to the URL (lock/sliders) and set Camera & Mic to "Allow".',
          'Windows 11: Settings > Privacy & security > Camera & Microphone > Toggle "Let desktop apps access your camera".',
          'macOS: System Settings > Privacy & Security > Camera & Microphone > Grant access to your browser.',
        ],
      };
      setPermissionStatus('denied');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errState = {
        code: 'NotFoundError',
        title: 'No Hardware Devices Detected',
        message: 'No physical camera or microphone was found connected to this system.',
        solution: 'Check USB cable connections, Bluetooth pairing, or hardware privacy switches.',
        remediationSteps: [
          'Verify your webcam or headset USB plug is securely seated.',
          'Check if your laptop has a physical privacy slider or function key (F8/F10) blocking the lens.',
          'Verify your audio interface is powered on.',
        ],
      };
      setPermissionStatus('error');
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errState = {
        code: 'NotReadableError',
        title: 'Hardware Already in Use / Locked',
        message: 'Your webcam or microphone is currently locked by another application.',
        solution: 'Close background video apps like Zoom, Microsoft Teams, Skype, or OBS.',
        remediationSteps: [
          'Quit Zoom, Google Meet tabs, Microsoft Teams, Discord, or OBS Studio.',
          'On Windows, open Task Manager to check if any background process holds the camera lock.',
          'Unplug and reconnect the USB camera cable to reset hardware lock.',
        ],
      };
      setPermissionStatus('error');
    } else if (error.name === 'OverconstrainedError') {
      errState = {
        code: 'OverconstrainedError',
        title: 'Hardware Constraints Unmet',
        message: 'The requested resolution or frame rate is not supported by your current device.',
        solution: 'We will fall back to default standard definitions (1280x720 / 30 FPS).',
        remediationSteps: [
          'Your device might not support full HD 1080p60.',
          'Preflight Lab will dynamically switch to standard 720p constraints.',
        ],
      };
      setPermissionStatus('error');
    } else {
      errState = {
        code: 'Unknown',
        title: 'Media Hardware Initialization Error',
        message: error.message || 'An unexpected error occurred while accessing media devices.',
        solution: 'Restart your browser or reconnect your hardware peripheral.',
        remediationSteps: [
          'Refresh this page.',
          'Test with a different browser profile or restart browser.',
        ],
      };
      setPermissionStatus('error');
    }

    setErrorState(errState);

    // Telemetry reporting without personal data
    if (typeof window !== 'undefined') {
      fetch('/api/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorName: error.name || 'Unknown',
          errorMessage: error.message || 'No message',
          deviceContext: 'getUserMedia failure',
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {});
    }
  }, []);

  // Stop all active media tracks cleanly to turn off hardware camera LEDs
  const stopAllMedia = useCallback(() => {
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      currentStreamRef.current = null;
    }
    setActiveStream(null);
    setVideoStream(null);
    setAudioStream(null);
  }, []);

  // Refresh hardware device enumeration
  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const devList = await navigator.mediaDevices.enumerateDevices();
      const mappedList: DeviceInfoItem[] = devList.map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `${d.kind === 'videoinput' ? 'Camera' : d.kind === 'audioinput' ? 'Microphone' : 'Speaker'} ${index + 1}`,
        groupId: d.groupId,
        kind: d.kind as DeviceInfoItem['kind'],
      }));

      setDevices(mappedList);

      // Select default devices if none selected
      const firstCam = mappedList.find((d) => d.kind === 'videoinput');
      const firstMic = mappedList.find((d) => d.kind === 'audioinput');
      const firstSpeaker = mappedList.find((d) => d.kind === 'audiooutput');

      setSelectedCameraId((prev) => (prev && mappedList.some((d) => d.deviceId === prev) ? prev : firstCam?.deviceId || ''));
      setSelectedMicId((prev) => (prev && mappedList.some((d) => d.deviceId === prev) ? prev : firstMic?.deviceId || ''));
      setSelectedSpeakerId((prev) => (prev && mappedList.some((d) => d.deviceId === prev) ? prev : firstSpeaker?.deviceId || ''));
    } catch (err) {
      console.warn('Device enumeration failed', err);
    }
  }, []);

  // Start or switch active hardware streams
  const startStream = useCallback(
    async (micId?: string, camId?: string) => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return;
      }

      // Clean up existing streams first
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach((track) => track.stop());
        currentStreamRef.current = null;
      }

      setErrorState(null);
      setPermissionStatus('requesting');

      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1920, min: 640 },
        height: { ideal: 1080, min: 480 },
        frameRate: { ideal: 30, max: 60 },
      };

      if (camId) {
        videoConstraints.deviceId = { exact: camId };
      }

      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: false, // Keep raw audio for accurate spectrum & noise floor testing
        noiseSuppression: false,
        autoGainControl: false,
      };

      if (micId) {
        audioConstraints.deviceId = { exact: micId };
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        currentStreamRef.current = stream;
        setActiveStream(stream);

        // Separate streams for dedicated consumers
        const vStream = new MediaStream(stream.getVideoTracks());
        const aStream = new MediaStream(stream.getAudioTracks());
        setVideoStream(vStream);
        setAudioStream(aStream);

        setPermissionStatus('granted');
        await refreshDevices();
      } catch (err) {
        // Fallback with looser constraints in case of OverconstrainedError
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          currentStreamRef.current = fallbackStream;
          setActiveStream(fallbackStream);
          setVideoStream(new MediaStream(fallbackStream.getVideoTracks()));
          setAudioStream(new MediaStream(fallbackStream.getAudioTracks()));
          setPermissionStatus('granted');
          await refreshDevices();
        } catch (fallbackErr) {
          handleHardwareError(fallbackErr || err);
        }
      }
    },
    [handleHardwareError, refreshDevices]
  );

  // Request permissions triggered by user
  const requestPermissions = useCallback(async () => {
    await startStream(selectedMicId, selectedCameraId);
  }, [startStream, selectedMicId, selectedCameraId]);

  // Handle switching camera device
  const handleSelectCamera = useCallback(
    async (newCamId: string) => {
      setSelectedCameraId(newCamId);
      if (permissionStatus === 'granted') {
        await startStream(selectedMicId, newCamId);
      }
    },
    [permissionStatus, selectedMicId, startStream]
  );

  // Handle switching mic device
  const handleSelectMic = useCallback(
    async (newMicId: string) => {
      setSelectedMicId(newMicId);
      if (permissionStatus === 'granted') {
        await startStream(newMicId, selectedCameraId);
      }
    },
    [permissionStatus, selectedCameraId, startStream]
  );

  // Handle switching speaker device
  const handleSelectSpeaker = useCallback((newSpeakerId: string) => {
    setSelectedSpeakerId(newSpeakerId);
  }, []);

  // Auto-refresh when devices are plugged or unplugged
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    const onDeviceChange = () => {
      refreshDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);

    // Initial silent device enumeration to populate any pre-granted devices
    refreshDevices();

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
    };
  }, [refreshDevices]);

  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, [stopAllMedia]);

  const microphones = devices.filter((d) => d.kind === 'audioinput');
  const cameras = devices.filter((d) => d.kind === 'videoinput');
  const speakers = devices.filter((d) => d.kind === 'audiooutput');

  return {
    devices,
    microphones,
    cameras,
    speakers,
    selectedMicId,
    selectedCameraId,
    selectedSpeakerId,
    setSelectedMicId: handleSelectMic,
    setSelectedCameraId: handleSelectCamera,
    setSelectedSpeakerId: handleSelectSpeaker,
    permissionStatus,
    errorState,
    activeStream,
    videoStream,
    audioStream,
    isSinkIdSupported,
    requestPermissions,
    stopAllMedia,
    clearError: () => setErrorState(null),
    refreshDevices,
    isStreamActive: Boolean(activeStream && activeStream.active),
  };
}
