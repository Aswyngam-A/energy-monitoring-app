import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

test('renders the getting started heading', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /get started/i })).toBeInTheDocument()
})

test('increments the counter when clicked', async () => {
  render(<App />)
  const button = screen.getByRole('button', { name: /count is 0/i })
  await userEvent.click(button)
  expect(screen.getByRole('button', { name: /count is 1/i })).toBeInTheDocument()
})
