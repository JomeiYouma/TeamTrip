// ==================== GAME STATE ====================
const gameState = {
    players: [],
    currentPlayer: null,
    gameCode: null,
    isHost: false,
    settings: {
        mode: 'classic',
        categories: [],
        timer: 45,
        rounds: 5
    },
    currentRound: 1,
    associations: [], // { player, target, category, word, round }
    guesses: [], // { guesser, associationIndex, guessedPlayer, correct }
    scores: {}, // player -> score
    timerInterval: null,
    gameData: {
        categories: [
            { id: 'object', name: 'Objet', icon: 'package', hint: 'Un objet du quotidien' },
            { id: 'color', name: 'Couleur', icon: 'palette', hint: 'Une couleur ou teinte' },
            { id: 'animal', name: 'Animal', icon: 'cat', hint: 'Un animal réel ou imaginaire' },
            { id: 'food', name: 'Nourriture', icon: 'utensils', hint: 'Un plat, fruit, légume...' },
            { id: 'music', name: 'Musique', icon: 'music', hint: 'Un genre, artiste ou chanson' },
            { id: 'movie', name: 'Film/Série', icon: 'film', hint: 'Un film, série ou anime' },
            { id: 'place', name: 'Lieu', icon: 'map-pin', hint: 'Un pays, ville ou endroit' },
            { id: 'hobby', name: 'Activité', icon: 'activity', hint: 'Un sport, loisir ou passe-temps' },
            { id: 'brand', name: 'Marque', icon: 'tag', hint: 'Une marque connue' },
            { id: 'emotion', name: 'Émotion', icon: 'heart', hint: 'Un sentiment ou émotion' },
            { id: 'season', name: 'Saison', icon: 'sun', hint: 'Une saison ou période de l\'année' },
            { id: 'element', name: 'Élément', icon: 'flame', hint: 'Feu, eau, air, terre...' }
        ]
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeCategories();
    loadFromStorage();
});

function initializeCategories() {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = gameState.gameData.categories.map(cat => `
        <div class="category-card cursor-pointer rounded-xl p-4 border-2 border-gray-200 hover:border-pink-400 flex items-center gap-3" 
             onclick="toggleCategory('${cat.id}', this)" data-category="${cat.id}">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                <i data-lucide="${cat.icon}" class="w-5 h-5 text-white"></i>
            </div>
            <span class="font-bold text-sm">${cat.name}</span>
        </div>
    `).join('');
    lucide.createIcons();
}

// ==================== SCREEN MANAGEMENT ====================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden-screen'));
    document.getElementById(`screen-${screenId}`).classList.remove('hidden-screen');
    document.getElementById(`screen-${screenId}`).classList.add('fade-in');
    
    // Update nav
    const codeDisplay = document.getElementById('game-code-display');
    if (screenId === 'home') {
        codeDisplay.classList.add('hidden');
    } else if (gameState.gameCode) {
        codeDisplay.classList.remove('hidden');
        document.getElementById('current-game-code').textContent = gameState.gameCode;
    }
    
    lucide.createIcons();
}

// ==================== PLAYER MANAGEMENT ====================
function addPlayer() {
    const input = document.getElementById('player-input');
    const name = input.value.trim();
    
    if (!name) return;
    if (gameState.players.includes(name)) {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        return;
    }
    if (gameState.players.length >= 12) {
        alert('Maximum 12 joueurs !');
        return;
    }
    
    gameState.players.push(name);
    input.value = '';
    renderPlayers();
    saveToStorage();
}

function removePlayer(name) {
    gameState.players = gameState.players.filter(p => p !== name);
    renderPlayers();
    saveToStorage();
}

