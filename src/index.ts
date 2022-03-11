import * as d3 from 'd3';
import {
	annotation,
	annotationBadge,
	annotationCallout,
	annotationCalloutCircle,
	annotationCalloutCurve,
	annotationCalloutElbow,
	annotationCalloutRect,
	annotationLabel,
	annotationXYThreshold
} from 'd3-svg-annotation';
import * as fc from 'd3fc';
import { webglColor } from './utils';

type AnnotationType =
	| 'annotationLabel'
	| 'annotationCallout'
	| 'annotationCalloutElbow'
	| 'annotationCalloutCurve'
	| 'annotationCalloutCircle'
	| 'annotationCalloutRect'
	| 'annotationXYThreshold'
	| 'annotationBadge';

const annotationTypeToAnnotation = {
	annotationLabel: annotationLabel,
	annotationCallout: annotationCallout,
	annotationCalloutElbow: annotationCalloutElbow,
	annotationCalloutCurve: annotationCalloutCurve,
	annotationCalloutCircle: annotationCalloutCircle,
	annotationCalloutRect: annotationCalloutRect,
	annotationXYThreshold: annotationXYThreshold,
	annotationBadge: annotationBadge
};

type ClusterVizOptions<T> = {
	/**
	 * The id element to draw to.
	 * You should size this element yourself, then the chart will fill the available area.
	 * If this is not defined, you should define the element
	 */
	elementId: string;
	/**
	 * See https://d3-annotation.susielu.com/
	 * for the different types
	 */
	annotationType: AnnotationType;
	annotationNotePadding?: number;
	annotationTextWrap?: number;
	/**
	 * Create the annotation that you see when you hover over the node
	 */
	createAnnotation: (node: ClusterVizNode<T>) => Annotation;
	/**
	 * Generate a color from a node. This can return any color string, e.g.
	 * - rgb(255, 255, 255)
	 * - rgb(10%, 20%, 30%)
	 * - rgba(255, 255, 255, 0.4)
	 * - rgba(10%, 20%, 30%, 0.4)
	 * - hsl(120, 50%, 20%)
	 * - hsla(120, 50%, 20%, 0.4)
	 * - #ffeeaa
	 * - #fea
	 * - #ffeeaa22
	 * - #fea2
	 * - steelblue
	 */
	nodeColor?: (node: ClusterVizNode<T>) => string;
	/**
	 * The size of a node. Defaults to 1
	 */
	nodeSize?: number | ((node: ClusterVizNode<T>) => number);
	// edgeWidth?: number;
};

/**
 * A point is a position inside the chart
 */
type Point = {
	/**
	 * Should be a number between -1 and 1
	 */
	x: number;
	/**
	 * Should be a number between -1 and 1
	 */
	y: number;
};

export type ClusterVizNode<T> = Point & {
	/** Any custom data on the node */
	data: T;
};

// type ClusterVizEdge = {
// 	source: Point;
// 	target: Point;
// };

type BgPadding = number | { top: number; left: number; right: number; bottom: number };

type AnnotationCurveType = 'curve' | 'linear' | 'default' | 'step';
const annotationCurve: { [key in AnnotationCurveType]: d3.CurveFactory | undefined } = {
	curve: d3.curveBasis,
	linear: d3.curveLinear,
	default: undefined,
	step: d3.curveStep
};

type Annotation = {
	note: {
		label: string;
		bgPadding?: BgPadding;
		title: string;
		align?: 'middle' | 'dynamic' | 'top' | 'bottom' | 'left' | 'right';
		lineType?: 'vertical' | 'horizontal';
		orientation?: 'leftRight' | 'topBottom';
	};
	dx: number;
	dy: number;
	/** Only needed if annotationType is "annotationCalloutCurve" */
	connector?: {
		type?: 'elbow' | 'curve';
		curve?: AnnotationCurveType;
		points?: 1 | 2 | 3 | 4;
		end?: 'arrow' | 'dot' | undefined;
	};
	subject?: {
		/** Only used if annotationType is "annotationCalloutCircle" or "annotationBadge" */
		radius?: number;
		/** Only used if annotationType is "annotationCalloutCircle" */
		radiusPadding?: number;
		/** Only used if annotationType is "annotationCalloutRect" */
		width?: number;
		/** Only used if annotationType is "annotationCalloutRect" */
		height?: number;
		/** Only used if annotationType is "annotationXYThreshold" */
		x1?: number;
		/** Only used if annotationType is "annotationXYThreshold" */
		x2?: number;
		/** Only used if annotationType is "annotationBadge" */
		text?: string;
	};
};

