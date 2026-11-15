import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const ColorPaletteIcon = ({ 
  color = "#fff", 
  width = 14, 
  height = 15, 
  ...props 
}: IconProps) => (
  <Svg 
    
    width={width}
    height={height}
    viewBox="0 0 14 15"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M14 7.5v.074c-.01.998-.919 1.676-1.917 1.676H9.406a1.313 1.313 0 0 0-1.285 1.583c.058.28.178.547.295.818.167.377.331.752.331 1.148 0 .87-.59 1.66-1.46 1.696A6.999 6.999 0 0 1 0 7.5a7 7 0 0 1 7-7 7 7 0 0 1 7 7ZM3.5 8.375a.875.875 0 1 0-1.75 0 .875.875 0 0 0 1.75 0Zm0-2.625a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75Zm4.375-2.625a.875.875 0 1 0-1.75 0 .875.875 0 0 0 1.75 0ZM10.5 5.75a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75Z"
    />
  </Svg>
)
export default ColorPaletteIcon