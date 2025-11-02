// enemies.js - с защитой от неопределенных переменных
console.log('✅ enemies.js загружен');

// Базовый класс самолета
class Enemy {
    constructor(type) {
        this.type = type;
        
        console.log(`🛩️ Создаю врага типа: ${type}`);
        
        // Защита от undefined с новыми размерами
        const originalSize = SPRITE_SIZES[type] || { width: 100, height: 50 };
        let scale;
        
        switch(type) {
            case 'stuka':
                scale = 0.07;
                break;
            case 'bomber':
                scale = 0.08;
                break;
            case 'kamikaze':
                scale = 0.06;
                break;
            case 'messerschmidt':
                scale = 0.08;
                break;
            case 'nakajima':
                scale = 0.07;
                break;
            case 'mitsubishi':
                scale = 0.06;
                break;
            default:
                scale = 0.07;
        }
        
        this.width = originalSize.width * scale;
        this.height = originalSize.height * scale;
        
        this.health = type === 'bomber' ? 3 : type === 'kamikaze' ? 4 : 2;
        this.maxHealth = this.health;
        this.speed = type === 'bomber' ? 0.8 : type === 'kamikaze' ? 1.0 : 1.2;
        this.isCrashing = false;
        this.crashSpeed = 0;
        this.crashRotation = 0;
        this.crashRotationSpeed = 0;
        this.attackCooldown = 0;
        this.x = -this.width;
        this.y = 50 + Math.random() * 300;
        this.showHealthBar = true;
        this.smokeTimer = 0;
        this.damageSmokeTimer = 0;
        this.fireTimer = 0;
        this.targetFighter = null;
        this.isDamaged = false;
        this.hasSakuraAura = false;
    }

    update() {
        if (this.isCrashing) {
            this.x += Math.cos(this.crashRotation) * 2;
            this.y += this.crashSpeed;
            this.crashRotation += this.crashRotationSpeed;
            this.crashSpeed += 0.1;
            
            // ДЫМ И ОГОНЬ ПРИ ПАДЕНИИ (УМЕНЬШЕНО НА 35%)
            this.smokeTimer--;
            this.fireTimer--;
            
            if (this.smokeTimer <= 0) {
                if (gameState && gameState.smokeParticles) {
                    // УМЕНЬШЕНО: было 3, стало 2 частицы дыма (-33%)
                    for (let i = 0; i < 2; i++) {
                        gameState.smokeParticles.push(new SmokeParticle(
                            this.x + this.width / 2 + Math.random() * 30 - 15,
                            this.y + this.height / 2 + Math.random() * 20 - 10
                        ));
                    }
                }
                this.smokeTimer = 3; // Немного реже дым
            }
            
            // ОГОНЬ ПРИ ПАДЕНИИ (УМЕНЬШЕНО НА 35%)
            if (this.fireTimer <= 0) {
                this.createFireParticles();
                this.fireTimer = 6; // Реже огонь
            }
            
            if (this.y + this.height >= (CONFIG?.CANVAS_HEIGHT || 800) - 50) {
                this.explode();
                return false;
            }
            return true;
        }

        // ДЫМ ПРИ ПОВРЕЖДЕНИИ (50% HP или меньше)
        if (this.health <= this.maxHealth / 2 && !this.isDamaged) {
            this.isDamaged = true;
            console.log(`💨 ${this.type} поврежден! Появится дым`);
            this.damageSmokeTimer = 5;
        }
        
        // Создаем дым если самолет поврежден
        if (this.isDamaged && !this.isCrashing) {
            this.damageSmokeTimer--;
            if (this.damageSmokeTimer <= 0) {
                this.createDamageSmoke();
                this.damageSmokeTimer = 8;
            }
        }

        // Поиск вражеского истребителя для атаки
        if (this.type === 'bomber' && gameState && gameState.friendlyFighters && gameState.friendlyFighters.length > 0) {
            if (!this.targetFighter) {
                this.findFighterTarget();
            }
            
            if (this.targetFighter && this.attackCooldown <= 0) {
                this.shootAtFighter();
                this.attackCooldown = 60;
            }
        }

        this.x += this.speed;
        this.attackCooldown--;

        if (this.x > (CONFIG?.CANVAS_WIDTH || 1200)) {
            return false;
        }

        return true;
    }

    // ДЫМ ПРИ ПОВРЕЖДЕНИИ
    createDamageSmoke() {
        if (gameState && gameState.smokeParticles) {
            // УМЕНЬШЕНО: было 2+1, стало 1+1 частицы дыма (-33%)
            const leftSmoke = new SmokeParticle(
                this.x + this.width * 0.2,
                this.y + this.height * 0.7
            );
            leftSmoke.size = Math.random() * 6 + 3;
            gameState.smokeParticles.push(leftSmoke);
            
            // Иногда добавляем второй дымок (реже)
            if (Math.random() < 0.5) { // Было 0.3, стало 0.5
                const rightSmoke = new SmokeParticle(
                    this.x + this.width * 0.8,
                    this.y + this.height * 0.7
                );
                rightSmoke.size = Math.random() * 6 + 3;
                gameState.smokeParticles.push(rightSmoke);
            }
        }
    }

