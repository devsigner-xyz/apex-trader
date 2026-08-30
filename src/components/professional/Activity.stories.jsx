import Activity from './Activity.jsx'

const meta = {
  title: 'Workspace/Activity',
  component: Activity
}

export default meta

function renderActivity(args) {
  return (
    <div className="storybook-activity">
      <Activity {...args} />
    </div>
  )
}

export const Positions = { args: { initialTab: 'POSITIONS' }, render: renderActivity }
export const Orders = { args: { initialTab: 'ORDERS' }, render: renderActivity }
export const Fills = { args: { initialTab: 'FILLS' }, render: renderActivity }
export const ActivityLog = { args: { initialTab: 'ACTIVITY' }, render: renderActivity }
export const AccountAndRisk = { args: { initialTab: 'ACCOUNT & RISK' }, render: renderActivity }
