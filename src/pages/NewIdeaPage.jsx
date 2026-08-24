import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Alert } from '../components/ui/Alert'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../features/auth/AuthProvider'
import {
  loadDraft,
  saveDraft,
  clearDraft,
  generateIdeaId,
  emptyIdeaValues,
} from '../features/ideas/ideaDraft'

const LIMITS = {
  title: { min: 3, max: 120 },
  description: { min: 20, max: 2000 },
  targetUsers: { max: 500 },
  problem: { max: 1000 },
}

function validate(values) {
  const errors = {}
  const title = values.title.trim()
  if (!title) errors.title = 'Title is required.'
  else if (title.length < LIMITS.title.min)
    errors.title = `Title must be at least ${LIMITS.title.min} characters.`
  else if (title.length > LIMITS.title.max)
    errors.title = `Title must be ${LIMITS.title.max} characters or fewer.`

  const description = values.description.trim()
  if (!description) errors.description = 'Description is required.'
  else if (description.length < LIMITS.description.min)
    errors.description = `Description must be at least ${LIMITS.description.min} characters.`
  else if (description.length > LIMITS.description.max)
    errors.description = `Description must be ${LIMITS.description.max} characters or fewer.`

  if (values.targetUsers.length > LIMITS.targetUsers.max)
    errors.targetUsers = `Target users must be ${LIMITS.targetUsers.max} characters or fewer.`
  if (values.problem.length > LIMITS.problem.max)
    errors.problem = `Problem must be ${LIMITS.problem.max} characters or fewer.`

  return errors
}

function serialize(values) {
  return JSON.stringify({
    title: values.title.trim(),
    description: values.description.trim(),
    targetUsers: values.targetUsers.trim(),
    problem: values.problem.trim(),
  })
}

export default function NewIdeaPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id

  const [values, setValues] = useState(emptyIdeaValues())
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [draftId, setDraftId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const savedRef = useRef(serialize(emptyIdeaValues()))
  const isDirty = serialize(values) !== savedRef.current

  useEffect(() => {
    if (!userId) return
    const draft = loadDraft(userId)
    if (draft) {
      setValues({
        title: draft.title || '',
        description: draft.description || '',
        targetUsers: draft.targetUsers || '',
        problem: draft.problem || '',
      })
      setDraftId(draft.id)
      savedRef.current = serialize({
        title: draft.title || '',
        description: draft.description || '',
        targetUsers: draft.targetUsers || '',
        problem: draft.problem || '',
      })
      setStatus({ variant: 'info', message: 'Draft restored from your last session.' })
    }
    // Restore once per authenticated user; rely on in-memory state afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    if (!isDirty) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  function handleChange(field) {
    return (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      setErrors((prev) => {
        if (!prev[field]) return prev
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function buildDraft() {
    const now = new Date().toISOString()
    const existing = draftId ? loadDraft(userId) : null
    const id = draftId || generateIdeaId()
    const createdAt = (existing && existing.createdAt) || now
    return {
      id,
      title: values.title.trim(),
      description: values.description.trim(),
      targetUsers: values.targetUsers.trim(),
      problem: values.problem.trim(),
      createdAt,
      updatedAt: now,
    }
  }

  function handleSaveDraft() {
    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      setStatus({
        variant: 'danger',
        title: 'Cannot save yet',
        message: 'Fix the highlighted fields before saving your draft.',
      })
      return
    }
    const draft = buildDraft()
    const ok = saveDraft(userId, draft)
    if (!ok) {
      setStatus({
        variant: 'danger',
        title: 'Could not save draft',
        message: 'Your browser blocked local storage. Please check your settings and try again.',
      })
      return
    }
    setDraftId(draft.id)
    savedRef.current = serialize(values)
    setStatus({ variant: 'success', message: 'Draft saved just now.' })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      setStatus({
        variant: 'danger',
        title: 'Check your idea',
        message: 'Please fix the highlighted fields before continuing.',
      })
      return
    }
    const draft = buildDraft()
    const ok = saveDraft(userId, draft)
    if (!ok) {
      setStatus({
        variant: 'danger',
        title: 'Could not save',
        message: 'Your browser blocked local storage. Please try again.',
      })
      return
    }
    setDraftId(draft.id)
    savedRef.current = serialize(values)
    navigate(`/ideas/${draft.id}`)
  }

  function confirmClear() {
    clearDraft(userId)
    setValues(emptyIdeaValues())
    setErrors({})
    setDraftId(null)
    savedRef.current = serialize(emptyIdeaValues())
    setConfirmOpen(false)
    setStatus({ variant: 'info', message: 'Draft cleared.' })
  }

  return (
    <>
      <h1 className="font-display text-h1 font-semibold tracking-tight text-text-primary">
        Create a new idea
      </h1>
      <p className="mt-2 text-text-secondary">
        Capture the idea and the problem you're trying to solve before we
        pressure-test it.
      </p>

      <Card className="mt-8 max-w-2xl p-6 sm:p-8">
        {status && (
          <Alert
            variant={status.variant}
            title={status.title}
            className="mb-6"
          >
            {status.message}
          </Alert>
        )}

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Input
            label="Idea title"
            required
            id="idea-title"
            placeholder="e.g. A study planner that adapts to each student's course load"
            maxLength={LIMITS.title.max}
            value={values.title}
            error={errors.title}
            onChange={handleChange('title')}
            autoComplete="off"
          />

          <Textarea
            label="Idea description"
            required
            id="idea-description"
            rows={5}
            maxLength={LIMITS.description.max}
            placeholder="Describe what your idea actually does and how it works..."
            description="Explain what the idea does, who uses it, and why it's useful. At least 20 characters."
            value={values.description}
            error={errors.description}
            onChange={handleChange('description')}
          />

          <Textarea
            label="Target users"
            id="idea-target-users"
            rows={3}
            maxLength={LIMITS.targetUsers.max}
            placeholder="e.g. University students who struggle to organize assignments"
            description="Who would use this? (optional)"
            value={values.targetUsers}
            error={errors.targetUsers}
            onChange={handleChange('targetUsers')}
          />

          <Textarea
            label="Problem being solved"
            id="idea-problem"
            rows={3}
            maxLength={LIMITS.problem.max}
            placeholder="e.g. Students lose track of deadlines across unrelated course tools"
            description="What pain point does this solve? (optional)"
            value={values.problem}
            error={errors.problem}
            onChange={handleChange('problem')}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Continue</Button>
              <Button type="button" variant="secondary" onClick={handleSaveDraft}>
                Save draft
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="text-danger"
              onClick={() => setConfirmOpen(true)}
            >
              Clear draft
            </Button>
          </div>
        </form>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Clear your draft?"
        description="This permanently removes the saved draft from this browser. This cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" className="text-danger" onClick={confirmClear}>
              Clear draft
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Any idea details you have entered and saved will be removed. You can
          start a new idea afterwards.
        </p>
      </Modal>
    </>
  )
}
