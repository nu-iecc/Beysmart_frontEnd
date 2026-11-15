import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const FilledInvite = ({ 
  color = "#4B5563", 
  width = 20, 
  height = 16, 
  ...props 
}: IconProps) => (
  <Svg 
    width={width}
    height={height}
    viewBox="0 0 20 16"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M3 4a4 4 0 1 1 8 0 4 4 0 0 1-8 0ZM0 15.072A5.57 5.57 0 0 1 5.572 9.5h2.856A5.57 5.57 0 0 1 14 15.072a.928.928 0 0 1-.928.928H.928A.928.928 0 0 1 0 15.072ZM15.75 9.75v-2h-2A.748.748 0 0 1 13 7c0-.416.334-.75.75-.75h2v-2c0-.416.334-.75.75-.75s.75.334.75.75v2h2c.416 0 .75.334.75.75s-.334.75-.75.75h-2v2c0 .416-.334.75-.75.75a.748.748 0 0 1-.75-.75Z"
    />
  </Svg>
)
export default FilledInvite