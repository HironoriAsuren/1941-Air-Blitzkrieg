// Основная игровая логика
let spawnInterval;
let screenShake = 0;
let pvoExplosion = null;
let pvoFire = null;
let gameOverTimer = null;

function startLevel(level) {
    // Загружаем прогресс перед началом уровня
    loadProgress();
    
    if (soundManager && !soundManager.initialized) {
        soundManager.initialize();
    }
    
    // Остановка всех предыдущих звуков
    soundManager.stopAll();
    
    // Проверяем, доступен ли уровень (дополнительная защита)
    if (level > gameProgress.unlockedLevels) {
        alert('Этот уровень еще не доступен! Сначала пройдите предыдущие уровни.');
        return;
    }
    
    // СБРАСЫВАЕМ АПОКАЛИПСИС ПРИ НАЧАЛЕ НОВОГО УРОВНЯ
    resetApocalypse();
    
    // Сбрасываем эффекты
    screenShake = 0;
    pvoExplosion = null;
    pvoFire = null;
    if (gameOverTimer) {
        clearTimeout(gameOverTimer);
        gameOverTimer = null;
    }
    
    gameState = {
        currentLevel: level,
        enemies: [],
        projectiles: [],
        enemyProjectiles: [],
        explosions: [],
        smokeParticles: [],
        shrapnelParticles: [],
        rocketStrikes: [],
        player: new Player(),
        gameTime: 0,
        destroyedCount: 0,
        details: 50,
        isMoving: false,
        gameActive: true,        // Игра активна - можно стрелять и двигаться
        animationActive: false,  // Анимации не активны (только после смерти)
        friendlyFighters: [],
        boss: null,
        bossSpawned: false
    };

    showGame();
    updateUI();
    updateModeIndicator();
    updateDetailsUI();
    updateAmmoSelectionUI();
    gameLoop();
    
    startEnemySpawning();
}

function startInfiniteWar() {
    // СБРАСЫВАЕМ АПОКАЛИПСИС ПРИ НАЧАЛЕ БЕСКОНЕЧНОЙ ВОЙНЫ
    resetApocalypse();

    // Инициализация звуков
    if (soundManager && !soundManager.initialized) {
        soundManager.initialize();
    }
    
    soundManager.stopAll();
    
    // Сбрасываем эффекты
    screenShake = 0;
    pvoExplosion = null;
    pvoFire = null;
    if (gameOverTimer) {
        clearTimeout(gameOverTimer);
        gameOverTimer = null;
    }
    
    gameState = {
        currentLevel: 'infinite',
        enemies: [],
        projectiles: [],
        enemyProjectiles: [],
        explosions: [],
        smokeParticles: [],
        shrapnelParticles: [],
        rocketStrikes: [],
        player: new Player(),
        gameTime: 0,
        destroyedCount: 0,
        details: 100, // Стартовые шестерни
        isMoving: false,
        gameActive: true,
        animationActive: false,
        friendlyFighters: [],
        boss: null,
        bossSpawned: false,
        infiniteWar: new InfiniteWar() // Добавляем менеджер бесконечной войны
    };

    showGame();
    updateUI();
    updateModeIndicator();
    updateDetailsUI();
    updateAmmoSelectionUI();
    gameLoop();
    
    console.log('🎮 Запущен режим: Бесконечная война!');
}

function resetApocalypse() {
    console.log('🔄 Сбрасываем состояние апокалипсиса');
    
    // Сбрасываем все глобальные переменные апокалипсиса
    apocalypseActive = false;
    apocalypseTimer = 0;
    
    // Останавливаем все интервалы апокалипсиса
    // (они должны быть глобальными или храниться в gameState)
    if (window.apocalypseIntervals) {
        window.apocalypseIntervals.forEach(interval => {
            clearInterval(interval);
        });
        window.apocalypseIntervals = [];
    }
    
    // Сбрасываем тряску экрана если она была от апокалипсиса
    if (screenShake > 10) {
        screenShake = 0;
    }
    
    console.log('✅ Апокалипсис полностью сброшен');
}

// Добавляем константу стоимости починки
const REPAIR_COST = 50;
const MAX_HEALTH = 5;

// Функция починки игрока
function repairPlayer() {
    if (!gameState || !gameState.gameActive || !gameState.player) return;
    
    const player = gameState.player;
    
    // Проверяем условия для починки
    if (player.health >= MAX_HEALTH) {
        showMessage('Здоровье уже максимальное!', 'warning');
        return;
    }
    
    if (gameState.details < REPAIR_COST) {
        showMessage(`Недостаточно шестерней! Нужно ${REPAIR_COST}⚙️`, 'error');
        return;
    }
    
    // Списание шестерней и починка
    gameState.details -= REPAIR_COST;
    player.health++;
    
    // Обновляем UI
    updateDetailsUI();
    updateUI();
    
    // Визуальные эффекты
    createRepairEffect();
    showMessage('Починка +1❤️', 'info');
    
    console.log(`🔧 Починка! Здоровье: ${player.health}/${MAX_HEALTH}`);
}

// Создаем визуальный эффект починки
function createRepairEffect() {
    if (!gameState || !gameState.player) return;
    
    const player = gameState.player;
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Эффект зеленого свечения
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const particle = {
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            life: 30,
            size: 3 + Math.random() * 4,
            color: '#4caf50',
            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                this.life--;
                this.size *= 0.95;
                return this.life > 0;
            },
            draw: function() {
                const alpha = this.life / 30;
                ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        if (!gameState.effects) gameState.effects = [];
        gameState.effects.push(particle);
    }
    
    // Зеленый взрыв в центре
    gameState.explosions.push(new RepairExplosion(centerX, centerY));
    
    // Легкая тряска экрана
    screenShake = Math.max(screenShake, 3);
}