    // ОГОНЬ ПРИ ПАДЕНИИ (УМЕНЬШЕНО НА 35%)
    createFireParticles() {
        if (gameState && gameState.smokeParticles) {
            // УМЕНЬШЕНО: было 4, стало 3 частицы огня (-25%)
            for (let i = 0; i < 3; i++) {
                const fireParticle = {
                    x: this.x + this.width / 2 + (Math.random() - 0.5) * 40,
                    y: this.y + this.height / 2 + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 2 - 1,
                    life: 20 + Math.random() * 15,
                    size: 3 + Math.random() * 4,
                    color: `rgba(255, ${80 + Math.random() * 100}, 0, 1)`,
                    update: function() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.life--;
                        this.size *= 0.97;
                        return this.life > 0;
                    },
                    draw: function() {
                        const alpha = this.life / 35;
                        ctx.fillStyle = this.color.replace('1)', `${alpha})`);
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Светящийся эффект (уменьшен)
                        ctx.fillStyle = `rgba(255, 255, 100, ${alpha * 0.2})`; // Было 0.3
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size * 1.3, 0, Math.PI * 2); // Было 1.5
                        ctx.fill();
                    }
                };
                gameState.smokeParticles.push(fireParticle);
            }
        }
    }

    findFighterTarget() {
        if (!gameState || !gameState.friendlyFighters) return;
        
        let closestFighter = null;
        let closestDistance = Infinity;

        for (const fighter of gameState.friendlyFighters) {
            const distance = Math.sqrt(
                Math.pow(this.x - fighter.x, 2) + Math.pow(this.y - fighter.y, 2)
            );
            if (distance < closestDistance && distance < 400) {
                closestDistance = distance;
                closestFighter = fighter;
            }
        }

        this.targetFighter = closestFighter;
    }

    shootAtFighter() {
        if (this.targetFighter && this.type === 'bomber') {
            const bulletCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < bulletCount; i++) {
                const angle = Math.atan2(
                    this.targetFighter.y - this.y,
                    this.targetFighter.x - this.x
                ) + (Math.random() - 0.5) * 0.3;
                
                if (gameState && gameState.enemyProjectiles) {
                    gameState.enemyProjectiles.push(new EnemyProjectile(
                        this.x + this.width / 2,
                        this.y + this.height / 2,
                        Math.cos(angle) * 4,
                        Math.sin(angle) * 4,
                        'bullet'
                    ));
                }
            }
        }
    }

    explode() {
        // ЗВУК ВЗРЫВА САМОЛЕТА
        if (typeof playAircraftExplosion === 'function') {
            playAircraftExplosion(this.type);
        }
        
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                40
            ));
        }
        
        if (this.checkCollisionWithPlayer()) {
            if (gameState && gameState.player) {
                gameState.player.health = 0;
            }
        }
        
        return false;
    }

    takeDamage() {
        if (this.isCrashing) return false;
        
        this.health--;
        
        // ЭФФЕКТ САКУРЫ: создаем цветы при попадании во время погоды сакуры
        if (gameState && gameState.boss && gameState.boss.type === 'yamato' && 
            gameState.boss.sakuraAuraActive && !this.isCrashing) {
            this.createSakuraFlowersOnHit();
        }
        
        if (this.health <= this.maxHealth / 2 && !this.isDamaged) {
            this.isDamaged = true;
            console.log(`💨 ${this.type} получил критические повреждения!`);
            
            for (let i = 0; i < 2; i++) {
                this.createDamageSmoke();
            }
            this.damageSmokeTimer = 8;
        }
        
        if (this.health <= 0) {
            this.isCrashing = true;
            this.showHealthBar = false;
            this.crashSpeed = 1;
            this.crashRotationSpeed = (Math.random() - 0.5) * 0.2;
            this.isDamaged = true;

            // ЭФФЕКТ САКУРЫ: создаем цветы при уничтожении
            if (gameState && gameState.boss && gameState.boss.type === 'yamato' && 
                gameState.boss.sakuraAuraActive) {
                this.createSakuraFlowersOnDeath();
            }
            
            if (gameState) {
                if (CONFIG?.REWARDS?.[this.type]) {
                    gameState.details += CONFIG.REWARDS[this.type];
                    if (typeof updateDetailsUI === 'function') {
                        updateDetailsUI();
                    }
                }
                
                for (let i = 0; i < 5; i++) {
                    if (gameState.smokeParticles) {
                        gameState.smokeParticles.push(new SmokeParticle(
                            this.x + this.width / 2 + Math.random() * 40 - 20,
                            this.y + this.height / 2 + Math.random() * 30 - 15
                        ));
                    }
                }
                
                this.createFireParticles();
            }
            return true;
        }
        return false;
    }

    // НОВЫЙ МЕТОД: Создание цветов сакуры при попадании
    createSakuraFlowersOnHit() {
        if (!gameState) return;
        
        const flowerCount = 2 + Math.floor(Math.random() * 3); // 2-4 цветка
        
        for (let i = 0; i < flowerCount; i++) {
            this.createFallingSakuraFlower();
        }
        
        console.log(`🌸 ${this.type} осыпается цветами сакуры при попадании!`);
    }

    // НОВЫЙ МЕТОД: Создание цветов сакуры при уничтожении
    createSakuraFlowersOnDeath() {
        if (!gameState) return;
        
        const flowerCount = 4 + Math.floor(Math.random() * 4); // 4-7 цветков при уничтожении
        
        for (let i = 0; i < flowerCount; i++) {
            this.createFallingSakuraFlower();
        }
        
        console.log(`🌸 ${this.type} осыпается цветами сакуры при уничтожении!`);
    }

    // НОВЫЙ МЕТОД: Создание одного падающего цветка сакуры
    createFallingSakuraFlower() {
        if (!gameState) return;
        
        // Начальная позиция - вокруг самолета
        const startX = this.x + Math.random() * this.width;
        const startY = this.y + Math.random() * this.height;
        
        const flower = {
            x: startX,
            y: startY,
            startX: startX,
            startY: startY,
            vx: (Math.random() - 0.5) * 2, // Случайное горизонтальное движение
            vy: 1 + Math.random() * 1,     // Падение вниз
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            scale: 0.08 + Math.random() * 0.09, // Размер цветка
            life: 1.0,
            maxLife: 1.0,
            groundLevel: CONFIG.CANVAS_HEIGHT - 45, // Уровень земли (над травой)
            hasLanded: false,
            wobble: Math.random() * Math.PI * 2, // Для плавного покачивания
            wobbleSpeed: 0.10 + Math.random() * 0.03,
            wobbleAmount: 2 + Math.random() * 3,
            
            update: function() {
                if (this.hasLanded) {
                    // После приземления - плавное исчезновение
                    this.life -= 0.08; // Медленное исчезновение
                    this.wobble += this.wobbleSpeed;
                    
                    // Легкое покачивание на земле
                    this.x = this.startX + Math.sin(this.wobble) * this.wobbleAmount;
                    
                    return this.life > 0;
                }
                
                // Движение в воздухе
                this.x += this.vx;
                this.y += this.vy;
                this.rotation += this.rotationSpeed;
                
                // Легкое замедление горизонтального движения
                this.vx *= 0.98;
                
                // Проверка приземления
                if (this.y >= this.groundLevel - 10) {
                    this.land();
                }
                
                this.life -= 0.005; // Очень медленное исчезновение в воздухе
                
                return this.life > 0 && this.y < CONFIG.CANVAS_HEIGHT + 50;
            },
            
            land: function() {
                if (this.hasLanded) return;
                
                this.hasLanded = true;
                this.y = this.groundLevel - 10;
                this.vx = 0;
                this.vy = 0;
                this.startX = this.x; // Запоминаем позицию приземления для покачивания
                this.life = 1.0; // Сбрасываем таймер жизни при приземлении
                
                // Создаем легкий эффект при приземлении
                if (gameState && gameState.explosions) {
                    const landingEffect = new Explosion(this.x, this.y, 8);
                    landingEffect.life = 0.3;
                    landingEffect.color = 'rgba(255, 182, 193, 0.5)';
                    gameState.explosions.push(landingEffect);
                }
            },
            
            draw: function() {
                const alpha = this.life;
                const currentScale = this.scale * (0.8 + 0.2 * this.life);
                
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.scale(currentScale, currentScale);
                ctx.globalAlpha = alpha;
                
                if (images.sakura) {
                    // Используем спрайт сакуры
                    ctx.drawImage(images.sakura, -50, -50, 100, 100);
                } else {
                    // Фолбэк - рисуем простой цветок
                    this.drawFallback();
                }
                
                ctx.restore();
                
                // Тень на земле (только после приземления)
                if (this.hasLanded) {
                    this.drawShadow(alpha);
                }
            },
            
            drawFallback: function() {
                // Розовые лепестки
                ctx.fillStyle = '#f8bbd9';
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    ctx.save();
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.ellipse(30, 0, 12, 6, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                
                // Центр цветка
                ctx.fillStyle = '#f48fb1';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Тычинки
                ctx.fillStyle = '#ffeb3b';
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    ctx.save();
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.arc(5, 0, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            },
            
            drawShadow: function(alpha) {
                const shadowAlpha = alpha * 0.3;
                ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
                ctx.beginPath();
                ctx.ellipse(this.x, this.groundLevel - 5, 6, 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // Добавляем цветок в массив специальных эффектов
        if (!gameState.sakuraFlowers) gameState.sakuraFlowers = [];
        gameState.sakuraFlowers.push(flower);
    }

    checkCollisionWithPlayer() {
        if (!gameState || !gameState.player) return false;
        
        const player = gameState.player;
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        
        // Применяем эффект уклонения если есть
        if (this.dodgeEffect) {
            ctx.globalAlpha = 0.4; // Становимся полупрозрачными
        }
        
        if (this.isCrashing) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.crashRotation);
            
            if (images && images[this.type]) {
                ctx.drawImage(images[this.type], -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            }
        } else {
            if (images && images[this.type]) {
                ctx.drawImage(images[this.type], this.x, this.y, this.width, this.height);
            } else {
                ctx.fillStyle = '#795548';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        }
        
        ctx.restore();
        
        if (this.showHealthBar && !this.isCrashing) {
            this.drawHealthBar();
        }
    }

    drawHealthBar() {
        if (!ctx) return;
        
        const barWidth = this.width;
        const barHeight = 4;
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(this.x, this.y - 8, barWidth * healthPercent, barHeight);
    }
}

// Штурмовик
class Stuka extends Enemy {
    constructor() {
        super('stuka');
        this.phase = 'approach';
        this.diveStartX = 0;
        this.originalY = 0;
        this.bulletsFired = 0;
        this.bulletInterval = 0;
        this.attackAngle = 0;
        this.rotation = 0;
        this.targetRotation = 0;
    }

    update() {
        if (this.isCrashing) {
            return super.update();
        }

        switch(this.phase) {
            case 'approach':
                this.x += this.speed;
                this.originalY = this.y;
                this.targetRotation = 0;
                if (this.x > (CONFIG?.CANVAS_WIDTH || 1200) * 0.2) {
                    this.phase = 'dive';
                    this.diveStartX = this.x;
                }
                break;
                
            case 'dive':
                this.x += this.speed * 1.2;
                this.y += 1.5;
                this.targetRotation = 0.3;
                
                if (gameState && gameState.player) {
                    this.attackAngle = Math.atan2(
                        gameState.player.y - this.y,
                        (gameState.player.x + 100) - this.x
                    );
                }
                
                if (this.y > this.originalY + 120 || this.x > (CONFIG?.CANVAS_WIDTH || 1200) * 0.6) {
                    this.phase = 'attack';
                    this.bulletsFired = 0;
                    this.bulletInterval = 0;
                }
                break;
                
            case 'attack':
                this.x += this.speed;
                this.targetRotation = 0.1;
                
                this.bulletInterval--;
                if (this.bulletInterval <= 0 && this.bulletsFired < 4) {
                    this.fireBullet();
                    this.bulletsFired++;
                    this.bulletInterval = 15;
                }
                
                if (this.bulletsFired >= 4) {
                    this.phase = 'escape';
                }
                break;
                
            case 'escape':
                this.x += this.speed * 0.8;
                this.y -= 1.2;
                this.targetRotation = -0.2;
                break;
        }

        this.rotation += (this.targetRotation - this.rotation) * 0.1;

        if (this.x > (CONFIG?.CANVAS_WIDTH || 1200) || this.y < -this.height) {
            return false;
        }

        return true;
    }

    fireBullet() {
        const baseAngle = this.attackAngle;
        const spread = 0.8;
        const angle = baseAngle + (Math.random() - 0.5) * spread;
        
        if (gameState && gameState.enemyProjectiles) {
            gameState.enemyProjectiles.push(new EnemyProjectile(
                this.x + this.width,
                this.y + this.height / 2,
                Math.cos(angle) * 4,
                Math.sin(angle) * 4,
                'bullet'
            ));
        }
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        
        if (this.isCrashing) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.crashRotation);
            
            if (images && images.stuka) {
                ctx.drawImage(images.stuka, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            }
        } else {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation);
            
            if (images && images.stuka) {
                ctx.drawImage(images.stuka, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                ctx.fillStyle = '#795548';
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            }
        }
        
        ctx.restore();
        
        if (this.showHealthBar && !this.isCrashing) {
            this.drawHealthBar();
        }
    }
}

// Бомбардировщик
class Bomber extends Enemy {
    constructor() {
        super('bomber');
        this.attackCooldown = 180; // УВЕЛИЧИВАЕМ КУЛДАУН (3 секунды вместо 1.5-3)
        this.bombCount = 0; // СЧЕТЧИК СБРОШЕННЫХ БОМБ
        this.maxBombs = 3 + Math.floor(Math.random() * 2); // 3-4 бомбы за весь пролет
        this.hasFinishedBombing = false;
        
        console.log(`💣 Бомбардировщик создан! Максимум бомб: ${this.maxBombs}`);
    }

    update() {
        if (!super.update()) return false;

        // ЕСЛИ УЖЕ СБРОСИЛИ ВСЕ БОМБЫ - НЕ АТАКУЕМ
        if (this.hasFinishedBombing) {
            return true;
        }

        // Атака по игроку (бомбы) - ТОЛЬКО ЕСЛИ ЕЩЕ НЕ СБРОСИЛИ ВСЕ БОМБЫ
        if (this.attackCooldown <= 0 && this.x > 0 && this.x < (CONFIG?.CANVAS_WIDTH || 1200) - 200 && this.bombCount < this.maxBombs) {
            this.attack();
            this.attackCooldown = 180 + Math.random() * 60; // 3-4 секунды между сбросами
        }

        // ЕСЛИ СБРОСИЛИ ВСЕ БОМБЫ - ПОМЕЧАЕМ ЧТО ЗАВЕРШИЛИ
        if (this.bombCount >= this.maxBombs) {
            this.hasFinishedBombing = true;
            console.log('💣 Бомбардировщик завершил бомбардировку!');
        }

        return true;
    }

    attack() {
        // СБРАСЫВАЕМ ТОЛЬКО 1 БОМБУ ЗА РАЗ
        const bombCount = 1; // ВСЕГДА 1 БОМБА
        
        for (let i = 0; i < bombCount; i++) {
            if (gameState && gameState.enemyProjectiles) {
                gameState.enemyProjectiles.push(new EnemyProjectile(
                    this.x + this.width / 2 + (Math.random() - 0.5) * 30, // СЛУЧАЙНОЕ СМЕЩЕНИЕ
                    this.y + this.height,
                    0,
                    2 + Math.random() * 0.3, // СЛУЧАЙНАЯ СКОРОСТЬ
                    'bomb'
                ));
                
                this.bombCount++;
                console.log(`💣 Бомбардировщик сбросил бомбу ${this.bombCount}/${this.maxBombs}`);
            }
        }
    }
}

// Камикадзе
class Kamikaze extends Enemy {
    constructor() {
        super('kamikaze');
        this.speed = 1.5;
        this.phase = 'approach';
        this.approachTime = 120;
        this.targetAngle = 0;
        this.currentAngle = 0;
    }

    update() {
        if (this.isCrashing) {
            return super.update();
        }

        if (!gameState || !gameState.player) return true;
        
        const playerCenterX = gameState.player.x + gameState.player.width / 2;
        const playerCenterY = gameState.player.y + gameState.player.height / 2;
        
        switch(this.phase) {
            case 'approach':
                this.x += this.speed;
                this.approachTime--;
                
                this.targetAngle = Math.atan2(playerCenterY - this.y, playerCenterX - this.x);
                
                if (this.approachTime <= 0 || this.x > (CONFIG?.CANVAS_WIDTH || 1200) * 0.3) {
                    this.phase = 'attack';
                }
                break;
                
            case 'attack':
                // Плавно поворачиваем к цели, но не позволяем уйти под пол
                this.targetAngle = Math.atan2(playerCenterY - this.y, playerCenterX - this.x);
                this.currentAngle += (this.targetAngle - this.currentAngle) * 0.05;
                
                // Ограничиваем угол, чтобы не уходил под землю
                const maxAngle = Math.PI / 2;
                this.currentAngle = Math.max(this.currentAngle, -maxAngle);
                
                this.x += Math.cos(this.currentAngle) * this.speed;
                this.y += Math.sin(this.currentAngle) * this.speed;
                break;
        }

        if (this.checkCollisionWithPlayer()) {
            // ЗВУК ВЗРЫВА КАМИКАДЗЕ ПРИ СТОЛКНОВЕНИИ С ИГРОКОМ
            if (typeof playAircraftExplosion === 'function') {
                playAircraftExplosion('kamikaze');
            }
            
            gameState.player.health = 0;
            this.explode();
            return false;
        }

        if (this.x > (CONFIG?.CANVAS_WIDTH || 1200) || this.x < -this.width || 
            this.y > (CONFIG?.CANVAS_HEIGHT || 800) || this.y < -this.height) {
            return false;
        }

        return true;
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        
        if (this.isCrashing) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.crashRotation);
            
            if (images && images.kamikaze) {
                ctx.drawImage(images.kamikaze, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            }
        } else {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.currentAngle);
            
            if (images && images.kamikaze) {
                ctx.drawImage(images.kamikaze, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                ctx.fillStyle = '#d32f2f';
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                
                ctx.fillStyle = 'white';
                ctx.fillRect(-3, -this.height / 2, 6, this.height);
                ctx.fillRect(-this.width / 2, -3, this.width, 6);
            }
        }
        
        ctx.restore();
        
        if (this.showHealthBar && !this.isCrashing) {
            this.drawHealthBar();
        }
    }
}

// Истребитель ВВС СССР
class FriendlyFighter {
    constructor() {
        this.type = 'friendly';
        this.width = 60;
        this.height = 25;
        this.health = 4;
        this.maxHealth = 4;
        this.speed = 2.2;
        this.x = (CONFIG?.CANVAS_WIDTH || 1200) + this.width;
        this.y = 100 + Math.random() * 200;
        this.targetEnemy = null;
        this.targetUFO = null; // Новая цель - НЛО
        this.shootCooldown = 0;
        this.showHealthBar = true;
        this.rotation = 0;
        this.targetRotation = 0;
        this.isFriendly = true;
        this.priorityUFO = true; // Приоритет НЛО над обычными врагами
        this.maxTurnSpeed = 0.08; // Ограничение скорости поворота
        this.smoothTurnFactor = 0.05; // Плавность поворотов
        this.minTargetDistance = 80; // Минимальная дистанция для атаки
        this.maxTargetDistance = 350; // Максимальная дистанция для атаки
        this.boundaryMargin = 50; // Отступ от границ экрана
        this.stuckTimer = 0;
        this.maxStuckTime = 60; // 1 секунда
        this.lastX = this.x;
        this.lastY = this.y;
        
        // ПРИОРИТЕТЫ ЦЕЛЕЙ
        this.targetSwitchCooldown = 0;
        this.currentTargetLoyalty = 0; // "Верность" текущей цели
    }

    update() {
        // ОБНОВЛЯЕМ ПОЗИЦИЮ ДЛЯ ПРОВЕРКИ ЗАСТРЕВАНИЯ
        this.lastX = this.x;
        this.lastY = this.y;

        // ЕСЛИ САМОЛЕТ ПАДАЕТ - ОБНОВЛЯЕМ АНИМАЦИЮ ПАДЕНИЯ
        if (this.isCrashing) {
            return this.updateCrash();
        }

        // ПРОВЕРКА ЗАСТРЕВАНИЯ
        this.checkIfStuck();

        // КУЛДАУН СМЕНЫ ЦЕЛИ
        if (this.targetSwitchCooldown > 0) {
            this.targetSwitchCooldown--;
        }

        // ПОИСК ЦЕЛЕЙ С ПРИОРИТЕТОМ НЛО (но не Ямато)
        if (!this.targetUFO || this.targetUFO.health <= 0 || this.targetUFO.type === 'yamato') {
            this.findUFOTarget();
        }
        
        // ПОИСК ОБЫЧНЫХ ЦЕЛЕЙ ТОЛЬКО ЕСЛИ МОЖНО МЕНЯТЬ ЦЕЛЬ
        if (this.targetSwitchCooldown <= 0) {
            if (!this.targetEnemy || this.targetEnemy.health <= 0 || this.targetEnemy.isCrashing) {
                this.findEnemyTarget();
            }
        }

        // ВЫБОР ЦЕЛИ: НЛО ИМЕЕТ ПРИОРИТЕТ
        let currentTarget = null;
        if (this.targetUFO && this.targetUFO.type === 'ufo') {
            currentTarget = this.targetUFO;
            this.currentTargetLoyalty++; // Увеличиваем верность цели
        } else if (this.targetEnemy) {
            currentTarget = this.targetEnemy;
            this.currentTargetLoyalty++;
        }

        // ДВИЖЕНИЕ К ЦЕЛИ ИЛИ ВПЕРЕД
        if (currentTarget && this.isTargetValid(currentTarget)) {
            this.moveToTarget(currentTarget);
            
            // СТРЕЛЬБА ПО ЦЕЛИ
            this.shootCooldown--;
            if (this.shootCooldown <= 0 && this.isInAttackRange(currentTarget)) {
                this.shoot(currentTarget);
                this.shootCooldown = currentTarget === this.targetUFO ? 25 : 30; // Чуть реже стрельба
            }
        } else {
            // ЛЕТИМ НАЛЕВО ЕСЛИ НЕТ ЦЕЛЕЙ ИЛИ ЦЕЛЬ НЕВАЛИДНА
            this.flyForward();
            
            // СБРАСЫВАЕМ ЦЕЛЬ ЕСЛИ ОНА НЕВАЛИДНА
            if (currentTarget && !this.isTargetValid(currentTarget)) {
                this.clearInvalidTarget();
            }
        }

        // ПРИМЕНЯЕМ ГРАНИЦЫ ЭКРАНА
        this.enforceBoundaries();

        // УДАЛЕНИЕ ЕСЛИ УЛЕТЕЛ ЗА ЛЕВУЮ ГРАНИЦУ
        if (this.x < -this.width) {
            return false;
        }

        return true;
    }

    // ПРОВЕРКА ВАЛИДНОСТИ ЦЕЛИ
    isTargetValid(target) {
        if (!target || target.health <= 0) return false;
        
        // ДЛЯ НЛО - ОСОБЫЕ ПРОВЕРКИ
        if (target.type === 'ufo') {
            return !target.crashing && !target.isInvisible;
        }
        
        // ДЛЯ ОБЫЧНЫХ ВРАГОВ
        if (target.isCrashing !== undefined) {
            return !target.isCrashing;
        }
        
        return true;
    }

    // ПРОВЕРКА ЗАСТРЕВАНИЯ
    checkIfStuck() {
        const movedX = Math.abs(this.x - this.lastX);
        const movedY = Math.abs(this.y - this.lastY);
        
        if (movedX < 0.5 && movedY < 0.5) {
            this.stuckTimer++;
        } else {
            this.stuckTimer = 0;
        }
        
        // ЕСЛИ ЗАСТРЯЛ - ОЧИЩАЕМ ЦЕЛИ И МЕНЯЕМ ПОЗИЦИЮ
        if (this.stuckTimer > this.maxStuckTime) {
            console.log('🔄 Истребитель застрял, очищаем цели!');
            this.clearInvalidTarget();
            this.x += 10; // Сдвигаем немного
            this.stuckTimer = 0;
        }
    }

    // ДВИЖЕНИЕ К ЦЕЛИ С РЕАЛИСТИЧНЫМИ МАНЕВРАМИ
    moveToTarget(target) {
        let targetX, targetY;
        
        if (target === this.targetUFO) {
            // АТАКА НЛО - ДЕРЖИМ ДИСТАНЦИЮ И ВЫСОТУ
            targetX = target.x + target.width / 2 - 120;
            targetY = target.y + target.height / 2 - 80;
        } else {
            // АТАКА ОБЫЧНОГО ВРАГА - ПОДХОДИМ БЛИЖЕ
            targetX = target.x - 60;
            targetY = target.y + target.height / 2;
        }
        
        // ОГРАНИЧИВАЕМ ЦЕЛЕВЫЕ КООРДИНАТЫ ГРАНИЦАМИ ЭКРАНА
        targetX = Math.max(this.boundaryMargin, 
                          Math.min(targetX, CONFIG.CANVAS_WIDTH - this.width - this.boundaryMargin));
        targetY = Math.max(60, 
                          Math.min(targetY, CONFIG.CANVAS_HEIGHT - 150));
        
        // ВЫЧИСЛЯЕМ УГОЛ К ЦЕЛИ
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            const targetAngle = Math.atan2(dy, dx);
            
            // ПЛАВНЫЙ ПОВОРОТ С ОГРАНИЧЕНИЕМ СКОРОСТИ
            let angleDiff = targetAngle - this.rotation;
            
            // НОРМАЛИЗУЕМ РАЗНИЦУ УГЛОВ (-π до π)
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // ОГРАНИЧИВАЕМ СКОРОСТЬ ПОВОРОТА
            const maxTurn = this.maxTurnSpeed;
            angleDiff = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
            
            // ПЛАВНЫЙ ПОВОРОТ
            this.rotation += angleDiff * this.smoothTurnFactor;
            
            // ДВИЖЕНИЕ ВПЕРЕД
            this.x += Math.cos(this.rotation) * this.speed;
            this.y += Math.sin(this.rotation) * this.speed;
        }
    }

    // ПОЛЕТ ВПЕРЕД БЕЗ ЦЕЛИ
    flyForward() {
        this.targetRotation = Math.PI; // Направление налево
        this.rotation += (this.targetRotation - this.rotation) * 0.1;
        
        this.x += Math.cos(this.rotation) * this.speed;
        this.y += Math.sin(this.rotation) * this.speed;
        
        // ПЛАВНОЕ КОЛЕБАНИЕ ВЫСОТЫ
        const wave = Math.sin(Date.now() * 0.002) * 0.5;
        this.y += wave;
        
        // ОГРАНИЧИВАЕМ ВЫСОТУ
        this.y = Math.max(60, Math.min(this.y, CONFIG.CANVAS_HEIGHT - 150));
    }

    // ПРОВЕРКА ДИСТАНЦИИ ДЛЯ АТАКИ
    isInAttackRange(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance >= this.minTargetDistance && distance <= this.maxTargetDistance;
    }

    // ОЧИСТКА НЕВАЛИДНЫХ ЦЕЛЕЙ
    clearInvalidTarget() {
        if (this.targetUFO && !this.isTargetValid(this.targetUFO)) {
            this.targetUFO = null;
        }
        if (this.targetEnemy && !this.isTargetValid(this.targetEnemy)) {
            this.targetEnemy = null;
        }
        this.targetSwitchCooldown = 30; // Задержка перед выбором новой цели
        this.currentTargetLoyalty = 0;
    }

    // ОГРАНИЧЕНИЕ ГРАНИЦ ЭКРАНА
    enforceBoundaries() {
        // НЕ ДАЕМ ВЫЛЕТЕТЬ ЗА ГРАНИЦЫ
        this.x = Math.max(0, Math.min(this.x, CONFIG.CANVAS_WIDTH - this.width));
        this.y = Math.max(40, Math.min(this.y, CONFIG.CANVAS_HEIGHT - 100));
    }

    // ОБНОВЛЕННЫЙ ПОИСК ЦЕЛЕЙ
    findUFOTarget() {
        if (!gameState || !gameState.boss || this.targetSwitchCooldown > 0) return;
        
        const boss = gameState.boss;
        if (boss && boss.type === 'ufo' && boss.health > 0 && !boss.crashing && !boss.isInvisible) {
            // ПРОВЕРЯЕМ, ЧТО НЛО В ЗОНЕ ДОСТУПНОСТИ
            if (boss.x < CONFIG.CANVAS_WIDTH - 100) {
                this.targetUFO = boss;
                this.targetEnemy = null; // Очищаем обычную цель при атаке НЛО
                console.log('🎯 Истребитель ВВС СССР атакует НЛО!');
            }
        } else {
            this.targetUFO = null;
        }
    }

    findEnemyTarget() {
        if (!gameState || !gameState.enemies || this.targetSwitchCooldown > 0) return;
        
        let bestTarget = null;
        let bestScore = -Infinity;

        for (const enemy of gameState.enemies) {
            if (!this.isTargetValid(enemy)) continue;
            
            const score = this.calculateTargetScore(enemy);
            if (score > bestScore) {
                bestScore = score;
                bestTarget = enemy;
            }
        }

        // МЕНЯЕМ ЦЕЛЬ ТОЛЬКО ЕСЛИ НОВАЯ ЦЕЛЬ ЗНАЧИТЕЛЬНО ЛУЧШЕ
        if (bestTarget && bestScore > this.currentTargetLoyalty * 10) {
            this.targetEnemy = bestTarget;
            this.targetSwitchCooldown = 45; // Задержка перед следующей сменой цели
        }
    }

    // ОЦЕНКА ЦЕЛИ
    calculateTargetScore(enemy) {
        let score = 0;
        
        // ДИСТАНЦИЯ (предпочитаем ближние цели)
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        score += (this.maxTargetDistance - distance) * 2;
        
        // ПРЕДПОЧТЕНИЕ ЦЕЛЕЙ СПЕРЕДИ
        const angleToTarget = Math.atan2(dy, dx);
        const angleDiff = Math.abs(angleToTarget - this.rotation);
        const frontalBonus = Math.max(0, 1 - angleDiff / Math.PI) * 100;
        score += frontalBonus;
        
        // ПРИОРИТЕТ БОМБАРДИРОВЩИКОВ
        if (enemy.type === 'bomber' || enemy.type === 'mitsubishi') {
            score += 150;
        }
        
        // ПРИОРИТЕТ РАНЕНЫХ ЦЕЛЕЙ
        if (enemy.health < enemy.maxHealth / 2) {
            score += 100;
        }
        
        return score;
    }

    shoot(target) {
        if (target && target.health > 0) {
            const angle = Math.atan2(
                target.y - this.y,
                target.x - this.x
            );
            
            // Создаем снаряд с флагом дружественного огня
            const projectile = new Projectile(
                this.x,
                this.y + this.height / 2,
                Math.cos(angle) * 8,
                Math.sin(angle) * 8
            );
            projectile.isFriendly = true;
            
            if (gameState && gameState.projectiles) {
                gameState.projectiles.push(projectile);
            }
            
            // Особое сообщение для атаки на НЛО
            if (target === this.targetUFO) {
                console.log('🚀 Истребитель ВВС СССР стреляет по НЛО!');
            }
        }
    }

    takeDamage(damageAmount = 1) {
        // ЗАЩИТНАЯ ПРОВЕРКА
        if (!this || this.health === undefined) {
            console.warn('⚠️ Ошибка: takeDamage() вызван для несуществующего истребителя');
            return true; // Удаляем из игры
        }
        
        this.health -= damageAmount;
        console.log(`✈️ Истребитель ВВС СССР получил урон: ${damageAmount}. Осталось здоровья: ${this.health}`);
        
        if (this.health <= 0) {
            console.log('💥 Истребитель ВВС СССР сбит! Запускаем анимацию падения...');
            this.startCrash();
            return true; // Сообщаем что самолет уничтожен
        }
        
        // Визуальный эффект получения урона
        this.createDamageEffect();
        return false; // Самолет еще жив
    }

    // НОВЫЙ МЕТОД: ЗАПУСК АНИМАЦИИ ПАДЕНИЯ
    startCrash() {
        this.isCrashing = true;
        this.showHealthBar = false;
        this.crashSpeed = 1.5;
        this.crashRotation = 0;
        this.crashRotationSpeed = (Math.random() - 0.5) * 0.3;
        
        console.log('🔄 Истребитель переходит в режим падения:', {
            x: this.x, 
            y: this.y, 
            health: this.health,
            crashing: this.isCrashing
        });
        
        // Создаем дым и огонь при падении
        this.createCrashEffects();
    }

    // НОВЫЙ МЕТОД: ЭФФЕКТЫ ПАДЕНИЯ
    createCrashEffects() {
        if (!gameState) return;
        
        // Интенсивный дым при падении
        for (let i = 0; i < 8; i++) {
            if (gameState.smokeParticles) {
                gameState.smokeParticles.push(new SmokeParticle(
                    this.x + this.width / 2 + (Math.random() - 0.5) * 40,
                    this.y + this.height / 2 + (Math.random() - 0.5) * 30
                ));
            }
        }
        
        // Огонь при падении
        this.createFireParticles();
    }

    // НОВЫЙ МЕТОД: ОГОНЬ ПРИ ПАДЕНИИ
    createFireParticles() {
        if (!gameState || !gameState.smokeParticles) return;
        
        for (let i = 0; i < 5; i++) {
            const fireParticle = {
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 50,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 2 - 1,
                life: 25 + Math.random() * 20,
                size: 4 + Math.random() * 5,
                color: `rgba(255, ${100 + Math.random() * 100}, 0, 1)`,
                update: function() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.life--;
                    this.size *= 0.96;
                    return this.life > 0;
                },
                draw: function() {
                    const alpha = this.life / 45;
                    ctx.fillStyle = this.color.replace('1)', `${alpha})`);
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Светящийся эффект
                    ctx.fillStyle = `rgba(255, 255, 100, ${alpha * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            gameState.smokeParticles.push(fireParticle);
        }
    }

    // НОВЫЙ МЕТОД: ЭФФЕКТ ПОЛУЧЕНИЯ УРОНА
    createDamageEffect() {
        if (!gameState) return;
        
        // Маленький дымок при попадании
        for (let i = 0; i < 2; i++) {
            if (gameState.smokeParticles) {
                const smoke = new SmokeParticle(
                    this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                    this.y + this.height / 2 + (Math.random() - 0.5) * 15
                );
                smoke.size = 2 + Math.random() * 3;
                gameState.smokeParticles.push(smoke);
            }
        }
        
        // Маленькая вспышка
        if (gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2 + (Math.random() - 0.5) * 10,
                this.y + this.height / 2 + (Math.random() - 0.5) * 10,
                12
            ));
        }
    }

    updateCrash() {
        // Движение при падении
        this.x += Math.cos(this.crashRotation) * 2;
        this.y += this.crashSpeed;
        this.crashRotation += this.crashRotationSpeed;
        this.crashSpeed += 0.1;
        
        // Дым при падении
        if (Math.random() < 0.3) {
            this.createCrashSmoke();
        }
        
        // Огонь при падении (реже)
        if (Math.random() < 0.1) {
            this.createFireParticles();
        }
        
        // Взрыв при достижении земли
        if (this.y + this.height >= CONFIG.CANVAS_HEIGHT - 50) {
            this.explode();
            return false; // Удаляем из игры
        }
        
        return true;
    }

    // НОВЫЙ МЕТОД: ДЫМ ПРИ ПАДЕНИИ
    createCrashSmoke() {
        if (!gameState || !gameState.smokeParticles) return;
        
        for (let i = 0; i < 2; i++) {
            gameState.smokeParticles.push(new SmokeParticle(
                this.x + this.width / 2 + Math.random() * 30 - 15,
                this.y + this.height / 2 + Math.random() * 20 - 10
            ));
        }
    }

    // НОВЫЙ МЕТОД: ВЗРЫВ ПРИ СТОЛКНОВЕНИИ С ЗЕМЛЕЙ
    explode() {
        console.log('💥 Истребитель ВВС СССР взорвался при падении!');
        
        // ЗВУК ВЗРЫВА
        if (typeof playAircraftExplosion === 'function') {
            playAircraftExplosion('fighter');
        }
        
        // БОЛЬШОЙ ВЗРЫВ
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                40
            ));
        }
        
        screenShake = 8;
        
        return false;
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        
        if (this.isCrashing) {
            // РИСУЕМ ПАДАЮЩИЙ САМОЛЕТ
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.crashRotation);
            
            if (images && images.il) {
                ctx.drawImage(images.il, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                // Фолбэк для падающего самолета
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                
                ctx.fillStyle = 'black';
                ctx.font = '8px Arial';
                ctx.fillText('ПАДЕНИЕ', -20, 0);
            }
        } else {
            // Обычная отрисовка живого самолета
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation);
            
            if (images && images.il) {
                ctx.drawImage(images.il, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                ctx.fillStyle = this.targetUFO ? '#ff6d00' : '#4caf50';
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            }
        }
        
        ctx.restore();

        // ИНДИКАТОР ЗДОРОВЬЯ ТОЛЬКО ДЛЯ ЖИВЫХ САМОЛЕТОВ
        if (this.showHealthBar && this.health > 0 && !this.isCrashing) {
            this.drawHealthBar();
        }
    }

    drawHealthBar() {
        if (!ctx) return;
        
        const barWidth = this.width;
        const barHeight = 3;
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
        ctx.fillStyle = this.targetUFO ? '#ff6d00' : '#4caf50'; // Оранжевый если атакует НЛО
        ctx.fillRect(this.x, this.y - 8, barWidth * healthPercent, barHeight);
    }
}

// Японский штурмовик Накадзима
class Nakajima extends Enemy {
    constructor() {
        super('nakajima');
        
        const originalSize = SPRITE_SIZES.nakajima;
        const scale = 0.07;
        this.width = originalSize.width * scale;
        this.height = originalSize.height * scale;
        
        this.health = 3;
        this.maxHealth = 3;
        this.speed = 1.1;
        this.attackCooldown = 60;
        this.bombCooldown = 0;
        this.phase = 'approach';
        this.bulletsFired = 0; // Счетчик выпущенных пуль
        this.bulletInterval = 0;
        this.attackAngle = 0;
        this.rotation = 0;
        this.targetRotation = 0;
        
        console.log('🎌 Накадзима создан!', { width: this.width, height: this.height });
    }

    update() {
        if (this.isCrashing) {
            return super.update();
        }

        switch(this.phase) {
            case 'approach':
                this.x += this.speed;
                this.targetRotation = 0;
                if (this.x > CONFIG.CANVAS_WIDTH * 0.2) {
                    this.phase = 'dive';
                }
                break;
                
            case 'dive':
                this.x += this.speed * 1.2;
                this.y += 1.2;
                this.targetRotation = 0.2;
                
                if (gameState && gameState.player) {
                    this.attackAngle = Math.atan2(
                        gameState.player.y - this.y,
                        (gameState.player.x + 80) - this.x
                    );
                }
                
                if (this.y > 200 || this.x > CONFIG.CANVAS_WIDTH * 0.5) {
                    this.phase = 'mainAttack';
                    this.bulletsFired = 0;
                    this.bulletInterval = 0;
                }
                break;
                
            case 'mainAttack':
                this.x += this.speed;
                this.targetRotation = 0.1;
                
                this.bulletInterval--;
                if (this.bulletInterval <= 0 && this.bulletsFired < 7) {
                    this.fireMainBullets();
                    this.bulletsFired++;
                    this.bulletInterval = 12;
                }
                
                if (this.bulletsFired >= 7) {
                    this.phase = 'shotgunAttack';
                    this.bulletInterval = 10;
                }
                break;
                
            case 'shotgunAttack':
                this.x += this.speed;
                this.targetRotation = 0.05;
                
                this.bulletInterval--;
                if (this.bulletInterval <= 0 && this.bulletsFired < 10) {
                    this.fireShotgun();
                    this.bulletsFired++;
                    this.bulletInterval = 8;
                    
                    if (this.bulletsFired >= 10) {
                        this.phase = 'escape';
                    }
                }
                break;
                
            case 'escape':
                this.x += this.speed * 0.8;
                this.y -= 1.0;
                this.targetRotation = -0.15;
                break;
        }

        this.rotation += (this.targetRotation - this.rotation) * 0.1;

        // Сброс бомб во время основной атаки
        this.bombCooldown--;
        if (this.bombCooldown <= 0 && this.phase === 'mainAttack' && this.x < CONFIG.CANVAS_WIDTH * 0.7) {
            this.dropBomb();
            this.bombCooldown = 120;
        }

        if (this.x > CONFIG.CANVAS_WIDTH || this.y < -this.height) {
            return false;
        }

        return true;
    }

    fireMainBullets() {
        // 7 основных пуль как у немецкого штурмовика
        const baseAngle = this.attackAngle;
        const spread = 0.6; // Хаотичный разброс
        
        if (gameState && gameState.enemyProjectiles) {
            gameState.enemyProjectiles.push(new EnemyProjectile(
                this.x + this.width,
                this.y + this.height / 2,
                Math.cos(baseAngle + (Math.random() - 0.5) * spread) * 4.5,
                Math.sin(baseAngle + (Math.random() - 0.5) * spread) * 4.5,
                'bullet'
            ));
        }
    }

    fireShotgun() {
        // 3 дробовых выстрела в конце (как было раньше)
        if (gameState && gameState.enemyProjectiles) {
            const angle = Math.atan2(
                (gameState.player.y + gameState.player.height / 2) - this.y,
                (gameState.player.x + 50) - this.x
            );
            
            // Веер из 3 пуль с разбросом
            for (let i = 0; i < 3; i++) {
                const spreadAngle = angle + (i - 1) * 0.25; // Увеличил разброс
                gameState.enemyProjectiles.push(new EnemyProjectile(
                    this.x + this.width,
                    this.y + this.height / 2,
                    Math.cos(spreadAngle) * 4,
                    Math.sin(spreadAngle) * 4,
                    'bullet'
                ));
            }
        }
    }

    dropBomb() {
        if (gameState && gameState.enemyProjectiles) {
            gameState.enemyProjectiles.push(new EnemyProjectile(
                this.x + this.width / 2,
                this.y + this.height,
                0,
                2,
                'bomb'
            ));
        }
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        
        if (this.isCrashing) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.crashRotation);
            
            if (images && images.nakajima) {
                ctx.drawImage(images.nakajima, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                this.drawFallback('#d32f2f');
            }
        } else {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation);
            
            if (images && images.nakajima) {
                ctx.drawImage(images.nakajima, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                this.drawFallback('#d32f2f');
            }
            
            // Индикатор фазы атаки
            if (this.phase === 'shotgunAttack') {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
        
        if (this.showHealthBar && !this.isCrashing) {
            this.drawHealthBar();
        }
    }

    drawFallback(color) {
        ctx.fillStyle = color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Красный круг хиномару
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.arc(this.width / 2 - 15, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Индикатор боезапаса
        ctx.fillStyle = '#ffeb3b';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${10 - this.bulletsFired}/10`, 0, -this.height / 2 - 5);
        ctx.textAlign = 'left';
    }

    drawHealthBar() {
        if (!ctx) return;
        
        const barWidth = this.width;
        const barHeight = 4;
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(this.x, this.y - 8, barWidth * healthPercent, barHeight);
    }
}

// Японский бомбардировщик Мицубиси
class Mitsubishi extends Enemy {
    constructor() {
        super('mitsubishi');
        
        // Правильные размеры для спрайта 1259x502
        const originalSize = SPRITE_SIZES.mitsubishi;
        const scale = 0.06;
        this.width = originalSize.width * scale;
        this.height = originalSize.height * scale;
        
        this.health = 4;
        this.maxHealth = 4;
        this.speed = 0.9;
        this.bombCooldown = 0;
        this.bombCount = 0; // СЧЕТЧИК СБРОШЕННЫХ БОМБ
        this.maxBombs = 3 + Math.floor(Math.random() * 2); // 3-4 бомбы
        this.hasFinishedBombing = false;
        this.bombWaveCount = 0; // СЧЕТЧИК ВОЛН БОМБ
        this.maxBombWaves = 2; // МАКСИМУМ 2 ВОЛНЫ БОМБ
        
        console.log(`🎌 Мицубиси создан! Бомб: ${this.maxBombs}, Волн: ${this.maxBombWaves}`);
    }

    update() {
        if (this.isCrashing) {
            return super.update();
        }

        this.x += this.speed;
        this.bombCooldown--;

        // ЕСЛИ УЖЕ СБРОСИЛИ ВСЕ БОМБЫ - НЕ АТАКУЕМ
        if (this.hasFinishedBombing) {
            return true;
        }

        // СБРОС БОМБ ТОЛЬКО ЕСЛИ ЕЩЕ НЕ СБРОСИЛИ ВСЕ И НЕ ПРЕВЫСИЛИ ЛИМИТ ВОЛН
        if (this.bombCooldown <= 0 && this.x > CONFIG.CANVAS_WIDTH * 0.2 && 
            this.x < CONFIG.CANVAS_WIDTH * 0.8 && this.bombWaveCount < this.maxBombWaves) {
            this.dropBombWave();
            this.bombCooldown = 240; // 4 СЕКУНДЫ МЕЖДУ ВОЛНАМИ
            this.bombWaveCount++;
        }

        // ЕСЛИ СБРОСИЛИ ВСЕ ВОЛНЫ БОМБ - ПОМЕЧАЕМ ЧТО ЗАВЕРШИЛИ
        if (this.bombWaveCount >= this.maxBombWaves) {
            this.hasFinishedBombing = true;
            console.log('💣 Мицубиси завершил бомбардировку!');
        }

        if (gameState && gameState.friendlyFighters && gameState.friendlyFighters.length > 0) {
            this.attackFighters();
        }

        if (this.x > CONFIG.CANVAS_WIDTH) {
            return false;
        }

        return true;
    }

    dropBombWave() {
        if (!gameState || !gameState.enemyProjectiles) return;
        
        // УМЕНЬШАЕМ КОЛИЧЕСТВО БОМБ В ВОЛНЕ
        const bombCount = 2 + Math.floor(Math.random() * 2); // 2-3 бомбы за волну
        
        for (let i = 0; i < bombCount; i++) {
            const offsetX = (i - 1) * 20; // МЕНЬШЕ РАЗБРОС
            gameState.enemyProjectiles.push(new EnemyProjectile(
                this.x + this.width / 2 + offsetX,
                this.y + this.height,
                0,
                2 + Math.random() * 0.5,
                'bomb'
            ));
            
            this.bombCount++;
        }
        
        console.log(`💣 Мицубиси сбросил волну бомб ${this.bombWaveCount}/${this.maxBombWaves}. Всего бомб: ${this.bombCount}`);
    }

    attackFighters() {
        if (!gameState || !gameState.friendlyFighters) return;
        
        let closestFighter = null;
        let closestDistance = Infinity;

        for (const fighter of gameState.friendlyFighters) {
            const distance = Math.sqrt(
                Math.pow(this.x - fighter.x, 2) + Math.pow(this.y - fighter.y, 2)
            );
            if (distance < closestDistance && distance < 300) {
                closestDistance = distance;
                closestFighter = fighter;
            }
        }

        if (closestFighter && Math.random() < 0.02) {
            const angle = Math.atan2(
                closestFighter.y - this.y,
                closestFighter.x - this.x
            );
            
            gameState.enemyProjectiles.push(new EnemyProjectile(
                this.x + this.width / 2,
                this.y + this.height / 2,
                Math.cos(angle) * 3,
                Math.sin(angle) * 3,
                'bullet'
            ));
        }
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        
        if (this.isCrashing) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.crashRotation);
            
            if (images && images.mitsubishi) {
                ctx.drawImage(images.mitsubishi, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                this.drawFallback('#5d4037');
            }
        } else {
            if (images && images.mitsubishi) {
                ctx.drawImage(images.mitsubishi, this.x, this.y, this.width, this.height);
            } else {
                this.drawFallback('#5d4037');
            }
        }
        
        ctx.restore();
        
        if (this.showHealthBar && !this.isCrashing) {
            this.drawHealthBar();
        }
    }

    drawFallback(color) {
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Немецкий пикирующий бомбардировщик Мессершмитт
class Messerschmidt extends Enemy {
    constructor() {
        super('messerschmidt');
        
        const originalSize = SPRITE_SIZES.messerschmidt;
        const scale = 0.08;
        this.width = originalSize.width * scale;
        this.height = originalSize.height * scale;
        
        this.health = 6;
        this.maxHealth = 6;
        this.speed = 1.3;
        this.phase = 'approach';
        this.hasDroppedBomb = false;
        this.bombCount = 0;
        this.maxBombs = 1 + Math.floor(Math.random() * 2);
        this.attackCooldown = 0;
        this.aggressiveMode = false;
        this.targetFighter = null;
        
        // ПЛАВНЫЕ ПАРАМЕТРЫ ДВИЖЕНИЯ
        this.rotation = 0;
        this.targetRotation = 0;
        this.rotationSpeed = 0.05;
        this.diveProgress = 0;
        this.diveSpeed = 0.02;
        this.originalY = 0;
        this.diveStartX = 0;
        
        console.log('🇩🇪 Мессершмитт создан! Бомб: ' + this.maxBombs);
    }

    update() {
        if (this.isCrashing) {
            return super.update();
        }

        this.attackCooldown--;

        // ИСПРАВЛЕНИЕ: Проверяем, что targetFighter еще существует и жив
        if (this.targetFighter) {
            // Если истребитель уничтожен или вышел за границы - очищаем цель
            if (this.targetFighter.health <= 0 || 
                this.targetFighter.x < -this.targetFighter.width ||
                !gameState.friendlyFighters.includes(this.targetFighter)) {
                console.log('🎯 Мессершмитт: цель уничтожена, очищаем targetFighter');
                this.targetFighter = null;
            }
        }

        // Поиск новых советских истребителей только если нет текущей цели
        if (!this.targetFighter && gameState && gameState.friendlyFighters) {
            this.findFighterTarget();
        }

        // Атака истребителей только если цель существует и жива
        if (this.targetFighter && this.targetFighter.health > 0 && this.attackCooldown <= 0) {
            this.attackFighter();
            this.attackCooldown = 30;
        }

        // ПЛАВНОЕ ДВИЖЕНИЕ С НАКЛОНАМИ
        switch(this.phase) {
            case 'approach':
                this.x += this.speed;
                this.originalY = this.y;
                this.targetRotation = 0;
                
                if (this.x > CONFIG.CANVAS_WIDTH * 0.15) {
                    this.phase = 'targeting';
                    this.diveStartX = this.x;
                    console.log('🇩🇪 Мессершмитт начинает наведение...');
                }
                break;
                
            case 'targeting':
                this.x += this.speed * 0.8;
                
                // Плавное наведение на игрока
                const playerCenterX = gameState.player.x + gameState.player.width / 2;
                const deltaX = playerCenterX - (this.x + this.width / 2);
                this.x += deltaX * 0.015;
                
                // Мягкий наклон в сторону цели
                this.targetRotation = deltaX * 0.001;
                
                // СБРОС БОМБЫ ПЕРЕД ПИКИРОВАНИЕМ - целясь прямо в игрока
                if (!this.hasDroppedBomb && this.bombCount < this.maxBombs) {
                    const distanceToPlayer = Math.abs(playerCenterX - (this.x + this.width / 2));
                    const isGoodPosition = this.x > CONFIG.CANVAS_WIDTH * 0.2 && 
                                         this.x < CONFIG.CANVAS_WIDTH * 0.4;
                    
                    // Сбрасываем бомбу когда хорошо прицелились
                    if (distanceToPlayer < 60 && isGoodPosition) {
                        this.dropBombAtPlayer();
                        this.bombCount++;
                        if (this.bombCount >= this.maxBombs) {
                            this.hasDroppedBomb = true;
                        }
                        console.log('💣 Мессершмитт сбрасывает бомбу перед пикированием!');
                    }
                }
                
                if (this.x > CONFIG.CANVAS_WIDTH * 0.25) {
                    this.phase = 'dive';
                    this.diveProgress = 0;
                    console.log('🇩🇪 Мессершмитт начинает плавное пикирование!');
                }
                break;
                
            case 'dive':
                // ПЛАВНОЕ ПИКИРОВАНИЕ С ПРОГРЕССОМ
                this.diveProgress += this.diveSpeed;
                this.diveProgress = Math.min(this.diveProgress, 1);
                
                // Параболическое движение вперед-вниз
                const forwardSpeed = this.speed * (1.2 + this.diveProgress * 0.8);
                const downwardSpeed = 1.5 * this.diveProgress;
                
                this.x += forwardSpeed;
                this.y += downwardSpeed;
                
                // ПЛАВНЫЙ НАКЛОН ВНИЗ (от 0 до 0.4 радиан)
                this.targetRotation = 0.4 * this.diveProgress;
                
                // Только стрельба из пушек во время пикирования
                if (this.attackCooldown <= 0 && Math.random() < 0.1) {
                    this.shootAtPlayer();
                    this.attackCooldown = 20;
                }
                
                // Завершение пикирования
                if (this.diveProgress >= 1 || this.x > CONFIG.CANVAS_WIDTH * 0.7) {
                    this.phase = 'recovery';
                    console.log('🇩🇪 Мессершмитт выходит из пикирования!');
                }
                break;
                
            case 'recovery':
                // ПЛАВНЫЙ ВЫХОД ИЗ ПИКИРОВАНИЯ
                this.x += this.speed * 1.1;
                this.y -= 0.8;
                this.targetRotation = -0.2;
                
                // Возврат к горизонтальному полету
                if (this.y < this.originalY - 20) {
                    this.phase = 'aggressive';
                    this.aggressiveMode = true;
                    this.targetRotation = 0;
                    console.log('🇩🇪 Мессершмитт переходит в агрессивный режим!');
                }
                break;
                
            case 'aggressive':
                // Агрессивный полет с легкими покачиваниями
                this.x += this.speed * 1.1;
                
                // Легкие волнообразные движения
                const wave = Math.sin(Date.now() * 0.003) * 0.5;
                this.y += wave;
                this.y = Math.min(this.y, CONFIG.CANVAS_HEIGHT - 150);
                
                // Легкие наклоны в такт движениям
                this.targetRotation = wave * 0.1;
                
                // Стрельба по игроку
                if (this.attackCooldown <= 0 && Math.random() < 0.2) {
                    this.shootAtPlayer();
                    this.attackCooldown = 25;
                }
                
                // Попытка второго захода
                if (this.x > CONFIG.CANVAS_WIDTH * 0.6 && !this.hasDroppedBomb && this.bombCount < this.maxBombs) {
                    const playerX = gameState.player.x + gameState.player.width / 2;
                    const distance = Math.abs(playerX - (this.x + this.width / 2));
                    if (distance < 100) {
                        this.dropBombAtPlayer();
                        this.bombCount++;
                        if (this.bombCount >= this.maxBombs) {
                            this.hasDroppedBomb = true;
                        }
                    }
                }
                break;
        }

        // ПЛАВНОЕ ВРАЩЕНИЕ (интерполяция)
        this.rotation += (this.targetRotation - this.rotation) * this.rotationSpeed;

        if (this.x > CONFIG.CANVAS_WIDTH || this.y < -this.height) {
            return false;
        }

        return true;
    }

    // ИСПРАВЛЕННАЯ ФУНКЦИЯ АТАКИ ИСТРЕБИТЕЛЯ
    attackFighter() {
        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: убедимся, что цель все еще существует и жива
        if (!this.targetFighter || 
            this.targetFighter.health <= 0 || 
            !gameState.friendlyFighters.includes(this.targetFighter)) {
            console.log('🎯 Мессершмитт: цель исчезла, прекращаем атаку');
            this.targetFighter = null;
            return;
        }
        
        if (!gameState || !gameState.enemyProjectiles) return;
        
        const angle = Math.atan2(
            this.targetFighter.y - this.y,
            this.targetFighter.x - this.x
        );
        
        // Залп из 2 пуль по истребителю
        for (let i = 0; i < 2; i++) {
            const spreadAngle = angle + (i - 0.5) * 0.15;
            gameState.enemyProjectiles.push(new EnemyProjectile(
                this.x + this.width,
                this.y + this.height / 2,
                Math.cos(spreadAngle) * 5,
                Math.sin(spreadAngle) * 5,
                'bullet'
            ));
        }
        
        console.log('🔫 Мессершмитт атакует советский истребитель!');
    }

    findFighterTarget() {
        if (!gameState || !gameState.friendlyFighters) return;
        
        let closestFighter = null;
        let closestDistance = Infinity;

        for (const fighter of gameState.friendlyFighters) {
            // Пропускаем уничтоженные истребители
            if (fighter.health <= 0) continue;
            
            const distance = Math.sqrt(
                Math.pow(this.x - fighter.x, 2) + Math.pow(this.y - fighter.y, 2)
            );
            if (distance < closestDistance && distance < 250) {
                closestDistance = distance;
                closestFighter = fighter;
            }
        }

        this.targetFighter = closestFighter;
        if (closestFighter) {
            console.log('🎯 Мессершмитт нашел новую цель!');
        }
    }

    // Остальные методы без изменений...
    dropBombAtPlayer() {
        if (!gameState || !gameState.enemyProjectiles) return;
        
        const player = gameState.player;
        const playerCenterX = player.x + player.width / 2;
        
        // Прямой расчет - бомба летит прямо вниз к игроку
        const distanceX = playerCenterX - (this.x + this.width / 2);
        const horizontalSpeed = distanceX * 0.04;
        
        console.log('🎯 Мессершмитт целится бомбой прямо в игрока!');
        
        const bomb = new EnemyProjectile(
            this.x + this.width / 2,
            this.y + this.height,
            horizontalSpeed,
            2.8,
            'bomb'
        );
        
        bomb.isPrecise = true;
        bomb.trailColor = '#ff0000';
        bomb.isAimingShot = true;
        
        gameState.enemyProjectiles.push(bomb);
    }

    shootAtPlayer() {
        if (!gameState || !gameState.enemyProjectiles) return;
        
        const player = gameState.player;
        const angle = Math.atan2(
            player.y - this.y,
            player.x - this.x
        );
        
        gameState.enemyProjectiles.push(new EnemyProjectile(
            this.x + this.width,
            this.y + this.height / 2,
            Math.cos(angle) * 4.5,
            Math.sin(angle) * 4.5,
            'bullet'
        ));
        
        console.log('🔫 Мессершмитт стреляет по игроку!');
    }

    findFighterTarget() {
        if (!gameState || !gameState.friendlyFighters) return;
        
        let closestFighter = null;
        let closestDistance = Infinity;

        for (const fighter of gameState.friendlyFighters) {
            const distance = Math.sqrt(
                Math.pow(this.x - fighter.x, 2) + Math.pow(this.y - fighter.y, 2)
            );
            if (distance < closestDistance && distance < 250) {
                closestDistance = distance;
                closestFighter = fighter;
            }
        }

        this.targetFighter = closestFighter;
    }

    attackFighter() {
        if (!this.targetFighter || !gameState || !gameState.enemyProjectiles) return;
        
        const angle = Math.atan2(
            this.targetFighter.y - this.y,
            this.targetFighter.x - this.x
        );
        
        // Залп из 2 пуль по истребителю
        for (let i = 0; i < 2; i++) {
            const spreadAngle = angle + (i - 0.5) * 0.15;
            gameState.enemyProjectiles.push(new EnemyProjectile(
                this.x + this.width,
                this.y + this.height / 2,
                Math.cos(spreadAngle) * 5,
                Math.sin(spreadAngle) * 5,
                'bullet'
            ));
        }
        
        console.log('🔫 Мессершмитт атакует советский истребитель!');
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        
        if (this.isCrashing) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.crashRotation);
            
            if (images && images.messerschmidt) {
                ctx.drawImage(images.messerschmidt, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                this.drawFallback();
            }
        } else {
            // ПЛАВНЫЙ НАКЛОН С ИНТЕРПОЛЯЦИЕЙ
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation);
            
            if (images && images.messerschmidt) {
                ctx.drawImage(images.messerschmidt, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                this.drawFallback();
            }
            
            // Индикатор агрессивного режима
            if (this.aggressiveMode) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
        
        if (this.showHealthBar && !this.isCrashing) {
            this.drawHealthBar();
        }
    }

    drawFallback() {
        // Фолбэк с крестами люфтваффе
        ctx.fillStyle = '#795548';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Черные кресты
        ctx.fillStyle = '#000000';
        ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + this.height / 2 - 2, 15, 4);
        ctx.fillRect(-this.width / 2 + 10, -this.height / 2 + this.height / 2 - 7, 4, 14);
        
        // Индикатор бомб
        ctx.fillStyle = '#ff0000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`💣${this.maxBombs - this.bombCount}`, 0, -this.height / 2 - 8);
        ctx.textAlign = 'left';
    }

    drawHealthBar() {
        if (!ctx) return;
        
        const barWidth = this.width;
        const barHeight = 4;
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
        ctx.fillStyle = this.aggressiveMode ? '#ff6d00' : '#4caf50';
        ctx.fillRect(this.x, this.y - 8, barWidth * healthPercent, barHeight);
        
        // Индикатор бомб
        if (this.bombCount < this.maxBombs) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(`💣×${this.maxBombs - this.bombCount}`, this.x, this.y - 15);
        }
    }
}

class YamatoBoss {
    constructor() {
        this.type = 'yamato';
        this.width = 600;
        this.height = 160;
        this.x = -this.width;
        this.y = CONFIG.CANVAS_HEIGHT - 210;
        this.speed = (CONFIG.CANVAS_WIDTH + this.width) / 12000;
        this.totalTime = 12000;
        this.elapsedTime = 0;
        
        // АТАКИ КАЖДЫЕ 3 СЕКУНДЫ
        this.attackCooldowns = {
            fighters: 180,
            kamikaze: 180,  
            cannons: 180,
            antiAir: 120
        };
        
        this.attackPattern = ['fighters', 'kamikaze', 'cannons', 'antiAir'];
        this.currentAttackIndex = 0;
        this.attackTimer = 60;
        
        // СИСТЕМА ПВО - ПУЛЕМЕТНЫЕ ОЧЕРЕДИ
        this.antiAirCooldown = 0;
        this.antiAirInterval = 45;
        this.aaGuns = [
            { x: 0.15, y: 0.3, active: true, burstCount: 0 },
            { x: 0.35, y: 0.4, active: true, burstCount: 0 },
            { x: 0.65, y: 0.4, active: true, burstCount: 0 },
            { x: 0.85, y: 0.35, active: true, burstCount: 0 }
        ];
        this.currentBurstGun = 0;
        this.burstTimer = 0;
        this.isBursting = false;
        this.burstTarget = null;
        
        this.weatherActive = false;
        this.weatherTimer = 0;
        this.sakuraParticles = [];
        this.cannonZones = [];
        this.hasStarted = true;
        
        // ЭФФЕКТ РЯБИ ОТ ЛИНКОРА
        this.wakeParticles = [];
        this.wakeTimer = 0;
        this.maxWakeParticles = 15;
        
        // ФАНТОМНЫЙ - НЕУЯЗВИМЫЙ
        this.isInvulnerable = true;
        this.health = Infinity;

        this.attackPattern = ['fighters', 'kamikaze', 'cannons', 'antiAir', 'bouncingMines'];
        this.bouncingMines = []; // Массив активных мин
        
        this.sakuraAuras = new Map();
        this.sakuraAuraActive = false;
        this.sakuraWeatherDuration = 900; // 15 секунд (60 FPS * 15)
        this.sakuraWeatherTimer = 0;
        this.originalEnemySpeeds = new Map(); // Сохраняем оригинальные скорости
        this.dodgeChance = 0.2; // 20% шанс уклонения

        console.log('🎌 Ямато вступил в битву! 200 секунд до победы!');
    }

    takeDamage() {
        return false;
    }

    update() {
        this.elapsedTime++;
        this.x += this.speed;
        
        if (gameState && gameState.infiniteWar) {
            if (this.elapsedTime >= this.totalTime) {
                this.victory();
                return false;
            }
        } else {
            if (this.elapsedTime >= this.totalTime) {
                this.victory();
                return false;
            }
        }

        this.updateWeather();
        this.updateAttacks();
        this.updateAntiAirDefense();
        this.updateEffects();
        this.updateBouncingMines();
        
        return true;
    }

    updateWeather() {
        const secondsPassed = Math.floor(this.elapsedTime / 60);
        
        if ((secondsPassed === 0 || secondsPassed === 100) && 
            !this.weatherActive && this.weatherTimer === 0) {
            this.activateSakuraStorm();
        }
        
        if (this.weatherActive) {
            this.weatherTimer--;
            if (this.weatherTimer <= 0) {
                this.weatherActive = false;
            }
        }
    }

    // Новая атака - прыгучие мины
    executeBouncingMinesAttack() {
        console.log('💣 Ямато запускает прыгучие мины!');
        
        const mineCount = 3 + Math.floor(Math.random() * 5); // 3-7 мин (увеличено)
        
        for (let i = 0; i < mineCount; i++) {
            setTimeout(() => {
                if (gameState && gameState.gameActive) {
                    this.launchBouncingMine();
                }
            }, i * 1000); // ПЕРЕРЫВ 1 СЕКУНДА МЕЖДУ МИНАМИ (было 400ms)
        }
    }

    launchBouncingMine() {
        // Стартовая позиция - из центра Ямато
        const startX = this.x + this.width / 2;
        const startY = this.y + 30;
        
        // СЛУЧАЙНАЯ ЦЕЛЬ ПО ВСЕЙ КАРТЕ (но не за пределами)
        const minX = 100; // Отступ от левого края
        const maxX = CONFIG.CANVAS_WIDTH - 100; // Отступ от правого края
        
        // Случайная цель где угодно на карте (включая область позади Ямато)
        const targetX = minX + Math.random() * (maxX - minX);
        
        const mine = new BouncingMine(startX, startY, targetX);
        this.bouncingMines.push(mine);
        
        console.log(`💣 Запущена мина ${this.bouncingMines.length} к цели X: ${Math.round(targetX)} (Ямато: ${Math.round(this.x)})`);
    }
    updateBouncingMines() {
        for (let i = this.bouncingMines.length - 1; i >= 0; i--) {
            const mine = this.bouncingMines[i];
            if (!mine.update()) {
                this.bouncingMines.splice(i, 1);
                console.log('💣 Мина удалена из игры');
            }
        }
    }

    updateAntiAirDefense() {
        if (this.isBursting) {
            this.burstTimer--;
            if (this.burstTimer <= 0) {
                this.fireBurstShot();
            }
            return;
        }

        this.antiAirCooldown--;
        
        if (this.antiAirCooldown <= 0 && gameState && gameState.friendlyFighters) {
            const activeFighters = gameState.friendlyFighters.filter(fighter => 
                fighter && fighter.health > 0
            );
            
            if (activeFighters.length > 0) {
                this.startBurstAttack(activeFighters);
                this.antiAirCooldown = this.antiAirInterval;
            }
        }
    }

    startBurstAttack(fighters) {
        this.burstTarget = this.selectBestTarget(fighters);
        if (!this.burstTarget) return;

        this.currentBurstGun = (this.currentBurstGun + 1) % this.aaGuns.length;
        const gun = this.aaGuns[this.currentBurstGun];
        
        if (!gun.active) return;

        this.isBursting = true;
        gun.burstCount = 3 + Math.floor(Math.random() * 3);
        this.burstTimer = 3;
    }

    selectBestTarget(fighters) {
        let bestTarget = null;
        let bestScore = -Infinity;

        for (const fighter of fighters) {
            if (!fighter || fighter.health <= 0) continue;

            const score = this.calculateTargetScore(fighter);
            if (score > bestScore) {
                bestScore = score;
                bestTarget = fighter;
            }
        }

        return bestTarget;
    }

    calculateTargetScore(fighter) {
        let score = 0;
        
        const distanceToYamato = Math.abs(fighter.x - (this.x + this.width / 2));
        score += (1000 - distanceToYamato) * 0.5;
        
        const predictability = this.calculatePredictability(fighter);
        score += predictability * 2;
        
        const attackAngle = Math.atan2(
            fighter.y - (this.y + this.height / 2),
            fighter.x - (this.x + this.width / 2)
        );
        const angleScore = Math.abs(attackAngle) > 1 ? 100 : 0;
        score += angleScore;
        
        if (fighter.health < fighter.maxHealth / 2) {
            score += 200;
        }
        
        return score;
    }

    calculatePredictability(fighter) {
        let predictability = 50;
        
        if (fighter.targetRotation !== undefined) {
            const maneuverIntensity = Math.abs(fighter.targetRotation - fighter.rotation);
            predictability -= maneuverIntensity * 100;
        }
        
        const distance = Math.sqrt(
            Math.pow(fighter.x - (this.x + this.width / 2), 2) +
            Math.pow(fighter.y - (this.y + this.height / 2), 2)
        );
        
        if (distance < 300) {
            predictability += 50;
        } else {
            predictability += 100;
        }
        
        return Math.max(0, predictability);
    }

    fireBurstShot() {
        if (!this.burstTarget || this.burstTarget.health <= 0) {
            this.isBursting = false;
            return;
        }

        const gun = this.aaGuns[this.currentBurstGun];
        if (gun.burstCount <= 0) {
            this.isBursting = false;
            return;
        }

        const bulletStartX = this.x + (gun.x * this.width);
        const bulletStartY = this.y + (gun.y * this.height);

        const predictedPos = this.predictTargetPosition(this.burstTarget, 0.3);
        
        const dx = predictedPos.x - bulletStartX;
        const dy = predictedPos.y - bulletStartY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) {
            gun.burstCount--;
            this.burstTimer = 2;
            return;
        }
        
        const speed = 15;
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;

        const aaBullet = new YamatoAABullet(bulletStartX, bulletStartY, vx, vy, this.burstTarget);

        if (gameState && gameState.enemyProjectiles) {
            gameState.enemyProjectiles.push(aaBullet);
        }

        // УПРОЩЕННЫЙ ЭФФЕКТ ВЫСТРЕЛА - БЕЗ ВЗРЫВА
        this.createMuzzleFlash(bulletStartX, bulletStartY);

        if (gun.burstCount === 3 && typeof playPlayerShoot === 'function') {
            playPlayerShoot('piercing');
        }

        gun.burstCount--;
        this.burstTimer = 2 + Math.random() * 2;
    }

    predictTargetPosition(target, timeAhead) {
        let predictedX = target.x;
        let predictedY = target.y;
        
        if (target.vx !== undefined && target.vy !== undefined) {
            predictedX += target.vx * timeAhead * 60;
            predictedY += target.vy * timeAhead * 60;
        } else {
            const speed = target.speed || 2.8;
            const angle = target.rotation || 0;
            predictedX += Math.cos(angle) * speed * timeAhead * 60;
            predictedY += Math.sin(angle) * speed * timeAhead * 60;
        }
        
        if (target.targetUFO) {
            predictedX += (target.targetUFO.x - target.x) * 0.1;
            predictedY += (target.targetUFO.y - target.y) * 0.1;
        }
        
        predictedX = Math.max(0, Math.min(predictedX, CONFIG.CANVAS_WIDTH - (target.width || 60)));
        predictedY = Math.max(50, Math.min(predictedY, CONFIG.CANVAS_HEIGHT - 150));
        
        return { x: predictedX, y: predictedY };
    }

    updateAttacks() {
        this.attackTimer--;
        
        if (this.attackTimer <= 0) {
            this.executeNextAttack();
            this.attackTimer = 180;
        }
    }

    executeNextAttack() {
        const attackType = this.attackPattern[this.currentAttackIndex];
        
        switch(attackType) {
            case 'fighters':
                this.launchFighters();
                break;
            case 'kamikaze':
                this.launchKamikaze();
                break;
            case 'cannons':
                this.fireCannons();
                break;
            case 'antiAir':
                this.enhanceAntiAir();
                break;
            case 'bouncingMines': // НОВАЯ АТАКА
                this.executeBouncingMinesAttack();
                break;
        }
        
        this.currentAttackIndex = (this.currentAttackIndex + 1) % this.attackPattern.length;
    }

    enhanceAntiAir() {
        this.antiAirInterval = Math.max(30, this.antiAirInterval - 20);
        this.aaGuns.forEach(gun => gun.active = true);
        this.createDefenseBoostEffect();
    }

    createDefenseBoostEffect() {
        this.aaGuns.forEach(gun => {
            const gunX = this.x + (gun.x * this.width);
            const gunY = this.y + (gun.y * this.height);
            
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (gameState && gameState.explosions) {
                        const boostFlash = new Explosion(gunX, gunY, 25);
                        boostFlash.life = 0.5;
                        gameState.explosions.push(boostFlash);
                    }
                }, i * 200);
            }
        });
        
        screenShake = 5;
    }

    getAttackName(attackType) {
        const names = {
            fighters: 'Стая истребителей',
            kamikaze: 'Камикадзе со всех сторон', 
            cannons: 'Корабельные орудия',
            antiAir: 'Усиление ПВО',
            bouncingMines: 'Прыгучие мины'
        };
        return names[attackType] || attackType;
    }

    activateSakuraStorm() {
        this.weatherActive = true;
        this.weatherTimer = 900;
        this.sakuraAuraActive = true;
        this.sakuraWeatherTimer = this.sakuraWeatherDuration;
        
        console.log('🌸 Начинается буря сакуры! +30% скорости, +60% скорости камикадзе, 20% уклонения');
        
        // Активируем эффекты для всех существующих врагов
        if (gameState && gameState.enemies) {
            gameState.enemies.forEach(enemy => {
                this.applySakuraBuffToEnemy(enemy);
            });
        }
        
        if (typeof playSakuraFall === 'function') {
            playSakuraFall();
        }
        
        for (let i = 0; i < 15; i++) {
            this.createSakuraParticle();
        }
    }

    applySakuraBuffToEnemy(enemy) {
        if (!enemy || enemy.health <= 0 || enemy.isCrashing) return;
        
        // Сохраняем оригинальную скорость
        if (!this.originalEnemySpeeds.has(enemy)) {
            this.originalEnemySpeeds.set(enemy, enemy.speed);
        }
        
        // Увеличиваем скорость
        let speedMultiplier = 1.3; // +30% для всех
        
        // Особый бонус для камикадзе
        if (enemy.type === 'kamikaze') {
            speedMultiplier = 1.6; // +60% для камикадзе
            console.log(`⚡ Камикадзе ускорился на 60%! Новая скорость: ${(enemy.speed * speedMultiplier).toFixed(2)}`);
        }
        
        enemy.speed = this.originalEnemySpeeds.get(enemy) * speedMultiplier;
        
        // Добавляем визуальный эффект
        this.addSakuraAuraToEnemy(enemy);
    }
    
    removeSakuraBuffFromEnemy(enemy) {
        if (!enemy) return;
        
        // Восстанавливаем оригинальную скорость
        const originalSpeed = this.originalEnemySpeeds.get(enemy);
        if (originalSpeed !== undefined) {
            enemy.speed = originalSpeed;
            this.originalEnemySpeeds.delete(enemy);
        }
        
        // Удаляем визуальный эффект
        this.removeSakuraAuraFromEnemy(enemy);
    }
    
    // Проверка уклонения для врагов
    checkDodge(enemy, projectile) {
        if (!this.sakuraAuraActive || !enemy || !projectile) return false;
        
        // 20% шанс уклонения только для врагов с эффектом сакуры
        if (Math.random() < this.dodgeChance) {
            console.log(`🎯 ${enemy.type} уклонился от снаряда благодаря сакуре!`);
            this.createDodgeEffect(enemy, projectile);
            return true;
        }
        return false;
    }

    createDodgeEffect(enemy, projectile) {
        if (!gameState) return;
        
        // Устанавливаем флаг уклонения у врага
        enemy.dodgeEffect = true;
        
        const dodgeFlash = {
            enemy: enemy,
            timer: 10,
            update: function() {
                this.timer--;
                if (this.timer <= 0) {
                    this.enemy.dodgeEffect = false; // Снимаем эффект
                    return false;
                }
                return true;
            },
            draw: function() {
                // Дополнительные визуальные эффекты можно добавить здесь
            }
        };
        
        if (!gameState.dodgeEffects) gameState.dodgeEffects = [];
        gameState.dodgeEffects.push(dodgeFlash);
        
        // Эффект "промаха" на месте снаряда
        if (gameState.explosions) {
            const missEffect = new Explosion(
                projectile.x + projectile.width / 2,
                projectile.y + projectile.height / 2,
                15
            );
            missEffect.life = 0.2;
            missEffect.color = 'rgba(255, 182, 193, 0.7)'; // Розовый цвет сакуры
            gameState.explosions.push(missEffect);
        }
    }

    addSakuraAuraToEnemy(enemy) {
        if (!enemy || enemy.health <= 0 || enemy.isCrashing) return;
        
        let aura = this.sakuraAuras.get(enemy);
        if (!aura) {
            aura = new SakuraAura(enemy);
            this.sakuraAuras.set(enemy, aura);
        }
        aura.activate();
    }
    
    removeSakuraAuraFromEnemy(enemy) {
        const aura = this.sakuraAuras.get(enemy);
        if (aura) {
            aura.deactivate();
        }
    }

    createSakuraParticle() {
        const sakura = {
            x: -50,
            y: Math.random() * 400,
            vx: 2 + Math.random() * 2,
            vy: 1 + Math.random() * 2,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            scale: 0.1 + Math.random() * 0.1,
            life: 180 + Math.random() * 60,
            maxLife: 240,
            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                this.rotation += this.rotationSpeed;
                this.life--;
                return this.life > 0 && this.x < CONFIG.CANVAS_WIDTH + 50;
            },
            draw: function() {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.scale(this.scale, this.scale);
                ctx.globalAlpha = alpha;
                
                if (images.sakura) {
                    ctx.drawImage(images.sakura, -50, -50, 100, 100);
                } else {
                    ctx.fillStyle = `rgba(255, 182, 193, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(0, 0, 40, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            }
        };
        
        this.sakuraParticles.push(sakura);
    }

    launchFighters() {
        if (typeof playYamatoSignal === 'function') {
            playYamatoSignal();
        }
        
        const count = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (gameState && gameState.gameActive) {
                    const fighter = new Nakajima();
                    fighter.x = -fighter.width;
                    fighter.y = 100 + Math.random() * 250;
                    fighter.speed *= this.weatherActive ? 1.3 : 1.0;
                    gameState.enemies.push(fighter);
                }
            }, i * 750);
        }
    }

    launchKamikaze() {
        const count = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (gameState && gameState.gameActive) {
                    const kamikaze = new Kamikaze();
                    
                    const side = Math.floor(Math.random() * 3);
                    switch(side) {
                        case 0:
                            kamikaze.x = -kamikaze.width;
                            kamikaze.y = 80 + Math.random() * 250;
                            break;
                        case 1:
                            kamikaze.x = CONFIG.CANVAS_WIDTH + kamikaze.width;
                            kamikaze.y = 80 + Math.random() * 250;
                            kamikaze.speed *= -1;
                            break;
                        case 2:
                            kamikaze.x = Math.random() * CONFIG.CANVAS_WIDTH;
                            kamikaze.y = -kamikaze.height;
                            break;
                    }
                    
                    kamikaze.speed *= this.weatherActive ? 1.2 : 1.0;
                    kamikaze.health = 2;
                    gameState.enemies.push(kamikaze);
                }
            }, i * 300);
        }
    }

    fireCannons() {
        if (typeof playYamatoCannonsShoot === 'function') {
            playYamatoCannonsShoot();
        }
        
        const zoneWidth = 100;
        const zoneSpacing = 30;
        const startX = 150 + Math.random() * (CONFIG.CANVAS_WIDTH - 450);
        
        for (let i = 0; i < 3; i++) {
            const cannonZone = {
                x: startX + i * (zoneWidth + zoneSpacing),
                y: CONFIG.CANVAS_HEIGHT - 180,
                width: zoneWidth,
                height: 250,
                timer: 90,
                exploded: false,
                update: function() {
                    this.timer--;
                    if (this.timer <= 0 && !this.exploded) {
                        this.explode();
                        return false;
                    }
                    return true;
                },
                explode: function() {
                    this.exploded = true;
                    
                    if (typeof playYamatoBombBoom === 'function') {
                        playYamatoBombBoom();
                    }
                    
                    gameState.explosions.push(new Explosion(
                        this.x + this.width / 2,
                        this.y + this.height / 2,
                        60
                    ));
                    
                    if (gameState && gameState.player) {
                        const player = gameState.player;
                        if (this.x < player.x + player.width &&
                            this.x + this.width > player.x &&
                            this.y < player.y + player.height &&
                            this.y + this.height > player.y) {
                            player.health = Math.max(0, player.health - 1);
                        }
                    }
                    
                    screenShake = 10;
                    return false;
                },
                draw: function() {
                    if (!this.exploded) {
                        const alpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
                        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.4})`;
                        ctx.fillRect(this.x, this.y, this.width, this.height);
                        
                        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
                        ctx.lineWidth = 4;
                        ctx.strokeRect(this.x, this.y, this.width, this.height);
                        
                        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                        ctx.font = 'bold 24px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('!', this.x + this.width / 2, this.y + this.height / 2);
                        ctx.textAlign = 'left';
                    }
                }
            };
            
            this.cannonZones.push(cannonZone);
        }
    }

    // ИСПРАВЛЕННЫЙ МЕТОД: ПРОСТАЯ ВСПЫШКА БЕЗ ВЗРЫВА
    createMuzzleFlash(x, y) {
        // ОЧЕНЬ ПРОСТАЯ ВСПЫШКА ИЛИ ВООБЩЕ НИЧЕГО
        if (gameState && gameState.explosions) {
            const flash = {
                x: x,
                y: y,
                size: 4, // Очень маленький
                life: 0.1, // Очень короткий
                update: function() {
                    this.life -= 0.05;
                    return this.life > 0;
                },
                draw: function() {
                    const alpha = this.life / 0.1;
                    // Простая желтая точка
                    ctx.fillStyle = `rgba(255, 255, 100, ${alpha * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            gameState.explosions.push(flash);
        }
    }

    updateEffects() {
        for (let i = this.sakuraParticles.length - 1; i >= 0; i--) {
            if (!this.sakuraParticles[i].update()) {
                this.sakuraParticles.splice(i, 1);
            }
        }
        
        if (this.weatherActive && Math.random() < 0.3) {
            this.createSakuraParticle();
        }

        for (let i = this.cannonZones.length - 1; i >= 0; i--) {
            if (!this.cannonZones[i].update()) {
                this.cannonZones.splice(i, 1);
            }
        }

        // Обновляем таймер погоды сакуры
        if (this.sakuraWeatherTimer > 0) {
            this.sakuraWeatherTimer--;
            
            // Плавное отключение за последнюю секунду
            if (this.sakuraWeatherTimer <= 60 && this.sakuraAuraActive) {
                this.startSakuraFadeOut();
            }
            
            // Полное отключение при завершении
            if (this.sakuraWeatherTimer <= 0) {
                this.deactivateSakuraStorm();
            }
        }
        
        // Обновляем эффекты сакуры вокруг врагов
        if (this.sakuraAuraActive) {
            // Добавляем эффекты новым врагам
            if (gameState && gameState.enemies) {
                gameState.enemies.forEach(enemy => {
                    if (!this.sakuraAuras.has(enemy) && !enemy.isCrashing && enemy.health > 0) {
                        this.applySakuraBuffToEnemy(enemy);
                    }
                });
            }
        }
        
        // Обновляем и удаляем неактивные эффекты
        for (let [enemy, aura] of this.sakuraAuras.entries()) {
            if (!aura.update()) {
                this.sakuraAuras.delete(enemy);
            }
        }
        
        // Плавное отключение эффектов при завершении погоды
        if (!this.weatherActive && this.sakuraAuraActive) {
            this.sakuraAuraActive = false;
            for (let [enemy, aura] of this.sakuraAuras.entries()) {
                aura.deactivate();
            }
        }
    }

    startSakuraFadeOut() {
        console.log('🌸 Буря сакуры заканчивается... Эффекты исчезнут через 1 секунду');
        
        // Запускаем плавное исчезновение всех эффектов
        for (let [enemy, aura] of this.sakuraAuras.entries()) {
            aura.startFadeOut();
        }
    }
    
    deactivateSakuraStorm() {
        console.log('🌸 Буря сакуры закончилась! Эффекты сняты.');
        
        this.sakuraAuraActive = false;
        
        // Убираем баффы со всех врагов
        if (gameState && gameState.enemies) {
            gameState.enemies.forEach(enemy => {
                this.removeSakuraBuffFromEnemy(enemy);
            });
        }
        
        // Ускоряем исчезновение цветов сакуры
        if (gameState && gameState.sakuraFlowers) {
            gameState.sakuraFlowers.forEach(flower => {
                if (flower) {
                    flower.life = Math.min(flower.life, 0.3); // Быстро исчезают
                }
            });
        }
        
        // Очищаем сохраненные скорости
        this.originalEnemySpeeds.clear();
    }

    victory() {
        if (gameState && gameState.infiniteWar) {
            console.log('🎉 Ямато уплыл! Возобновляем бесконечную войну.');
            gameState.infiniteWar.cleanupBoss();
            
            gameState.details += 50;
            if (typeof updateDetailsUI === 'function') {
                updateDetailsUI();
            }
        } else {
            console.log('🎉 Уровень 10 пройден! Ямато уничтожен!');
            if (gameState) {
                gameState.gameActive = false;
                setTimeout(() => levelComplete(), 2000);
            }
        }
    }

    draw() {
        if (images.yamato) {
            ctx.drawImage(images.yamato, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(this.x + 20, this.y - 30, this.width - 40, 30);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('ЯМАТО', this.x + 40, this.y + 40);
        }

        // Отрисовываем эффекты сакуры вокруг врагов
        for (let [enemy, aura] of this.sakuraAuras.entries()) {
            if (enemy && enemy.health > 0 && !enemy.isCrashing) {
                aura.draw();
            }
        }

        this.sakuraParticles.forEach(sakura => sakura.draw());
        this.cannonZones.forEach(zone => zone.draw());
        this.bouncingMines.forEach(mine => mine.draw());

        this.drawTimer();
    }

    drawTimer() {
        const secondsLeft = Math.max(0, Math.floor((this.totalTime - this.elapsedTime) / 60));
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(CONFIG.CANVAS_WIDTH / 2 - 70, 20, 140, 50);
        
        ctx.strokeStyle = '#ff6d00';
        ctx.lineWidth = 3;
        ctx.strokeRect(CONFIG.CANVAS_WIDTH / 2 - 70, 20, 140, 50);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${secondsLeft} сек`, CONFIG.CANVAS_WIDTH / 2, 55);
        ctx.textAlign = 'left';
        
        const progress = (this.totalTime - this.elapsedTime) / this.totalTime;
        ctx.fillStyle = progress > 0.5 ? '#4caf50' : progress > 0.2 ? '#ffeb3b' : '#ff4444';
        ctx.fillRect(CONFIG.CANVAS_WIDTH / 2 - 60, 65, 120 * progress, 6);
    }
}

// НОВЫЙ КЛАСС: СНАРЯД ПВО
class YamatoAABullet {
    constructor(x, y, vx, vy, target) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.target = target;
        this.width = 3;
        this.height = 8;
        this.type = 'yamatoAA';
        this.trail = [];
        this.maxTrailLength = 4;
        this.lifeTime = 90;
        
        // ПРОВЕРКА НАЧАЛЬНОЙ ПОЗИЦИИ
        if (this.x < 0 || this.x > CONFIG.CANVAS_WIDTH) {
            console.log('⚠️ Снаряд ПВО создан вне экрана:', this.x);
            this.lifeTime = 0; // Немедленно удаляем
        }
    }

    update() {
        // БЫСТРАЯ ПРОВЕРКА ДЛЯ СНАРЯДОВ ВНЕ ЭКРАНА
        if (this.x < -100 || this.x > CONFIG.CANVAS_WIDTH + 100 || 
            this.y < -100 || this.y > CONFIG.CANVAS_HEIGHT + 100) {
            return false;
        }

        if (!gameState || !gameState.gameActive) return false;
        
        // ФИКСИРОВАННАЯ ТРАЕКТОРИЯ
        this.x += this.vx;
        this.y += this.vy;
        
        this.lifeTime--;
        
        // СЛЕД ТОЛЬКО ДЛЯ ВИДИМЫХ СНАРЯДОВ
        if (this.x >= 0 && this.x <= CONFIG.CANVAS_WIDTH && 
            this.y >= 0 && this.y <= CONFIG.CANVAS_HEIGHT) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }

        // ПРОВЕРКА СТОЛКНОВЕНИЯ
        if (this.target && this.target.health > 0) {
            if (this.checkCollision(this.target)) {
                this.hitTarget();
                return false;
            }
        }

        // ПРОВЕРКА ГРАНИЦ И ВРЕМЕНИ ЖИЗНИ
        if (this.lifeTime <= 0 || 
            this.y < -this.height || this.y > CONFIG.CANVAS_HEIGHT ||
            this.x < -this.width || this.x > CONFIG.CANVAS_WIDTH) {
            return false;
        }
        
        return true;
    }

    checkCollision(target) {
        return this.x < target.x + target.width &&
               this.x + this.width > target.x &&
               this.y < target.y + target.height &&
               this.y + this.height > target.y;
    }

    hitTarget() {
        console.log('🎯 Снаряд ПВО Ямато попал в цель!');
        
        // ПРОВЕРКА ЧТО ЦЕЛЬ ЕЩЕ СУЩЕСТВУЕТ
        if (!this.target || this.target.health === undefined) {
            console.warn('⚠️ Цель для попадания не существует');
            return false;
        }
        
        // НАНОСИМ УРОН И ПРОВЕРЯЕМ РЕЗУЛЬТАТ
        const isDestroyed = this.target.takeDamage(1);
        
        if (isDestroyed) {
            console.log('💥 Истребитель сбит ПВО Ямато!');
        } else {
            console.log(`🎯 Истребитель получил урон. Осталось здоровья: ${this.target.health}`);
        }
        
        // Эффект попадания
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                20
            ));
        }
        
        return false;
    }

    draw() {
        if (!ctx) return;
        
        // СЛЕД (короткий)
        this.trail.forEach((point, index) => {
            const alpha = index / this.trail.length * 0.6;
            const size = (index / this.trail.length) * 1 + 0.5;
            
            ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
            ctx.lineWidth = size;
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            if (index > 0) {
                const prevPoint = this.trail[index - 1];
                ctx.lineTo(prevPoint.x, prevPoint.y);
            }
            ctx.stroke();
        });
        
        // СНАРЯД
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Поворот по направлению
        const angle = Math.atan2(this.vy, this.vx);
        ctx.rotate(angle);
        
        // Красный снаряд
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Яркий нос
        ctx.fillStyle = '#ff8888';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, 3);
        
        ctx.restore();
    }
}

