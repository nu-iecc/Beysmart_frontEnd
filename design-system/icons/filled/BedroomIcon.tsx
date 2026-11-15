import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
}

const FilledBedroomIcon = ({ color = "#1F2937", ...props }: IconProps) => (
  <Svg
    width={26}
    height={18}
    viewBox="0 0 26 18"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M1.625.25c.691 0 1.25.559 1.25 1.25v10h8.75V5.25c0-.691.559-1.25 1.25-1.25h8.75c2.07 0 3.75 1.68 3.75 3.75v8.75c0 .691-.559 1.25-1.25 1.25s-1.25-.559-1.25-1.25v-1.25h-20v1.25c0 .691-.559 1.25-1.25 1.25s-1.25-.559-1.25-1.25v-15C.375.809.934.25 1.625.25ZM7.25 4a3.125 3.125 0 1 1 0 6.25 3.125 3.125 0 0 1 0-6.25Z"
    />
  </Svg>
);

export default FilledBedroomIcon;
