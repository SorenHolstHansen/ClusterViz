<script lang="ts">
	import { ClusterViz } from '@cluster-viz/core';
	import { onMount } from 'svelte';
	import { data } from './data';

	let viz;

	let maxValues = data.reduce((prev, current) => {
		let max = JSON.parse(JSON.stringify(prev));
		if (current.x < max.x) {
			max.x = current.x;
		}
		if (current.y < max.y) {
			max.y = current.y;
		}
		return max;
	});

	function createEdges() {
		let countryNodes = {};
		let edges = [];

		data.forEach((row) => {
			let nodes = countryNodes[row.year];
			if (nodes) {
				nodes.forEach((n) => {
					if (Math.random() > 0.9999) {
						edges.push({
							source: { x: n.x / 50, y: n.y / 50 },
							target: { x: row.x / 50, y: row.y / 50 }
						});
					}
				});
				countryNodes[row.year] = [...nodes, row];
			} else {
				countryNodes[row.year] = [row];
			}
		});

		return edges;
	}

	onMount(() => {
		viz = new ClusterViz({
			elementId: '#chart',
			createAnnotation: (d) => ({
				note: {
					label: d.lang + ' ' + d.year,
					bgPadding: 5,
					title: d.lang
				},
				dx: 20,
				dy: 20
			}),
			nodeColor: (node) => {
				let h = (Math.round(((node.year - 1850) / 150) * 100) + 0) % 255;
				return `hsl(${h}, 80%, 50%)`;
			}
		});
		let newData = data.map((v) => ({
			x: v.x / 50,
			y: v.y / 50,
			year: v.year,
			size: 20,
			lang: v.lang
		}));
		viz.addNodes(newData);
		let edges = createEdges();
		viz.addEdges(edges);

		viz.draw();
	});
</script>

<main>
	<div id="chart" />
</main>

<style>
	:global(d3fc-group.cartesian-chart) {
		grid-template-columns: 0 auto 1fr auto 0 !important;
		grid-template-rows: 0 auto 1fr auto 0 !important;
	}

	#chart {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		left: 0;
		text-align: middle;
		vertical-align: middle;
	}

	:global(.tick text, .x-axis, .y-axis) {
		display: none;
	}

	:global(.annotation-note-bg) {
		fill-opacity: 0.8;
	}

	:global(.annotation-note-label, .annotation-note-title) {
		fill: black;
		font-size: 0.8em;
	}

	:global(.annotation path) {
		stroke: #e8336d;
		fill: none;
	}
</style>