export class ClusterViz<CustomData> {
	private options: ClusterVizOptions<CustomData>;
	private xScale: d3.ScaleLinear<number, number, never>;
	private yScale: d3.ScaleLinear<number, number, never>;
	private xScaleOriginal: d3.ScaleLinear<number, number, never>;
	private yScaleOriginal: d3.ScaleLinear<number, number, never>;
	private element: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
	private chart: any;
	private zoom: d3.ZoomBehavior<Element, unknown>;
	private pointer: any;
	private pointSeries: any;
	// private lineSeries: any;
	private nodes: ClusterVizNode<CustomData>[] = [];
	// private edges: Point[] = [];
	private quadTree: d3.Quadtree<ClusterVizNode<CustomData>>;
	private annotation: Record<string, any> | undefined;

	constructor(options: ClusterVizOptions<CustomData>) {
		this.options = options;
		this.element = d3.select(options.elementId);
		this.registerZoom();
		this.registerPointer();
		this.registerChart();
	}

	private registerChart() {
		this.xScale = d3.scaleLinear().domain([-1, 1]);
		this.yScale = d3.scaleLinear().domain([-1, 1]);
		this.xScaleOriginal = this.xScale.copy();
		this.yScaleOriginal = this.yScale.copy();
		this.quadTree = d3
			.quadtree<ClusterVizNode<CustomData>>()
			.x((d) => d.x)
			.y((d) => d.y);

		const nodeSize = this.options.nodeSize || 1;
		this.pointSeries = fc
			.seriesWebglPoint()
			.equals((previousData: any, currentData: any) => previousData === currentData)
			.size(nodeSize)
			.crossValue((d: ClusterVizNode<CustomData>) => d.x)
			.mainValue((d: ClusterVizNode<CustomData>) => d.y);

		// this.lineSeries = fc
		// 	.seriesWebglLine()
		// 	.equals((a: any, b: any) => a === b)
		// 	.defined((_, i: number) => (i + 1) % 3 !== 0)
		// 	.lineWidth(this.options.edgeWidth || 0.5)
		// 	.xScale(this.xScale)
		// 	.yScale(this.yScale)
		// 	.crossValue((d: ClusterVizNode<CustomData>) => d.x)
		// 	.mainValue((d: ClusterVizNode<CustomData>) => d.y);

		const annotationSeries = (this.seriesSvgAnnotation() as any)
			.notePadding(this.options.annotationNotePadding || 15)
			.textWrap(this.options.annotationTextWrap || 120)
			.type(annotationTypeToAnnotation[this.options.annotationType]);

		this.chart = fc
			.chartCartesian(this.xScale, this.yScale)
			.webglPlotArea(
				fc
					.seriesWebglMulti()
					.series([/* this.lineSeries,  */ this.pointSeries])
					.mapping((data, index, series) => {
						switch (series[index]) {
							// case this.lineSeries:
							// 	return data.clustering.edges;
							case this.pointSeries:
								return data.clustering.nodes;
						}
					})
			)
			.svgPlotArea(
				// only render the annotations series on the SVG layer
				fc
					.seriesSvgMulti()
					.series([annotationSeries])
					.mapping((d) => d.annotations)
			)
			.decorate((sel) =>
				sel
					.enter()
					.select('d3fc-svg.plot-area')
					.on('measure.range', (event) => {
						this.xScaleOriginal.range([0, event.detail.width]);
						this.yScaleOriginal.range([event.detail.height, 0]);
					})
					.call(this.zoom as any)
					.call(this.pointer as any)
			);
	}