function startEnemySpawning() {
    if (spawnInterval) {
        clearInterval(spawnInterval);
    }
    
    const enemiesForThisLevel = CONFIG.getEnemiesForLevel(gameState.currentLevel);
    
    spawnInterval = setInterval(() => {
        if (!gameState || !gameState.gameActive) {
            return;
        }

        if (!gameState.bossSpawned && 
            gameState.destroyedCount >= enemiesForThisLevel) {
            
            updateUI();
            
            if (CONFIG.UFO.BOSS_LEVELS.includes(gameState.currentLevel)) {
                showBossDialog(
                    'images/erich_scholz.png',
                    'Эрих Шольц',
                    'Узри же жалкий унтерменш! Летающий тарелка третьего рейха! Здесь ты и вырыл свой могила!',
                    playNaziOfficer
                );
            } else if (gameState.currentLevel === 10) {
                showBossDialog(
                    'images/tsushima_yakamoto.png', 
                    'Цусима Якамото',
                    'Императорский флот в атаку! За ИМПЕРАТОРА! Да благославит нас Аматэрасу!',
                    playJapaneseAdmiral
                );
            } else {
                clearInterval(spawnInterval);
                setTimeout(() => levelComplete(), 2000);
            }
            return;
        }

        if (gameState.enemies.length < enemiesForThisLevel - gameState.destroyedCount) {
            const rand = Math.random();
            let enemyType;
            
            // Уровни 1-5: Немецкие самолеты
            if (gameState.currentLevel <= 5) {
                if (rand < 0.40) { // 40%
                    enemyType = 'stuka';
                } else if (rand < 0.70) { // 30%
                    enemyType = 'bomber';
                } else if (rand < 0.85) { // 15%
                    enemyType = 'messerschmidt';
                } else { // 15%
                    enemyType = 'fockeWulf'; // Дополнительный шанс для разведчика
                }
            }
            // Уровни 6-10: Японские самолеты
            else {
                if (rand < 0.25) { // 25%
                    enemyType = 'nakajima';
                } else if (rand < 0.45) { // 20%
                    enemyType = 'mitsubishi';
                } else if (rand < 0.60) { // 15%
                    enemyType = 'yokosuka'; // новый торпедоносец
                } else if (rand < 0.75) { // 15%
                    enemyType = 'nakajimaG5N'; // новый бомбардировщик
                } else if (rand < 0.85) { // 10%
                    enemyType = 'kamikaze';
                } else if (rand < 0.92) { // 7%
                    enemyType = 'yokosuka'; // дополнительный шанс для торпедоносца
                } else { // 8%
                    enemyType = 'nakajimaG5N'; // дополнительный шанс для бомбардировщика
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
                case 'fockeWulf': // новый
                    enemy = new FockeWulf();
                    break;
                case 'yokosuka': // новый
                    enemy = new Yokosuka();
                    break;
                case 'nakajimaG5N': // новый
                    enemy = new NakajimaG5N();
                    break;
            }
            gameState.enemies.push(enemy);
        }

        if (gameState.destroyedCount >= enemiesForThisLevel && !CONFIG.UFO.BOSS_LEVELS.includes(gameState.currentLevel) && gameState.currentLevel !== 10) {
            clearInterval(spawnInterval);
            setTimeout(() => levelComplete(), 2000);
        }
    }, 1500);
}
function spawnBoss() {
    console.log('🚀 Спавним босса НЛО...');
    gameState.bossSpawned = true;
    gameState.boss = new UFO();
    
    // ОБНОВЛЯЕМ UI ЧТОБЫ СКРЫТЬ СЧЕТЧИК САМОЛЕТОВ
    updateUI();
    
    console.log('🛸 Босс создан:', {
        x: gameState.boss.x,
        y: gameState.boss.y, 
        width: gameState.boss.width,
        phase: gameState.boss.phase
    });
    
    clearInterval(spawnInterval);
    spawnInterval = null;
}

function spawnYamato() {
    console.log('🚢 Спавним босса Ямато...');
    gameState.bossSpawned = true;
    gameState.boss = new YamatoBoss();
    
    // ОБНОВЛЯЕМ UI ЧТОБЫ СКРЫТЬ СЧЕТЧИК САМОЛЕТОВ
    updateUI();
    
    clearInterval(spawnInterval);
    spawnInterval = null;
}

function gameLoop() {
    if (!gameState) return;
    
    // Если игра полностью остановлена - выходим
    if (!gameState.gameActive && !gameState.animationActive) {
        return;
    }
    
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (!gameState) return;
    
    // Обновляем эффекты уклонения
    if (gameState.dodgeEffects) {
        for (let i = gameState.dodgeEffects.length - 1; i >= 0; i--) {
            const effect = gameState.dodgeEffects[i];
            if (!effect.update()) {
                gameState.dodgeEffects.splice(i, 1);
            }
        }
    }
    
    // Обновляем бесконечную войну если активна
    if (gameState.infiniteWar) {
        gameState.infiniteWar.update();
    }
    
    // Обновляем эффекты (сообщения, анимации)
    if (gameState.effects) {
        for (let i = gameState.effects.length - 1; i >= 0; i--) {
            if (!gameState.effects[i].update()) {
                gameState.effects.splice(i, 1);
            }
        }
    }

    // столб воты
    if (gameState.specialEffects) {
        for (let i = gameState.specialEffects.length - 1; i >= 0; i--) {
            if (!gameState.specialEffects[i].update()) {
                gameState.specialEffects.splice(i, 1);
            }
        }
    }


    // Обновляем специальные предметы (фуражка НЛО)
    if (gameState.specialItems) {
        for (let i = gameState.specialItems.length - 1; i >= 0; i--) {
            const item = gameState.specialItems[i];
            if (!item.update()) {
                gameState.specialItems.splice(i, 1);
                console.log('🎩 Фуражка удалена из игры');
            }
        }
    }

    // Обновляем апокалипсис
    updateApocalypse();
    
    // Если игра полностью остановлена - выходим
    if (!gameState.gameActive && !gameState.animationActive) {
        return;
    }
    
    gameState.gameTime++;

    // ОТЛАДКА: Проверяем босса каждые 60 кадров
    if (gameState.gameTime % 60 === 0 && gameState.boss) {
        console.log('🔍 Босс в update():', {
            x: gameState.boss.x,
            y: gameState.boss.y,
            phase: gameState.boss.phase,
            health: gameState.boss.health,
            crashing: gameState.boss.crashing,
            gameTime: gameState.gameTime
        });
    }

    // Обновляем тряску экрана (всегда)
    if (screenShake > 0) {
        screenShake *= 0.9;
        if (screenShake < 0.1) screenShake = 0;
    }

    // Обновляем эффекты (всегда)
    if (pvoExplosion) {
        if (!pvoExplosion.update()) {
            pvoExplosion = null;
        }
    }

    if (pvoFire) {
        if (!pvoFire.update()) {
            pvoFire = null;
        }
    }

    // Обновляем босса если есть
    if (gameState.boss) {
        if (!gameState.boss.update()) {
            console.log('🛸 Босс уничтожен или удален');
            
            // РАЗДЕЛЯЕМ ЛОГИКУ ДЛЯ ОБЫЧНЫХ УРОВНЕЙ И БЕСКОНЕЧНОГО РЕЖИМА
            if (gameState.currentLevel === 'infinite') {
                // ДЛЯ БЕСКОНЕЧНОГО РЕЖИМА - уже обработано в onBossDefeated()
                console.log('Босс удален в бесконечном режиме');
            } else {
                // ДЛЯ ОБЫЧНЫХ УРОВНЕЙ - завершаем уровень
                console.log('🎉 Босс полностью уничтожен! Завершаем уровень...');
                setTimeout(() => levelComplete(), 2000);
            }
            
            gameState.boss = null;
        }
    }

    // Обновляем ракетные удары
    for (let i = gameState.rocketStrikes.length - 1; i >= 0; i--) {
        const strike = gameState.rocketStrikes[i];
        
        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА ДЛЯ ФАУ-2
        if (strike instanceof Fau2Rocket) {
            // Принудительно взрываем если ракета застряла в земле
            if (strike.y > CONFIG.CANVAS_HEIGHT - 40 && !strike.exploded) {
                console.log('🔄 Принудительный взрыв застрявшей Фау-2!');
                strike.explode();
            }
        }
        
        if (!strike.update()) {
            gameState.rocketStrikes.splice(i, 1);
        }
    }

    // Если только анимация (после смерти) - обновляем только визуальные эффекты
    if (!gameState.gameActive && gameState.animationActive) {
        updateAnimationsOnly();
        return;
    }

    // ОБЫЧНАЯ ИГРОВАЯ ЛОГИКА (игра активна)
    
    // Обновление игрока (движение и стрельба)
    gameState.player.update();

    // ОБНОВЛЯЕМ ЦВЕТЫ САКУРЫ
    if (gameState.sakuraFlowers) {
        for (let i = gameState.sakuraFlowers.length - 1; i >= 0; i--) {
            const flower = gameState.sakuraFlowers[i];
            if (!flower || !flower.update()) {
                gameState.sakuraFlowers.splice(i, 1);
            }
        }
    }

    // Обновление снарядов игрока
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        
        // ЗАЩИТНАЯ ПРОВЕРКА
        if (!projectile) {
            gameState.projectiles.splice(i, 1);
            continue;
        }
        
        if (!projectile.update()) {
            gameState.projectiles.splice(i, 1);
            continue;
        }

        // Проверка столкновения с боссом
        if (gameState.boss && checkCollision(projectile, gameState.boss)) {
        // ЕСЛИ БОСС НЕ ЯМАТО - НАНОСИМ УРОН (ДАЖЕ ЕСЛИ НЕВИДИМЫЙ)
        if (gameState.boss.type !== 'yamato') {
            // ОСОБАЯ ЛОГИКА ДЛЯ ОСКОЛОЧНЫХ СНАРЯДОВ
            if (projectile.type === 'explosive' && !projectile.hasExploded) {
                // Осколочный снаряд взрывается при столкновении с боссом
                projectile.explode();
                console.log('💥 Осколочный снаряд взорвался на боссе!');
            } else if (projectile.type !== 'explosive') {
                // Обычные и прошивные снаряды наносят урон напрямую
                
                // УРОН НАНОСИТСЯ ДАЖЕ НА НЕВИДИМОЕ НЛО
                const bossDestroyed = gameState.boss.takeDamage(1);
                
                if (bossDestroyed) {
                    console.log('🎯 БОСС получил смертельный урон! Запускаем падение...');
                    
                    // ДЛЯ БЕСКОНЕЧНОГО РЕЖИМА - обрабатываем через InfiniteWar
                    if (gameState.currentLevel === 'infinite' && gameState.infiniteWar) {
                        gameState.infiniteWar.onBossDefeated();
                    }
                }
            }
        }
        // ДЛЯ ЯМАТО - НИЧЕГО НЕ ДЕЛАЕМ, СНАРЯД ПРОЛЕТАЕТ СКВОЗЬ
        
        // УДАЛЯЕМ СНАРЯД (КРОМЕ ПРОШИВНЫХ) - но не для Ямато
        if (projectile.type !== 'piercing' && gameState.boss.type !== 'yamato') {
            gameState.projectiles.splice(i, 1);
        } else if (projectile.type === 'piercing' && gameState.boss.type !== 'yamato') {
            // ДЛЯ ПРОШИВНЫХ СНАРЯДОВ - ДОБАВЛЯЕМ БОССА В СПИСОК ПРОБИТЫХ
            if (!projectile.piercedEnemies) projectile.piercedEnemies = [];
            projectile.piercedEnemies.push(gameState.boss);
            
            // ПРОВЕРЯЕМ ЛИМИТ ПРОБИТИЯ
            const totalPierced = projectile.piercedEnemies.length + (projectile.piercedMissiles ? projectile.piercedMissiles.length : 0);
            if (totalPierced >= projectile.maxPierce) {
                console.log('⚡ Прошивной снаряд достиг лимита пробития после босса!');
                gameState.projectiles.splice(i, 1);
            }
        }
        
        continue;
    }
        // ПРОВЕРКА СТОЛКНОВЕНИЯ С МИНИ-РАКЕТАМИ (ДЛЯ ВСЕХ ТИПОВ СНАРЯДОВ)
        let projectileHitMissile = false;
        let piercedMissiles = 0;
        
        for (let j = gameState.enemyProjectiles.length - 1; j >= 0; j--) {
            const enemyProj = gameState.enemyProjectiles[j];
            
            // ПРОВЕРЯЕМ ТОЛЬКО guidedMissile И УБЕДИМСЯ ЧТО ОБЪЕКТЫ СУЩЕСТВУЮТ
            if (enemyProj && enemyProj.type === 'guidedMissile' && 
                projectile && checkCollision(projectile, enemyProj)) {
                
                console.log('💥 Снаряд попал в мини-ракету! Тип:', projectile.type);
                
                // ОСОБАЯ ЛОГИКА ДЛЯ ПРОШИВНЫХ СНАРЯДОВ
                if (projectile.type === 'piercing') {
                    // ПРОШИВНОЙ СНАРЯД - МОЖЕТ ПРОБИТЬ НЕСКОЛЬКО МИНИ-РАКЕТ
                    if (!projectile.piercedMissiles) {
                        projectile.piercedMissiles = [];
                    }
                    
                    // ПРОВЕРЯЕМ ЧТО ЭТУ МИНИ-РАКЕТУ ЕЩЕ НЕ ПРОБИВАЛИ
                    if (!projectile.piercedMissiles.includes(enemyProj)) {
                        projectile.piercedMissiles.push(enemyProj);
                        piercedMissiles++;
                        
                        // НАНОСИМ УРОН МИНИ-РАКЕТЕ
                        if (enemyProj.takeDamage && typeof enemyProj.takeDamage === 'function') {
                            if (enemyProj.takeDamage()) {
                                // Мини-ракета уничтожена
                                gameState.enemyProjectiles.splice(j, 1);
                                console.log('💥 Мини-ракета уничтожена прошивным снарядом!');
                            } else {
                                // Мини-ракета получила урон но не уничтожена
                                console.log('🎯 Мини-ракета получила урон от прошивного снаряда!');
                            }
                        }
                        
                        // ПРОВЕРЯЕМ ЛИМИТ ПРОБИВАНИЯ ДЛЯ ПРОШИВНЫХ СНАРЯДОВ
                        // ОБЩИЙ ЛИМИТ ДЛЯ ВСЕХ ЦЕЛЕЙ (ВРАГИ + МИНИ-РАКЕТЫ)
                        const totalPierced = (projectile.piercedEnemies ? projectile.piercedEnemies.length : 0) + 
                                           piercedMissiles;
                        
                        if (totalPierced >= projectile.maxPierce) {
                            console.log('⚡ Прошивной снаряд достиг лимита пробития! Всего пробито:', totalPierced);
                            gameState.projectiles.splice(i, 1);
                            projectileHitMissile = true;
                            break;
                        }
                    }
                } else {
                    // ОБЫЧНЫЕ И ОСКОЛОЧНЫЕ СНАРЯДЫ - УДАЛЯЕМСЯ ПРИ СТОЛКНОВЕНИИ
                    gameState.projectiles.splice(i, 1);
                    projectileHitMissile = true;
                    
                    // НАНОСИМ УРОН МИНИ-РАКЕТЕ
                    if (enemyProj.takeDamage && typeof enemyProj.takeDamage === 'function') {
                        if (enemyProj.takeDamage()) {
                            // Мини-ракета уничтожена
                            gameState.enemyProjectiles.splice(j, 1);
                            console.log('💥 Мини-ракета уничтожена!');
                        } else {
                            // Мини-ракета получила урон но не уничтожена
                            console.log('🎯 Мини-ракета получила урон!');
                        }
                    }
                    
                    break;
                }
            }
        }

        // ЕСЛИ СНАРЯД ПОПАЛ В МИНИ-РАКЕТУ И БЫЛ УДАЛЕН - ПРЕКРАЩАЕМ ДАЛЬНЕЙШУЮ ОБРАБОТКУ
        if (projectileHitMissile) {
            continue;
        }

        // ОБРАБОТКА СТОЛКНОВЕНИЙ С ОБЫЧНЫМИ ВРАГАМИ ДЛЯ РАЗНЫХ ТИПОВ СНАРЯДОВ
        if (projectile.type === 'piercing') {
            // Прошивной снаряд - может пробить несколько врагов
            let piercedCount = 0;
            let damageDealt = 0;
            const maxDamagePerShot = 2;
            
            for (let j = gameState.enemies.length - 1; j >= 0 && piercedCount < projectile.maxPierce && damageDealt < maxDamagePerShot; j--) {
                const enemy = gameState.enemies[j];
                if (enemy && checkCollision(projectile, enemy)) {
                    
                    // ПРОВЕРКА УКЛОНЕНИЯ САКУРЫ для прошивных снарядов
                    if (gameState.boss && gameState.boss.type === 'yamato' && 
                        gameState.boss.checkDodge && gameState.boss.checkDodge(enemy, projectile)) {
                        console.log(`🌸 ${enemy.type} уклонился от прошивного снаряда!`);
                        continue; // Пропускаем этого врага, но снаряд продолжает полет
                    }
                    
                    // Остальная логика прошивного снаряда без изменений...
                    if (!projectile.piercedEnemies.includes(enemy)) {
                        if (damageDealt < maxDamagePerShot) {
                            enemy.takeDamage();
                            if (typeof playRandomHitSound === 'function') {
                                playRandomHitSound();
                            }
                            damageDealt++;
                            console.log(`⚡ Прошивной снаряд нанес урон врагу! Всего урона: ${damageDealt}/${maxDamagePerShot}`);
                        }
                        
                        projectile.piercedEnemies.push(enemy);
                        piercedCount++;
                        
                        // ОБЩИЙ ЛИМИТ ДЛЯ ВСЕХ ЦЕЛЕЙ
                        const totalPierced = piercedCount + (projectile.piercedMissiles ? projectile.piercedMissiles.length : 0);
                        console.log(`⚡ Прошивной снаряд пробил врага! Всего пробито: ${totalPierced}/${projectile.maxPierce}, Урона: ${damageDealt}/${maxDamagePerShot}`);
                        
                        if (totalPierced >= projectile.maxPierce || damageDealt >= maxDamagePerShot) {
                            console.log('⚡ Прошивной снаряд достиг лимита!');
                            gameState.projectiles.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        } else if (projectile.type === 'explosive') {
            // Разрывной снаряд - взрывается при попадании
            let hitEnemy = false;
            
            for (let j = gameState.enemies.length - 1; j >= 0; j--) {
                const enemy = gameState.enemies[j];
                if (enemy && checkCollision(projectile, enemy)) {
                    
                    // ПРОВЕРКА УКЛОНЕНИЯ САКУРЫ для осколочных снарядов
                    if (gameState.boss && gameState.boss.type === 'yamato' && 
                        gameState.boss.checkDodge && gameState.boss.checkDodge(enemy, projectile)) {
                        console.log(`🌸 ${enemy.type} уклонился от осколочного снаряда!`);
                        continue; // Пропускаем этого врага
                    }
                    
                    // Если хоть один враг не уклонился - взрываемся
                    hitEnemy = true;
                    break;
                }
            }
            
            if (hitEnemy) {
                projectile.explode();
                if (typeof playRandomHitSound === 'function') {
                    playRandomHitSound();
                }
                gameState.projectiles.splice(i, 1);
                console.log('💥 Осколочный снаряд взорвался на враге!');
            }
        } else {
            // Обычный снаряд - стандартное поведение (1 урон)
            for (let j = gameState.enemies.length - 1; j >= 0; j--) {
                const enemy = gameState.enemies[j];
                if (enemy && checkCollision(projectile, enemy)) {
                    
                    // ПРОВЕРКА УКЛОНЕНИЯ САКУРЫ (добавляем projectile в параметры)
                    if (gameState.boss && gameState.boss.type === 'yamato' && 
                        gameState.boss.checkDodge && gameState.boss.checkDodge(enemy, projectile)) {
                        // Враг уклонился - снаряд пролетает сквозь него
                        console.log(`🌸 ${enemy.type} уклонился от снаряда!`);
                        continue; // Переходим к следующему врагу, этот снаряд НЕ удаляется
                    }
                    
                    // Если не было уклонения - наносим урон как обычно
                    enemy.takeDamage();

                    if (typeof playRandomHitSound === 'function') {
                        playRandomHitSound();
                    }

                    gameState.projectiles.splice(i, 1);
                    console.log('🎯 Обычный снаряд попал во врага!');
                    break;
                }
            }
        }

        // Проверка столкновений с дружественными истребителями
        if (!projectile.isFriendly) {
            for (let j = gameState.friendlyFighters.length - 1; j >= 0; j--) {
                const fighter = gameState.friendlyFighters[j];
                if (fighter && checkCollision(projectile, fighter)) {
                    if (fighter.takeDamage()) {
                        if (checkCollision(fighter, gameState.player)) {
                            startPvoDestruction();
                        }
                        gameState.friendlyFighters.splice(j, 1);
                    }
                    gameState.projectiles.splice(i, 1);
                    break;
                }
            }
        }
    }

    // Обновление вражеских снарядов
    for (let i = gameState.enemyProjectiles.length - 1; i >= 0; i--) {
        const enemyProjectile = gameState.enemyProjectiles[i];
        if (!enemyProjectile || !enemyProjectile.update()) {
            gameState.enemyProjectiles.splice(i, 1);
            continue;
        }

        // Проверка столкновений с игроком
        if (checkCollision(enemyProjectile, gameState.player)) {
            gameState.player.health--;
            gameState.explosions.push(new Explosion(
                enemyProjectile.x,
                enemyProjectile.y,
                20
            ));
            
            screenShake = 5;
            gameState.enemyProjectiles.splice(i, 1);
            
            if (gameState.player.health <= 0 && !pvoExplosion) {
                startPvoDestruction();
                return;
            }
        }

        // Проверка столкновений с дружественными истребителями
        for (let j = gameState.friendlyFighters.length - 1; j >= 0; j--) {
            const fighter = gameState.friendlyFighters[j];
            if (fighter && checkCollision(enemyProjectile, fighter)) {
                if (fighter.takeDamage()) {
                    if (checkCollision(fighter, gameState.player)) {
                        startPvoDestruction();
                    }
                    gameState.friendlyFighters.splice(j, 1);
                }
                gameState.enemyProjectiles.splice(i, 1);
                break;
            }
        }
    }

    // Обновление осколков
    for (let i = gameState.shrapnelParticles.length - 1; i >= 0; i--) {
        const shrapnel = gameState.shrapnelParticles[i];
        if (!shrapnel || !shrapnel.update()) {
            gameState.shrapnelParticles.splice(i, 1);
        }
    }

    // Обновление врагов
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        
        if (!enemy) {
            gameState.enemies.splice(i, 1);
            continue;
        }
        
        if (!enemy.update()) {
            // ВРАГ УНИЧТОЖЕН - УВЕЛИЧИВАЕМ СЧЕТЧИК
            if (enemy.isCrashing) {
                gameState.destroyedCount++;
            }
            gameState.enemies.splice(i, 1);
            continue;
        }
        
        // Проверка столкновения с игроком
        if (enemy.checkCollisionWithPlayer && typeof enemy.checkCollisionWithPlayer === 'function') {
            if (enemy.checkCollisionWithPlayer()) {
                startPvoDestruction();
                return;
            }
        }
    }

    // Обновление дружественных истребителей
    for (let i = gameState.friendlyFighters.length - 1; i >= 0; i--) {
        const fighter = gameState.friendlyFighters[i];
        
        // ЗАЩИТНАЯ ПРОВЕРКА
        if (!fighter) {
            console.warn('⚠️ Обнаружен несуществующий истребитель, удаляем');
            gameState.friendlyFighters.splice(i, 1);
            continue;
        }
        
        if (typeof fighter.update === 'function') {
            try {
                if (!fighter.update()) {
                    console.log('✈️ Удаляем истребитель из игры');
                    gameState.friendlyFighters.splice(i, 1);
                }
            } catch (error) {
                console.error('Ошибка при обновлении истребителя:', error);
                gameState.friendlyFighters.splice(i, 1);
            }
        } else {
            console.warn('⚠️ Истребитель без метода update, удаляем');
            gameState.friendlyFighters.splice(i, 1);
        }
    }

    // Обновление взрывов
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        const explosion = gameState.explosions[i];
        if (!explosion || !explosion.update()) {
            gameState.explosions.splice(i, 1);
        }
    }

    // Обновление дыма
    for (let i = gameState.smokeParticles.length - 1; i >= 0; i--) {
        const smoke = gameState.smokeParticles[i];
        if (!smoke || !smoke.update()) {
            gameState.smokeParticles.splice(i, 1);
        }
    }

    // Проверка здоровья игрока
    if (gameState.player.health <= 0 && !pvoExplosion) {
        startPvoDestruction();
        return;
    }

    // Проверка окончания боеприпасов
    if (gameState.player.ammoInventory.normal <= 0 && 
        gameState.player.ammoInventory.piercing <= 0 && 
        gameState.player.ammoInventory.explosive <= 0 && 
        gameState.projectiles.length === 0 && 
        gameState.enemies.length > 0 && 
        gameState.destroyedCount < CONFIG.ENEMIES_PER_LEVEL) {
        gameOver();
        return;
    }

    updateUI();
    updateAmmoSelectionUI();
}

// Вынес обновление визуальных эффектов в отдельную функцию
function updateVisualEffects() {
    // Взрывы
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        const explosion = gameState.explosions[i];
        if (!explosion || !explosion.update()) {
            gameState.explosions.splice(i, 1);
        }
    }

    // Дым
    for (let i = gameState.smokeParticles.length - 1; i >= 0; i--) {
        const smoke = gameState.smokeParticles[i];
        if (!smoke || !smoke.update()) {
            gameState.smokeParticles.splice(i, 1);
        }
    }

    // Осколки
    for (let i = gameState.shrapnelParticles.length - 1; i >= 0; i--) {
        const shrapnel = gameState.shrapnelParticles[i];
        if (!shrapnel || !shrapnel.update()) {
            gameState.shrapnelParticles.splice(i, 1);
        }
    }
}

// Новая функция для обновления только анимаций
function updateAnimationsOnly() {
    // После смерти обновляем только визуальные эффекты
    updateVisualEffects();
    
    // И ракетные удары (включая новые Фау-2)
    for (let i = gameState.rocketStrikes.length - 1; i >= 0; i--) {
        const strike = gameState.rocketStrikes[i];
        if (!strike) {
            gameState.rocketStrikes.splice(i, 1);
            continue;
        }
        
        // Поддержка как старых RocketStrike, так и новых Fau2Rocket
        if (strike.update && !strike.update()) {
            gameState.rocketStrikes.splice(i, 1);
        }
    }
    
    // Обновляем босса если он есть (только анимацию)
    if (gameState.boss) {
        // Для босса вызываем только draw(), но не update()
        // Или если у босса есть отдельный метод для анимации
    }
    
    // Обновляем врагов (только анимацию падения)
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        if (enemy && enemy.isCrashing) {
            // Обновляем только падающих врагов
            if (!enemy.update()) {
                gameState.enemies.splice(i, 1);
            }
        }
        // Не обновляем живых врагов - только анимацию падения
    }
}

