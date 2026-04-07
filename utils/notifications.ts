const playSound = (src: string) => {
    if (typeof window === 'undefined') return;

    try {
        const audio = new Audio(src);
        audio.play().catch(() => {
            // Fallback to Web Audio API beep if audio file fails
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        });
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
};

/** Play sound for new order received */
export const playNewOrderSound = () => playSound('/new_order.wav');

/** Play sound for payment verified */
export const playPaymentVerifiedSound = () => playSound('/payment_verified.wav');

/** Play sound for cancelled/rejected orders */
export const playCancelledSound = () => playSound('/cancelled.wav');

/** Generic notification sound (uses new_order.wav as default) */
export const playNotificationSound = playNewOrderSound;
