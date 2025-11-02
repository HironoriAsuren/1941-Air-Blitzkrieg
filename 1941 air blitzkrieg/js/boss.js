// boss.js - Босс НЛО третьего рейха
console.log('✅ boss.js загружен');

// Босс - НЛО третьего рейха
class UFO {
    constructor() {
        this.type = 'ufo';
        this.width = 120;
        this.height = 60;
        this.x = -this.width;
        this.y = 150;
        this.speed = 4;
        this.health = CONFIG.UFO.HEALTH;
        this.maxHealth = CONFIG.UFO.HEALTH;
        this.phase = 'entrance';
        this.attackCooldowns = {
            bulletHell: 120,
            guidedMissiles: 120,
            rocketStrike: 120,
            shurikens: 300 // УВЕЛИЧИВАЕМ КУЛДАУН СЮРИКЕНОВ
        };
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackDelay = 120;
        this.bulletHellStage = 0;
        this.bulletHellCounter = 0;
        this.crashing = false;
        this.crashSpeed = 0;
        this.crashAngle = 0;
        this.showHealthBar = true;
        this.gameActive = true;
        this.smokeTimer = 0;

        // НОВЫЕ СВОЙСТВА ДЛЯ НЕВИДИМОСТИ
        this.isInvisible = false;
        this.invisibilityTimer = 0;
        this.invisibilityDuration = 450; // 8 секунд (60 FPS × 8)
        this.invisibilityCooldown = 0;
        this.invisibilityCooldownDuration = 1800; // 30 секунд (60 FPS × 30)
        this.canBecomeInvisible = true;
        this.lastInvisibilityTime = 0;

        console.log('🛸 НЛО создано!');
    }

    update() {
        if (!gameState || !gameState.gameActive || !this.gameActive) return true;
        
        // ОБНОВЛЯЕМ ТАЙМЕРЫ НЕВИДИМОСТИ
        this.updateInvisibility();
        
        // Если в процессе плавного перемещения - обновляем его
        if (this.moveTween) {
            this.smoothMoveTo(this.moveTween.targetX, this.moveTween.targetY);
            this.updateAttacks(); // Атаки продолжаются даже во время перемещения
            return true;
        }
        
        // ВАЖНО: если босс падает, продолжаем обновлять анимацию падения
        if (this.crashing) {
            return this.updateCrash();
        }

        switch (this.phase) {
            case 'entrance':
                this.updateEntrance();
                break;
            case 'battle':
                this.updateBattle();
                break;
        }

        this.updateAttacks();
        return true;
    }

    updateEntrance() {
        this.x += this.speed;
        
        if (this.x > CONFIG.CANVAS_WIDTH * 0.3) {
            this.phase = 'battle';
            this.speed = 1.5;
            console.log('🛸 НЛО перешло в фазу боя!');
        }
    }

    updateBattle() {
        // СИСТЕМА ФАЗ: ДВИЖЕНИЕ → СТОЯНКА → ДВИЖЕНИЕ
        
        // Инициализация системы фаз
        if (this.movementPhase === undefined) {
            this.movementPhase = 'moving'; // Начинаем с движения
            this.phaseTimer = 0;
            this.currentStopPosition = { x: this.x, y: this.y };
        }
        
        this.phaseTimer++;
        
        // УПРАВЛЕНИЕ ФАЗАМИ
        switch(this.movementPhase) {
            case 'moving':
                this.handleMovingPhase();
                break;
            case 'stopped':
                this.handleStoppedPhase();
                break;
        }
        
        // РЕДКИЕ ТЕЛЕПОРТАЦИИ (только в фазе движения)
        if (this.movementPhase === 'moving' && Math.random() < 0.0005) {
            this.teleport();
        }
    }

    // ФАЗА ДВИЖЕНИЯ (2-3 секунды)
    handleMovingPhase() {
        // Длительность фазы движения: 2-3 секунды (120-180 кадров)
        const moveDuration = 120 + Math.random() * 60;
        
        if (this.phaseTimer >= moveDuration) {
            // Переход к фазе стоянки
            this.movementPhase = 'stopped';
            this.phaseTimer = 0;
            this.currentStopPosition = { x: this.x, y: this.y };
            console.log('🛸 НЛО останавливается на 2 секунды');
            return;
        }
        
        // ПЛАВНЫЕ ТРАЕКТОРИИ ДВИЖЕНИЯ
        if (!this.movementPattern) {
            this.movementPattern = this.chooseMovementPattern();
            this.patternProgress = 0;
            this.patternSpeed = 0.002 + Math.random() * 0.002; // Медленнее
        }
        
        this.patternProgress += this.patternSpeed;
        
        // Выполняем выбранную траекторию
        switch(this.movementPattern) {
            case 'gentleWave':
                this.gentleWaveMovement();
                break;
            case 'slowCircle':
                this.slowCircleMovement();
                break;
            case 'lazyArc':
                this.lazyArcMovement();
                break;
            case 'floating':
                this.floatingMovement();
                break;
        }
        
        // Смена траектории если текущая завершена
        if (this.patternProgress >= 1) {
            this.movementPattern = this.chooseMovementPattern();
            this.patternProgress = 0;
            this.patternSpeed = 0.002 + Math.random() * 0.002;
        }
    }

