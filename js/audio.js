/**
 * audio.js
 * Gelişmiş ses sistemi - Gerçek ses dosyaları + Fade geçişleri
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
        
        // Aktif ses kaynakları - fade için
        this.activeSources = {};
        this.fadeTimers = {};
        
        // Ses dosyaları cache
        this.audioBuffers = {};
        this.loadedSounds = {};
        
        // Motor ses durumu
        this.currentEngineSound = null;
        this.lastRPMRange = null;
        
        this.init();
    }
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.context.destination);
            
            // Ses dosyalarını önceden yükle
            this.preloadSounds();
            
            console.log('Ses sistemi başlatıldı');
        } catch (e) {
            console.warn('Web Audio API desteklenmiyor:', e);
            this.enabled = false;
        }
    }
    
    // Ses dosyalarını önceden yükle
    async preloadSounds() {
        const soundFiles = {
            'engine_idle': 'sounds/engine_idle.mp3',
            'engine_low': 'sounds/engine_low.mp3',
            'engine_mid': 'sounds/engine_mid.mp3',
            'engine_high': 'sounds/engine_high.mp3',
            'engine_start': 'sounds/engine_start.mp3',
            'crash': 'sounds/crash.mp3',
            'horn': 'sounds/horn.mp3',
            'nitro_boost': 'sounds/nitro_boost.mp3',
            'tire_screech': 'sounds/tire-screech.mp3',
            'exhaust_pop': 'sounds/exhaust_pop..mp3',
            'exhaust_backfire': 'sounds/exhaust_backfire.mp3',
            'fuel_pump': 'sounds/fuel-pump.mp3'
        };
        
        for (const [name, url] of Object.entries(soundFiles)) {
            this.loadSound(name, url);
        }
    }
    
    // Tek ses dosyası yükle
    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Ses dosyası bulunamadı: ${url}`);
                return;
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.audioBuffers[name] = audioBuffer;
            console.log(`Ses yüklendi: ${name}`);
        } catch (e) {
            console.warn(`Ses yüklenemedi: ${name}`, e);
        }
    }
    
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
    
    // ============ FADE SİSTEMİ ============
    
    // Sesi fade-out ile durdur
    fadeOutSound(soundId, duration = 0.3) {
        const source = this.activeSources[soundId];
        if (!source || !source.gainNode) return;
        
        const now = this.context.currentTime;
        source.gainNode.gain.setValueAtTime(source.gainNode.gain.value, now);
        source.gainNode.gain.linearRampToValueAtTime(0.001, now + duration);
        
        // Fade bittikten sonra durdur
        setTimeout(() => {
            this.stopSound(soundId);
        }, duration * 1000 + 50);
    }
    
    // Sesi fade-in ile başlat
    fadeInSound(soundId, bufferName, volume = 0.5, loop = true, duration = 0.3) {
        // Önce eski sesi fade-out yap
        if (this.activeSources[soundId]) {
            this.fadeOutSound(soundId, duration * 0.5);
        }
        
        // Biraz bekle sonra yeni sesi başlat
        setTimeout(() => {
            this.playBufferedSound(soundId, bufferName, 0.001, loop);
            
            const source = this.activeSources[soundId];
            if (source && source.gainNode) {
                const now = this.context.currentTime;
                source.gainNode.gain.setValueAtTime(0.001, now);
                source.gainNode.gain.linearRampToValueAtTime(volume, now + duration);
            }
        }, duration * 500);
    }
    
    // Buffer'dan ses çal
    playBufferedSound(soundId, bufferName, volume = 0.5, loop = false) {
        if (!this.enabled || !this.context) return;
        
        const buffer = this.audioBuffers[bufferName];
        if (!buffer) {
            console.warn(`Buffer bulunamadı: ${bufferName}`);
            return;
        }
        
        // Eski kaynağı durdur
        this.stopSound(soundId);
        
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        
        source.buffer = buffer;
        source.loop = loop;
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        source.start(0);
        
        this.activeSources[soundId] = {
            source: source,
            gainNode: gainNode,
            bufferName: bufferName
        };
        
        // Loop değilse bitince temizle
        if (!loop) {
            source.onended = () => {
                delete this.activeSources[soundId];
            };
        }
    }
    
    // Sesi durdur
    stopSound(soundId) {
        const source = this.activeSources[soundId];
        if (source) {
            try {
                source.source.stop();
            } catch(e) {}
            delete this.activeSources[soundId];
        }
    }
    
    // Tüm sesleri durdur
    stopAllSounds() {
        for (const soundId of Object.keys(this.activeSources)) {
            this.stopSound(soundId);
        }
    }
    
    // ============ KONTAK VE MOTOR ============
    
    // Kontak açma sesi
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
    
    // Marş sesi
    playStarterSound(callback) {
        if (!this.enabled || !this.context || this.engineStarting) return;
        this.resume();
        
        this.engineStarting = true;
        
        // Gerçek marş sesi varsa kullan
        if (this.audioBuffers['engine_start']) {
            this.playBufferedSound('starter', 'engine_start', 0.6, false);
            
            setTimeout(() => {
                this.engineStarting = false;
                if (callback) callback();
            }, 1500);
        } else {
            // Sentetik marş sesi
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
            
            const now = this.context.currentTime;
            starterOsc.frequency.setValueAtTime(25, now);
            starterOsc.frequency.linearRampToValueAtTime(50, now + 0.8);
            starterGain.gain.linearRampToValueAtTime(0.001, now + 1.2);
            
            starterOsc.start(now);
            starterOsc.stop(now + 1.2);
            
            setTimeout(() => {
                this.engineStarting = false;
                if (callback) callback();
            }, 1200);
        }
    }
    
    // Motor çalıştır
    startEngine(immediate = false) {
        if (!this.enabled || !this.context || this.engineRunning) return;
        
        this.resume();
        
        if (immediate) {
            this.engineRunning = true;
            this.ignitionOn = true;
            this.startEngineLoop();
        } else {
            this.playIgnitionClick();
            
            setTimeout(() => {
                this.playStarterSound(() => {
                    this.engineRunning = true;
                    this.ignitionOn = true;
                    this.startEngineLoop();
                });
            }, 200);
        }
    }
    
    // Motor döngüsü başlat
    startEngineLoop() {
        // Rölanti sesi ile başla
        if (this.audioBuffers['engine_idle']) {
            this.fadeInSound('engine', 'engine_idle', 0.3, true, 0.5);
            this.currentEngineSound = 'engine_idle';
            this.lastRPMRange = 'idle';
        } else {
            this.startSyntheticEngine();
        }
    }
    
    // Sentetik motor sesi
    startSyntheticEngine() {
        if (this.activeSources['synth_engine']) return;
        
        const engineOsc = this.context.createOscillator();
        const engineGain = this.context.createGain();
        const engineFilter = this.context.createBiquadFilter();
        
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = 40;
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = 300;
        engineGain.gain.value = 0.1;
        
        engineOsc.connect(engineFilter);
        engineFilter.connect(engineGain);
        engineGain.connect(this.masterGain);
        
        engineOsc.start();
        
        this.activeSources['synth_engine'] = {
            osc: engineOsc,
            gainNode: engineGain,
            filter: engineFilter
        };
    }
    
    // Motor durdur
    stopEngine() {
        if (!this.engineRunning) return;
        
        // Tüm motor seslerini fade-out
        this.fadeOutSound('engine', 0.5);
        this.fadeOutSound('synth_engine', 0.5);
        
        // Sentetik motoru durdur
        const synthEngine = this.activeSources['synth_engine'];
        if (synthEngine && synthEngine.osc) {
            try {
                const now = this.context.currentTime;
                synthEngine.gainNode.gain.linearRampToValueAtTime(0.001, now + 0.5);
                setTimeout(() => {
                    try { synthEngine.osc.stop(); } catch(e) {}
                    delete this.activeSources['synth_engine'];
                }, 600);
            } catch(e) {}
        }
        
        this.engineRunning = false;
        this.ignitionOn = false;
        this.currentEngineSound = null;
        this.lastRPMRange = null;
    }
    
    // Motor sesini güncelle (RPM'e göre)
    updateEngine(speed, throttle, rpm) {
        if (!this.enabled || !this.engineRunning) return;
        
        // RPM aralığını belirle
        let targetRange;
        if (rpm < 1500) {
            targetRange = 'idle';
        } else if (rpm < 3500) {
            targetRange = 'low';
        } else if (rpm < 5500) {
            targetRange = 'mid';
        } else {
            targetRange = 'high';
        }
        
        // Ses dosyası varsa ve aralık değiştiyse geçiş yap
        const bufferName = `engine_${targetRange}`;
        
        if (this.audioBuffers[bufferName] && targetRange !== this.lastRPMRange) {
            // ÖNCEKİ SESİ KAPAT, YENİSİNİ AÇ
            console.log(`Motor sesi geçişi: ${this.lastRPMRange} -> ${targetRange}`);
            
            // Önce eski sesi fade-out
            if (this.activeSources['engine']) {
                this.fadeOutSound('engine', 0.15);
            }
            
            // Sonra yeni sesi fade-in
            setTimeout(() => {
                const volume = throttle ? 0.4 + (rpm / 8000) * 0.4 : 0.25;
                this.playBufferedSound('engine', bufferName, volume, true);
                this.currentEngineSound = bufferName;
                this.lastRPMRange = targetRange;
            }, 100);
            
        } else if (this.activeSources['engine']) {
            // Aynı aralıkta - sadece ses seviyesini ayarla
            const source = this.activeSources['engine'];
            if (source && source.gainNode) {
                const volume = throttle ? 0.3 + (rpm / 8000) * 0.5 : 0.2;
                source.gainNode.gain.setTargetAtTime(volume, this.context.currentTime, 0.1);
            }
        }
        
        // Sentetik motor güncelle (fallback)
        const synthEngine = this.activeSources['synth_engine'];
        if (synthEngine && synthEngine.osc) {
            const rpmNormalized = Math.min(rpm / 7000, 1);
            const baseFreq = 35 + rpmNormalized * 165;
            const volume = throttle ? 0.05 + rpmNormalized * 0.15 : 0.05;
            
            synthEngine.osc.frequency.setTargetAtTime(baseFreq, this.context.currentTime, 0.05);
            synthEngine.gainNode.gain.setTargetAtTime(volume, this.context.currentTime, 0.05);
        }
    }
    
    // ============ EFEKT SESLERİ ============
    
    playSound(type) {
        if (!this.enabled || !this.context) return;
        this.resume();
        
        // Önce buffer'dan dene
        const bufferMap = {
            'horn': 'horn',
            'crash': 'crash',
            'nitro': 'nitro_boost',
            'drift': 'tire_screech'
        };
        
        if (bufferMap[type] && this.audioBuffers[bufferMap[type]]) {
            this.playBufferedSound(`effect_${type}`, bufferMap[type], 0.5, false);
            return;
        }
        
        // Fallback - sentetik sesler
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
            this.stopAllSounds();
        }
        return this.enabled;
    }
    
    isEngineRunning() {
        return this.engineRunning;
    }
}

let audioManager = null;
