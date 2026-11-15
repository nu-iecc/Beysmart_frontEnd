import * as React from "react"
import Svg, { G, Path } from "react-native-svg"

type BackIconProps = {
  size?: number
  color?: string
} & React.ComponentProps<typeof Svg>

const BackIcon = ({ size = 24, color = "#1F2937", ...props }: BackIconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    {...props}
  >
    <G transform="translate(0.5, 0)">
      <Path
        fill={color}
        d="M.294 5.294c-.39.39-.39 1.025 0 1.415l5 5a1.002 1.002 0 0 0 1.415-1.415L3.412 7H13a.999.999 0 1 0 0-2H3.416l3.29-3.294A1.002 1.002 0 0 0 5.291.291l-5 5 .003.003Z"
      />
    </G>
  </Svg>
)

export default BackIcon