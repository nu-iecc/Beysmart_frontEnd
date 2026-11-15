import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
}

const Gym = ({ color = "#1F2937", ...props }: IconProps) => (
  <Svg
    width={26}
    height={18}
    viewBox="0 0 26 18"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M6 1.5C6 .809 6.559.25 7.25.25H8.5c.691 0 1.25.559 1.25 1.25v15c0 .691-.559 1.25-1.25 1.25H7.25c-.691 0-1.25-.559-1.25-1.25V14H4.75C4.059 14 3.5 13.441 3.5 12.75v-2.5C2.809 10.25 2.25 9.691 2.25 9S2.809 7.75 3.5 7.75v-2.5C3.5 4.559 4.059 4 4.75 4H6V1.5Zm17.5 0V4h1.25c.691 0 1.25.559 1.25 1.25v2.5c.691 0 1.25.559 1.25 1.25s-.559 1.25-1.25 1.25v2.5c0 .691-.559 1.25-1.25 1.25H23.5v2.5c0 .691-.559 1.25-1.25 1.25H21c-.691 0-1.25-.559-1.25-1.25v-15c0-.691.559-1.25 1.25-1.25h1.25c.691 0 1.25.559 1.25 1.25Zm-5 6.25v2.5H11v-2.5h7.5Z"
    />
  </Svg>
)
export default Gym