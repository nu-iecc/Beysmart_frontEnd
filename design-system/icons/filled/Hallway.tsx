
import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
}

const Hallway = ({ color = "#1F2937", ...props }: IconProps) => (
  <Svg
    width={23}
    height={18}
    viewBox="0 0 23 18"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M16.5 1.5c0-.691.559-1.25 1.25-1.25h5c.691 0 1.25.559 1.25 1.25s-.559 1.25-1.25 1.25H19V6.5c0 .691-.559 1.25-1.25 1.25H14v3.75c0 .691-.559 1.25-1.25 1.25H9v3.75c0 .691-.559 1.25-1.25 1.25h-5C2.059 17.75 1.5 17.191 1.5 16.5s.559-1.25 1.25-1.25H6.5V11.5c0-.691.559-1.25 1.25-1.25H11.5V6.5c0-.691.559-1.25 1.25-1.25H16.5V1.5Z"
    />
  </Svg>
)
export default Hallway