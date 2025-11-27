/**
 * audio.js
 * Gelişmiş ses sistemi - Kontak, marş ve motor sesleri
 */

class AudioManager {
    constructor() {
        this.enabled = true;
        this.masterVolume = 0.7;
        this.context = null;
        
        // Motor durumu
        this.engineRunning = false;
        this.engineStarting = false;
        this.ignitionOn = false;
        
        // Ses node'ları
        this.engineNodes = null;
        this.idleNodes = null;
        
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
    
    // Kontak açma sesi (klik sesi)
    playIgnitionClick() {
        if (!this.enabled || !this.context) return;
        this.resume();
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'square';
        osc.frequency.value = 2000;
        gain.gain.value = 0.15;
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.05);
        osc.stop(this.context.currentTime + 0.05);
    }
    
    // Marş sesi (motor çalıştırma)
    playStarterSound(callback) {
        if (!this.enabled || !this.context || this.engineStarting) return;
        this.resume();
        
        this.engineStarting = true;
        
        // Marş motoru sesi - vırıltı
        const starterOsc = this.context.createOscillator();
        const starterGain = this.context.createGain();
        const starterFilter = this.context.createBiquadFilter();
        
        starterOsc.type = 'sawtooth';
        starterOsc.frequency.value = 25;
        starterFilter.type = 'lowpass';
        starterFilter.frequency.value = 400;
        starterGain.gain.value = 0.25;
        
        starterOsc.connect(starterFilter);
        starterFilter.connect(starterGain);
        starterGain.connect(this.masterGain);
        
        // Marş frekansı artışı (motor dönmeye başlıyor)
        const now = this.context.currentTime;
        starterOsc.frequency.setValueAtTime(25, now);
        starterOsc.frequency.linearRampToValueAtTime(40, now + 0.3);
        starterOsc.frequency.linearRampToValueAtTime(35, now + 0.5);
        starterOsc.frequency.linearRampToValueAtTime(50, now + 0.8);
        
        // Ses azalması
        starterGain.gain.setValueAtTime(0.25, now);
        starterGain.gain.linearRampToValueAtTime(0.3, now + 0.5);
        starterGain.gain.linearRampToValueAtTime(0.1, now + 1.0);
        starterGain.gain.linearRampToValueAtTime(0.001, now + 1.2);
        
        starterOsc.start(now);
        starterOsc.stop(now + 1.2);
        
        // Motor çalışma sesi (patırtı)
        setTimeout(() => {
            this.playEngineStart();
        }, 800);
        
        // Callback
        setTimeout(() => {
            this.engineStarting = false;
            if (callback) callback();
        }, 1200);
    }
    
    // Motor ilk çalışma sesi
    playEngineStart() {
        if (!this.enabled || !this.context) return;
        
        // İlk patlama sesi
        const bufferSize = this.context.sampleRate * 0.4;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / this.context.sampleRate;
            // Düşük frekanslı patlama
            data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.5;
            // Motor titreşimi ekle
            data[i] += Math.sin(t * 80 * Math.PI * 2) * Math.exp(-t * 3) * 0.3;
        }
        
