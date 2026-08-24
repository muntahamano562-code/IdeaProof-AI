import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Container } from '../components/layout/Container'
import { Section } from '../components/layout/Section'
import { Grid } from '../components/layout/Grid'
import { ThemeToggle } from '../components/ThemeToggle'
import {
  IconTarget,
  IconShieldAlert,
  IconMessageQuestion,
  IconGauge,
  IconArrowRight,
  IconCheck,
} from '../components/ui/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

function scrollToId(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Header({ onStartValidating }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <a
          href="#top"
          className="font-display text-lg font-semibold tracking-tight text-text-primary"
        >
          IdeaProof<span className="text-primary"> AI</span>
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          <a
            href="#how-it-works"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            How it works
          </a>
          <a
            href="#features"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            Features
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            onClick={onStartValidating}
            className="hidden sm:inline-flex"
          >
            Start validating
          </Button>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  )
}

function HeroVisual() {
  return (
    <Card className="animate-fade p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
        Idea validation canvas
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="rounded-lg border border-border bg-elevated px-4 py-3 text-sm font-medium text-text-primary">
          Enter
        </span>
        <IconArrowRight
          className="h-5 w-5 text-text-secondary"
          aria-hidden="true"
        />
        <span className="rounded-lg border border-border bg-elevated px-4 py-3 text-sm font-medium text-text-primary">
          Challenge
        </span>
        <IconArrowRight
          className="h-5 w-5 text-text-secondary"
          aria-hidden="true"
        />
        <span className="rounded-lg border border-border bg-elevated px-4 py-3 text-sm font-medium text-text-primary">
          Validate
        </span>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Badge variant="low">Assumptions</Badge>
        <Badge variant="medium">Risks</Badge>
        <Badge variant="info">Evidence</Badge>
      </div>
    </Card>
  )
}

function Hero({ onStartValidating }) {
  return (
    <section className="relative overflow-hidden">
      <Container className="grid gap-12 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="animate-fade">
          <Badge variant="info">Pressure-test your idea</Badge>
          <h1 className="mt-4 font-display text-display font-semibold leading-tight tracking-tight text-text-primary">
            Challenge your idea before you build it.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-text-secondary">
            IdeaProof AI helps founders, students, and builders examine an idea
            from every angle — surfacing the assumptions, risks, and unknowns
            worth validating before you commit time and money.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={onStartValidating}>Start validating</Button>
            <Button
              variant="secondary"
              onClick={() => scrollToId('how-it-works')}
            >
              See how it works
            </Button>
          </div>
        </div>
        <HeroVisual />
      </Container>
    </section>
  )
}

function ValueSection() {
  const dimensions = [
    'Problem',
    'Target audience',
    'Assumptions',
    'Risks',
    'Feasibility',
    'Differentiation',
    'What to validate next',
  ]
  return (
    <Section
      id="value"
      title="Examine your idea from every angle"
      description="Most ideas are built before their core assumptions are questioned. IdeaProof AI guides you through the dimensions that decide whether an idea is worth pursuing — and what you should test first."
    >
      <div className="mt-8 flex flex-wrap gap-2">
        {dimensions.map((d) => (
          <Badge key={d} variant="neutral">
            {d}
          </Badge>
        ))}
      </div>
    </Section>
  )
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      t: 'Enter your idea',
      d: 'Describe the problem, audience, stage, and constraints.',
    },
    {
      n: '02',
      t: 'Get challenged',
      d: 'Surface assumptions, risks, and weak points worth questioning.',
    },
    {
      n: '03',
      t: 'Validate',
      d: 'Turn the biggest uncertainties into concrete validation experiments.',
    },
    {
      n: '04',
      t: 'Decide',
      d: 'Use the evidence you gather to make a more informed decision about whether to build, pivot, or rethink.',
    },
  ]
  return (
    <Section
      id="how-it-works"
      title="How it works"
      description="A clear path from a raw idea to a more informed decision."
    >
      <Grid cols={1} smCols={2} lgCols={4} gap={6} className="mt-8">
        {steps.map((s) => (
          <Card key={s.n} className="p-6">
            <span className="font-mono text-2xl font-medium text-primary">
              {s.n}
            </span>
            <h3 className="mt-3 font-display text-h3 font-semibold text-text-primary">
              {s.t}
            </h3>
            <p className="mt-2 text-sm text-text-secondary">{s.d}</p>
          </Card>
        ))}
      </Grid>
    </Section>
  )
}

