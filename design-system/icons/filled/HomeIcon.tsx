import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface HomeIconProps extends SvgProps {
  width?: number;
  height?: number;
  color?: string;
}

const FilledHomeIcon = ({ 
  width = 24, 
  height = 24, 
  color = "#1F2937", 
  ...props 
}: HomeIconProps) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M22.617 9.98c0 .704-.586 1.254-1.25 1.254h-1.25l.027 6.258c0 .106-.007.211-.019.317v.628c0 .864-.7 1.563-1.563 1.563h-.625c-.043 0-.085 0-.128-.004-.055.004-.11.004-.165.004h-2.207c-.863 0-1.562-.7-1.562-1.563V15c0-.691-.559-1.25-1.25-1.25h-2.5c-.691 0-1.25.559-1.25 1.25V18.438c0 .863-.7 1.562-1.563 1.562H5.13c-.059 0-.117-.004-.176-.008-.047.004-.094.008-.14.008h-.625c-.864 0-1.563-.7-1.563-1.563v-4.375c0-.035 0-.074.004-.109v-2.719H1.375c-.703 0-1.25-.546-1.25-1.254 0-.351.117-.664.39-.937L10.532.313c.274-.274.586-.313.86-.313.273 0 .586.078.82.273l9.976 8.77c.313.273.47.586.43.937Z"
    />
  </Svg>
);

export default FilledHomeIcon;