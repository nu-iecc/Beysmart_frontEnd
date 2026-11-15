import * as React from "react";
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";

const FilledAlertIcon = ({ size = 24, color = "#1F2937", ...props }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 16 18"
    fill="none"
    {...props}
  >
    <G clipPath="url(#clip)">
      <Path
        fill={color}
        d="M8.125 0C7.503 0 7 .503 7 1.125V1.8a5.628 5.628 0 0 0-4.5 5.513v.66A6.766 6.766 0 0 1 .795 12.46l-.26.292a1.13 1.13 0 0 0-.186 1.21c.179.404.583.664 1.026.664h13.5a1.127 1.127 0 0 0 .84-1.874l-.26-.292a6.76 6.76 0 0 1-1.705-4.486v-.66A5.628 5.628 0 0 0 9.25 1.8v-.675C9.25.503 8.748 0 8.125 0Zm1.593 17.343a2.25 2.25 0 0 0 .657-1.593h-4.5c0 .598.236 1.17.658 1.593A2.25 2.25 0 0 0 8.125 18a2.25 2.25 0 0 0 1.593-.657Z"
      />
    </G>
    <Defs>
      <ClipPath id="clip">
        <Path fill="#fff" d="M0.25 0H16v18H0.25z" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default FilledAlertIcon;
