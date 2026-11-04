import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface SvgComponentProps {
  width?: number
  height?: number
  color?: string
}

function failed({ 
  width = 24, 
  height = 24, 
  color = "#EF4444",
  ...props 
}: SvgComponentProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 16 14"
      fill="none"
      {...props}
    >
      <Path
        d="M7.999 0c.444 0 .853.234 1.078.619l6.75 11.5A1.248 1.248 0 0114.749 14h-13.5c-.447 0-.863-.24-1.085-.628a1.255 1.255 0 01.007-1.253L6.92.619A1.248 1.248 0 017.999 0zm0 4a.748.748 0 00-.75.75v3.5c0 .416.334.75.75.75.415 0 .75-.334.75-.75v-3.5a.748.748 0 00-.75-.75zm1 7a1 1 0 10-2 0 1 1 0 002 0z"
        fill={color}
      />
    </Svg>
  )
}

export default failed