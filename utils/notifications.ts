let audioContext: AudioContext | null = null;

const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

const playBeep = (frequency: number = 880, duration: number = 0.5) => {
    if (typeof window === 'undefined') return;
    
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
        console.error('Error playing beep:', error);
    }
};

const playSound = (src: string) => {
    if (typeof window === 'undefined') return;

    // First, ensure audio context is ready (for browsers that require user interaction)
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }

    try {
        const audio = new Audio(src);
        audio.volume = 0.5;
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('[Audio] Sound played successfully:', src);
                })
                .catch((error: Error) => {
                    console.warn('[Audio] Failed to play audio file, using fallback beep:', error.message);
                    // Fallback to Web Audio API beep
                    playBeep(880, 0.5);
                });
        }
    } catch (error) {
        console.error('[Audio] Error creating Audio:', error);
        playBeep(880, 0.5);
    }
};

/** Play sound for new order received */
export const playNewOrderSound = () => {
    console.log('[Audio] Playing new order sound');
    playSound('/new_order.wav');
    // Also play a double beep as extra notification
    setTimeout(() => playBeep(1100, 0.3), 100);
    setTimeout(() => playBeep(1100, 0.3), 250);
};

/** Play sound for payment verified */
export const playPaymentVerifiedSound = () => {
    console.log('[Audio] Playing payment verified sound');
    playSound('/payment_verified.wav');
    // Happy ascending beep
    setTimeout(() => playBeep(880, 0.2), 50);
    setTimeout(() => playBeep(1100, 0.3), 150);
};

/** Play sound for cancelled/rejected orders */
export const playCancelledSound = () => {
    console.log('[Audio] Playing cancelled sound');
    playSound('/cancelled.wav');
    // Low descending beep
    setTimeout(() => playBeep(440, 0.3), 50);
    setTimeout(() => playBeep(330, 0.4), 200);
};

/** Generic notification sound */
export const playNotificationSound = playNewOrderSound;

/** Initialize audio context on user interaction (call this on first click) */
export const initAudioContext = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
            console.log('[Audio] AudioContext resumed successfully');
        }).catch((err) => {
            console.warn('[Audio] Failed to resume AudioContext:', err);
        });
    }
};
