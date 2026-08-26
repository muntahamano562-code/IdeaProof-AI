import { HistoryList } from '../features/history/HistoryList'

export default function HistoryPage() {
  return (
    <>
      <h1 className="font-display text-h1 font-semibold tracking-tight text-text-primary">
        Saved ideas
      </h1>
      <HistoryList />
    </>
  )
}
