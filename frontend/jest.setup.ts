// Runs before each test file: adds matchers like toBeInTheDocument().
import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'

// jsdom lacks these, but react-router v7 needs them; Node already provides them.
Object.assign(globalThis, { TextEncoder, TextDecoder })
