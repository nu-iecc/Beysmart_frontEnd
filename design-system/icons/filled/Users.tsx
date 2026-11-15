import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const UsersIcon = ({ 
  color = "#4B5563", 
  width = 18, 
  height = 14, 
  ...props 
}: IconProps) => (
  <Svg 
    width={width}
    height={height}
    viewBox="0 0 18 14"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M4.516 0a2.187 2.187 0 1 1 0 4.375 2.187 2.187 0 0 1 0-4.375Zm10.062 0a2.187 2.187 0 1 1 0 4.375 2.187 2.187 0 0 1 0-4.375Zm-14 8.168A2.919 2.919 0 0 1 3.496 5.25h1.167c.435 0 .848.096 1.22.265A3.501 3.501 0 0 0 7.015 8.75H1.16a.585.585 0 0 1-.583-.582Zm11.083.582h-.02a3.491 3.491 0 0 0 1.132-3.235 2.891 2.891 0 0 1 1.22-.265h1.168a2.919 2.919 0 0 1 2.917 2.918.583.583 0 0 1-.582.582H11.66ZM6.703 6.125a2.625 2.625 0 1 1 5.25 0 2.625 2.625 0 0 1-5.25 0ZM4.078 13.27a3.646 3.646 0 0 1 3.645-3.645h3.21a3.646 3.646 0 0 1 3.645 3.645.73.73 0 0 1-.73.73h-9.04a.73.73 0 0 1-.73-.73Z"
    />
  </Svg>
)
export default UsersIcon