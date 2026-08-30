import PropTypes from 'prop-types'

const surfaceRoles = [
  ['Canvas', '--pro-canvas'],
  ['Top bar', '--pro-top'],
  ['Panel', '--pro-panel'],
  ['Raised', '--pro-raised'],
  ['Selected', '--pro-selected'],
  ['Price axis', '--pro-price-axis'],
  ['Popover', '--pro-popover-surface']
]

const contentRoles = [
  ['Primary text', '--pro-text'],
  ['Muted text', '--pro-muted'],
  ['Quiet text', '--pro-strong'],
  ['Accent / POC', '--pro-accent'],
  ['Buy / positive', '--pro-buy'],
  ['Sell / negative', '--pro-sell'],
  ['Border', '--pro-border'],
  ['Subtle border', '--pro-subtle']
]

const chartRoles = [
  ['Profile bid', '--pro-profile-bid'],
  ['Profile ask', '--pro-profile-ask'],
  ['Profile value', '--pro-profile-value'],
  ['Footprint bid', '--pro-footprint-bid'],
  ['Footprint ask', '--pro-footprint-ask'],
  ['Footprint bid imbalance', '--pro-footprint-bid-imbalance'],
  ['Footprint ask imbalance', '--pro-footprint-ask-imbalance']
]

const actionRoles = [
  ['DOM bid volume', '--pro-dom-bid-volume'],
  ['DOM ask volume', '--pro-dom-ask-volume'],
  ['Buy action', '--pro-action-buy'],
  ['Sell action', '--pro-action-sell'],
  ['Quote update', '--pro-quote-update'],
  ['Tape update', '--pro-tape-update']
]

const meta = { title: 'Foundations/Color roles' }

export default meta

function RoleGroup({ roles, title }) {
  return (
    <section aria-label={title} className="storybook-foundation-group">
      <h2>{title}</h2>
      <div className="storybook-color-grid">
        {roles.map(([label, token]) => (
          <article className="storybook-color-role" key={token}>
            <span className="storybook-color-swatch" style={{ '--storybook-swatch': `var(${token})` }} />
            <strong>{label}</strong>
            <code>{token}</code>
          </article>
        ))}
      </div>
    </section>
  )
}

RoleGroup.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  title: PropTypes.string.isRequired
}

export const SemanticRoles = {
  render: () => (
    <div className="storybook-foundations">
      <RoleGroup roles={surfaceRoles} title="Surfaces" />
      <RoleGroup roles={contentRoles} title="Content and feedback" />
      <RoleGroup roles={chartRoles} title="Chart and profile" />
      <RoleGroup roles={actionRoles} title="Execution and live updates" />
    </div>
  )
}

const dimensions = [
  ['Space 24', '--pro-space-24'],
  ['Space 32', '--pro-space-32'],
  ['Space 48', '--pro-space-48'],
  ['Space 64', '--pro-space-64'],
  ['Space 80', '--pro-space-80'],
  ['Space 96', '--pro-space-96']
]

export const Dimensions = {
  render: () => (
    <div className="storybook-foundations">
      <section aria-label="Spacing roles" className="storybook-foundation-group">
        <h2>Spacing roles</h2>
        <div className="storybook-dimension-list">
          {dimensions.map(([label, token]) => (
            <div className="storybook-dimension" key={token}>
              <span>{label}</span>
              <span className="storybook-dimension-bar" style={{ '--storybook-dimension': `var(${token})` }} />
              <code>{token}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
