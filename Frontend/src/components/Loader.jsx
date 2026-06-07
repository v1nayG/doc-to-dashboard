import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const STEPS = [
  { label: 'Reading document' },
  { label: 'Extracting text & data' },
  { label: 'AI analyzing content' },
  { label: 'Building dashboard' },
]
const DURATIONS = [800, 1200, 2000, 1000]

export default function Loader() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    let step = 0
    const advance = () => {
      if (step < STEPS.length - 1) {
        step++
        setCurrentStep(step)
        setTimeout(advance, DURATIONS[step])
      }
    }
    const t = setTimeout(advance, DURATIONS[0])
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="loader-overlay">
      <motion.div
        className="loader-card"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        <div className="loader-spinner" />
        <div className="loader-label">Processing document</div>
        <div className="loader-sublabel">AI is analyzing your file…</div>
        <div className="loader-steps">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`loader-step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}
            >
              <span className="step-dot" />
              {step.label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
