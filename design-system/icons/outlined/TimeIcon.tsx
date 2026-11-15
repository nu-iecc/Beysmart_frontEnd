import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";

type IconProps = {
  width?: number;
  height?: number;
  color?: string;
};

const TimeIcon = ({ width = 24, height = 24, color = "#1F2937", ...props }: IconProps) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <G clipPath="url(#clip0)">
      <Path
        fill={color}
        d="M14.875 8a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM.375 8a8 8 0 1 0 16 0 8 8 0 0 0-16 0Zm7.25-4.25V8c0 .25.125.484.334.625l3 2a.748.748 0 0 0 1.041-.21.748.748 0 0 0-.21-1.04L9.126 7.6V3.75a.748.748 0 0 0-.75-.75.748.748 0 0 0-.75.75Z"
      />
    </G>
    <Defs>
      <ClipPath id="clip0">
        <Path fill="#fff" d="M.375 0h16v16h-16V0Z" />
      </ClipPath>
    </Defs>
  </Svg>
)

export default TimeIcon
