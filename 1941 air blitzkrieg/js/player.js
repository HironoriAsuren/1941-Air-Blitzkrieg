class Player {
    constructor() {
        this.width = 40;
        this.height = 60;
        this.x = CONFIG.CANVAS_WIDTH / 2 - this.width / 2;
        this.y = CONFIG.CANVAS_HEIGHT - 100;
        this.speed = 3;
        this.isMoving = false;
        this.shootCooldown = 0;
        this.health = 5;
        this.maxHealth = 5; // Добавляем максимальное здоровье
        this.currentAmmoType = 'normal';
        this.ammoInventory = {
            normal: 270,
            piercing: 0,
            explosive: 0
        };
        this.ammoSwitchEffect = 0;
    }
    
    // Можно добавить метод для безопасного увеличения здоровья
    repair() {
        if (this.health < this.maxHealth) {
            this.health++;
            return true;
        }
        return false;
    }

    update() {
        if (this.isMoving) {
            // ДВИЖЕНИЕ ВЛЕВО: A/Ф/СтрелкаВлево
            if ((keys['a'] || keys['ф'] || keys['arrowleft']) && this.x > 0) {
                this.x -= this.speed;
            }
            
            // ДВИЖЕНИЕ ВПРАВО: S/Ы/СтрелкаВправо
            if ((keys['s'] || keys['ы'] || keys['arrowright']) && this.x < CONFIG.CANVAS_WIDTH - this.width) {
                this.x += this.speed;
            }
        }

        if (this.shootCooldown > 0) this.shootCooldown--;
        
        // Автоматическая стрельба при зажатых кнопках мыши (ЛКМ или ПКМ)
        if ((leftMouseDown || rightMouseDown) && this.shootCooldown === 0 && this.ammoInventory[this.currentAmmoType] > 0) {
            const projectile = this.shoot(mouseX, mouseY);
            if (projectile && gameState) {
                gameState.projectiles.push(projectile);
            }
        }
        
        // Уменьшаем таймер эффекта переключения
        if (this.ammoSwitchEffect > 0) this.ammoSwitchEffect--;
        
        // Переключение типа снарядов цифрами
        if (keys['1'] && this.ammoInventory.normal > 0) this.currentAmmoType = 'normal';
        if (keys['2'] && this.ammoInventory.piercing > 0) this.currentAmmoType = 'piercing';
        if (keys['3'] && this.ammoInventory.explosive > 0) this.currentAmmoType = 'explosive';
    }

    shoot(targetX, targetY) {
        if (!this.isMoving && this.shootCooldown === 0 && this.ammoInventory[this.currentAmmoType] > 0) {
            this.shootCooldown = CONFIG.AMMO_COOLDOWN[this.currentAmmoType];
            this.ammoInventory[this.currentAmmoType]--;
            
            // ТОЧНАЯ ПОЗИЦИЯ ВЫСТРЕЛА - центр ствола
            const barrelX = this.x + this.width / 2;
            const barrelY = this.y; // самый верх пушки
            
            // ПРЯМОЙ РАСЧЕТ НАПРАВЛЕНИЯ К КУРСОРУ
            const dx = targetX - barrelX;
            const dy = targetY - barrelY;
            
            // Нормализуем вектор направления
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance === 0) return null; // защита от деления на ноль
            
            const speed = CONFIG.AMMO_SPEED[this.currentAmmoType];
            const speedX = (dx / distance) * speed;
            const speedY = (dy / distance) * speed;
            
            console.log('🎯 Выстрел:', {
                from: `(${barrelX.toFixed(1)}, ${barrelY.toFixed(1)})`,
                to: `(${targetX.toFixed(1)}, ${targetY.toFixed(1)})`,
                direction: `(${speedX.toFixed(1)}, ${speedY.toFixed(1)})`,
                angle: Math.atan2(speedY, speedX).toFixed(2)
            });
            
            let projectile;
            switch(this.currentAmmoType) {
                case 'piercing':
                    projectile = new PiercingAmmo(barrelX, barrelY, speedX, speedY);
                    break;
                case 'explosive':
                    projectile = new ExplosiveAmmo(barrelX, barrelY, speedX, speedY);
                    break;
                default:
                    projectile = new Projectile(barrelX, barrelY, speedX, speedY);
            }
            
            // ВОСПРОИЗВЕДЕНИЕ ЗВУКА ВЫСТРЕЛА
            if (typeof playPlayerShoot === 'function') {
                playPlayerShoot(this.currentAmmoType);
            }
            
            return projectile;
        }
        return null;
    }

    addAmmo(type, amount) {
        this.ammoInventory[type] += amount;
    }

    draw() {
        // Основа ПВО
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(this.x, this.y + 20, this.width, 40);
        
        // Ствол - точно по центру
        ctx.fillStyle = '#5d4037';
        const barrelWidth = 10;
        const barrelHeight = 30;
        const barrelX = this.x + this.width / 2 - barrelWidth / 2;
        const barrelY = this.y;
        ctx.fillRect(barrelX, barrelY, barrelWidth, barrelHeight);
        
        // Башня
        ctx.fillStyle = '#795548';
        ctx.fillRect(this.x + 5, this.y + 10, this.width - 10, 15);
        
        // Индикатор режима
        ctx.fillStyle = this.isMoving ? '#ff4444' : '#4caf50';
        ctx.fillRect(this.x + this.width / 2 - 3, this.y + 35, 6, 6);
        
        // Индикатор типа снаряда
        this.drawAmmoIndicator();

    }
    
    drawAmmoIndicator() {
        const colors = {
            normal: '#ffeb3b',
            piercing: '#4caf50',
            explosive: '#ff4444'
        };
        
        let ammoColor = colors[this.currentAmmoType];
        
        // Эффект переключения (пульсация)
        if (this.ammoSwitchEffect > 0) {
            const pulse = Math.sin(Date.now() * 0.1) * 0.5 + 0.5;
            const r = parseInt(ammoColor.slice(1, 3), 16);
            const g = parseInt(ammoColor.slice(3, 5), 16);
            const b = parseInt(ammoColor.slice(5, 7), 16);
            ammoColor = `rgb(${r}, ${g}, ${b})`;
        }
        
        ctx.fillStyle = ammoColor;
        ctx.fillRect(this.x + this.width / 2 - 2, this.y + 45, 4, 8);
        
        // Обводка при эффекте переключения
        if (this.ammoSwitchEffect > 0) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x + this.width / 2 - 3, this.y + 44, 6, 10);
        }
    }

}