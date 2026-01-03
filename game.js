// Dual N-Back Game
// State Management and Game Logic

class DualNBackGame {
    constructor() {
        // Default settings
        this.settings = {
            startingNLevel: 2,
            gridSize: 3,
            trialsPerSession: 20,
            stimulusInterval: 3000,
            audioVolume: 0.8,
            speechRate: 1.0
        };

        // Game state
        this.currentNLevel = 2;
        this.currentTrial = 0;
        this.sequences = {
            positions: [],
            letters: []
        };
        this.userResponses = {
            position: [],
            audio: []
        };
        this.letterSet = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
        this.isPlaying = false;
        this.isPaused = false;
        this.trialTimer = null;

        // Statistics
        this.currentSession = {
            nLevel: 2,
            trials: 0,
            positionHits: 0,
            positionMisses: 0,
            positionFalsePos: 0,
            audioHits: 0,
            audioMisses: 0,
            audioFalsePos: 0,
            startTime: null,
            endTime: null
        };

        // Initialize
        this.loadSettings();
        this.loadStatistics();
        this.initializeUI();
        this.attachEventListeners();
        this.updateStartScreen();
    }

    // ===== INITIALIZATION =====

    loadSettings() {
        const saved = localStorage.getItem('nback_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        this.currentNLevel = this.settings.startingNLevel;
    }

    saveSettings() {
        localStorage.setItem('nback_settings', JSON.stringify(this.settings));
    }

    loadStatistics() {
        const saved = localStorage.getItem('nback_stats');
        this.stats = saved ? JSON.parse(saved) : {
            sessions: [],
            totalSessions: 0,
            highestLevel: this.currentNLevel
        };
    }

    saveStatistics() {
        localStorage.setItem('nback_stats', JSON.stringify(this.stats));
    }

    initializeUI() {
        this.screens = {
            start: document.getElementById('startScreen'),
            game: document.getElementById('gameScreen'),
            results: document.getElementById('resultsScreen'),
            stats: document.getElementById('statsScreen'),
            settings: document.getElementById('settingsScreen'),
            instructions: document.getElementById('instructionsScreen')
        };

        // Apply settings to UI
        document.getElementById('startingNLevel').value = this.settings.startingNLevel;
        document.getElementById('gridSize').value = this.settings.gridSize;
        document.getElementById('trialsPerSession').value = this.settings.trialsPerSession;
        document.getElementById('stimulusInterval').value = this.settings.stimulusInterval;
        document.getElementById('audioVolume').value = this.settings.audioVolume * 100;
        document.getElementById('volumeValue').textContent = Math.round(this.settings.audioVolume * 100) + '%';
        document.getElementById('speechRate').value = this.settings.speechRate;
    }

    attachEventListeners() {
        // Start screen
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('statsButton').addEventListener('click', () => this.showScreen('stats'));
        document.getElementById('settingsButton').addEventListener('click', () => this.showScreen('settings'));
        document.getElementById('instructionsButton').addEventListener('click', () => this.showScreen('instructions'));

        // Game screen
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('audioMatchBtn').addEventListener('click', () => this.handleInput('audio'));
        document.getElementById('positionMatchBtn').addEventListener('click', () => this.handleInput('position'));

        // Results screen
        document.getElementById('continueButton').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenuButton').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('increaseLevel').addEventListener('click', () => this.adjustManualLevel(1));
        document.getElementById('decreaseLevel').addEventListener('click', () => this.adjustManualLevel(-1));

        // Stats screen
        document.getElementById('closeStatsButton').addEventListener('click', () => this.showScreen('start'));

        // Settings screen
        document.getElementById('closeSettingsButton').addEventListener('click', () => {
            this.applySettings();
            this.showScreen('start');
        });
        document.getElementById('resetStatsButton').addEventListener('click', () => this.resetStatistics());
        document.getElementById('audioVolume').addEventListener('input', (e) => {
            document.getElementById('volumeValue').textContent = e.target.value + '%';
        });

        // Instructions screen
        document.getElementById('closeInstructionsButton').addEventListener('click', () => this.showScreen('start'));

        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    // ===== SCREEN MANAGEMENT =====

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');

        if (screenName === 'stats') {
            this.updateStatsScreen();
        } else if (screenName === 'start') {
            this.updateStartScreen();
        }
    }

    updateStartScreen() {
        document.getElementById('currentLevelDisplay').textContent = this.currentNLevel;
        document.getElementById('sessionsCompleted').textContent = this.stats.totalSessions;
        document.getElementById('bestLevel').textContent = this.stats.highestLevel;
    }

    // ===== GAME LOGIC =====

    startGame() {
        // Reset session
        this.currentSession = {
            nLevel: this.currentNLevel,
            trials: this.settings.trialsPerSession,
            positionHits: 0,
            positionMisses: 0,
            positionFalsePos: 0,
            audioHits: 0,
            audioMisses: 0,
            audioFalsePos: 0,
            startTime: Date.now(),
            endTime: null
        };

        this.currentTrial = 0;
        this.sequences = {
            positions: [],
            letters: []
        };
        this.userResponses = {
            position: [],
            audio: []
        };

        // Update grid size
        this.updateGridSize();

        // Generate sequences
        this.generateSequences();

        // Show game screen
        this.showScreen('game');
        this.updateGameUI();

        // Start playing
        this.isPlaying = true;
        this.isPaused = false;
        this.playNextTrial();
    }

    generateSequences() {
        const gridSize = this.settings.gridSize;
        const totalCells = gridSize * gridSize;
        const totalTrials = this.settings.trialsPerSession;

        // Generate random sequences
        for (let i = 0; i < totalTrials; i++) {
            this.sequences.positions.push(Math.floor(Math.random() * totalCells));
            this.sequences.letters.push(this.letterSet[Math.floor(Math.random() * this.letterSet.length)]);
        }

        // Initialize user responses
        this.userResponses.position = new Array(totalTrials).fill(false);
        this.userResponses.audio = new Array(totalTrials).fill(false);
    }

    updateGridSize() {
        const grid = document.getElementById('grid');
        const gridSize = this.settings.gridSize;

        // Remove all grid size classes
        grid.classList.remove('grid-2x2', 'grid-3x3', 'grid-4x4');
        grid.classList.add(`grid-${gridSize}x${gridSize}`);

        // Clear and regenerate cells
        grid.innerHTML = '';
        const totalCells = gridSize * gridSize;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.position = i;
            grid.appendChild(cell);
        }
    }

