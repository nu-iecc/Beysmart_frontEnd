import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

const SvgComponent = ({ color = "#1F2937", ...props }: SvgProps) => (
  <Svg
    width={10}
    height={14}
    viewBox="0 0 10 14"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M1 2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2Zm4 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
    />
  </Svg>
)

export default SvgComponent