function Features() {
  const features = [
    {
      icon: IconTarget,
      title: 'Assumption detection',
      d: 'Identify the assumptions that could make or break your idea — and separate hopes from evidence.',
    },
    {
      icon: IconShieldAlert,
      title: 'Risk radar',
      d: 'Surface the areas of uncertainty and potential risk that deserve a closer look.',
    },
    {
      icon: IconMessageQuestion,
      title: 'Challenge mode',
      d: 'Pressure-test your idea through skeptical questions designed to find weak points.',
    },
    {
      icon: IconGauge,
      title: 'Validation verdict',
      d: 'Summarize the current assessment and what deserves validation next — as guidance, not a guarantee.',
    },
  ]
  return (
    <Section
      id="features"
      title="What IdeaProof AI does"
      description="Capabilities designed to help you question an idea before you build it."
    >
      <Grid cols={1} smCols={2} gap={6} className="mt-8">
        {features.map((f) => (
          <Card key={f.title} className="p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-display text-h3 font-semibold text-text-primary">
              {f.title}
            </h3>
            <p className="mt-2 text-sm text-text-secondary">{f.d}</p>
          </Card>
        ))}
      </Grid>
      <p className="mt-6 text-sm text-text-secondary">
        These are product capabilities. The assessment you receive depends on the
        idea you provide and the evidence you gather.
      </p>
    </Section>
  )
}

function Trust() {
  const principles = [
    'Question assumptions',
    'Surface uncertainty',
    'Test, don’t guess',
  ]
  return (
    <Section
      title="Built around evidence, not hype"
      description="We designed IdeaProof AI to help you question assumptions, surface uncertainty, and turn unknowns into things you can test. It won’t tell you your idea will succeed — it helps you make a more informed decision."
    >
      <Grid cols={1} smCols={3} gap={6} className="mt-8">
        {principles.map((p) => (
          <div
            key={p}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface p-5"
          >
            <IconCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-success"
              aria-hidden="true"
            />
            <p className="text-sm text-text-primary">{p}</p>
          </div>
        ))}
      </Grid>
    </Section>
  )
}

function FinalCTA({ onStartValidating }) {
  return (
    <Section id="start" className="border-t border-border">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-h1 font-semibold tracking-tight text-text-primary">
          Have an idea worth challenging?
        </h2>
        <p className="mt-4 text-text-secondary">
          Pressure-test the assumptions before you commit the time and resources
          to building.
        </p>
        <div className="mt-8 flex justify-center">
          <Button onClick={onStartValidating}>Start validating</Button>
        </div>
      </div>
    </Section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="font-display text-lg font-semibold tracking-tight text-text-primary">
            IdeaProof<span className="text-primary"> AI</span>
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            Challenge your idea before you build it. An AI-assisted validation
            workspace for founders, students, and builders.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-col gap-2 text-sm"
        >
          <a
            href="#how-it-works"
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            How it works
          </a>
          <a
            href="#features"
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            Features
          </a>
        </nav>
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-text-secondary">Privacy (placeholder)</span>
          <span className="text-text-secondary">Terms (placeholder)</span>
          <ThemeToggle />
        </div>
      </Container>
      <Container className="border-t border-border py-6">
        <p className="text-xs text-text-secondary">
          © {new Date().getFullYear()} IdeaProof AI. All rights reserved.
        </p>
      </Container>
    </footer>
  )
}

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const startValidating = () => navigate(user ? '/dashboard' : '/signup')

  return (
    <div id="top" className="min-h-screen bg-background text-text-primary">
      <Header onStartValidating={startValidating} />
      <main>
        <Hero onStartValidating={startValidating} />
        <ValueSection />
        <HowItWorks />
        <Features />
        <Trust />
        <FinalCTA onStartValidating={startValidating} />
      </main>
      <Footer />
    </div>
  )
}
