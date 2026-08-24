import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { AuthLayout } from '../features/auth/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!EMAIL_RE.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    setLoading(true)
    const { error: resetError } = await resetPassword({ email })
    setLoading(false)
    if (resetError) {
      setError(
        resetError.message ||
          'We could not send a reset link. Please try again.',
      )
      return
    }
    setSent(true)
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to set a new password."
      footer={
        <Link to="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {error && (
        <Alert variant="danger" title="Something went wrong" className="mb-4">
          {error}
        </Alert>
      )}
      {sent && (
        <Alert variant="success" title="Check your inbox" className="mb-4">
          If an account exists for {email}, we sent a password reset link. The
          link will open this app so you can choose a new password.
        </Alert>
      )}
      {!sent && (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
