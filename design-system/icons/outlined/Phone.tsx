import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

const SvgComponent = ({ width = 24, height = 24, color = "#374151", ...props }: SvgProps) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path stroke="#E5E7EB" d="M18.5 24H.5V0h18v24Z" />
    <Path
      fill={color}
      d="M1.25 3c0-1.655 1.345-3 3-3h10.5c1.655 0 3 1.345 3 3v18c0 1.655-1.345 3-3 3H4.25c-1.655 0-3-1.345-3-3V3ZM11 21a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Zm3.75-18H4.25v15h10.5V3Z"
    />
  </Svg>
)

export default SvgComponent