    playNextTrial() {
        if (!this.isPlaying || this.isPaused) return;

        if (this.currentTrial >= this.settings.trialsPerSession) {
            this.endGame();
            return;
        }

        const position = this.sequences.positions[this.currentTrial];
        const letter = this.sequences.letters[this.currentTrial];

        // Visual: highlight grid position
        this.highlightPosition(position);

        // Audio: speak letter
        this.speakLetter(letter);

        // Update UI
        this.currentTrial++;
        this.updateGameUI();

        // Schedule next trial
        this.trialTimer = setTimeout(() => {
            this.playNextTrial();
        }, this.settings.stimulusInterval);
    }

    highlightPosition(position) {
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(cell => cell.classList.remove('active'));
        cells[position].classList.add('active');

        // Remove highlight after a delay
        setTimeout(() => {
            cells[position].classList.remove('active');
        }, this.settings.stimulusInterval * 0.4);
    }

    speakLetter(letter) {
        if ('speechSynthesis' in window) {
            // Cancel any pending speech to prevent queue buildup
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(letter.toLowerCase());
            utterance.rate = this.settings.speechRate;
            utterance.volume = this.settings.audioVolume;
            utterance.pitch = 1.0;
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    }

    handleKeyPress(e) {
        if (!this.isPlaying || this.isPaused) return;
        if (this.currentTrial === 0) return; // Can't match on first trial

        const key = e.key.toLowerCase();
        if (key === 'a') {
            this.handleInput('audio');
        } else if (key === 'l') {
            this.handleInput('position');
        }
    }

    handleInput(type) {
        if (!this.isPlaying || this.isPaused) return;
        if (this.currentTrial === 0) return;

        const trialIndex = this.currentTrial - 1;

        // Can't check for matches until we have enough history
        if (trialIndex < this.currentNLevel) {
            this.showFeedback(type, 'neutral');
            return;
        }

        // Check if there's actually a match
        let isMatch = false;
        if (type === 'audio') {
            isMatch = this.sequences.letters[trialIndex] === this.sequences.letters[trialIndex - this.currentNLevel];
            this.userResponses.audio[trialIndex] = true;
        } else if (type === 'position') {
            isMatch = this.sequences.positions[trialIndex] === this.sequences.positions[trialIndex - this.currentNLevel];
            this.userResponses.position[trialIndex] = true;
        }

        // Show visual feedback
        this.showFeedback(type, isMatch ? 'correct' : 'incorrect');
    }

    showFeedback(type, result) {
        const feedbackDiv = document.getElementById('inputFeedback');
        if (!feedbackDiv) return;

        const label = type === 'audio' ? 'A' : 'L';
        feedbackDiv.textContent = label;

        // Remove previous classes
        feedbackDiv.classList.remove('correct', 'incorrect', 'neutral', 'show');

        // Add new class and show
        feedbackDiv.classList.add(result, 'show');

        // Hide after animation
        setTimeout(() => {
            feedbackDiv.classList.remove('show');
        }, 600);
    }

    updateGameUI() {
        document.getElementById('nLevel').textContent = this.currentNLevel;
        document.getElementById('currentTrial').textContent = this.currentTrial;
        document.getElementById('totalTrials').textContent = this.settings.trialsPerSession;

        // Calculate current score
        const score = this.calculateCurrentScore();
        document.getElementById('currentScore').textContent = score + '%';
    }

    calculateCurrentScore() {
        if (this.currentTrial <= this.currentNLevel) return 0;

        let correct = 0;
        let total = 0;

        for (let i = this.currentNLevel; i < this.currentTrial; i++) {
            // Check position match
            const posMatch = this.sequences.positions[i] === this.sequences.positions[i - this.currentNLevel];
            const posResponse = this.userResponses.position[i];
            if (posMatch === posResponse) correct++;
            total++;

            // Check audio match
            const audMatch = this.sequences.letters[i] === this.sequences.letters[i - this.currentNLevel];
            const audResponse = this.userResponses.audio[i];
            if (audMatch === audResponse) correct++;
            total++;
        }

        return total > 0 ? Math.round((correct / total) * 100) : 0;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('pauseButton');
        btn.textContent = this.isPaused ? 'Resume' : 'Pause';

        if (!this.isPaused) {
            this.playNextTrial();
        } else {
            clearTimeout(this.trialTimer);
        }
    }

    restartGame() {
        if (!confirm('Restart the current session? Progress will not be saved.')) {
            return;
        }

        // Stop current game
        this.isPlaying = false;
        this.isPaused = false;
        clearTimeout(this.trialTimer);
        window.speechSynthesis.cancel();

        // Reset pause button
        document.getElementById('pauseButton').textContent = 'Pause';

        // Start fresh game
        this.startGame();
    }

    endGame() {
        this.isPlaying = false;
        this.currentSession.endTime = Date.now();

        // Calculate final statistics
        this.calculateSessionStats();

        // Update level based on performance
        this.updateLevel();

        // Save session to history
        this.saveSession();

        // Show results
        this.showResults();
    }

    calculateSessionStats() {
        this.currentSession.positionCorrectRejections = 0;
        this.currentSession.audioCorrectRejections = 0;

        for (let i = this.currentNLevel; i < this.settings.trialsPerSession; i++) {
            // Position scoring
            const posMatch = this.sequences.positions[i] === this.sequences.positions[i - this.currentNLevel];
            const posResponse = this.userResponses.position[i];

            if (posMatch && posResponse) {
                this.currentSession.positionHits++;
            } else if (posMatch && !posResponse) {
                this.currentSession.positionMisses++;
            } else if (!posMatch && posResponse) {
                this.currentSession.positionFalsePos++;
            } else if (!posMatch && !posResponse) {
                this.currentSession.positionCorrectRejections++;
            }

            // Audio scoring
            const audMatch = this.sequences.letters[i] === this.sequences.letters[i - this.currentNLevel];
            const audResponse = this.userResponses.audio[i];

            if (audMatch && audResponse) {
                this.currentSession.audioHits++;
            } else if (audMatch && !audResponse) {
                this.currentSession.audioMisses++;
            } else if (!audMatch && audResponse) {
                this.currentSession.audioFalsePos++;
            } else if (!audMatch && !audResponse) {
                this.currentSession.audioCorrectRejections++;
            }
        }
    }

    updateLevel() {
        const score = this.calculateFinalScore();
        const oldLevel = this.currentNLevel;

        if (score >= 90 && this.currentNLevel < 10) {
            this.currentNLevel++;
            this.currentSession.levelChange = 'increase';
        } else if (score < 50 && this.currentNLevel > 1) {
            this.currentNLevel--;
            this.currentSession.levelChange = 'decrease';
        } else {
            this.currentSession.levelChange = 'same';
        }

        // Update highest level
        if (this.currentNLevel > this.stats.highestLevel) {
            this.stats.highestLevel = this.currentNLevel;
        }

        this.currentSession.newLevel = this.currentNLevel;
    }

    calculateFinalScore() {
        const possible = (this.settings.trialsPerSession - this.currentNLevel) * 2;
        if (possible === 0) return 0;

        // Count all correct responses: hits AND correct rejections
        const correct = this.currentSession.positionHits +
                       this.currentSession.audioHits +
                       (this.currentSession.positionCorrectRejections || 0) +
                       (this.currentSession.audioCorrectRejections || 0);

        return Math.round((correct / possible) * 100);
    }

    saveSession() {
        this.stats.sessions.push({
            ...this.currentSession,
            timestamp: Date.now()
        });

        // Keep only last 50 sessions
        if (this.stats.sessions.length > 50) {
            this.stats.sessions = this.stats.sessions.slice(-50);
        }

        this.stats.totalSessions++;
        this.saveStatistics();
    }

    showResults() {
        // Calculate accuracies
        const posAcc = this.calculateAccuracy(
            this.currentSession.positionHits,
            this.currentSession.positionMisses,
            this.currentSession.positionFalsePos
        );
        const audAcc = this.calculateAccuracy(
            this.currentSession.audioHits,
            this.currentSession.audioMisses,
            this.currentSession.audioFalsePos
        );
        const overall = this.calculateFinalScore();

        // Update results UI
        document.getElementById('resultNLevel').textContent = this.currentSession.nLevel;
        document.getElementById('resultOverallScore').textContent = overall + '%';
        document.getElementById('positionAccuracy').textContent = posAcc + '%';
        document.getElementById('audioAccuracy').textContent = audAcc + '%';
        document.getElementById('positionHits').textContent = this.currentSession.positionHits;
        document.getElementById('audioHits').textContent = this.currentSession.audioHits;
        document.getElementById('positionMisses').textContent = this.currentSession.positionMisses;
        document.getElementById('audioMisses').textContent = this.currentSession.audioMisses;
        document.getElementById('positionFalsePos').textContent = this.currentSession.positionFalsePos;
        document.getElementById('audioFalsePos').textContent = this.currentSession.audioFalsePos;

        // Show level change message
        const levelMsg = document.getElementById('levelChangeMessage');
        levelMsg.className = 'level-change ' + this.currentSession.levelChange;

        if (this.currentSession.levelChange === 'increase') {
            levelMsg.textContent = `Great job! Level increased to ${this.currentSession.newLevel}-Back`;
        } else if (this.currentSession.levelChange === 'decrease') {
            levelMsg.textContent = `Level decreased to ${this.currentSession.newLevel}-Back. Keep practicing!`;
        } else {
            levelMsg.textContent = `Level remains at ${this.currentSession.newLevel}-Back`;
        }

        // Initialize manual level selector
        this.manualNLevel = this.currentNLevel;
        this.updateManualLevelDisplay();

        this.showScreen('results');
    }

    adjustManualLevel(delta) {
        this.manualNLevel = Math.max(1, Math.min(10, this.manualNLevel + delta));
        this.updateManualLevelDisplay();

        // Update the current level to use the manual override
        this.currentNLevel = this.manualNLevel;
    }

    updateManualLevelDisplay() {
        document.getElementById('manualNLevel').textContent = this.manualNLevel;

        // Disable buttons at limits
        document.getElementById('decreaseLevel').disabled = this.manualNLevel <= 1;
        document.getElementById('increaseLevel').disabled = this.manualNLevel >= 10;
    }

    calculateAccuracy(hits, misses, falsePos) {
        const total = hits + misses + falsePos;
        if (total === 0) return 0;
        return Math.round((hits / total) * 100);
    }

    // ===== STATISTICS =====

    updateStatsScreen() {
        const stats = this.stats;

        // Overview
        document.getElementById('totalSessions').textContent = stats.totalSessions;
        document.getElementById('highestLevel').textContent = stats.highestLevel;

        // Calculate average score
        let avgScore = 0;
        if (stats.sessions.length > 0) {
            const scores = stats.sessions.map(s => {
                const correct = s.positionHits + s.audioHits;
                const possible = (s.trials - s.nLevel) * 2;
                return possible > 0 ? (correct / possible) * 100 : 0;
            });
            avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        }
        document.getElementById('averageScore').textContent = avgScore + '%';

        // Calculate total time
        let totalMinutes = 0;
        stats.sessions.forEach(s => {
            if (s.endTime && s.startTime) {
                totalMinutes += (s.endTime - s.startTime) / 1000 / 60;
            }
        });
        document.getElementById('totalTime').textContent = Math.round(totalMinutes) + 'm';

        // Session history
        const historyDiv = document.getElementById('sessionHistory');
        if (stats.sessions.length === 0) {
            historyDiv.innerHTML = '<p class="no-data">No sessions yet. Start training to see your progress!</p>';
        } else {
            historyDiv.innerHTML = '';
            const recentSessions = stats.sessions.slice(-10).reverse();

            recentSessions.forEach(session => {
                const correct = session.positionHits + session.audioHits;
                const possible = (session.trials - session.nLevel) * 2;
                const score = possible > 0 ? Math.round((correct / possible) * 100) : 0;
                const date = new Date(session.timestamp).toLocaleDateString();

                const item = document.createElement('div');
                item.className = 'session-item';
                item.innerHTML = `
                    <span class="session-date">${date}</span>
                    <div class="session-stats">
                        <span>N-Level: ${session.nLevel}</span>
                        <span>Score: ${score}%</span>
                    </div>
                `;
                historyDiv.appendChild(item);
            });
        }
    }

    resetStatistics() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            this.stats = {
                sessions: [],
                totalSessions: 0,
                highestLevel: this.settings.startingNLevel
            };
            this.currentNLevel = this.settings.startingNLevel;
            this.saveStatistics();
            this.updateStatsScreen();
            alert('Statistics have been reset.');
        }
    }

    // ===== SETTINGS =====

    applySettings() {
        this.settings.startingNLevel = parseInt(document.getElementById('startingNLevel').value);
        this.settings.gridSize = parseInt(document.getElementById('gridSize').value);
        this.settings.trialsPerSession = parseInt(document.getElementById('trialsPerSession').value);
        this.settings.stimulusInterval = parseInt(document.getElementById('stimulusInterval').value);
        this.settings.audioVolume = parseInt(document.getElementById('audioVolume').value) / 100;
        this.settings.speechRate = parseFloat(document.getElementById('speechRate').value);

        this.saveSettings();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new DualNBackGame();
});
