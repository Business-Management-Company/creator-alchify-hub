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
import { useNavigate } from 'react-router-dom';
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
  Users
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  const { toast } = useToast();
  
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
  
  // Guest invite state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitedGuests, setInvitedGuests] = useState<InvitedGuest[]>([]);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  
  // Streaming destinations state
  const [streamingDestinations, setStreamingDestinations] = useState<StreamingDestination[]>([
    { id: 'youtube', name: 'YouTube', icon: Youtube, enabled: false, rtmpUrl: '' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, enabled: false, rtmpUrl: '' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, enabled: false, rtmpUrl: '' },
    { id: 'rtmp', name: 'Custom RTMP', icon: Radio, enabled: false, rtmpUrl: '' },
  ]);
  
  const webcamRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

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
    setWebcamStream(null);
    setScreenStream(null);
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080, facingMode: 'user' },
        audio: true
      });
      setWebcamStream(stream);
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
      }
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

  const startRecording = () => {
    const streamToRecord = recordingMode === 'screen' ? screenStream : webcamStream;
    if (!streamToRecord) {
      toast({ title: 'No source', description: 'Please start camera or screen share first', variant: 'destructive' });
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(streamToRecord, { mimeType: 'video/webm;codecs=vp9' });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        // For now, just download - later integrate with post-production
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        a.click();
        toast({ title: 'Recording saved', description: 'Your recording has been downloaded' });
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
    // Generate a unique session invite link
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
    
    // Simulate guest joining after a delay for demo purposes
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
        <div className="p-6 space-y-6 bg-background min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Recording Studio</h1>
              <p className="text-muted-foreground mt-1">Create professional recordings with ease</p>
            </div>
            <div className="flex items-center gap-3">
              {invitedGuests.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {invitedGuests.length} guest{invitedGuests.length > 1 ? 's' : ''}
                </Badge>
              )}
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse flex items-center gap-2">
                  <Circle className="h-3 w-3 fill-current" />
                  {sessionMode === 'stream-record' && 'LIVE • '}
                  REC {formatTime(recordingTime)}
                </Badge>
              )}
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Guest
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Guest to Session</DialogTitle>
                    <DialogDescription>
                      Share a link or send an email invitation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {/* Share Link */}
                    <div className="space-y-2">
                      <Label>Shareable Link</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={generateInviteLink()} 
                          readOnly 
                          className="text-sm"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={copyInviteLink}
                        >
                          {inviteLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">or send email</span>
                      </div>
                    </div>
                    
                    {/* Email Invite */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="guest-name">Guest Name</Label>
                        <Input 
                          id="guest-name"
                          placeholder="Enter name"
                          value={inviteName}
                          onChange={e => setInviteName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="guest-email">Guest Email</Label>
                        <Input 
                          id="guest-email"
                          type="email"
                          placeholder="Enter email"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <Button className="w-full" onClick={sendEmailInvite}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </Button>
                    </div>
                    
                    {/* Invited Guests List */}
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
                              <Badge variant={guest.status === 'joined' ? 'default' : 'secondary'}>
                                {guest.status}
                              </Badge>
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

          {/* Session Mode Selection */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">Session Mode:</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={sessionMode === 'record' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSessionMode('record')}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Record Only
                    </Button>
                    <Button
                      variant={sessionMode === 'stream-record' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSessionMode('stream-record')}
                    >
                      <Radio className="h-4 w-4 mr-2" />
                      Stream + Record
                    </Button>
                  </div>
                </div>
                
                {sessionMode === 'stream-record' && (
                  <div className="flex items-center gap-3 ml-auto">
                    <Label className="text-sm">Stream to:</Label>
                    {streamingDestinations.map(dest => {
                      const Icon = dest.icon;
                      return (
                        <Button
                          key={dest.id}
                          variant={dest.enabled ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleStreamingDestination(dest.id)}
                          title={dest.name}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* RTMP URLs for enabled streaming destinations */}
              {sessionMode === 'stream-record' && streamingDestinations.some(d => d.enabled) && (
                <div className="mt-4 space-y-2">
                  {streamingDestinations.filter(d => d.enabled).map(dest => (
                    <div key={dest.id} className="flex items-center gap-2">
                      <Label className="w-24 text-sm">{dest.name}:</Label>
                      <Input
                        placeholder={`Enter ${dest.id === 'rtmp' ? 'RTMP URL' : 'Stream Key'}`}
                        value={dest.rtmpUrl}
                        onChange={e => updateRtmpUrl(dest.id, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Preview Area */}
            <div className="xl:col-span-3 space-y-4">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-muted">
                    {/* Main Video Preview */}
                    {recordingMode === 'webcam' || recordingMode === 'screen-webcam' ? (
                      layout === 'split' ? (
                        <div className="flex h-full">
                          <video
                            ref={screenRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-1/2 h-full object-cover"
                          />
                          <video
                            ref={webcamRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-1/2 h-full object-cover"
                          />
                        </div>
                      ) : (
                        <>
                          <video
                            ref={recordingMode === 'screen-webcam' ? screenRef : webcamRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          {recordingMode === 'screen-webcam' && layout !== 'fullscreen' && (
                            <div className={`absolute ${getPipPositionClass(layout)} w-48 aspect-video rounded-lg overflow-hidden shadow-lg border-2 border-background`}>
                              <video
                                ref={webcamRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </>
                      )
                    ) : (
                      <video
                        ref={screenRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Teleprompter Overlay */}
                    {showTeleprompter && teleprompterText && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                        <div className="text-white text-xl font-medium text-center max-w-3xl mx-auto leading-relaxed">
                          {teleprompterText}
                        </div>
                      </div>
                    )}

                    {/* No Source Placeholder */}
                    {!webcamStream && !screenStream && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <Camera className="h-16 w-16 mb-4 opacity-50" />
                        <p className="text-lg">Select a source to begin</p>
                        <p className="text-sm">Click the buttons below to start your camera or screen share</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Controls Bar */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Source Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={webcamStream ? 'default' : 'outline'}
                        size="sm"
                        onClick={webcamStream ? () => { webcamStream.getTracks().forEach(t => t.stop()); setWebcamStream(null); } : startWebcam}
                      >
                        <User className="h-4 w-4 mr-2" />
                        {webcamStream ? 'Stop Camera' : 'Start Camera'}
                      </Button>
                      <Button
                        variant={screenStream ? 'default' : 'outline'}
                        size="sm"
                        onClick={screenStream ? () => { screenStream.getTracks().forEach(t => t.stop()); setScreenStream(null); } : startScreenShare}
                      >
                        <ScreenShare className="h-4 w-4 mr-2" />
                        {screenStream ? 'Stop Share' : 'Share Screen'}
                      </Button>
                    </div>

                    {/* Recording Controls */}
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMic}
                        disabled={!webcamStream}
                      >
                        {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5 text-destructive" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleCamera}
                        disabled={!webcamStream}
                      >
                        {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5 text-destructive" />}
                      </Button>

                      <div className="h-6 w-px bg-border" />

                      {!isRecording ? (
                        <Button
                          variant="destructive"
                          onClick={startRecording}
                          disabled={!webcamStream && !screenStream}
                        >
                          {sessionMode === 'stream-record' ? (
                            <>
                              <Radio className="h-4 w-4 mr-2" />
                              Go Live
                            </>
                          ) : (
                            <>
                              <Circle className="h-4 w-4 mr-2 fill-current" />
                              Start Recording
                            </>
                          )}
                        </Button>
                      ) : (
                        <>
                          <Button variant="outline" onClick={pauseRecording}>
                            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </Button>
                          <Button variant="destructive" onClick={stopRecording}>
                            <Square className="h-4 w-4 mr-2 fill-current" />
                            Stop
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Mode Selection */}
                    <Select value={recordingMode} onValueChange={(v: RecordingMode) => setRecordingMode(v)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webcam">Webcam Only</SelectItem>
                        <SelectItem value="screen">Screen Only</SelectItem>
                        <SelectItem value="screen-webcam">Screen + Webcam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-4">
              <Tabs defaultValue="layout" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="layout"><Layout className="h-4 w-4" /></TabsTrigger>
                  <TabsTrigger value="background"><Image className="h-4 w-4" /></TabsTrigger>
                  <TabsTrigger value="teleprompter"><Type className="h-4 w-4" /></TabsTrigger>
                </TabsList>

                <TabsContent value="layout" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Layout</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {LAYOUTS.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => setLayout(l.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            layout === l.id 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="font-medium text-sm">{l.label}</div>
                          <div className="text-xs text-muted-foreground">{l.description}</div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="background" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Virtual Background</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {VIRTUAL_BACKGROUNDS.map((bg) => (
                          <button
                            key={bg.id}
                            onClick={() => setVirtualBackground(bg.id)}
                            className={`aspect-video rounded-lg border-2 transition-all ${
                              virtualBackground === bg.id 
                                ? 'border-primary ring-2 ring-primary/20' 
                                : 'border-border hover:border-primary/50'
                            } ${bg.color || 'bg-muted'}`}
                          >
                            <span className="sr-only">{bg.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Note: Virtual backgrounds require browser support
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="teleprompter" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Teleprompter</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="teleprompter-toggle">Enable</Label>
                        <Switch
                          id="teleprompter-toggle"
                          checked={showTeleprompter}
                          onCheckedChange={setShowTeleprompter}
                        />
                      </div>
                      <Textarea
                        placeholder="Enter your script here..."
                        value={teleprompterText}
                        onChange={(e) => setTeleprompterText(e.target.value)}
                        className="min-h-[150px] text-sm"
                      />
                      <div className="space-y-2">
                        <Label className="text-xs">Scroll Speed</Label>
                        <Select 
                          value={teleprompterSpeed.toString()} 
                          onValueChange={(v) => setTeleprompterSpeed(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
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
