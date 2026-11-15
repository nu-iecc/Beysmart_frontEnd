import * as React from "react"
import Svg, { Path, G, Defs, ClipPath } from "react-native-svg"
const PhoneIcon = ({ width = 21, height = 20, color = "#1F2937", ...props }) => (
  <Svg
    width={width}
    height={height}
    fill="none"
    {...props}
  >
    <Path stroke="#E5E7EB" d="M20.75 20h-20V0h20v20Z" />
    <G clipPath="url(#a)">
      <Path
        fill="#1F2937"
        d="M7.191.96A1.558 1.558 0 0 0 5.34.056L1.902.992A1.567 1.567 0 0 0 .75 2.5c0 9.664 7.836 17.5 17.5 17.5.703 0 1.32-.473 1.508-1.152l.937-3.438a1.558 1.558 0 0 0-.906-1.851l-3.75-1.563a1.558 1.558 0 0 0-1.809.453l-1.578 1.926a13.202 13.202 0 0 1-6.277-6.277l1.926-1.575a1.559 1.559 0 0 0 .453-1.808L7.19.965V.96Z"
      />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill="#fff" d="M.75 0h20v20h-20V0Z" />
      </ClipPath>
    </Defs>
  </Svg>
)
export default PhoneIcon