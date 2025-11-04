// constants.js
console.log('✅ constants.js загружен');

const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    AMMO_PER_LEVEL: 270,
    // РАЗНОЕ КОЛИЧЕСТВО САМОЛЕТОВ ДЛЯ КАЖДОГО УРОВНЯ
    ENEMIES_PER_LEVEL: {
        1: 10,
        2: 12, 
        3: 15,
        4: 20,
        5: 28,
        6: 19,
        7: 22,
        8: 25,
        9: 30,
        10: 35 
    },
    TOTAL_LEVELS: 11, // 10 обычных + бесконечный
    FIGHTER_COST: 50,
    REWARDS: {
        kamikaze: 5,
        stuka: 10,
        bomber: 20,
        ufo: 100,
        nakajima: 15,
        mitsubishi: 25,
        messerschmidt: 30,
        fockeWulf: 20,
        yokosuka: 25,    
        nakajimaG5N: 30
    },
    AMMO_TYPES: {
        normal: { cost: 5, amount: 10, color: '#ffeb3b' },
        piercing: { cost: 10, amount: 10, color: '#4caf50' },
        explosive: { cost: 15, amount: 10, color: '#ff4444' }
    },
    // НАСТРОЙКИ СКОРОСТИ СНАРЯДОВ
    AMMO_SPEED: {
        normal: 11,      // Обычные снаряды
        piercing: 15,    // Прошивные 
        explosive: 11    // Осколочные 
    },
    AMMO_COOLDOWN: {
        normal: 10,     // Стандартная перезарядка
        piercing: 7,   // Дольше для баланса
        explosive: 13   // Самый долгий
    },
    UFO: {
        HEALTH: 88,
        BOSS_LEVELS: [5], // Только 5 уровень
        ATTACK_COOLDOWNS: {
            bulletHell: 120,
            guidedMissiles: 180,
            rocketStrike: 240
        }
    },
    BOSS_DIALOGS: {
        5: {
            avatar: 'images/erich_scholz.png',
            name: 'Эрих Шольц',
            message: 'Узри же! Летающая тарелка третьего рейха!'
        },
        10: {
            avatar: 'images/tsushima_yakamoto.png',
            name: 'Цусима Якамото', 
            message: 'Имперский флот в атаку!'
        }
    },
    INFINITE_MODE: {
        BOSS_SPAWN_INTERVAL: 12000, // 200 секунд - 12000
        YAMATO_DURATION: 12000, // 200 секунд - 12000
        ENEMY_SPAWN_RATE: 1000,
        WAVE_INTERVAL: 3000,
        BOSS_CHANCE: 1.0
    }
};

// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ КОЛИЧЕСТВА ВРАГОВ
CONFIG.getEnemiesForLevel = function(level) {
    return this.ENEMIES_PER_LEVEL[level] || 50; // fallback на 50 если уровень не найден
};

const SPRITE_SIZES = {
    stuka: { width: 1080, height: 314 },
    bomber: { width: 1080, height: 261 },
    bomb: { width: 1080, height: 301 },
    kamikaze: { width: 1080, height: 314 },
    messerschmidt: { width: 1189, height: 302 },
    il: { width: 1080, height: 314 },
    ufo: { width: 1089, height: 409 },
    rocket: { width: 1080, height: 5984 },
    fau2: { width: 1080, height: 4452 },
    finteflugerhaime: { width: 1080, height: 1080 },
    nakajima: { width: 1080, height: 473 },
    mitsubishi: { width: 1259, height: 502 },
    seamine: { width: 1080, height: 1068 },
    fockeWulf: { width: 1080, height: 253 },
    yokosuka: { width: 1080, height: 276 },
    nakajimaG5N: { width: 1080, height: 259 },
    torpeda: { width: 1080, height: 152 }
};

// Глобальные переменные для доступа из всех файлов
window.CONFIG = CONFIG;

window.SPRITE_SIZES = SPRITE_SIZES;
