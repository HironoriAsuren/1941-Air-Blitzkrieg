// Базовый класс снаряда
class Ammo {
    constructor(type, x, y, vx, vy) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 4;
        this.height = 8;
        this.isFriendly = false;
        this.hasHit = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        return this.y > 0 && this.x > 0 && this.x < CONFIG.CANVAS_WIDTH;
    }

    draw() {
        ctx.fillStyle = CONFIG.AMMO_TYPES[this.type].color;
        ctx.fillRect(this.x - 2, this.y, this.width, this.height);
        
        ctx.fillStyle = this.type === 'piercing' ? '#388e3c' : 
                       this.type === 'explosive' ? '#d32f2f' : '#ff9800';
        ctx.fillRect(this.x - 1, this.y + this.height, 2, 6);
    }
}

// Прошивной снаряд
class PiercingAmmo extends Ammo {
    constructor(x, y, vx, vy) {
        super('piercing', x, y, vx, vy);
        this.piercedEnemies = [];
        this.piercedMissiles = [];
        this.maxPierce = 3;
        this.width = 2;
        this.height = 15;
        
        // УСКОРЕНИЕ НА ОСНОВЕ БАЗОВОЙ СКОРОСТИ ИЗ CONFIG
        const baseSpeed = CONFIG.AMMO_SPEED.piercing;
        const currentSpeed = Math.sqrt(vx*vx + vy*vy);
        const speedMultiplier = baseSpeed / currentSpeed;
        
        this.vx = vx * speedMultiplier;
        this.vy = vy * speedMultiplier;
        
        this.trail = [];
        this.maxTrailLength = 6;
        
        console.log('⚡ Прошивной снаряд создан! Скорость:', baseSpeed);
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Быстрое движение без гравитации
        this.x += this.vx;
        this.y += this.vy;
        
        return this.y > 0 && this.x > 0 && this.x < CONFIG.CANVAS_WIDTH && this.y < CONFIG.CANVAS_HEIGHT;
    }

    draw() {
        // Яркий зеленый лазерный след
        this.trail.forEach((point, index) => {
            const alpha = index / this.trail.length * 0.8;
            const size = (index / this.trail.length) * 2 + 0.5;
            
            ctx.strokeStyle = `rgba(76, 175, 80, ${alpha})`;
            ctx.lineWidth = size;
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            if (index > 0) {
                const prevPoint = this.trail[index - 1];
                ctx.lineTo(prevPoint.x, prevPoint.y);
            }
            ctx.stroke();
        });
        
        // Яркое зеленое ядро
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.vx * 0.3, this.y + this.vy * 0.3); // Укоротил линию для скорости
        ctx.stroke();
        
        // Центральная точка
        ctx.fillStyle = '#aed581';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Эффект свечения
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 6);
        gradient.addColorStop(0, 'rgba(76, 175, 80, 0.6)');
        gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Разрывной снаряд - сбалансированный
class ExplosiveAmmo extends Ammo {
    constructor(x, y, vx, vy) {
        super('explosive', x, y, vx, vy);
        this.shrapnelCount = 6;
        this.explosionRadius = 70;
        this.hasExploded = false;
        this.width = 6;
        this.height = 6;
        this.rotation = 0;
        this.sparkTimer = 0;
        
        // СЛУЧАЙНАЯ ВЫСОТА ВЗРЫВА (10-20% от верха экрана)
        const explosionPercent = 0.1 + Math.random() * 0.1; // 10-20% от верха
        this.explosionHeight = CONFIG.CANVAS_HEIGHT * explosionPercent;
        
        console.log('💥 Осколочный снаряд создан! Взрыв на высоте:', Math.round(this.explosionHeight), 
                   `(${Math.round(explosionPercent * 100)}% от верха)`);
    }

