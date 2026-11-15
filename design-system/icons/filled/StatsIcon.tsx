import * as React from "react";
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";

const FilledStatsIcon = ({ size = 24, color = "#1F2937", ...props }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 20.875 20"
    fill="none"
    {...props}
  >
    <G clipPath="url(#clip)">
      <Path
        fill={color}
        d="M3.375 2.5c0-.691-.559-1.25-1.25-1.25S.875 1.809.875 2.5v13.125A3.124 3.124 0 0 0 4 18.75h15.625c.691 0 1.25-.559 1.25-1.25s-.559-1.25-1.25-1.25H4a.627.627 0 0 1-.625-.625V2.5Zm15.883 3.383a1.252 1.252 0 0 0-1.77-1.77L13.375 8.23l-2.242-2.242a1.252 1.252 0 0 0-1.77 0l-4.375 4.375a1.252 1.252 0 0 0 1.77 1.77l3.492-3.488 2.242 2.242a1.252 1.252 0 0 0 1.77 0l5-5-.004-.004Z"
      />
    </G>
    <Defs>
      <ClipPath id="clip">
        <Path fill="#fff" d="M.875 0h20v20h-20V0Z" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default FilledStatsIcon;
