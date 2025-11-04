// sounds.js - ОПТИМИЗИРОВАННАЯ система управления звуками
console.log('✅ sounds.js загружен');

class SoundManager {
    constructor() {
        this.sounds = {};
        this.masterVolume = 0.7;
        this.enabled = true;
        this.initialized = false;
        this.activeSounds = new Set();
        this.soundCache = new Map(); // Кэш для быстрого доступа
        
        // Предварительная инициализация ключевых звуков
        this.criticalSounds = [
            'playerShoot', 'aircraftBoom', 'fau2Boom', 'ufoBoom'
        ];
    }

    // Инициализация звуковой системы (вызывать при запуске игры)
    initialize() {
        if (this.initialized) return;
        
        console.log('🎵 Инициализация звуковой системы...');
        
        // Предзагрузка критических звуков
        this.criticalSounds.forEach(soundName => {
            if (sounds[soundName]) {
                this.preloadSound(soundName);
            }
        });
        
        this.initialized = true;
        console.log('✅ Звуковая система инициализирована');
    }

    // Предзагрузка звука
    preloadSound(soundName) {
        if (!sounds[soundName]) return;
        
        try {
            const sound = sounds[soundName].cloneNode();
            sound.volume = 0.001; // Почти беззвучно
            sound.play().then(() => {
                sound.pause();
                sound.currentTime = 0;
                this.soundCache.set(soundName, sound);
                console.log(`✅ Звук предзагружен: ${soundName}`);
            }).catch(error => {
                console.warn(`⚠️ Предзагрузка звука ${soundName} не удалась:`, error);
            });
        } catch (error) {
            console.warn(`❌ Ошибка предзагрузки ${soundName}:`, error);
        }
    }

    // Оптимизированное воспроизведение звука
    play(soundName, volume = 1.0, loop = false) {
        if (!this.enabled || !this.initialized || !sounds[soundName]) {
            return null;
        }
        
        try {
            let sound;
            
            // Используем кэшированный звук если есть
            if (this.soundCache.has(soundName)) {
                sound = this.soundCache.get(soundName).cloneNode();
            } else {
                sound = sounds[soundName].cloneNode();
            }
            
            sound.volume = Math.min(volume * this.masterVolume, 1.0);
            sound.loop = loop;
            
            // Обработчики для управления жизненным циклом
            sound.onended = () => {
                this.activeSounds.delete(sound);
            };
            
            sound.onerror = (error) => {
                console.warn(`❌ Ошибка воспроизведения ${soundName}:`, error);
                this.activeSounds.delete(sound);
            };
            
            this.activeSounds.add(sound);
            
            // Воспроизведение с обработкой обещания
            const playPromise = sound.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`⚠️ Не удалось воспроизвести ${soundName}:`, error);
                    this.activeSounds.delete(sound);
                });
            }
            
            return sound;
        } catch (error) {
            console.warn(`❌ Критическая ошибка воспроизведения ${soundName}:`, error);
            return null;
        }
    }

    // Быстрое воспроизведение для часто используемых звуков
    playQuick(soundName, volume = 1.0) {
        if (!this.enabled || !sounds[soundName]) return null;
        
        try {
            const sound = sounds[soundName].cloneNode();
            sound.volume = Math.min(volume * this.masterVolume, 1.0);
            
            sound.onended = () => {
                this.activeSounds.delete(sound);
            };
            
            this.activeSounds.add(sound);
            sound.play().catch(() => {
                this.activeSounds.delete(sound);
            });
            
            return sound;
        } catch (error) {
            return null;
        }
    }

    // Остановка звука
    stop(soundInstance) {
        if (soundInstance) {
            try {
                soundInstance.pause();
                soundInstance.currentTime = 0;
                this.activeSounds.delete(soundInstance);
            } catch (error) {
                console.warn('Ошибка остановки звука:', error);
            }
        }
    }

    // Остановка всех звуков
    stopAll() {
        this.activeSounds.forEach(sound => {
            try {
                sound.pause();
                sound.currentTime = 0;
            } catch (error) {
                // Игнорируем ошибки при остановке
            }
        });
        this.activeSounds.clear();
    }

    // Остановка звуков по типу
    stopByType(typeKeyword) {
        this.activeSounds.forEach(sound => {
            if (sound.src && sound.src.includes(typeKeyword)) {
                this.stop(sound);
            }
        });
    }

    // Установка громкости
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    // Включение/выключение звуков
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopAll();
        }
    }

    // Очистка ресурсов
    cleanup() {
        this.stopAll();
        this.soundCache.clear();
        this.initialized = false;
    }
}