    update() {
        if (this.hasExploded) return false;
        
        this.rotation += 0.1;
        this.sparkTimer--;
        
        // Искры при полете
        if (this.sparkTimer <= 0 && Math.random() < 0.3) {
            this.createSpark();
            this.sparkTimer = 5;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        // АВТОМАТИЧЕСКИЙ ВЗРЫВ КОГДА СНАРЯД ДОСТИГАЕТ СЛУЧАЙНОЙ ВЫСОТЫ (10-20% от верха)
        if (this.y <= this.explosionHeight) {
            console.log('💥 Автоматический взрыв осколочного снаряда на высоте:', Math.round(this.y));
            this.explode();
            return false;
        }
        
        // АВТОМАТИЧЕСКИЙ ВЗРЫВ РЯДОМ С БОССОМ (кроме Ямато)
        if (gameState && gameState.boss && gameState.boss.type !== 'yamato') {
            const boss = gameState.boss;
            const distance = Math.sqrt(
                Math.pow(this.x - (boss.x + boss.width/2), 2) +
                Math.pow(this.y - (boss.y + boss.height/2), 2)
            );
            
            // Взрываемся если близко к боссу
            if (distance < 50) {
                console.log('💥 Осколочный снаряд взорвался рядом с боссом!');
                this.explode();
                return false;
            }
        }
        
        // Также взрываемся если достигли верха экрана (защита)
        if (this.y <= 0) {
            console.log('💥 Осколочный снаряд достиг верха экрана!');
            this.explode();
            return false;
        }
        
        return this.y > 0 && this.x > 0 && this.x < CONFIG.CANVAS_WIDTH;
    }

    createSpark() {
        if (gameState && gameState.shrapnelParticles) {
            gameState.shrapnelParticles.push({
                x: this.x + (Math.random() - 0.5) * 8,
                y: this.y + (Math.random() - 0.5) * 8,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 10,
                update: function() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.life--;
                    return this.life > 0;
                },
                draw: function() {
                    ctx.fillStyle = `rgba(255, 235, 59, ${this.life/10})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
    }

    draw() {
        if (this.hasExploded) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Вращающийся снаряд с градиентом
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 3);
        gradient.addColorStop(0, '#ffeb3b');
        gradient.addColorStop(0.7, '#ff9800');
        gradient.addColorStop(1, '#ff4444');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Индикатор близкого взрыва (мигает при приближении к высоте взрыва)
        const distanceToExplosion = this.y - this.explosionHeight;
        if (distanceToExplosion < 100 && distanceToExplosion > 0) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            const intensity = 1 - (distanceToExplosion / 100);
            
            ctx.strokeStyle = `rgba(255, 0, 0, ${pulse * intensity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.stroke();
            
            // Линия до точки взрыва (визуальная подсказка)
            if (distanceToExplosion < 50) {
                ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 * intensity})`;
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -distanceToExplosion);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        
        ctx.restore();
    }

    // ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ЦВЕТОВ ЛУЧЕЙ
    getRandomRayColor() {
        const yellowColors = [
            '#FFFF00', // Ярко-желтый
            '#FFEB3B', // Светло-желтый  
            '#FFD600', // Золотисто-желтый
            '#FFC400', // Оранжево-желтый
            '#FFAB00', // Темно-желтый
            '#FFD54F', // Светло-золотой
            '#FFCA28', // Ярко-золотой
            '#FFB300', // Янтарный
            '#FFF59D', // Бледно-желтый
            '#FDD835'  // Яркий желтый
        ];
        return yellowColors[Math.floor(Math.random() * yellowColors.length)];
    }

    // ammo.js - в классе ExplosiveAmmo, метод explode()
    explode() {
        if (this.hasExploded) return;
        this.hasExploded = true;
        
        console.log('💥 Взрыв осколочного снаряда на высоте:', Math.round(this.y));
        
        // Определяем тип взрыва: автоматический или от попадания
        const isAutoExplosion = !this.hasHitEnemy; // или другая логика определения
        
        // ЗВУК ВЗРЫВА ОСКОЛОЧНОГО СНАРЯДА (только для автоматического взрыва)
        if (typeof playThirdAmmoExplosion === 'function' && isAutoExplosion) {
            playThirdAmmoExplosion();
        }
        
        // Взрыв
        gameState.explosions.push(new Explosion(this.x, this.y, 30));
        screenShake = 6;
        
        // ОСКОЛКИ С СЛУЧАЙНЫМИ ОТКЛОНЕНИЯМИ
        for (let i = 0; i < this.shrapnelCount; i++) {
            // БАЗОВЫЙ УГОЛ + СЛУЧАЙНОЕ ОТКЛОНЕНИЕ
            const baseAngle = (i / this.shrapnelCount) * Math.PI * 2;
            const angleDeviation = (Math.random() - 0.5) * 0.8;
            const finalAngle = baseAngle + angleDeviation;
            
            // СЛУЧАЙНАЯ СКОРОСТЬ И ДАЛЬНОСТЬ - УВЕЛИЧИВАЕМ СКОРОСТЬ В 3 РАЗА, УМЕНЬШАЕМ ВРЕМЯ ЖИЗНИ В 3 РАЗА
            const baseSpeed = (3 + Math.random() * 2) * 3; // УВЕЛИЧЕНО В 3 РАЗА
            const speedMultiplier = 0.8 + Math.random() * 0.4;
            const finalSpeed = baseSpeed * speedMultiplier;
            
            const life = 15; // УМЕНЬШЕНО В 3 РАЗА (было 46)
            const shrapnelSize = 2 * (0.8 + Math.random() * 0.4); // Фиксированный размер

            const shrapnel = {
                x: this.x,
                y: this.y,
                vx: Math.cos(finalAngle) * finalSpeed,
                vy: Math.sin(finalAngle) * finalSpeed,
                life: life,
                maxLife: life,
                damage: 1,
                trail: [],
                maxTrailLength: 8,
                hasRay: Math.random() < 0.7,
                rayColor: this.getRandomRayColor(),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                sizeVariation: 0.8 + Math.random() * 0.4,
                shrapnelSize: shrapnelSize, // Фиксированный размер
                update: function() {
                    // Сохраняем позиции для следа
                    this.trail.push({ x: this.x, y: this.y });
                    if (this.trail.length > this.maxTrailLength) {
                        this.trail.shift();
                    }
                    
                    // ВРАЩЕНИЕ ОСКОЛКА
                    this.rotation += this.rotationSpeed;
                    
                    // СЛУЧАЙНЫЕ КОЛЕБАНИЯ ТРАЕКТОРИИ
                    if (Math.random() < 0.1) {
                        this.vx += (Math.random() - 0.5) * 0.3;
                        this.vy += (Math.random() - 0.5) * 0.3;
                    }
                    
                    this.x += this.vx;
                    this.y += this.vy;
                    this.life--;
                    
                    // Нанесение урона врагам И БОССАМ - РАДИУС ЗАДЕВАНИЯ = РАДИУСУ ПОЛЕТА
                    if (gameState && this.damage > 0) {
                        // Проверяем обычных врагов - РАДИУС = РАЗМЕРУ ОСКОЛКА
                        if (gameState.enemies) {
                            for (let enemy of gameState.enemies) {
                                if (enemy && !enemy.isCrashing) {
                                    const distance = Math.sqrt(
                                        Math.pow(this.x - (enemy.x + enemy.width/2), 2) +
                                        Math.pow(this.y - (enemy.y + enemy.height/2), 2)
                                    );
                                    if (distance < this.shrapnelSize * 2) { // РАДИУС = РАЗМЕРУ ОСКОЛКА
                                        enemy.takeDamage();
                                        this.damage = 0;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        // ПРОВЕРЯЕМ БОССА (кроме Ямато) - РАДИУС = РАЗМЕРУ ОСКОЛКА
                        if (gameState.boss && gameState.boss.type !== 'yamato' && this.damage > 0) {
                            const boss = gameState.boss;
                            const distance = Math.sqrt(
                                Math.pow(this.x - (boss.x + boss.width/2), 2) +
                                Math.pow(this.y - (boss.y + boss.height/2), 2)
                            );
                            if (distance < this.shrapnelSize * 2) { // РАДИУС = РАЗМЕРУ ОСКОЛКА
                                boss.takeDamage();
                                this.damage = 0;
                                console.log('🎯 Осколок попал в босса!');
                            }
                        }
                    }
                    
                    return this.life > 0; // Просто исчезает когда life <= 0
                },
                draw: function() {
                    // РИСУЕМ ЛУЧ (если есть) - оптимизированная версия
                    if (this.hasRay && this.trail.length > 1) {
                        this.drawRay();
                    }
                    
                    // РИСУЕМ СЛЕД - оптимизированная версия
                    this.drawTrail();
                    
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    
                    // ОСНОВНОЙ ОСКОЛОК (фиксированный размер)
                    const baseSize = this.shrapnelSize;
                    ctx.fillStyle = 'rgba(255, 235, 59, 1)'; // Полностью непрозрачный желтый
                    
                    // СЛУЧАЙНАЯ ФОРМА ОСКОЛКА (треугольник или ромб)
                    if (Math.random() < 0.7) {
                        // Треугольник
                        ctx.beginPath();
                        ctx.moveTo(0, -baseSize);
                        ctx.lineTo(baseSize, baseSize);
                        ctx.lineTo(-baseSize, baseSize);
                        ctx.closePath();
                    } else {
                        // Ромб
                        ctx.beginPath();
                        ctx.moveTo(0, -baseSize);
                        ctx.lineTo(baseSize, 0);
                        ctx.lineTo(0, baseSize);
                        ctx.lineTo(-baseSize, 0);
                        ctx.closePath();
                    }
                    ctx.fill();
                    
                    // ЯРКОЕ ЯДРО ОСКОЛКА (фиксированный размер)
                    ctx.fillStyle = 'rgba(255, 255, 200, 1)'; // Светло-желтое ядро
                    ctx.beginPath();
                    ctx.arc(0, 0, baseSize * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                    
                    // СВЕЧЕНИЕ УБРАНО - больше нет этого кода
                },
                // МЕТОД ДЛЯ ОТРИСОВКИ ЛУЧА (фиксированный размер)
                drawRay: function() {
                if (this.trail.length < 2) return;
                
                const startPoint = this.trail[0];
                const endPoint = this.trail[this.trail.length - 1];
                
                // Фиксированная ширина луча
                const rayWidth = 1.5;
                const innerRayWidth = 0.8;
                const glowWidth = 4;
                
                // СЛУЧАЙНЫЙ ОТТЕНОК ЖЕЛТОГО ДЛЯ ОСНОВНОГО ЛУЧА
                const yellowHues = [
                    '#FFFF00', // Ярко-желтый
                    '#FFEB3B', // Светло-желтый  
                    '#FFD600', // Золотисто-желтый
                    '#FFC400', // Оранжево-желтый
                    '#FFAB00', // Темно-желтый
                    '#FFD54F', // Светло-золотой
                    '#FFCA28', // Ярко-золотой
                    '#FFB300'  // Янтарный
                ];
                const randomYellow = yellowHues[Math.floor(Math.random() * yellowHues.length)];
                
                // ОСНОВНОЙ ЛУЧ С ПЛАВНОЙ ПРОЗРАЧНОСТЬЮ С ОБЕИХ СТОРОН
                const gradient = ctx.createLinearGradient(
                    startPoint.x, startPoint.y,
                    endPoint.x, endPoint.y
                );
                gradient.addColorStop(0, randomYellow.replace(')', ', 0.15)')); // 15% прозрачности в начале
                gradient.addColorStop(0.15, randomYellow.replace(')', ', 1)')); // 100% в середине начала
                gradient.addColorStop(0.85, randomYellow.replace(')', ', 1)')); // 100% в середине конца
                gradient.addColorStop(1, randomYellow.replace(')', ', 0.15)')); // 15% прозрачности в конце
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = rayWidth;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                ctx.stroke();
                
                // ВНУТРЕННИЙ ЯРКИЙ ЛУЧ С ПЛАВНОЙ ПРОЗРАЧНОСТЬЮ С ОБЕИХ СТОРОН
                const innerGradient = ctx.createLinearGradient(
                    startPoint.x, startPoint.y,
                    endPoint.x, endPoint.y
                );
                innerGradient.addColorStop(0, 'rgba(255, 255, 200, 0.12)'); // 15% от 0.8 = 0.12 в начале
                innerGradient.addColorStop(0.15, 'rgba(255, 255, 200, 0.8)'); // 80% в середине начала
                innerGradient.addColorStop(0.85, 'rgba(255, 255, 200, 0.8)'); // 80% в середине конца
                innerGradient.addColorStop(1, 'rgba(255, 255, 200, 0.12)'); // 15% от 0.8 = 0.12 в конце
                
                ctx.strokeStyle = innerGradient;
                ctx.lineWidth = innerRayWidth;
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                ctx.stroke();
                
                // СВЕЧЕНИЕ ВОКРУГ ЛУЧА С ПЛАВНОЙ ПРОЗРАЧНОСТЬЮ С ОБЕИХ СТОРОН
                const glowGradient = ctx.createLinearGradient(
                    startPoint.x, startPoint.y,
                    endPoint.x, endPoint.y
                );
                glowGradient.addColorStop(0, 'rgba(255, 255, 100, 0.045)'); // 15% от 0.3 = 0.045 в начале
                glowGradient.addColorStop(0.15, 'rgba(255, 255, 100, 0.3)'); // 30% в середине начала
                glowGradient.addColorStop(0.85, 'rgba(255, 255, 100, 0.3)'); // 30% в середине конца
                glowGradient.addColorStop(1, 'rgba(255, 255, 100, 0.045)'); // 15% от 0.3 = 0.045 в конце
                
                ctx.strokeStyle = glowGradient;
                ctx.lineWidth = glowWidth;
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                ctx.stroke();
            },
                // МЕТОД ДЛЯ ОТРИСОВКИ СЛЕДА (фиксированный размер)
                drawTrail: function() {
                    this.trail.forEach((point, index) => {
                        const trailAlpha = (index / this.trail.length) * 0.5;
                        const size = (index / this.trail.length) * 1.5 * this.sizeVariation;
                        
                        ctx.fillStyle = `rgba(255, 200, 50, ${trailAlpha})`;
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
            };
            
            gameState.shrapnelParticles.push(shrapnel);
        }
        
        // Наносим урон врагам в радиусе взрыва (ВКЛЮЧАЯ БОССА)
        if (gameState && gameState.enemies) {
            gameState.enemies.forEach(enemy => {
                if (enemy && !enemy.isCrashing) {
                    const distance = Math.sqrt(
                        Math.pow(this.x - (enemy.x + enemy.width/2), 2) +
                        Math.pow(this.y - (enemy.y + enemy.height/2), 2)
                    );
                    
                    if (distance < this.explosionRadius) {
                        if (distance < this.explosionRadius / 3) {
                            enemy.takeDamage();
                            enemy.takeDamage();
                            console.log('🎯 Двойной урон в эпицентре!');
                        } else {
                            enemy.takeDamage();
                        }
                    }
                }
            });
        }
        
        // НАНОСИМ УРОН БОССУ В РАДИУСЕ ВЗРЫВА (кроме Ямато)
        if (gameState && gameState.boss && gameState.boss.type !== 'yamato') {
            const boss = gameState.boss;
            const distance = Math.sqrt(
                Math.pow(this.x - (boss.x + boss.width/2), 2) +
                Math.pow(this.y - (boss.y + boss.height/2), 2)
            );
            
            if (distance < this.explosionRadius + 20) {
                if (distance < (this.explosionRadius + 20) / 3) {
                    boss.takeDamage();
                    boss.takeDamage();
                    console.log('💥 Двойной урон боссу от взрыва!');
                } else {
                    boss.takeDamage();
                    console.log('💥 Урон боссу от взрыва!');
                }
            }
        }
    }
}