# Apex Trader

> See beyond the candles by connecting price action with traded volume, order flow, liquidity and the tape in one workstation.

Apex Trader is a desktop-only interactive portfolio demo by Devsigner. It is built with React using JavaScript and JSX, Vite, SVG and Canvas. It is intended for interface exploration, not live trading, brokerage or investment advice.

## Market views

- **Candles** presents price direction together with session context.
- **Footprint** shows bid and ask execution at each price level.
- **Step Profile** compares participation distributed across price within each bar.
- **Volume Profile** summarizes visible traded volume and marks POC, VAH and VAL.
- **Liquidity Heatmap** shows historical resting liquidity across price and time.
- **DOM** presents nearby bid and ask depth around the current price.
- **Time & Sales** lists recent executions and their aggressor side.

## Demo behavior

The demo replays one historical session through a shared clock that keeps the chart, DOM and Time & Sales synchronized. Some compact landing examples use deterministic interface fixtures and are not represented as live or historical market data.

The workstation is designed for desktop viewports. Smaller viewports receive an explanatory notice instead of a compressed trading interface.

## Routes

- [Public landing](https://apex.devsigner.xyz/): Product introduction and compact market-view examples.
- [Candles demo](https://apex.devsigner.xyz/demo): Default workstation mode.
- [Footprint demo](https://apex.devsigner.xyz/demo/footprint): Volume-at-price execution view.
- [Step Profile demo](https://apex.devsigner.xyz/demo/step-profile): Per-bar participation profile.
- [Component library](https://apex.devsigner.xyz/storybook/): Isolated components and deterministic states.

## Scope

Apex Trader is a public case study and functional interface prototype. It does not connect to a broker, accept orders, manage accounts or provide a live market service.

More work by the same designer and developer is available at [Devsigner](https://devsigner.xyz/).
