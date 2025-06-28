import { useState, useRef, useEffect } from 'react';
import { Mic, Video, Camera, X, Save, RotateCcw } from 'lucide-react';

export const MediaRecorderComponent = ({ type = 'audio', onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  // Cleanup function
  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const constraints = type === 'video' 
        ? { audio: true, video: true } 
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (type === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error('Error playing video:', e));
      }

      const mediaRecorder = new window.MediaRecorder(stream, {
        mimeType: type === 'video' ? 'video/webm' : 'audio/webm'
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: type === 'video' ? 'video/webm' : 'audio/webm' 
        });
        setRecordedBlob(URL.createObjectURL(blob));
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access your camera/microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      stopMediaTracks();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setError(null);
  };

  const handleSave = () => {
    if (recordedBlob) {
      onRecordingComplete({
        type,
        url: recordedBlob,
        duration: recordingTime,
        timestamp: new Date().toISOString()
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/20 text-red-200 text-sm rounded-lg">
          {error}
        </div>
      )}

      {type === 'video' && (
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
          {!recordedBlob ? (
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline
              className={`w-full h-full ${isRecording ? '' : 'opacity-50'}`}
            />
          ) : (
            <video 
              src={recordedBlob} 
              controls 
              className="w-full h-full"
            />
          )}
          {isRecording && (
            <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
              {formatTime(recordingTime)}
            </div>
          )}
        </div>
      )}

      {type === 'audio' && recordedBlob && (
        <div className="p-4 bg-background-tertiary rounded-xl">
          <audio src={recordedBlob} controls className="w-full" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Stop recording"
            >
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </button>
          ) : recordedBlob ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                title="Save recording"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={resetRecording}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-background-tertiary text-text-primary hover:bg-background-tertiary/80 transition-colors"
                title="Retry"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={startRecording}
              className={`flex items-center justify-center w-12 h-12 rounded-full ${
                type === 'video' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
              title={`Start ${type} recording`}
            >
              {type === 'video' ? (
                <Video className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
          )}
        </div>

        <button
          onClick={onCancel}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-background-tertiary text-text-primary hover:bg-background-tertiary/80 transition-colors"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};