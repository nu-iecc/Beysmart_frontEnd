import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
}

const FilledBathIcon = ({ color = "#1F2937", ...props }: IconProps) => (
  <Svg
    width={21}
    height={20}
    viewBox="0 0 21 20"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M4.5 3.02a.52.52 0 0 1 .887-.368l.582.582A3.104 3.104 0 0 0 6.5 6.406a.943.943 0 0 0 .148 1.133.934.934 0 0 0 1.325 0l4.066-4.062a.937.937 0 0 0-1.133-1.473 3.087 3.087 0 0 0-2.031-.754c-.402 0-.79.078-1.14.215L7.151.883A3.02 3.02 0 0 0 2 3.02V10c-.691 0-1.25.559-1.25 1.25S1.309 12.5 2 12.5h17.5c.691 0 1.25-.559 1.25-1.25S20.191 10 19.5 10h-15V3.02ZM2 13.75v.625c0 1.11.484 2.11 1.25 2.797v1.578c0 .691.559 1.25 1.25 1.25s1.25-.559 1.25-1.25v-.625h10v.625c0 .691.559 1.25 1.25 1.25s1.25-.559 1.25-1.25v-1.578a3.747 3.747 0 0 0 1.25-2.797v-.625H2Z"
    />
  </Svg>
);

export default FilledBathIcon;
