import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";

const SaveIcon = ({ width = 24, height = 24, color = "#1F2937", ...props }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 16 18"
    fill="none"
    {...props}
  >
    <G clipPath="url(#clip)">
      <Path
        fill={color}
        d="M13.875 0H2.125C1.5 0 1 .5 1 1.125v15.75C1 17.5 1.5 18 2.125 18h11.75c.625 0 1.125-.5 1.125-1.125V1.125C15 .5 14.5 0 13.875 0ZM8 15.75c-1.25 0-2.25-1-2.25-2.25S6.75 11.25 8 11.25s2.25 1 2.25 2.25S9.25 15.75 8 15.75ZM12.75 6.75h-9.5V2.25h9.5v4.5Z"
      />
    </G>
    <Defs>
      <ClipPath id="clip">
        <Path fill="#fff" d="M.875 0h14.25v18H.875V0Z" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default SaveIcon;
