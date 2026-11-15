import * as React from "react";
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";

const FilledLivingIcon = ({ size = 24, color = "#1F2937", ...props }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 25 20"
    fill="none"
    {...props}
  >
    <G clipPath="url(#clip)">
      <Path
        fill={color}
        d="M3.375 6.25a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v1.313a3.126 3.126 0 0 0-2.5 3.062V12.5h-15v-1.875a3.126 3.126 0 0 0-2.5-3.063V6.25Zm18.75 4.375a1.88 1.88 0 0 1 1.25-1.77 1.875 1.875 0 0 1 2.5 1.77V17.5c0 .691-.559 1.25-1.25 1.25h-1.25c-.691 0-1.25-.559-1.25-1.25h-17.5c0 .691-.559 1.25-1.25 1.25h-1.25c-.691 0-1.25-.559-1.25-1.25v-6.875a1.875 1.875 0 0 1 3.75 0v3.125h17.5v-3.125Z"
      />
    </G>
    <Defs>
      <ClipPath id="clip">
        <Path fill="#fff" d="M.875 0h25v20h-25V0Z" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default FilledLivingIcon;
