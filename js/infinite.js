// infinite.js - ИСПРАВЛЕННАЯ система спавна для бесконечного режима
console.log('✅ infinite.js загружен');

class InfiniteWar {
    constructor() {
        this.mode = 'infinite';
        this.waveNumber = 1;
        this.enemiesSpawned = 0;
        this.bossTimer = CONFIG.INFINITE_MODE.BOSS_SPAWN_INTERVAL; // 18000 = 300 секунд
        this.enemySpawnTimer = 0;
        this.waveEnemiesCount = 0;
        this.waveEnemiesSpawned = 0;
        this.currentBoss = null;
        this.bossActive = false;
        this.yamatoTimer = 0;
        this.totalTime = 0;
        
        console.log('🔥 Запущена бесконечная война! Первый босс через 300 секунд');
    }

    update() {
        this.totalTime++;
        this.bossTimer--;
        
        // ЗАЩИТА ОТ ОТРИЦАТЕЛЬНЫХ ЗНАЧЕНИЙ
        if (this.bossTimer < 0) {
            this.bossTimer = 0;
        }
        
        this.enemySpawnTimer--;

        // СПАВН ОБЫЧНЫХ ВРАГОВ
        if (!this.bossActive && this.enemySpawnTimer <= 0) {
            this.spawnSingleEnemy();
            this.enemySpawnTimer = 60 + Math.random() * 60;
        }
        
        // ПРОВЕРКА СПАВНА БОССА (только если таймер достиг 0)
        if (!this.bossActive && this.bossTimer <= 0) {
            console.log('⏰ Время пришло! Проверяем появление босса...');
            this.trySpawnBoss();
        }
        
        // ОБРАБОТКА ТАЙМЕРА ЯМАТО
        if (this.bossActive && this.currentBoss && this.currentBoss.type === 'yamato') {
            this.yamatoTimer--;
            if (this.yamatoTimer <= 0) {
                this.endYamato();
            }
        }
        
        return true;
    }
    
    // ИСПРАВЛЕННАЯ ФУНКЦИЯ СПАВНА - ВСЕ САМОЛЕТЫ ПОЯВЛЯЮТСЯ СЛЕВА
    spawnSingleEnemy() {
    if (!gameState || !gameState.gameActive || this.bossActive) return;
    
    const enemyTypes = this.getAvailableEnemyTypes();
    
    // Весовые коэффициенты для баланса в бесконечном режиме
    const weights = {
        'stuka': 10,
        'bomber': 8, 
        'kamikaze': 7,
        'messerschmidt': 6,
        'nakajima': 9,
        'mitsubishi': 7,
        'fockeWulf': 5,  // Редкий в бесконечном режиме
        'yokosuka': 6,   // Средняя редкость
        'nakajimaG5N': 4 // Самый редкий
    };
    
    // Увеличиваем шансы новых самолетов с ростом волн
    const waveBonus = Math.min(this.waveNumber * 0.5, 3);
    weights.fockeWulf += waveBonus;
    weights.yokosuka += waveBonus;
    weights.nakajimaG5N += waveBonus;
    
    // Выбор типа врага с весами
    let totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    let enemyType = 'stuka'; // fallback
    for (const type of enemyTypes) {
        random -= weights[type];
        if (random <= 0) {
            enemyType = type;
            break;
        }
    }
    
    let enemy;
    switch(enemyType) {
        case 'stuka':
            enemy = new Stuka();
            break;
        case 'bomber':
            enemy = new Bomber();
            break;
        case 'kamikaze':
            enemy = new Kamikaze();
            break;
        case 'messerschmidt':
            enemy = new Messerschmidt();
            break;
        case 'nakajima':
            enemy = new Nakajima();
            break;
        case 'mitsubishi':
            enemy = new Mitsubishi();
            break;
        case 'fockeWulf':
            enemy = new FockeWulf();
            break;
        case 'yokosuka':
            enemy = new Yokosuka();
            break;
        case 'nakajimaG5N':
            enemy = new NakajimaG5N();
            break;
    }
    
    if (enemy) {
        enemy.x = -enemy.width;
        const minY = 50;
        const maxY = 350;
        enemy.y = minY + Math.random() * (maxY - minY);
        
        const difficultyMultiplier = 1 + (this.waveNumber * 0.1);
        enemy.speed *= difficultyMultiplier;
        
        if (Math.random() < 0.3) {
            enemy.health += Math.floor(this.waveNumber / 5);
            enemy.maxHealth = enemy.health;
        }
        
        gameState.enemies.push(enemy);
        this.enemiesSpawned++;
    }
}
    
