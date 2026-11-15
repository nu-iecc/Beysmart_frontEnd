import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const CardIcon = ({ 
  color = "#1F2937", 
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
      d="M2 0C.897 0 0 .897 0 2v1h18V2c0-1.103-.897-2-2-2H2Zm16 6H0v6c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V6ZM3.5 10h2c.275 0 .5.225.5.5s-.225.5-.5.5h-2a.501.501 0 0 1-.5-.5c0-.275.225-.5.5-.5Zm3.5.5c0-.275.225-.5.5-.5h4c.275 0 .5.225.5.5s-.225.5-.5.5h-4a.501.501 0 0 1-.5-.5Z"
    />
  </Svg>
)
export default CardIcon