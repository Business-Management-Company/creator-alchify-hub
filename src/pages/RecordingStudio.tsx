import { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Video,
  Monitor,
  Mic,
  MicOff,
  VideoOff,
  Circle,
  Square,
  Pause,
  Play,
  Settings,
  Layout,
  Type,
  Image,
  ImagePlus,
  Camera,
  ScreenShare,
  User,
  UserPlus,
  Link,
  Mail,
  Radio,
  Save,
  Copy,
  Check,
  Facebook,
  Linkedin,
  Youtube,
  Users,
  Headphones,
  X,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { validatePodcastCoverImage } from '@/lib/image-validation';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type RecordingType = 'video' | 'audio';
type RecordingMode = 'webcam' | 'screen' | 'screen-webcam';
type LayoutType = 'fullscreen' | 'pip-bottom-right' | 'pip-bottom-left' | 'pip-top-right' | 'pip-top-left' | 'split';
type SessionMode = 'record' | 'stream-record';

interface StreamingDestination {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  rtmpUrl?: string;
}

interface InvitedGuest {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'joined';
}

const LAYOUTS: { id: LayoutType; label: string; description: string }[] = [
  { id: 'fullscreen', label: 'Fullscreen', description: 'Single source fills the frame' },
  { id: 'pip-bottom-right', label: 'PiP Bottom Right', description: 'Webcam overlay bottom right' },
  { id: 'pip-bottom-left', label: 'PiP Bottom Left', description: 'Webcam overlay bottom left' },
  { id: 'pip-top-right', label: 'PiP Top Right', description: 'Webcam overlay top right' },
  { id: 'pip-top-left', label: 'PiP Top Left', description: 'Webcam overlay top left' },
  { id: 'split', label: 'Split Screen', description: 'Side by side view' },
];

const VIRTUAL_BACKGROUNDS = [
  { id: 'none', label: 'None', color: null },
  { id: 'blur', label: 'Blur', color: null },
  { id: 'gradient-1', label: 'Gradient Purple', color: 'bg-gradient-to-br from-purple-600 to-blue-600' },
  { id: 'gradient-2', label: 'Gradient Gold', color: 'bg-gradient-to-br from-amber-500 to-orange-600' },
  { id: 'solid-dark', label: 'Dark', color: 'bg-zinc-900' },
  { id: 'solid-light', label: 'Light', color: 'bg-zinc-100' },
];

const RecordingStudio = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const podcastId = searchParams.get('podcastId');
  const { toast } = useToast();

  const [recordingType, setRecordingType] = useState<RecordingType>('video');
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('webcam');
  const [sessionMode, setSessionMode] = useState<SessionMode>('record');
  const [layout, setLayout] = useState<LayoutType>('fullscreen');
  const [virtualBackground, setVirtualBackground] = useState('none');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [teleprompterText, setTeleprompterText] = useState('');
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(2);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [audioOnlyStream, setAudioOnlyStream] = useState<MediaStream | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitedGuests, setInvitedGuests] = useState<InvitedGuest[]>([]);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [streamingDestinations, setStreamingDestinations] = useState<StreamingDestination[]>([
    { id: 'youtube', name: 'YouTube', icon: Youtube, enabled: false, rtmpUrl: '' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, enabled: false, rtmpUrl: '' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, enabled: false, rtmpUrl: '' },
    { id: 'rtmp', name: 'Custom RTMP', icon: Radio, enabled: false, rtmpUrl: '' },
  ]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');

  const webcamRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioAnimationRef = useRef<number | null>(null);

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audio = devices.filter(d => d.kind === 'audioinput' && d.deviceId);
      const video = devices.filter(d => d.kind === 'videoinput' && d.deviceId);
      setAudioDevices(audio);
      setVideoDevices(video);
      if (!selectedAudioDevice && audio.length > 0 && audio[0].deviceId) setSelectedAudioDevice(audio[0].deviceId);
      if (!selectedVideoDevice && video.length > 0 && video[0].deviceId) setSelectedVideoDevice(video[0].deviceId);
    } catch (e) {
      console.error('Error enumerating devices:', e);
    }
  };

  useEffect(() => {
    enumerateDevices();
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    return () => {
      stopAllStreams();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopAllStreams = () => {
    webcamStream?.getTracks().forEach(track => track.stop());
    screenStream?.getTracks().forEach(track => track.stop());
    audioOnlyStream?.getTracks().forEach(track => track.stop());
    if (audioAnimationRef.current) cancelAnimationFrame(audioAnimationRef.current);
    setWebcamStream(null);
    setScreenStream(null);
    setAudioOnlyStream(null);
    setAudioLevel(0);
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedVideoDevice 
          ? { deviceId: { exact: selectedVideoDevice }, width: 1920, height: 1080 }
          : { width: 1920, height: 1080, facingMode: 'user' },
        audio: selectedAudioDevice 
          ? { deviceId: { exact: selectedAudioDevice } }
          : true,
      });
      setWebcamStream(stream);
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
      }
      enumerateDevices();
      toast({ title: 'Camera ready', description: 'Webcam connected successfully' });
    } catch (error) {
      console.error('Error accessing webcam:', error);
      toast({ title: 'Camera error', description: 'Could not access webcam', variant: 'destructive' });
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080 },
        audio: true
      });
      setScreenStream(stream);
      if (screenRef.current) {
        screenRef.current.srcObject = stream;
      }
      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
      };
      toast({ title: 'Screen share ready', description: 'Screen sharing started' });
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast({ title: 'Screen share error', description: 'Could not start screen share', variant: 'destructive' });
    }
  };

  const startAudioOnly = async () => {
    try {
      const audioConstraints = selectedAudioDevice 
        ? { deviceId: { exact: selectedAudioDevice } }
        : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
      setAudioOnlyStream(stream);
      enumerateDevices();
      
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        audioAnimationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
      
      toast({ title: 'Microphone ready', description: 'Audio input connected' });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({ title: 'Microphone error', description: 'Could not access microphone', variant: 'destructive' });
    }
  };

  const stopAudioOnly = () => {
    audioOnlyStream?.getTracks().forEach(track => track.stop());
    setAudioOnlyStream(null);
    if (audioAnimationRef.current) cancelAnimationFrame(audioAnimationRef.current);
    setAudioLevel(0);
  };

  const handleCoverImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validatePodcastCoverImage(file);
    if (!validation.valid) {
      toast({ title: 'Invalid cover art', description: validation.error, variant: 'destructive' });
      if (coverImageInputRef.current) coverImageInputRef.current.value = "";
      return;
    }

    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
  };

  const startRecording = () => {
    const streamToRecord = recordingType === 'audio' 
      ? audioOnlyStream 
      : (recordingMode === 'screen' ? screenStream : webcamStream);
    if (!streamToRecord) {
      toast({ title: 'No source', description: recordingType === 'audio' ? 'Please start microphone first' : 'Please start camera or screen share first', variant: 'destructive' });
      return;
    }

    try {
      const isAudio = recordingType === 'audio';
      
      let mimeType: string;
      if (isAudio) {
        const audioTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
        mimeType = audioTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
      } else {
        const videoTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
        mimeType = videoTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
      }
      
      const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(streamToRecord, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blobType = mimeType || (isAudio ? 'audio/webm' : 'video/webm');
        const blob = new Blob(recordedChunksRef.current, { type: blobType });

        if (isAudio && user) {
          setIsSaving(true);
          setSaveProgress(10);
          try {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
            const filePath = `${user.id}/${fileName}`;

            const { data: session } = await supabase.auth.getSession();
            if (!session?.session) throw new Error('Not authenticated');

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const uploadUrl = `${supabaseUrl}/storage/v1/object/media-uploads/${filePath}`;
            const uploadRes = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${session.session.access_token}`,
                'Content-Type': blobType,
              },
              body: blob,
            });
            if (!uploadRes.ok) throw new Error('Upload failed');
            setSaveProgress(40);

            let coverUrl: string | undefined;
            if (coverImageFile) {
              const coverExt = coverImageFile.name.split('.').pop();
              const coverPath = `episode-covers/${user.id}/${Date.now()}.${coverExt}`;
              const coverUploadUrl = `${supabaseUrl}/storage/v1/object/creator-assets/${coverPath}`;
              const coverRes = await fetch(coverUploadUrl, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${session.session.access_token}`,
                  'Content-Type': coverImageFile.type,
                },
                body: coverImageFile,
              });
              if (coverRes.ok) {
                const { data: pubUrl } = supabase.storage.from('creator-assets').getPublicUrl(coverPath);
                coverUrl = pubUrl.publicUrl;
              }
            }
            setSaveProgress(55);

            const { data: pubUrlData } = supabase.storage
              .from('media-uploads')
              .getPublicUrl(filePath);
            const publicAudioUrl = pubUrlData.publicUrl;

            if (podcastId) {
              // Create episode linked to the podcast
              const nextEpRes = await (supabase as any)
                .from('episodes')
                .select('episode_number')
                .eq('podcast_id', podcastId)
                .order('episode_number', { ascending: false })
                .limit(1);
              const nextNumber = ((nextEpRes.data?.[0]?.episode_number) || 0) + 1;

              const { data: episode, error: epError } = await (supabase as any)
                .from('episodes')
                .insert({
                  podcast_id: podcastId,
                  user_id: user.id,
                  title: `Episode ${nextNumber} – ${new Date().toLocaleDateString()}`,
                  audio_url: publicAudioUrl,
                  file_size_bytes: blob.size,
                  duration_seconds: Math.round(recordingTime),
                  episode_number: nextNumber,
                  status: 'published',
                  pub_date: new Date().toISOString(),
                  image_url: coverUrl || null,
                })
                .select()
                .single();
              if (epError) throw epError;
              setSaveProgress(85);

              // Also create a project for Refiner access
              const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert({
                  user_id: user.id,
                  title: `Episode ${nextNumber} – ${new Date().toLocaleDateString()}`,
                  source_file_url: filePath,
                  source_file_name: `recording-${Date.now()}.webm`,
                  source_file_type: 'audio',
                  source_file_size: blob.size,
                  source_duration_seconds: Math.round(recordingTime),
                  status: 'alchifying',
                })
                .select()
                .single();
              if (projectError) throw projectError;
              setSaveProgress(95);

              try {
                await supabase.functions.invoke('transcribe-audio', {
                  body: { projectId: project.id },
                });
              } catch (e) {
                console.error('Auto-transcription error:', e);
              }
              setSaveProgress(100);

              toast({ title: 'Episode saved! 🎙️', description: 'Linked to your podcast and heading to Refiner...' });
              setTimeout(() => {
                setIsSaving(false);
                navigate(`/refiner/${project.id}`);
              }, 600);
            } else {
              // No podcast context — original flow
              const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert({
                  user_id: user.id,
                  title: `Audio Recording ${new Date().toLocaleDateString()}`,
                  source_file_url: filePath,
                  source_file_name: `recording-${Date.now()}.webm`,
                  source_file_type: 'audio',
                  source_file_size: blob.size,
                  status: 'alchifying',
                })
                .select()
                .single();
              if (projectError) throw projectError;
              setSaveProgress(70);

              try {
                await supabase.functions.invoke('transcribe-audio', {
                  body: { projectId: project.id },
                });
              } catch (e) {
                console.error('Auto-transcription error:', e);
              }
              setSaveProgress(100);

              toast({ title: 'Recording saved! ✨', description: 'Heading to Refiner Studio...' });
              setTimeout(() => {
                setIsSaving(false);
                navigate(`/refiner/${project.id}`);
              }, 600);
            }
          } catch (err) {
            console.error('Save error:', err);
            setIsSaving(false);
            toast({ title: 'Save failed', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audio-${Date.now()}.webm`;
            a.click();
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `recording-${Date.now()}.webm`;
          a.click();
          toast({ title: 'Recording saved', description: 'Your recording has been downloaded' });
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({ title: 'Recording started', description: 'Your recording is now in progress' });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({ title: 'Recording error', description: 'Could not start recording', variant: 'destructive' });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = window.setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const toggleMic = () => {
    if (webcamStream) {
      webcamStream.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if (webcamStream) {
      webcamStream.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPipPositionClass = (layout: LayoutType) => {
    switch (layout) {
      case 'pip-bottom-right': return 'bottom-4 right-4';
      case 'pip-bottom-left': return 'bottom-4 left-4';
      case 'pip-top-right': return 'top-4 right-4';
      case 'pip-top-left': return 'top-4 left-4';
      default: return 'bottom-4 right-4';
    }
  };

  const generateInviteLink = () => {
    const sessionId = crypto.randomUUID().slice(0, 8);
    return `${window.location.origin}/studio/join/${sessionId}`;
  };

  const copyInviteLink = () => {
    const link = generateInviteLink();
    navigator.clipboard.writeText(link);
    setInviteLinkCopied(true);
    setTimeout(() => setInviteLinkCopied(false), 2000);
    toast({ title: 'Link copied', description: 'Invite link copied to clipboard' });
  };

  const sendEmailInvite = () => {
    if (!inviteEmail || !inviteName) {
      toast({ title: 'Missing info', description: 'Please enter guest name and email', variant: 'destructive' });
      return;
    }
    const newGuest: InvitedGuest = {
      id: crypto.randomUUID(),
      email: inviteEmail,
      name: inviteName,
      status: 'pending',
    };
    setInvitedGuests(prev => [...prev, newGuest]);
    setInviteEmail('');
    setInviteName('');
    toast({ title: 'Invite sent!', description: `Invitation email sent to ${inviteName} at ${inviteEmail}` });
    
    setTimeout(() => {
      setInvitedGuests(prev => prev.map(g => 
        g.id === newGuest.id ? { ...g, status: 'joined' as const } : g
      ));
      toast({ title: 'Guest joined!', description: `${inviteName} has joined the session` });
    }, 5000);
  };

  const toggleStreamingDestination = (id: string) => {
    setStreamingDestinations(prev => prev.map(dest =>
      dest.id === id ? { ...dest, enabled: !dest.enabled } : dest
    ));
  };

  const updateRtmpUrl = (id: string, url: string) => {
    setStreamingDestinations(prev => prev.map(dest =>
      dest.id === id ? { ...dest, rtmpUrl: url } : dest
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="dark">
      <Helmet>
        <title>Recording Studio - Alchify</title>
        <meta name="description" content="Professional recording studio with webcam, screen capture, virtual backgrounds, and teleprompter" />
      </Helmet>

      <AppLayout defaultSidebarOpen={false}>
        {/* Save overlay */}
        {isSaving && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center">
            <Card className="w-96 border-primary/20 shadow-xl">
              <CardContent className="p-8 space-y-5 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg mb-1">Saving Recording...</CardTitle>
                  <p className="text-sm text-muted-foreground">Uploading and preparing your content</p>
                </div>
                <Progress value={saveProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">{saveProgress}% complete</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="p-4 lg:p-6 space-y-5 bg-background min-h-screen">
          {/* Studio Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h1 className="text-xl font-bold tracking-tight">Recording Studio</h1>
              </div>
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse flex items-center gap-2 px-3 py-1 text-xs font-mono">
                  <Circle className="h-2.5 w-2.5 fill-current" />
                  {sessionMode === 'stream-record' && 'LIVE • '}
                  REC {formatTime(recordingTime)}
                </Badge>
              )}
              {invitedGuests.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1.5 px-3">
                  <Users className="h-3.5 w-3.5" />
                  {invitedGuests.length} guest{invitedGuests.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Recording Type Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
                <Button
                  variant={recordingType === 'video' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRecordingType('video')}
                  disabled={isRecording}
                  className="h-8 px-3 text-xs"
                >
                  <Video className="h-3.5 w-3.5 mr-1.5" />
                  Video
                </Button>
                <Button
                  variant={recordingType === 'audio' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setRecordingType('audio')}
                  disabled={isRecording}
                  className="h-8 px-3 text-xs"
                >
                  <Headphones className="h-3.5 w-3.5 mr-1.5" />
                  Audio
                </Button>
              </div>

              <div className="h-6 w-px bg-border/50" />

              {/* Session Mode Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
                <Button
                  variant={sessionMode === 'record' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSessionMode('record')}
                  className="h-8 px-3 text-xs"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Record
                </Button>
                <Button
                  variant={sessionMode === 'stream-record' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSessionMode('stream-record')}
                  className="h-8 px-3 text-xs"
                >
                  <Radio className="h-3.5 w-3.5 mr-1.5" />
                  Stream + Record
                </Button>
              </div>

              <div className="h-6 w-px bg-border/50" />

              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Invite Guest
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Guest to Session</DialogTitle>
                    <DialogDescription>Share a link or send an email invitation</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Shareable Link</Label>
                      <div className="flex gap-2">
                        <Input value={generateInviteLink()} readOnly className="text-sm" />
                        <Button variant="outline" size="icon" onClick={copyInviteLink}>
                          {inviteLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">or send email</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="guest-name">Guest Name</Label>
                        <Input id="guest-name" placeholder="Enter name" value={inviteName} onChange={e => setInviteName(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="guest-email">Guest Email</Label>
                        <Input id="guest-email" type="email" placeholder="Enter email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                      </div>
                      <Button className="w-full" onClick={sendEmailInvite}>
                        <Mail className="h-4 w-4 mr-2" />Send Invitation
                      </Button>
                    </div>
                    {invitedGuests.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <Label>Invited Guests</Label>
                        <div className="space-y-2">
                          {invitedGuests.map(guest => (
                            <div key={guest.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                              <div>
                                <div className="font-medium text-sm">{guest.name}</div>
                                <div className="text-xs text-muted-foreground">{guest.email}</div>
                              </div>
                              <Badge variant={guest.status === 'joined' ? 'default' : 'secondary'}>{guest.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Streaming Destinations Bar */}
          {sessionMode === 'stream-record' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Stream to</span>
                <div className="h-4 w-px bg-border" />
                {streamingDestinations.map(dest => {
                  const Icon = dest.icon;
                  return (
                    <Button key={dest.id} variant={dest.enabled ? 'default' : 'outline'} size="sm" onClick={() => toggleStreamingDestination(dest.id)} className="h-8 text-xs">
                      <Icon className="h-3.5 w-3.5 mr-1.5" />{dest.name}
                    </Button>
                  );
                })}
                {streamingDestinations.some(d => d.enabled) && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    {streamingDestinations.filter(d => d.enabled).map(dest => (
                      <div key={dest.id} className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">{dest.name}:</Label>
                        <Input placeholder={`Enter ${dest.id === 'rtmp' ? 'RTMP URL' : 'Stream Key'}`} value={dest.rtmpUrl} onChange={e => updateRtmpUrl(dest.id, e.target.value)} className="w-56 h-8 text-xs" />
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
            {/* Main Preview Area */}
            <div className="xl:col-span-3 space-y-3">
              {/* Preview Monitor */}
              <Card className="overflow-hidden border-2 border-border/50 shadow-lg">
                <CardContent className="p-0">
                  {recordingType === 'audio' ? (
                    <div className="aspect-video bg-gradient-to-b from-muted to-muted/80 flex flex-col items-center justify-center p-8 gap-6 relative">
                      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                      
                      <div
                        className="w-44 h-44 rounded-2xl border-2 border-dashed border-border/60 flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary/60 transition-all duration-300 shrink-0 shadow-md hover:shadow-lg relative z-10 group"
                        onClick={() => coverImageInputRef.current?.click()}
                      >
                        {coverImagePreview ? (
                          <img src={coverImagePreview} alt="Episode cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                            <ImagePlus className="w-8 h-8" />
                            <span className="text-xs font-medium">Episode Cover</span>
                            <span className="text-[10px] opacity-60">1400×1400px</span>
                          </div>
                        )}
                      </div>
                      {coverImagePreview && (
                        <Button variant="ghost" size="sm" onClick={removeCoverImage} className="relative z-10 text-xs">
                          <X className="w-3.5 h-3.5 mr-1" /> Remove Cover
                        </Button>
                      )}
                      <input ref={coverImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImageSelect} />

                      {audioOnlyStream ? (
                        <div className="flex flex-col items-center gap-4 relative z-10">
                          <div className="flex items-end gap-[3px] h-20 px-4 py-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/30">
                            {Array.from({ length: 32 }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1.5 rounded-full bg-primary transition-all duration-75"
                                style={{
                                  height: `${Math.max(4, audioLevel * 72 * (0.4 + Math.random() * 0.6))}px`,
                                  opacity: audioLevel > 0.02 ? 0.6 + Math.random() * 0.4 : 0.2,
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {isRecording ? (isPaused ? '⏸ Paused' : '🔴 Recording...') : '✓ Microphone connected — ready to record'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-muted-foreground relative z-10">
                          <div className="w-20 h-20 rounded-full bg-muted-foreground/5 border border-border/50 flex items-center justify-center">
                            <Mic className="h-8 w-8 opacity-40" />
                          </div>
                          <div className="text-center">
                            <p className="text-base font-medium">Start your microphone to begin</p>
                            <p className="text-xs opacity-60 mt-1">Click "Start Mic" in the controls below</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-muted">
                      {recordingMode === 'webcam' || recordingMode === 'screen-webcam' ? (
                        layout === 'split' ? (
                          <div className="flex h-full">
                            <video ref={screenRef} autoPlay muted playsInline className="w-1/2 h-full object-cover" />
                            <div className="w-px bg-background" />
                            <video ref={webcamRef} autoPlay muted playsInline className="w-1/2 h-full object-cover" />
                          </div>
                        ) : (
                          <>
                            <video ref={recordingMode === 'screen-webcam' ? screenRef : webcamRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                            {recordingMode === 'screen-webcam' && layout !== 'fullscreen' && (
                              <div className={`absolute ${getPipPositionClass(layout)} w-48 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-background/80 ring-1 ring-border/20`}>
                                <video ref={webcamRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                              </div>
                            )}
                          </>
                        )
                      ) : (
                        <video ref={screenRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                      )}

                      {showTeleprompter && teleprompterText && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent p-8">
                          <div className="text-foreground text-xl font-medium text-center max-w-3xl mx-auto leading-relaxed drop-shadow-sm">
                            {teleprompterText}
                          </div>
                        </div>
                      )}

                      {!webcamStream && !screenStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                          <div className="w-24 h-24 rounded-full bg-muted-foreground/5 border border-border/50 flex items-center justify-center mb-5">
                            <Camera className="h-10 w-10 opacity-40" />
                          </div>
                          <p className="text-lg font-medium">Select a source to begin</p>
                          <p className="text-sm opacity-60 mt-1">Click the buttons below to start your camera or screen share</p>
                        </div>
                      )}

                      {isRecording && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/30">
                          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                          <span className="text-xs font-mono font-medium">{formatTime(recordingTime)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Controls Bar */}
              <Card className="border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    {/* Source Buttons */}
                    <div className="flex items-center gap-2">
                      {recordingType === 'audio' ? (
                        <>
                          <Button variant={audioOnlyStream ? 'default' : 'outline'} size="sm" onClick={audioOnlyStream ? stopAudioOnly : startAudioOnly} className="h-9">
                            <Mic className="h-4 w-4 mr-2" />{audioOnlyStream ? 'Stop Mic' : 'Start Mic'}
                          </Button>
                          {audioDevices.length > 0 && (
                            <Select value={selectedAudioDevice} onValueChange={(val) => { setSelectedAudioDevice(val); if (audioOnlyStream) { stopAudioOnly(); setTimeout(() => startAudioOnly(), 100); } }}>
                              <SelectTrigger className="w-44 h-9 text-xs border-border/50">
                                <Mic className="h-3 w-3 mr-1 text-muted-foreground" /><SelectValue placeholder="Select Microphone" />
                              </SelectTrigger>
                              <SelectContent>
                                {audioDevices.filter(d => d.deviceId).map((d, i) => (
                                  <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${i + 1}`}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      ) : (
                        <>
                          <Button variant={webcamStream ? 'default' : 'outline'} size="sm" onClick={webcamStream ? () => { webcamStream.getTracks().forEach(t => t.stop()); setWebcamStream(null); } : startWebcam} className="h-9">
                            <User className="h-4 w-4 mr-2" />{webcamStream ? 'Stop Camera' : 'Start Camera'}
                          </Button>
                          <Button variant={screenStream ? 'default' : 'outline'} size="sm" onClick={screenStream ? () => { screenStream.getTracks().forEach(t => t.stop()); setScreenStream(null); } : startScreenShare} className="h-9">
                            <ScreenShare className="h-4 w-4 mr-2" />{screenStream ? 'Stop Share' : 'Share Screen'}
                          </Button>
                          {videoDevices.length > 0 && (
                            <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                              <SelectTrigger className="w-40 h-9 text-xs border-border/50">
                                <Camera className="h-3 w-3 mr-1 text-muted-foreground" /><SelectValue placeholder="Camera" />
                              </SelectTrigger>
                              <SelectContent>
                                {videoDevices.filter(d => d.deviceId).map((d, i) => (
                                  <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {audioDevices.length > 0 && (
                            <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                              <SelectTrigger className="w-40 h-9 text-xs border-border/50">
                                <Mic className="h-3 w-3 mr-1 text-muted-foreground" /><SelectValue placeholder="Microphone" />
                              </SelectTrigger>
                              <SelectContent>
                                {audioDevices.filter(d => d.deviceId).map((d, i) => (
                                  <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${i + 1}`}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      )}
                    </div>

                    {/* Recording Controls - Center */}
                    <div className="flex items-center gap-2">
                      {recordingType === 'video' && (
                        <>
                          <Button variant="ghost" size="icon" onClick={toggleMic} disabled={!webcamStream} className={`h-9 w-9 rounded-full ${!isMicOn ? 'bg-destructive/10' : ''}`}>
                            {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4 text-destructive" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={toggleCamera} disabled={!webcamStream} className={`h-9 w-9 rounded-full ${!isCameraOn ? 'bg-destructive/10' : ''}`}>
                            {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4 text-destructive" />}
                          </Button>
                          <div className="h-6 w-px bg-border/50" />
                        </>
                      )}

                      {!isRecording ? (
                        <Button variant="destructive" onClick={startRecording} disabled={recordingType === 'audio' ? !audioOnlyStream : (!webcamStream && !screenStream)} className="h-10 px-6 rounded-full shadow-lg">
                          {sessionMode === 'stream-record' ? (
                            <><Radio className="h-4 w-4 mr-2" /> Go Live</>
                          ) : (
                            <><Circle className="h-4 w-4 mr-2 fill-current" /> Record</>
                          )}
                        </Button>
                      ) : (
                        <>
                          <Button variant="outline" onClick={pauseRecording} className="h-9 w-9 rounded-full" size="icon">
                            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </Button>
                          <Button variant="destructive" onClick={stopRecording} className="h-10 px-5 rounded-full">
                            <Square className="h-3.5 w-3.5 mr-2 fill-current" /> Stop
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Mode Selection */}
                    {recordingType === 'video' ? (
                      <Select value={recordingMode} onValueChange={(v: RecordingMode) => setRecordingMode(v)}>
                        <SelectTrigger className="w-44 h-9 text-xs border-border/50">
                          <Layout className="h-3 w-3 mr-1 text-muted-foreground" /><SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="webcam">Webcam Only</SelectItem>
                          <SelectItem value="screen">Screen Only</SelectItem>
                          <SelectItem value="screen-webcam">Screen + Webcam</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="w-44" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-4">
              <Tabs defaultValue="layout" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-10">
                  <TabsTrigger value="layout" className="text-xs gap-1.5">
                    <Layout className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Layout</span>
                  </TabsTrigger>
                  <TabsTrigger value="background" className="text-xs gap-1.5">
                    <Image className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">BG</span>
                  </TabsTrigger>
                  <TabsTrigger value="teleprompter" className="text-xs gap-1.5">
                    <Type className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Script</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="layout" className="mt-3">
                  <Card>
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Layout</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 px-4 pb-4">
                      {LAYOUTS.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => setLayout(l.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                            layout === l.id 
                              ? 'border-primary bg-primary/10 shadow-sm' 
                              : 'border-transparent hover:border-border hover:bg-muted/50'
                          }`}
                        >
                          <div className="font-medium text-xs">{l.label}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{l.description}</div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="background" className="mt-3">
                  <Card>
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Virtual Background</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="grid grid-cols-2 gap-2">
                        {VIRTUAL_BACKGROUNDS.map((bg) => (
                          <button
                            key={bg.id}
                            onClick={() => setVirtualBackground(bg.id)}
                            className={`aspect-video rounded-lg border-2 transition-all duration-200 relative overflow-hidden ${
                              virtualBackground === bg.id 
                                ? 'border-primary ring-2 ring-primary/20 shadow-sm' 
                                : 'border-border/50 hover:border-border'
                            } ${bg.color || 'bg-muted'}`}
                          >
                            {virtualBackground === bg.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                                <Check className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <span className="sr-only">{bg.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3 text-center">
                        Virtual backgrounds require browser support
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="teleprompter" className="mt-3">
                  <Card>
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teleprompter</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 pb-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="teleprompter-toggle" className="text-xs">Enable</Label>
                        <Switch id="teleprompter-toggle" checked={showTeleprompter} onCheckedChange={setShowTeleprompter} />
                      </div>
                      <Textarea
                        placeholder="Paste your script here..."
                        value={teleprompterText}
                        onChange={(e) => setTeleprompterText(e.target.value)}
                        className="min-h-[140px] text-xs resize-none"
                      />
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">Scroll Speed</Label>
                        <Select value={teleprompterSpeed.toString()} onValueChange={(v) => setTeleprompterSpeed(parseInt(v))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Slow</SelectItem>
                            <SelectItem value="2">Normal</SelectItem>
                            <SelectItem value="3">Fast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </AppLayout>
    </div>
  );
};

export default RecordingStudio;