function renderPlayers() {
    const container = document.getElementById('players-list');
    container.innerHTML = gameState.players.map((name, i) => `
        <div class="player-avatar inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-bold">
            <span class="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">${i + 1}</span>
            ${name}
            <button onclick="removePlayer('${name}')" class="ml-1 hover:text-red-500 transition">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

function generateRandomPlayers() {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Evan', 'Fiona'];
    const shuffled = names.sort(() => 0.5 - Math.random()).slice(0, 4);
    gameState.players = shuffled;
    renderPlayers();
    saveToStorage();
}

function importPlayers() {
    const input = prompt('Entre les noms séparés par des virgules :');
    if (!input) return;
    
    const names = input.split(',').map(n => n.trim()).filter(n => n);
    gameState.players = [...new Set([...gameState.players, ...names])].slice(0, 12);
    renderPlayers();
    saveToStorage();
}

// ==================== SETTINGS ====================
function selectMode(mode, element) {
    gameState.settings.mode = mode;
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    saveToStorage();
}

function toggleCategory(catId, element) {
    const index = gameState.settings.categories.indexOf(catId);
    if (index > -1) {
        gameState.settings.categories.splice(index, 1);
        element.classList.remove('selected');
    } else {
        gameState.settings.categories.push(catId);
        element.classList.add('selected');
    }
    saveToStorage();
}

// ==================== GAME CREATION ====================
function createGame() {
    // Validation
    if (gameState.players.length < 3) {
        document.getElementById('players-error').classList.remove('hidden');
        return;
    }
    if (gameState.settings.categories.length === 0) {
        alert('Sélectionne au moins une catégorie !');
        return;
    }
    if (!gameState.settings.mode) {
        alert('Sélectionne un mode de jeu !');
        return;
    }
    
    // Generate code
    gameState.gameCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    gameState.isHost = true;
    gameState.settings.timer = parseInt(document.getElementById('timer-setting').value);
    gameState.settings.rounds = parseInt(document.getElementById('rounds-setting').value);
    
    // Initialize scores
    gameState.players.forEach(p => gameState.scores[p] = 0);
    
    saveToStorage();
    showLobby();
}

function showLobby() {
    document.getElementById('lobby-code').textContent = gameState.gameCode;
    document.getElementById('lobby-player-count').textContent = gameState.players.length;
    
    const modeNames = { classic: 'Classique', reverse: 'Inversé', chain: 'Chaîne' };
    document.getElementById('lobby-mode').textContent = modeNames[gameState.settings.mode];
    
    const catNames = gameState.settings.categories.map(id => 
        gameState.gameData.categories.find(c => c.id === id)?.name
    ).join(', ');
    document.getElementById('lobby-categories').textContent = catNames;
    document.getElementById('lobby-timer').textContent = gameState.settings.timer + 's';
    document.getElementById('lobby-rounds').textContent = gameState.settings.rounds;
    
    renderLobbyPlayers();
    showScreen('lobby');
}

function renderLobbyPlayers() {
    const container = document.getElementById('lobby-players');
    container.innerHTML = gameState.players.map((name, i) => `
        <div class="flex items-center gap-3 p-3 rounded-xl ${i === 0 ? 'bg-purple-100' : 'bg-gray-50'}">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                ${name.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1">
                <p class="font-bold">${name}</p>
                ${i === 0 ? '<span class="text-xs text-purple-600 font-semibold">👑 Hôte</span>' : ''}
            </div>
            <div class="text-right">
                <span class="text-2xl">${getPlayerEmoji(i)}</span>
            </div>
        </div>
    `).join('');
}

function getPlayerEmoji(index) {
    const emojis = ['🦊', '🐼', '🦁', '🐨', '🐯', '🐷', '🐸', '🐙', '🦄', '🐝', '🦋', '🐞'];
    return emojis[index % emojis.length];
}

function copyCode() {
    navigator.clipboard.writeText(gameState.gameCode);
    showToast('Code copié !');
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-gray-800 text-white rounded-full font-bold z-50 animate-bounce';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ==================== JOIN GAME ====================
function focusNext(current, nextId) {
    if (current.value.length === 1) {
        document.getElementById(nextId)?.focus();
    }
}

function joinGame() {
    const code = ['join-code-1', 'join-code-2', 'join-code-3', 'join-code-4']
        .map(id => document.getElementById(id).value.toUpperCase())
        .join('');
    
    if (code.length !== 4) return;
    
    // Simulate finding game (in real app, this would be an API call)
    // For demo, we'll create a fake game if code matches pattern
    if (/^[A-Z0-9]{4}$/.test(code)) {
        gameState.gameCode = code;
        gameState.isHost = false;
        gameState.players = ['Joueur 1', 'Joueur 2', 'Joueur 3', 'Toi'];
        gameState.settings = {
            mode: 'classic',
            categories: ['object', 'color', 'animal'],
            timer: 45,
            rounds: 5
        };
        showLobby();
        document.getElementById('host-controls').classList.add('hidden');
    } else {
        document.getElementById('join-error').classList.remove('hidden');
    }
}

// ==================== GAMEPLAY ====================
function startGameFromLobby() {
    gameState.currentRound = 1;
    gameState.associations = [];
    gameState.guesses = [];
    startWritePhase();
}

function startWritePhase() {
    showScreen('write');
    
    // Update UI
    document.getElementById('write-round').textContent = gameState.currentRound;
    document.getElementById('write-total-rounds').textContent = gameState.settings.rounds;
    
    // Assign targets (each player writes for someone else)
    const shuffled = [...gameState.players].sort(() => 0.5 - Math.random());
    const currentPlayerIndex = 0; // In real app, this would be the actual player
    
    const target = shuffled[currentPlayerIndex];
    const category = gameState.settings.categories[Math.floor(Math.random() * gameState.settings.categories.length)];
    const catData = gameState.gameData.categories.find(c => c.id === category);
    
    document.getElementById('target-name').textContent = target;
    document.getElementById('target-avatar').textContent = getPlayerEmoji(gameState.players.indexOf(target));
    document.getElementById('current-category').textContent = catData.name;
    document.getElementById('category-hint').textContent = catData.hint;
    
    // Reset input
    document.getElementById('association-input').value = '';
    document.getElementById('association-input').disabled = false;
    document.getElementById('write-waiting').classList.add('hidden');
    
    // Start timer
    startTimer('write', gameState.settings.timer, () => {
        submitAssociation(true); // Auto-submit on timeout
    });
}

function startTimer(phase, seconds, callback) {
    let remaining = seconds;
    const timerEl = document.getElementById(`${phase}-timer`);
    const barEl = document.getElementById(`${phase}-timer-bar`);
    
    clearInterval(gameState.timerInterval);
    
    gameState.timerInterval = setInterval(() => {
        remaining--;
        timerEl.textContent = remaining;
        barEl.style.width = (remaining / seconds * 100) + '%';
        
        if (remaining <= 10) {
            timerEl.classList.add('text-red-500');
            barEl.classList.remove('from-purple-500', 'to-pink-500', 'from-amber-400', 'to-orange-500');
            barEl.classList.add('bg-red-500');
        }
        
        if (remaining <= 0) {
            clearInterval(gameState.timerInterval);
            callback();
        }
    }, 1000);
}

function submitAssociation(auto = false) {
    const input = document.getElementById('association-input');
    const word = input.value.trim();
    
    if (!word && !auto) {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        return;
    }
    
    clearInterval(gameState.timerInterval);
    
    // Save association
    const target = document.getElementById('target-name').textContent;
    const category = gameState.settings.categories.find(c => {
        const catData = gameState.gameData.categories.find(cd => cd.id === c);
        return catData && catData.name === document.getElementById('current-category').textContent;
    });
    
    gameState.associations.push({
        player: gameState.players[0], // Current player
        target: target,
        category: category,
        word: word || '(pas de réponse)',
        round: gameState.currentRound
    });
    
    // Show waiting state
    input.disabled = true;
    document.getElementById('write-waiting').classList.remove('hidden');
    
    // Simulate other players (in real app, we'd wait for all)
    setTimeout(() => {
        generateBotAssociations();
        startGuessPhase();
    }, 1500);
}

function generateBotAssociations() {
    // Generate fake associations for other players
    const botWords = {
        object: ['téléphone', 'chaise', 'lampe', 'vélo', 'montre'],
        color: ['bleu', 'rouge', 'vert', 'jaune', 'violet'],
        animal: ['chien', 'chat', 'lion', 'panda', 'renard'],
        food: ['pizza', 'sushi', 'croissant', 'salade', 'burger'],
        music: ['rock', 'jazz', 'pop', 'classique', 'rap'],
        movie: ['action', 'comédie', 'drame', 'sci-fi', 'horreur'],
        place: ['plage', 'montagne', 'ville', 'forêt', 'désert'],
        hobby: ['sport', 'lecture', 'musique', 'voyage', 'cuisine'],
        brand: ['Nike', 'Apple', 'Coca', 'Google', 'Amazon'],
        emotion: ['joie', 'tristesse', 'colère', 'peur', 'amour'],
        season: ['été', 'hiver', 'printemps', 'automne'],
        element: ['feu', 'eau', 'terre', 'air', 'foudre']
    };
    
    const otherPlayers = gameState.players.slice(1);
    otherPlayers.forEach((player, i) => {
        const target = gameState.players[(gameState.players.indexOf(player) + 1) % gameState.players.length];
        const category = gameState.settings.categories[i % gameState.settings.categories.length];
        const words = botWords[category] || ['truc', 'machin', 'bidule'];
        const word = words[Math.floor(Math.random() * words.length)];
        
        gameState.associations.push({
            player: player,
            target: target,
            category: category,
            word: word,
            round: gameState.currentRound
        });
    });
}

function startGuessPhase() {
    showScreen('guess');
    
    // Pick a random association to guess
    const roundAssociations = gameState.associations.filter(a => a.round === gameState.currentRound);
    const toGuess = roundAssociations[Math.floor(Math.random() * roundAssociations.length)];
    
    const catData = gameState.gameData.categories.find(c => c.id === toGuess.category);
    document.getElementById('guess-category').textContent = catData?.name || toGuess.category;
    document.getElementById('guess-association').textContent = toGuess.word;
    
    // Generate options (target + 3 random players)
    const options = [toGuess.target];
    const otherPlayers = gameState.players.filter(p => p !== toGuess.target);
    while (options.length < Math.min(4, gameState.players.length)) {
        const random = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        if (!options.includes(random)) options.push(random);
    }
    
    // Shuffle options
    const shuffled = options.sort(() => 0.5 - Math.random());
    
    const container = document.getElementById('guess-options');
    container.innerHTML = shuffled.map(name => `
        <button onclick="makeGuess('${name}', '${toGuess.target}', '${toGuess.player}')" 
                class="guess-card w-full p-4 rounded-xl border-2 border-gray-200 text-left font-bold text-lg hover:border-purple-400 transition">
            ${name}
        </button>
    `).join('');
    
    // Start timer
    startTimer('guess', Math.floor(gameState.settings.timer * 0.7), () => {
        makeGuess(shuffled[0], toGuess.target, toGuess.player, true); // Auto-guess
    });
}

function makeGuess(guessedName, correctName, author, auto = false) {
    clearInterval(gameState.timerInterval);
    
    const correct = guessedName === correctName;
    
    // Update button styles
    document.querySelectorAll('.guess-card').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent.trim() === correctName) {
            btn.classList.add('correct');
        } else if (btn.textContent.trim() === guessedName && !correct) {
            btn.classList.add('wrong');
        }
    });
    
    // Save guess
    gameState.guesses.push({
        guesser: gameState.players[0],
        guessedPlayer: guessedName,
        correctPlayer: correctName,
        author: author,
        correct: correct
    });
    
    // Update scores
    if (correct) {
        gameState.scores[gameState.players[0]] = (gameState.scores[gameState.players[0]] || 0) + 10;
    }
    
    // Show result briefly then continue
    setTimeout(() => {
        if (gameState.guesses.filter(g => g.guesser === gameState.players[0]).length < 3) {
            // More guesses to make
            startGuessPhase();
        } else {
            showResults();
        }
    }, 1500);
}

function showResults() {
    showScreen('results');
    document.getElementById('result-round').textContent = gameState.currentRound;
    
    const container = document.getElementById('results-container');
    const roundGuesses = gameState.guesses.filter(g => 
        gameState.associations.find(a => 
            a.player === g.author && a.round === gameState.currentRound
        )
    );
    
    // Group by association
    const byAssociation = {};
    roundGuesses.forEach(g => {
        const key = `${g.author}-${g.correctPlayer}`;
        if (!byAssociation[key]) {
            byAssociation[key] = {
                author: g.author,
                target: g.correctPlayer,
                word: gameState.associations.find(a => a.player === g.author && a.target === g.correctPlayer)?.word,
                guesses: []
            };
        }
        byAssociation[key].guesses.push(g);
    });
    
    container.innerHTML = Object.values(byAssociation).map(assoc => {
        const correctCount = assoc.guesses.filter(g => g.correct).length;
        const totalGuesses = assoc.guesses.length;
        const percentage = Math.round(correctCount / totalGuesses * 100);
        
        return `
            <div class="glass-panel rounded-2xl p-6">
                <div class="flex items-start gap-4 mb-4">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl">
                        ${getPlayerEmoji(gameState.players.indexOf(assoc.author))}
                    </div>
                    <div class="flex-1">
                        <p class="text-sm text-gray-500 mb-1">Association pour <span class="font-bold text-gray-700">${assoc.target}</span></p>
                        <h4 class="text-2xl font-black text-gray-800">"${assoc.word}"</h4>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-black ${percentage >= 50 ? 'text-green-500' : 'text-orange-500'}">${percentage}%</div>
                        <p class="text-sm text-gray-500">${correctCount}/${totalGuesses} ont deviné</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${assoc.guesses.map(g => `
                        <span class="px-3 py-1 rounded-full text-sm font-bold ${g.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${g.guesser}: ${g.guessedPlayer}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    // Show appropriate button
    if (gameState.currentRound >= gameState.settings.rounds) {
        document.getElementById('next-round-btn').classList.add('hidden');
        document.getElementById('final-scores-btn').classList.remove('hidden');
    } else {
        document.getElementById('next-round-btn').classList.remove('hidden');
        document.getElementById('final-scores-btn').classList.add('hidden');
    }
    
    // Confetti if good round
    const goodRound = Object.values(byAssociation).some(a => 
        a.guesses.filter(g => g.correct).length >= a.guesses.length / 2
    );
    if (goodRound) createConfetti();
}

function nextRound() {
    gameState.currentRound++;
    startWritePhase();
}

function showFinalScores() {
    showScreen('final');
    createConfetti();
    
    const sorted = Object.entries(gameState.scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    const medals = ['🥇', '🥈', '🥉'];
    const gradients = [
        'from-yellow-400 to-amber-500',
        'from-gray-300 to-gray-400',
        'from-orange-300 to-orange-400'
    ];
    
    document.getElementById('final-podium').innerHTML = sorted.map(([player, score], i) => `
        <div class="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${gradients[i]} text-white">
            <div class="text-4xl">${medals[i]}</div>
            <div class="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center text-2xl">
                ${getPlayerEmoji(gameState.players.indexOf(player))}
            </div>
            <div class="flex-1 text-left">
                <p class="font-bold text-lg">${player}</p>
                <p class="text-white/80 text-sm">${score} points</p>
            </div>
            <div class="text-3xl font-black">${score}</div>
        </div>
    `).join('');
    
    // Add other players
    const others = Object.entries(gameState.scores)
        .sort((a, b) => b[1] - a[1])
        .slice(3);
    
    if (others.length > 0) {
        document.getElementById('final-podium').innerHTML += `
            <div class="mt-4 pt-4 border-t border-gray-200">
                ${others.map(([player, score], i) => `
                    <div class="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                        <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                            ${i + 4}
                        </div>
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg">
                            ${getPlayerEmoji(gameState.players.indexOf(player))}
                        </div>
                        <div class="flex-1 text-left">
                            <p class="font-bold">${player}</p>
                        </div>
                        <div class="font-bold text-gray-600">${score} pts</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function restartGame() {
    gameState.currentRound = 1;
    gameState.associations = [];
    gameState.guesses = [];
    gameState.players.forEach(p => gameState.scores[p] = 0);
    startWritePhase();
}

// ==================== UTILITIES ====================
function createConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#feca57', '#4ade80'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        container.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// ==================== STORAGE ====================
function saveToStorage() {
    localStorage.setItem('brainlink_game', JSON.stringify({
        players: gameState.players,
        settings: gameState.settings,
        gameCode: gameState.gameCode,
        isHost: gameState.isHost
    }));
}

function loadFromStorage() {
    const saved = localStorage.getItem('brainlink_game');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.players = data.players || [];
        gameState.settings = data.settings || gameState.settings;
        gameState.gameCode = data.gameCode;
        gameState.isHost = data.isHost;
        
        // Restore UI
        renderPlayers();
        if (gameState.gameCode) {
            showLobby();
        }
    }
}

// Prevent accidental leave during game
window.addEventListener('beforeunload', (e) => {
    if (document.getElementById('screen-write').classList.contains('hidden-screen') === false ||
        document.getElementById('screen-guess').classList.contains('hidden-screen') === false) {
        e.preventDefault();
        e.returnValue = '';
    }
});