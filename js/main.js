// main.js - ОБНОВЛЕННАЯ инициализация
let canvas, ctx;
let currentScreen = 'mainMenu';
let images = {};
let sounds = {};
let gameState = null;

// Инициализация игры
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Устанавливаем РЕАЛЬНЫЕ размеры
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;
    
    // Создаем UI элементы
    createAmmoSelectionUI();
    createShopButton();
    
    // Загружаем ресурсы и инициализируем звуки
    loadResources().then(() => {
        setupEventListeners();
        generateLevelButtons();
        initializeAudioSystem(); // Инициализируем звуковую систему
    });
}

function loadResources() {
    document.getElementById('loading').classList.remove('hidden');
    
    const resources = {
        stuka: 'images/stuka.png',
        bomber: 'images/bombardier.png',
        bomb: 'images/bomb.png',
        kamikaze: 'images/kamikaze.png',
        messerschmidt: 'images/messerschmidt.png',
        il: 'images/il.png',
        detals: 'images/detals.png',
        ufo: 'images/ufo.png',
        rocket: 'images/rocket.png', 
        fau2: 'images/fau2.png',
        finteflugerhaime: 'images/finteflugerhaime.png',
        nakajima: 'images/nakajima.png',
        mitsubishi: 'images/mitsubishi.png',
        cape: 'images/cape.png',
        yamato: 'images/yamato.png',
        sakura: 'images/sakura.png',
        seamine: 'images/seamine.png',
        fockeWulf: 'images/Focke-Wulf_Fw_189.png',
        yokosuka: 'images/Yokosuka_D4Y.png', 
        nakajimaG5N: 'images/Nakajima_G5N.png',
        torpeda: 'images/torpeda.png'
    };

    const promises = [];
    
    // Загрузка изображений
    for (const [name, src] of Object.entries(resources)) {
        promises.push(new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                images[name] = img;
                resolve();
            };
            img.onerror = () => {
                console.warn(`Не удалось загрузить изображение: ${src}`);
                images[name] = null;
                resolve();
            };
            img.src = src;
        }));
    }
    
    // ОПТИМИЗИРОВАННАЯ загрузка звуков
    const soundResources = {
        playerShoot: 'sounds/player_shoot.mp3',
        fau2Boom: 'sounds/fau2_boom.mp3',
        miniRocketLaunch: 'sounds/mini_rocket_launch.mp3',
        miniRocketBoom: 'sounds/mini_rocket_boom.mp3',
        aircraftBoom: 'sounds/aircraft_boom.mp3',
        aircraftBombBoom: 'sounds/aircraft_bomb_boom.mp3',
        ufoBoom: 'sounds/ufo_boom.mp3',
        sakuraFall: 'sounds/sakura_fall.mp3',
        yamatoSignal: 'sounds/yamato_signal.mp3',
        yamatoCannonsShoot: 'sounds/yamato_cannons_shoot.mp3',
        yamatoBombBoom: 'sounds/yamato_bomb_boom.mp3',
        thirdAmmoBoom: 'sounds/third_ammo_boom.mp3',
        japaneseAdmiral: 'sounds/Japanese_admiral.ogg',
        naziOfficer: 'sounds/Nazi_officer.ogg',
        minefall: 'sounds/minefall.mp3',
        mineboom: 'sounds/mineboom.mp3' 
    };
    
    for (const [name, src] of Object.entries(soundResources)) {
        promises.push(new Promise((resolve) => {
            const audio = new Audio();
            
            // Оптимизированные настройки для Audio
            audio.preload = 'auto';
            audio.volume = 0.001; // Минимальная громкость для предзагрузки
            
            audio.oncanplaythrough = () => {
                sounds[name] = audio;
                console.log(`✅ Звук загружен: ${name}`);
                resolve();
            };
            
            audio.onerror = (error) => {
                console.warn(`❌ Не удалось загрузить звук: ${src}`, error);
                sounds[name] = null;
                resolve();
            };
            
            audio.src = src;
            audio.load();
        }));
    }

    // Загрузка звуков попадания
    for (let i = 1; i <= 8; i++) {
        promises.push(new Promise((resolve) => {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = 0.001;
            
            audio.oncanplaythrough = () => {
                sounds[`hit${i}`] = audio;
                resolve();
            };
            
            audio.onerror = () => {
                console.warn(`Не удалось загрузить звук: sounds/hit${i}.mp3`);
                sounds[`hit${i}`] = null;
                resolve();
            };
            
            audio.src = `sounds/hit${i}.mp3`;
            audio.load();
        }));
    }
    
    return Promise.all(promises).then(() => {
        document.getElementById('loading').classList.add('hidden');
        console.log('✅ Все ресурсы загружены');
    });
}

// Запуск игры при загрузке
window.onload = init;