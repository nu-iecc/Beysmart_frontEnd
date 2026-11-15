import * as React from "react";
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";

const FilledHeartIcon = ({ size = 24, color = "#1F2937", ...props }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    {...props}
  >
    <G clipPath="url(#clip)">
      <Path
        fill={color}
        d="m2.298 10.562 6.353 5.93a1.427 1.427 0 0 0 1.948 0l6.353-5.93a5.26 5.26 0 0 0 1.673-3.85v-.204a5.025 5.025 0 0 0-8.578-3.554l-.422.422-.422-.422A5.026 5.026 0 0 0 .625 6.508v.204a5.26 5.26 0 0 0 1.673 3.85Z"
      />
    </G>
    <Defs>
      <ClipPath id="clip">
        <Path fill="#fff" d="M0.625 0h18v18h-18V0Z" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default FilledHeartIcon;
