import * as d3 from 'd3';

type Color = ReturnType<d3.ScaleSequential<string, never>>;
export const webglColor = (color: Color) => {
	const { r, g, b, opacity } = d3.color(color)!.rgb();
	return [r / 255, g / 255, b / 255, opacity];
};
