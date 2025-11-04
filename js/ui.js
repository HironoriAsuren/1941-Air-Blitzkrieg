// ui.js - ОБНОВЛЕННЫЙ с кастомизированными модальными окнами
console.log('✅ ui.js загружен');

// Добавляем систему прогресса
let gameProgress = {
    unlockedLevels: 1, // По умолчанию открыт только 1 уровень
    completedLevels: 0
};

// Функция для создания модального окна
function createModal(title, message, buttonText = 'OK', onConfirm = null, showCancel = false, cancelText = 'Отмена') {
    // Удаляем существующее модальное окно если есть
    const existingModal = document.getElementById('customModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'custom-modal';
    
    // Добавляем кнопку отмены если нужно
    const cancelButton = showCancel ? 
        `<button class="btn modal-btn-cancel" id="modalCancelBtn">${cancelText}</button>` : '';
    
    const buttonsHTML = showCancel ? 
        `<div class="modal-buttons">
            <button class="btn modal-btn-cancel" id="modalCancelBtn">${cancelText}</button>
            <button class="btn modal-btn-confirm" id="modalOkBtn">${buttonText}</button>
        </div>` :
        `<div class="modal-footer">
            <button class="btn modal-btn" id="modalOkBtn">${buttonText}</button>
        </div>`;

    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">${title}</h2>
            </div>
            <div class="modal-body">
                <div class="modal-message">${message}</div>
            </div>
            ${buttonsHTML}
        </div>
    `;

    document.body.appendChild(modal);

    // Обработчик кнопки подтверждения
    document.getElementById('modalOkBtn').addEventListener('click', () => {
        closeModal();
        if (onConfirm && typeof onConfirm === 'function') {
            onConfirm();
        }
    });

    // Обработчик кнопки отмены
    if (showCancel) {
        document.getElementById('modalCancelBtn').addEventListener('click', () => {
            closeModal();
        });
    }

    // Закрытие по клику на overlay
    modal.querySelector('.modal-overlay').addEventListener('click', () => {
        closeModal();
    });

    // Закрытие по ESC
    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleKeydown);
        }
    };
    document.addEventListener('keydown', handleKeydown);

    return modal;
}

// Функция закрытия модального окна
function closeModal() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.remove();
    }
}

// Система достижений
const ACHIEVEMENTS = {
    bavaria: {
        id: 'bavaria',
        title: 'Бавария',
        description: 'Wilkommen. Начните 1 уровень',
        image: 'bavaria.png',
        unlocked: false
    },
    first_blood: {
        id: 'first_blood',
        title: 'Первая кровь',
        description: 'Сбейте ваш первый самолет',
        image: 'first_blood.png',
        unlocked: false
    },
    face_in_dirt: {
        id: 'face_in_dirt',
        title: 'Лицом в грязь',
        description: 'Проиграйте впервые',
        image: 'face_in_dirt.png',
        unlocked: false
    },
    control_purchase: {
        id: 'control_purchase',
        title: 'Контрольная закупка',
        description: 'Купите что-то в магазине',
        image: 'control_purchase.png',
        unlocked: false
    },
    three_in_row: {
        id: 'three_in_row',
        title: 'Три в ряд',
        description: 'Купите все 3 вида снарядов',
        image: 'three_in_row.jpg',
        unlocked: false
    },
    air_support: {
        id: 'air_support',
        title: 'Поддержка с воздуха!',
        description: 'Призовите на помощь союзный самолет',
        image: 'air_support.png',
        unlocked: false
    },
    apocalypse: {
        id: 'apocalypse',
        title: 'Апокалипсис',
        description: 'Опробуйте функцию сотен разрывающихся снарядов в небе!',
        image: 'apocalypse.png',
        unlocked: false
    },
    engineer: {
        id: 'engineer',
        title: 'Инженер',
        description: 'Почините вашу ПВО',
        image: 'engineer.png',
        unlocked: false
    },
    general: {
        id: 'general',
        title: 'Генерал',
        description: 'Одолейте Эриха Шольца и его летающую тарелку!',
        image: 'erich_scholz.png',
        unlocked: false
    },
    kyoto: {
        id: 'kyoto',
        title: 'Киото',
        description: 'Konnichiwa. Начните 6 уровень',
        image: 'kyoto.png',
        unlocked: false
    },
    senbonsakura: {
        id: 'senbonsakura',
        title: 'Сенбонсакура!',
        description: 'Впервые ощутите погоду сакуры',
        image: 'senbonsakura.png',
        unlocked: false
    },
    admiral: {
        id: 'admiral',
        title: 'Адмирал',
        description: 'Одолейте Цусиму Якамото и переживите все атаки Ямато!',
        image: 'tsushima_yakamoto.png',
        unlocked: false
    }
};

// Функции для работы с достижениями
function loadAchievements() {
    const saved = localStorage.getItem('airBlitzkriegAchievements');
    if (saved) {
        const savedAchievements = JSON.parse(saved);
        Object.keys(savedAchievements).forEach(key => {
            if (ACHIEVEMENTS[key]) {
                ACHIEVEMENTS[key].unlocked = savedAchievements[key].unlocked;
            }
        });
    }
    
    console.log('✅ Достижения загружены:', getUnlockedAchievementsCount(), 'из', Object.keys(ACHIEVEMENTS).length);
}

function saveAchievements() {
    localStorage.setItem('airBlitzkriegAchievements', JSON.stringify(ACHIEVEMENTS));
}

function unlockAchievement(achievementId) {
    if (ACHIEVEMENTS[achievementId] && !ACHIEVEMENTS[achievementId].unlocked) {
        ACHIEVEMENTS[achievementId].unlocked = true;
        saveAchievements();
        
        // ВОСПРОИЗВОДИМ ЗВУК ДОСТИЖЕНИЯ
        if (typeof playAchievementSound === 'function') {
            playAchievementSound();
        }
        
        // Показываем уведомление о получении достижения
        showAchievementNotification(ACHIEVEMENTS[achievementId]);
        
        console.log(`🎉 Получено достижение: ${ACHIEVEMENTS[achievementId].title}`);
        return true;
    }
    return false;
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-notification-content">
            <div class="achievement-notification-icon">
                <div class="achievement-image-small ${achievement.unlocked ? 'unlocked' : 'locked'}">
                    <img src="images/${achievement.image}" alt="${achievement.title}">
                </div>
            </div>
            <div class="achievement-notification-text">
                <div class="achievement-notification-title">Достижение получено!</div>
                <div class="achievement-notification-name">${achievement.title}</div>
                <div class="achievement-notification-desc">${achievement.description}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Функция для показа окна достижений
function showAchievements() {
    const modal = document.createElement('div');
    modal.id = 'achievementsModal';
    modal.className = 'achievements-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="achievements-content">
            <div class="achievements-header">
                <h2>🏆 Достижения</h2>
                <button class="close-achievements-btn" onclick="closeAchievements()">×</button>
            </div>
            <div class="achievements-list" id="achievementsList">
                ${generateAchievementsHTML()}
            </div>
            <div class="achievements-footer">
                <div class="achievements-stats">
                    Получено: <span id="achievementsCount">${getUnlockedAchievementsCount()}</span> / ${Object.keys(ACHIEVEMENTS).length}
                </div>
                <button class="btn achievements-close-btn" onclick="closeAchievements()">Закрыть</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Закрытие по ESC
    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            closeAchievements();
        }
    };
    document.addEventListener('keydown', handleKeydown);

    modal.querySelector('.modal-overlay').addEventListener('click', closeAchievements);
}

function generateAchievementsHTML() {
    return Object.values(ACHIEVEMENTS).map(achievement => `
        <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-image">
                <img src="images/${achievement.image}" alt="${achievement.title}">
            </div>
            <div class="achievement-info">
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        </div>
    `).join('');
}

function getUnlockedAchievementsCount() {
    return Object.values(ACHIEVEMENTS).filter(ach => ach.unlocked).length;
}

function closeAchievements() {
    const modal = document.getElementById('achievementsModal');
    if (modal) {
        modal.remove();
    }
    document.removeEventListener('keydown', handleKeydown);
}

// Обновляем главное меню с вертикальной ориентацией
function showMainMenu() {
    hideAllScreens();
    document.getElementById('mainMenu').classList.remove('hidden');
    currentScreen = 'mainMenu';
    
    // Загружаем достижения при показе меню
    loadAchievements();
    
    // ВОССТАНАВЛИВАЕМ ОТОБРАЖЕНИЕ СЧЕТЧИКА САМОЛЕТОВ
    const enemiesCounter = document.getElementById('enemiesCounter');
    if (enemiesCounter) {
        enemiesCounter.style.display = 'block';
    }
}

// Функция для показа окна завершения уровня
function showLevelCompleteModal(level, destroyedCount, hasBoss = false, bossDefeated = false, nextLevelUnlocked = false) {
    const timePlayed = gameState ? formatTime(gameState.gameTime) : '0:00';
    
    let message = `Уровень ${level} пройден!<br><br>`;
    message += `⏱️ Время: ${timePlayed}<br>`;
    message += `✈️ Уничтожено самолетов: ${destroyedCount}`;
    
    if (hasBoss) {
        if (bossDefeated) {
            message += `<br>🎉 БОСС уничтожен! +100 шестерней`;
        } else {
            message += `<br>⚠️ БОСС остался жив!`;
        }
    }
    
    if (nextLevelUnlocked) {
        message += `<br><br>🎊 Уровень ${level + 1} разблокирован!`;
    }

    createModal('🎉 ПОБЕДА!', message, 'Продолжить', () => {
        showLevelSelect();
    });
}

// Функция для показа окна поражения
function showGameOverModal(level, destroyedCount, hasBoss = false) {
    const timePlayed = gameState ? formatTime(gameState.gameTime) : '0:00';
    
    let message = `Уровень ${level} не пройден<br><br>`;
    message += `⏱️ Время: ${timePlayed}<br>`;
    message += `✈️ Уничтожено самолетов: ${destroyedCount}`;
    
    if (hasBoss) {
        message += `<br>⚠️ БОСС остался жив!`;
    }
    
    message += `<br><br>Попробуйте еще раз!`;

    createModal('💀 ПОРАЖЕНИЕ', message, 'Повторить', () => {
        showLevelSelect();
    });
}

// Функция для показа окна бесконечного режима
function showInfiniteGameOverModal(destroyedCount, waveNumber, bossDefeated = false) {
    const timePlayed = gameState ? formatTime(gameState.gameTime) : '0:00';
    
    let message = `Бесконечная война окончена!<br><br>`;
    message += `⏱️ Время выживания: ${timePlayed}<br>`;
    message += `✈️ Уничтожено самолетов: ${destroyedCount}<br>`;
    message += `🌊 Достигнутая волна: ${waveNumber}`;
    
    if (bossDefeated) {
        message += `<br>🎉 БОСС повержен!`;
    }
    
    message += `<br><br>Это был достойный бой!`;

    createModal('∞ КОНЕЦ БИТВЫ', message, 'В меню', () => {
        showLevelSelect();
    });
}

// Функция для показа информационного сообщения
function showInfoModal(title, message) {
    createModal(title, message, 'Понятно');
}

// Функция для показа сообщения о недоступном уровне
function showLevelLockedModal() {
    createModal('🔒 Уровень заблокирован', 'Этот уровень еще не доступен! Сначала пройдите предыдущие уровни.', 'OK');
}

// Функция для форматирования времени
function formatTime(gameTime) {
    const totalSeconds = Math.floor(gameTime / 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Функция для сохранения прогресса
function saveProgress() {
    localStorage.setItem('airBlitzkriegProgress', JSON.stringify(gameProgress));
}

// Функция для загрузки прогресса
function loadProgress() {
    const saved = localStorage.getItem('airBlitzkriegProgress');
    if (saved) {
        gameProgress = JSON.parse(saved);
    }
}

// Функция обновления индикатора прогресса
function updateProgressIndicator() {
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    if (progressText && progressFill) {
        const percent = (gameProgress.completedLevels / CONFIG.TOTAL_LEVELS) * 100;
        progressText.textContent = `${gameProgress.completedLevels}/${CONFIG.TOTAL_LEVELS}`;
        progressFill.style.width = `${percent}%`;
    }
}

// В generateLevelButtons() добавляем кнопку бесконечного режима
function generateLevelButtons() {
    const grid = document.getElementById('levelGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Загружаем прогресс при генерации кнопок
    loadProgress();
    updateProgressIndicator();
    
    for (let i = 1; i <= CONFIG.TOTAL_LEVELS; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn level-btn';
        
        if (i === 11) {
            // Бесконечный режим
            btn.textContent = '∞';
            btn.style.background = 'linear-gradient(45deg, #ff6d00, #ffab00)';
            
            if (gameProgress.completedLevels >= 10) {
                btn.onclick = () => startInfiniteWar();
            } else {
                btn.classList.add('locked');
                btn.disabled = true;
                btn.innerHTML = '∞<br><small>Пройти 10 уровень</small>';
            }
        } else {
            // Обычные уровни
            btn.textContent = i;
            
            if (i <= gameProgress.unlockedLevels) {
                btn.onclick = () => startLevel(i);
                if (i <= gameProgress.completedLevels) {
                    btn.classList.add('completed');
                    btn.innerHTML = i + ' ✓';
                }
            } else {
                btn.classList.add('locked');
                btn.disabled = true;
                btn.innerHTML = i + ' 🔒';
            }
        }
        
        grid.appendChild(btn);
    }
}

function showLevelSelect() {
    hideAllScreens();
    document.getElementById('levelSelect').classList.remove('hidden');
    currentScreen = 'levelSelect';
    generateLevelButtons();
    
    // СБРАСЫВАЕМ АПОКАЛИПСИС ПРИ ВОЗВРАТЕ В МЕНЮ
    resetApocalypse();
    
    // ВОССТАНАВЛИВАЕМ ОТОБРАЖЕНИЕ СЧЕТЧИКА САМОЛЕТОВ
    const enemiesCounter = document.getElementById('enemiesCounter');
    if (enemiesCounter) {
        enemiesCounter.style.display = 'block';
    }
}

function showInstructions() {
    hideAllScreens();
    document.getElementById('instructions').classList.remove('hidden');
    currentScreen = 'instructions';
    
    // Обновляем содержимое инструкции
    const instructionsElement = document.querySelector('.instructions');
    if (instructionsElement) {
        instructionsElement.innerHTML = `
            <p><strong>ЦЕЛЬ:</strong> Сбить все вражеские самолеты!</p>
            <p><strong>УПРАВЛЕНИЕ:</strong></p>
            <p><span class="key">A</span>/<span class="key">←</span> - Влево</p>
            <p><span class="key">S</span>/<span class="key">→</span> - Вправо</p>
            <p><span class="key">ЛКМ/ПКМ</span> - Стрельба в направлении курсора</p>
            <p><span class="key">SHIFT</span> - Смена режима (СТОЯ/ПЕРЕДВИЖЕНИЕ)</p>
            
            <p><strong>СИСТЕМА СНАРЯДОВ:</strong></p>
            <p><span class="key">1</span> - Обычные снаряды (жёлтые)</p>
            <p><span class="key">2</span> - Прошивные снаряды (зелёные)</p>
            <p><span class="key">3</span> - Осколочные снаряды (красные)</p>
            
            <p><strong>СПЕЦИАЛЬНЫЕ ВОЗМОЖНОСТИ:</strong></p>
            <p><span class="key">Q</span> - ПОДДЕРЖКА(50⚙️)</p>
            <p style="color: #ff6d00; font-size: 0.9em;">💥 Вызвать истребитель ВВС СССР</p>
            <p><span class="key">W</span> - АПОКАЛИПСИС (200⚙️)</p>
            <p style="color: #ff6d00; font-size: 0.9em;">💥 55 снарядов за 2 секунды! Уничтожает всё на экране!</p>
            <p><span class="key">E</span> - ПОЧИНКА (50⚙️)</p>
            <p style="color: #4caf50; font-size: 0.9em;">🔧 Восстановить +1 единицу здоровья</p>
            
            <p><strong>ЗАПЧАСТИ (⚙️):</strong></p>
            <p>• Камикадзе: +5 запчастей</p>
            <p>• Штурмовик: +10 запчастей</p>
            <p>• Бомбардировщик: +20 запчастей</p>
            <p>• Японские самолеты: +15-25 запчастей</p>
            <p>• НЛО-босс: +100 запчастей</p>
            
            <p><strong>ТИПЫ САМОЛЕТОВ:</strong></p>
            <p><strong>Немецкие (уровни 1-5):</strong></p>
            <p>• Штурмовик (2 HP) - пикирует и стреляет</p>
            <p>• Бомбардировщик (3 HP) - сбрасывает бомбы</p>
            <p>• Камикадзе (4 HP) - летит прямо на ПВО!</p>
            <p>• Мессершмитт (6 HP) - пикирующий бомбардировщик</p>
            
            <p><strong>Японские (уровни 6-10):</strong></p>
            <p>• Накадзима (3 HP) - штурмовик с залпами</p>
            <p>• Мицубиси (4 HP) - бомбардировщик с волнами бомб</p>
            <p>• Камикадзе (4 HP) - атакуют со всех сторон</p>
            
            <p><strong>БОССЫ:</strong></p>
            <p>• Уровень 5: НЛО Третьего Рейха (88 HP)</p>
            <p>• Уровень 10: Линкор Ямато (выживание 200 сек)</p>
            
            <p><strong>СОВЕТЫ:</strong></p>
            <p>• Экономьте снаряды - их всего 270 на уровень</p>
            <p>• Используйте прошивные против групп врагов</p>
            <p>• Осколочные хороши против боссов и бомбардировщиков</p>
            <p>• Апокалипсис спасает в безвыходных ситуациях</p>
            <p>• Вызывайте истребители когда много врагов</p>
        `;
    }
}

function showGame() {
    hideAllScreens();
    document.getElementById('gameUI').classList.remove('hidden');
    document.getElementById('modeIndicator').classList.remove('hidden');
    document.getElementById('detailsPanel').classList.remove('hidden');
    document.getElementById('ammoSelectionPanel')?.classList.remove('hidden');
    document.getElementById('shopButton')?.classList.remove('hidden');
    currentScreen = 'game';
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById('gameUI').classList.add('hidden');
    document.getElementById('modeIndicator').classList.add('hidden');
    document.getElementById('detailsPanel').classList.add('hidden');
    document.getElementById('ammoSelectionPanel')?.classList.add('hidden');
    document.getElementById('shopButton')?.classList.add('hidden');
}

function updateModeIndicator() {
    const modeElement = document.getElementById('currentMode');
    if (modeElement && gameState && gameState.player) {
        modeElement.textContent = gameState.player.isMoving ? 'Wlk' : 'Sty';
        modeElement.style.color = gameState.player.isMoving ? '#ff4444' : '#4caf50';
    }
}

function updateDetailsUI() {
    const detailsCount = document.getElementById('detailsCount');
    const callBtn = document.getElementById('callFighterBtn');
    
    if (detailsCount && gameState) {
        detailsCount.textContent = gameState.details;
    }
    
    if (callBtn && gameState) {
        callBtn.disabled = gameState.details < CONFIG.FIGHTER_COST;
    }
}

function callFighter() {
    if (gameState && gameState.gameActive && gameState.details >= CONFIG.FIGHTER_COST) {
        gameState.details -= CONFIG.FIGHTER_COST;
        const newFighter = new FriendlyFighter();
        gameState.friendlyFighters.push(newFighter);
        updateDetailsUI();
        
        console.log('Истребитель ВВС СССР вызван!');
    }
    unlockAchievement('air_support'); // Поддержка с воздуха
}

function updateUI() {
    if (!gameState) return;
    
    const enemiesForThisLevel = gameState.currentLevel === 'infinite' ? 0 : CONFIG.getEnemiesForLevel(gameState.currentLevel);
    
    // ПЕРЕКЛЮЧАЕМ МЕЖДУ РЕЖИМАМИ
    if (gameState.currentLevel === 'infinite' && gameState.infiniteWar) {
        // БЕСКОНЕЧНЫЙ РЕЖИМ - показываем специальные плашки
        showInfiniteUI();
    } else {
        // ОБЫЧНЫЙ РЕЖИМ - показываем стандартные плашки
        showNormalUI(enemiesForThisLevel);
    }
    
    updateApocalypseUI();
}

function showInfiniteUI() {
    const uiInfo = gameState.infiniteWar.getUIInfo();
    
    // Скрываем обычные плашки
    document.querySelectorAll('.normal-mode').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Показываем бесконечные плашки
    document.querySelectorAll('.infinite-mode').forEach(el => {
        el.classList.remove('hidden');
    });
    
    // Обновляем данные
    const infiniteMode = document.getElementById('infiniteMode');
    const infiniteTime = document.getElementById('infiniteTime');
    const infiniteWave = document.getElementById('infiniteWave');
    const infiniteBoss = document.getElementById('infiniteBoss');
    
    if (infiniteMode) infiniteMode.textContent = '∞';
    if (infiniteTime) infiniteTime.textContent = uiInfo.time.replace('Время: ', '');
    if (infiniteWave) infiniteWave.textContent = uiInfo.wave.replace('Волна: ', '');
    if (infiniteBoss) infiniteBoss.textContent = uiInfo.boss.replace('Босс через: ', '').replace('Босс: ', '');
}

function showNormalUI(enemiesForThisLevel) {
    // Скрываем бесконечные плашки
    document.querySelectorAll('.infinite-mode').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Показываем обычные плашки
    document.querySelectorAll('.normal-mode').forEach(el => {
        el.classList.remove('hidden');
    });
    
    // Обновляем стандартные данные
    const currentLevel = document.getElementById('currentLevel');
    const enemiesLeft = document.getElementById('enemiesLeft');
    const destroyedCount = document.getElementById('destroyedCount');
    const enemiesCounter = document.getElementById('enemiesCounter');
    
    if (currentLevel) currentLevel.textContent = gameState.currentLevel;
    if (destroyedCount) destroyedCount.textContent = gameState.destroyedCount;
    
    if (enemiesLeft && enemiesCounter) {
        const isBossLevel = CONFIG.UFO.BOSS_LEVELS.includes(gameState.currentLevel) || gameState.currentLevel === 10;
        const allEnemiesDestroyed = gameState.destroyedCount >= enemiesForThisLevel;
        const bossSpawned = gameState.bossSpawned;
        
        if (isBossLevel && (allEnemiesDestroyed || bossSpawned)) {
            enemiesCounter.style.display = 'none';
        } else {
            enemiesCounter.style.display = 'block';
            enemiesLeft.textContent = enemiesForThisLevel - gameState.destroyedCount;
        }
    }
}

function updateApocalypseUI() {
    const apocalypseBtn = document.getElementById('apocalypseBtn');
    if (!apocalypseBtn) return;
    
    apocalypseBtn.disabled = !gameState || gameState.details < APOCALYPSE_COST || apocalypseActive;
    
    if (apocalypseActive) {
        const timeLeft = (apocalypseTimer / 60).toFixed(1);
        apocalypseBtn.textContent = `АПОКАЛИПСИС! ${timeLeft}с`;
        apocalypseBtn.style.background = 'linear-gradient(45deg, #ff0000, #ff6d00)';
    } else {
        apocalypseBtn.textContent = `АПОКАЛИПСИС (W) - ${APOCALYPSE_COST}⚙️`;
        apocalypseBtn.style.background = gameState && gameState.details >= APOCALYPSE_COST ? 
            'linear-gradient(45deg, #ff0000, #ff6d00)' : 
            'linear-gradient(45deg, #757575, #9e9e9e)';
    }
}

// Функция для показа окна подтверждения выхода
function showExitConfirmModal() {
    createModal(
        '🚪 Выход из игры', 
        'Вы уверены, что хотите выйти из игры?<br>', 
        'Выйти', 
        () => {
            window.close();
        },
        true, // Показать кнопку отмены
        'Остаться' // Текст кнопки отмены
    );
}

function exitGame() {
    showExitConfirmModal();
}

// Новые функции для системы снарядов и магазина
function createAmmoSelectionUI() {
    // Проверяем, существует ли уже панель
    if (document.getElementById('ammoSelectionPanel')) {
        return; // Уже создана, выходим
    }
    
    const panel = document.createElement('div');
    panel.id = 'ammoSelectionPanel';
    panel.className = 'ammo-panel hidden';
    panel.innerHTML = `
        <div class="ammo-option" data-type="normal">
            <div class="ammo-icon" style="background: #ffeb3b"></div>
            <div class="ammo-count">270</div>
            <div class="ammo-hotkey">1</div>
        </div>
        <div class="ammo-option" data-type="piercing">
            <div class="ammo-icon" style="background: #4caf50"></div>
            <div class="ammo-count">0</div>
            <div class="ammo-hotkey">2</div>
        </div>
        <div class="ammo-option" data-type="explosive">
            <div class="ammo-icon" style="background: #ff4444"></div>
            <div class="ammo-count">0</div>
            <div class="ammo-hotkey">3</div>
        </div>
    `;
    
    document.getElementById('gameContainer').appendChild(panel);
    
    // Обработчики выбора снарядов
    panel.querySelectorAll('.ammo-option').forEach(option => {
        option.addEventListener('click', () => {
            const type = option.dataset.type;
            if (gameState && gameState.player.ammoInventory[type] > 0) {
                gameState.player.currentAmmoType = type;
                updateAmmoSelectionUI();
            }
        });
    });
}

function createShopButton() {
    // Проверяем, существует ли уже кнопка
    if (document.getElementById('shopButton')) {
        return; // Уже создана, выходим
    }
    
    const shopBtn = document.createElement('button');
    shopBtn.id = 'shopButton';
    shopBtn.className = 'shop-btn hidden';
    shopBtn.innerHTML = '🛒 Магазин';
    shopBtn.onclick = openShop;
    
    document.getElementById('gameContainer').appendChild(shopBtn);
}

function openShop() {
    if (!gameState || !gameState.gameActive) return;
    
    // Пауза игры
    gameState.gameActive = false;
    soundManager.stopByType('shoot'); // Останавливаем звуки стрельбы
    
    const shopModal = document.createElement('div');
    shopModal.id = 'shopModal';
    shopModal.className = 'shop-modal-fullscreen';
    shopModal.innerHTML = `
        <div class="shop-header">
            <h1>🎯 АРСЕНАЛ ПВО</h1>
            <div class="shop-balance-large">
                <div class="balance-icon">🛠️</div>
                <div class="balance-text">ШЕСТЕРНИ:</div>
                <div class="balance-amount" id="shopBalance">${gameState.details}</div>
            </div>
        </div>
        
        <div class="shop-categories">
            <button class="category-btn active" data-category="ammo">СНАРЯДЫ</button>
            <button class="category-btn" data-category="upgrades">УЛУЧШЕНИЯ</button>
            <button class="category-btn" data-category="specials">СПЕЦИАЛЬНОЕ</button>
        </div>
        
        <div class="shop-content-fullscreen">
            <!-- СНАРЯДЫ -->
            <div class="shop-category active" id="category-ammo">
                <div class="shop-grid">
                    <div class="shop-item-large" data-type="normal">
                        <div class="item-header">
                            <h3>🔫 ОБЫЧНЫЕ СНАРЯДЫ</h3>
                            <div class="item-badge">БАЗОВЫЕ</div>
                        </div>
                        <div class="ammo-preview-large" style="background: linear-gradient(135deg, #ffeb3b, #ffc107)">
                            <div class="ammo-trail"></div>
                        </div>
                        <div class="item-stats">
                            <div class="stat">
                                <span class="stat-label">УРОН:</span>
                                <span class="stat-value">1</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">СКОРОСТЬ:</span>
                                <span class="stat-value">10</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">ПРОБИВ.:</span>
                                <span class="stat-value">1</span>
                            </div>
                        </div>
                        <div class="item-description">
                            Стандартные снаряды для борьбы с легкими целями
                        </div>
                        <div class="shop-price-large">
                            <span class="price-icon">💰</span>
                            <span class="price-amount">5</span>
                            <span class="price-text">шестерней за 10 снарядов</span>
                        </div>
                        <button class="btn buy-btn-large">КУПИТЬ</button>
                    </div>
                    
                    <div class="shop-item-large" data-type="piercing">
                        <div class="item-header">
                            <h3>⚡ ПРОШИВНЫЕ<br> СНАРЯДЫ</h3>
                            <div class="item-badge premium">ПРШ</div>
                        </div>
                        <div class="ammo-preview-large piercing">
                            <div class="ammo-laser"></div>
                        </div>
                        <div class="item-stats">
                            <div class="stat">
                                <span class="stat-label">УРОН:</span>
                                <span class="stat-value">1</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">СКОРОСТЬ:</span>
                                <span class="stat-value">25</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">ПРОБИВ.:</span>
                                <span class="stat-value">3</span>
                            </div>
                        </div>
                        <div class="item-description">
                            Пробивают несколько целей за один выстрел
                        </div>
                        <div class="shop-price-large">
                            <span class="price-icon">💰</span>
                            <span class="price-amount">10</span>
                            <span class="price-text">шестерней за 10 снарядов</span>
                        </div>
                        <button class="btn buy-btn-large">КУПИТЬ</button>
                    </div>
                    
                    <div class="shop-item-large" data-type="explosive">
                        <div class="item-header">
                            <h3>💥 ОСКОЛОЧНЫЕ СНАРЯДЫ</h3>
                            <div class="item-badge explosive">ОСК</div>
                        </div>
                        <div class="ammo-preview-large explosive">
                            <div class="ammo-explosion"></div>
                        </div>
                        <div class="item-stats">
                            <div class="stat">
                                <span class="stat-label">УРОН:</span>
                                <span class="stat-value">2</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">СКОРОСТЬ:</span>
                                <span class="stat-value">8</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">РАДИУС:</span>
                                <span class="stat-value">70px</span>
                            </div>
                        </div>
                        <div class="item-description">
                            Взрываются в воздухе, поражая несколько целей
                        </div>
                        <div class="shop-price-large">
                            <span class="price-icon">💰</span>
                            <span class="price-amount">15</span>
                            <span class="price-text">шестерней за 10 снарядов</span>
                        </div>
                        <button class="btn buy-btn-large">КУПИТЬ</button>
                    </div>
                </div>
            </div>
            
            <!-- УЛУЧШЕНИЯ (заглушка) -->
            <div class="shop-category" id="category-upgrades">
                <div class="coming-soon">
                    <div class="coming-soon-icon">🔧</div>
                    <h2>СИСТЕМА УЛУЧШЕНИЙ</h2>
                    <p>В РАЗРАБОТКЕ</p>
                    <div class="coming-soon-text">
                        Скоро вы сможете улучшать свою ПВО!
                    </div>
                </div>
            </div>
            
            <!-- СПЕЦИАЛЬНОЕ (заглушка) -->
            <div class="shop-category" id="category-specials">
                <div class="coming-soon">
                    <div class="coming-soon-icon">🎁</div>
                    <h2>СПЕЦИАЛЬНЫЕ ВОЗМОЖНОСТИ</h2>
                    <p>В РАЗРАБОТКЕ</p>
                    <div class="coming-soon-text">
                        Уникальные способности и бонусы скоро будут доступны!
                    </div>
                </div>
            </div>
        </div>
        
        <div class="shop-footer">
            <div class="player-ammo-info">
                <div class="ammo-counter">
                    <span class="ammo-type">🔫 Обычные:</span>
                    <span class="ammo-count">${gameState.player.ammoInventory.normal}</span>
                </div>
                <div class="ammo-counter">
                    <span class="ammo-type">⚡ Прошивные:</span>
                    <span class="ammo-count">${gameState.player.ammoInventory.piercing}</span>
                </div>
                <div class="ammo-counter">
                    <span class="ammo-type">💥 Осколочные:</span>
                    <span class="ammo-count">${gameState.player.ammoInventory.explosive}</span>
                </div>
            </div>
            <button class="btn close-shop-large">🚪 ВЕРНУТЬСЯ В БОЙ</button>
        </div>
    `;
    
    document.getElementById('gameContainer').appendChild(shopModal);
    
    // СБРАСЫВАЕМ СОСТОЯНИЕ КНОПОК
    resetShopButtons();
    
    // Обработчики покупок
    shopModal.querySelectorAll('.buy-btn-large').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.closest('.shop-item-large').dataset.type;
            buyAmmo(type);
        });
    });
    
    // Обработчики категорий
    shopModal.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            switchCategory(category);
        });
    });
    
    shopModal.querySelector('.close-shop-large').addEventListener('click', closeShop);
    
    // Закрытие по ESC
    document.addEventListener('keydown', handleShopKeydown);
}

// НОВАЯ ФУНКЦИЯ: Переключение категорий
function switchCategory(category) {
    // Обновляем активные кнопки категорий
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    // Показываем активную категорию
    document.querySelectorAll('.shop-category').forEach(cat => {
        cat.classList.toggle('active', cat.id === `category-${category}`);
    });
}

// НОВАЯ ФУНКЦИЯ: Обработка клавиш в магазине
function handleShopKeydown(e) {
    if (e.key === 'Escape') {
        closeShop();
    }
}

function buyAmmo(type) {
    const ammoConfig = CONFIG.AMMO_TYPES[type];
    
    if (gameState.details >= ammoConfig.cost) {
        gameState.details -= ammoConfig.cost;
        gameState.player.addAmmo(type, ammoConfig.amount);
        
        updateDetailsUI();
        updateAmmoSelectionUI();
        
        // Обновляем баланс в магазине
        const balanceElement = document.getElementById('shopBalance');
        if (balanceElement) {
            balanceElement.textContent = gameState.details;
        }
        
        // Обновляем счетчики боеприпасов в футере
        updateShopAmmoCounters();
        
        // Визуальное подтверждение покупки
        const btn = document.querySelector(`.shop-item-large[data-type="${type}"] .buy-btn-large`);
        const originalText = btn.textContent;
        btn.textContent = 'КУПЛЕНО!';
        btn.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';
        
        // Короткая анимация
        setTimeout(() => {
            btn.textContent = originalText;
            updateShopButtons();
        }, 500);
        
        console.log(`🛒 Куплено ${ammoConfig.amount} ${type} снарядов за ${ammoConfig.cost}⚙️`);
        
    } else {
        // Визуальная обратная связь при недостатке средств
        const btn = document.querySelector(`.shop-item-large[data-type="${type}"] .buy-btn-large`);
        const originalText = btn.textContent;
        btn.textContent = 'НЕДОСТАТОЧНО!';
        btn.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            updateShopButtons();
        }, 800);
    }

    unlockAchievement('control_purchase'); // Контрольная закупка
    checkThreeAmmoTypes() // Три в ряд
}

// НОВАЯ ФУНКЦИЯ: Обновление счетчиков боеприпасов в магазине
function updateShopAmmoCounters() {
    const shopModal = document.getElementById('shopModal');
    if (!shopModal || !gameState) return;
    
    const counters = {
        normal: shopModal.querySelector('.ammo-counter:nth-child(1) .ammo-count'),
        piercing: shopModal.querySelector('.ammo-counter:nth-child(2) .ammo-count'),
        explosive: shopModal.querySelector('.ammo-counter:nth-child(3) .ammo-count')
    };
    
    if (counters.normal) counters.normal.textContent = gameState.player.ammoInventory.normal;
    if (counters.piercing) counters.piercing.textContent = gameState.player.ammoInventory.piercing;
    if (counters.explosive) counters.explosive.textContent = gameState.player.ammoInventory.explosive;
}

function closeShop() {
    const shopModal = document.getElementById('shopModal');
    if (shopModal) {
        shopModal.remove();
    }
    
    // Убираем обработчик клавиш
    document.removeEventListener('keydown', handleShopKeydown);
    
    // Возобновляем игру
    if (gameState) {
        gameState.gameActive = true;
        
        // Перезапускаем игровой цикл
        if (typeof gameLoop === 'function') {
            gameLoop();
        }
    }
}

function resetShopButtons() {
    const shopModal = document.getElementById('shopModal');
    if (!shopModal) return;
    
    shopModal.querySelectorAll('.buy-btn-large').forEach(btn => {
        btn.textContent = 'КУПИТЬ';
        btn.disabled = false;
        btn.style.background = 'linear-gradient(135deg, #ff6d00, #ffab00)';
    });
    
    // Обновляем доступность кнопок по балансу
    updateShopButtons();
}

function updateShopButtons() {
    const shopModal = document.getElementById('shopModal');
    if (!shopModal || !gameState) return;
    
    shopModal.querySelectorAll('.shop-item-large').forEach(item => {
        const type = item.dataset.type;
        const btn = item.querySelector('.buy-btn-large');
        const ammoConfig = CONFIG.AMMO_TYPES[type];
        
        if (gameState.details >= ammoConfig.cost) {
            btn.disabled = false;
            btn.style.background = 'linear-gradient(135deg, #ff6d00, #ffab00)';
            btn.style.cursor = 'pointer';
            btn.style.opacity = '1';
        } else {
            btn.disabled = true;
            btn.style.background = 'linear-gradient(135deg, #757575, #9e9e9e)';
            btn.style.cursor = 'not-allowed';
            btn.style.opacity = '0.7';
        }
    });
}

function updateAmmoSelectionUI() {
    const panel = document.getElementById('ammoSelectionPanel');
    if (!panel || !gameState) return;
    
    panel.querySelectorAll('.ammo-option').forEach(option => {
        const type = option.dataset.type;
        const count = gameState.player.ammoInventory[type];
        const isSelected = type === gameState.player.currentAmmoType;
        const isAvailable = count > 0;
        
        option.querySelector('.ammo-count').textContent = count;
        option.querySelector('.ammo-count').style.color = isAvailable ? '#ffeb3b' : '#ff4444';
        
        // Подсветка выбранного типа
        if (isSelected) {
            option.classList.add('selected');
            option.style.background = 'rgba(255, 109, 0, 0.5)';
            option.style.border = '2px solid #ff6d00';
        } else {
            option.classList.remove('selected');
            option.style.background = isAvailable ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 0, 0, 0.2)';
            option.style.border = isAvailable ? '1px solid #666' : '1px solid #ff4444';
        }
        
        // Эффект для недоступных снарядов
        if (!isAvailable) {
            option.style.opacity = '0.5';
            option.style.cursor = 'not-allowed';
        } else {
            option.style.opacity = '1';
            option.style.cursor = 'pointer';
        }
    });
}

// Добавляем в ui.js функции для работы с диалогами
let currentDialogSound = null;

function showBossDialog(avatar, name, message, soundFunction = null) {
    // Останавливаем предыдущие диалоговые звуки
    stopDialogSounds();
    
    const dialog = document.getElementById('bossDialog');
    const avatarImg = document.getElementById('dialogAvatar');
    const nameElement = document.getElementById('dialogName');
    const messageElement = document.getElementById('dialogMessage');
    
    if (dialog && avatarImg && nameElement && messageElement) {
        avatarImg.src = avatar;
        avatarImg.onerror = function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QVZBVEFSPC90ZXh0Pgo8L3N2Zz4K';
        };
        nameElement.textContent = name;
        messageElement.textContent = message;
        dialog.classList.remove('hidden');
        
        // Воспроизводим звук если указан
        // Воспроизводим звук если указан
        if (soundFunction && typeof soundFunction === 'function') {
            // Задержка для плавного начала
            setTimeout(() => {
                currentDialogSound = soundFunction();
            }, 500);
        }
        
        // Пауза игры
        if (gameState) {
            gameState.gameActive = false;
        }
    }
}

function closeBossDialog() {
    const dialog = document.getElementById('bossDialog');
    if (dialog) {
        dialog.classList.add('hidden');
    }
    
    // Останавливаем звук диалога
    if (currentDialogSound) {
        soundManager.stop(currentDialogSound);
        currentDialogSound = null;
    }
    
    // Возобновляем игру и спавним босса
    if (gameState) {
        gameState.gameActive = true;
        
        // Спавним соответствующего босса
        if (gameState.currentLevel === 5) {
            spawnBoss();
        } else if (gameState.currentLevel === 10) {
            spawnYamato();
        }
        
        console.log('🎮 Диалог закрыт, босс появляется!');
        
        // Перезапускаем игровой цикл
        if (typeof gameLoop === 'function') {
            gameLoop();
        }
    }
}