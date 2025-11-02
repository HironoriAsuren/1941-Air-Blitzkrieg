// Управление вводом
let keys = {};
let mouseX = 0, mouseY = 0;
let leftMouseDown = false;
let rightMouseDown = false;

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = true;
        
        if (e.key === 'ArrowLeft') keys['arrowleft'] = true;
        if (e.key === 'ArrowRight') keys['arrowright'] = true;
        if (e.key === 'ArrowUp') keys['arrowup'] = true;
        if (e.key === 'ArrowDown') keys['arrowdown'] = true;
        
        // Починка по нажатию E/У
        if ((key === 'e' || key === 'у') && gameState && gameState.gameActive) {
            e.preventDefault();
            repairPlayer();
        }
        
        // Быстрый выбор снарядов цифрами 1, 2, 3
        if ((key === '1' || key === '2' || key === '3') && gameState && gameState.gameActive) {
            e.preventDefault();
            const ammoTypes = ['normal', 'piercing', 'explosive'];
            const index = parseInt(key) - 1;
            
            if (ammoTypes[index] && gameState.player.ammoInventory[ammoTypes[index]] > 0) {
                // Переключаем тип снаряда
                gameState.player.currentAmmoType = ammoTypes[index];
                updateAmmoSelectionUI();
                
                // Визуальная обратная связь
                showAmmoSwitchEffect(ammoTypes[index]);
                
                console.log(`🎯 Выбран ${ammoTypes[index]} снаряд`);
            } else {
                // Сообщение если нет снарядов этого типа
                showMessage(`Нет ${getAmmoName(ammoTypes[index])} снарядов!`, 'warning');
            }
        }
        
        // Апокалипсис по нажатию W/Ц
        if ((key === 'w' || key === 'ц') && gameState && gameState.gameActive) {
            e.preventDefault();
            startAirApocalypse();
        }
        
        // Переключение типа снарядов цифрами
        if (key === '1' || key === '2' || key === '3') {
            e.preventDefault();
            if (gameState && gameState.gameActive) {
                const ammoTypes = ['normal', 'piercing', 'explosive'];
                const index = parseInt(key) - 1;
                if (ammoTypes[index] && gameState.player.ammoInventory[ammoTypes[index]] > 0) {
                    gameState.player.currentAmmoType = ammoTypes[index];
                    updateAmmoSelectionUI();
                }
            }
        }
        
        if (e.key === 'Shift') {
            e.preventDefault();
            if (gameState && gameState.gameActive) {
                gameState.player.isMoving = !gameState.player.isMoving;
                updateModeIndicator();
            }
        }
        
        if ((e.key === 'q' || e.key === 'й') && gameState && gameState.gameActive) {
            callFighter();
        }
    });

    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = false;
        
        if (e.key === 'ArrowLeft') keys['arrowleft'] = false;
        if (e.key === 'ArrowRight') keys['arrowright'] = false;
        if (e.key === 'ArrowUp') keys['arrowup'] = false;
        if (e.key === 'ArrowDown') keys['arrowdown'] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        
        // ПРАВИЛЬНЫЙ РАСЧЕТ КООРДИНАТ С УЧЕТОМ МАСШТАБИРОВАНИЯ CANVAS
        const scaleX = canvas.width / rect.width;    // Масштаб по X
        const scaleY = canvas.height / rect.height;  // Масштаб по Y
        
        mouseX = (e.clientX - rect.left) * scaleX;
        mouseY = (e.clientY - rect.top) * scaleY;
        
        // Автоматическая стрельба при зажатых кнопках мыши
        if ((leftMouseDown || rightMouseDown) && gameState && gameState.gameActive) {
            const projectile = gameState.player.shoot(mouseX, mouseY);
            if (projectile) {
                gameState.projectiles.push(projectile);
            }
        }
    });

    // СТРЕЛЬБА НА ЛЕВУЮ КНОПКУ МЫШИ
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        mouseX = (e.clientX - rect.left) * scaleX;
        mouseY = (e.clientY - rect.top) * scaleY;
        
        if (e.button === 0) { // Левая кнопка мыши
            leftMouseDown = true;
            
            if (gameState && gameState.gameActive) {
                const projectile = gameState.player.shoot(mouseX, mouseY);
                if (projectile) {
                    gameState.projectiles.push(projectile);
                }
            }
        }
        
        if (e.button === 2) { // Правая кнопка мыши
            rightMouseDown = true;
            
            if (gameState && gameState.gameActive) {
                const projectile = gameState.player.shoot(mouseX, mouseY);
                if (projectile) {
                    gameState.projectiles.push(projectile);
                }
            }
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) { // Левая кнопка мыши
            leftMouseDown = false;
        }
        if (e.button === 2) { // Правая кнопка мыши
            rightMouseDown = false;
        }
    });

    // Разрешаем контекстное меню, но предотвращаем его по умолчанию
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        // Можно добавить кастомное контекстное меню если нужно
    });

    // Обработка клика для выбора снарядов
    document.addEventListener('click', (e) => {
        if (e.target.closest('.ammo-option') && gameState && gameState.gameActive) {
            const option = e.target.closest('.ammo-option');
            const type = option.dataset.type;
            if (gameState.player.ammoInventory[type] > 0) {
                gameState.player.currentAmmoType = type;
                updateAmmoSelectionUI();
            }
        }
    });
}