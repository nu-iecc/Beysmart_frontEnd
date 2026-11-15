
import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const KeyIcon = ({ 
  color = "#fff", 
  width = 15, 
  height = 14, 
  ...props 
}: IconProps) => (
  <Svg 
    width={width}
    height={height}
    viewBox="0 0 15 14"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M9.188 9.625a4.813 4.813 0 1 0-4.586-3.344l-4.41 4.41a.656.656 0 0 0-.192.465v2.188c0 .363.293.656.656.656h2.188a.655.655 0 0 0 .656-.656V12.25h1.094a.655.655 0 0 0 .656-.656V10.5h1.094a.656.656 0 0 0 .465-.191l.91-.91c.462.147.957.226 1.468.226Zm1.093-7a1.094 1.094 0 1 1 0 2.187 1.094 1.094 0 0 1 0-2.187Z"
    />
  </Svg>
)
export default KeyIcon