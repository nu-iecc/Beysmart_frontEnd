import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const BluetoothIcon = ({ 
  color = "#3B82F6", 
  width = 17, 
  height = 26, 
  ...props 
}: IconProps) => (
  <Svg 
    
    width={width}
    height={height}
    viewBox="0 0 17 26"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M8 25.5V16l-5.75 5.75L.5 20l7-7-7-7 1.75-1.75L8 10V.5h1.25l7.125 7.125L11 13l5.375 5.375L9.25 25.5H8ZM10.5 10l2.375-2.375L10.5 5.312V10Zm0 10.688 2.375-2.313L10.5 16v4.688Z"
    />
  </Svg>
)
export default BluetoothIcon