// Глобальный менеджер звуков
const soundManager = new SoundManager();

// Оптимизированные функции для конкретных звуков
function playPlayerShoot(ammoType = 'normal') {
    let volume = 0.6;
    let soundName = 'playerShoot';
    
    switch(ammoType) {
        case 'piercing':
            volume = 0.8;
            break;
        case 'explosive':
            volume = 0.7;
            break;
    }
    
    return soundManager.playQuick(soundName, volume);
}

function playFau2Explosion() {
    return soundManager.play('fau2Boom', 0.9);
}

function playMiniRocketLaunch() {
    return soundManager.playQuick('miniRocketLaunch', 0.7);
}

function playMiniRocketExplosion() {
    return soundManager.playQuick('miniRocketBoom', 0.8);
}

function playAircraftExplosion(aircraftType = 'normal') {
    let volume = 0.8;
    
    switch(aircraftType) {
        case 'bomber':
        case 'mitsubishi':
            volume = 1.0;
            break;
        case 'messerschmidt':
            volume = 0.9;
            break;
        case 'kamikaze':
            volume = 0.95;
            break;
    }
    
    return soundManager.play('aircraftBoom', volume);
}

function playAircraftBombExplosion(bombType = 'normal') {
    let volume = 0.7;
    
    switch(bombType) {
        case 'heavy':
            volume = 0.9;
            break;
        case 'cluster':
            volume = 0.8;
            break;
    }
    
    return soundManager.playQuick('aircraftBombBoom', volume);
}

function playUfoExplosion() {
    return soundManager.play('ufoBoom', 1.0);
}

function playSakuraFall() {
    return soundManager.play('sakuraFall', 0.6);
}

function playYamatoSignal() {
    return soundManager.play('yamatoSignal', 0.8);
}

function playYamatoCannonsShoot() {
    return soundManager.play('yamatoCannonsShoot', 0.9);
}

function playYamatoBombBoom() {
    return soundManager.play('yamatoBombBoom', 1.0);
}

function playThirdAmmoExplosion() {
    return soundManager.playQuick('thirdAmmoBoom', 0.8);
}

function playJapaneseAdmiral() {
    return soundManager.play('japaneseAdmiral', 0.8);
}

function playNaziOfficer() {
    return soundManager.play('naziOfficer', 0.8);
}

function playRandomHitSound() {
    const randomHit = Math.floor(Math.random() * 8) + 1;
    const soundName = `hit${randomHit}`;
    
    return soundManager.playQuick(soundName, 0.7);
}

function playMineFall() {
    return soundManager.playQuick('minefall', 0.7);
}

function playMineBoom() {
    return soundManager.playQuick('mineboom', 0.9);
}

function playAchievementSound() {
    return soundManager.playQuick('getachieved', 0.8);
}

// Остановка всех диалоговых звуков
function stopDialogSounds() {
    soundManager.stopByType('Japanese_admiral');
    soundManager.stopByType('Nazi_officer');
}

// Остановка всех звуков взрывов
function stopExplosionSounds() {
    soundManager.stopByType('boom');
    soundManager.stopByType('explosion');
}

// Инициализация звуковой системы при загрузке
function initializeAudioSystem() {
    setTimeout(() => {
        soundManager.initialize();
    }, 1000); // Задержка для полной загрузки страницы
}