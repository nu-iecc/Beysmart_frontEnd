import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const Beyswitch = ({ 
  color = "#892BDB", 
  width = 28, 
  height = 28, 
  ...props 
}: IconProps) => (
  <Svg 
    
    width={width}
    height={height}
    viewBox="0 0 28 28"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M26.012.758H1.863c-.577 0-1.05.474-1.05 1.054v24.255c0 .58.473 1.054 1.05 1.054h24.15c.578 0 1.05-.474 1.05-1.054V1.812c0-.58-.472-1.054-1.05-1.054Zm-1.05 24.254H2.912V2.867h22.05v22.145Z"
    />
    <Path
      fill={color}
      d="M17.613 5.503h-7.35a.528.528 0 0 0-.525.527v7.382h8.4V6.03a.528.528 0 0 0-.526-.527Zm-3.15 5.8c0 .29-.237.527-.525.527a.528.528 0 0 1-.526-.527V8.139c0-.29.237-.527.525-.527.29 0 .526.237.526.527v3.164ZM9.738 14.467v7.382c0 .29.236.527.524.527h7.35a.528.528 0 0 0 .526-.527v-7.382h-8.4Zm4.2 5.272a1.583 1.583 0 0 1-1.575-1.581c0-.87.708-1.582 1.575-1.582a1.583 1.583 0 0 1 0 3.163Z"
    />
  </Svg>
)
export default Beyswitch