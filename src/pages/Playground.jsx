import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Tooltip } from '../components/ui/Tooltip'
import { Modal } from '../components/ui/Modal'
import { Alert } from '../components/ui/Alert'
import { Tabs } from '../components/ui/Tabs'
import { Skeleton } from '../components/ui/Skeleton'
import { Spinner } from '../components/ui/Spinner'
import { Container } from '../components/layout/Container'
import { Section } from '../components/layout/Section'
import { Stack } from '../components/layout/Stack'
import { Grid } from '../components/layout/Grid'
import { ThemeToggle } from '../components/ThemeToggle'
import { useToast } from '../components/ui/Toast'

/**
 * INTERNAL COMPONENT PLAYGROUND — development only.
 *
 * This page exists solely to visually verify the Phase 1 design system.
 * It is gated behind import.meta.env.DEV in App.jsx and is NOT a product
 * screen. It contains no fake product, idea, or AI data.
 */
export default function Playground() {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const showToast = (type) =>
    toast({
      type,
      title: `${type[0].toUpperCase()}${type.slice(1)} notification`,
      description: 'This is a short, helpful message with context.',
    })

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      content: (
        <p className="text-sm text-text-secondary">
          First panel content. Tabs support arrow-key navigation and proper
          ARIA relationships.
        </p>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      content: (
        <p className="text-sm text-text-secondary">
          Second panel content rendered only when active.
        </p>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      content: (
        <p className="text-sm text-text-secondary">
          Third panel content. Only one panel is visible at a time.
        </p>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <Container className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Internal only
            </p>
            <h1 className="font-display text-h1 font-semibold tracking-tight">
              Component Playground
            </h1>
          </div>
          <ThemeToggle />
        </Container>
      </header>

      <Section
        title="Buttons"
        description="Primary, secondary, and ghost variants with default, loading, and disabled states."
      >
        <Stack direction="horizontal" gap={4} align="center" className="flex-wrap">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Analyzing</Button>
          <Button disabled>Disabled</Button>
          <Button
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 1500)
            }}
            loading={loading}
          >
            {loading ? 'Working' : 'Click to load'}
          </Button>
        </Stack>
      </Section>

      <Section title="Form fields" className="border-t border-border">
        <Grid cols={1} mdCols={2} gap={6}>
          <Input
            label="Project name"
            description="A short, recognizable name."
            placeholder="e.g. IdeaProof AI"
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error="Please enter a valid email address."
          />
          <Select
            label="Current stage"
            description="Where are you right now?"
          >
            <option>Just an idea</option>
            <option>Validating</option>
            <option>Building MVP</option>
            <option>Launched</option>
          </Select>
          <Input label="Disabled field" placeholder="Unavailable" disabled />
          <div className="md:col-span-2">
            <Textarea
              label="Describe your idea"
              description="What problem does it solve, and for whom?"
              placeholder="Write a few sentences…"
            />
          </div>
        </Grid>
      </Section>

      <Section title="Cards" className="border-t border-border">
        <Grid cols={1} smCols={2} lgCols={3} gap={6}>
          <Card>
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>A short supporting description.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">
                Cards use the surface token with a subtle border and gentle hover
                emphasis.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary">Action</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Another card</CardTitle>
              <CardDescription>Composable header/content/footer.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">
                Layout primitives keep spacing consistent across screens.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Third card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">
                Hover to see the border emphasis — no heavy lift.
              </p>
            </CardContent>
          </Card>
        </Grid>
      </Section>

      <Section title="Badges" className="border-t border-border">
        <Stack direction="horizontal" gap={3} className="flex-wrap">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="low">Low</Badge>
          <Badge variant="medium">Medium</Badge>
          <Badge variant="high">High</Badge>
          <Badge variant="critical">Critical</Badge>
        </Stack>
        <p className="mt-3 text-sm text-text-secondary">
          Color is paired with a text label and a decorative dot — meaning never
          relies on color alone.
        </p>
      </Section>

      <Section title="Alerts" className="border-t border-border">
        <Stack gap={4}>
          <Alert variant="info" title="Heads up">
            This is an informational message with useful context.
          </Alert>
          <Alert variant="success" title="Saved">
            Your changes were stored successfully.
          </Alert>
          <Alert variant="warning" title="Review needed">
            A few fields need your attention before continuing.
          </Alert>
          <Alert variant="danger" title="Something went wrong">
            We couldn&apos;t complete that action. Please try again.
          </Alert>
        </Stack>
      </Section>

      <Section title="Tooltip, Modal & Toasts" className="border-t border-border">
        <Stack direction="horizontal" gap={4} align="center" className="flex-wrap">
          <Tooltip content="Helpful supplementary context, not critical info.">
            <Button variant="secondary">Hover or focus me</Button>
          </Tooltip>
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="ghost" onClick={() => showToast('success')}>
            Success toast
          </Button>
          <Button variant="ghost" onClick={() => showToast('info')}>
            Info toast
          </Button>
          <Button variant="ghost" onClick={() => showToast('warning')}>
            Warning toast
          </Button>
          <Button variant="ghost" onClick={() => showToast('danger')}>
            Danger toast
          </Button>
        </Stack>
      </Section>

      <Section title="Tabs" className="border-t border-border">
        <Tabs items={tabItems} />
      </Section>

      <Section title="Loading states" className="border-t border-border">
        <Stack direction="horizontal" gap={6} align="center">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <div className="w-64">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-2 h-20 w-full" />
          </div>
        </Stack>
      </Section>

      <footer className="border-t border-border">
        <Container className="py-8">
          <p className="text-sm text-text-secondary">
            IdeaProof AI — design system playground. Remove or gate this route
            before production release.
          </p>
        </Container>
      </footer>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example modal"
        description="A focused, accessible dialog."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
          </>
        }
      >
        <p className="text-text-secondary">
          Modals trap focus, close on Escape or backdrop click, and restore focus
          to the trigger on close. They animate subtly and respect reduced motion.
        </p>
      </Modal>
    </div>
  )
}
