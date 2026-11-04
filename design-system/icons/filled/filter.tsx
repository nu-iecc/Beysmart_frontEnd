import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface SvgComponentProps {
  width?: number
  height?: number
  color?: string
}

function filter({ 
  width = 24, 
  height = 24, 
  color = "#CFFF5E",
  ...props 
}: SvgComponentProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 19 17"
      fill="none"
      {...props}
    >
      <Path
        d="M.145.85C.389.33.909 0 1.485 0h16.03a1.488 1.488 0 011.147 2.427l-6.787 8.294v4.716c0 .45-.252.861-.657 1.062-.405.2-.883.16-1.243-.111L7.6 14.605a1.18 1.18 0 01-.475-.95v-2.935L.334 2.423A1.48 1.48 0 01.144.85z"
        fill={color}
      />
    </Svg>
  )
}

export default filter