function startPvoDestruction() {
    console.log('💥 ПВО уничтожена! Запускаем финальную анимацию...');
    
    // Останавливаем все звуки при уничтожении ПВО
    soundManager.stopAll();
    
    // Устанавливаем здоровье в 0
    gameState.player.health = 0;
    
    // НЕ останавливаем игру сразу, даем 3 секунды на анимацию
    gameState.gameActive = false; // Останавливаем игровую логику
    gameState.animationActive = true; // Но оставляем анимации
    
    // Останавливаем спавн врагов
    if (spawnInterval) {
        clearInterval(spawnInterval);
        spawnInterval = null;
    }
    
    // Останавливаем босса
    if (gameState.boss) {
        gameState.boss.gameActive = false;
    }
    
    // Создаем взрыв ПВО
    const playerCenterX = gameState.player.x + gameState.player.width / 2;
    const playerCenterY = gameState.player.y + gameState.player.height / 2;
    
    pvoExplosion = new PvoExplosion(playerCenterX, playerCenterY);
    
    // Сильная тряска экрана
    screenShake = 20;
    
    // Создаем несколько дополнительных взрывов
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            if (gameState && gameState.animationActive) { // ПРОВЕРЯЕМ ЧТО АНИМАЦИИ ЕЩЕ АКТИВНЫ
                gameState.explosions.push(new Explosion(
                    playerCenterX + (Math.random() - 0.5) * 30,
                    playerCenterY + (Math.random() - 0.5) * 20,
                    25 + Math.random() * 15
                ));
            }
        }, i * 200);
    }
    
    // Создаем огонь после взрыва
    setTimeout(() => {
        if (gameState && gameState.animationActive) {
            pvoFire = new PvoFire(playerCenterX, playerCenterY);
        }
    }, 500);
    
    // Показываем окно поражения через 3 секунды
    gameOverTimer = setTimeout(() => {
        stopAllAnimations();
        showGameOver();
    }, 3000);
}

