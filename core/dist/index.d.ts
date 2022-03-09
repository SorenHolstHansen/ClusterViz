import * as d3 from 'd3';
declare type AnnotationType = 'annotationLabel' | 'annotationCallout' | 'annotationCalloutElbow' | 'annotationCalloutCurve' | 'annotationCalloutCircle' | 'annotationCalloutRect' | 'annotationXYThreshold' | 'annotationBadge';
declare type ClusterVizOptions<T> = {
    elementId: string;
    annotationType: AnnotationType;
    annotationNotePadding?: number;
    annotationTextWrap?: number;
    createAnnotation: (node: ClusterVizNode<T>) => Annotation;
    nodeColor?: (node: ClusterVizNode<T>) => string;
    nodeSize?: number | ((node: ClusterVizNode<T>) => number);
};
declare type Point = {
    x: number;
    y: number;
};
export declare type ClusterVizNode<T> = Point & {
    data: T;
};
declare type ClusterVizEdge = {
    source: Point;
    target: Point;
};
declare type BgPadding = number | {
    top: number;
    left: number;
    right: number;
    bottom: number;
};
declare type AnnotationCurveType = 'curve' | 'linear' | 'default' | 'step';
declare type Annotation = {
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
    connector?: {
        type?: 'elbow' | 'curve';
        curve?: AnnotationCurveType;
        points?: 1 | 2 | 3 | 4;
        end?: 'arrow' | 'dot' | undefined;
    };
    subject?: {
        radius?: number;
        radiusPadding?: number;
        width?: number;
        height?: number;
        x1?: number;
        x2?: number;
        text?: string;
    };
};
export declare class ClusterViz<CustomData> {
    private options;
    private xScale;
    private yScale;
    private xScaleOriginal;
    private yScaleOriginal;
    private element;
    private chart;
    private zoom;
    private pointer;
    private pointSeries;
    private lineSeries;
    private nodes;
    private edges;
    private quadTree;
    private annotation;
    constructor(options: ClusterVizOptions<CustomData>);
    private registerChart;
    seriesSvgAnnotation(): {
        (selection: any): void;
        xScale(...args: any[]): d3.ScaleLinear<number, number, never> | any;
        yScale(...args: any[]): d3.ScaleLinear<number, number, never> | any;
    };
    private registerColor;
    private registerZoom;
    private createAnnotationData;
    private registerPointer;
    addNodes(newNodes: ClusterVizNode<CustomData>[]): void;
    addEdges(newEdges: ClusterVizEdge[]): void;
    private normalizeEdges;
    draw(): void;
}
export {};
