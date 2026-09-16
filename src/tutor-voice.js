export class DutchTutorVoiceSession {
    constructor(onTranscriptUpdate) {
      this.ws = null;
      this.audioContext = null;
      this.mediaStream = null;
      this.onTranscriptUpdate = onTranscriptUpdate;
      
      // Playback scheduling variables
      this.outputAudioContext = null;
      this.nextPlayTime = 0;
    }
  
    async startSession(lessonContextString) {
      // 1. Initialize the playback audio context
      this.outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      this.nextPlayTime = this.outputAudioContext.currentTime;
  
      // 2. Fetch ephemeral token from your Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('gemini-token');
      if (error || !data.token) {
        console.error("Failed to fetch session token", error);
        return;
      }
  
      // 3. Open Stateful WebSocket Connection to Gemini Live API
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?access_token=${data.token}`;
      this.ws = new WebSocket(url);
  
      this.ws.onopen = () => {
        console.log("Connected to Dutch Tutor Live session.");
        this.sendInitialSetup(lessonContextString);
        this.startMicrophoneStream();
      };
  
      this.ws.onmessage = async (event) => {
        this.handleServerMessage(event);
      };
  
      this.ws.onerror = (err) => console.error("WebSocket error:", err);
      this.ws.onclose = () => console.log("Voice session closed.");
    }
  
    sendInitialSetup(context) {
      const setupMessage = {
        setup: {
          model: "models/gemini-2.5-flash", // Using the fast multimodal live model
          responseModalities: ["AUDIO"],
          systemInstruction: {
            parts: [{
              text: `You are a friendly, encouraging native Dutch language tutor. 
                     The student is currently working on this lesson context: "${context}". 
                     Speak clearly and naturally in Dutch at an intermediate pace. 
                     Gently correct any grammar or pronunciation errors they make, and explain corrections briefly in English if they struggle.`
            }]
          }
        }
      };
      this.ws.send(JSON.stringify(setupMessage));
    }
  
    async startMicrophoneStream() {
      // Gemini input requires 16kHz raw PCM mono
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true } });
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
  
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = this.convertFloat32ToInt16(inputData);
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
  
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                mimeType: "audio/pcm;rate=16000",
                data: base64Audio
              }]
            }
          }));
        }
      };
  
      source.connect(processor);
      processor.connect(this.audioContext.destination);
    }
  
    convertFloat32ToInt16(buffer) {
      let l = buffer.length;
      let buf = new Int16Array(l);
      while (l--) {
        buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
      }
      return buf;
    }
  
    async handleServerMessage(event) {
      // Handle incoming data text or audio chunks
      const response = JSON.parse(event.data);
      
      if (response.serverContent?.modelTurn?.parts) {
        for (const part of response.serverContent.modelTurn.parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith("audio/")) {
            this.playAudioChunk(part.inlineData.data);
          }
        }
      }
    }
  
    playAudioChunk(base64Data) {
      if (!this.outputAudioContext) return;
  
      // Decode base64 to binary array
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
  
      // Convert 24kHz PCM bytes to Int16, then scale to Float32 for Web Audio API
      const pcm16 = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32Data[i] = pcm16[i] / 32768.0;
      }
  
      // Create audio buffer (24kHz mono)
      const audioBuffer = this.outputAudioContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);
  
      // Schedule buffer playback seamlessly queueing chunks back-to-back
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
  
      const currentTime = this.outputAudioContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }
  
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
    }
  
    stopSession() {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }
      if (this.audioContext) {
        this.audioContext.close();
      }
      if (this.outputAudioContext) {
        this.outputAudioContext.close();
      }
      if (this.ws) {
        this.ws.close();
      }
    }
  }
  