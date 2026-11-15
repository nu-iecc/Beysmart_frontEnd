import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

type EmailIconProps = SvgProps & { width?: number; height?: number; color?: string }

const EmailIcon = ({ width = 16, height = 16, color = "#6B7280", ...props }: EmailIconProps) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      fill={color}
      d="M14 2H2C1.45 2 1 2.45 1 3V13C1 13.55 1.45 14 2 14H14C14.55 14 15 13.55 15 13V3C15 2.45 14.55 2 14 2ZM14 4L8 8.5L2 4V3L8 7.5L14 3V4Z"
    />
  </Svg>
)

export default EmailIcon
