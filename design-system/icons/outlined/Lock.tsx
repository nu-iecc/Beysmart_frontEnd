import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

type LockProps = SvgProps & { width?: number; height?: number; color?: string }

const Lock = ({ width = 16, height = 16, color = "#9CA3AF", ...props }: LockProps) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      fill={color}
      d="M4.5 4.5V6h5V4.5a2.5 2.5 0 1 0-5 0ZM2.5 6V4.5a4.501 4.501 0 0 1 9 0V6h.5c1.103 0 2 .897 2 2v6c0 1.103-.897 2-2 2H2c-1.103 0-2-.897-2-2V8c0-1.103.897-2 2-2h.5Z"
    />
  </Svg>
)

export default Lock