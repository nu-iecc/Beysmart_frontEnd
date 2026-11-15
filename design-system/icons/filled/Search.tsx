import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const SearchIcon = ({ 
  color = "#6E6E6E", 
  width = 20, 
  height = 20, 
  ...props 
}: IconProps) => (
  <Svg 
    width={width}
    height={height}
    viewBox="0 0 20 20"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M8.5 3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 8.5a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Z"
    />
    <Path
      fill={color}
      d="m14.354 13.646 4.5 4.5a.5.5 0 0 1-.708.708l-4.5-4.5a.5.5 0 0 1 .708-.708Z"
    />
  </Svg>
)
export default SearchIcon
