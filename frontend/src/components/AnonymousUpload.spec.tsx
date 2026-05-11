import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { filesApi } from '@api/index'
import { AnonymousUpload } from './AnonymousUpload'

vi.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
  }),
}))

describe('AnonymousUpload', () => {
  let uploadAnonymousMock: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    uploadAnonymousMock = vi
      .spyOn(filesApi, 'uploadAnonymous')
      .mockResolvedValue({
        data: {
          download_url: 'http://localhost:3000/d/test-token',
          originalName: 'test.txt',
          size: 5,
          expires_at: '2025-01-01T00:00:00Z',
          tags: ['important'],
        },
      })
  })

  afterEach(() => {
    uploadAnonymousMock.mockRestore()
  })

  it('ajoute un tag et l envoie au backend lors de l upload anonyme', async () => {
    render(<AnonymousUpload onBack={() => {}} />)

    const fileInput = screen.getByRole('button', { name: /changer/i })
    const tagInput = screen.getByPlaceholderText(/ajouter un tag/i)
    const uploadButton = screen.getByRole('button', { name: /téléverser/i })

    const inputFile = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' })

    await userEvent.upload(inputFile, file)
    await userEvent.type(tagInput, 'important')
    const addTagButton = screen.getByRole('button', { name: /ajouter/i })
    await userEvent.click(addTagButton)

    expect(screen.getByText('important')).toBeInTheDocument()

    await userEvent.click(uploadButton)

    await waitFor(() => {
      expect(uploadAnonymousMock).toHaveBeenCalledWith(file, 7, undefined, ['important'])
    })

    expect(screen.getByRole('button', { name: /copier le lien/i })).toBeInTheDocument()
    expect(screen.getByText(/http:\/\/localhost:3000\/d\/test-token/)).toBeInTheDocument()
  })
})
