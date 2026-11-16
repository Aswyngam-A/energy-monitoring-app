// Runs before each test file: adds matchers like toBeInTheDocument().
import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'

// jsdom lacks these, but react-router v7 needs them; Node already provides them.
Object.assign(globalThis, { TextEncoder, TextDecoder })

// jsdom has no ResizeObserver, which Recharts' ResponsiveContainer uses to follow its parent's
// size. A do-nothing stand-in is enough: jsdom has no layout, so there is never a size to report.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.assign(globalThis, { ResizeObserver: ResizeObserverStub });