    // ФАЗА СТОЯНКИ (2 секунды)
    handleStoppedPhase() {
        // Длительность фазы стоянки: 2 секунды (120 кадров)
        const stopDuration = 120;
        
        if (this.phaseTimer >= stopDuration) {
            // Переход к фазе движения
            this.movementPhase = 'moving';
            this.phaseTimer = 0;
            this.movementPattern = null; // Сбрасываем траекторию
            console.log('🛸 НЛО начинает движение');
            return;
        }
        
        // ЛЕГКОЕ КОЛЕБАНИЕ НА МЕСТЕ (очень небольшое)
        if (this.phaseTimer % 30 === 0) { // Каждые 0.5 секунды
            const driftX = (Math.random() - 0.5) * 4;
            const driftY = (Math.random() - 0.5) * 3;
            
            this.x = this.currentStopPosition.x + driftX;
            this.y = this.currentStopPosition.y + driftY;
        }
        
        // ОЧЕНЬ ЛЕГКАЯ ПУЛЬСАЦИЯ ПРИ СТОЯНКЕ
        const pulse = 0.98 + Math.sin(this.phaseTimer * 0.1) * 0.02;
        this.width = 120 * pulse;
        this.height = 60 * pulse;
    }

    // ВЫБОР СПОКОЙНЫХ ТРАЕКТОРИЙ
    chooseMovementPattern() {
        const patterns = ['gentleWave', 'slowCircle', 'lazyArc', 'floating'];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    // НЕЖНАЯ ВОЛНА
    gentleWaveMovement() {
        const centerX = CONFIG.CANVAS_WIDTH * 0.5;
        const centerY = 180;
        const amplitude = 60; // Меньшая амплитуда
        const frequency = 0.003; // Медленнее
        
        this.x = centerX + Math.sin(this.patternProgress * Math.PI * 2) * 200;
        this.y = centerY + Math.sin(this.patternProgress * Math.PI * 4) * amplitude;
    }

    // МЕДЛЕННЫЙ КРУГ
    slowCircleMovement() {
        const centerX = CONFIG.CANVAS_WIDTH * 0.4 + Math.sin(Date.now() * 0.0001) * 50;
        const centerY = 200;
        const radius = 100; // Меньший радиус
        
        const angle = this.patternProgress * Math.PI * 2;
        
        this.x = centerX + Math.cos(angle) * radius;
        this.y = centerY + Math.sin(angle) * radius * 0.8;
    }

    // ЛЕНИВАЯ ДУГА
    lazyArcMovement() {
        const startX = 150;
        const endX = CONFIG.CANVAS_WIDTH - 250;
        const baseY = 160;
        const arcHeight = 80;
        
        const progress = this.patternProgress;
        
        // Параболическая траектория
        this.x = startX + (endX - startX) * progress;
        this.y = baseY + Math.sin(progress * Math.PI) * arcHeight;
    }

    // ПЛАВАЮЩЕЕ ДВИЖЕНИЕ
    floatingMovement() {
        const centerX = CONFIG.CANVAS_WIDTH * 0.6;
        const centerY = 220;
        const horizontalRange = 180;
        const verticalRange = 70;
        
        // Разные частоты для плавности
        const hWave = Math.sin(this.patternProgress * Math.PI * 1.5);
        const vWave = Math.cos(this.patternProgress * Math.PI * 2);
        
        this.x = centerX + hWave * horizontalRange;
        this.y = centerY + vWave * verticalRange;
    }

    // ТРАЕКТОРИЯ "ВОСЬМЕРКА"
    figure8Movement() {
        const centerX = CONFIG.CANVAS_WIDTH * 0.4 + Math.sin(Date.now() * 0.0005) * 100;
        const centerY = 200 + Math.cos(Date.now() * 0.0003) * 80;
        const scale = 120;
        
        const t = this.patternProgress * Math.PI * 4; // Две полные петли
        
        this.x = centerX + Math.sin(t) * scale;
        this.y = centerY + Math.sin(2 * t) * scale * 0.6;
    }

    // СИНУСОИДАЛЬНОЕ ДВИЖЕНИЕ
    sinusoidMovement() {
        const amplitude = 100;
        const frequency = 0.004;
        const verticalSpeed = 0.3;
        
        this.x = 200 + this.patternProgress * (CONFIG.CANVAS_WIDTH - 400);
        this.y = 150 + Math.sin(Date.now() * frequency) * amplitude + 
                Math.sin(this.patternProgress * Math.PI * 2) * 50;
    }

    // СПИРАЛЬНОЕ ДВИЖЕНИЕ
    spiralMovement() {
        const centerX = CONFIG.CANVAS_WIDTH * 0.5;
        const centerY = 200;
        const maxRadius = 150;
        const revolutions = 3;
        
        const angle = this.patternProgress * Math.PI * 2 * revolutions;
        const radius = maxRadius * (1 - this.patternProgress * 0.7); // Постепенно уменьшаем радиус
        
        this.x = centerX + Math.cos(angle) * radius;
        this.y = centerY + Math.sin(angle) * radius * 0.8;
        
        // Плавное изменение размера в спирали
        const sizePulse = 0.9 + Math.sin(angle * 2) * 0.1;
        this.width = 120 * sizePulse;
        this.height = 60 * sizePulse;
    }

    // ЛЕНИВЫЙ КРУГ
    lazyCircleMovement() {
        const centerX = CONFIG.CANVAS_WIDTH * 0.6 + Math.sin(Date.now() * 0.0002) * 80;
        const centerY = 180 + Math.cos(Date.now() * 0.0004) * 60;
        const radius = 130;
        
        const angle = this.patternProgress * Math.PI * 2;
        
        // Добавляем небольшие колебания для "ленивости"
        const wobbleX = Math.sin(Date.now() * 0.001) * 20;
        const wobbleY = Math.cos(Date.now() * 0.0015) * 15;
        
        this.x = centerX + Math.cos(angle) * radius + wobbleX;
        this.y = centerY + Math.sin(angle) * radius * 0.7 + wobbleY;
    }

    // ВОЛНОВОЕ ДВИЖЕНИЕ
    waveMovement() {
        const startX = 100;
        const endX = CONFIG.CANVAS_WIDTH - 200;
        const baseY = 150;
        const amplitude = 120;
        const waves = 2;
        
        const progress = this.patternProgress;
        const wave = Math.sin(progress * Math.PI * 2 * waves) * amplitude;
        const verticalDrift = Math.sin(Date.now() * 0.0008) * 40;
        
        this.x = startX + (endX - startX) * progress;
        this.y = baseY + wave + verticalDrift;
    }

    // ПЛАВНОЕ ПЕРЕМЕЩЕНИЕ К ЦЕЛИ
    smoothMoveTo(targetX, targetY) {
        if (!this.moveTween) {
            this.moveTween = {
                startX: this.x,
                startY: this.y,
                targetX: targetX,
                targetY: targetY,
                duration: 60, // 1 секунда
                progress: 0
            };
        }
        
        this.moveTween.progress += 1 / this.moveTween.duration;
        
        // Квадратичная интерполяция для плавности
        const ease = this.moveTween.progress < 0.5 ? 
            2 * this.moveTween.progress * this.moveTween.progress : 
            1 - Math.pow(-2 * this.moveTween.progress + 2, 2) / 2;
        
        this.x = this.moveTween.startX + (this.moveTween.targetX - this.moveTween.startX) * ease;
        this.y = this.moveTween.startY + (this.moveTween.targetY - this.moveTween.startY) * ease;
        
        if (this.moveTween.progress >= 1) {
            this.moveTween = null;
            
            // Эффект появления
            if (gameState && gameState.explosions) {
                gameState.explosions.push(new Explosion(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    50
                ));
            }
        }
    }

    // НОВЫЙ МЕТОД ДЛЯ УПРАВЛЕНИЯ НЕВИДИМОСТЬЮ
    updateInvisibility() {
        // Уменьшаем кулдаун невидимости
        if (this.invisibilityCooldown > 0) {
            this.invisibilityCooldown--;
            if (this.invisibilityCooldown <= 0) {
                this.canBecomeInvisible = true;
                console.log('🔄 НЛО может снова стать невидимым!');
            }
        }
        
        // Если невидимо - уменьшаем таймер
        if (this.isInvisible) {
            this.invisibilityTimer--;
            
            // ЭФФЕКТЫ В КОНЦЕ НЕВИДИМОСТИ
            if (this.invisibilityTimer < 60) {
                if (this.invisibilityTimer % 10 === 0) {
                    this.createCloakEffect();
                }
            }
            
            // КОНЕЦ НЕВИДИМОСТИ
            if (this.invisibilityTimer <= 0) {
                this.becomeVisible();
            }
            
        // ШАНС СТАТЬ НЕВИДИМЫМ ВО ВРЕМЯ БОЯ
        } else if (this.canBecomeInvisible && Math.random() < 0.003) {
            this.becomeInvisible();
        }
    }

    // СТАНОВИМСЯ НЕВИДИМЫМИ
    becomeInvisible() {
        if (this.isInvisible || !this.canBecomeInvisible) return;
        
        this.isInvisible = true;
        this.invisibilityTimer = this.invisibilityDuration;
        this.canBecomeInvisible = false;
        this.invisibilityCooldown = this.invisibilityCooldownDuration;
        this.showHealthBar = false;
        
        console.log('👻 НЛО стало невидимым на 10 секунд!');
        
        // ЭФФЕКТ ИСЧЕЗНОВЕНИЯ
        this.createCloakEffect();
        
        // Советские истребители теряют цель
        this.loseFighterTargets();
    }

    // СТАНОВИМСЯ ВИДИМЫМИ
    becomeVisible() {
        if (!this.isInvisible) return;
        
        this.isInvisible = false;
        this.showHealthBar = true;
        this.canBecomeInvisible = false;
        this.invisibilityCooldown = this.invisibilityCooldownDuration;
        
        console.log('👁️ НЛО принудительно стало видимым!');
        
        // ЭФФЕКТ ПОЯВЛЕНИЯ
        this.createDecloakEffect();
        
        // Советские истребители снова могут атаковать
        this.allowFighterTargets();
    }

    // НОВЫЙ МЕТОД: РАЗРЕШАЕМ ИСТРЕБИТЕЛЯМ АТАКОВАТЬ
    allowFighterTargets() {
        if (!gameState || !gameState.friendlyFighters) return;
        
        gameState.friendlyFighters.forEach(fighter => {
            if (fighter && !fighter.targetUFO) {
                fighter.targetUFO = this;
                console.log('🎯 Советский истребитель снова может атаковать НЛО!');
            }
        });
    }

    // СОВЕТСКИЕ ИСТРЕБИТЕЛИ ТЕРЯЮТ ЦЕЛЬ
    loseFighterTargets() {
        if (!gameState || !gameState.friendlyFighters) return;
        
        gameState.friendlyFighters.forEach(fighter => {
            if (fighter.targetUFO === this) {
                fighter.targetUFO = null;
                console.log('🎯 Советский истребитель потерял цель!');
            }
        });
    }

    updateAttacks() {
        // Уменьшаем кулдауны всех атак
        this.attackCooldowns.bulletHell--;
        this.attackCooldowns.guidedMissiles--;
        this.attackCooldowns.rocketStrike--;
        this.attackCooldowns.shurikens--;

        // Таймер между атаками
        this.attackTimer--;

        // Если нет текущей атаки и прошла задержка - выбираем новую
        if (this.currentAttack === null && this.attackTimer <= 0) {
            const availableAttacks = [];
            
            if (this.attackCooldowns.bulletHell <= 0) {
                availableAttacks.push('bulletHell');
            }
            if (this.attackCooldowns.guidedMissiles <= 0) {
                availableAttacks.push('guidedMissiles');
            }
            if (this.attackCooldowns.rocketStrike <= 0) {
                availableAttacks.push('rocketStrike');
            }
            if (this.attackCooldowns.shurikens <= 0) {
                availableAttacks.push('shurikens');
            }

            if (availableAttacks.length > 0) {
                this.currentAttack = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
                
                switch (this.currentAttack) {
                    case 'bulletHell':
                        this.bulletHellStage = 0;
                        this.bulletHellCounter = 0;
                        this.attackCooldowns.bulletHell = 120;
                        console.log('🛸 НЛО начинает УСИЛЕННЫЙ Буллетхелл!');
                        break;
                    case 'guidedMissiles':
                        this.attackCooldowns.guidedMissiles = 120;
                        console.log('🛸 НЛО запускает наводящиеся ракеты!');
                        break;
                    case 'rocketStrike':
                        this.attackCooldowns.rocketStrike = 120;
                        console.log('🛸 НЛО вызывает ракетный удар!');
                        break;
                    case 'shurikens':
                        this.attackCooldowns.shurikens = 400; // БОЛЬШЕ КУЛДАУН ДЛЯ СЮРИКЕНОВ
                        console.log('🛸 НЛО выпускает сюрикены!');
                        break;
                }
            } else {
                this.attackTimer = 60;
            }
        }

        // Выполняем текущую атаку
        if (this.currentAttack) {
            this.executeAttack();
        }
    }

    executeAttack() {
        switch (this.currentAttack) {
            case 'bulletHell':
                this.executeBulletHell();
                break;
            case 'guidedMissiles':
                this.executeGuidedMissiles();
                this.finishAttack();
                break;
            case 'rocketStrike':
                this.executeRocketStrike();
                this.finishAttack();
                break;
            case 'shurikens':
                this.executeShurikens();
                this.finishAttack();
                break;
        }
    }

    finishAttack() {
        this.currentAttack = null;
        this.attackTimer = this.attackDelay;
        console.log('🛸 НЛО завершил атаку, следующая через 2 секунды');
    }

    executeBulletHell() {
        if (!gameState || !gameState.gameActive) return;
        
        this.bulletHellCounter--;
        
        if (this.bulletHellCounter <= 0) {
            const bulletCount = 12;
            const angleStep = Math.PI * 2 / bulletCount;
            
            for (let i = 0; i < bulletCount; i++) {
                let angle;
                
                if (this.bulletHellStage % 3 === 0) {
                    angle = angleStep * i + (this.bulletHellStage * 0.4);
                } else if (this.bulletHellStage % 3 === 1) {
                    angle = angleStep * i + Math.PI / bulletCount;
                } else {
                    angle = angleStep * i;
                }
                
                const speed = 4;
                if (gameState && gameState.enemyProjectiles) {
                    gameState.enemyProjectiles.push(new EnemyProjectile(
                        this.x + this.width / 2,
                        this.y + this.height / 2,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        'bullet'
                    ));
                }
            }
            
            this.bulletHellStage++;
            this.bulletHellCounter = 15;
            
            if (this.bulletHellStage >= 5) {
                this.finishAttack();
                console.log('🛸 НЛО завершил УСИЛЕННЫЙ Буллетхелл');
            }
        }
    }

    executeGuidedMissiles() {
        if (!gameState || !gameState.gameActive) return;
        
        const missileCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < missileCount; i++) {
            setTimeout(() => {
                if (gameState && gameState.gameActive && this.health > 0 && gameState.enemyProjectiles) {
                    const missile = new GuidedMissile(
                        this.x + this.width / 2,
                        this.y + this.height / 2
                    );
                    gameState.enemyProjectiles.push(missile);
                }
            }, i * 300);
        }
    }

