import * as React from "react"
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg"
const MailIcon = ({ width = 21, height = 20, color = "#1F2937", ...props }) => (
  <Svg
    width={width}
    height={height}
    fill="none"
    {...props}
  >
    <G clipPath="url(#a)">
      <Path
        fill="#1F2937"
        d="M2.516 4.375A.627.627 0 0 0 1.89 5v.863l6.738 5.532a2.185 2.185 0 0 0 2.777 0l6.735-5.532V5a.627.627 0 0 0-.625-.625h-15ZM1.89 8.289V15c0 .344.28.625.625.625h15A.627.627 0 0 0 18.14 15V8.29l-5.547 4.554a4.063 4.063 0 0 1-5.156 0L1.89 8.289ZM.016 5c0-1.379 1.12-2.5 2.5-2.5h15c1.379 0 2.5 1.121 2.5 2.5v10c0 1.379-1.121 2.5-2.5 2.5h-15a2.502 2.502 0 0 1-2.5-2.5V5Z"
      />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill="#fff" d="M.016 0h20v20h-20V0Z" />
      </ClipPath>
    </Defs>
  </Svg>
)
export default MailIcon