        const source = this.context.createBufferSource();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        gain.gain.value = 0.5;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        source.start();
    }

    
    // Rölanti sesi başlat
    startIdleSound() {
        if (!this.enabled || !this.context || this.idleNodes) return;
        
        // Ana rölanti oscillator
        const idleOsc = this.context.createOscillator();
        const idleGain = this.context.createGain();
        const idleFilter = this.context.createBiquadFilter();
        
        idleOsc.type = 'sawtooth';
        idleOsc.frequency.value = 35; // Düşük rölanti frekansı
        
        idleFilter.type = 'lowpass';
        idleFilter.frequency.value = 250;
        idleFilter.Q.value = 3;
        
        idleGain.gain.value = 0.08;
        
        // İkinci harmonik
        const idleOsc2 = this.context.createOscillator();
        const idleGain2 = this.context.createGain();
        
        idleOsc2.type = 'triangle';
        idleOsc2.frequency.value = 70;
        idleGain2.gain.value = 0.04;
        
        // Bağlantılar
        idleOsc.connect(idleFilter);
        idleFilter.connect(idleGain);
        idleGain.connect(this.masterGain);
        
        idleOsc2.connect(idleGain2);
        idleGain2.connect(this.masterGain);
        
        idleOsc.start();
        idleOsc2.start();
        
        this.idleNodes = {
            osc: idleOsc,
            osc2: idleOsc2,
            gain: idleGain,
            gain2: idleGain2,
            filter: idleFilter
        };
    }
    
    stopIdleSound() {
        if (this.idleNodes) {
            try {
                this.idleNodes.osc.stop();
                this.idleNodes.osc2.stop();
            } catch(e) {}
            this.idleNodes = null;
        }
    }
    
    // Motor çalıştır (kontak + marş)
    startEngine(immediate = false) {
        if (!this.enabled || !this.context || this.engineRunning) return;
        
        this.resume();
        
        if (immediate) {
            // Hemen çalıştır (oyun başlangıcı için)
            this.engineRunning = true;
            this.ignitionOn = true;
            this.startIdleSound();
            this.startEngineSound();
        } else {
            // Kontak + marş sekansı
            this.playIgnitionClick();
            
            setTimeout(() => {
                this.playStarterSound(() => {
                    this.engineRunning = true;
                    this.ignitionOn = true;
                    this.startIdleSound();
                    this.startEngineSound();
                });
            }, 200);
        }
    }
    
    // Ana motor sesi
    startEngineSound() {
        if (!this.enabled || !this.context || this.engineNodes) return;
        
        // Ana motor oscillator
        const engineOsc = this.context.createOscillator();
        const engineGain = this.context.createGain();
        const engineFilter = this.context.createBiquadFilter();
        
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = 40;
        
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = 300;
        engineFilter.Q.value = 5;
        
        engineGain.gain.value = 0.05;
        
        // Harmonikler
        const engineOsc2 = this.context.createOscillator();
        const engineGain2 = this.context.createGain();
        
        engineOsc2.type = 'square';
        engineOsc2.frequency.value = 80;
        engineGain2.gain.value = 0.02;
        
        // Egzoz sesi
        const exhaustOsc = this.context.createOscillator();
        const exhaustGain = this.context.createGain();
        const exhaustFilter = this.context.createBiquadFilter();
        
        exhaustOsc.type = 'triangle';
        exhaustOsc.frequency.value = 60;
        exhaustFilter.type = 'lowpass';
        exhaustFilter.frequency.value = 200;
        exhaustGain.gain.value = 0.03;
        
        // Bağlantılar
        engineOsc.connect(engineFilter);
        engineFilter.connect(engineGain);
        engineGain.connect(this.masterGain);
        
        engineOsc2.connect(engineGain2);
        engineGain2.connect(this.masterGain);
        
        exhaustOsc.connect(exhaustFilter);
        exhaustFilter.connect(exhaustGain);
        exhaustGain.connect(this.masterGain);
        
        engineOsc.start();
        engineOsc2.start();
        exhaustOsc.start();
        
        this.engineNodes = {
            osc: engineOsc,
            osc2: engineOsc2,
            exhaust: exhaustOsc,
            gain: engineGain,
            gain2: engineGain2,
            exhaustGain: exhaustGain,
            filter: engineFilter,
            exhaustFilter: exhaustFilter
        };
    }
    
    // Motor durdur
    stopEngine() {
        if (!this.engineRunning) return;
        
        // Motor kapatma sesi
        if (this.engineNodes) {
            const now = this.context.currentTime;
            
            // Yavaşça kapat
            this.engineNodes.gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
            this.engineNodes.gain2.gain.linearRampToValueAtTime(0.001, now + 0.5);
            this.engineNodes.exhaustGain.gain.linearRampToValueAtTime(0.001, now + 0.5);
            
            setTimeout(() => {
                try {
                    this.engineNodes.osc.stop();
                    this.engineNodes.osc2.stop();
                    this.engineNodes.exhaust.stop();
                } catch(e) {}
                this.engineNodes = null;
            }, 600);
        }
        
        this.stopIdleSound();
        this.engineRunning = false;
        this.ignitionOn = false;
    }

    
    // Motor sesini güncelle (hız ve gaza göre)
    updateEngine(speed, throttle, rpm) {
        if (!this.enabled || !this.engineNodes || !this.engineRunning) return;
        
        const now = this.context.currentTime;
        
        // RPM'e göre frekans (800-7000 RPM -> 35-200 Hz)
        const rpmNormalized = Math.min(rpm / 7000, 1);
        const baseFreq = 35 + rpmNormalized * 165;
        
        // Gaz pedalına göre ses yüksekliği
        const baseVolume = 0.05;
        const maxVolume = 0.25;
        const targetVolume = throttle ? 
            baseVolume + rpmNormalized * (maxVolume - baseVolume) : 
            baseVolume + rpmNormalized * 0.05;
        
        // Ana motor frekansı
        this.engineNodes.osc.frequency.linearRampToValueAtTime(baseFreq, now + 0.05);
        this.engineNodes.osc2.frequency.linearRampToValueAtTime(baseFreq * 2, now + 0.05);
        this.engineNodes.exhaust.frequency.linearRampToValueAtTime(baseFreq * 1.5, now + 0.05);
        
        // Ses seviyeleri
        this.engineNodes.gain.gain.linearRampToValueAtTime(targetVolume, now + 0.05);
        this.engineNodes.gain2.gain.linearRampToValueAtTime(targetVolume * 0.4, now + 0.05);
        this.engineNodes.exhaustGain.gain.linearRampToValueAtTime(targetVolume * 0.6, now + 0.05);
        
        // Filter frekansı (yüksek RPM'de daha parlak ses)
        const filterFreq = 200 + rpmNormalized * 600;
        this.engineNodes.filter.frequency.linearRampToValueAtTime(filterFreq, now + 0.05);
        
        // Rölanti sesini ayarla
        if (this.idleNodes) {
            const idleVolume = throttle ? 0.02 : 0.08 - rpmNormalized * 0.06;
            this.idleNodes.gain.gain.linearRampToValueAtTime(Math.max(0.01, idleVolume), now + 0.1);
            this.idleNodes.gain2.gain.linearRampToValueAtTime(Math.max(0.005, idleVolume * 0.5), now + 0.1);
        }
    }
    
    // Efekt sesleri
    playSound(type) {
        if (!this.enabled || !this.context) return;
        this.resume();
        
        switch (type) {
            case 'horn': this.playHorn(); break;
            case 'crash': this.playCrash(); break;
            case 'drift': this.playDrift(); break;
            case 'nitro': this.playNitro(); break;
            case 'coin': this.playCoin(); break;
            case 'achievement': this.playAchievement(); break;
            case 'ignition': this.playIgnitionClick(); break;
        }
    }
    
    playHorn() {
        const osc = this.context.createOscillator();
        const osc2 = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'square';
        osc.frequency.value = 380;
        osc2.type = 'square';
        osc2.frequency.value = 500;
        gain.gain.value = 0.15;
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc2.start();
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.6);
        osc.stop(this.context.currentTime + 0.6);
        osc2.stop(this.context.currentTime + 0.6);
    }
    
    playCrash() {
        const bufferSize = this.context.sampleRate * 0.4;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
        }
        
        const source = this.context.createBufferSource();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        gain.gain.value = 0.5;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }
    
    playDrift() {
        const bufferSize = this.context.sampleRate * 0.3;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.4 * Math.sin(i * 0.008);
        }
        
        const source = this.context.createBufferSource();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        source.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 1500;
        gain.gain.value = 0.12;
        
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
        osc.frequency.value = 80;
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 2;
        gain.gain.value = 0.25;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.frequency.exponentialRampToValueAtTime(250, this.context.currentTime + 0.3);
        filter.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.8);
        osc.stop(this.context.currentTime + 0.8);
    }
    
    playCoin() {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 800;
        gain.gain.value = 0.12;
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
        osc.stop(this.context.currentTime + 0.2);
    }
    
    playAchievement() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.value = 0.12;
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.25);
                osc.stop(this.context.currentTime + 0.25);
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
    
    isEngineRunning() {
        return this.engineRunning;
    }
}

let audioManager = null;
