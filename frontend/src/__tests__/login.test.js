import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../pages/login'
import api from '../lib/api'

// Mock the API
jest.mock('../lib/api')
const mockedApi = api

// Mock next/router
const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  test('renders login form', () => {
    render(<Login />)
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  test('handles successful login', async () => {
    const mockResponse = {
      data: {
        access: 'mock-token',
        refresh: 'mock-refresh-token'
      }
    }
    mockedApi.post.mockResolvedValueOnce(mockResponse)

    render(<Login />)
    
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'testpass' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login/', {
        username: 'testuser',
        password: 'testpass'
      })
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  test('displays error on failed login', async () => {
    const mockError = {
      response: {
        data: { detail: 'Invalid credentials' }
      }
    }
    mockedApi.post.mockRejectedValueOnce(mockError)

    render(<Login />)
    
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })
})