import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const FilledHelpSupport = ({ 
  color = "#4B5563", 
  width = 16, 
  height = 16, 
  ...props 
}: IconProps) => (
  <Svg 
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16ZM5.306 5.166A1.753 1.753 0 0 1 6.956 4h1.822a1.972 1.972 0 0 1 .981 3.684l-1.009.578A.752.752 0 0 1 8 9a.748.748 0 0 1-.75-.75v-.422c0-.269.144-.516.378-.65l1.384-.794a.473.473 0 0 0-.234-.88H6.956c-.106 0-.2.065-.234.165l-.013.037a.75.75 0 0 1-1.412-.5l.012-.037-.003-.003ZM7 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z"
    />
  </Svg>
)
export default FilledHelpSupport