// Новая функция для полной остановки всех анимаций
function stopAllAnimations() {
    console.log('🛑 Останавливаем все анимации...');
    
    // Останавливаем все игровые процессы
    if (gameState) {
        gameState.animationActive = false;
        gameState.gameActive = false;
    }
    
    // Очищаем все массивы с анимациями
    if (gameState) {
        gameState.projectiles = [];
        gameState.enemyProjectiles = [];
        gameState.rocketStrikes = [];
        gameState.friendlyFighters = [];
    }
    
    // Останавливаем все таймеры
    if (gameOverTimer) {
        clearTimeout(gameOverTimer);
        gameOverTimer = null;
    }
}

function showGameOver() {
    console.log('🎮 Показываем окно поражения');
    
    // Останавливаем все звуки
    soundManager.stopAll();
    
    // СБРАСЫВАЕМ АПОКАЛИПСИС ПРИ ПОРАЖЕНИИ
    resetApocalypse();
    
    // Полностью останавливаем все
    stopAllAnimations();
    
    alert(`Игра окончена! Уровень ${gameState.currentLevel}. Уничтожено самолетов: ${gameState.destroyedCount}`);
    showLevelSelect();
}

function render() {
    if (!gameState) return;

    ctx.save();
    
    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
    }
    
    // Очистка canvas для бесконечного режима
    if (gameState.currentLevel === 'infinite') {
        drawInfiniteBackground();
    } else if (gameState.currentLevel >= 6 && gameState.currentLevel <= 10) {
        drawOceanBackground();
    } else {
        drawSkyBackground();
    }

    // ЗЕМЛЯ для бесконечного режима
    if (gameState.currentLevel === 'infinite') {
        drawInfiniteLand();
    } else if (gameState.currentLevel >= 6 && gameState.currentLevel <= 10) {
        drawSakuraLand(); // Используем исправленную версию
    } else {
        // Обычная земля для уровней 1-5
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - 50, CONFIG.CANVAS_WIDTH, 50);
        ctx.fillStyle = '#388e3c';
        ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - 50, CONFIG.CANVAS_WIDTH, 10);
    }

    // ФУРАЖКА РИСУЕТСЯ ЗДЕСЬ - НА ТРАВЕ
    if (gameState.specialItems) {
        gameState.specialItems.forEach(item => {
            if (item && item.draw) {
                item.draw();
            }
        });
    }

    // Облака (только для небесных уровней)
    if (gameState.currentLevel <= 5) {
        for (let i = 0; i < 5; i++) {
            const cloudX = (gameState.gameTime * 0.1 + i * 200) % (CONFIG.CANVAS_WIDTH + 200) - 100;
            const cloudY = 50 + i * 40;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(cloudX, cloudY, 20, 0, Math.PI * 2);
            ctx.arc(cloudX + 15, cloudY - 5, 15, 0, Math.PI * 2);
            ctx.arc(cloudX + 30, cloudY, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ОТРИСОВКА ЯМАТО
    if (gameState.boss && gameState.boss.type === 'yamato') {
        gameState.boss.draw();
    }

    // ОСТАЛЬНАЯ ОТРИСОВКА
    gameState.rocketStrikes.forEach(strike => strike.draw());
    gameState.smokeParticles.forEach(smoke => smoke.draw());
    gameState.enemies.forEach(enemy => enemy.draw());
    gameState.friendlyFighters.forEach(fighter => fighter.draw());
    gameState.projectiles.forEach(projectile => projectile.draw());
    gameState.enemyProjectiles.forEach(projectile => projectile.draw());
    gameState.explosions.forEach(explosion => explosion.draw());
    gameState.shrapnelParticles.forEach(shrapnel => shrapnel.draw());
    
    // РЯБЬ ОТ ЯМАТО (оставляем только для босса)
    if (gameState.boss && gameState.boss.type === 'yamato' && gameState.boss.wakeParticles) {
        gameState.boss.wakeParticles.forEach(particle => particle.draw());
    }
    
    if (pvoExplosion) {
        pvoExplosion.draw();
    }
    
    if (pvoFire) {
        pvoFire.draw();
    }
    
    if (gameState.boss && gameState.boss.type !== 'yamato') {
        gameState.boss.draw();
    }
    
    if (gameState.player.health > 0) {
        gameState.player.draw();
    }

    // Отрисовываем эффекты уклонения (поверх врагов)
    if (gameState.dodgeEffects) {
        gameState.dodgeEffects.forEach(effect => effect.draw());
    }

    // Отрисовка специальных эффектов
    if (gameState.specialEffects) {
        gameState.specialEffects.forEach(effect => effect.draw());
    }
    // Отрисовка дымзавес ПОСЛЕ всего (поверх самолетов и индикаторов)
    if (gameState.enemies) {
        gameState.enemies.forEach(enemy => {
            if (enemy instanceof NakajimaG5N && enemy.smokeScreens) {
                enemy.smokeScreens.forEach(smoke => smoke.draw());
            }
        });
    }

    // ОТРИСОВКА ЦВЕТОВ САКУРЫ (после врагов, но перед ПВО)
    if (gameState.sakuraFlowers) {
        gameState.sakuraFlowers.forEach(flower => {
            if (flower && flower.draw) {
                flower.draw();
            }
        });
    }

    // Индикатор здоровья игрока
    ctx.fillStyle = '#ff4444';
    for (let i = 0; i < 5; i++) {
        if (i < gameState.player.health) {
            ctx.fillStyle = '#4caf50';
        } else {
            ctx.fillStyle = '#757575';
        }
        ctx.fillRect(20 + i * 25, CONFIG.CANVAS_HEIGHT - 40, 20, 10);
    }
    
    ctx.restore();
}

// Новые функции для фона бесконечного режима
function drawInfiniteBackground() {
    // Градиентное небо для бесконечного режима
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#4A5568'); // Серо-синий
    gradient.addColorStop(0.6, '#2D3748'); // Темно-серый
    gradient.addColorStop(1, '#1A202C'); // Очень темный
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // Облака для атмосферы
    drawBattleClouds();
}

function drawInfiniteLand() {
    // Светло-серая земля
    ctx.fillStyle = '#A0AEC0';
    ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - 50, CONFIG.CANVAS_WIDTH, 50);
    
    // Трава цвета асфальт - БЕЗ АНИМАЦИИ
    ctx.fillStyle = '#718096';
    ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - 50, CONFIG.CANVAS_WIDTH, 10);
    
}