// boss.js - добавляем после класса YamatoAABullet

// Прыгучая морская мина Ямато
class BouncingMine {
    constructor(x, y, targetX) {
        this.x = x;
        this.y = y;
        this.width = 70; 
        this.height = 70;
        this.type = 'bouncingMine';
        
        // Физика прыжка - УМЕНЬШЕНА СКОРОСТЬ В 3 РАЗА
        this.targetX = targetX;
        
        // РАСЧЕТ СКОРОСТИ ДЛЯ ЛЮБОГО НАПРАВЛЕНИЯ (вперед или назад)
        const horizontalDistance = this.targetX - x;
        const flightTime = 1.5 + Math.random() * 1.0; // Время полета до цели
        
        this.speedX = horizontalDistance / (flightTime * 60); // Скорость по X
        this.speedY = -3 - Math.random() * 2; // Начальная скорость по Y
        this.gravity = 0.1; // УМЕНЬШЕНА ГРАВИТАЦИЯ В 3 РАЗА
        
        this.bounceDamping = 1.0;
        this.minBounceSpeed = 0.6;
        
        // Состояния
        this.state = 'flying';
        this.bounceCount = 0;
        this.maxBounces = 2 + Math.floor(Math.random() * 2);
        this.settleTimer = 0;
        this.settleDuration = 240;
        this.explosionSize = 80;
        this.damageRadius = 100;
        
        // Анимация
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.wobble = 0;
        this.wobbleSpeed = 0.05 + Math.random() * 0.03;
        
        // Визуальные эффекты предупреждения
        this.warningStartTime = 120;
        this.warningFlash = false;
        this.flashTimer = 0;
        
        this.groundLevel = CONFIG.CANVAS_HEIGHT - 50;
        
        console.log('💣 Создана прыгучая мина!', { 
            startX: Math.round(x),
            targetX: Math.round(targetX),
            speedX: this.speedX.toFixed(2),
            direction: this.speedX > 0 ? 'вправо' : 'влево'
        });
    }

