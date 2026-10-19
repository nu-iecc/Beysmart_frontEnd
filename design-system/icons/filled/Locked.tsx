import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface LockedProps extends SvgProps {
  color?: string;
}

const Locked = ({ color = "#fff", ...props }: LockedProps) => (
  <Svg 
   
    fill="none" 
    viewBox="0 0 21 24"
    {...props}
  >
    <Path
      fill={color}
      d="M6.75 6.75V9h7.5V6.75A3.749 3.749 0 0 0 10.5 3a3.749 3.749 0 0 0-3.75 3.75ZM3.75 9V6.75A6.752 6.752 0 0 1 10.5 0a6.752 6.752 0 0 1 6.75 6.75V9H18c1.655 0 3 1.345 3 3v9c0 1.655-1.345 3-3 3H3c-1.655 0-3-1.345-3-3v-9c0-1.655 1.345-3 3-3h.75Z"
    />
  </Svg>
)

export default Locked