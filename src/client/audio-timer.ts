// ============================================================
// Client Module: Audio & Focus Tools
// (Web Audio API, Ambient Noise, Pomodoro, Stopwatch, Countdown Timer)
// ============================================================

export const audioTimerScript = /*javascript*/ `
function getAudioTimerModule() {
  return {
    bgAudio: null,
    audioCtx: null,
    ambientSound: 'none',
    ambientVolume: 50,
    ambientNodes: null,
    soundEffectsEnabled: localStorage.getItem('soundEffectsEnabled') !== 'false',
    notificationSound: localStorage.getItem('notificationSound') || 'pop_ding.wav',

    triggerHaptic(kind = 'light') {
      try {
        const Haptics = window.Capacitor?.Plugins?.Haptics;
        if (!Haptics) return;
        if (kind === 'success') {
          Haptics.notification({ type: 'SUCCESS' }).catch(() => {});
        } else if (kind === 'warning') {
          Haptics.notification({ type: 'WARNING' }).catch(() => {});
        } else if (kind === 'selection') {
          Haptics.selectionChanged().catch(() => {});
        } else if (kind === 'medium') {
          Haptics.impact({ style: 'MEDIUM' }).catch(() => {});
        } else {
          Haptics.impact({ style: 'LIGHT' }).catch(() => {});
        }
      } catch {}
    },

    setNotificationSound(soundFile) {
      const allowed = ['pop_ding.wav', 'soft_chime.wav', 'crisp_click.wav'];
      const chosen = allowed.includes(soundFile) ? soundFile : 'pop_ding.wav';
      this.notificationSound = chosen;
      try { localStorage.setItem('notificationSound', chosen); } catch {}
      this.triggerHaptic('light');
      if (this.soundEffectsEnabled) {
        try {
          const audio = new Audio('/sounds/' + chosen);
          audio.volume = 0.65;
          audio.play().catch(() => this.playSound('click'));
        } catch {
          this.playSound('click');
        }
      }
      if (typeof this.syncAllNativeLocalNotifications === 'function') {
        this.syncAllNativeLocalNotifications();
      }
      if (typeof this.showToast === 'function') {
        const label = chosen === 'pop_ding.wav' ? 'Pop Ding' : (chosen === 'soft_chime.wav' ? 'Soft Chime' : 'Crisp Click');
        this.showToast('🔔 Đã chọn âm thông báo: ' + label, 'info');
      }
    },

    toggleSoundEffects() {
      this.soundEffectsEnabled = !this.soundEffectsEnabled;
      localStorage.setItem('soundEffectsEnabled', String(this.soundEffectsEnabled));
      this.triggerHaptic('light');
      if (this.soundEffectsEnabled) {
        this.playSound('click');
        this.showToast('Đã bật âm thanh thao tác 🔊', 'info');
      } else {
        this.showToast('Đã tắt âm thanh thao tác 🔇', 'info');
      }
    },

    playSound(type) {
      if (!this.soundEffectsEnabled) return;
      try {
        const ctx = this.initAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        if (type === 'complete') {
          // Âm thanh hoàn thành việc: hợp âm vui tươi C-E-G-C (4 nốt arpeggio)
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);
            gain.gain.setValueAtTime(0, now + i * 0.06);
            gain.gain.linearRampToValueAtTime(0.22, now + i * 0.06 + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.45);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.5);
          });
        } else if (type === 'all_done') {
          // Hợp âm 2 nốt vui tai khi hoàn thành 100% việc hôm nay
          const notes = [783.99, 1046.50];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.09);
            gain.gain.setValueAtTime(0, now + i * 0.09);
            gain.gain.linearRampToValueAtTime(0.24, now + i * 0.09 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.55);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.09);
            osc.stop(now + i * 0.09 + 0.6);
          });
        } else if (type === 'sheet') {
          // Tiếng tách cơ học cực nhẹ khi mở/đóng Bottom Sheet
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(640, now);
          osc.frequency.exponentialRampToValueAtTime(420, now + 0.028);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.035);
        } else if (type === 'uncomplete') {
          // Bỏ hoàn thành: nốt hạ nhẹ
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(650, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.13);
        } else if (type === 'click') {
          // Tiếng click tactile dứt khoát
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(900, now);
          osc.frequency.exponentialRampToValueAtTime(350, now + 0.035);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
        } else if (type === 'add') {
          // Tiếng thêm việc mới: nốt vút lên tươi sáng
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.17);
        } else if (type === 'delete') {
          // Tiếng chuyển vào thùng rác: âm swoosh cực nhỏ
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(280, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.13);
        }
      } catch (err) {}
    },

    showPomodoroModal: false,
    focusToolTab: 'pomodoro',
    pomodoroRunning: false,
    pomodoroMode: 'focus',
    pomodoroTimeLeft: 25 * 60,
    pomodoroTotalTime: 25 * 60,
    pomodoroActiveTodo: null,
    pomodoroInterval: null,

    stopwatchTime: 0,
    stopwatchRunning: false,
    stopwatchInterval: null,
    stopwatchStartTime: 0,
    stopwatchLaps: [],

    countdownDuration: 300,
    countdownTimeLeft: 300,
    countdownRunning: false,
    countdownInterval: null,

    // ─── BACKGROUND AUDIO KEEPALIVE & WEB AUDIO API ───
    startBackgroundAudioKeepAlive() {
      try {
        if (!this.bgAudio) {
          const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
          this.bgAudio = new Audio(silentWav);
          this.bgAudio.loop = true;
          this.bgAudio.volume = 0.001;
        }
        if (this.bgAudio.paused) {
          this.bgAudio.play().catch(() => {});
        }
      } catch {}
    },

    initAudioContext() {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    },

    playChime() {
      try {
        const ctx = this.initAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const tones = [659.25, 880];
        tones.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);
          gain.gain.setValueAtTime(0, now + idx * 0.18);
          gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.18 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 0.85);
        });
      } catch (e) {
        console.warn('playChime error:', e);
      }
    },

    stopAmbientSound() {
      if (this.ambientNodes) {
        try {
          this.ambientNodes.source?.stop?.();
          this.ambientNodes.gain?.disconnect?.();
        } catch {}
        this.ambientNodes = null;
      }
      this.ambientSound = 'none';
    },

    playAmbientSound(type) {
      if (this.ambientSound === type && type !== 'none') {
        this.stopAmbientSound();
        return;
      }
      this.stopAmbientSound();
      if (type === 'none') return;

      const ctx = this.initAudioContext();
      if (!ctx) return;

      try {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        if (type === 'white') {
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
        } else if (type === 'rain') {
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
          }
        }

        const whiteNoiseSource = ctx.createBufferSource();
        whiteNoiseSource.buffer = noiseBuffer;
        whiteNoiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
        filter.frequency.value = type === 'rain' ? 850 : 1200;
        filter.Q.value = 1.0;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime((this.ambientVolume || 50) / 100 * 0.25, ctx.currentTime);

        whiteNoiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoiseSource.start();
        this.ambientNodes = { source: whiteNoiseSource, gain: gainNode, filter };
        this.ambientSound = type;
      } catch (err) {
        console.warn('Error starting ambient sound:', err);
      }
    },

    setAmbientVolume(val) {
      this.ambientVolume = Math.max(0, Math.min(100, Number(val) || 0));
      if (this.ambientNodes && this.ambientNodes.gain && this.audioCtx) {
        this.ambientNodes.gain.gain.setValueAtTime((this.ambientVolume / 100) * 0.25, this.audioCtx.currentTime);
      }
    },

    // ─── POMODORO FOCUS TIMER ───
    async togglePomodoroMode(todo, e) {
      if (e?.stopPropagation) e.stopPropagation();
      if (e?.currentTarget?.blur) e.currentTarget.blur();
      const newMode = !Boolean(todo.pomodoro_mode);
      todo.pomodoro_mode = newMode ? 1 : 0;
      this.saveCachedTodos();
      try {
        await this.api('/api/todos/' + todo.id, {
          method: 'PUT',
          body: JSON.stringify({ pomodoro_mode: newMode ? 1 : 0 })
        });
        this.showToast(newMode ? '🍅 Đã bật Pomodoro cho: ' + todo.title : 'Đã tắt Pomodoro: ' + todo.title, 'info');
      } catch (err) {
        this.showToast('Lỗi cập nhật Pomodoro: ' + (err?.message || err), 'error');
      }
    },

    openPomodoro() {
      this.showPomodoroModal = true;
    },

    setPomodoroMode(mode) {
      this.pomodoroMode = mode;
      clearInterval(this.pomodoroInterval);
      this.pomodoroRunning = false;
      if (mode === 'focus') {
        this.pomodoroTimeLeft = 25 * 60;
        this.pomodoroTotalTime = 25 * 60;
      } else if (mode === 'shortBreak') {
        this.pomodoroTimeLeft = 5 * 60;
        this.pomodoroTotalTime = 5 * 60;
      } else if (mode === 'longBreak') {
        this.pomodoroTimeLeft = 15 * 60;
        this.pomodoroTotalTime = 15 * 60;
      }
    },

    togglePomodoro() {
      if (this.pomodoroRunning) {
        this.pausePomodoro();
      } else {
        this.startPomodoro();
      }
    },

    startPomodoro() {
      this.initAudioContext();
      this.pomodoroRunning = true;
      clearInterval(this.pomodoroInterval);
      this.pomodoroInterval = setInterval(() => {
        if (this.pomodoroTimeLeft > 0) {
          this.pomodoroTimeLeft--;
        } else {
          this.onPomodoroComplete();
        }
      }, 1000);
    },

    pausePomodoro() {
      this.pomodoroRunning = false;
      clearInterval(this.pomodoroInterval);
    },

    resetPomodoro() {
      this.pausePomodoro();
      this.setPomodoroMode(this.pomodoroMode);
    },

    async onPomodoroComplete() {
      this.pausePomodoro();
      this.playChime();

      if (this.pomodoroMode === 'focus') {
        this.showToast('🎉 Hoàn thành phiên Pomodoro 25 phút! Hãy nghỉ ngơi nào.', 'success');
        this.setPomodoroMode('shortBreak');
      } else {
        this.showToast('⏰ Hết giờ nghỉ ngơi! Sẵn sàng cho phiên tập trung tiếp theo.', 'info');
        this.setPomodoroMode('focus');
      }
    },

    async trackTimeForTodo(todo, addedMinutes) {
      if (!todo || !todo.id) return;
      const currentActual = Number(todo.actual_minutes) || 0;
      const newActual = currentActual + addedMinutes;
      todo.actual_minutes = newActual;
      this.saveCachedTodos();

      try {
        await this.api('/api/todos/' + todo.id, {
          method: 'PUT',
          body: JSON.stringify({ actual_minutes: newActual })
        });
        this.showToast('Đã ghi nhận +' + addedMinutes + ' phút tập trung cho: ' + todo.title, 'success');
      } catch (err) {
        console.warn('Failed to update actual_minutes:', err);
      }
    },

    formatTimer(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    },

    // ─── STOPWATCH (BẤM GIỜ) ───
    startStopwatch() {
      if (this.stopwatchRunning) return;
      this.initAudioContext();
      this.stopwatchRunning = true;
      this.stopwatchStartTime = Date.now() - (this.stopwatchTime || 0);
      this.stopwatchInterval = setInterval(() => {
        this.stopwatchTime = Date.now() - this.stopwatchStartTime;
      }, 50);
    },

    pauseStopwatch() {
      this.stopwatchRunning = false;
      if (this.stopwatchInterval) {
        clearInterval(this.stopwatchInterval);
        this.stopwatchInterval = null;
      }
    },

    resetStopwatch() {
      this.pauseStopwatch();
      this.stopwatchTime = 0;
      this.stopwatchLaps = [];
    },

    lapStopwatch() {
      if (!this.stopwatchTime) return;
      const currentMs = this.stopwatchTime;
      const prevTotal = this.stopwatchLaps.length > 0 ? this.stopwatchLaps[0].totalTime : 0;
      this.stopwatchLaps.unshift({
        lapNumber: this.stopwatchLaps.length + 1,
        splitTime: currentMs - prevTotal,
        totalTime: currentMs
      });
    },

    formatStopwatch(ms) {
      if (!ms || ms < 0) ms = 0;
      const pad = (n, len = 2) => String(n).padStart(len, '0');
      const totalSeconds = Math.floor(ms / 1000);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      const milli = Math.floor((ms % 1000) / 100);
      return pad(m) + ':' + pad(s) + '.' + milli;
    },

    // ─── COUNTDOWN TIMER (HẸN GIỜ) ───
    setCountdownPreset(sec) {
      this.pauseCountdown();
      this.countdownDuration = sec;
      this.countdownTimeLeft = sec;
    },

    startCountdown() {
      if (this.countdownRunning || this.countdownTimeLeft <= 0) return;
      this.initAudioContext();
      this.countdownRunning = true;
      this.countdownInterval = setInterval(() => {
        if (this.countdownTimeLeft > 0) {
          this.countdownTimeLeft--;
        } else {
          this.pauseCountdown();
          this.playChime();
          this.showToast('⏳ Hết giờ hẹn!', 'warning');
          if (window.Capacitor?.isPluginAvailable?.('LocalNotifications')) {
            window.Capacitor.Plugins.LocalNotifications.schedule({
              notifications: [{
                id: 99999,
                title: '⏳ Hẹn giờ kết thúc',
                body: 'Thời gian hẹn giờ của bạn đã kết thúc!',
                schedule: { at: new Date() },
                sound: this.notificationSound || 'pop_ding.wav'
              }]
            }).catch(() => {});
          }
        }
      }, 1000);
    },

    pauseCountdown() {
      this.countdownRunning = false;
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    },

    resetCountdown() {
      this.pauseCountdown();
      this.countdownTimeLeft = this.countdownDuration || 300;
    },

    formatCountdown(sec) {
      if (!sec || sec < 0) sec = 0;
      const pad = (n) => String(n).padStart(2, '0');
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return pad(m) + ':' + pad(s);
    }
  };
}
`;