    update() {
        if (this.state === 'exploding') return false;
        
        this.rotation += this.rotationSpeed;
        this.wobble += this.wobbleSpeed;
        
        // Обновление мигания предупреждения
        if (this.state === 'settled') {
            this.flashTimer++;
            if (this.settleTimer >= this.warningStartTime) {
                this.warningFlash = (this.flashTimer % 20) < 10; // Мигание каждые 10 кадров
            }
        }
        
        switch(this.state) {
            case 'flying':
                this.updateFlying();
                break;
            case 'bouncing':
                this.updateBouncing();
                break;
            case 'settled':
                this.updateSettled();
                break;
        }
        
        // Проверка столкновения с игроком (прямой контакт)
        if (this.checkCollisionWithPlayer()) {
            this.explode();
            return false;
        }
        
        return true;
    }

    updateFlying() {
        // МЕДЛЕННЫЙ параболический полет
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        
        if (this.y + this.height >= this.groundLevel) {
            this.hitGround();
        }
        
        if (this.y < -100) {
            this.y = -100;
            this.speedY = Math.abs(this.speedY) * 0.5;
        }
    }

    updateBouncing() {
        // МЕДЛЕННОЕ движение с гравитацией
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        
        this.speedX *= 0.98;
        
        if (this.y + this.height >= this.groundLevel) {
            this.bounce();
        }
        
        if (Math.abs(this.speedY) < this.minBounceSpeed && 
            this.y + this.height >= this.groundLevel - 2) {
            this.settle();
        }
    }

