import * as React from "react";
import Svg, { Path } from "react-native-svg";

const FilledEnergyIcon = ({ width = 24, height = 24, color = "#1F2937", ...props }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 20 22"  // Adjusted viewBox to properly frame your original path
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M14.023 1.743A1.25 1.25 0 0 0 12.05.309l-10 8.75c-.39.344-.53.894-.347 1.379a1.26 1.26 0 0 0 1.172.812H7.23l-3.004 7.008A1.25 1.25 0 0 0 6.2 19.692l10-8.75c.39-.344.531-.895.348-1.38a1.253 1.253 0 0 0-1.172-.808h-4.356l3.004-7.011Z"
    />
  </Svg>
);

export default FilledEnergyIcon;