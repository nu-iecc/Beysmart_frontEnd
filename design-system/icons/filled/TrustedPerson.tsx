import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const TrustedPersonIcon = ({ 
  color = "#fff", 
  width = 20, 
  height = 20, 
  ...props 
}: IconProps) => (
  <Svg 
    
    width={width}
    height={height}
    viewBox="0 0 20 20"   // 👈 makes sure it's always centered
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M6.375 7a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-1.25 1.313A4.874 4.874 0 0 0 .25 13.188c0 .448.364.812.812.812h10.626c.05 0 .096-.005.145-.014-2.087-1.506-2.73-3.855-2.82-5.474-.44-.131-.904-.2-1.386-.2H5.125ZM13.57 6.17l-3.281 1.313a.66.66 0 0 0-.413.61c0 1.73.708 4.615 3.686 5.857a.65.65 0 0 0 .506 0c2.975-1.242 3.683-4.126 3.683-5.857a.66.66 0 0 0-.413-.61l-3.281-1.313a.652.652 0 0 0-.487 0Zm2.852 2.36c-.107 1.387-.744 3.191-2.608 4.094V7.487L16.42 8.53Z"
    />
  </Svg>
)

export default TrustedPersonIcon