    updateSettled() {
        this.settleTimer++;
        
        // Легкое "дыхание" на земле
        const breath = Math.sin(this.settleTimer * 0.1) * 0.5;
        this.y = this.groundLevel - this.height + breath;
        
        // Взрыв по таймеру
        if (this.settleTimer >= this.settleDuration) {
            this.explode();
            return false;
        }
    }

    hitGround() {
        this.y = this.groundLevel - this.height;
        this.state = 'bouncing';
        this.bounceCount = 1;
        this.bounce();
        
        // ЗВУК УДАРА О ЗЕМЛЮ
        if (typeof playMineFall === 'function') {
            playMineFall();
        }
        
        console.log('💣 Мина ударилась о землю, начинаются отскоки');
    }

    bounce() {
        if (this.bounceCount >= this.maxBounces) {
            this.settle();
            return;
        }
        
        // МЕДЛЕННЫЙ отскок
        this.speedY = -Math.abs(this.speedY) * this.bounceDamping;
        this.speedX *= 0.9;
        
        this.y = this.groundLevel - this.height;
        this.createImpactEffect();
        
        this.bounceCount++;
    }

    settle() {
        this.state = 'settled';
        this.speedX = 0;
        this.speedY = 0;
        this.y = this.groundLevel - this.height;
        this.settleTimer = 0;
        this.flashTimer = 0;
        
        console.log('💣 Мина осела на земле! Взрыв через 4 секунды');
        this.createSettleEffect();
    }

