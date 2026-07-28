import btcIcon from 'cryptocurrency-icons/svg/white/btc.svg'
import ethIcon from 'cryptocurrency-icons/svg/white/eth.svg'
import ltcIcon from 'cryptocurrency-icons/svg/white/ltc.svg'
import PropTypes from 'prop-types'
import xrpIcon from 'cryptocurrency-icons/svg/white/xrp.svg'

const icons = {
  BTC: btcIcon,
  ETH: ethIcon,
  XRP: xrpIcon,
  LTC: ltcIcon
}

export default function AssetIcon({ ticker, size = 'medium' }) {
  return (
    <img alt={`${ticker} icon`} className={`asset-icon asset-icon--${size}`} src={icons[ticker]} />
  )
}

AssetIcon.propTypes = {
  size: PropTypes.string,
  ticker: PropTypes.string.isRequired
}
