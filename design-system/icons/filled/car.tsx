import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
}

const Car = ({ color = "#1F2937", ...props }: IconProps) => (
  <Svg
    width={21}
    height={18}
    viewBox="0 0 21 18"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M6.531 3.586 5.511 6.5h11.477l-1.02-2.914a1.251 1.251 0 0 0-1.179-.836H7.711a1.25 1.25 0 0 0-1.18.836ZM2.797 6.688l1.375-3.926A3.75 3.75 0 0 1 7.71.25h7.078a3.75 3.75 0 0 1 3.54 2.512l1.374 3.925A2.505 2.505 0 0 1 21.25 9v7.5c0 .691-.559 1.25-1.25 1.25h-1.25c-.691 0-1.25-.559-1.25-1.25v-1.875H5V16.5c0 .691-.559 1.25-1.25 1.25H2.5c-.691 0-1.25-.559-1.25-1.25V9c0-1.043.64-1.938 1.547-2.313ZM6.25 10.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0ZM17.5 11.5A1.25 1.25 0 1 0 17.5 9a1.25 1.25 0 0 0 0 2.5Z"
    />
  </Svg>
)
export default Car