    explode() {
        if (this.state === 'exploding') return false;
        
        this.state = 'exploding';
        
        console.log('💥 Мина взрывается!');
        
        // ЗВУК ВЗРЫВА МИНЫ
        if (typeof playMineBoom === 'function') {
            playMineBoom();
        }
        
        // Создаем взрыв
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.explosionSize
            ));
        }
        
        screenShake = Math.max(screenShake, 8);
        
        // Наносим урон игроку если в радиусе поражения
        if (gameState && gameState.player) {
            const player = gameState.player;
            const distance = Math.sqrt(
                Math.pow((this.x + this.width / 2) - (player.x + player.width / 2), 2) +
                Math.pow((this.y + this.height / 2) - (player.y + player.height / 2), 2)
            );
            
            if (distance < this.damageRadius) {
                player.health = Math.max(0, player.health - 1);
                console.log('🎯 Игрок получил урон от взрыва мины!');
            }
        }
        
        return false;
    }

    checkCollisionWithPlayer() {
        if (!gameState || !gameState.player || this.state === 'exploding') return false;
        
        const player = gameState.player;
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }

    createImpactEffect() {
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2,
                this.groundLevel,
                20
            ));
        }
        
        screenShake = Math.max(screenShake, 3);
        
        for (let i = 0; i < 5; i++) {
            if (gameState.smokeParticles) {
                const dust = new SmokeParticle(
                    this.x + this.width / 2 + (Math.random() - 0.5) * 40,
                    this.groundLevel - 5
                );
                dust.size = 2 + Math.random() * 3;
                dust.speedY = -1 - Math.random() * 2;
                gameState.smokeParticles.push(dust);
            }
        }
    }

    createSettleEffect() {
        if (gameState && gameState.explosions) {
            const settleFlash = new Explosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                25
            );
            settleFlash.life = 0.5;
            gameState.explosions.push(settleFlash);
        }
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Дополнительное колебание при отскоках
        if (this.state === 'bouncing') {
            const wobble = Math.sin(this.wobble) * 2;
            ctx.rotate(wobble * 0.1);
        }
        
        // Вращение в полете
        if (this.state === 'flying' || this.state === 'bouncing') {
            ctx.rotate(this.rotation);
        }
        
        // КРАСНОЕ МИГАНИЕ за 2 секунды до взрыва
        if (this.warningFlash) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.damageRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (images.seamine) {
            ctx.drawImage(images.seamine, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            this.drawFallback();
        }
        
        ctx.restore();
        
        // Тень на земле
        this.drawShadow();
    }

    drawFallback() {
        // Основа мины (увеличена)
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Металлические полосы
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2 - 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Шипы (увеличены)
        ctx.fillStyle = '#6d4c41';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spikeLength = 10;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(this.width / 2 - 3, 0);
            ctx.lineTo(this.width / 2 + spikeLength, 0);
            ctx.lineTo(this.width / 2 - 2, spikeLength / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        
        // Индикатор взрыва (мигающий при предупреждении)
        if (this.state === 'settled') {
            const pulse = this.warningFlash ? 1 : Math.sin(this.settleTimer * 0.1) * 0.3 + 0.7;
            ctx.fillStyle = this.warningFlash ? '#ff0000' : `rgba(255, 0, 0, ${pulse})`;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawShadow() {
        const shadowAlpha = this.state === 'settled' ? 0.5 : 0.3;
        const shadowSize = this.width * (this.state === 'settled' ? 1.2 : 0.8);
        
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width / 2,
            this.groundLevel - 2,
            shadowSize / 2,
            shadowSize / 8,
            0, 0, Math.PI * 2
        );
        ctx.fill();
    }
}

// Разведчик Focke-Wulf Fw 189 "Uhu"
class FockeWulf extends Enemy {
    constructor() {
        super('fockeWulf');
        
        const originalSize = SPRITE_SIZES.fockeWulf;
        const scale = 0.08;
        this.width = originalSize.width * scale;
        this.height = originalSize.height * scale;
        
        this.health = 3;
        this.maxHealth = 3;
        this.speed = 1.1;
        this.phase = 'approach';
        this.artilleryCooldown = 0;
        this.hasCalledArtillery = false;
        this.maxArtilleryStrikes = 1; // ТОЛЬКО 1 артобстрел
        this.artilleryStrikesCalled = 0;
        this.spottingTimer = 0;
        this.originalY = 0;
        
        console.log('🦉 Focke-Wulf 189 создан! 1 артобстрел + побег!');
    }

    update() {
        if (this.isCrashing) {
            return super.update();
        }

        switch(this.phase) {
            case 'approach':
                this.x += this.speed;
                this.originalY = this.y;
                if (this.x > CONFIG.CANVAS_WIDTH * 0.15) {
                    this.phase = 'spotting';
                    console.log('🦉 Focke-Wulf начинает разведку...');
                }
                break;
                
            case 'spotting':
                this.x += this.speed * 0.6;
                // Плавное движение вверх-вниз для разведки
                this.y = this.originalY + Math.sin(Date.now() * 0.002) * 20;
                
                // Поиск целей и вызов артиллерии
                this.spottingTimer--;
                if (this.spottingTimer <= 0 && 
                    !this.hasCalledArtillery && 
                    this.artilleryStrikesCalled < this.maxArtilleryStrikes) {
                    
                    this.callArtilleryStrike();
                    this.hasCalledArtillery = true;
                    this.artilleryStrikesCalled++;
                    
                    // После вызова артиллерии - уходим как штука
                    setTimeout(() => {
                        this.phase = 'escape';
                        console.log('🦉 Focke-Wulf завершил миссию, уходит!');
                    }, 1000);
                }
                
                if (this.x > CONFIG.CANVAS_WIDTH * 0.7) {
                    this.phase = 'escape';
                }
                break;
                
            case 'escape':
                // Уход как у штуки - быстро вверх
                this.x += this.speed * 1.2;
                this.y -= 2.5;
                break;
        }

        if (this.x > CONFIG.CANVAS_WIDTH || this.y < -this.height) {
            return false;
        }

        return true;
    }

    callArtilleryStrike() {
        console.log('💥 Focke-Wulf вызывает артиллерийский удар!');
        
        // ОТ 3 ДО 4 СНАРЯДОВ (было 5)
        const shellCount = 3 + Math.floor(Math.random() * 2); // 3-4 снаряда
        
        for (let i = 0; i < shellCount; i++) {
            setTimeout(() => {
                if (gameState && gameState.enemyProjectiles) {
                    // Случайная цель в области игрока, но на уровне земли
                    const targetX = gameState.player.x + gameState.player.width / 2 + 
                                (Math.random() - 0.5) * 200;
                    // ВЗРЫВ СТРОГО НА ЗЕМЛЕ (не в небе)
                    const targetY = CONFIG.CANVAS_HEIGHT - 25; // Уровень травы
                    
                    const artilleryShell = new ArtilleryShell(targetX, targetY);
                    gameState.enemyProjectiles.push(artilleryShell);
                }
            }, i * 400); // Задержка между снарядами
        }
        
        // Эффект обнаружения
        this.createSpottingEffect();
    }

    createSpottingEffect() {
        if (gameState && gameState.explosions) {
            // Вспышка в небе
            const flash = new Explosion(
                this.x + this.width / 2,
                this.y - 30,
                40
            );
            flash.life = 0.5;
            flash.color = 'rgba(255, 255, 0, 0.8)';
            gameState.explosions.push(flash);
        }
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        
        if (this.isCrashing) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.crashRotation);
            
            if (images.fockeWulf) {
                ctx.drawImage(images.fockeWulf, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                this.drawFallback('#6d4c41');
            }
        } else {
            // Наклон при уходе
            let rotation = 0;
            if (this.phase === 'escape') {
                rotation = -0.4; // Резкий набор высоты
            }
            
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(rotation);
            
            if (images.fockeWulf) {
                ctx.drawImage(images.fockeWulf, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                this.drawFallback('#6d4c41');
            }
            
            // Индикатор разведки
            if (this.phase === 'spotting' && !this.hasCalledArtillery) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 25, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
        
        if (this.showHealthBar && !this.isCrashing) {
            this.drawHealthBar();
        }
    }

    drawFallback(color) {
        ctx.fillStyle = color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Двухфюзеляжный силуэт
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(-this.width / 2 + 10, -this.height / 2, 12, this.height);
        ctx.fillRect(this.width / 2 - 22, -this.height / 2, 12, this.height);
        
        // Стеклянная кабина
        ctx.fillStyle = 'rgba(200, 230, 255, 0.6)';
        ctx.fillRect(-this.width / 2 + 25, -this.height / 2 + 5, this.width - 50, 15);
        
        // Индикатор артиллерии
        if (!this.hasCalledArtillery) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎯', 0, -this.height / 2 - 8);
            ctx.textAlign = 'left';
        }
    }
}

// Торпедоносец Yokosuka D4Y "Judy"
class Yokosuka extends Enemy {
    constructor() {
        super('yokosuka');
        
        const originalSize = SPRITE_SIZES.yokosuka;
        const scale = 0.07;
        this.width = originalSize.width * scale;
        this.height = originalSize.height * scale;
        
        this.health = 4;
        this.maxHealth = 4;
        this.speed = 1.0;
        this.phase = 'lowApproach';
        this.hasDroppedTorpedo = false;
        this.hasCalledArtillery = false;
        this.lowFlightDistance = CONFIG.CANVAS_WIDTH * 0.2; // 20% ширины экрана
        this.lowFlightStartX = 0;
        
        // НИЗКИЙ ПОЛЕТ (15-25% от земли)
        const minHeight = CONFIG.CANVAS_HEIGHT - 200;
        const maxHeight = CONFIG.CANVAS_HEIGHT - 120;
        this.lowAltitude = minHeight + Math.random() * (maxHeight - minHeight);
        this.highAltitude = 150 + Math.random() * 100;
        this.y = this.lowAltitude;
        
        console.log('🎌 Yokosuka D4Y создан! Низкий полет, прыгающая торпеда + артиллерия!');
    }

    update() {
        if (this.isCrashing) {
            return super.update();
        }

        switch(this.phase) {
            case 'lowApproach':
                this.x += this.speed;
                this.y = this.lowAltitude;
                
                // Запоминаем где начали низкий полет
                if (this.lowFlightStartX === 0 && this.x > 50) {
                    this.lowFlightStartX = this.x;
                }
                
                // Сброс прыгающей торпеды в первой половине низкого полета
                if (!this.hasDroppedTorpedo && 
                    this.x > this.lowFlightStartX + this.lowFlightDistance * 0.3) {
                    this.dropBouncingTorpedo();
                    this.hasDroppedTorpedo = true;
                }
                
                // Завершение низкого полета
                if (this.x > this.lowFlightStartX + this.lowFlightDistance) {
                    this.phase = 'climbing';
                    console.log('🔼 Yokosuka набирает высоту!');
                }
                break;
                
            case 'climbing':
                this.x += this.speed;
                // Плавный набор высоты
                this.y -= 2.5;
                
                if (this.y <= this.highAltitude) {
                    this.phase = 'highEscape';
                    this.y = this.highAltitude;
                }
                break;
                
            case 'highEscape':
                this.x += this.speed * 1.1;
                // Легкое волнообразное движение на высокой высоте
                this.y = this.highAltitude + Math.sin(Date.now() * 0.003) * 15;
                break;
        }

        if (this.x > CONFIG.CANVAS_WIDTH || this.y < -this.height) {
            return false;
        }

        return true;
    }

    dropBouncingTorpedo() {
        if (!gameState || !gameState.enemyProjectiles) return;
        
        console.log('🐟 Yokosuka сбрасывает ПРЫГАЮЩУЮ торпеду!');
        
        // ЦЕЛЬ - ПОЗИЦИЯ ИГРОКА (а не случайная точка)
        const playerCenterX = gameState.player.x + gameState.player.width / 2;
        const playerCenterY = gameState.player.y + gameState.player.height / 2;
        
        const torpedo = new BouncingTorpedo(
            this.x + this.width / 2,
            this.y + this.height,
            playerCenterX // Торпеда летит прямо к игроку
        );
        
        gameState.enemyProjectiles.push(torpedo);
        
        if (typeof playMineFall === 'function') {
            playMineFall();
        }
    }

    draw() {
        if (!ctx) return;
        
        ctx.save();
        
        if (this.isCrashing) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.crashRotation);
            
            if (images.yokosuka) {
                ctx.drawImage(images.yokosuka, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                this.drawFallback('#8d6e63');
            }
        } else {
            // Наклон при наборе высоты
            let rotation = 0;
            if (this.phase === 'climbing') {
                rotation = -0.3; // Нос вверх
            }
            
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(rotation);
            
            if (images.yokosuka) {
                ctx.drawImage(images.yokosuka, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                this.drawFallback('#8d6e63');
            }
            
            // Индикатор действий
            if (!this.hasDroppedTorpedo) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(0, this.height / 2 + 5, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
        
        if (this.showHealthBar && !this.isCrashing) {
            this.drawHealthBar();
        }
    }

    drawFallback(color) {
        ctx.fillStyle = color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Японские опознавательные знаки
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.arc(-this.width / 2 + 15, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.width / 2 - 15, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Индикатор торпеды
        if (!this.hasDroppedTorpedo) {
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(-5, this.height / 2 - 5, 10, 8);
        }
    }
}

// Ночной бомбардировщик Nakajima G5N "Shinzan"
class NakajimaG5N extends Enemy {
    constructor() {
        super('nakajimaG5N');
        
        const originalSize = SPRITE_SIZES.nakajimaG5N;
        const scale = 0.09;
        this.width = originalSize.width * scale;
        this.height = originalSize.height * scale;
        
        this.health = 6;
        this.maxHealth = 6;
        this.speed = 1.45
        this.phase = 'approach';
        this.smokeCooldown = 0;
        this.smokeScreens = [];
        this.hasDeployedSmoke = false;
        this.smokeDeployX = 0;
        
        // НОВЫЕ СВОЙСТВА ДЛЯ АТАК
        this.machineGunCooldown = 0;
        this.machineGunInterval = 90; // Стрельба каждые 1.5 секунды
        this.bombCount = 0;
        this.maxBombs = 2; // РОВНО 2 БОМБЫ
        this.bombCooldown = 0;
        this.bombInterval = 300; // Интервал между бомбами
        
        // ДЛЯ ПУЛЕМЕТНОЙ ОЧЕРЕДИ
        this.isFiring = false;
        this.burstCount = 0;
        this.maxBurst = 5; // 5 пуль за очередь
        this.burstDelay = 0;
        
        console.log('🌫️ Nakajima G5N создан! Ускорен на 25%, 2 бомбы, пулеметные очереди!');
    }

    update() {
        if (this.isCrashing) {
            return super.update();
        }

        this.x += this.speed;
        this.smokeCooldown--;
        this.machineGunCooldown--;
        this.bombCooldown--;

        // Развертывание дымзавесы в определенной точке
        if (!this.hasDeployedSmoke && this.x > CONFIG.CANVAS_WIDTH * 0.4) {
            this.deployAdvancedSmokeScreen();
            this.hasDeployedSmoke = true;
            this.smokeDeployX = this.x;
        }

        // ПУЛЕМЕТНАЯ ОЧЕРЕДЬ - активируется периодически
        if (this.machineGunCooldown <= 0 && !this.isFiring && this.x > CONFIG.CANVAS_WIDTH * 0.3) {
            this.startMachineGunBurst();
            this.machineGunCooldown = this.machineGunInterval;
        }
        
        // ОБНОВЛЕНИЕ ПУЛЕМЕТНОЙ ОЧЕРЕДИ
        if (this.isFiring) {
            this.updateMachineGunBurst();
        }

        // СБРОС БОМБ - РОВНО 2 БОМБЫ С ИНТЕРВАЛОМ
        if (this.bombCount < this.maxBombs && this.bombCooldown <= 0 && 
            this.x > CONFIG.CANVAS_WIDTH * 0.3 && this.x < CONFIG.CANVAS_WIDTH * 0.8) {
            this.dropBomb();
            this.bombCount++;
            this.bombCooldown = this.bombInterval;
            console.log(`💣 Nakajima G5N сбросил бомбу ${this.bombCount}/${this.maxBombs}`);
        }

        // Обновление дымзавес
        for (let i = this.smokeScreens.length - 1; i >= 0; i--) {
            if (!this.smokeScreens[i].update()) {
                this.smokeScreens.splice(i, 1);
            }
        }

        if (this.x > CONFIG.CANVAS_WIDTH) {
            return false;
        }

        return true;
    }

    // ПУЛЕМЕТНАЯ ОЧЕРЕДЬ - ЗАПУСК
    startMachineGunBurst() {
        this.isFiring = true;
        this.burstCount = 0;
        this.burstDelay = 0;
        console.log('🔫 Nakajima G5N начинает пулеметную очередь!');
    }

    // ПУЛЕМЕТНАЯ ОЧЕРЕДЬ - ОБНОВЛЕНИЕ
    updateMachineGunBurst() {
        this.burstDelay--;
        
        if (this.burstDelay <= 0 && this.burstCount < this.maxBurst) {
            this.fireMachineGun();
            this.burstCount++;
            this.burstDelay = 8; // Задержка между пулями в очереди
            
            if (this.burstCount >= this.maxBurst) {
                this.isFiring = false;
                console.log('🔫 Nakajima G5N завершил пулеметную очередь');
            }
        }
    }

    // ВЫСТРЕЛ ИЗ ПУЛЕМЕТА
    fireMachineGun() {
        if (!gameState || !gameState.enemyProjectiles) return;
        
        // Цель - игрок или ближайший истребитель
        let targetX, targetY;
        
        if (gameState.player) {
            targetX = gameState.player.x + gameState.player.width / 2;
            targetY = gameState.player.y + gameState.player.height / 2;
        } else {
            // Случайная цель впереди
            targetX = this.x + 200;
            targetY = 200 + Math.random() * 200;
        }
        
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        
        // Добавляем небольшой разброс для реализма
        const spread = (Math.random() - 0.5) * 0.3;
        const finalAngle = angle + spread;
        
        const bullet = new EnemyProjectile(
            this.x + this.width,
            this.y + this.height / 2,
            Math.cos(finalAngle) * 6, // Быстрые пули
            Math.sin(finalAngle) * 6,
            'bullet'
        );
        
        // Эффект выстрела
        this.createMuzzleFlash();
        
        gameState.enemyProjectiles.push(bullet);
    }

    // ЭФФЕКТ ВЫСТРЕЛА
    createMuzzleFlash() {
        if (!gameState || !gameState.explosions) return;
        
        const flash = new Explosion(
            this.x + this.width,
            this.y + this.height / 2,
            12
            );
        flash.life = 0.2; // Короткая вспышка
        gameState.explosions.push(flash);
    }

    // СБРОС БОМБЫ
    dropBomb() {
        if (!gameState || !gameState.enemyProjectiles) return;
        
        const bomb = new EnemyProjectile(
            this.x + this.width / 2,
            this.y + this.height,
            0,
            2.5, // Быстрая бомба
            'bomb'
        );
        
        gameState.enemyProjectiles.push(bomb);
        
        // Визуальный эффект сброса бомбы
        this.createBombDropEffect();
    }

    // ЭФФЕКТ СБРОСА БОМБЫ
    createBombDropEffect() {
        if (!gameState || !gameState.explosions) return;
        
        const effect = new Explosion(
            this.x + this.width / 2,
            this.y + this.height,
            8
        );
        effect.life = 0.3;
        gameState.explosions.push(effect);
    }

    deployAdvancedSmokeScreen() {
        console.log('🌫️ Nakajima G5N создает УЛУЧШЕННУЮ дымзавесу!');
        
        // Создаем большую эффективную дымзавесу
        const smokeWidth = 400;
        const smokeHeight = 300;
        const smokeX = this.x - 100;
        const smokeY = 100;
        
        const advancedSmoke = new AdvancedSmokeScreen(
            smokeX, 
            smokeY, 
            smokeWidth, 
            smokeHeight
        );
        this.smokeScreens.push(advancedSmoke);
        
        // Дополнительные маленькие дымзавесы для реализма
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (gameState && gameState.gameActive) {
                    const smallSmoke = new AdvancedSmokeScreen(
                        smokeX + Math.random() * 200 - 100,
                        smokeY + Math.random() * 100 - 50,
                        150,
                        120
                    );
                    this.smokeScreens.push(smallSmoke);
                }
            }, i * 500);
        }
    }

    draw() {
        if (!ctx) return;
        
        // СНАЧАЛА рисуем сам самолет
        ctx.save();
        
        if (this.isCrashing) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.crashRotation);
            
            if (images.nakajimaG5N) {
                ctx.drawImage(images.nakajimaG5N, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                this.drawFallback('#5d4037');
            }
        } else {
            if (images.nakajimaG5N) {
                ctx.drawImage(images.nakajimaG5N, this.x, this.y, this.width, this.height);
            } else {
                this.drawFallback('#5d4037');
            }
            
            // ИНДИКАТОР АТАКИ при стрельбе
            if (this.isFiring) {
                this.drawAttackIndicator();
            }
        }
        
        ctx.restore();
        
        // ПОТОМ индикатор здоровья (под дымом)
        if (this.showHealthBar && !this.isCrashing) {
            this.drawHealthBar();
        }
    }

    // ИНДИКАТОР АТАКИ (при стрельбе)
    drawAttackIndicator() {
        ctx.save();
        
        // Красный индикатор стрельбы
        ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x + this.width, this.y + this.height / 2, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Мигающий эффект
        const pulse = Math.sin(Date.now() * 0.1) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 100, 100, ${pulse})`;
        ctx.beginPath();
        ctx.arc(this.x + this.width, this.y + this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawFallback(color) {
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Четырехмоторный силуэт
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(this.x + 10, this.y + 5, 8, 15);
        ctx.fillRect(this.x + 30, this.y + 5, 8, 15);
        ctx.fillRect(this.x + this.width - 40, this.y + 5, 8, 15);
        ctx.fillRect(this.x + this.width - 20, this.y + 5, 8, 15);
        
        // Индикатор активности
        if (this.isFiring) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y - 15, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Индикатор бомб
        if (this.bombCount < this.maxBombs) {
            ctx.fillStyle = '#ff6d00';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`💣×${this.maxBombs - this.bombCount}`, this.x + this.width / 2, this.y - 5);
            ctx.textAlign = 'left';
        }
    }

    drawHealthBar() {
        if (!ctx) return;
        
        const barWidth = this.width;
        const barHeight = 4;
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(this.x, this.y - 8, barWidth * healthPercent, barHeight);
        
        // Дополнительная информация
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Arial';
        
        // Индикатор атаки если стреляет
        if (this.isFiring) {
            ctx.fillStyle = '#ff4444';
        }
    }
}

// Класс торпеды
class BouncingTorpedo {
    constructor(x, y, targetX) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 15;
        this.type = 'bouncingTorpedo';
        this.speed = 2.5;
        this.targetX = targetX;
        this.health = 2;
        this.maxHealth = 2;
        
        // ФИЗИКА ПРЫЖКОВ - ИСПРАВЛЕНА ЛОГИКА
        this.speedY = -4;
        this.gravity = 0.15;
        this.bounceDamping = 0.7;
        this.bounceCount = 0;
        this.maxBounces = 3;
        this.state = 'flying'; // flying, bouncing, rolling
        
        // торпеда должна двигаться к цели, а не к игроку
        this.directionX = targetX > x ? 1 : -1; // Направление движения по X
        
        this.groundLevel = CONFIG.CANVAS_HEIGHT - 50;
        this.trail = [];
        this.maxTrailLength = 6;
        
        console.log('🐟 Прыгающая торпеда запущена! Направление: ' + (this.directionX > 0 ? 'вправо' : 'влево'));
    }

    update() {
        // Движение в заданном направлении, а не к игроку
        this.x += this.directionX * this.speed;

        // Физика прыжков
        this.y += this.speedY;
        this.speedY += this.gravity;
        
        // След
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Столкновение с землей
        if (this.y + this.height >= this.groundLevel) {
            if (this.state === 'flying') {
                this.state = 'bouncing';
                this.bounceCount = 1;
            }
            this.bounce();
        }
        
        // Проверка столкновения со снарядами игрока
        if (this.checkCollisionWithProjectiles()) {
            return false; // Удаляем торпеду если попал снаряд
        }
        
        // Проверка столкновения с игроком
        if (this.checkCollisionWithPlayer()) {
            this.explode();
            return false;
        }
        
        // Завершение движения - только когда торпеда улетела за правый край экрана
        if (this.bounceCount >= this.maxBounces && Math.abs(this.speedY) < 0.5) {
            this.state = 'rolling';
            this.speedY = 0;
            this.y = this.groundLevel - this.height;
            
            // Продолжаем движение вперед даже в режиме rolling
            this.x += this.directionX * this.speed;
        }
        
        // Удаляем торпеду только когда она улетела за границы экрана
        if (this.x > CONFIG.CANVAS_WIDTH + this.width || this.x < -this.width * 2) {
            return false;
        }
        
        return true;
    }

    //Проверка столкновения со снарядами игрока
    checkCollisionWithProjectiles() {
        if (!gameState || !gameState.projectiles) return false;
        
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            const projectile = gameState.projectiles[i];
            
            // ЗАЩИТНАЯ ПРОВЕРКА
            if (!projectile) continue;
            
            if (this.checkCollision(projectile, this)) {
                console.log('💥 Снаряд попал в торпеду!');
                
                // Наносим урон торпеде
                if (this.takeDamage()) {
                    // Торпеда уничтожена
                    gameState.projectiles.splice(i, 1);
                    return true;
                } else {
                    // Торпеда получила урон но не уничтожена
                    gameState.projectiles.splice(i, 1);
                    
                    // Создаем эффект попадания
                    if (gameState && gameState.explosions) {
                        gameState.explosions.push(new Explosion(
                            projectile.x + projectile.width / 2,
                            projectile.y + projectile.height / 2,
                            15
                        ));
                    }
                }
            }
        }
        return false;
    }

    // Метод проверки столкновения двух объектов
    checkCollision(obj1, obj2) {
        if (!obj1 || !obj2) return false;
        
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    takeDamage() {
        this.health--;
        console.log('💥 Торпеда получила урон: ' + this.health + '/' + this.maxHealth);
        
        // Визуальный эффект попадания
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                20
            ));
        }
        
        if (this.health <= 0) {
            this.explode();
            return true;
        }
        
        return false;
    }

    bounce() {
        if (this.bounceCount >= this.maxBounces) {
            this.speedY = 0;
            this.y = this.groundLevel - this.height;
            this.state = 'rolling';
            return;
        }
        
        this.speedY = -Math.abs(this.speedY) * this.bounceDamping;
        this.y = this.groundLevel - this.height;
        
        this.createBounceEffect();
        this.bounceCount++;
    }

    checkCollisionWithPlayer() {
        if (!gameState || !gameState.player) return false;
        
        const player = gameState.player;
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }

    explode() {
        console.log('💥 Прыгающая торпеда взрывается!');
        
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                60
            ));
        }
        
        screenShake = 12;
        
        // Урон игроку
        if (gameState && gameState.player) {
            const player = gameState.player;
            const distance = Math.sqrt(
                Math.pow((this.x + this.width / 2) - (player.x + player.width / 2), 2) +
                Math.pow((this.y + this.height / 2) - (player.y + player.height / 2), 2)
            );
            
            if (distance < 120) {
                player.health = Math.max(0, player.health - 1);
                console.log('💣 Игрок получил урон от взрыва торпеды!');
            }
        }
        
        return false;
    }

    createBounceEffect() {
        if (gameState && gameState.explosions) {
            const impact = new Explosion(
                this.x + this.width / 2,
                this.groundLevel,
                15
            );
            impact.life = 0.3;
            gameState.explosions.push(impact);
        }
        
        // Искры при ударе
        for (let i = 0; i < 5; i++) {
            if (gameState.smokeParticles) {
                const spark = {
                    x: this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                    y: this.groundLevel - 2,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -Math.random() * 2 - 1,
                    life: 20 + Math.random() * 10,
                    size: 1 + Math.random() * 2,
                    color: `rgba(255, ${150 + Math.random() * 105}, 0, 1)`,
                    update: function() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.life--;
                        return this.life > 0;
                    },
                    draw: function() {
                        const alpha = this.life / 30;
                        ctx.fillStyle = this.color.replace('1)', `${alpha})`);
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                };
                gameState.smokeParticles.push(spark);
            }
        }
    }

    draw() {
        if (!ctx) return;
        
        // След движения
        if (this.trail.length > 1) {
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x + this.width / 2, this.trail[0].y + this.height / 2);
            
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x + this.width / 2, this.trail[i].y + this.height / 2);
            }
            ctx.stroke();
        }
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Вращение при прыжках
        if (this.state === 'bouncing') {
            const rotation = this.speedY * 0.1;
            ctx.rotate(rotation);
        }
        
        // Разворот в зависимости от направления
        if (this.directionX < 0) {
            ctx.scale(-1, 1);
        }
        
        if (images.torpeda) {
            ctx.drawImage(images.torpeda, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            this.drawFallback();
        }
        
        ctx.restore();
        
        // Индикатор здоровья
        if (this.health < this.maxHealth) {
            const barWidth = 30;
            const barHeight = 3;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x + this.width / 2 - barWidth / 2, this.y - 8, barWidth, barHeight);
            ctx.fillStyle = '#4caf50';
            ctx.fillRect(this.x + this.width / 2 - barWidth / 2, this.y - 8, barWidth * healthPercent, barHeight);
        }
    }

    drawFallback() {
        // Корпус торпеды
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Носовая часть
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2 - 8, 0);
        ctx.closePath();
        ctx.fill();
        
        // Хвостовое оперение
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(this.width / 2 - 5, -this.height / 2, 3, this.height);
        ctx.fillRect(this.width / 2 - 5, -this.height / 2 - 3, 8, 3);
        ctx.fillRect(this.width / 2 - 5, this.height / 2, 8, 3);
        
        // Пропеллер
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(this.width / 2, -2, 3, 4);
        
        // Индикатор прыжков
        ctx.fillStyle = '#ff6d00';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.maxBounces - this.bounceCount}`, 0, -10);
        ctx.textAlign = 'left';
    }
}

