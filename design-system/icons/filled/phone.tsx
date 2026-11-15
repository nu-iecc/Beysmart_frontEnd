import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const PhoneIcon = ({ 
  color = "#EF4444", 
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
      d="M6.153.769A1.246 1.246 0 0 0 4.672.044l-2.75.75C1.378.944 1 1.437 1 2c0 7.731 6.269 14 14 14 .563 0 1.056-.378 1.206-.922l.75-2.75a1.246 1.246 0 0 0-.725-1.481l-3-1.25a1.246 1.246 0 0 0-1.447.362L10.522 11.5A10.562 10.562 0 0 1 5.5 6.478l1.54-1.26c.429-.35.576-.937.363-1.446l-1.25-3V.769Z"
    />
  </Svg>
)
export default PhoneIcon