    // ДОПОЛНИТЕЛЬНАЯ ВОЛНА (группа врагов) - ТОЖЕ ИСПРАВЛЕНА
    spawnBonusWave() {
        if (!gameState || !gameState.gameActive || this.bossActive) return;
        
        const waveSize = 3 + Math.floor(this.waveNumber / 2);
        console.log(`🌊 Бонусная волна ${this.waveNumber}! Врагов: ${waveSize}`);
        
        for (let i = 0; i < waveSize; i++) {
            setTimeout(() => {
                if (gameState && gameState.gameActive && !this.bossActive) {
                    this.spawnSingleEnemy();
                }
            }, i * 400); // Задержка между врагами в волне
        }
        
        this.waveNumber++;
    }
    
    trySpawnBoss() {
        if (this.bossActive) return;
        
        // БОСС ПОЯВЛЯЕТСЯ 100% - УБИРАЕМ СЛУЧАЙНОСТЬ
        const bossType = Math.random() < 0.5 ? 'ufo' : 'yamato';
        console.log(`🎯 Появляется босс: ${bossType} (100% шанс)`);
        
        if (bossType === 'ufo') {
            this.spawnUFO();
        } else {
            this.spawnYamato();
        }
        
        // СРАЗУ СБРАСЫВАЕМ ТАЙМЕР НА 300 СЕКУНД ДЛЯ СЛЕДУЮЩЕГО БОССА
        this.bossTimer = CONFIG.INFINITE_MODE.BOSS_SPAWN_INTERVAL;
        console.log(`⏰ Следующий босс через 300 секунд`);
    }
    
    spawnUFO() {
        console.log('🛸 Появляется НЛО!');
        this.bossActive = true;
        this.currentBoss = new UFO();
        gameState.boss = this.currentBoss;
    }
    
    spawnYamato() {
        console.log('🚢 Появляется Ямато!');
        this.bossActive = true;
        this.currentBoss = new YamatoBoss();
        gameState.boss = this.currentBoss;
        this.yamatoTimer = CONFIG.INFINITE_MODE.YAMATO_DURATION;
    }
    
    endYamato() {
        console.log('⏰ Время Ямато истекло!');
        if (this.currentBoss) {
            this.currentBoss.victory();
        }
        this.cleanupBoss();
    }
    
    onBossDefeated() {
        console.log('🎉 Босс побежден в бесконечном режиме!');
        
        // НЕ очищаем босса сразу - ждем завершения анимации падения
        // Босс продолжит падать и взорвется при ударе о землю
        // cleanupBoss() будет вызван из updateCrash() когда босс завершит анимацию
        
        if (this.currentBoss) {
            console.log('⏳ Ждем завершения анимации падения босса...');
            
            // Проверяем состояние босса
            console.log('Состояние босса:', {
                type: this.currentBoss.type,
                health: this.currentBoss.health,
                crashing: this.currentBoss.crashing,
                x: this.currentBoss.x,
                y: this.currentBoss.y
            });
        } else {
            console.log('⚠️ Босс уже удален, немедленная очистка');
            this.cleanupBoss();
        }
    }
    
    cleanupBoss() {
        console.log('🔄 Босс уничтожен/уплыл, возобновляем обычный спавн');
        this.bossActive = false;
        this.currentBoss = null;
        gameState.boss = null;
        
        // ВСЕГДА сбрасываем на полный интервал после любого боя с боссом
        this.bossTimer = CONFIG.INFINITE_MODE.BOSS_SPAWN_INTERVAL;
        this.enemySpawnTimer = 0;
        
        console.log(`⏰ Следующий босс через ${this.bossTimer / 60} секунд`);
    }
    
    getUIInfo() {
        const minutes = Math.floor(this.totalTime / 3600);
        const seconds = Math.floor((this.totalTime % 3600) / 60);
        
        const bossTimeSeconds = Math.ceil(this.bossTimer / 60);
        
        let bossInfo = '';
        if (this.bossActive && this.currentBoss) {
            if (this.currentBoss.type === 'yamato') {
                const yamatoTimeSeconds = Math.ceil(this.yamatoTimer / 60);
                bossInfo = `Ямато: ${yamatoTimeSeconds}с`;
            } else {
                bossInfo = 'Босс: НЛО';
            }
        } else {
            bossInfo = `Босс через: ${bossTimeSeconds}с`; // Добавляем 100% для ясности
        }
        
        return {
            time: `Время: ${minutes}:${seconds.toString().padStart(2, '0')}`,
            wave: `Волна: ${this.waveNumber}`,
            boss: bossInfo
        };
    }

    getAvailableEnemyTypes() {
        // Все типы врагов доступны в бесконечном режиме
        return ['stuka', 'bomber', 'kamikaze', 'messerschmidt', 'nakajima', 'mitsubishi', 'fockeWulf', 'yokosuka', 'nakajimaG5N'];
    }
}