// Класс артилерийского снаряда
class ArtilleryShell {
    constructor(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = CONFIG.CANVAS_HEIGHT - 120; // ФИКСИРУЕМ позицию взрыва
        
        // Стартовая позиция - левая-верхняя часть экрана
        this.startX = -30;
        this.startY = 30 + Math.random() * 100;
        this.x = this.startX;
        this.y = this.startY;
        
        // Размеры как у патрона
        this.width = 6;
        this.height = 15;
        this.type = 'artilleryShell';
        
        // Параболическая траектория
        this.speed = 0.4;
        this.progress = 0;
        this.maxProgress = 100;
        
        // Зона поражения - УБЕДИТЕСЬ ЧТО НА ЗЕМЛЕ
        this.warningZone = {
            x: targetX - 60,
            y: CONFIG.CANVAS_HEIGHT - 115, // Поднимаем над землей
            width: 120,
            height: 80,
            active: true,
            timer: 90,
            flash: false,
            flashTimer: 0
        };
        
        console.log('💥 Артиллерийский снаряд запущен! Взрыв на земле в X:' + Math.round(targetX));
    }

    update() {
        // Обновление зоны поражения
        if (this.warningZone.active) {
            this.warningZone.timer--;
            this.warningZone.flashTimer++;
            
            // Мигание каждые 10 кадров
            if (this.warningZone.flashTimer >= 10) {
                this.warningZone.flash = !this.warningZone.flash;
                this.warningZone.flashTimer = 0;
            }
            
            // Взрыв когда таймер зоны истекает
            if (this.warningZone.timer <= 0) {
                this.warningZone.active = false;
                this.explode();
                return false;
            }
        }
        
        // Движение снаряда по параболе
        this.progress += this.speed;
        
        if (this.progress >= this.maxProgress) {
            this.explode();
            return false;
        }
        
        const t = this.progress / this.maxProgress;
        this.x = this.startX + (this.targetX - this.startX) * t;
        this.y = this.startY + (this.targetY - this.startY) * t + 
                 Math.sin(t * Math.PI) * -150; // Парабола
        
        return true;
    }