    executeRocketStrike() {
        if (!gameState || !gameState.gameActive) return;
        
        const rocketCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < rocketCount; i++) {
            setTimeout(() => {
                if (gameState && gameState.gameActive && this.health > 0 && gameState.rocketStrikes) {
                    const targetX = 100 + Math.random() * (CONFIG.CANVAS_WIDTH - 200);
                    const targetY = CONFIG.CANVAS_HEIGHT - 100;
                    
                    const fau2Rocket = new Fau2Rocket(targetX, targetY);
                    gameState.rocketStrikes.push(fau2Rocket);
                }
            }, i * 800);
        }
    }

    executeShurikens() {
        if (!gameState || !gameState.gameActive) return;
        
        // УМЕНЬШАЕМ КОЛИЧЕСТВО СЮРИКЕНОВ
        const shurikenCount = 2; // было 4
        
        for (let i = 0; i < shurikenCount; i++) {
            setTimeout(() => {
                if (gameState && gameState.gameActive && this.health > 0 && gameState.enemyProjectiles) {
                    const shuriken = new Shuriken(
                        this.x + this.width / 2 + (Math.random() - 0.5) * 30,
                        this.y + this.height / 2
                    );
                    gameState.enemyProjectiles.push(shuriken);
                }
            }, i * 500); // УВЕЛИЧИВАЕМ ЗАДЕРЖКУ МЕЖДУ СЮРИКЕНАМИ
        }
    }

    updateCrash() {
        this.x += Math.cos(this.crashAngle) * this.crashSpeed;
        this.y += this.crashSpeed;
        this.crashSpeed += 0.2;
        
        // Дым при падении
        this.smokeTimer--;
        if (this.smokeTimer <= 0) {
            if (gameState && gameState.smokeParticles) {
                gameState.smokeParticles.push(new SmokeParticle(
                    this.x + this.width / 2 + Math.random() * 20 - 10,
                    this.y + this.height / 2
                ));
            }
            this.smokeTimer = 3;
        }
        
        // Взрываемся только когда достигли земли
        if (this.y > CONFIG.CANVAS_HEIGHT - 50) {
            console.log('💥 НЛО достигло земли - взрыв!');
            
            // ВЗРЫВ С ЗВУКОМ
            this.explode();
            
            // ДЛЯ БЕСКОНЕЧНОГО РЕЖИМА - уведомляем InfiniteWar о завершении
            if (gameState && gameState.currentLevel === 'infinite' && gameState.infiniteWar) {
                console.log('🔄 Вызываем cleanupBoss() для бесконечного режима');
                gameState.infiniteWar.cleanupBoss();
            }
            
            return false;
        }
        return true;
    }

    explode() {
        // ЭПИЧНЫЙ ЗВУК ВЗРЫВА НЛО
        if (typeof playUfoExplosion === 'function') {
            playUfoExplosion();
        }
        
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new UfoExplosion(this.x + this.width / 2, this.y + this.height / 2));
        }
        
        screenShake = 30;
        
        if (gameState) {
            gameState.details += CONFIG.REWARDS.ufo;
            if (typeof updateDetailsUI === 'function') {
                updateDetailsUI();
            }
        }
        
        return false;
    }

    takeDamage(amount = 1) {
        // НЛО ПОЛУЧАЕТ УРОН ДАЖЕ В НЕВИДИМОСТИ, НО БЕЗ ВИЗУАЛЬНЫХ ЭФФЕКТОВ
        if (this.crashing) return false;
        
        this.health -= amount;

        if (typeof playRandomHitSound === 'function') {
            playRandomHitSound();
        }
        
        if (this.isInvisible) {
            console.log(`👻 НЛО получило урон в невидимости: ${amount}. Осталось здоровья: ${this.health}`);
            
            // ЕСЛИ ЗДОРОВЬЕ ЗАКОНЧИЛОСЬ В НЕВИДИМОСТИ - СРАЗУ ПОЯВЛЯЕМСЯ И ПАДАЕМ
            if (this.health <= 0) {
                console.log('💀 НЛО уничтожено в невидимости! Показываем и запускаем падение...');
                this.becomeVisible(); // Принудительно показываем
                this.startCrash();    // Запускаем падение
                return true;
            }
            
            // В НЕВИДИМОСТИ НЕ ПОКАЗЫВАЕМ ЭФФЕКТЫ ПОПАДАНИЯ
            return false;
        }
        
        // ВИДИМОЕ НЛО - СТАНДАРТНАЯ ЛОГИКА
        console.log(`🛸 НЛО получило урон: ${amount}. Осталось здоровья: ${this.health}`);
        
        // Визуальные эффекты попадания (только для видимого НЛО)
        this.createHitEffect();
        
        if (this.health <= 0) {
            console.log('🛸 НЛО уничтожено! Запускаем падение...');
            this.startCrash();
            return true;
        }
        return false;
    }

    // НОВЫЙ МЕТОД: ЭФФЕКТ ПОПАДАНИЯ (ТОЛЬКО ДЛЯ ВИДИМОГО НЛО)
    createHitEffect() {
        if (!gameState) return;
        
        // Маленькая вспышка при попадании
        if (gameState.explosions) {
            const hitX = this.x + this.width / 2 + (Math.random() - 0.5) * 30;
            const hitY = this.y + this.height / 2 + (Math.random() - 0.5) * 20;
            
            const hitExplosion = new Explosion(hitX, hitY, 15);
            hitExplosion.life = 0.3; // Короткая вспышка
            gameState.explosions.push(hitExplosion);
        }
        
        // Легкая тряска экрана
        screenShake = Math.max(screenShake, 2);
    }

    startCrash() {
        this.crashing = true;
        this.showHealthBar = false;
        this.crashSpeed = 2;
        this.crashAngle = Math.random() * Math.PI - Math.PI / 2;
        
        // ВЫПАДЕНИЕ ФУРАЖКИ ПРИ НАЧАЛЕ ПАДЕНИЯ
        if ((gameState && gameState.currentLevel === 5) || 
            (gameState && gameState.currentLevel === 'infinite')) {
            const hat = new UFOHat(
                this.x + this.width / 2 - 20,
                this.y + this.height / 2
            );
            
            if (!gameState.specialItems) gameState.specialItems = [];
            gameState.specialItems.push(hat);
            
            console.log('🎩 СЕКРЕТНАЯ ФУРАЖКА НЛО ВЫПАЛА ПРИ ПАДЕНИИ!');
        }
        
        console.log('🛸 НЛО начинает падение!');
    }

    // МЕТОДЫ ДЛЯ "БЕЗУМНОГО" ПОВЕДЕНИЯ
    teleport() {
        // Телепортация только в фазе движения
        if (this.movementPhase !== 'moving') return;
        
        console.log('🌀 НЛО телепортируется!');
        
        // Эффект телепортации
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                40
            ));
        }
        
        // Новая позиция для стоянки
        const newX = 150 + Math.random() * (CONFIG.CANVAS_WIDTH - 400);
        const newY = 100 + Math.random() * 200;
        
        // Переходим сразу к фазе стоянки на новой позиции
        this.movementPhase = 'stopped';
        this.phaseTimer = 0;
        this.x = newX;
        this.y = newY;
        this.currentStopPosition = { x: newX, y: newY };
        this.movementPattern = null;
        
        console.log('🛸 НЛО телепортировалось и остановилось');
        
        // Эффект появления
        setTimeout(() => {
            if (gameState && gameState.explosions) {
                gameState.explosions.push(new Explosion(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    50
                ));
            }
        }, 100);
    }

    dashToPlayer() {
        if (!gameState || !gameState.player) return;
        
        const player = gameState.player;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        const dashDistance = 150 + Math.random() * 100;
        const angle = Math.atan2(
            playerCenterY - this.y,
            playerCenterX - this.x
        );
        
        const targetX = this.x + Math.cos(angle) * dashDistance;
        const targetY = this.y + Math.sin(angle) * dashDistance;
        
        this.x = Math.max(50, Math.min(targetX, CONFIG.CANVAS_WIDTH - this.width - 50));
        this.y = Math.max(50, Math.min(targetY, 400));
        
        console.log('⚡ НЛО делает рывок к игроку!');
    }

    zigzagMovement() {
        const zigzagX = (Math.random() - 0.5) * 12;
        const zigzagY = (Math.random() - 0.5) * 8;
        
        this.x += zigzagX;
        this.y += zigzagY;
        
        if (Math.random() < 0.3) {
            this.x += (Math.random() - 0.5) * 20;
        }
    }

    // ЭФФЕКТЫ НЕВИДИМОСТИ
    createCloakEffect() {
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                50,
                'cloak'
            ));
        }
        
        for (let i = 0; i < 15; i++) {
            const particle = {
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 80,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30 + Math.random() * 30,
                size: 2 + Math.random() * 4,
                color: `rgba(100, 200, 255, ${0.7 + Math.random() * 0.3})`,
                update: function() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.life--;
                    this.size *= 0.95;
                    return this.life > 0;
                },
                draw: function() {
                    const alpha = this.life / 60;
                    ctx.fillStyle = this.color.replace('1)', `${alpha})`);
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            
            if (!gameState.specialParticles) gameState.specialParticles = [];
            gameState.specialParticles.push(particle);
        }
    }

    createDecloakEffect() {
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                60,
                'decloak'
            ));
        }
        
        screenShake = 8;
    }

    draw() {
        if (!ctx) return;
        
        // ЕСЛИ НЕВИДИМО - НЕ РИСУЕМ СОВСЕМ
        if (this.isInvisible) {
            if (Math.random() < 0.03) {
                this.createInvisibilitySpark();
            }
            return;
        }
        
        ctx.save();
        
        if (this.crashing) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.crashAngle);
            
            if (images && images.ufo) {
                ctx.drawImage(images.ufo, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                this.drawUfoFallback();
            }
        } else {
            // ИНДИКАТОР ФАЗЫ (опционально)
            if (this.movementPhase === 'stopped') {
                // Легкое свечение при стоянке
                ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 35, 0, Math.PI * 2);
                ctx.fill();
            }
            
            if (images && images.ufo) {
                ctx.drawImage(images.ufo, this.x, this.y, this.width, this.height);
            } else {
                this.drawUfoFallback();
            }
        }
        
        ctx.restore();
        
        if (this.showHealthBar) {
            this.drawHealthBar();
        }
    }

    // ИСКРЫ НЕВИДИМОСТИ
    createInvisibilitySpark() {
        const spark = {
            x: this.x + Math.random() * this.width,
            y: this.y + Math.random() * this.height,
            life: 10 + Math.random() * 10,
            size: 1 + Math.random() * 2,
            update: function() {
                this.life--;
                return this.life > 0;
            },
            draw: function() {
                const alpha = this.life / 20;
                ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        if (!gameState.specialParticles) gameState.specialParticles = [];
        gameState.specialParticles.push(spark);
    }

    drawUfoFallback() {
        ctx.fillStyle = '#4a148c';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#7c43bd';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 3, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRandomFlash() {
        const flashSize = 20 + Math.random() * 40;
        const flashX = this.x + Math.random() * this.width;
        const flashY = this.y + Math.random() * this.height;
        
        const gradient = ctx.createRadialGradient(
            flashX, flashY, 0,
            flashX, flashY, flashSize
        );
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHealthBar() {
        if (!ctx) return;
        
        const barWidth = 150;
        const barHeight = 8;
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(this.x + this.width / 2 - barWidth / 2, this.y - 20, barWidth, barHeight);
        
        const gradient = ctx.createLinearGradient(
            this.x + this.width / 2 - barWidth / 2, 0,
            this.x + this.width / 2 + barWidth / 2, 0
        );
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(0.5, '#ffeb3b');
        gradient.addColorStop(1, '#4caf50');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + this.width / 2 - barWidth / 2, this.y - 20, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + this.width / 2 - barWidth / 2, this.y - 20, barWidth, barHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`БОСС: ${this.health}/${this.maxHealth}`, this.x + this.width / 2, this.y - 25);
        ctx.textAlign = 'left';
    }
}

// Наводящаяся ракета
class GuidedMissile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 24;
        this.speed = 3;
        this.turnSpeed = 0.08;
        this.health = 2;
        this.type = 'guidedMissile';
        this.speedX = 0;
        this.speedY = 2;
        this.trailParticles = [];
        this.trailTimer = 0;
        
        // ЗВУК ЗАПУСКА МИНИ-РАКЕТЫ
        if (typeof playMiniRocketLaunch === 'function') {
            playMiniRocketLaunch();
        }
        
        console.log('🎯 Наводящаяся ракета запущена!', { x, y });
    }

    takeDamage() {
        // ЗАЩИТНАЯ ПРОВЕРКА
        if (!this || this.health === undefined) {
            console.warn('⚠️ Ошибка: GuidedMissile.takeDamage() вызван для несуществующего объекта');
            return false;
        }
        
        this.health--;
        console.log(`🎯 Мини-ракета получила урон. Осталось здоровья: ${this.health}`);
        
        if (this.health <= 0) {
            console.log('💥 Мини-ракета уничтожена!');
            this.explode();
            return true;
        }
        return false;
    }

    update() {
        if (!gameState || !gameState.gameActive) return false;
        
        const player = gameState.player;
        const targetX = player.x + player.width / 2;
        const targetY = player.y + player.height / 2;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        const currentAngle = Math.atan2(this.speedY, this.speedX);
        let angleDiff = targetAngle - currentAngle;
        
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        const newAngle = currentAngle + angleDiff * this.turnSpeed;
        
        this.speedX = Math.cos(newAngle) * this.speed;
        this.speedY = Math.sin(newAngle) * this.speed;
        
        this.x += this.speedX;
        this.y += this.speedY;
        
        this.updateTrail();
        
        if (this.y >= CONFIG.CANVAS_HEIGHT - 50) {
            this.explode();
            return false;
        }
        
        if (this.x < -this.width || this.x > CONFIG.CANVAS_WIDTH + this.width ||
            this.y < -this.height || this.y > CONFIG.CANVAS_HEIGHT + this.height) {
            return false;
        }
        
        return true;
    }

    updateTrail() {
        this.trailTimer--;
        if (this.trailTimer <= 0) {
            const angle = Math.atan2(this.speedY, this.speedX);
            const trailOffset = this.height / 2 + 2;
            const trailX = this.x - Math.cos(angle) * trailOffset;
            const trailY = this.y - Math.sin(angle) * trailOffset;
            
            this.trailParticles.push({
                x: trailX,
                y: trailY,
                size: 2 + Math.random() * 3,
                life: 20 + Math.random() * 10,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: `rgba(150, 150, 150, ${0.6 + Math.random() * 0.3})`
            });
            
            this.trailTimer = 2;
        }
        
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const particle = this.trailParticles[i];
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.life--;
            particle.size *= 0.98;
            
            if (particle.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
    }

    explode() {
        // ЗВУК ВЗРЫВА МИНИ-РАКЕТЫ
        if (typeof playMiniRocketExplosion === 'function') {
            playMiniRocketExplosion();
        }
        
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(this.x, this.y, 25));
        }
        return false;
    }

    draw() {
        if (!ctx) return;
        
        this.drawTrail();
        
        ctx.save();
        
        const angle = Math.atan2(this.speedY, this.speedX);
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        
        if (images && images.rocket) {
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(images.rocket, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.rotate(Math.PI / 2);
            
            ctx.fillStyle = '#b71c1c';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            ctx.fillStyle = '#d32f2f';
            ctx.beginPath();
            ctx.moveTo(-this.width / 2, -this.height / 2);
            ctx.lineTo(this.width / 2, -this.height / 2);
            ctx.lineTo(0, -this.height / 2 - 6);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#7b1fa2';
            ctx.beginPath();
            ctx.moveTo(-this.width / 2, this.height / 2);
            ctx.lineTo(-this.width / 2 - 4, this.height / 2);
            ctx.lineTo(-this.width / 2, this.height / 2 - 4);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.width / 2, this.height / 2);
            ctx.lineTo(this.width / 2 + 4, this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 2 - 4);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2 + 2);
            ctx.lineTo(0, this.height / 2 - 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-this.width / 2 + 1, -this.height / 2 + 4);
            ctx.lineTo(-this.width / 2 + 1, this.height / 2 - 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.width / 2 - 1, -this.height / 2 + 4);
            ctx.lineTo(this.width / 2 - 1, this.height / 2 - 4);
            ctx.stroke();
        }
        
        ctx.restore();
        
        this.drawExhaust();
    }

    drawTrail() {
        this.trailParticles.forEach(particle => {
            const alpha = particle.life / 30;
            
            ctx.fillStyle = particle.color.replace(')', `, ${alpha})`);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(particle.x - 1, particle.y - 1, particle.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawExhaust() {
        const angle = Math.atan2(this.speedY, this.speedX);
        const exhaustX = this.x - Math.cos(angle) * (this.height / 2 + 2);
        const exhaustY = this.y - Math.sin(angle) * (this.height / 2 + 2);
        
        const gradient = ctx.createRadialGradient(
            exhaustX, exhaustY, 0,
            exhaustX, exhaustY, 6
        );
        gradient.addColorStop(0, 'rgba(255, 255, 100, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(exhaustX, exhaustY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        for (let i = 0; i < 4; i++) {
            const flameLength = 5 + Math.random() * 4;
            const flameAngle = angle + (Math.random() - 0.5) * 0.3;
            const flameEndX = exhaustX - Math.cos(flameAngle) * flameLength;
            const flameEndY = exhaustY - Math.sin(flameAngle) * flameLength;
            
            ctx.strokeStyle = `rgba(255, ${150 + Math.random() * 105}, 0, 0.8)`;
            ctx.lineWidth = 1.5 + Math.random() * 1.5;
            ctx.beginPath();
            ctx.moveTo(exhaustX, exhaustY);
            ctx.lineTo(flameEndX, flameEndY);
            ctx.stroke();
        }
    }
}

// Сюрикены
// boss.js - класс Shuriken, добавляем гравитацию

class Shuriken {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.speed = 2;
        this.rotation = 0;
        this.rotationSpeed = 0.15;
        this.type = 'shuriken';
        this.hasHitGround = false;
        
        // НОВЫЕ СВОЙСТВА ДЛЯ ГРАВИТАЦИИ
        this.initialSpeedX = (Math.random() - 0.5) * 4; // Начальная горизонтальная скорость
        this.initialSpeedY = -1 - Math.random() * 2;   // Начальная вертикальная скорость (вверх)
        this.gravity = 0.08;                           // Сила гравитации
        this.velocityX = this.initialSpeedX;
        this.velocityY = this.initialSpeedY;
        this.groundLevel = CONFIG.CANVAS_HEIGHT - 50;  // Уровень земли
        
        // ПАРАБОЛИЧЕСКАЯ ТРАЕКТОРИЯ
        this.initialY = y;
        this.maxHeight = y - 50 - Math.random() * 100; // Максимальная высота
        
        console.log('🥷 Сюрикен с гравитацией создан!', { 
            x, y, 
            initialSpeedX: this.initialSpeedX, 
            initialSpeedY: this.initialSpeedY 
        });
    }

    update() {
        if (!gameState || !gameState.gameActive) return false;
        
        // Вращение сюрикена
        this.rotation += this.rotationSpeed;
        
        // ФИЗИКА С ГРАВИТАЦИЕЙ
        if (!this.hasHitGround) {
            // Применяем гравитацию к вертикальной скорости
            this.velocityY += this.gravity;
            
            // Обновляем позицию
            this.x += this.velocityX;
            this.y += this.velocityY;
            
            // ПРОВЕРКА СТОЛКНОВЕНИЯ С ЗЕМЛЕЙ
            if (this.y + this.height >= this.groundLevel) {
                this.hitGround();
                return false;
            }
            
            // ПРОВЕРКА СТОЛКНОВЕНИЯ С ИГРОКОМ В ВОЗДУХЕ
            if (this.checkCollisionWithPlayer()) {
                this.hitPlayer();
                return false;
            }
        } else {
            // После удара о землю - просто лежим
            return this.phaseTimer > 0;
        }
        
        // Проверка выхода за границы
        if (this.x < -this.width || this.x > CONFIG.CANVAS_WIDTH + this.width ||
            this.y < -this.height) {
            return false;
        }
        
        return true;
    }

    // ПАРАБОЛИЧЕСКОЕ ДВИЖЕНИЕ (альтернативный вариант)
    parabolicMovement() {
        const progress = this.life / this.maxLife;
        const angle = 45 * (Math.PI / 180); // Угол 45 градусов
        
        // Параболическая траектория: y = y0 + x*tan(θ) - (g*x²)/(2*v²*cos²(θ))
        const g = 0.5; // Гравитация
        const v = 4;   // Начальная скорость
        const distance = progress * 400; // Пройденное расстояние
        
        this.x = this.initialX + distance;
        this.y = this.initialY + distance * Math.tan(angle) - 
                 (g * distance * distance) / (2 * v * v * Math.cos(angle) * Math.cos(angle));
    }

    checkCollisionWithPlayer() {
        if (!gameState || !gameState.player) return false;
        
        const player = gameState.player;
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }

    hitPlayer() {
        console.log('🎯 Сюрикен попал в игрока!');
        
        if (gameState && gameState.player) {
            gameState.player.health = Math.max(0, gameState.player.health - 1);
            
            // Эффект попадания
            if (gameState && gameState.explosions) {
                gameState.explosions.push(new Explosion(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    20
                ));
            }
            
            screenShake = 3;
        }
        
        return false;
    }

    hitGround() {
        this.hasHitGround = true;
        this.y = this.groundLevel - this.height + 10; // Корректируем позицию на земле
        this.velocityX = 0;
        this.velocityY = 0;
        this.rotationSpeed = 0.02; // Медленное вращение на земле
        
        // Таймер исчезновения после удара о землю
        this.phaseTimer = 180; // 3 секунды
        
        console.log('💥 Сюрикен упал на землю!');
        
        // Эффект удара о землю
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2,
                this.groundLevel,
                15
            ));
        }
        
        screenShake = Math.max(screenShake, 2);
        
        // Проверка попадания в игрока при падении
        if (this.checkCollisionWithPlayer()) {
            this.hitPlayer();
        }
        
        return false;
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        if (images && images.finteflugerhaime) {
            // Рисуем сюрикен с эффектом движения
            ctx.drawImage(images.finteflugerhaime, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Фолбэк с эффектом движения
            this.drawFallback();
        }
        
        ctx.restore();
        
        // ЭФФЕКТ ДВИЖЕНИЯ - СЛЕД
        this.drawMotionTrail();
        
        // ИНДИКАТОР ТРАЕКТОРИИ (только в полете)
        if (!this.hasHitGround) {
            this.drawTrajectoryHint();
        }
    }

    drawFallback() {
        // Основной сюрикен
        ctx.strokeStyle = '#9c27b0';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        // Основной крест
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.lineTo(24, 0);
        ctx.moveTo(0, -24);
        ctx.lineTo(0, 24);
        ctx.stroke();
        
        // Диагонали
        ctx.beginPath();
        ctx.moveTo(-16, -16);
        ctx.lineTo(16, 16);
        ctx.moveTo(-16, 16);
        ctx.lineTo(16, -16);
        ctx.stroke();
        
        // Центральная точка
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Эффект скорости
        if (!this.hasHitGround) {
            ctx.strokeStyle = 'rgba(156, 39, 176, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // СЛЕД ДВИЖЕНИЯ
    drawMotionTrail() {
        if (this.hasHitGround) return;
        
        // След зависит от скорости
        const trailLength = Math.min(8, Math.abs(this.velocityY) * 5 + Math.abs(this.velocityX) * 3);
        
        for (let i = 0; i < trailLength; i++) {
            const progress = i / trailLength;
            const trailX = this.x - this.velocityX * i * 0.5;
            const trailY = this.y - this.velocityY * i * 0.5;
            const alpha = 0.6 - progress * 0.5;
            const size = 3 - progress * 2;
            
            ctx.fillStyle = `rgba(156, 39, 176, ${alpha})`;
            ctx.beginPath();
            ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ПОДСКАЗКА ТРАЕКТОРИИ (опционально)
    drawTrajectoryHint() {
        if (this.hasHitGround) return;
        
        // Предсказание траектории (точечная линия)
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
        
        // Симулируем физику для предсказания
        let predX = this.x + this.width / 2;
        let predY = this.y + this.height / 2;
        let predVX = this.velocityX;
        let predVY = this.velocityY;
        
        for (let i = 0; i < 10; i++) {
            predVY += this.gravity;
            predX += predVX;
            predY += predVY;
            
            ctx.lineTo(predX, predY);
            
            // Останавливаем если достигли земли
            if (predY >= this.groundLevel - 10) break;
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
    }
}