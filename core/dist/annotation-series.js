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
exports.seriesSvgAnnotation = void 0;
const d3 = __importStar(require("d3"));
const fc = __importStar(require("d3fc"));
const d3_svg_annotation_1 = require("d3-svg-annotation");
const seriesSvgAnnotation = () => {
    const d3Annotation = (0, d3_svg_annotation_1.annotation)();
    let xScale = d3.scaleLinear();
    let yScale = d3.scaleLinear();
    const join = fc.dataJoin('g', 'annotation');
    const series = (selection) => {
        selection.each((data, index, group) => {
            const projectedData = data.map((d) => {
                console.log(xScale(d.x));
                return Object.assign(Object.assign({}, d), { x: xScale(d.x), y: yScale(d.y) });
            });
            d3Annotation.annotations(projectedData);
            join(d3.select(group[index]), projectedData).call(d3Annotation);
        });
    };
    series.xScale = (...args) => {
        if (!args.length) {
            return xScale;
        }
        xScale = args[0];
        return series;
    };
    series.yScale = (...args) => {
        if (!args.length) {
            return yScale;
        }
        yScale = args[0];
        return series;
    };
    fc.rebindAll(series, d3Annotation);
    return series;
};
exports.seriesSvgAnnotation = seriesSvgAnnotation;
//# sourceMappingURL=annotation-series.js.map