function drawBattleClouds() {
    // Дымные облака для атмосферы войны
    for (let i = 0; i < 3; i++) {
        const cloudX = (gameState.gameTime * 0.02 + i * 500) % (CONFIG.CANVAS_WIDTH + 600) - 300;
        const cloudY = 60 + (i % 2) * 80;
        const cloudSize = 80 + i * 15;
        
        drawSmokeCloud(cloudX, cloudY, cloudSize);
    }
}

function drawSmokeCloud(x, y, size) {
    ctx.save();
    
    const smokeGradient = ctx.createRadialGradient(
        x + size/2, y + size/3, 0,
        x + size/2, y + size/3, size
    );
    smokeGradient.addColorStop(0, 'rgba(100, 100, 100, 0.4)');
    smokeGradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
    
    ctx.fillStyle = smokeGradient;
    
    ctx.beginPath();
    ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y + size * 0.2, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Новая функция для небесного градиента (уровни 1-5)
function drawSkyBackground() {
    // Создаем вертикальный градиент от светло-голубого к синему
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    
    // Разные градиенты для разных уровней для разнообразия
    switch(gameState.currentLevel) {
        case 1:
            // Утро - светлые тона
            gradient.addColorStop(0, '#87CEEB'); // Небесно-голубой
            gradient.addColorStop(0.6, '#4682B4'); // Стальной синий
            gradient.addColorStop(1, '#1E3A8A'); // Темно-синий
            break;
        case 2:
            // День - яркие тона
            gradient.addColorStop(0, '#4A90E2'); // Ярко-голубой
            gradient.addColorStop(0.5, '#357ABD'); // Синий
            gradient.addColorStop(1, '#1E40AF'); // Королевский синий
            break;
        case 3:
            // Вечер - теплые тона
            gradient.addColorStop(0, '#6FB1E6'); // Светло-синий
            gradient.addColorStop(0.4, '#3B82F6'); // Синий
            gradient.addColorStop(0.8, '#1D4ED8'); // Темно-синий
            gradient.addColorStop(1, '#1E3A8A'); // Очень темный синий
            break;
        case 4:
            // Закат - с фиолетовыми оттенками
            gradient.addColorStop(0, '#7BAFD4'); // Светло-голубой
            gradient.addColorStop(0.3, '#5D8AA8'); // Синий
            gradient.addColorStop(0.7, '#4C516D'); // Темно-синий с фиолетовым
            gradient.addColorStop(1, '#2C3E50'); // Очень темный
            break;
        case 5:
            // Босс-уровень - драматичное небо
            gradient.addColorStop(0, '#6A5ACD'); // Сланцево-синий
            gradient.addColorStop(0.4, '#483D8B'); // Темный сланец
            gradient.addColorStop(0.8, '#2F4F4F'); // Темный сланец серый
            gradient.addColorStop(1, '#1C2833'); // Очень темный
            break;
        default:
            // Стандартный градиент
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.7, '#4682B4');
            gradient.addColorStop(1, '#1E3A8A');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // Добавляем облака для большей атмосферности
    drawSkyClouds();
    
    // Добавляем солнце/луну в зависимости от уровня
    drawCelestialBody();
}

// Функция для рисования облаков
function drawSkyClouds() {
    // Большие фоновые облака
    for (let i = 0; i < 4; i++) {
        const cloudX = (gameState.gameTime * 0.03 + i * 400) % (CONFIG.CANVAS_WIDTH + 500) - 250;
        const cloudY = 80 + (i % 3) * 60;
        const cloudSize = 60 + i * 10;
        
        drawCloud(cloudX, cloudY, cloudSize, 0.4);
    }
    
    // Мелкие передние облака
    for (let i = 0; i < 6; i++) {
        const cloudX = (gameState.gameTime * 0.05 + i * 200 + 100) % (CONFIG.CANVAS_WIDTH + 300) - 150;
        const cloudY = 120 + (i % 4) * 40;
        const cloudSize = 30 + i * 5;
        
        drawCloud(cloudX, cloudY, cloudSize, 0.6);
    }
}

// Функция для рисования одного облака
function drawCloud(x, y, size, opacity) {
    ctx.save();
    
    // Градиент для облака
    const cloudGradient = ctx.createRadialGradient(
        x + size/2, y + size/3, 0,
        x + size/2, y + size/3, size
    );
    cloudGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    cloudGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    
    ctx.fillStyle = cloudGradient;
    
    // Рисуем облако из нескольких кругов
    ctx.beginPath();
    ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.3, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y + size * 0.5, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Функция для рисования солнца или луны
function drawCelestialBody() {
    const isDayLevel = gameState.currentLevel <= 3;
    
    if (isDayLevel) {
        // Солнце для дневных уровней
        const sunX = CONFIG.CANVAS_WIDTH - 100;
        const sunY = 80;
        
        // Свечение солнца
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 50);
        sunGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        sunGradient.addColorStop(0.7, 'rgba(255, 255, 100, 0.4)');
        sunGradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
        
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // Ядро солнца
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 20, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Луна для вечерних/ночных уровней
        const moonX = CONFIG.CANVAS_WIDTH - 120;
        const moonY = 70;
        
        // Свечение луны
        const moonGradient = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 40);
        moonGradient.addColorStop(0, 'rgba(200, 200, 255, 0.6)');
        moonGradient.addColorStop(0.8, 'rgba(200, 200, 255, 0.2)');
        moonGradient.addColorStop(1, 'rgba(200, 200, 255, 0)');
        
        ctx.fillStyle = moonGradient;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Луна
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Кратеры на луне
        ctx.fillStyle = '#BDBDBD';
        ctx.beginPath();
        ctx.arc(moonX - 5, moonY - 3, 3, 0, Math.PI * 2);
        ctx.arc(moonX + 6, moonY + 4, 2, 0, Math.PI * 2);
        ctx.arc(moonX + 2, moonY - 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Функция для отрисовки цветов сакуры
function drawSakuraFlowers() {
    const flowerPositions = [
        { x: 100, y: CONFIG.CANVAS_HEIGHT - 55, size: 0.8 },
        { x: 250, y: CONFIG.CANVAS_HEIGHT - 52, size: 1.0 },
        { x: 400, y: CONFIG.CANVAS_HEIGHT - 58, size: 0.7 },
        { x: 550, y: CONFIG.CANVAS_HEIGHT - 53, size: 0.9 },
        { x: 700, y: CONFIG.CANVAS_HEIGHT - 56, size: 0.8 },
        { x: 850, y: CONFIG.CANVAS_HEIGHT - 54, size: 1.1 },
        { x: 1000, y: CONFIG.CANVAS_HEIGHT - 57, size: 0.6 },
        { x: 1150, y: CONFIG.CANVAS_HEIGHT - 52, size: 0.9 },
        { x: 300, y: CONFIG.CANVAS_HEIGHT - 59, size: 0.7 },
        { x: 600, y: CONFIG.CANVAS_HEIGHT - 55, size: 1.0 },
        { x: 900, y: CONFIG.CANVAS_HEIGHT - 58, size: 0.8 }
    ];
    
    flowerPositions.forEach(flower => {
        drawSakuraFlower(flower.x, flower.y, flower.size);
    });
}

// Функция для отрисовки одного цветка сакуры
function drawSakuraFlower(x, y, scale) {
    const size = 15 * scale;
    
    if (images.sakura) {
        // Используем спрайт сакуры если он есть
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.drawImage(images.sakura, -size/2, -size/2, size, size);
        ctx.restore();
    } else {
        // Fallback - рисуем простой розовый цветок
        ctx.save();
        ctx.translate(x, y);
        
        // Лепестки
        ctx.fillStyle = '#f8bbd9';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(size * 0.6, 0, size * 0.4, size * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Центр цветка
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Добавляем легкую анимацию - покачивание
    const sway = Math.sin(gameState.gameTime * 0.05 + x * 0.01) * 0.5;
    ctx.save();
    ctx.translate(0, sway);
    
    // Тень под цветком
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, size * 0.3, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawSkyBackground() {
    // Создаем вертикальный градиент от светло-голубого к синему
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    
    // Разные градиенты для разных уровней для разнообразия
    switch(gameState.currentLevel) {
        case 1:
            // Утро - светлые тона
            gradient.addColorStop(0, '#87CEEB'); // Небесно-голубой
            gradient.addColorStop(0.6, '#4682B4'); // Стальной синий
            gradient.addColorStop(1, '#1E3A8A'); // Темно-синий
            break;
        case 2:
            // День - яркие тона
            gradient.addColorStop(0, '#4A90E2'); // Ярко-голубой
            gradient.addColorStop(0.5, '#357ABD'); // Синий
            gradient.addColorStop(1, '#1E40AF'); // Королевский синий
            break;
        case 3:
            // Вечер - теплые тона
            gradient.addColorStop(0, '#6FB1E6'); // Светло-синий
            gradient.addColorStop(0.4, '#3B82F6'); // Синий
            gradient.addColorStop(0.8, '#1D4ED8'); // Темно-синий
            gradient.addColorStop(1, '#1E3A8A'); // Очень темный синий
            break;
        case 4:
            // Закат - с фиолетовыми оттенками
            gradient.addColorStop(0, '#7BAFD4'); // Светло-голубой
            gradient.addColorStop(0.3, '#5D8AA8'); // Синий
            gradient.addColorStop(0.7, '#4C516D'); // Темно-синий с фиолетовым
            gradient.addColorStop(1, '#2C3E50'); // Очень темный
            break;
        case 5:
            // Босс-уровень - драматичное небо
            gradient.addColorStop(0, '#6A5ACD'); // Сланцево-синий
            gradient.addColorStop(0.4, '#483D8B'); // Темный сланец
            gradient.addColorStop(0.8, '#2F4F4F'); // Темный сланец серый
            gradient.addColorStop(1, '#1C2833'); // Очень темный
            break;
        default:
            // Стандартный градиент
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.7, '#4682B4');
            gradient.addColorStop(1, '#1E3A8A');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // Добавляем облака для большей атмосферности
    drawSkyClouds();
}

function drawSkyClouds() {
    // Большие фоновые облака
    for (let i = 0; i < 4; i++) {
        const cloudX = (gameState.gameTime * 0.03 + i * 400) % (CONFIG.CANVAS_WIDTH + 500) - 250;
        const cloudY = 80 + (i % 3) * 60;
        const cloudSize = 60 + i * 10;
        
        drawCloud(cloudX, cloudY, cloudSize, 0.4);
    }
    
    // Мелкие передние облака
    for (let i = 0; i < 6; i++) {
        const cloudX = (gameState.gameTime * 0.05 + i * 200 + 100) % (CONFIG.CANVAS_WIDTH + 300) - 150;
        const cloudY = 120 + (i % 4) * 40;
        const cloudSize = 30 + i * 5;
        
        drawCloud(cloudX, cloudY, cloudSize, 0.6);
    }
}

function drawCloud(x, y, size, opacity) {
    ctx.save();
    
    // Градиент для облака
    const cloudGradient = ctx.createRadialGradient(
        x + size/2, y + size/3, 0,
        x + size/2, y + size/3, size
    );
    cloudGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    cloudGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    
    ctx.fillStyle = cloudGradient;
    
    // Рисуем облако из нескольких кругов
    ctx.beginPath();
    ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.3, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y + size * 0.5, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Новая функция для отрисовки земли с сакурой
function drawSakuraLand() {
    // Земля
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - 50, CONFIG.CANVAS_WIDTH, 50);
    
    // Трава цвета сакуры (розовая) - БЕЗ АНИМАЦИИ
    ctx.fillStyle = '#f8bbd9'; // Нежно-розовый цвет
    ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - 50, CONFIG.CANVAS_WIDTH, 10);
    
    // Рисуем цветы сакуры на траве (без изменений)
    drawSakuraFlowers();
}

// Функция для отрисовки цветов сакуры
function drawSakuraFlowers() {
    const flowerPositions = [
        { x: 100, y: CONFIG.CANVAS_HEIGHT - 55, size: 0.8 },
        { x: 250, y: CONFIG.CANVAS_HEIGHT - 52, size: 1.0 },
        { x: 400, y: CONFIG.CANVAS_HEIGHT - 58, size: 0.7 },
        { x: 550, y: CONFIG.CANVAS_HEIGHT - 53, size: 0.9 },
        { x: 700, y: CONFIG.CANVAS_HEIGHT - 56, size: 0.8 },
        { x: 850, y: CONFIG.CANVAS_HEIGHT - 54, size: 1.1 },
        { x: 1000, y: CONFIG.CANVAS_HEIGHT - 57, size: 0.6 },
        { x: 1150, y: CONFIG.CANVAS_HEIGHT - 52, size: 0.9 },
        { x: 300, y: CONFIG.CANVAS_HEIGHT - 59, size: 0.7 },
        { x: 600, y: CONFIG.CANVAS_HEIGHT - 55, size: 1.0 },
        { x: 900, y: CONFIG.CANVAS_HEIGHT - 58, size: 0.8 }
    ];
    
    flowerPositions.forEach(flower => {
        drawSakuraFlower(flower.x, flower.y, flower.size);
    });
}

// Функция для отрисовки одного цветка сакуры
function drawSakuraFlower(x, y, scale) {
    const size = 15 * scale;
    
    if (images.sakura) {
        // Используем спрайт сакуры если он есть
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.drawImage(images.sakura, -size/2, -size/2, size, size);
        ctx.restore();
    } else {
        // Fallback - рисуем простой розовый цветок
        ctx.save();
        ctx.translate(x, y);
        
        // Лепестки
        ctx.fillStyle = '#f8bbd9';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(size * 0.6, 0, size * 0.4, size * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Центр цветка
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Добавляем легкую анимацию - покачивание
    const sway = Math.sin(gameState.gameTime * 0.05 + x * 0.01) * 0.5;
    ctx.save();
    ctx.translate(0, sway);
    
    // Тень под цветком
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, size * 0.3, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Функция рисования пены вокруг корабля
function drawShipFoam(yamato) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    
    // Пена по бокам корабля
    for (let i = 0; i < 8; i++) {
        const foamX = yamato.x + (i / 7) * yamato.width;
        const foamY = yamato.y + yamato.height - 5;
        const foamSize = 3 + Math.sin(gameState.gameTime * 0.1 + i) * 2;
        
        ctx.beginPath();
        ctx.arc(foamX, foamY, foamSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Брызги на носу корабля
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 5; i++) {
        const splashX = yamato.x + 10 + Math.random() * 30;
        const splashY = yamato.y + yamato.height - 15 + Math.random() * 10;
        const splashSize = 2 + Math.random() * 4;
        
        ctx.beginPath();
        ctx.arc(splashX, splashY, splashSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Функция рисования океанского фона
function drawOceanBackground() {
    // Улучшенный градиент для океана
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    
    // Разные оттенки океана для разных уровней
    switch(gameState.currentLevel) {
        case 6:
            // Спокойное море
            gradient.addColorStop(0, '#1e88e5'); // Ярко-синий
            gradient.addColorStop(0.5, '#1976d2'); // Синий
            gradient.addColorStop(1, '#0d47a1'); // Темно-синий
            break;
        case 7:
            // Глубокое море
            gradient.addColorStop(0, '#1565c0'); // Синий
            gradient.addColorStop(0.4, '#0d47a1'); // Темно-синий
            gradient.addColorStop(1, '#082e5c'); // Очень темный синий
            break;
        case 8:
            // Штормовое море
            gradient.addColorStop(0, '#1a237e'); // Индиго
            gradient.addColorStop(0.6, '#0d1b4c'); // Темный индиго
            gradient.addColorStop(1, '#050a24'); // Почти черный
            break;
        case 9:
            // Вечернее море
            gradient.addColorStop(0, '#283593'); // Темно-синий
            gradient.addColorStop(0.5, '#1a237e'); // Индиго
            gradient.addColorStop(1, '#0d0d3a'); // Очень темный
            break;
        case 10:
            // Босс-уровень - драматичное море
            gradient.addColorStop(0, '#1e3a8a'); // Темно-синий
            gradient.addColorStop(0.3, '#1e1b4b'); // Очень темный
            gradient.addColorStop(0.7, '#0f172a'); // Почти черный
            gradient.addColorStop(1, '#020617'); // Черный
            break;
        default:
            gradient.addColorStop(0, '#1a237e');
            gradient.addColorStop(0.5, '#1976d2');
            gradient.addColorStop(1, '#4fc3f7');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
}

function checkCollision(obj1, obj2) {
    // ЗАЩИТНЫЕ ПРОВЕРКИ
    if (!obj1 || !obj2) {
        console.warn('⚠️ checkCollision: один из объектов не существует');
        return false;
    }
    
    if (obj1.x === undefined || obj2.x === undefined || 
        obj1.y === undefined || obj2.y === undefined ||
        obj1.width === undefined || obj2.width === undefined || 
        obj1.height === undefined || obj2.height === undefined) {
        console.warn('⚠️ checkCollision: отсутствуют необходимые свойства', {obj1, obj2});
        return false;
    }
    
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function levelComplete() {
    
    if (gameState) {
        gameState.gameActive = false;
        
        // ОБНОВЛЯЕМ ПРОГРЕСС
        const currentLevel = gameState.currentLevel;
        if (currentLevel >= gameProgress.completedLevels) {
            gameProgress.completedLevels = currentLevel;
            
            // Открываем следующий уровень, если он существует
            if (currentLevel < CONFIG.TOTAL_LEVELS) {
                gameProgress.unlockedLevels = Math.max(gameProgress.unlockedLevels, currentLevel + 1);
            }
            
            saveProgress();
        }
    }
    // Останавливаем звуки при завершении уровня
    soundManager.stopAll();
    
    if (spawnInterval) {
        clearInterval(spawnInterval);
    }
    
    const enemiesForThisLevel = CONFIG.getEnemiesForLevel(gameState.currentLevel);
    
    let message = `Уровень ${gameState.currentLevel} пройден! Уничтожено самолетов: ${gameState.destroyedCount}`;
    
    if (CONFIG.UFO.BOSS_LEVELS.includes(gameState.currentLevel) && gameState.bossSpawned) {
        if (gameState.boss) {
            message += "\n⚠️ БОСС остался жив!";
        } else {
            message += "\n🎉 БОСС уничтожен! +100 шестерней";
        }
    }
    
    // Сообщение о разблокировке следующего уровня
    if (gameState.currentLevel < CONFIG.TOTAL_LEVELS) {
        message += `\n🎊 Уровень ${gameState.currentLevel + 1} разблокирован!`;
    }
    
    alert(message);
    showLevelSelect(); // Возвращаем к выбору уровней
}

function gameOver() {
    if (gameState) {
        gameState.gameActive = false;
    }
    if (spawnInterval) {
        clearInterval(spawnInterval);
    }
    
    // ИСПОЛЬЗУЕМ ВСПОМОГАТЕЛЬНУЮ ФУНКЦИЮ
    const enemiesForThisLevel = CONFIG.getEnemiesForLevel(gameState.currentLevel);
    
    let message = `Игра окончена! Уровень ${gameState.currentLevel}. Уничтожено самолетов: ${gameState.destroyedCount}`;
    
    if (CONFIG.UFO.BOSS_LEVELS.includes(gameState.currentLevel) && gameState.bossSpawned) {
        if (gameState.boss) {
            message += "\n⚠️ БОСС остался жив!";
        }
    }
    
    alert(message);
    showLevelSelect();
}

let apocalypseActive = false;
let apocalypseTimer = 0;
const APOCALYPSE_COST = 170;
const APOCALYPSE_DURATION = 120; // 2 секунды (60 FPS * 2)
const APOCALYPSE_SHELLS = 55;

function startAirApocalypse() {
    // Проверяем условия
    if (!gameState || !gameState.gameActive || apocalypseActive) return;
    if (gameState.details < APOCALYPSE_COST) {
        console.log('❌ Недостаточно деталей для апокалипсиса!');
        return;
    }
    
    // Списание деталей
    gameState.details -= APOCALYPSE_COST;
    updateDetailsUI();
    
    // Активируем апокалипсис
    apocalypseActive = true;
    apocalypseTimer = APOCALYPSE_DURATION;
    
    console.log('🌋 ЗАПУСК АПОКАЛИПСИСА! 55 снарядов за 2 секунды!');
    
    // Сразу запускаем первую волну
    launchApocalypseWave();
    
    // Инициализируем массив для хранения интервалов
    if (!window.apocalypseIntervals) {
        window.apocalypseIntervals = [];
    }
    
    // Запускаем интервал для следующих волн и сохраняем его
    const waveInterval = setInterval(() => {
        if (apocalypseActive && apocalypseTimer > 0) {
            launchApocalypseWave();
        } else {
            clearInterval(waveInterval);
            // Удаляем интервал из массива
            const index = window.apocalypseIntervals.indexOf(waveInterval);
            if (index > -1) {
                window.apocalypseIntervals.splice(index, 1);
            }
        }
    }, 100); // Волна каждые 100ms
    
    window.apocalypseIntervals.push(waveInterval);
    
    // Визуальные эффекты
    startApocalypseEffects();
}


function launchApocalypseWave() {
    if (!gameState || !gameState.gameActive) return;
    
    const shellsThisWave = 3 + Math.floor(Math.random() * 4); // 3-6 снарядов за волну
    
    for (let i = 0; i < shellsThisWave; i++) {
        setTimeout(() => {
            if (gameState && gameState.gameActive && apocalypseActive) {
                createApocalypseShell();
            }
        }, i * 50); // Небольшая задержка между снарядами в волне
    }
}

function createApocalypseShell() {
    // Случайная позиция в небе
    const x = 50 + Math.random() * (CONFIG.CANVAS_WIDTH - 100);
    const y = 50 + Math.random() * 300;
    
    // Случайное направление (в основном вниз)
    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 2;
    
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    
    // Создаем осколочный снаряд
    const shell = new ExplosiveAmmo(x, y, vx, vy);
    
    // Усиливаем снаряд для апокалипсиса
    shell.shrapnelCount = 8;
    shell.explosionRadius = 90;
    shell.autoExplodeHeight = CONFIG.CANVAS_HEIGHT * 0.3; // Взрываются выше
    
    // Взрыв через случайное время (имитация полета)
    setTimeout(() => {
        if (shell && !shell.hasExploded) {
            shell.explode();
        }
    }, 300 + Math.random() * 500);
    
    if (gameState && gameState.projectiles) {
        gameState.projectiles.push(shell);
    }
}

function startApocalypseEffects() {
    // Сильная тряска экрана
    screenShake = 15;
    
    // Периодическое усиление тряски
    const shakeInterval = setInterval(() => {
        if (apocalypseActive) {
            screenShake = Math.max(screenShake, 8);
        } else {
            clearInterval(shakeInterval);
            // Удаляем интервал из массива
            const index = window.apocalypseIntervals.indexOf(shakeInterval);
            if (index > -1) {
                window.apocalypseIntervals.splice(index, 1);
            }
        }
    }, 300);
    
    window.apocalypseIntervals.push(shakeInterval);
    
    // Красное свечение неба
    const skyEffect = setInterval(() => {
        if (apocalypseActive) {
            // Случайные вспышки
            if (Math.random() < 0.3) {
                createApocalypseFlash();
            }
        } else {
            clearInterval(skyEffect);
            // Удаляем интервал из массива
            const index = window.apocalypseIntervals.indexOf(skyEffect);
            if (index > -1) {
                window.apocalypseIntervals.splice(index, 1);
            }
        }
    }, 100);
    
    window.apocalypseIntervals.push(skyEffect);
}

function createApocalypseFlash() {
    // Вспышка в случайном месте неба
    const flashX = Math.random() * CONFIG.CANVAS_WIDTH;
    const flashY = Math.random() * 400;
    const flashSize = 20 + Math.random() * 30;
    
    gameState.explosions.push(new Explosion(flashX, flashY, flashSize));
}

function updateApocalypse() {
    if (apocalypseActive) {
        apocalypseTimer--;
        
        if (apocalypseTimer <= 0) {
            endApocalypse();
        }
        
        // Дополнительные случайные взрывы в конце
        if (apocalypseTimer < 30 && Math.random() < 0.2) {
            createApocalypseShell();
        }
    }
}

function endApocalypse() {
    apocalypseActive = false;
    console.log('🌅 Апокалипсис завершен!');
    
    // Статистика
    const destroyedDuringApocalypse = gameState.destroyedCount;
    console.log(`💀 Уничтожено во время апокалипсиса: ${destroyedDuringApocalypse} самолетов`);
}

// Новый класс для эффекта сакуры вокруг врагов
class SakuraAura {
    constructor(enemy) {
        this.enemy = enemy;
        this.particles = [];
        this.isActive = false;
        this.fadeOut = false;
        this.fadeProgress = 0;
        this.fadeDuration = 60; // 1 секунда для исчезновения
        this.maxParticles = 8;
        this.particleRadius = 25;
        
        this.createParticles();
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            const angle = (i / this.maxParticles) * Math.PI * 2;
            this.particles.push({
                angle: angle,
                distance: this.particleRadius + Math.random() * 15,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                scale: 0.1 + Math.random() * 0.1,
                speed: 0.02 + Math.random() * 0.02,
                phase: Math.random() * Math.PI * 2,
                alpha: 0.0, // Начинаем с невидимого
                targetAlpha: 1.0
            });
        }
    }
    
    update() {
        if (!this.enemy || this.enemy.health <= 0 || this.enemy.isCrashing) {
            return false;
        }
        
        // Плавное появление и исчезновение
        if (this.fadeOut) {
            this.fadeProgress = Math.max(0, this.fadeProgress - (1 / this.fadeDuration));
            if (this.fadeProgress <= 0) {
                return false;
            }
        } else if (this.isActive) {
            this.fadeProgress = Math.min(1, this.fadeProgress + 0.05);
        } else {
            this.fadeProgress = Math.max(0, this.fadeProgress - 0.05);
        }
        
        // Обновление частиц
        this.particles.forEach(particle => {
            particle.angle += particle.speed;
            particle.rotation += particle.rotationSpeed;
            
            // Плавное движение вперед-назад
            const floatOffset = Math.sin(Date.now() * 0.001 + particle.phase) * 5;
            particle.currentDistance = particle.distance + floatOffset;
            
            // Плавное изменение альфа-канала
            if (this.fadeOut) {
                particle.alpha = this.fadeProgress;
            } else {
                particle.alpha = Math.min(particle.targetAlpha, particle.alpha + 0.05);
            }
        });
        
        return true;
    }
    
    draw() {
        if (!this.enemy || this.fadeProgress <= 0) return;
        
        const centerX = this.enemy.x + this.enemy.width / 2;
        const centerY = this.enemy.y + this.enemy.height / 2;
        
        this.particles.forEach(particle => {
            if (particle.alpha <= 0) return;
            
            const x = centerX + Math.cos(particle.angle) * particle.currentDistance;
            const y = centerY + Math.sin(particle.angle) * particle.currentDistance;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(particle.rotation);
            ctx.scale(particle.scale, particle.scale);
            ctx.globalAlpha = particle.alpha * 0.7;
            
            if (images.sakura) {
                ctx.drawImage(images.sakura, -50, -50, 100, 100);
            } else {
                this.drawSakuraFallback();
            }
            
            ctx.restore();
        });
        
    }
    
    startFadeOut() {
        this.fadeOut = true;
        this.isActive = false;
    }
    
    activate() {
        this.isActive = true;
        this.fadeOut = false;
    }
    
    deactivate() {
        this.startFadeOut();
    }
}