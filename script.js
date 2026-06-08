// --- UTILIDAD DE AUDIO GLOBAL ---
// Evita crear un AudioContext por cada sonido, lo cual causa errores en el navegador a largo plazo.
const AudioEngine = {
    ctx: null,
    osc: null,
    gain: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    playOscillator(durationSec, intervals) {
        this.init();
        this.stop(); // Detener cualquier sonido previo
        
        this.osc = this.ctx.createOscillator();
        this.gain = this.ctx.createGain();
        
        this.osc.connect(this.gain);
        this.gain.connect(this.ctx.destination);
        
        this.osc.type = 'square';
        this.osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        
        const now = this.ctx.currentTime;
        for (let i = 0; i < intervals; i++) {
            const t = now + i * 0.5;
            this.gain.gain.setValueAtTime(0.3, t);
            this.gain.gain.setValueAtTime(0, t + 0.25);
        }
        
        this.osc.start(now);
        this.osc.stop(now + durationSec);
    },
    stop() {
        if (this.osc) {
            try { this.osc.stop(); this.osc.disconnect(); } catch (e) {}
            this.osc = null;
        }
        if (this.gain) {
            this.gain.disconnect();
            this.gain = null;
        }
    }
};

// --- CLASES VISUALES (Se mantienen casi igual, muy buen código) ---
class Starfield {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.numStars = 140;
        this.init();
    }
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.generateStars();
        this.animate();
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    generateStars() {
        this.stars = [];
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                r: Math.random() * 1.8 + 0.3,
                a: Math.random(),
                s: Math.random() * 0.012 + 0.004
            });
        }
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const isLight = document.body.classList.contains('light');
        this.stars.forEach(st => {
            st.a += st.s;
            if (st.a > 1 || st.a < 0) st.s = -st.s;
            const alpha = Math.abs(st.a);
            this.ctx.beginPath();
            this.ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
            this.ctx.fillStyle = isLight
                ? `rgba(100, 120, 180, ${alpha * 0.3})`
                : `rgba(200, 220, 255, ${alpha * 0.6})`;
            this.ctx.fill();
        });
        requestAnimationFrame(() => this.animate());
    }
}

class AnalogClock {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.animate();
    }
    draw(h, m, s, ms) {
        const ctx = this.ctx;
        const cw = this.canvas.width, ch = this.canvas.height;
        const cx = cw / 2, cy = ch / 2, r = Math.min(cx, cy) - 4;
        const isLight = document.body.classList.contains('light');

        ctx.clearRect(0, 0, cw, ch);

        const h12 = h % 12;
        const smoothSec = s + ms / 1000;

        const bgCol = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = bgCol;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        for (let i = 0; i < 12; i++) {
            const ang = (i * 30 - 90) * Math.PI / 180;
            const inner = r * 0.82;
            const outer = i % 3 === 0 ? r * 0.9 : r * 0.86;
            const x1 = cx + inner * Math.cos(ang), y1 = cy + inner * Math.sin(ang);
            const x2 = cx + outer * Math.cos(ang), y2 = cy + outer * Math.sin(ang);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = i % 3 === 0 ? 2 : 1;
            ctx.stroke();
        }

        const hAng = ((h12 + m / 60) * 30 - 90) * Math.PI / 180;
        const mAng = ((m + s / 60) * 6 - 90) * Math.PI / 180;
        const sAng = (smoothSec * 6 - 90) * Math.PI / 180;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * 0.45 * Math.cos(hAng), cy + r * 0.45 * Math.sin(hAng));
        ctx.strokeStyle = isLight ? '#1a1a2e' : '#fff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * 0.6 * Math.cos(mAng), cy + r * 0.6 * Math.sin(mAng));
        ctx.strokeStyle = isLight ? '#1a1a2e' : '#ddd';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx - r * 0.12 * Math.cos(sAng + Math.PI), cy - r * 0.12 * Math.sin(sAng + Math.PI));
        ctx.lineTo(cx + r * 0.7 * Math.cos(sAng), cy + r * 0.7 * Math.sin(sAng));
        ctx.strokeStyle = '#ff2255';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.shadowColor = 'rgba(255,34,85,0.4)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff2255';
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    animate() {
        const now = new Date();
        this.draw(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        requestAnimationFrame(() => this.animate());
    }
}

