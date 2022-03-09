import * as d3 from 'd3';
export declare const seriesSvgAnnotation: () => {
    (selection: any): void;
    xScale(...args: any[]): any | d3.ScaleLinear<number, number, never>;
    yScale(...args: any[]): any | d3.ScaleLinear<number, number, never>;
};
