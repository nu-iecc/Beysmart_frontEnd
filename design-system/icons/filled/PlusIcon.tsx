import Svg, { Path, SvgProps } from "react-native-svg"

const PlusIcon = ({ width = 24, height = 24, ...props }: SvgProps) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 18 18"  // Adjusted viewBox to properly frame your original path
    fill="none"
    preserveAspectRatio="xMidYMid meet"
    {...props}
  >
    <Path
      fill={props.color || "#CFFF5E"}
      d="M10.25 2.125c0-.691-.559-1.25-1.25-1.25s-1.25.559-1.25 1.25V7.75H2.125c-.691 0-1.25.559-1.25 1.25s.559 1.25 1.25 1.25H7.75v5.625c0 .691.559 1.25 1.25 1.25s1.25-.559 1.25-1.25V10.25h5.625c.691 0 1.25-.559 1.25-1.25s-.559-1.25-1.25-1.25H10.25V2.125Z"
    />
  </Svg>
)

export default PlusIcon