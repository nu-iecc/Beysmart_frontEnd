import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";

const HeartIcon = ({ width = 24, height = 24, color = "#1F2937", ...props }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 18 16"
    fill="none"
    {...props}
  >
    <G clipPath="url(#clip)">
      <Path
        fill={color}
        d="M9 15.5l-1.5-1.5C3.5 10.5 0 7.5 0 4.5 0 2 2 0 4.5 0c1.5 0 3 1 3.5 2.5C8.5 1 10 0 11.5 0 14 0 16 2 16 4.5c0 3-3.5 6-7.5 9.5L9 15.5z"
      />
    </G>
    <Defs>
      <ClipPath id="clip">
        <Path fill="#fff" d="M.625 0h16v16h-16V0Z" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default HeartIcon;
