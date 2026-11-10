/**
 * Sonido de "nueva orden" generado con Web Audio (sin archivos de audio).
 * Dos notas cortas (ding-dong) con fade — se corta solo y cierra el
 * AudioContext para no dejar contextos abiertos. Cualquier fallo (autoplay
 * policy, navegador sin soporte) se traga en silencio: el resto de la
 * notificación (toast + escritorio) sigue funcionando.
 */
export function playOrderChime(): void {
  try {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return

    const ctx = new Ctor()
    const notes = [880, 1174.66] // A5, D#6

    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = "sine"
      oscillator.frequency.value = frequency

      const start = ctx.currentTime + index * 0.16
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32)

      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.35)
    })

    window.setTimeout(() => {
      void ctx.close()
    }, 1200)
  } catch {
    // el sonido es best-effort
  }
}
