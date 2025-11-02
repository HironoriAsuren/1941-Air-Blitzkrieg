// Снаряд игрока 
class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 4;   // Тонкий
        this.height = 12; // Длинный
        this.isFriendly = false;
        this.type = 'normal';
        this.angle = Math.atan2(vy, vx) + Math.PI / 2 // Угол направления
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        return this.y > 0 && this.x > 0 && this.x < CONFIG.CANVAS_WIDTH;
    }

    draw() {
        ctx.save();
        
        // Перемещаем и поворачиваем по направлению движения
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Основной корпус снаряда (вертикальный, но повернутый)
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        gradient.addColorStop(0, this.isFriendly ? '#4caf50' : '#ffeb3b'); // Нос
        gradient.addColorStop(0.7, this.isFriendly ? '#388e3c' : '#ff9800'); // Середина
        gradient.addColorStop(1, this.isFriendly ? '#2e7d32' : '#f57c00');  // Хвост
        
        // Рисуем снаряд как вертикальную линию
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Заостренный нос
        ctx.fillStyle = this.isFriendly ? '#aed581' : '#fff59d';
        ctx.beginPath();
        ctx.moveTo(-this.width/2, -this.height/2);
        ctx.lineTo(this.width/2, -this.height/2);
        ctx.lineTo(0, -this.height/2 - 6); // Острый нос
        ctx.closePath();
        ctx.fill();
        
        // Хвостовые стабилизаторы
        ctx.fillStyle = this.isFriendly ? '#1b5e20' : '#e65100';
        ctx.fillRect(-this.width/2 - 1, this.height/2 - 2, 2, 3);
        ctx.fillRect(this.width/2 - 1, this.height/2 - 2, 2, 3);
        
        ctx.restore();
        
        // След скорости
        this.drawTrail();
    }

    drawTrail() {
        for (let i = 1; i <= 3; i++) {
            const trailX = this.x - this.vx * i * 0.4;
            const trailY = this.y - this.vy * i * 0.4;
            const alpha = 0.7 - i * 0.2;
            const size = 2 - i * 0.5;
            
            ctx.save();
            ctx.translate(trailX, trailY);
            ctx.rotate(this.angle);
            
            ctx.fillStyle = this.isFriendly ? 
                `rgba(76, 175, 80, ${alpha})` : 
                `rgba(255, 235, 59, ${alpha})`;
            ctx.fillRect(-size/2, -size/2, size, size);
            
            ctx.restore();
        }
    }
}

// Снаряд врага
class EnemyProjectile {
    constructor(x, y, vx, vy, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        
        if (type === 'bomb') {
            const originalSize = SPRITE_SIZES.bomb;
            const scale = 0.03;
            this.width = originalSize.width * scale;
            this.height = originalSize.height * scale;
        } else {
            this.width = 4;
            this.height = 8;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === 'bomb' && this.y >= CONFIG.CANVAS_HEIGHT - 50) {
            this.explode();
            return false;
        }
        
        return this.y < CONFIG.CANVAS_HEIGHT && this.x > 0 && this.x < CONFIG.CANVAS_WIDTH;
    }

    explode() {
        // ЗВУК ВЗРЫВА БОМБЫ
        if (this.type === 'bomb' && typeof playAircraftBombExplosion === 'function') {
            playAircraftBombExplosion();
        }
        
        gameState.explosions.push(new Explosion(
            this.x,
            CONFIG.CANVAS_HEIGHT - 50,
            30
        ));
        
        const player = gameState.player;
        const distance = Math.sqrt(
            Math.pow(this.x - (player.x + player.width / 2), 2) +
            Math.pow((CONFIG.CANVAS_HEIGHT - 50) - (player.y + player.height / 2), 2)
        );
        
        if (distance < 80) {
            player.health--;
        }
    }

    draw() {
        if (this.type === 'bullet') {
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x - 2, this.y, this.width, this.height);
        } else if (images.bomb) {
            ctx.drawImage(images.bomb, this.x - this.width / 2, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#757575';
            ctx.fillRect(this.x - 4, this.y, 8, 12);
            ctx.fillRect(this.x - 6, this.y + 12, 12, 4);
        }
    }
}