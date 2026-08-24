import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { AuthLayout } from '../features/auth/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [loading, setLoading] = useState(false)

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!EMAIL_RE.test(form.email)) next.email = 'Enter a valid email address.'
    if (!form.password) next.password = 'Password is required.'
    return next
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    const { error } = await signIn({
      email: form.email,
      password: form.password,
    })
    setLoading(false)

    if (error) {
      setFormError(
        error.message || 'We could not sign you in. Please check your details.',
      )
      return
    }
    const destination = location.state?.from?.pathname || '/dashboard'
    navigate(destination, { replace: true })
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back to IdeaProof AI."
      footer={
        <span>
          New here?{' '}
          <Link to="/signup" className="text-primary hover:underline">
            Create an account
          </Link>
        </span>
      }
    >
      {formError && (
        <Alert variant="danger" title="Unable to sign in" className="mb-4">
          {formError}
        </Alert>
      )}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          required
        />
        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            required
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  )
}
