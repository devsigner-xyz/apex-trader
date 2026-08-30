import '../src/styles/tokens.css'
import '../src/styles/globals.css'
import '../src/styles/components.css'
import '../src/styles/professional.css'
import '../src/styles/storybook.css'

const preview = {
  decorators: [
    (Story) => (
      <div className="storybook-canvas">
        <Story />
      </div>
    )
  ],
  parameters: {
    controls: { expanded: true },
    layout: 'fullscreen'
  }
}

export default preview
