import TimeSales from './TimeSales.jsx'

const trades = [
  { amount: 0.4821, price: 7407.25, side: 'buy', timestamp: 1_575_849_600_000 },
  { amount: 0.1532, price: 7407, side: 'sell', timestamp: 1_575_849_599_000 },
  { amount: 1.2024, price: 7406.75, side: 'buy', timestamp: 1_575_849_598_000 },
  { amount: 0.8231, price: 7406.5, side: 'sell', timestamp: 1_575_849_597_000 },
  { amount: 0.3125, price: 7406.25, side: 'buy', timestamp: 1_575_849_596_000 }
]

const meta = {
  title: 'Execution/Time and Sales',
  component: TimeSales
}

export default meta

export const Default = {
  args: { trades },
  render: (args) => (
    <div className="storybook-panel">
      <TimeSales {...args} />
    </div>
  )
}

export const BuysOnly = {
  args: { initialFilter: 'buy', trades },
  render: (args) => (
    <div className="storybook-panel">
      <TimeSales {...args} />
    </div>
  )
}

export const SettingsOpen = {
  args: { initialSettingsOpen: true, trades },
  render: (args) => (
    <div className="storybook-panel">
      <TimeSales {...args} />
    </div>
  )
}