class PremiumClock {
    constructor() {
        this.DOM = {
            hours: document.getElementById('hours'),
            minutes: document.getElementById('minutes'),
            seconds: document.getElementById('seconds'),
            ampm: document.getElementById('ampm'),
            greeting: document.getElementById('greeting'),
            dateDisplay: document.getElementById('dateDisplay'),
            weekNum: document.getElementById('weekNum'),
            dayYear: document.getElementById('dayYear'),
            timezone: document.getElementById('timezone'),
            secProgress: document.getElementById('secProgress')
        };
        this.circumference = 289.03;
        this.MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        this.DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        this.start();
    }
    getWeekNumber(d) {
        const start = new Date(d.getFullYear(), 0, 1);
        const diff = (d - start + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000) / 86400000;
        return Math.ceil((diff + start.getDay() + 1) / 7);
    }
    pad(n) { return n.toString().padStart(2, '0'); }
    update() {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();
        const ms = now.getMilliseconds();
        const h12 = h % 12 || 12;
        const ampm = h >= 12 ? 'PM' : 'AM';

        this.DOM.hours.textContent = this.pad(h12);
        this.DOM.minutes.textContent = this.pad(m);
        this.DOM.seconds.textContent = this.pad(s);
        this.DOM.ampm.textContent = ampm;

        const smoothSec = s + ms / 1000;
        const offset = this.circumference - (smoothSec / 60) * this.circumference;
        this.DOM.secProgress.setAttribute('stroke-dashoffset', offset);

        const dayName = this.DAYS[now.getDay()];
        const dayNum = now.getDate();
        const monthName = this.MONTHS[now.getMonth()];
        const year = now.getFullYear();
        this.DOM.dateDisplay.textContent = `${dayName}, ${dayNum} de ${monthName} de ${year}`;

        this.DOM.weekNum.textContent = this.getWeekNumber(now);
        const startYear = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - startYear) / 86400000);
        this.DOM.dayYear.textContent = dayOfYear;
        this.DOM.timezone.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' ');

        if (h >= 5 && h < 12) this.DOM.greeting.textContent = '☀️ Buenos días';
        else if (h >= 12 && h < 18) this.DOM.greeting.textContent = '🌤️ Buenas tardes';
        else if (h >= 18 && h < 21) this.DOM.greeting.textContent = '🌅 Buenas noches';
        else this.DOM.greeting.textContent = '🌙 Madrugada';

        requestAnimationFrame(() => this.update());
    }
    start() { this.update(); }
}

