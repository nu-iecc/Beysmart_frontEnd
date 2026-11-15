import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const ShieldIcon = ({ 
  color = "#374151", 
  width = 14, 
  height = 14, 
  ...props 
}: IconProps) => (
  <Svg 
  
    width={width}
    height={height}
    viewBox="0 0 14 14"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M7 0c.126 0 .252.027.366.08l5.15 2.184c.6.254 1.05.848 1.046 1.564-.013 2.713-1.129 7.676-5.84 9.931a1.67 1.67 0 0 1-1.444 0C1.567 11.504.451 6.541.438 3.83a1.697 1.697 0 0 1 1.047-1.565L6.636.08A.87.87 0 0 1 7 0Zm0 1.827v10.335c3.773-1.826 4.788-5.87 4.813-8.296L7 1.826Z"
    />
  </Svg>
)
export default ShieldIcon