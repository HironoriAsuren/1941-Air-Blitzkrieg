// Частицы дыма
class SmokeParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 2 + 1;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        return this.life > 0;
    }

    draw() {
        const alpha = this.life;
        ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(50, 50, 50, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Взрыв
class Explosion {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.life = 1.0;
    }

    update() {
        this.life -= 0.03;
        return this.life > 0;
    }

    draw() {
        const alpha = this.life;
        const currentSize = this.size * (1.5 - this.life * 0.5);
        
        ctx.fillStyle = `rgba(255, 109, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 235, 59, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Взрыв ПВО
class PvoExplosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.shockwave = { size: 10, maxSize: 150, life: 1.0 };
        this.life = 1.0;
        this.createParticles();
    }

    createParticles() {
        // Основной взрыв
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01,
                size: Math.random() * 8 + 4,
                color: `rgba(${255}, ${100 + Math.random() * 155}, 0, 1)`
            });
        }

        // Осколки металла
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.5,
                decay: Math.random() * 0.01 + 0.005,
                size: Math.random() * 6 + 3,
                color: `rgba(50, 50, 50, 1)`
            });
        }
    }

    update() {
        this.life -= 0.02;
        this.shockwave.size += 5;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // гравитация
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        return this.life > 0 || this.particles.length > 0;
    }

    draw() {
        // Ударная волна
        if (this.shockwave.life > 0) {
            const alpha = this.shockwave.life;
            ctx.strokeStyle = `rgba(255, 100, 0, ${alpha * 0.6})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.shockwave.size, 0, Math.PI * 2);
            ctx.stroke();
            this.shockwave.life -= 0.03;
        }

        // Частицы взрыва
        this.particles.forEach(p => {
            const alpha = p.life;
            ctx.fillStyle = p.color.replace('1)', `${alpha})`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// Огонь после взрыва
class PvoFire {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.life = 5.0; // Горит 5 секунд
        this.smokeTimer = 0;
        this.flameIntensity = 1.0;
    }

    update() {
        this.life -= 0.016; // ~60 FPS
        this.flameIntensity = this.life / 5.0; // Интенсивность уменьшается со временем

        // Добавляем новые частицы огня (меньше со временем)
        if (Math.random() < 0.3 * this.flameIntensity) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 40,
                y: this.y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 1,
                vy: -Math.random() * 2 - 1,
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01,
                size: Math.random() * 6 + 3
            });
        }

        // Добавляем дым (больше дыма со временем)
        this.smokeTimer--;
        if (this.smokeTimer <= 0) {
            gameState.smokeParticles.push(new SmokeParticle(
                this.x + (Math.random() - 0.5) * 30,
                this.y - 10
            ));
            this.smokeTimer = 8 + Math.random() * 5;
        }

        // Обновляем частицы
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        return this.life > 0;
    }

    draw() {
        // Только частицы огня и дыма, без черного квадрата
        this.particles.forEach(p => {
            const alpha = p.life * this.flameIntensity;
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, `rgba(255, 255, 100, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.7})`);
            gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Добавляем большие языки пламени для эффектности
        if (this.particles.length > 0 && Math.random() < 0.1) {
            const bigFlame = this.particles[Math.floor(Math.random() * this.particles.length)];
            if (bigFlame) {
                const bigSize = bigFlame.size * 2;
                const gradient = ctx.createRadialGradient(bigFlame.x, bigFlame.y, 0, bigFlame.x, bigFlame.y, bigSize);
                gradient.addColorStop(0, `rgba(255, 255, 200, ${bigFlame.life * 0.5})`);
                gradient.addColorStop(0.3, `rgba(255, 150, 0, ${bigFlame.life * 0.3})`);
                gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(bigFlame.x, bigFlame.y, bigSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// Ракетный удар Фау-2 (старая версия - можно удалить или оставить для других целей)
class RocketStrike {
    constructor(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.warningTime = 90;
        this.exploded = false;
        this.warningSize = 0;
    }

    update() {
        this.warningTime--;
        this.warningSize = Math.sin(Date.now() * 0.01) * 10 + 80;
        
        if (this.warningTime <= 0 && !this.exploded) {
            this.explode();
            return false;
        }
        return true;
    }

    explode() {
        this.exploded = true;
        gameState.explosions.push(new Explosion(this.targetX, this.targetY, 60));
        screenShake = 25;
        
        if (gameState && gameState.gameActive) {
            const player = gameState.player;
            const distance = Math.sqrt(
                Math.pow(this.targetX - (player.x + player.width / 2), 2) +
                Math.pow(this.targetY - (player.y + player.height / 2), 2)
            );
            
            if (distance < 100) {
                player.health = Math.max(0, player.health - 2);
            }
        }
        
        return false;
    }

    draw() {
        if (this.warningTime > 0) {
            const alpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(this.targetX, this.targetY, this.warningSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.targetX, this.targetY, this.warningSize, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', this.targetX, this.targetY - 5);
            ctx.textAlign = 'left';
        }
    }
}

// Взрыв НЛО
class UfoExplosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.life = 2.0;
        this.createParticles();
    }

    createParticles() {
        // Энергетические частицы
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 1.0 + Math.random() * 1.0,
                decay: Math.random() * 0.01 + 0.005,
                size: Math.random() * 8 + 4,
                color: `rgba(${100 + Math.random() * 155}, ${200 + Math.random() * 55}, 255, 1)`
            });
        }
        
        // Обычные частицы взрыва
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01,
                size: Math.random() * 6 + 3,
                color: `rgba(255, ${100 + Math.random() * 155}, 0, 1)`
            });
        }
    }

    update() {
        this.life -= 0.016;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // слабая гравитация
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        return this.life > 0 || this.particles.length > 0;
    }

    draw() {
        this.particles.forEach(p => {
            const alpha = p.life;
            ctx.fillStyle = p.color.replace('1)', `${alpha})`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// Ракета Фау-2
class Fau2Rocket {
    constructor(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.startX = 100 + Math.random() * (CONFIG.CANVAS_WIDTH - 200);
        this.startY = -100;
        this.x = this.startX;
        this.y = this.startY;
        this.speed = 25;
        this.exploded = false;
        this.warningTime = 40;
        this.showWarning = true;
        this.impactSize = 0;
        this.hasHitGround = false;
        this.groundLevel = CONFIG.CANVAS_HEIGHT - 50; // Уровень земли
        
        // Размеры для Фау-2
        const originalSize = SPRITE_SIZES.fau2 || { width: 1080, height: 4452 };
        const scale = 0.03;
        this.width = originalSize.width * scale;
        this.height = originalSize.height * scale;
        
        // Угол наклона ракеты
        this.angle = 0;
        
        console.log('🚀 Фау-2 запущена!', { targetX, targetY, startX: this.startX });
    }

    update() {
        if (this.exploded) return false;
        
        // Фаза предупреждения
        if (this.showWarning) {
            this.warningTime--;
            this.impactSize = Math.sin(Date.now() * 0.01) * 10 + 80;
            
            if (this.warningTime <= 0) {
                this.showWarning = false;
            }
            return true;
        }
        
        // Фаза падения ракеты
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Вычисляем угол наклона к цели
        this.angle = Math.atan2(dy, dx) + Math.PI / 2;
        
        if (distance > 5) {
            // Плавное движение к цели
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
            
            // УВЕЛИЧИВАЕМ СКОРОСТЬ ПРИ ПРИБЛИЖЕНИИ К ЗЕМЛЕ
            if (this.y > this.groundLevel - 100) {
                this.speed = Math.min(this.speed + 0.5, 30); // Максимальная скорость
            }
        } else {
            // Достигли цели - взрываемся
            this.explode();
            return false;
        }
        
        // УЛУЧШЕННАЯ ПРОВЕРКА СТОЛКНОВЕНИЯ С ЗЕМЛЕЙ
        // Проверяем не только текущую позицию, но и следующую
        const nextY = this.y + (dy / distance) * this.speed;
        const rocketBottom = this.y + this.height / 2;
        const nextRocketBottom = nextY + this.height / 2;
        
        // Если ракета уже в земле ИЛИ будет в земле в следующем кадре - взрываем
        if (rocketBottom >= this.groundLevel || nextRocketBottom >= this.groundLevel) {
            console.log('💥 Фау-2 достигла земли!', {
                currentY: this.y,
                rocketBottom: rocketBottom,
                groundLevel: this.groundLevel,
                nextRocketBottom: nextRocketBottom
            });
            this.explode();
            return false;
        }
        
        // ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА: если ракета застряла (не движется по Y)
        if (Math.abs(dy) < 1 && this.y > this.groundLevel - 10) {
            console.log('🔄 Фау-2 застряла, принудительный взрыв!');
            this.explode();
            return false;
        }
        
        return true;
    }

    explode() {
        if (this.exploded) return false;
        this.exploded = true;
        
        console.log('💥 Фау-2 взрывается!', { 
            x: this.x, 
            y: this.y,
            groundLevel: this.groundLevel 
        });
        
        // КОРРЕКТИРУЕМ ПОЗИЦИЮ ВЗРЫВА ЕСЛИ РАКЕТА ПОД ЗЕМЛЕЙ
        let explosionY = this.y;
        if (this.y + this.height / 2 > this.groundLevel) {
            explosionY = this.groundLevel - this.height / 2;
            console.log('🎯 Корректируем позицию взрыва на уровень земли');
        }
        
        // Большой взрыв
        if (gameState && gameState.explosions) {
            gameState.explosions.push(new Explosion(this.x, explosionY, 60));
        }
        
        // ЗВУК ВЗРЫВА ФАУ-2
        if (typeof playFau2Explosion === 'function') {
            playFau2Explosion();
        }
        
        // Сильная тряска экрана
        screenShake = 25;
        
        // Наносим урон игроку если близко
        if (gameState && gameState.gameActive && gameState.player) {
            const player = gameState.player;
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            const distance = Math.sqrt(
                Math.pow(this.x - playerCenterX, 2) +
                Math.pow(explosionY - playerCenterY, 2)
            );
            
            if (distance < 100) {
                player.health = Math.max(0, player.health - 2);
                console.log('🎯 Игрок получил урон от Фау-2!');
            }
        }
        
        return false;
    }

    draw() {
        if (this.showWarning) {
            // Мигающая зона поражения
            const alpha = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(this.targetX, this.targetY, this.impactSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.targetX, this.targetY, this.impactSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Восклицательный знак
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', this.targetX, this.targetY - 5);
            ctx.textAlign = 'left';
        } else if (!this.exploded) {
            // Рисуем падающую ракету с наклоном
            ctx.save();
            
            // Перемещаем в позицию ракеты и применяем наклон
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            
            if (images.fau2) {
                // Рисуем ракету с правильным наклоном
                ctx.drawImage(images.fau2, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                // Фолбэк если нет картинки
                ctx.fillStyle = '#757575';
                ctx.fillRect(-4, -this.height / 2, 8, this.height);
                
                // Нос ракеты
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.moveTo(-6, -this.height / 2);
                ctx.lineTo(6, -this.height / 2);
                ctx.lineTo(0, -this.height / 2 - 10);
                ctx.closePath();
                ctx.fill();
                
                // Стабилизаторы
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(-8, this.height / 2 - 5, 4, 8);
                ctx.fillRect(4, this.height / 2 - 5, 4, 8);
            }
            
            ctx.restore();
            
            // Огненный след 
            const trailLength = 85; // Увеличиваем длину для большего смещения
            const trailX = this.x - Math.sin(this.angle) * trailLength;
            const trailY = this.y + Math.cos(this.angle) * trailLength;

            // Градиент для огненного следа
            const gradient = ctx.createRadialGradient(
                trailX, trailY, 0,
                trailX, trailY, 15 // Увеличиваем размер для эффектности
            );
            gradient.addColorStop(0, 'rgba(255, 255, 100, 0.9)');
            gradient.addColorStop(0.4, 'rgba(255, 150, 0, 0.7)');
            gradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(trailX, trailY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Дополнительные частицы огня вдоль следа
            for (let i = 0; i < 5; i++) {
                const progress = 0.3 + (i * 0.2); // Начинаем дальше от ракеты
                const particleX = this.x - Math.sin(this.angle) * trailLength * progress;
                const particleY = this.y + Math.cos(this.angle) * trailLength * progress;
                const size = 2 + Math.random() * 5; // Увеличиваем размер частиц
                const alpha = 0.4 + Math.random() * 0.5;
                
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        // После взрыва ничего не рисуем - ракета исчезает
    }
}

// Фуражка, выпадающая из НЛО
class UFOHat {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 50;
        this.speedY = 1;
        this.speedX = (Math.random() - 0.5) * 4;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
        this.life = 300; // 5 секунд при 60 FPS (300 кадров)
        this.maxLife = 300;
        this.smokeTimer = 0;
        this.hasLanded = false;
        this.initialHeight = y;
        this.fadeStartTime = 180; // Начинаем исчезать через 3 секунды (180 кадров)
        this.fadeDuration = 120; // Исчезаем 2 секунды (120 кадров)
        
        console.log('🎩 Фуражка выпала!', { x, y });
    }

    update() {
        if (this.hasLanded) {
            this.life--;
            
            // Плавное исчезновение после приземления
            if (this.life <= this.fadeStartTime) {
                const fadeProgress = 1 - (this.life / this.fadeDuration);
                if (fadeProgress >= 1) {
                    console.log('🎩 Фуражка полностью исчезла');
                    return false; // Удаляем объект
                }
            }
            
            return this.life > 0;
        }

        // Движение и вращение до приземления
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        
        // Замедление по X
        this.speedX *= 0.97;
        
        // Гравитация
        this.speedY += 0.15;
        
        // ПРОВЕРКА ПРИЗЕМЛЕНИЯ НА ТРАВУ
        const grassLevel = CONFIG.CANVAS_HEIGHT - 50;
        const topOfGrass = grassLevel - 10;
        
        if (this.y + this.height >= topOfGrass) {
            this.land();
        }
        
        // Дым при падении
        this.smokeTimer--;
        if (this.smokeTimer <= 0) {
            this.createSmoke();
            this.smokeTimer = 3;
        }
        
        return true;
    }

    land() {
        if (this.hasLanded) return;
        
        this.hasLanded = true;
        // ПРИЗЕМЛЯЕМСЯ НА ТРАВУ
        const grassLevel = CONFIG.CANVAS_HEIGHT - 50;
        const topOfGrass = grassLevel - 10;
        this.y = topOfGrass - this.height + 20;
        this.speedX = 0;
        this.speedY = 0;
        this.rotationSpeed = 0.02;
        
        console.log('🎩 Фуражка приземлилась! Исчезнет через 5 секунд');
        
        // Эффект приземления
        for (let i = 0; i < 8; i++) {
            gameState.smokeParticles.push(new SmokeParticle(
                this.x + this.width / 2 + (Math.random() - 0.5) * 30,
                this.y + this.height + 2
            ));
        }
        
        // Небольшая тряска
        screenShake = Math.max(screenShake, 3);
    }

    createSmoke() {
        // Дым идет из-под фуражки при падении
        for (let i = 0; i < 2; i++) {
            gameState.smokeParticles.push(new SmokeParticle(
                this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                this.y + this.height - 5 + Math.random() * 10
            ));
        }
    }

    draw() {
        // Вычисляем прозрачность для эффекта исчезновения
        let alpha = 1.0;
        if (this.hasLanded && this.life <= this.fadeStartTime) {
            const fadeProgress = 1 - (this.life / this.fadeDuration);
            alpha = 1 - fadeProgress;
        }
        
        ctx.save();
        ctx.globalAlpha = alpha; // Применяем прозрачность
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        if (images.cape) {
            // Рисуем фуражку
            ctx.drawImage(images.cape, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // ФОЛБЭК БЕЗ КРАСНОЙ ГРАНИЦЫ
            this.drawFallback();
        }
        
        ctx.restore();
        
        // Тень на траве после приземления (тоже с прозрачностью)
        if (this.hasLanded) {
            const shadowAlpha = (this.life / this.maxLife) * alpha;
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha * 0.5})`;
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, CONFIG.CANVAS_HEIGHT - 48, 
                        this.width * 0.8, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Эффект на траве
            ctx.fillStyle = `rgba(0, 100, 0, ${shadowAlpha * 0.2})`;
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, CONFIG.CANVAS_HEIGHT - 48, 
                        this.width * 0.6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawFallback() {
        // ФОЛБЭК БЕЗ КРАСНОЙ ГРАНИЦЫ
        // Основа фуражки (коричневая)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height * 0.6);
        
        // Тулья (темно-коричневая)
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 2 + 8, this.width / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Золотая кокарда
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, -this.height / 2 + 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Красный центр кокарды
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, -this.height / 2 + 5, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

class RepairExplosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.life = 1.0;
        this.maxLife = 1.0;
    }

    update() {
        this.life -= 0.05;
        return this.life > 0;
    }

    draw() {
        const alpha = this.life;
        const currentSize = this.size * (1.5 - this.life * 0.5);
        
        // Зеленый градиент для эффекта починки
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, currentSize
        );
        gradient.addColorStop(0, `rgba(76, 175, 80, ${alpha})`);
        gradient.addColorStop(0.7, `rgba(76, 175, 80, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(76, 175, 80, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Внешнее кольцо
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 1.2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Плюсик в центре
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y);
        ctx.lineTo(this.x + 8, this.y);
        ctx.moveTo(this.x, this.y - 8);
        ctx.lineTo(this.x, this.y + 8);
        ctx.stroke();
    }
}