class AlarmManager {
    constructor() {
        this.alarmTime = null;
        this.active = false;
        this.ringing = false;
        this.ringTimeout = null;
        this.DOM = {
            hour: document.getElementById('alarmHour'),
            min: document.getElementById('alarmMin'),
            ampm: document.getElementById('alarmAmPm'),
            toggleBtn: document.getElementById('alarmToggleBtn'),
            status: document.getElementById('alarmStatus'),
            ringDisplay: document.getElementById('alarmRingDisplay'),
            actions: document.getElementById('alarmActions'),
            dismiss: document.getElementById('alarmDismiss'),
            snooze: document.getElementById('alarmSnooze'),
            panel: document.getElementById('panel-alarm')
        };
        this.load();
        this.bind();
        this.check();
    }
    bind() {
        this.DOM.toggleBtn.addEventListener('click', () => {
            AudioEngine.init(); // Inicializar audio por interacción del usuario
            this.toggle();
        });
        this.DOM.dismiss.addEventListener('click', () => this.dismiss());
        this.DOM.snooze.addEventListener('click', () => this.snooze());
    }
    load() {
        const saved = localStorage.getItem('reloj_alarm');
        if (saved) {
            const d = JSON.parse(saved);
            this.alarmTime = d;
            this.active = d.active;
            if (this.active) {
                this.DOM.hour.value = d.hour;
                this.DOM.min.value = d.min;
                this.DOM.ampm.value = d.ampm;
                this.DOM.toggleBtn.textContent = '🔕 Desactivar Alarma';
                this.DOM.toggleBtn.classList.add('active');
                this.DOM.status.textContent = `⏰ Alarma activa: ${d.hour}:${String(d.min).padStart(2,'0')} ${d.ampm}`;
            }
        }
    }
    save() {
        localStorage.setItem('reloj_alarm', JSON.stringify({
            hour: parseInt(this.DOM.hour.value),
            min: parseInt(this.DOM.min.value),
            ampm: this.DOM.ampm.value,
            active: this.active
        }));
    }
    toggle() {
        if (this.ringing) { this.dismiss(); return; }
        this.active = !this.active;
        if (this.active) {
            const h = parseInt(this.DOM.hour.value);
            const m = parseInt(this.DOM.min.value);
            if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) {
                this.active = false;
                this.DOM.status.textContent = '❌ Hora inválida';
                return;
            }
            this.alarmTime = { hour: h, min: m, ampm: this.DOM.ampm.value };
            this.DOM.toggleBtn.textContent = '🔕 Desactivar Alarma';
            this.DOM.toggleBtn.classList.add('active');
            this.DOM.status.textContent = `⏰ Alarma activa: ${h}:${String(m).padStart(2,'0')} ${this.DOM.ampm.value}`;
            this.DOM.ringDisplay.textContent = '';
            this.DOM.actions.style.display = 'none';
        } else {
            this.DOM.toggleBtn.textContent = '🔔 Activar Alarma';
            this.DOM.toggleBtn.classList.remove('active');
            this.DOM.status.textContent = 'Sin alarma activa';
        }
        this.save();
    }
    check() {
        setInterval(() => {
            if (!this.active || this.ringing) return;
            const now = new Date();
            let ah = this.alarmTime.hour;
            if (this.alarmTime.ampm === 'PM' && ah !== 12) ah += 12;
            if (this.alarmTime.ampm === 'AM' && ah === 12) ah = 0;
            if (now.getHours() === ah && now.getMinutes() === this.alarmTime.min && now.getSeconds() === 0) {
                this.ring();
            }
        }, 500);
    }
    ring() {
        this.ringing = true;
        this.DOM.ringDisplay.textContent = '🔔 🔔 🔔';
        this.DOM.actions.style.display = 'flex';
        this.DOM.panel.classList.add('alarming');
        
        AudioEngine.playOscillator(15, 30); // 15 segundos, 30 beeps
        
        this.ringTimeout = setTimeout(() => {
            if (this.ringing) {
                this.ringing = false;
                this.DOM.ringDisplay.textContent = '';
                this.DOM.actions.style.display = 'none';
                this.DOM.panel.classList.remove('alarming');
            }
        }, 15000);
    }
    dismiss() {
        AudioEngine.stop();
        clearTimeout(this.ringTimeout);
        this.ringing = false;
        this.active = false;
        this.DOM.ringDisplay.textContent = '';
        this.DOM.actions.style.display = 'none';
        this.DOM.panel.classList.remove('alarming');
        this.DOM.toggleBtn.textContent = '🔔 Activar Alarma';
        this.DOM.toggleBtn.classList.remove('active');
        this.DOM.status.textContent = '⏰ Alarma desactivada';
        this.save();
    }
    snooze() {
        AudioEngine.stop();
        clearTimeout(this.ringTimeout);
        this.ringing = false;
        this.DOM.ringDisplay.textContent = '';
        this.DOM.actions.style.display = 'none';
        this.DOM.panel.classList.remove('alarming');
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        this.alarmTime = {
            hour: now.getHours() % 12 || 12,
            min: now.getMinutes(),
            ampm: now.getHours() >= 12 ? 'PM' : 'AM'
        };
        this.DOM.hour.value = this.alarmTime.hour;
        this.DOM.min.value = this.alarmTime.min;
        this.DOM.ampm.value = this.alarmTime.ampm;
        this.active = true;
        this.DOM.status.textContent = `😴 Pospuesto hasta: ${this.alarmTime.hour}:${String(this.alarmTime.min).padStart(2,'0')} ${this.alarmTime.ampm}`;
        this.save();
    }
}

