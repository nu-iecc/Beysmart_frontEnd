import * as React from "react";
import Svg, { G, Path } from "react-native-svg";

const FilledTimeIcon = ({
  width = 24,
  height = 24,
  color = "#1F2937",
  ...props
}) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <G transform="translate(3,3)">
      <Path
        fill={color}
        d="M9.375 0a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm-.844 4.219V9c0 .281.14.545.376.703l3.375 2.25c.387.26.911.155 1.171-.235a.841.841 0 0 0-.235-1.171l-3-1.997V4.219a.842.842 0 0 0-.843-.844.842.842 0 0 0-.844.844Z"
      />
    </G>
  </Svg>
);

export default FilledTimeIcon;
