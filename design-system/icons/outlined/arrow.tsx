import * as React from "react"
import Svg, { ClipPath, Defs, G, Path, SvgProps } from "react-native-svg"
const SvgComponent = (props: SvgProps) => (
    <Svg fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path
          fill="#1F2937"
          d="M14.597 8.706c.39-.39.39-1.025 0-1.415l-5-5A1.002 1.002 0 0 0 8.18 3.706L11.478 7H1.891a.999.999 0 1 0 0 2h9.584l-3.29 3.294A1.002 1.002 0 0 0 9.6 13.709l5-5-.003-.003Z"
        />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M.89 0h14v16h-14V0Z" />
        </ClipPath>
      </Defs>
    </Svg>
  )

export default SvgComponent