    explode() {
        console.log('💥 Артиллерийский снаряд взрывается!');
        
        // Большой взрыв в позиции зоны предупреждения
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(
                this.targetX, // Центр по X
                this.targetY + 40, // Центр по Y (середина зоны)
                45
            ));
        }
        
        screenShake = Math.max(screenShake, 8);
        
        // Урон игроку в зоне поражения
        if (gameState && gameState.player) {
            const player = gameState.player;
            const zone = this.warningZone;
            
            // Проверка попадания в зону поражения
            if (player.x < zone.x + zone.width &&
                player.x + player.width > zone.x &&
                player.y < zone.y + zone.height &&
                player.y + player.height > zone.y) {
                
                player.health = Math.max(0, player.health - 1);
                console.log('🎯 Игрок получил урон от артиллерии!');
            }
        }
        
        return false;
    }

    draw() {
        if (!ctx) return;
        
        // Отрисовка зоны поражения (если активна)
        if (this.warningZone.active) {
            this.drawWarningZone();
        }
        
        // ПАТРОН БОЛЬШЕ НЕ РИСУЕТСЯ - ТОЛЬКО ЗОНА ПРЕДУПРЕЖДЕНИЯ И ВЗРЫВ
    }

    drawWarningZone() {
        const zone = this.warningZone;
        const alpha = this.warningZone.flash ? 0.7 : 0.4;
        
        // ИСПРАВЛЕНИЕ: Поднимаем зону поражения над землей
        const zoneY = CONFIG.CANVAS_HEIGHT - 120; // Над землей, а не на уровне земли
        
        // КРАСНЫЙ КРУГ вместо квадрата
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(zone.x + zone.width / 2, zoneY, zone.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // КРАСНАЯ ОБВОДКА КРУГА
        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(zone.x + zone.width / 2, zoneY, zone.width / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Восклицательный знак в центре
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', zone.x + zone.width / 2, zoneY);
        ctx.textAlign = 'left';
    }
}

// Класс дымзавесы
class AdvancedSmokeScreen {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.life = 420; // 7 секунд (60 FPS × 7)
        this.maxLife = 420;
        this.particles = [];
        
        this.createOptimizedSmoke();
        console.log('🌫️ Создана ОПТИМИЗИРОВАННАЯ дымзавеса! 4 частицы, 7 секунд');
    }

    createOptimizedSmoke() {
        // Создаем всего 4 ОЧЕНЬ БОЛЬШИХ частицы для лучшего визуального эффекта
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                size: 120 + Math.random() * 80, // ОЧЕНЬ БОЛЬШИЕ частицы (120-200px)
                startSize: 120 + Math.random() * 80,
                life: this.life,
                maxLife: this.life,
                speedX: (Math.random() - 0.5) * 0.2, // Медленнее
                speedY: -0.05 - Math.random() * 0.1, // Медленнее
                opacity: 0.95, // 95% непрозрачности - МЕНЬШЕ ПРОЗРАЧНОСТИ
                startX: 0,
                startY: 0
            });
        }
    }

    update() {
        this.life--;
        
        // Обновляем частицы
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.life--;
            
            // Плавное уменьшение размера
            p.size = p.startSize * (p.life / this.maxLife);
            
            // МЕНЬШЕ ПЛАВНОСТИ ИСЧЕЗНОВЕНИЯ - только в последние 20 кадров
            if (p.life < 20) {
                p.opacity = 0.95 * (p.life / 20);
            }
            // В остальное время сохраняем высокую непрозрачность
            else {
                p.opacity = 0.95;
            }
        });
        
        return this.life > 0;
    }

    draw() {
        ctx.save();
        
        // Рисуем только 4 ОЧЕНЬ БОЛЬШИХ частицы с МЕНЬШЕЙ ПРОЗРАЧНОСТЬЮ
        this.particles.forEach(p => {
            if (p.life <= 0) return;
            
            const alpha = p.opacity; // Используем напрямую, без дополнительного затухания
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.globalAlpha = alpha;
            
            // ПРОСТОЙ СЕРЫЙ ГРАДИЕНТ С МЕНЬШЕЙ ПРОЗРАЧНОСТЬЮ
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
            gradient.addColorStop(0, `rgba(80, 80, 80, ${alpha})`);        // Более темный серый
            gradient.addColorStop(0.2, `rgba(70, 70, 70, ${alpha * 0.9})`); // Меньше прозрачности
            gradient.addColorStop(0.5, `rgba(60, 60, 60, ${alpha * 0.7})`); // Меньше прозрачности  
            gradient.addColorStop(1, `rgba(50, 50, 50, ${alpha * 0.4})`);   // Меньше прозрачности
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // ДОБАВЛЯЕМ ВТОРОЙ СЛОЙ ДЛЯ БОЛЬШЕЙ НЕПРОЗРАЧНОСТИ
            const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 0.6);
            innerGradient.addColorStop(0, `rgba(90, 90, 90, ${alpha * 0.8})`);
            innerGradient.addColorStop(1, `rgba(70, 70, 70, ${alpha * 0.3})`);
            
            ctx.fillStyle = innerGradient;
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        ctx.restore();
    }
}