/* ============================================
   FLIGHT DEXTERITY TEST - CLEAN GAME LOGIC
   Square PFD with Green FD
   ============================================ */

class FlightDexterityGame {
    constructor() {
        // Game state
        this.isRunning = false;
        this.timeRemaining = 210;
        this.score = 0;
        this.totalAccuracy = 0;
        this.accuracySamples = 0;

        // Physics
        this.config = {
            rollAcceleration: 0.04,  // Reduced from 0.08
            pitchAcceleration: 0.03, // Reduced from 0.06
            damping: 0.97,
            maxRollVelocity: 1.2,    // Reduced from 1.5
            maxPitchVelocity: 1.0,   // Reduced from 1.2
            speedRate: 0.8           // Reduced from 1.0
        };

        // Aircraft state
        this.roll = 0;
        this.pitch = 0;
        this.rollVelocity = 0;
        this.pitchVelocity = 0;
        this.airspeed = 300;
        this.heading = 270;
        this.altitude = 25000;

        // SELECTED TARGETS (these drive the Flight Director)
        this.targetSpeed = 300;
        this.targetAltitude = 25000;
        this.targetHeading = 270;

        // Flight Director display
        this.fdDisplayX = 0;
        this.fdDisplayY = 0;

        // Display values
        this.displayRoll = 0;
        this.displayPitch = 0;
        this.displaySpeed = 300;
        this.displayAltitude = 25000;
        this.displayHeading = 270;

        // Stabilization
        this.stabilizedTimer = 0;

        // Limits
        this.maxRoll = 60;
        this.maxPitch = 25;
        this.speedRange = { min: 250, max: 400 };
        this.altitudeRange = { min: 20000, max: 32000 };

        // Keys
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            KeyS: false,
            KeyX: false
        };

        // Canvas
        this.attitudeCanvas = document.getElementById('attitude-canvas');
        this.speedCanvas = document.getElementById('speed-canvas');
        this.altitudeCanvas = document.getElementById('altitude-canvas');
        this.headingCanvas = document.getElementById('heading-canvas');

        // DOM
        this.timerEl = document.getElementById('timer');
        this.scoreEl = document.getElementById('score');
        this.accuracyEl = document.getElementById('accuracy');
        this.speedTargetEl = document.getElementById('speed-target');
        this.altitudeTargetEl = document.getElementById('altitude-target');
        this.currentSpeedEl = document.getElementById('current-speed');
        this.currentAltitudeEl = document.getElementById('current-altitude');
        this.currentHeadingEl = document.getElementById('current-heading');
        this.speedBugEl = document.getElementById('speed-bug');
        this.altitudeBugEl = document.getElementById('altitude-bug');
        this.fdHorizontalEl = document.getElementById('fd-horizontal');
        this.fdVerticalEl = document.getElementById('fd-vertical');
        this.startOverlay = document.getElementById('start-overlay');
        this.endOverlay = document.getElementById('end-overlay');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');

