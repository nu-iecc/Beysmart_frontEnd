import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const ExclamationIcon = ({ 
  color = "#fff", 
  width = 2, 
  height = 14, 
  ...props 
}: IconProps) => (
  <Svg 
   
    width={width}
    height={height}
    viewBox="0 0 2 14"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M1.875 1.75a.874.874 0 1 0-1.75 0v7a.874.874 0 1 0 1.75 0v-7ZM1 13.125a1.093 1.093 0 1 0 0-2.187 1.093 1.093 0 0 0 0 2.187Z"
    />
  </Svg>
)
export default ExclamationIcon