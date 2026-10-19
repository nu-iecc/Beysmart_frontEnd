import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface BatteryProps extends SvgProps {
  color?: string;
}

const Battery = ({ color = "#CFFF5E", ...props }: BatteryProps) => (
  <Svg 
     
    fill="none" 
    viewBox="0 0 16 10"
    {...props}
  >
    <Path
      fill={color}
      d="M10.333 1h-8A1.333 1.333 0 0 0 1 2.333v5.334A1.333 1.333 0 0 0 2.333 9h8a1.333 1.333 0 0 0 1.334-1.333V2.333A1.333 1.333 0 0 0 10.333 1Zm4 4.667V4.333a.667.667 0 0 0-.666-.666v2.666a.667.667 0 0 0 .666-.666Z"
    />
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.333 1h-8A1.333 1.333 0 0 0 1 2.333v5.334A1.333 1.333 0 0 0 2.333 9h8a1.333 1.333 0 0 0 1.334-1.333V2.333A1.333 1.333 0 0 0 10.333 1Zm4 4.667V4.333a.667.667 0 0 0-.666-.666v2.666a.667.667 0 0 0 .666-.666Z"
    />
  </Svg>
)

export default Battery