import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface SvgComponentProps {
  width?: number
  height?: number
  color?: string
}

function exportIcon({ 
  width = 24, 
  height = 24, 
  color = "#1F2937",
  ...props 
}: SvgComponentProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      {...props}
    >
      <Path
        d="M9 1a.999.999 0 10-2 0v7.584L4.706 6.291a1.002 1.002 0 00-1.415 1.415l4 4c.39.39 1.025.39 1.415 0l4-4a1.002 1.002 0 00-1.415-1.415L9 8.584V1zM2 11c-1.103 0-2 .897-2 2v1c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-1c0-1.103-.897-2-2-2h-3.172l-1.415 1.416a2 2 0 01-2.829 0L5.172 11H2zm11.5 1.75a.75.75 0 110 1.5.75.75 0 010-1.5z"
        fill={color}
      />
    </Svg>
  )
}

export default exportIcon