class TimerManager {
    constructor() {
        this.remaining = 0;
        this.running = false;
        this.interval = null;
        this.DOM = {
            h: document.getElementById('timerH'),
            m: document.getElementById('timerM'),
            s: document.getElementById('timerS'),
            display: document.getElementById('timerDisplay'),
            startBtn: document.getElementById('timerStartBtn'),
            resetBtn: document.getElementById('timerResetBtn'),
            panel: document.getElementById('panel-timer')
        };
        this.bind();
        this.updateDisplay();
    }
    bind() {
        this.DOM.startBtn.addEventListener('click', () => {
            AudioEngine.init();
            this.toggle();
        });
        this.DOM.resetBtn.addEventListener('click', () => this.reset());
        [this.DOM.h, this.DOM.m, this.DOM.s].forEach(inp => {
            inp.addEventListener('input', () => {
                if (!this.running) this.syncDisplay();
            });
        });
    }
    getTotalSeconds() {
        const h = parseInt(this.DOM.h.value) || 0;
        const m = parseInt(this.DOM.m.value) || 0;
        const s = parseInt(this.DOM.s.value) || 0;
        return h * 3600 + m * 60 + s;
    }
    syncDisplay() {
        const total = this.getTotalSeconds();
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        this.DOM.display.textContent =
            `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    updateDisplay() {
        const h = Math.floor(this.remaining / 3600);
        const m = Math.floor((this.remaining % 3600) / 60);
        const s = this.remaining % 60;
        this.DOM.display.textContent =
            `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    toggle() {
        if (this.running) {
            this.pause();
        } else {
            this.start();
        }
    }
    start() {
        if (this.running) return;
        if (this.remaining <= 0) {
            this.remaining = this.getTotalSeconds();
            if (this.remaining <= 0) return;
        }
        this.running = true;
        this.DOM.startBtn.textContent = '⏸ Pausar';
        this.DOM.h.disabled = true;
        this.DOM.m.disabled = true;
        this.DOM.s.disabled = true;
        this.interval = setInterval(() => {
            this.remaining--;
            this.updateDisplay();
            if (this.remaining <= 0) {
                this.remaining = 0;
                this.updateDisplay();
                this.finish();
            }
        }, 1000);
    }
    pause() {
        this.running = false;
        this.DOM.startBtn.textContent = '▶ Reanudar';
        if (this.interval) clearInterval(this.interval);
    }
    reset() {
        this.running = false;
        if (this.interval) clearInterval(this.interval);
        this.remaining = 0;
        this.DOM.startBtn.textContent = '▶ Iniciar';
        this.DOM.h.disabled = false;
        this.DOM.m.disabled = false;
        this.DOM.s.disabled = false;
        this.syncDisplay();
        this.DOM.panel.classList.remove('alarming');
    }
    finish() {
        this.running = false;
        if (this.interval) clearInterval(this.interval);
        this.DOM.startBtn.textContent = '▶ Iniciar';
        this.DOM.h.disabled = false;
        this.DOM.m.disabled = false;
        this.DOM.s.disabled = false;
        this.DOM.panel.classList.add('alarming');
        
        AudioEngine.playOscillator(3.5, 8); // 3.5 segundos, 8 beeps
        
        setTimeout(() => this.DOM.panel.classList.remove('alarming'), 4000);
    }
}

// === CRONÓMETRO OPTIMIZADO CON requestAnimationFrame ===
class StopwatchManager {
    constructor() {
        this.running = false;
        this.time = 0;
        this.startTime = 0;
        this.laps = [];
        this.rafId = null;
        this.DOM = {
            display: document.getElementById('swDisplay'),
            startBtn: document.getElementById('swStartBtn'),
            lapBtn: document.getElementById('swLapBtn'),
            resetBtn: document.getElementById('swResetBtn'),
            lapList: document.getElementById('lapList')
        };
        this.bind();
    }
    bind() {
        this.DOM.startBtn.addEventListener('click', () => this.toggle());
        this.DOM.lapBtn.addEventListener('click', () => this.lap());
        this.DOM.resetBtn.addEventListener('click', () => this.reset());
    }
    format(t) {
        const h = Math.floor(t / 3600000);
        const m = Math.floor((t % 3600000) / 60000);
        const s = Math.floor((t % 60000) / 1000);
        const cs = Math.floor((t % 1000) / 10); // Centisegundos (2 dígitos) para fluidez visual
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
    }
    updateDisplay() {
        this.DOM.display.textContent = this.format(this.time);
    }
    loop = () => {
        if (!this.running) return;
        this.time = Date.now() - this.startTime;
        this.updateDisplay();
        this.rafId = requestAnimationFrame(this.loop);
    }
    toggle() {
        if (this.running) {
            this.running = false;
            cancelAnimationFrame(this.rafId);
            this.DOM.startBtn.textContent = '▶ Reanudar';
        } else {
            this.running = true;
            this.startTime = Date.now() - this.time;
            this.rafId = requestAnimationFrame(this.loop);
            this.DOM.startBtn.textContent = '⏸ Pausar';
        }
    }
    lap() {
        if (!this.running) return;
        this.laps.push(this.time);
        const li = document.createElement('li');
        li.innerHTML = `<span>Vuelta ${this.laps.length}</span><span>${this.format(this.time)}</span>`;
        this.DOM.lapList.appendChild(li);
        this.DOM.lapList.scrollTop = this.DOM.lapList.scrollHeight;
    }
    reset() {
        this.running = false;
        cancelAnimationFrame(this.rafId);
        this.time = 0;
        this.laps = [];
        this.DOM.lapList.innerHTML = '';
        this.DOM.startBtn.textContent = '▶ Iniciar';
        this.updateDisplay();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Starfield('stars-canvas');
    new PremiumClock();
    new AnalogClock('analogCanvas');
    new AlarmManager();
    new TimerManager();
    new StopwatchManager();

    const themeBtn = document.getElementById('themeToggle');
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light');
        themeBtn.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
    });

    const modeBtns = document.querySelectorAll('.mode-btn');
    const panels = {
        clock: document.getElementById('panel-clock'),
        alarm: document.getElementById('panel-alarm'),
        timer: document.getElementById('panel-timer'),
        stopwatch: document.getElementById('panel-stopwatch')
    };

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            Object.keys(panels).forEach(key => panels[key].classList.toggle('active', key === btn.dataset.mode));
        });
    });
});
