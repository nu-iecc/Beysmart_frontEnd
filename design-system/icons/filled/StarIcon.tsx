import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";

const FilledStarIcon = ({ width = 24, height = 24, color = "#1F2937", ...props }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <G clipPath="url(#clip)">
      <Path
        fill={color}
        d="M11.89.633a1.127 1.127 0 0 0-2.025 0l-2.26 4.651-5.048.745a1.123 1.123 0 0 0-.904.763c-.13.404-.024.851.278 1.15l3.663 3.624-.864 5.123a1.129 1.129 0 0 0 1.641 1.18l4.51-2.407 4.511 2.408c.38.2.84.172 1.189-.08.348-.254.524-.68.453-1.101l-.868-5.123 3.663-3.624a1.124 1.124 0 0 0-.626-1.913l-5.052-.745-2.26-4.651Z"
      />
    </G>
    <Defs>
      <ClipPath id="clip">
        <Path fill="#fff" d="M.75 0H21v18H.75V0Z" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default FilledStarIcon;
