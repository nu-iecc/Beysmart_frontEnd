import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const Beylock = ({ 
  color = "#3B82F6", 
  width = 19, 
  height = 37, 
  ...props 
}: IconProps) => (
  <Svg 
    
    width={width}
    height={height}
    viewBox="0 0 19 37"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M9.5 0C14.747 0 19 4.352 19 9.72v23.916C19 35.494 17.529 37 15.713 37H3.288C1.472 37 0 35.494 0 33.636V9.721C0 4.352 4.254 0 9.5 0Zm0 1.881c-4.062 0-7.355 3.37-7.355 7.526s3.293 7.526 7.355 7.526 7.355-3.37 7.355-7.526S13.562 1.882 9.5 1.88Zm-1.532.94c1.861 0 3.371 1.545 3.371 3.45v9.093c-1.861 0-3.371-1.544-3.371-3.449V2.822Z"
    />
  </Svg>
)
export default Beylock