import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

type DropdownProps = SvgProps & { width?: number; height?: number; color?: string }

const Dropdown = ({ width = 20, height = 20, color = "#9CA3AF", ...props }: DropdownProps) => (
  <Svg width={width} height={height} viewBox="0 0 14 8" fill="none" {...props}>
    <Path
      fill={color}
      d="M6.294 7.706c.39.39 1.025.39 1.415 0l6-6A1.002 1.002 0 0 0 12.294.291L7 5.584 1.706.294A1.002 1.002 0 0 0 .291 1.709l6 6 .003-.003Z"
    />
  </Svg>
)

export default Dropdown
