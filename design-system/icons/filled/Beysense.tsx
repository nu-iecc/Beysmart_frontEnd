import * as React from "react"
import Svg, { SvgProps, Rect, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const Beysense = ({ 
  color = "#059669", 
  width = 21, 
  height = 33, 
  ...props 
}: IconProps) => (
  <Svg 
    width={width}
    height={height}
    viewBox="0 0 21 33"
    fill="none"
    {...props}
  >
    {/* Background rounded rectangle */}
    <Rect width={21} height={32.2} y={0.4} fill={color} rx={3} />
    
    {/* Centered curved shape */}
    <Path 
      fill="#83D3AA" 
      d="M7 12.4a7 7 0 0 1 7-7v16.8a7 7 0 0 1-7 7V12.4Z" 
    />
  </Svg>
)

export default Beysense