import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

const SvgComponent = ({ width = 24, height = 24, color = "#111827", ...props }: SvgProps) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M21.06.94a1.502 1.502 0 0 1 0 2.124l-12 12a1.502 1.502 0 0 1-2.124 0l-6-6A1.502 1.502 0 0 1 3.059 6.94L8 11.876 18.94.94a1.502 1.502 0 0 1 2.124 0h-.005Z"
    />
  </Svg>
)

export default SvgComponent
