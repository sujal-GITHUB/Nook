import { useEffect, useRef } from 'react'

const SCRAMBLE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

interface ShuffleTextProps {
  text: string
  delay?: number
}

// Lightweight hero-title adaptation of React Bits Shuffle, without GSAP/SplitText.
// Reference: https://reactbits.dev/text-animations/shuffle
export default function ShuffleText({ text, delay = 0 }: ShuffleTextProps) {
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = textRef.current
    if (!element) return

    const characters = Array.from(element.querySelectorAll<HTMLElement>('[data-final]'))
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let startTime = 0

    const showFinalText = () => characters.forEach(character => {
      character.textContent = character.dataset.final ?? ''
    })

    if (motionPreference.matches) {
      showFinalText()
      return
    }

    const animate = (now: number) => {
      if (!startTime) startTime = now
      const elapsed = now - startTime - delay
      if (elapsed < 0) {
        frame = requestAnimationFrame(animate)
        return
      }

      let complete = true
      characters.forEach((character, index) => {
        const finalCharacter = character.dataset.final ?? ''
        if (finalCharacter === ' ') return
        const characterProgress = elapsed - index * 20
        if (characterProgress < 320) {
          complete = false
          const slot = Math.floor(Math.max(0, characterProgress) / 34 + index * 2.13) % SCRAMBLE_CHARACTERS.length
          character.textContent = SCRAMBLE_CHARACTERS[slot]
        } else {
          character.textContent = finalCharacter
        }
      })

      if (!complete) frame = requestAnimationFrame(animate)
    }

    const handleMotionChange = () => {
      if (!motionPreference.matches) return
      cancelAnimationFrame(frame)
      showFinalText()
    }

    motionPreference.addEventListener('change', handleMotionChange)
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      motionPreference.removeEventListener('change', handleMotionChange)
    }
  }, [delay])

  return <span ref={textRef} className="shuffle-text" aria-hidden="true">{Array.from(text).map((character, index) => <span
    className={character === ' ' ? 'shuffle-space' : 'shuffle-character'}
    data-final={character}
    key={`${character}-${index}`}
  >{character === ' ' ? '\u00a0' : character}</span>)}</span>
}
