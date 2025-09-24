import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Dashboard from '../pages/dashboard'
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

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  test('renders projects list', async () => {
    const mockProjects = [
      {
        id: 1,
        name: 'Test Project',
        description: 'Test description',
        issue_count: 5,
        open_issues: 3,
        in_progress_issues: 1,
        closed_issues: 1
      }
    ]

    mockedApi.get.mockImplementation((url) => {
      if (url === '/projects/') {
        return Promise.resolve({ data: mockProjects })
      }
      return Promise.resolve({ data: {} })
    })

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
  })

  test('handles project creation', async () => {
    const mockProjects = []
    const newProject = { id: 1, name: 'New Project', description: 'New description' }

    mockedApi.get.mockResolvedValue({ data: mockProjects })
    mockedApi.post.mockResolvedValue({ data: newProject })

    render(<Dashboard />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/create new project/i)).toBeInTheDocument()
    })

    // Open create form
    fireEvent.click(screen.getByText(/create new project/i))

    // Fill form
    fireEvent.change(screen.getByLabelText(/project name/i), {
      target: { value: 'New Project' }
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'New description' }
    })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create project/i }))

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/projects/', {
        name: 'New Project',
        description: 'New description'
      })
    })
  })

  test('handles API errors gracefully', async () => {
    const mockError = {
      response: {
        data: { detail: 'Server error' }
      }
    }
    mockedApi.get.mockRejectedValue(mockError)

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })
})