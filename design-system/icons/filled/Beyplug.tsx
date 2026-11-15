import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const Beyplug = ({ 
  color = "#74A500", 
  width = 26, 
  height = 26, 
  ...props 
}: IconProps) => (
  <Svg 
    
    width={width} 
    height={height} 
    viewBox="0 0 26 26" 
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="m22.068 9.488-1.532-1.532-3.064 3.063 1.532 1.532 3.064-3.063ZM22.626 0H5.292A4.346 4.346 0 0 0 .96 4.333V26h2.167V4.333a2.168 2.168 0 0 1 2.167-2.167h17.333a2.169 2.169 0 0 1 2.166 2.167v17.333a2.168 2.168 0 0 1-2.166 2.167H8.542A1.084 1.084 0 0 1 7.46 22.75l-.001-1.492c.012-.098.098-.308.133-.358l3.096-3.095c1.66.978 3.827.768 5.253-.658l2.298-2.297 1.532 1.531 1.533-1.531-5.363-5.362 3.065-3.064-1.532-1.532-3.065 3.064-2.298-2.298-1.532 1.532 1.532 1.532-2.298 2.298c-1.427 1.426-1.635 3.593-.657 5.253L6.059 19.37c-.421.42-.766 1.253-.766 1.849v1.532A3.251 3.251 0 0 0 8.543 26h14.083a4.346 4.346 0 0 0 4.333-4.333V4.333A4.346 4.346 0 0 0 22.626 0Z"
    />
  </Svg>
)

export default Beyplug
