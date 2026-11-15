import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
}

const Shirt = ({ color = "#1F2937", ...props }: IconProps) => (
  <Svg
    width={26}
    height={20}
    viewBox="0 0 26 20"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M9.523 0c.305 0 .559.223.653.516a3.75 3.75 0 0 0 3.574 2.609 3.75 3.75 0 0 0 3.574-2.61c.094-.292.348-.515.652-.515h.493c.879 0 1.726.309 2.402.871l4.93 4.106a1.257 1.257 0 0 1 .14 1.785l-2.187 2.5a1.251 1.251 0 0 1-1.742.136L20 7.723V17.5c0 1.379-1.121 2.5-2.5 2.5H10a2.502 2.502 0 0 1-2.5-2.5V7.723L5.488 9.398a1.252 1.252 0 0 1-1.742-.136L1.56 6.762a1.257 1.257 0 0 1 .14-1.785L6.63.87A3.752 3.752 0 0 1 9.03 0h.492Z"
    />
  </Svg>
)
export default Shirt