        this.init();
    }

    init() {
        this.setupCanvases();
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        this.render();
    }

    setupCanvases() {
        const dpr = window.devicePixelRatio || 1;
        [
            { c: this.attitudeCanvas, n: 'attCtx' },
            { c: this.speedCanvas, n: 'speedCtx' },
            { c: this.altitudeCanvas, n: 'altCtx' },
            { c: this.headingCanvas, n: 'hdgCtx' }
        ].forEach(({ c, n }) => {
            const r = c.getBoundingClientRect();
            c.width = r.width * dpr;
            c.height = r.height * dpr;
            this[n] = c.getContext('2d');
            this[n].scale(dpr, dpr);
        });
    }

    handleKeyDown(e) {
        if (this.keys.hasOwnProperty(e.code)) {
            this.keys[e.code] = true;
            e.preventDefault();
        }
    }

    handleKeyUp(e) {
        if (this.keys.hasOwnProperty(e.code)) {
            this.keys[e.code] = false;
            e.preventDefault();
        }
    }

    lerp(a, b, t) { return a + (b - a) * t; }

    lerpAngle(a, b, t) {
        let d = b - a;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        let r = a + d * t;
        if (r < 0) r += 360;
        if (r >= 360) r -= 360;
        return r;
    }

    startGame() {
        this.isRunning = true;
        this.timeRemaining = 210;
        this.score = 0;
        this.totalAccuracy = 0;
        this.accuracySamples = 0;

        this.roll = 0;
        this.pitch = 0;
        this.rollVelocity = 0;
        this.pitchVelocity = 0;
        this.airspeed = 320;
        this.heading = 270;
        this.altitude = 25000;

        this.fdDisplayX = 0;
        this.fdDisplayY = 0;
        this.displayRoll = 0;
        this.displayPitch = 0;
        this.displaySpeed = 320;
        this.displayAltitude = 25000;
        this.displayHeading = 270;

        this.stabilizedTimer = 0;
        this.generateNewTargets();

        this.startOverlay.classList.add('hidden');
        this.endOverlay.classList.add('hidden');

        this.lastTime = performance.now();
        this.gameLoop();
    }

    restartGame() { this.startGame(); }

    generateNewTargets() {
        // ============================================
        // Generate new SELECTED targets (what drives the FD)
        // ============================================

        // Target ALTITUDE - jump 2000-5000ft away from current
        const altOffset = (Math.random() > 0.5 ? 1 : -1) * (2000 + Math.random() * 3000);
        let newAlt = this.altitude + altOffset;
        // If would go out of range, reverse direction
        if (newAlt > this.altitudeRange.max) newAlt = this.altitude - Math.abs(altOffset);
        if (newAlt < this.altitudeRange.min) newAlt = this.altitude + Math.abs(altOffset);
        this.targetAltitude = Math.round(Math.max(this.altitudeRange.min, Math.min(this.altitudeRange.max, newAlt)));

        // Target HEADING - turn 40-90° from current
        const hdgOffset = (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 50);
        this.targetHeading = (this.heading + hdgOffset + 360) % 360;

        // Target SPEED - 30-80kts different
        const spdOffset = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 50);
        let newSpd = this.airspeed + spdOffset;
        if (newSpd > this.speedRange.max) newSpd = this.airspeed - Math.abs(spdOffset);
        if (newSpd < this.speedRange.min) newSpd = this.airspeed + Math.abs(spdOffset);
        this.targetSpeed = Math.round(Math.max(this.speedRange.min, Math.min(this.speedRange.max, newSpd)));

        // Update UI displays
        this.speedTargetEl.textContent = this.targetSpeed;
        this.altitudeTargetEl.textContent = this.targetAltitude;
    }

    gameLoop() {
        if (!this.isRunning) return;

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        this.update(dt);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    update(dt) {
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.endGame();
            return;
        }

        const cfg = this.config;

        // Inputs -> Velocity (inertia)
        if (this.keys.ArrowLeft) this.rollVelocity -= cfg.rollAcceleration;
        if (this.keys.ArrowRight) this.rollVelocity += cfg.rollAcceleration;
        if (this.keys.ArrowUp) this.pitchVelocity -= cfg.pitchAcceleration;
        if (this.keys.ArrowDown) this.pitchVelocity += cfg.pitchAcceleration;

        // Damping
        this.rollVelocity *= cfg.damping;
        this.pitchVelocity *= cfg.damping;
        this.rollVelocity = Math.max(-cfg.maxRollVelocity, Math.min(cfg.maxRollVelocity, this.rollVelocity));
        this.pitchVelocity = Math.max(-cfg.maxPitchVelocity, Math.min(cfg.maxPitchVelocity, this.pitchVelocity));

        // Position
        this.roll += this.rollVelocity;
        this.pitch += this.pitchVelocity;
        this.roll = Math.max(-this.maxRoll, Math.min(this.maxRoll, this.roll));
        this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));

        // Speed
        if (this.keys.KeyS) this.airspeed = Math.min(this.speedRange.max, this.airspeed + cfg.speedRate);
        if (this.keys.KeyX) this.airspeed = Math.max(this.speedRange.min, this.airspeed - cfg.speedRate);

        // Heading & Altitude
        this.heading += this.roll * 0.3 * dt;
        if (this.heading < 0) this.heading += 360;
        if (this.heading >= 360) this.heading -= 360;
        this.altitude -= this.pitch * 50 * dt;
        this.altitude = Math.max(this.altitudeRange.min, Math.min(this.altitudeRange.max, this.altitude));

        // ============================================
        // FLIGHT DIRECTOR - Driven by SELECTED targets
        // Vertical FD = climb/descend to reach selected ALTITUDE
        // Horizontal FD = turn left/right to reach selected HEADING
        // ============================================

        // VERTICAL FD: Altitude error drives pitch command
        // If selected altitude is ABOVE current → FD bar is UP → pitch up
        const altError = this.targetAltitude - this.altitude;
        // Scale: 500ft difference = ~40px deflection (more sensitive!)
        const fdTargetY = -altError * 0.2; // Increased from 0.08

        // HORIZONTAL FD: Heading error drives roll command
        // If selected heading is to the LEFT → FD bar is LEFT → bank left
        let hdgError = this.targetHeading - this.heading;
        if (hdgError > 180) hdgError -= 360;
        if (hdgError < -180) hdgError += 360;
        // Scale: 20° heading difference = ~60px deflection (more sensitive!)
        const fdTargetX = hdgError * 3; // Increased from 2

        // Smooth FD movement
        this.fdDisplayX = this.lerp(this.fdDisplayX, fdTargetX, 0.15);
        this.fdDisplayY = this.lerp(this.fdDisplayY, fdTargetY, 0.15);
        this.fdDisplayX = Math.max(-100, Math.min(100, this.fdDisplayX));
        this.fdDisplayY = Math.max(-100, Math.min(100, this.fdDisplayY));

        // Display smoothing
        this.displayRoll = this.lerp(this.displayRoll, this.roll, 0.15);
        this.displayPitch = this.lerp(this.displayPitch, this.pitch, 0.15);
        this.displaySpeed = this.lerp(this.displaySpeed, this.airspeed, 0.1);
        this.displayAltitude = this.lerp(this.displayAltitude, this.altitude, 0.1);
        this.displayHeading = this.lerpAngle(this.displayHeading, this.heading, 0.1);

        // ============================================
        // CHASE CHECK - FD is centered when at targets
        // ============================================
        const altThreshold = 200; // Within 200ft of target altitude
        const hdgThreshold = 5;   // Within 5° of target heading
        const spdThreshold = 10;  // Within 10kts of target speed

        const atTargetAlt = Math.abs(altError) < altThreshold;
        const atTargetHdg = Math.abs(hdgError) < hdgThreshold;
        const atTargetSpd = Math.abs(this.targetSpeed - this.airspeed) < spdThreshold;

        const hasCaught = atTargetAlt && atTargetHdg && atTargetSpd;

        if (hasCaught) {
            this.stabilizedTimer += dt;
            if (this.stabilizedTimer >= 1.5) {
                this.generateNewTargets();
                this.stabilizedTimer = 0;
            }
        } else {
            this.stabilizedTimer = 0;
        }

        // Score based on how centered the FD is
        const fdCenterError = (Math.abs(this.fdDisplayX) + Math.abs(this.fdDisplayY)) / 200;
        const accuracy = Math.max(0, (1 - fdCenterError) * 100);
        this.totalAccuracy += accuracy;
        this.accuracySamples++;
        this.score += Math.floor(accuracy * dt * 10);

        this.updateUI();
    }

    updateUI() {
        const mins = Math.floor(this.timeRemaining / 60);
        const secs = Math.floor(this.timeRemaining % 60);
        this.timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        this.scoreEl.textContent = this.score.toLocaleString();
        const avgAcc = this.accuracySamples > 0 ? Math.round(this.totalAccuracy / this.accuracySamples) : 100;
        this.accuracyEl.textContent = `${avgAcc}%`;

        this.currentSpeedEl.textContent = Math.round(this.displaySpeed);
        this.currentAltitudeEl.textContent = Math.round(this.displayAltitude);
        this.currentHeadingEl.textContent = `${Math.round(this.displayHeading)}°`;

        // FD position
        this.fdHorizontalEl.style.transform = `translate(-50%, calc(-50% + ${this.fdDisplayY}px))`;
        this.fdVerticalEl.style.transform = `translate(calc(-50% + ${this.fdDisplayX}px), -50%)`;
    }

    render() {
        this.renderAttitude();
        this.renderSpeedTape();
        this.renderAltitudeTape();
        this.renderHeading();
    }

    renderAttitude() {
        const ctx = this.attCtx;
        const w = this.attitudeCanvas.getBoundingClientRect().width;
        const h = this.attitudeCanvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.clearRect(0, 0, w, h);

        // Rotate for roll, translate for pitch
        ctx.translate(cx, cy);
        ctx.rotate(-this.displayRoll * Math.PI / 180);
        // Negative pitch = nose up = horizon moves down (show more sky)
        // Positive pitch = nose down = horizon moves up (show more ground)
        const pitchPx = -this.displayPitch * 5;

        // Sky
        ctx.fillStyle = '#0596FF';
        ctx.fillRect(-w, -h * 2, w * 2, h * 2 + pitchPx);

        // Ground
        ctx.fillStyle = '#A25625';
        ctx.fillRect(-w, pitchPx, w * 2, h * 2);

        // Horizon line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-w, pitchPx);
        ctx.lineTo(w, pitchPx);
        ctx.stroke();

        // Pitch ladder
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px B612 Mono';
        ctx.textAlign = 'center';
        ctx.lineWidth = 2;

        for (let p = -30; p <= 30; p += 10) {
            if (p === 0) continue;
            const y = pitchPx - p * 5;
            const lw = 50;

            ctx.beginPath();
            ctx.moveTo(-lw, y);
            ctx.lineTo(-15, y);
            ctx.moveTo(15, y);
            ctx.lineTo(lw, y);
            ctx.stroke();

            ctx.fillText(Math.abs(p).toString(), -lw - 18, y + 4);
            ctx.fillText(Math.abs(p).toString(), lw + 18, y + 4);
        }

        ctx.restore();

        // Bank arc
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        const br = Math.min(w, h) / 2 - 15;
        ctx.beginPath();
        ctx.arc(cx, cy, br, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();

        // Bank marks
        [60, 45, 30, 20, 10, 0, -10, -20, -30, -45, -60].forEach(a => {
            const rad = (-a - 90) * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(rad) * (br - 8), cy + Math.sin(rad) * (br - 8));
            ctx.lineTo(cx + Math.cos(rad) * br, cy + Math.sin(rad) * br);
            ctx.stroke();
        });

        // Bank pointer (moves with roll)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-this.displayRoll * Math.PI / 180);
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(0, -br + 3);
        ctx.lineTo(-8, -br + 15);
        ctx.lineTo(8, -br + 15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    renderSpeedTape() {
        const ctx = this.speedCtx;
        const w = this.speedCanvas.getBoundingClientRect().width;
        const h = this.speedCanvas.getBoundingClientRect().height;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px B612 Mono';
        ctx.textAlign = 'right';
        ctx.lineWidth = 1;

        for (let s = Math.floor(this.displaySpeed - 60); s <= Math.ceil(this.displaySpeed + 60); s += 5) {
            const y = cy - (s - this.displaySpeed) * 3;
            if (y < 0 || y > h) continue;

            const major = s % 10 === 0;
            ctx.beginPath();
            ctx.moveTo(w, y);
            ctx.lineTo(w - (major ? 15 : 8), y);
            ctx.stroke();

            if (major && s > 0) ctx.fillText(s.toString(), w - 18, y + 4);
        }

        // MAGENTA SPEED TARGET MARKER
        const targetY = cy - (this.targetSpeed - this.displaySpeed) * 3;
        if (targetY >= -10 && targetY <= h + 10) {
            ctx.fillStyle = '#ff00ff';
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            // Draw triangle pointing right
            ctx.beginPath();
            ctx.moveTo(0, targetY);
            ctx.lineTo(12, targetY - 8);
            ctx.lineTo(12, targetY + 8);
            ctx.closePath();
            ctx.fill();
        }
    }

    renderAltitudeTape() {
        const ctx = this.altCtx;
        const w = this.altitudeCanvas.getBoundingClientRect().width;
        const h = this.altitudeCanvas.getBoundingClientRect().height;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px B612 Mono';
        ctx.textAlign = 'left';
        ctx.lineWidth = 1;

        for (let a = Math.floor((this.displayAltitude - 5000) / 500) * 500;
            a <= Math.ceil((this.displayAltitude + 5000) / 500) * 500;
            a += 500) {
            const y = cy - (a - this.displayAltitude) * 0.03;
            if (y < 0 || y > h) continue;

            const major = a % 1000 === 0;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(major ? 15 : 8, y);
            ctx.stroke();

            if (major) ctx.fillText(a.toString(), 18, y + 4);
        }

        // MAGENTA TARGET ALTITUDE MARKER
        const targetY = cy - (this.targetAltitude - this.displayAltitude) * 0.03;
        if (targetY >= -10 && targetY <= h + 10) {
            ctx.fillStyle = '#ff00ff';
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            // Draw triangle pointing left
            ctx.beginPath();
            ctx.moveTo(w, targetY);
            ctx.lineTo(w - 12, targetY - 8);
            ctx.lineTo(w - 12, targetY + 8);
            ctx.closePath();
            ctx.fill();
        }
    }

    renderHeading() {
        const ctx = this.hdgCtx;
        const w = this.headingCanvas.getBoundingClientRect().width;
        const h = this.headingCanvas.getBoundingClientRect().height;
        const cx = w / 2;

        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px B612 Mono';
        ctx.textAlign = 'center';
        ctx.lineWidth = 1;

        for (let hdg = Math.floor(this.displayHeading - 40); hdg <= Math.ceil(this.displayHeading + 40); hdg += 5) {
            let disp = hdg;
            if (disp < 0) disp += 360;
            if (disp >= 360) disp -= 360;

            const x = cx + (hdg - this.displayHeading) * 4;
            if (x < 0 || x > w) continue;

            const major = disp % 10 === 0;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, major ? 12 : 6);
            ctx.stroke();

            if (major) ctx.fillText(disp.toString(), x, h - 10);
        }

        // MAGENTA HEADING BUG (target heading)
        let hdgDiff = this.targetHeading - this.displayHeading;
        if (hdgDiff > 180) hdgDiff -= 360;
        if (hdgDiff < -180) hdgDiff += 360;
        const bugX = cx + hdgDiff * 4;

        if (bugX >= -10 && bugX <= w + 10) {
            ctx.fillStyle = '#ff00ff';
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            // Draw diamond marker
            ctx.beginPath();
            ctx.moveTo(bugX, h - 5);
            ctx.lineTo(bugX - 6, h - 12);
            ctx.lineTo(bugX, h - 19);
            ctx.lineTo(bugX + 6, h - 12);
            ctx.closePath();
            ctx.fill();
        }

        // Current heading marker (yellow triangle at top)
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx - 6, 12);
        ctx.lineTo(cx + 6, 12);
        ctx.closePath();
        ctx.fill();
    }

    endGame() {
        this.isRunning = false;
        const avgAcc = this.accuracySamples > 0 ? Math.round(this.totalAccuracy / this.accuracySamples) : 0;

        let rating = 'F';
        if (avgAcc >= 90) rating = 'A+';
        else if (avgAcc >= 80) rating = 'A';
        else if (avgAcc >= 70) rating = 'B';
        else if (avgAcc >= 60) rating = 'C';
        else if (avgAcc >= 50) rating = 'D';

        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-accuracy').textContent = `${avgAcc}%`;
        document.getElementById('final-rating').textContent = rating;

        const el = document.getElementById('final-rating');
        const colors = { 'A+': '#00ff88', 'A': '#00ff88', 'B': '#00ffff', 'C': '#ffff00', 'D': '#ff8800', 'F': '#ff4444' };
        el.style.color = colors[rating];

        this.endOverlay.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FlightDexterityGame();
});
