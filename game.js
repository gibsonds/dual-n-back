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
            speechRate: 1.0,
            audioMode: 'letters',
            noteDuration: 600,
            scaleType: 'ionian',
            gameMode: 'dual'
        };

        // Game state
        this.currentNLevel = 2;
        this.currentTrial = 0;
        this.sequences = {
            positions: [],
            letters: [],
            colors: []
        };
        this.userResponses = {
            position: [],
            audio: [],
            color: []
        };
        this.letterSet = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
        this.colorSet = [
            { name: 'red', hex: '#e74c3c' },
            { name: 'blue', hex: '#3498db' },
            { name: 'green', hex: '#2ecc71' },
            { name: 'yellow', hex: '#f1c40f' },
            { name: 'purple', hex: '#9b59b6' },
            { name: 'orange', hex: '#e67e22' }
        ];

        // Scale definitions with intervals in semitones
        this.scales = {
            ionian: {
                name: 'Ionian (Major)',
                intervals: [0, 2, 4, 5, 7, 9, 11, 12],
                degrees: ['1', '2', '3', '4', '5', '6', '7', '8']
            },
            harmonicMinor: {
                name: 'Harmonic Minor',
                intervals: [0, 2, 3, 5, 7, 8, 11, 12],
                degrees: ['1', '2', 'b3', '4', '5', 'b6', '7', '8']
            },
            melodicMinor: {
                name: 'Melodic Minor',
                intervals: [0, 2, 3, 5, 7, 9, 11, 12],
                degrees: ['1', '2', 'b3', '4', '5', '6', '7', '8']
            },
            majorBlues: {
                name: 'Major Blues',
                intervals: [0, 2, 3, 4, 7, 9, 10, 12],
                degrees: ['1', '2', 'b3', '3', '5', '6', 'b7', '8']
            },
            minorBlues: {
                name: 'Minor Blues',
                intervals: [0, 3, 5, 6, 7, 10, 12, 15],
                degrees: ['1', 'b3', '4', 'b5', '5', 'b7', '8', 'b10']
            }
        };

        this.baseFrequency = 261.63; // C4
        this.updateScaleFrequencies();
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
        this.updateScaleFrequencies();
    }

    saveSettings() {
        localStorage.setItem('nback_settings', JSON.stringify(this.settings));
    }

    updateScaleFrequencies() {
        const scale = this.scales[this.settings.scaleType];
        if (!scale) return;

        // Calculate frequencies based on scale intervals
        this.noteFrequencies = scale.intervals.map(interval => {
            return this.baseFrequency * Math.pow(2, interval / 12);
        });

        // Create note names based on scale degrees
        this.noteSet = scale.degrees.map((degree, i) => `${degree}`);
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
        document.getElementById('audioMode').value = this.settings.audioMode;
        document.getElementById('scaleType').value = this.settings.scaleType;
        document.getElementById('noteDuration').value = this.settings.noteDuration;
        document.getElementById('audioVolume').value = this.settings.audioVolume * 100;
        document.getElementById('volumeValue').textContent = Math.round(this.settings.audioVolume * 100) + '%';
        document.getElementById('speechRate').value = this.settings.speechRate;
        document.getElementById('gameMode').value = this.settings.gameMode;
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
        document.getElementById('quitButton').addEventListener('click', () => this.quitToMenu());
        document.getElementById('audioMatchBtn').addEventListener('click', () => this.handleInput('audio'));
        document.getElementById('positionMatchBtn').addEventListener('click', () => this.handleInput('position'));
        document.getElementById('colorMatchBtn').addEventListener('click', () => this.handleInput('color'));

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

    async startGame() {
        // Ensure audio context is ready (user interaction requirement)
        if (this.settings.audioMode === 'notes') {
            await this.ensureAudioContext();
        }

        // Check if we're in triple mode
        const isTripleMode = this.settings.gameMode === 'triple';

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
            colorHits: 0,
            colorMisses: 0,
            colorFalsePos: 0,
            startTime: Date.now(),
            endTime: null
        };

        this.currentTrial = 0;
        this.sequences = {
            positions: [],
            letters: [],
            colors: []
        };
        this.userResponses = {
            position: [],
            audio: [],
            color: []
        };

        // Show/hide color controls based on game mode
        const colorControlHint = document.getElementById('colorControlHint');
        const colorMatchBtn = document.getElementById('colorMatchBtn');
        if (isTripleMode) {
            colorControlHint.style.display = '';
            colorMatchBtn.style.display = '';
        } else {
            colorControlHint.style.display = 'none';
            colorMatchBtn.style.display = 'none';
        }

        // Update grid size
        this.updateGridSize();

        // Generate sequences
        this.generateSequences();

        // Show game screen
        this.showScreen('game');
        this.updateGameUI();

        // Show countdown before starting
        this.showCountdown();
    }

    showCountdown() {
        const overlay = document.getElementById('countdownOverlay');
        const text = overlay.querySelector('.countdown-text');

        text.textContent = 'Ready';
        overlay.classList.add('show');

        // Play root note if in notes mode
        if (this.settings.audioMode === 'notes') {
            this.playRootNote();
        }

        setTimeout(() => {
            text.textContent = '3';
        }, 500);

        setTimeout(() => {
            text.textContent = '2';
        }, 1000);

        setTimeout(() => {
            text.textContent = '1';
        }, 1500);

        setTimeout(() => {
            overlay.classList.remove('show');

            // Start playing
            this.isPlaying = true;
            this.isPaused = false;
            this.playNextTrial();
        }, 2000);
    }

    async playRootNote() {
        try {
            // Ensure audio context is ready
            await this.ensureAudioContext();

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = this.noteFrequencies[0];
            oscillator.type = 'sine';

            // Play for 1 second with envelope
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.settings.audioVolume, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

            oscillator.start(now);
            oscillator.stop(now + 1.0);
        } catch (e) {
            console.error('Error in playRootNote:', e);
        }
    }

    generateSequences() {
        const gridSize = this.settings.gridSize;
        const totalCells = gridSize * gridSize;
        const totalTrials = this.settings.trialsPerSession;
        const isTripleMode = this.settings.gameMode === 'triple';

        // Choose audio set based on mode
        const audioSet = this.settings.audioMode === 'notes' ? this.noteSet : this.letterSet;

        // Generate random sequences
        for (let i = 0; i < totalTrials; i++) {
            this.sequences.positions.push(Math.floor(Math.random() * totalCells));
            this.sequences.letters.push(audioSet[Math.floor(Math.random() * audioSet.length)]);

            // Add color sequence for triple mode
            if (isTripleMode) {
                this.sequences.colors.push(Math.floor(Math.random() * this.colorSet.length));
            }
        }

        // Initialize user responses
        this.userResponses.position = new Array(totalTrials).fill(false);
        this.userResponses.audio = new Array(totalTrials).fill(false);

        if (isTripleMode) {
            this.userResponses.color = new Array(totalTrials).fill(false);
        }
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
        const isTripleMode = this.settings.gameMode === 'triple';

        // Clear previous highlights and colors
        cells.forEach(cell => {
            cell.classList.remove('active');
            if (isTripleMode) {
                cell.style.backgroundColor = '';
            }
        });

        cells[position].classList.add('active');

        // Add color in triple mode
        if (isTripleMode) {
            const colorIndex = this.sequences.colors[this.currentTrial];
            const color = this.colorSet[colorIndex];
            cells[position].style.backgroundColor = color.hex;
        }

        // Remove highlight after a delay
        setTimeout(() => {
            cells[position].classList.remove('active');
            if (isTripleMode) {
                cells[position].style.backgroundColor = '';
            }
        }, this.settings.stimulusInterval * 0.4);
    }

    async ensureAudioContext() {
        // Create audio context if it doesn't exist
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume if suspended
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                console.error('Failed to resume audio context:', e);
            }
        }
    }

    speakLetter(letter) {
        if (this.settings.audioMode === 'notes') {
            this.playMusicalNote(letter);
        } else {
            try {
                if ('speechSynthesis' in window) {
                    // Cancel any pending speech to prevent queue buildup
                    window.speechSynthesis.cancel();

                    const utterance = new SpeechSynthesisUtterance(letter.toLowerCase());
                    utterance.rate = this.settings.speechRate;
                    utterance.volume = this.settings.audioVolume;
                    utterance.pitch = 1.0;
                    utterance.lang = 'en-US';

                    utterance.onerror = (e) => {
                        console.error('Speech synthesis error:', e);
                    };

                    window.speechSynthesis.speak(utterance);
                }
            } catch (e) {
                console.error('Error in speakLetter:', e);
            }
        }
    }

    async playMusicalNote(note) {
        try {
            // Get the frequency for this note
            const noteIndex = this.noteSet.indexOf(note);
            if (noteIndex === -1) {
                console.error('Note not found:', note);
                return;
            }

            const frequency = this.noteFrequencies[noteIndex];
            if (!frequency) {
                console.error('Frequency not found for note:', note);
                return;
            }

            // Ensure audio context is ready
            await this.ensureAudioContext();

            // Create oscillator for the tone
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            // Set volume
            gainNode.gain.value = this.settings.audioVolume;

            // Play note with envelope (duration in milliseconds converted to seconds)
            const duration = this.settings.noteDuration / 1000;
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.settings.audioVolume, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            console.error('Error in playMusicalNote:', e);
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
        } else if (key === 'c' && this.settings.gameMode === 'triple') {
            this.handleInput('color');
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
        } else if (type === 'color') {
            isMatch = this.sequences.colors[trialIndex] === this.sequences.colors[trialIndex - this.currentNLevel];
            this.userResponses.color[trialIndex] = true;
        }

        // Show visual feedback
        this.showFeedback(type, isMatch ? 'correct' : 'incorrect');
    }

    showFeedback(type, result) {
        const feedbackDiv = document.getElementById('inputFeedback');
        if (!feedbackDiv) return;

        let label = 'A';
        if (type === 'position') label = 'L';
        else if (type === 'color') label = 'C';

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

        const isTripleMode = this.settings.gameMode === 'triple';
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

            // Check color match in triple mode
            if (isTripleMode) {
                const colorMatch = this.sequences.colors[i] === this.sequences.colors[i - this.currentNLevel];
                const colorResponse = this.userResponses.color[i];
                if (colorMatch === colorResponse) correct++;
                total++;
            }
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

    quitToMenu() {
        if (!confirm('Quit to main menu? Progress will not be saved.')) {
            return;
        }

        // Stop current game
        this.isPlaying = false;
        this.isPaused = false;
        clearTimeout(this.trialTimer);
        window.speechSynthesis.cancel();

        // Reset pause button
        document.getElementById('pauseButton').textContent = 'Pause';

        // Return to start screen
        this.showScreen('start');
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
        const isTripleMode = this.settings.gameMode === 'triple';
        this.currentSession.positionCorrectRejections = 0;
        this.currentSession.audioCorrectRejections = 0;
        this.currentSession.colorCorrectRejections = 0;

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

            // Color scoring in triple mode
            if (isTripleMode) {
                const colorMatch = this.sequences.colors[i] === this.sequences.colors[i - this.currentNLevel];
                const colorResponse = this.userResponses.color[i];

                if (colorMatch && colorResponse) {
                    this.currentSession.colorHits++;
                } else if (colorMatch && !colorResponse) {
                    this.currentSession.colorMisses++;
                } else if (!colorMatch && colorResponse) {
                    this.currentSession.colorFalsePos++;
                } else if (!colorMatch && !colorResponse) {
                    this.currentSession.colorCorrectRejections++;
                }
            }
        }
    }

    updateLevel() {
        const score = this.calculateFinalScore();
        const oldLevel = this.currentNLevel;

        // Check for level increase - requires 2 consecutive high scores at current level
        if (score >= 90 && this.currentNLevel < 10) {
            // Check last session at this level
            const recentSessions = this.stats.sessions.slice(-2);
            let canPromote = false;

            if (recentSessions.length >= 1) {
                const lastSession = recentSessions[recentSessions.length - 1];
                const lastScore = this.calculateSessionScore(lastSession);

                // If last session was also at this level and scored >= 90%, promote
                if (lastSession.nLevel === this.currentNLevel && lastScore >= 90) {
                    canPromote = true;
                }
            } else {
                // First session ever, need to prove consistency
                canPromote = false;
            }

            if (canPromote) {
                this.currentNLevel++;
                this.currentSession.levelChange = 'increase';
            } else {
                this.currentSession.levelChange = 'same';
                this.currentSession.promotionProgress = '1/2 high scores needed';
            }
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

    calculateSessionScore(session) {
        const isTripleMode = session.colorHits !== undefined;
        const multiplier = isTripleMode ? 3 : 2;
        const correct = (session.positionHits || 0) +
                       (session.audioHits || 0) +
                       (session.colorHits || 0) +
                       (session.positionCorrectRejections || 0) +
                       (session.audioCorrectRejections || 0) +
                       (session.colorCorrectRejections || 0);
        const possible = (session.trials - session.nLevel) * multiplier;
        return possible > 0 ? Math.round((correct / possible) * 100) : 0;
    }

    calculateFinalScore() {
        const isTripleMode = this.settings.gameMode === 'triple';
        const multiplier = isTripleMode ? 3 : 2;
        const possible = (this.settings.trialsPerSession - this.currentNLevel) * multiplier;
        if (possible === 0) return 0;

        // Count all correct responses: hits AND correct rejections
        const correct = this.currentSession.positionHits +
                       this.currentSession.audioHits +
                       (this.currentSession.colorHits || 0) +
                       (this.currentSession.positionCorrectRejections || 0) +
                       (this.currentSession.audioCorrectRejections || 0) +
                       (this.currentSession.colorCorrectRejections || 0);

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
        const isTripleMode = this.settings.gameMode === 'triple';

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

        // Show/hide color column based on mode
        const colorHeader = document.getElementById('colorColumnHeader');
        const colorAccuracyCell = document.getElementById('colorAccuracy');
        const colorHitsCell = document.getElementById('colorHits');
        const colorMissesCell = document.getElementById('colorMisses');
        const colorFalsePosCell = document.getElementById('colorFalsePos');

        if (isTripleMode) {
            const colorAcc = this.calculateAccuracy(
                this.currentSession.colorHits,
                this.currentSession.colorMisses,
                this.currentSession.colorFalsePos
            );

            colorHeader.style.display = '';
            colorAccuracyCell.style.display = '';
            colorHitsCell.style.display = '';
            colorMissesCell.style.display = '';
            colorFalsePosCell.style.display = '';

            colorAccuracyCell.textContent = colorAcc + '%';
            colorHitsCell.textContent = this.currentSession.colorHits;
            colorMissesCell.textContent = this.currentSession.colorMisses;
            colorFalsePosCell.textContent = this.currentSession.colorFalsePos;
        } else {
            colorHeader.style.display = 'none';
            colorAccuracyCell.style.display = 'none';
            colorHitsCell.style.display = 'none';
            colorMissesCell.style.display = 'none';
            colorFalsePosCell.style.display = 'none';
        }

        // Show level change message
        const levelMsg = document.getElementById('levelChangeMessage');
        levelMsg.className = 'level-change ' + this.currentSession.levelChange;

        if (this.currentSession.levelChange === 'increase') {
            levelMsg.textContent = `Great job! Level increased to ${this.currentSession.newLevel}-Back`;
        } else if (this.currentSession.levelChange === 'decrease') {
            levelMsg.textContent = `Level decreased to ${this.currentSession.newLevel}-Back. Keep practicing!`;
        } else {
            let message = `Level remains at ${this.currentSession.newLevel}-Back`;
            if (this.currentSession.promotionProgress) {
                message += ` (${this.currentSession.promotionProgress})`;
            }
            levelMsg.textContent = message;
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

        // Calculate position vs audio performance breakdown
        let avgPositionAcc = 0;
        let avgAudioAcc = 0;
        if (stats.sessions.length > 0) {
            const positionAccs = [];
            const audioAccs = [];

            stats.sessions.forEach(s => {
                const posTotal = s.positionHits + s.positionMisses + (s.positionFalsePos || 0);
                const audTotal = s.audioHits + s.audioMisses + (s.audioFalsePos || 0);

                if (posTotal > 0) {
                    positionAccs.push((s.positionHits / posTotal) * 100);
                }
                if (audTotal > 0) {
                    audioAccs.push((s.audioHits / audTotal) * 100);
                }
            });

            if (positionAccs.length > 0) {
                avgPositionAcc = Math.round(positionAccs.reduce((a, b) => a + b, 0) / positionAccs.length);
            }
            if (audioAccs.length > 0) {
                avgAudioAcc = Math.round(audioAccs.reduce((a, b) => a + b, 0) / audioAccs.length);
            }
        }

        document.getElementById('avgPositionAcc').textContent = avgPositionAcc + '%';
        document.getElementById('avgAudioAcc').textContent = avgAudioAcc + '%';
        document.getElementById('positionBar').style.width = avgPositionAcc + '%';
        document.getElementById('audioBar').style.width = avgAudioAcc + '%';

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
        const oldAudioMode = this.settings.audioMode;

        this.settings.startingNLevel = parseInt(document.getElementById('startingNLevel').value);
        this.settings.gridSize = parseInt(document.getElementById('gridSize').value);
        this.settings.trialsPerSession = parseInt(document.getElementById('trialsPerSession').value);
        this.settings.stimulusInterval = parseInt(document.getElementById('stimulusInterval').value);
        this.settings.audioMode = document.getElementById('audioMode').value;
        this.settings.scaleType = document.getElementById('scaleType').value;
        this.settings.noteDuration = parseInt(document.getElementById('noteDuration').value);
        this.settings.audioVolume = parseInt(document.getElementById('audioVolume').value) / 100;
        this.settings.speechRate = parseFloat(document.getElementById('speechRate').value);
        this.settings.gameMode = document.getElementById('gameMode').value;

        // If switching audio modes, clean up
        if (oldAudioMode !== this.settings.audioMode) {
            if (oldAudioMode === 'letters' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            if (this.settings.audioMode === 'notes') {
                // Ensure audio context is created and ready
                this.ensureAudioContext();
            }
        }

        this.updateScaleFrequencies();
        this.saveSettings();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new DualNBackGame();
});
