import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const MessageIcon = ({ 
  color = "#000", 
  width = 27, 
  height = 14, 
  ...props 
}: IconProps) => (
  <Svg 
    width={width}
    height={height}
    viewBox="0 0 27 14"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M24.833.708H10.75a2.173 2.173 0 0 0-2.167 2.167v9.75a2.167 2.167 0 0 0 2.167 2.167h14.083a2.16 2.16 0 0 0 2.167-2.167v-9.75A2.167 2.167 0 0 0 24.833.708Zm0 11.917H10.75v-7.94l7.042 3.607 7.041-3.608v7.941Zm-7.041-6.164L10.75 2.875h14.083l-7.041 3.586ZM6.417 12.625c0 .184.032.358.054.542H2.083A1.085 1.085 0 0 1 1 12.084c0-.596.485-1.084 1.083-1.084h4.334v1.625ZM4.25 2.334h2.22c-.02.184-.053.357-.053.541V4.5H4.25a1.087 1.087 0 0 1-1.083-1.083c0-.596.487-1.083 1.083-1.083ZM2.083 7.75c0-.596.488-1.083 1.084-1.083h3.25v2.167h-3.25A1.087 1.087 0 0 1 2.083 7.75Z"
    />
  </Svg>
)
export default MessageIcon