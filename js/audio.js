/**
 * audio.js
 * Oyun ses sistemi - Web Audio API ile motor ve efekt sesleri
 */

class AudioManager {
    constructor() {
        this.enabled = true;
        this.masterVolume = 0.7;
        this.context = null;
        this.sounds = {};
        
        // Motor sesi için oscillator
        this.engineOscillator = null;
        this.engineGain = null;
        this.engineRunning = false;
        
        this.init();
    }
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.context.destination);
            
            console.log('Ses sistemi başlatıldı');
        } catch (e) {
            console.warn('Web Audio API desteklenmiyor:', e);
            this.enabled = false;
        }
    }
    
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
    
    startEngine() {
        if (!this.enabled || !this.context || this.engineRunning) return;
        
        this.resume();
        
        // Ana motor sesi
        this.engineOscillator = this.context.createOscillator();
        this.engineOscillator.type = 'sawtooth';
        this.engineOscillator.frequency.value = 80;
        
        // Gain node
        this.engineGain = this.context.createGain();
        this.engineGain.gain.value = 0.1;
        
        // Low-pass filter (motor sesi için)
        this.engineFilter = this.context.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.value = 300;
        this.engineFilter.Q.value = 5;
        
        // Bağlantılar
        this.engineOscillator.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);
        
        this.engineOscillator.start();
        this.engineRunning = true;
    }
    
    stopEngine() {
        if (this.engineOscillator && this.engineRunning) {
            this.engineOscillator.stop();
            this.engineOscillator = null;
            this.engineRunning = false;
        }
    }
    
    updateEngine(speed, throttle, rpm) {
        if (!this.enabled || !this.engineOscillator) return;
        
        // Hıza göre frekans (60-400 Hz arası)
        const baseFreq = 60;
        const maxFreq = 400;
        const speedFactor = Math.min(speed / 200, 1);
        const targetFreq = baseFreq + (maxFreq - baseFreq) * speedFactor;
        
        // Gaz pedalına göre ses yüksekliği
        const baseVolume = 0.05;
        const maxVolume = 0.2;
        const targetVolume = throttle ? maxVolume : baseVolume + speedFactor * 0.05;
        
        // Yumuşak geçiş
        const now = this.context.currentTime;
        this.engineOscillator.frequency.linearRampToValueAtTime(targetFreq, now + 0.1);
        this.engineGain.gain.linearRampToValueAtTime(targetVolume, now + 0.1);
        
        // Filter frekansı
        const filterFreq = 200 + speedFactor * 800;
        this.engineFilter.frequency.linearRampToValueAtTime(filterFreq, now + 0.1);
    }
    
    playSound(type) {
        if (!this.enabled || !this.context) return;
        
        this.resume();
        
        switch (type) {
            case 'horn':
                this.playHorn();
                break;
            case 'crash':
                this.playCrash();
                break;
            case 'drift':
                this.playDrift();
                break;
            case 'nitro':
                this.playNitro();
                break;
            case 'coin':
                this.playCoin();
                break;
            case 'achievement':
                this.playAchievement();
                break;
        }
    }
    
    playHorn() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'square';
        osc.frequency.value = 400;
        gain.gain.value = 0.2;
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
        osc.stop(this.context.currentTime + 0.5);
    }
    
    playCrash() {
        const bufferSize = this.context.sampleRate * 0.3;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        
        const source = this.context.createBufferSource();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        gain.gain.value = 0.4;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        source.start();
    }
    
    playDrift() {
        const bufferSize = this.context.sampleRate * 0.2;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3 * Math.sin(i * 0.01);
        }
        
        const source = this.context.createBufferSource();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        source.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        gain.gain.value = 0.15;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        source.start();
    }
    
    playNitro() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.value = 100;
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        gain.gain.value = 0.3;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.frequency.exponentialRampToValueAtTime(300, this.context.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 1);
        osc.stop(this.context.currentTime + 1);
    }
    
    playCoin() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 800;
        gain.gain.value = 0.15;
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
        osc.stop(this.context.currentTime + 0.2);
    }
    
    playAchievement() {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.value = 0.15;
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
                osc.stop(this.context.currentTime + 0.3);
            }, i * 100);
        });
    }
    
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopEngine();
        }
        return this.enabled;
    }
}

// Global instance
let audioManager = null;
