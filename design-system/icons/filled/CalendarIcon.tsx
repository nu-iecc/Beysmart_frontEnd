import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";

const FilledCalendarIcon = ({ width = 24, height = 24, color = "#1F2937", ...props }) => (
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
        d="M14.75 0h-1.5v1.25c0 .691-.559 1.25-1.25 1.25s-1.25-.559-1.25-1.25V0h-5v1.25c0 .691-.559 1.25-1.25 1.25S3.25 1.941 3.25 1.25V0h-1.5C.755 0 0 .756 0 1.688v14.625C0 17.244.755 18 1.75 18h13c.995 0 1.75-.756 1.75-1.688V1.688C16.5.756 15.745 0 14.75 0ZM1.5 2.25h13v13.5h-13V2.25Z"
      />
    </G>
    <Defs>
      <ClipPath id="clip">
        <Path fill="#fff" d="M.25 0h15.5v18H.25V0Z" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default FilledCalendarIcon;
