import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

type BackArrowProps = SvgProps & { width?: number; height?: number; color?: string }

const BackArrow = ({ width = 24, height = 24, color = "#1F2937", ...props }: BackArrowProps) => (
  <Svg width={width} height={height} viewBox="0 0 14 12" fill="none" {...props}>
    <Path
      fill={color}
      d="M.294 5.294c-.39.39-.39 1.025 0 1.415l5 5a1.002 1.002 0 0 0 1.415-1.415L3.412 7H13a.999.999 0 1 0 0-2H3.416l3.29-3.294A1.002 1.002 0 0 0 5.291.291l-5 5 .003.003Z"
    />
  </Svg>
)

export default BackArrow
