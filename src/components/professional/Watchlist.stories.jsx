import Watchlist from './Watchlist.jsx'

const meta = {
  title: 'Markets/Watchlist',
  component: Watchlist
}

export default meta

export const Default = {
  render: () => (
    <div className="storybook-panel storybook-panel--wide">
      <Watchlist />
    </div>
  )
}
