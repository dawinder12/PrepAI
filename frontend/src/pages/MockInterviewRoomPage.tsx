import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Mic, 
  Volume2, 
  Clock, 
  Send, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  StopCircle, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Bot,
  User,
  VolumeX,
  Radio,
  FileText
} from 'lucide-react';
import { interviewsApi, InterviewSessionData, InterviewQuestionItem } from '../services/api';

const RECORDING_LIMIT_SECONDS = 60; // 1-minute recording limit

export const MockInterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);

  // Audio / Speech State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState(RECORDING_LIMIT_SECONDS);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [autoTTS, setAutoTTS] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 for mic visualizer
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [transcribingAudio, setTranscribingAudio] = useState(false);
  const [transcribeNotice, setTranscribeNotice] = useState<string | null>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  // Browser speech recognition refs
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');
  const liveTranscriptRef = useRef('');

  // Overall session stopwatch
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      try {
        const res = await interviewsApi.getSession(id);
        setSession(res.data);
        if (res.data.is_completed) {
          navigate(`/mock-interview/${id}/summary`);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id, navigate]);

  // Overall session stopwatch timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Active unanswered question
  const questionsList = session?.questions || [];
  const currentQuestion: InterviewQuestionItem | undefined =
    questionsList.find((q) => !q.is_answered) || questionsList.slice(-1)[0];

  const isFinalQuestion =
    session && currentQuestion
      ? currentQuestion.order_index >= session.total_questions
      : false;

  // Speak question with Text-To-Speech
  const handleSpeakQuestion = (textToSpeak?: string) => {
    const text = textToSpeak || currentQuestion?.question_text;
    if (!text) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.96;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeakingQuestion(true);
      utterance.onend = () => setIsSpeakingQuestion(false);
      utterance.onerror = () => setIsSpeakingQuestion(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    }
  };

  // Clean up audio visualizer
  const cleanupVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Stop recording
  const stopRecording = () => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Stop MediaRecorder (flushes data and fires onstop)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    // Stop Web Speech API
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    cleanupVisualizer();
  };

  // Component cleanup
  useEffect(() => {
    return () => {
      stopRecording();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, []);

  // Process the finished audio blob: create playback URL & auto-transcribe with Gemini
  const handleAudioRecordingFinished = async (blob: Blob) => {
    const audioUrl = URL.createObjectURL(blob);
    setRecordedAudioUrl(audioUrl);

    // AI Audio Transcription via backend
    setTranscribingAudio(true);
    setTranscribeNotice('AI transcribing your spoken response...');
    try {
      const res = await interviewsApi.transcribeAudio(blob);
      if (res.data?.success && res.data?.transcript) {
        const aiTranscript = res.data.transcript.trim();
        if (aiTranscript) {
          setAnswerText((prev) => {
            const trimmedPrev = prev.trim();
            if (!trimmedPrev) return aiTranscript;
            if (trimmedPrev.toLowerCase() === aiTranscript.toLowerCase()) return trimmedPrev;
            return `${trimmedPrev} ${aiTranscript}`.trim();
          });
          setTranscribeNotice('Spoken response transcribed and verified ✓');
        } else {
          setTranscribeNotice('Audio saved. Review playback or type your answer.');
        }
      } else {
        setTranscribeNotice('Audio saved. Review playback or edit your response.');
      }
    } catch (err) {
      console.warn('Audio transcription error:', err);
      setTranscribeNotice('Audio recorded. You can play it back or edit below.');
    } finally {
      setTranscribingAudio(false);
      setTimeout(() => {
        setTranscribeNotice(null);
      }, 5000);
    }
  };

  // Toggle voice recording
  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    // Stop any active TTS if candidate starts speaking
    handleStopSpeaking();

    // Reset previous audio
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }

    baseTextRef.current = answerText.trim();
    liveTranscriptRef.current = '';
    audioChunksRef.current = [];
    setRecordingSecondsLeft(RECORDING_LIMIT_SECONDS);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = stream;

      // Setup audio level visualizer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (!isRecordingRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        }
      } catch (e) {
        console.warn('Visualizer setup notice:', e);
      }

      // Setup MediaRecorder
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (finalBlob.size > 0) {
          handleAudioRecordingFinished(finalBlob);
        }
        // Safely stop stream tracks after data collection
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
          audioStreamRef.current = null;
        }
      };

      mediaRecorder.start(250);

      // Launch streaming SpeechRecognition for live typing
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = navigator.language || 'en-US';

          recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';

            for (let i = 0; i < event.results.length; i++) {
              const item = event.results[i];
              if (item.isFinal) {
                final += item[0].transcript + ' ';
              } else {
                interim += item[0].transcript;
              }
            }

            if (final) {
              liveTranscriptRef.current += final;
            }

            const currentLive = (
              (baseTextRef.current ? baseTextRef.current + ' ' : '') +
              liveTranscriptRef.current +
              (interim ? interim : '')
            ).trim();

            if (currentLive) {
              setAnswerText(currentLive);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('SpeechRecognition browser event:', event.error);
          };

          recognition.onend = () => {
            if (isRecordingRef.current) {
              try {
                recognition.start();
              } catch (e) {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('Browser speech start:', e);
        }
      }

      // Start 60s countdown
      isRecordingRef.current = true;
      setIsRecording(true);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSecondsLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      cleanupVisualizer();
      alert('Could not access microphone. Please allow microphone permissions or type your answer.');
    }
  };

  // Submit Answer to progress the conversation
  const handleSubmitAnswer = async () => {
    const finalAnswer = answerText.trim();
    if (!finalAnswer || !id) return;

    if (isRecordingRef.current) {
      stopRecording();
    }

    setSubmitting(true);
    setSubmissionNotice(null);

    try {
      const res = await interviewsApi.submitAnswer(id, finalAnswer, elapsedSeconds);
      setSession(res.data);

      if (res.data.is_completed) {
        // Conclude interview! Route to full scorecard
        navigate(`/mock-interview/${id}/summary`);
      } else {
        // Advance to next interactive turn
        setAnswerText('');
        if (recordedAudioUrl) {
          URL.revokeObjectURL(recordedAudioUrl);
          setRecordedAudioUrl(null);
        }
        setRecordingSecondsLeft(RECORDING_LIMIT_SECONDS);
        const nextQ = res.data.questions.find((q) => !q.is_answered);
        setSubmissionNotice(`Response submitted! Alex is asking follow-up turn ${nextQ?.order_index || 2}...`);
        
        // Auto-speak next question if autoTTS is enabled
        if (autoTTS && nextQ?.question_text) {
          setTimeout(() => {
            handleSpeakQuestion(nextQ.question_text);
          }, 800);
        }

        setTimeout(() => {
          setSubmissionNotice(null);
        }, 4000);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      alert(err.response?.data?.detail || 'Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndInterviewEarly = async () => {
    if (!id) return;
    const confirmEnd = window.confirm(
      'Are you sure you want to conclude the interview call now? Your performance report will be generated from the questions answered so far.'
    );
    if (!confirmEnd) return;

    if (isRecordingRef.current) {
      stopRecording();
    }

    try {
      await interviewsApi.completeSession(id);
      navigate(`/mock-interview/${id}/summary`);
    } catch (e) {
      navigate(`/mock-interview/${id}/summary`);
    }
  };

  const handleReRecord = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    setRecordingSecondsLeft(RECORDING_LIMIT_SECONDS);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-base text-slate-700 font-semibold font-heading">Connecting to live AI interview chamber...</p>
          <p className="text-xs text-slate-400 mt-1">Calibrating role expectations and questions</p>
        </div>
      </Layout>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-base text-slate-600">Interview session not found.</p>
        </div>
      </Layout>
    );
  }

  const recordingProgressPercent =
    ((RECORDING_LIMIT_SECONDS - recordingSecondsLeft) / RECORDING_LIMIT_SECONDS) * 100;
  const overallProgressPercent = Math.round(
    ((currentQuestion.order_index - 1) / (session.total_questions || 1)) * 100
  );

  return (
    <Layout fullWidth>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Call Header */}
        <div className="bg-slate-950 text-white p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl border border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping absolute"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wide font-heading">Live 1-on-1 AI Interview Call</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 text-[10px] font-semibold border border-indigo-700/60">
                  {session.interview_type} Track
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {session.target_role} • Level: {session.difficulty}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              Turn {currentQuestion.order_index} of {session.total_questions}
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(elapsedSeconds)}
            </span>
            <button
              onClick={handleEndInterviewEarly}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition text-xs font-semibold cursor-pointer font-sans"
            >
              Conclude Call & View Scorecard
            </button>
          </div>
        </div>

        {/* Transition Notice */}
        {submissionNotice && (
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{submissionNotice}</span>
          </div>
        )}

        {/* Main 2-Column Call Chamber */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Interactive Interviewer Feed & Candidate Console */}
          <div className="lg:col-span-7 space-y-6">
            {/* Alex (AI Interviewer) Video/Audio Feed Tile */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 ${
              isSpeakingQuestion
                ? 'bg-slate-950 text-white border-indigo-500 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-950 text-white border-slate-800 shadow-md'
            }`}>
              {/* Tile Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-heading flex items-center gap-2">
                      Alex (Principal Interviewer)
                      {isSpeakingQuestion && (
                        <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
                          <Radio className="w-3 h-3 animate-pulse text-indigo-400" />
                          Speaking
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Technical Assessment • {currentQuestion.category || 'Architecture'}
                    </div>
                  </div>
                </div>

                {/* TTS Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeakingQuestion) {
                        handleStopSpeaking();
                      } else {
                        handleSpeakQuestion();
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      isSpeakingQuestion
                        ? 'bg-indigo-600 text-white border-indigo-500 animate-pulse'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {isSpeakingQuestion ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        Mute Voice
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        Listen Aloud (TTS)
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoTTS(!autoTTS)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                      autoTTS
                        ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                    title="Toggle auto-reading question aloud on each turn"
                  >
                    Auto-read: {autoTTS ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Spoken Question Text */}
              <div className="pt-5 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                  Interviewer Question #{currentQuestion.order_index}
                </div>
                <h2 className="text-lg sm:text-xl font-bold leading-snug text-slate-100 font-heading">
                  "{currentQuestion.question_text}"
                </h2>
              </div>
            </div>

            {/* Candidate Response Tile */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading">
                    Your Response
                  </span>
                  {isRecording && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 animate-pulse font-mono">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                      Listening Live...
                    </span>
                  )}
                  {transcribingAudio && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                      AI Verifying Audio...
                    </span>
                  )}
                </div>

                {/* Voice Record Toggle & Countdown */}
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 text-white font-mono text-xs font-bold shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{formatTime(recordingSecondsLeft)}</span>
                      <span className="text-[10px] text-slate-400">/ 01:00</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleRecording}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                      isRecording
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <StopCircle className="w-4 h-4" />
                        Finish Speaking
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Speak via Voice (1 min)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic Live Audio Level Waveform when recording */}
              {isRecording && (
                <div className="p-3 bg-slate-950 rounded-xl space-y-2 border border-slate-800 text-white shadow-inner">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-2 text-rose-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      Microphone Capturing Voice
                    </span>
                    <span className="text-amber-400 font-bold">
                      Remaining: {formatTime(recordingSecondsLeft)}
                    </span>
                  </div>

                  {/* Audio visualizer bars */}
                  <div className="flex items-center gap-1.5 h-7 px-1">
                    {[15, 30, 50, 80, 95, 65, 45, 75, 90, 60, 35, 25, 45, 70, 85, 55].map((h, i) => {
                      const dynamicHeight = Math.max(
                        15,
                        Math.min(100, (h * audioLevel) / 45 + (Math.sin(i) * 10))
                      );
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-indigo-500 to-rose-400 rounded-full transition-all duration-75"
                          style={{ height: `${dynamicHeight}%` }}
                        ></div>
                      );
                    })}
                  </div>

                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${recordingProgressPercent}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Recorded Audio Playback Card */}
              {recordedAudioUrl && !isRecording && (
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/90 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-900 flex items-center gap-2 font-heading">
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                      Recorded Voice Audio (Ready to submit)
                    </span>
                    <button
                      type="button"
                      onClick={handleReRecord}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Re-record
                    </button>
                  </div>

                  {/* Native HTML5 Audio Player */}
                  <div className="pt-1">
                    <audio
                      src={recordedAudioUrl}
                      controls
                      className="w-full h-9 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Notice */}
              {transcribeNotice && (
                <div className="text-xs text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{transcribeNotice}</span>
                </div>
              )}

              {/* Answer Text Area */}
              <div>
                <textarea
                  rows={8}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Your response appears here automatically as you speak. You can also edit, paste, or type your technical thoughts directly..."
                  className="w-full p-4 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans resize-y"
                ></textarea>
              </div>

              {/* Word Count & Submit CTA */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-500">
                <span>
                  Word Count:{' '}
                  <strong className="text-slate-800 font-mono">
                    {answerText.trim() ? answerText.trim().split(/\s+/).length : 0}
                  </strong>{' '}
                  words
                </span>

                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={submitting || !answerText.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isFinalQuestion ? 'Finalizing Call & Scorecard...' : 'Alex is preparing follow-up turn...'}
                    </>
                  ) : isFinalQuestion ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Conclude Call & View Scorecard
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Response & Continue Dialogue
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Call Dialogue Feed & Scorecard Notice */}
          <div className="lg:col-span-5 space-y-6">
            {/* Conversation Turns Stepper */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">Dialogue Progress</h3>
                  <p className="text-xs text-slate-500">Turn {currentQuestion.order_index} of {session.total_questions}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-mono text-xs font-bold border border-indigo-100">
                  {overallProgressPercent}% Complete
                </span>
              </div>

              {/* Stepper Progress */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${overallProgressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Previous Conversation Turns Feed */}
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-heading">
                  Call Transcript
                </span>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {questionsList.map((q) => {
                    const isAnswered = q.is_answered;
                    const isCurrent = q.id === currentQuestion.id;

                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                          isCurrent
                            ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-medium'
                            : isAnswered
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5 font-heading">
                            {isAnswered ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : isCurrent ? (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                            )}
                            Turn {q.order_index}: Alex
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {isAnswered ? 'Completed ✓' : isCurrent ? 'Active Now' : 'Upcoming'}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[11px] text-slate-600 italic">
                          "{q.question_text}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scorecard Notice */}
            <div className="bg-gradient-to-br from-slate-950 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-3.5 border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-300">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-heading">Authentic Call Protocol</h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Just like a real technical interview, live scoring and grades are hidden while the conversation is active. Once all dialogue turns are completed, you will receive a comprehensive performance report with rubric breakdown, strengths, and targeted improvement topics.
              </p>
            </div>

            {/* Interview Best Practices */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 font-heading">
                <FileText className="w-4 h-4 text-indigo-600" />
                Dialogue Best Practices
              </h4>
              <ul className="space-y-2 text-slate-600 list-disc list-inside">
                <li>
                  <strong className="text-slate-700">Answer concisely:</strong> 1 to 2 minutes of focused reasoning is ideal.
                </li>
                <li>
                  <strong className="text-slate-700">Explore trade-offs:</strong> Mention alternatives, memory/CPU impacts, and failure cases.
                </li>
                <li>
                  <strong className="text-slate-700">Listen back:</strong> Use the audio player to review your clarity before submitting.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
