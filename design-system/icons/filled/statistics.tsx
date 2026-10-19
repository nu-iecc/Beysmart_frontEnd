import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface SvgComponentProps {
  width?: number
  height?: number
  color?: string
}

function statistics({ 
  width = 24, 
  height = 24, 
  color = "#3B82F6",
  ...props 
}: SvgComponentProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 14 14"
      fill="none"
      {...props}
    >
      <Path
        d="M5 1.5A1.5 1.5 0 016.5 0h1A1.5 1.5 0 019 1.5v11A1.5 1.5 0 017.5 14h-1A1.5 1.5 0 015 12.5v-11zm-5 6A1.5 1.5 0 011.5 6h1A1.5 1.5 0 014 7.5v5A1.5 1.5 0 012.5 14h-1A1.5 1.5 0 010 12.5v-5zM11.5 2h1A1.5 1.5 0 0114 3.5v9a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 0111.5 2z"
        fill={color}
      />
    </Svg>
  )
}

export default statistics