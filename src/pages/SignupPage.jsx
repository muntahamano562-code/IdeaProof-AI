import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { AuthLayout } from '../features/auth/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!EMAIL_RE.test(form.email)) next.email = 'Enter a valid email address.'
    if (!form.password) next.password = 'Password is required.'
    else if (form.password.length < MIN_PASSWORD)
      next.password = `Password must be at least ${MIN_PASSWORD} characters.`
    if (form.confirm !== form.password)
      next.confirm = 'Passwords do not match.'
    return next
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    setInfo(null)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    const { error, needsConfirmation } = await signUp({
      email: form.email,
      password: form.password,
    })
    setLoading(false)

    if (error) {
      setFormError(
        error.message || 'Unable to create your account. Please try again.',
      )
      return
    }
    if (needsConfirmation) {
      setInfo(
        'Account created. Check your email to confirm your address before signing in.',
      )
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start validating your ideas with IdeaProof AI."
      footer={
        <span>
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      {formError && (
        <Alert variant="danger" title="Something went wrong" className="mb-4">
          {formError}
        </Alert>
      )}
      {info && (
        <Alert variant="info" title="Confirm your email" className="mb-4">
          {info}
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
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          required
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={update('confirm')}
          error={errors.confirm}
          required
        />
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
