import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

const EditingIcon = ({ 
  color = "#1F2937", 
  width = 13, 
  height = 12, 
  ...props 
}: IconProps) => (
  <Svg 
    width={width}
    height={height}
    viewBox="0 0 13 12"
    fill="none" 
    {...props}
  >
    <Path
      fill={color}
      d="M8.5.452 7.367 1.587l3.047 3.047 1.134-1.135a1.5 1.5 0 0 0 0-2.12l-.923-.927a1.5 1.5 0 0 0-2.121 0h-.002ZM6.838 2.116 1.373 7.582a2.079 2.079 0 0 0-.52.877l-.83 2.82a.563.563 0 0 0 .696.7l2.82-.83a2.08 2.08 0 0 0 .876-.52l5.468-5.466-3.046-3.047Z"
    />
  </Svg>
)
export default EditingIcon