import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps extends SvgProps {
  color?: string;
}

const Bag = ({ color = "#1F2937", ...props }: IconProps) => (
  <Svg
    width={21}
    height={19}
    viewBox="0 0 21 19"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M7.938 1.875h5.625c.171 0 .312.14.312.313V3.75h-6.25V2.187c0-.171.14-.312.313-.312Zm-2.188.313V3.75h-2.5a2.502 2.502 0 0 0-2.5 2.5V10.5h20V6.25c0-1.379-1.121-2.5-2.5-2.5h-2.5V2.187C15.75.98 14.77 0 13.562 0H7.939C6.73 0 5.75.98 5.75 2.188Zm15 9.062h-7.5v1.25c0 .691-.559 1.25-1.25 1.25H9.5c-.691 0-1.25-.559-1.25-1.25v-1.25H.75v5c0 1.379 1.121 2.5 2.5 2.5h15c1.379 0 2.5-1.121 2.5-2.5v-5Z"
    />
  </Svg>
)
export default Bag