	private seriesSvgAnnotation() {
		// the underlying component that we are wrapping
		const d3Annotation = annotation();

		let xScale = this.xScale;
		let yScale = this.yScale;

		const join = fc.dataJoin('g', 'annotation');

		const series = (selection) => {
			selection.each((data, index, group) => {
				const projectedData = data.map((d) => {
					this.xScale.range(this.xScaleOriginal.range());
					this.yScale.range(this.yScaleOriginal.range());
					return {
						...d,
						x: this.xScale(d.x),
						y: this.yScale(d.y)
					};
				});

				d3Annotation.annotations(projectedData);

				join(d3.select(group[index]), projectedData).call(d3Annotation);
			});
		};

		series.xScale = (...args) => {
			if (!args.length) {
				return this.xScale;
			}
			xScale = args[0];
			return series;
		};

		series.yScale = (...args) => {
			if (!args.length) {
				return this.yScale;
			}
			yScale = args[0];
			return series;
		};

		fc.rebindAll(series, d3Annotation);

		return series;
	}

	/** Add colors to your clustering. If you have a lot of data, you should do this in the end */
	registerColor() {
		const colorFunc = this.options.nodeColor || (() => 'rgb(0,0,0)');
		const fillColor = fc
			.webglFillColor()
			.value((d) => webglColor(colorFunc(d)))
			.data(this.nodes);

		this.pointSeries.decorate((program) => fillColor(program));

		// this.lineSeries.decorate((program) => {
		// 	fc
		// 		.webglStrokeColor()
		// 		.value(() => {
		// 			return [0, 0, 0, 0.4];
		// 		})
		// 		.data(this.edges)(program);
		// });
	}

	private registerZoom() {
		this.zoom = d3
			.zoom()
			.scaleExtent([0.8, 10])
			.on('zoom', (event) => {
				this.xScale.domain(event.transform.rescaleX(this.xScaleOriginal).domain());
				this.yScale.domain(event.transform.rescaleY(this.yScaleOriginal).domain());
				this.draw();
			});
	}

	private createAnnotationData(datapoint: ClusterVizNode<CustomData>): Record<string, any> {
		let annotation: any = this.options.createAnnotation(datapoint);
		if (annotation.connector) {
			annotation.connector.curve = annotationCurve[annotation.connector.curve];
		}
		return {
			...annotation,
			x: datapoint.x,
			y: datapoint.y
		};
	}

	private registerPointer() {
		this.pointer = fc.pointer().on('point', ([coord]) => {
			this.xScale.range(this.xScaleOriginal.range());
			this.yScale.range(this.yScaleOriginal.range());

			this.annotation = undefined;
			if (!coord || !this.quadTree) {
				return;
			}
			const x = this.xScale.invert(coord.x);
			const y = this.yScale.invert(coord.y);
			const radius = Math.abs(this.xScale.invert(coord.x) - this.xScale.invert(coord.x - 20));
			const closestDatum = this.quadTree.find(x, y, radius);

			// if the closest point is within 20 pixels, show the annotation
			if (closestDatum) {
				this.annotation = this.createAnnotationData(closestDatum);
			}

			this.draw();
		});
	}

	/** Adds rows to the data */
	addNodes(newNodes: ClusterVizNode<CustomData>[]) {
		this.nodes = this.nodes.concat(newNodes);
		// this.registerColor();

		this.quadTree.addAll(this.nodes);
	}

	// addEdges(newEdges: ClusterVizEdge[]) {
	// 	let edges = this.normalizeEdges(newEdges);
	// 	this.edges = this.edges.concat(edges);
	// }

	/**
	 * Because of the way d3fc makes lines, we have to make lines between two edges, and to avoid displaying those, we make every n mod 2 node double, and hide that later in the displaying process
	 */
	// private normalizeEdges(edges: ClusterVizEdge[]): Point[] {
	// 	let normalizedEdges: Point[] = [];
	// 	edges.forEach((edge) => {
	// 		normalizedEdges.push(edge.source);
	// 		normalizedEdges.push(edge.target);
	// 		normalizedEdges.push(edge.target);
	// 	});
	// 	return normalizedEdges;
	// }

	/**
	 * Draw the clusters in the data to the chart.
	 */
	draw() {
		this.element
			.datum({
				annotations: this.annotation ? [this.annotation] : [],
				clustering: { nodes: this.nodes /*  edges: this.edges */ }
			})
			.call(this.chart);
	}

	/**
	 * Removes the clusterViz
	 */
	drop() {
		this.element.selectChildren().remove();
	}
}
