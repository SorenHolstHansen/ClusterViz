import * as d3 from 'd3';
declare type ClusterVizOptions<T> = {
    elementId: string;
    createAnnotation: (node: ClusterVizNode<T>) => Annotation;
    nodeColor: (node: ClusterVizNode<T>) => string;
};
declare type Point = {
    x: number;
    y: number;
};
declare type ClusterVizNode<T> = Point & {
    size?: number;
    data: T;
};
declare type ClusterVizEdge = {
    source: Point;
    target: Point;
};
declare type AnnotationNote = {
    label: string;
    bgPadding: number;
    title: string;
};
declare type Annotation = {
    note: AnnotationNote;
    dx: number;
    dy: number;
};
export declare class ClusterViz<CustomData> {
    private createAnnotation;
    private nodeColor;
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
