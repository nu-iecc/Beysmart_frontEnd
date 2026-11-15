import Svg, { Path } from 'react-native-svg';

const LightIcon = ({ width = 16, height = 16, color = '#1F2937', ...props }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path
      d="M9.6625 7.77812C10.1125 7.13437 10.375 6.35 10.375 5.5C10.375 3.2375 8.4875 1.375 6.25 1.375C4.0125 1.375 2.125 3.2375 2.125 5.5C2.125 6.35 2.3875 7.13437 2.8375 7.77812C3.3125 8.4625 3.875 9.175 3.875 10H8.625C8.625 9.175 9.1875 8.4625 9.6625 7.77812ZM4.25 11.25V11.5C4.25 12.4662 5.03375 13.25 6 13.25C6.96625 13.25 7.75 12.4662 7.75 11.5V11.25H4.25Z"
      fill={color}
    />
  </Svg>
);

export default LightIcon;
