import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
}

const Screen = ({ color = "#1F2937", ...props }: IconProps) => (
  <Svg
    width={26}
    height={20}
    viewBox="0 0 26 20"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M3.75 2.5v11.25h19V2.5h-19Zm-2.5 0C1.25 1.121 2.371 0 3.75 0h19c1.379 0 2.5 1.121 2.5 2.5v11.25c0 1.379-1.121 2.5-2.5 2.5h-19a2.502 2.502 0 0 1-2.5-2.5V2.5Zm5.5 15h14c.691 0 1.25.559 1.25 1.25S20.441 20 19.75 20h-14C5.059 20 4.5 19.441 4.5 18.75s.559-1.25 1.25-1.25Z"
    />
  </Svg>
)
export default Screen