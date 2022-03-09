"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterViz = void 0;
const d3 = __importStar(require("d3"));
const d3_svg_annotation_1 = require("d3-svg-annotation");
const fc = __importStar(require("d3fc"));
const utils_1 = require("./utils");
class ClusterViz {
    constructor(options) {
        this.nodes = [];
        this.edges = [];
        this.createAnnotation = options.createAnnotation;
        this.nodeColor = options.nodeColor || (() => 'rgb(0,0,0)');
        this.element = d3.select(options.elementId);
        this.registerZoom();
        this.registerPointer();
        this.registerChart();
    }
    registerChart() {
        this.xScale = d3.scaleLinear().domain([-1, 1]);
        this.yScale = d3.scaleLinear().domain([-1, 1]);
        this.xScaleOriginal = this.xScale.copy();
        this.yScaleOriginal = this.yScale.copy();
        this.pointSeries = fc
            .seriesWebglPoint()
            .equals((previousData, currentData) => previousData === currentData)
            .pixelRatio(devicePixelRatio)
            .size((d) => d.size || 1)
            .crossValue((d) => d.x)
            .mainValue((d) => d.y);
        this.lineSeries = fc
            .seriesWebglLine()
            .equals((a, b) => a === b)
            .defined((_, i) => (i + 1) % 3 !== 0)
            .lineWidth(0.5)
            .xScale(this.xScale)
            .yScale(this.yScale)
            .crossValue((d) => d.x)
            .mainValue((d) => d.y);
        const annotationSeries = this.seriesSvgAnnotation().notePadding(15).type(d3_svg_annotation_1.annotationCallout);
        this.chart = fc
            .chartCartesian(this.xScale, this.yScale)
            .webglPlotArea(fc
            .seriesWebglMulti()
            .series([this.lineSeries, this.pointSeries])
            .mapping((data, index, series) => {
            switch (series[index]) {
                case this.lineSeries:
                    return data.clustering.edges;
                case this.pointSeries:
                    return data.clustering.nodes;
            }
        }))
            .svgPlotArea(fc
            .seriesSvgMulti()
            .series([annotationSeries])
            .mapping((d) => d.annotations))
            .decorate((sel) => sel
            .enter()
            .select('d3fc-svg.plot-area')
            .on('measure.range', (event) => {
            this.xScaleOriginal.range([0, event.detail.width]);
            this.yScaleOriginal.range([event.detail.height, 0]);
        })
            .call(this.zoom)
            .call(this.pointer));
    }
    seriesSvgAnnotation() {
        const d3Annotation = (0, d3_svg_annotation_1.annotation)();
        let xScale = this.xScale;
        let yScale = this.yScale;
        const join = fc.dataJoin('g', 'annotation');
        const series = (selection) => {
            selection.each((data, index, group) => {
                const projectedData = data.map((d) => {
                    this.xScale.range(this.xScaleOriginal.range());
                    this.yScale.range(this.yScaleOriginal.range());
                    return Object.assign(Object.assign({}, d), { x: this.xScale(d.x), y: this.yScale(d.y) });
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
    registerColor() {
        const fillColor = fc
            .webglFillColor()
            .value((d) => (0, utils_1.webglColor)(this.nodeColor(d)))
            .data(this.nodes);
        this.pointSeries.decorate((program) => fillColor(program));
        this.lineSeries.decorate((program) => {
            fc
                .webglStrokeColor()
                .value(() => {
                return [0, 0, 0, 0.4];
            })
                .data(this.edges)(program);
        });
    }
    registerZoom() {
        this.zoom = d3
            .zoom()
            .scaleExtent([0.8, 10])
            .on('zoom', (event) => {
            this.xScale.domain(event.transform.rescaleX(this.xScaleOriginal).domain());
            this.yScale.domain(event.transform.rescaleY(this.yScaleOriginal).domain());
            this.draw();
        });
    }
    createAnnotationData(datapoint) {
        return Object.assign(Object.assign({}, this.createAnnotation(datapoint)), { x: datapoint.x, y: datapoint.y });
    }
    registerPointer() {
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
            if (closestDatum) {
                this.annotation = this.createAnnotationData(closestDatum);
            }
            this.draw();
        });
    }
    addNodes(newNodes) {
        this.nodes = this.nodes.concat(newNodes);
        this.registerColor();
        this.quadTree = d3
            .quadtree()
            .x((d) => d.x)
            .y((d) => d.y)
            .addAll(this.nodes);
    }
    addEdges(newEdges) {
        let edges = this.normalizeEdges(newEdges);
        this.edges = this.edges.concat(edges);
    }
    normalizeEdges(edges) {
        let normalizedEdges = [];
        edges.forEach((edge) => {
            normalizedEdges.push(edge.source);
            normalizedEdges.push(edge.target);
            normalizedEdges.push(edge.target);
        });
        return normalizedEdges;
    }
    draw() {
        this.element
            .datum({
            annotations: this.annotation ? [this.annotation] : [],
            clustering: { nodes: this.nodes, edges: this.edges }
        })
            .call(this.chart);
    }
}
exports.ClusterViz = ClusterViz;
//# sourceMappingURL=index.js.map