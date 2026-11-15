import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const LocationIcon = ({ 
  color = "#6B7280", 
  width = 11, 
  height = 14, 
  ...props 
}: IconProps) => (
  <Svg 
    width={width}
    height={height}
    viewBox="0 0 11 14"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M5.898 13.65c1.403-1.755 4.602-6.01 4.602-8.4A5.251 5.251 0 0 0 5.25 0 5.251 5.251 0 0 0 0 5.25c0 2.39 3.2 6.645 4.602 8.4a.826.826 0 0 0 1.296 0ZM5.25 3.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Z"
    />
  </Svg>
)
export default LocationIcon