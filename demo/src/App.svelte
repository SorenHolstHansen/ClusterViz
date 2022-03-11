<script lang="ts">
	import { ClusterViz, ClusterVizNode } from '@cluster-viz/core';
	import { onMount } from 'svelte';
	import { data } from './data';

	let nodeSize = 50;
	let edgeWidth = 0.5;

	type CustomData = {
		lang: string;
		year: number;
	};

	let viz: ClusterViz<CustomData>;

	function* createEdges() {
		let countryNodes = {};
		let edges = [];

		let index = 0;
		for (let row of data) {
			let nodes = countryNodes[row.lang];
			if (nodes) {
				nodes.forEach((n) => {
					if (n.year === row.year && Math.abs(n.x - row.x) + Math.abs(n.y - row.y) < 2) {
						edges.push({
							source: { x: n.x / 50, y: n.y / 50 },
							target: { x: row.x / 50, y: row.y / 50 }
						});
					}
				});
				countryNodes[row.lang] = [...nodes, row];
			} else {
				countryNodes[row.lang] = [row];
			}

			index++;

			if (index % 10000 === 0 || index === data.length - 1) {
				yield edges;
				edges = [];
				countryNodes = {};
			}
		}

		return edges;
	}

	function redraw() {
		if (viz) viz.drop();

		viz = new ClusterViz<CustomData>({
			elementId: '#chart',
			createAnnotation: (node) => ({
				note: {
					label: node.data.lang + ' ' + node.data.year,
					bgPadding: 15,
					title: node.data.lang
				},
				dx: 20,
				dy: 20
			}),
			nodeColor: (node) => {
				let h = (Math.round(((node.data.year - 1850) / 150) * 100) + 0) % 255;
				return `hsl(${h}, 80%, 50%)`;
			},
			nodeSize,
			edgeWidth,
			annotationType: 'annotationLabel'
		});
		let newData: ClusterVizNode<CustomData>[] = data.map((v) => ({
			x: v.x / 50,
			y: v.y / 50,
			data: {
				year: v.year,
				lang: v.lang
			}
		}));
		viz.addNodes(newData);
		let edgeGenerator = createEdges();

		let interval = setInterval(() => {
			let edges = edgeGenerator.next().value;
			if (edges) {
				viz.addEdges(edges);
				viz.draw();
			} else {
				clearInterval(interval);
			}
		}, 100);

		// viz.draw();
	}

	onMount(() => {
		redraw();
	});
</script>

<main>
	<div id="chart" />

	<div class="controls">
		<label for="nodesize">Node Size</label>
		<div class="nodesize-range">
			<input type="range" id="nodesize" name="nodesize" bind:value={nodeSize} min={1} max={100} />
			{nodeSize}
		</div>

		<label for="edgewidth">Edge width</label>
		<div class="edgewidth-range">
			<input
				type="range"
				id="edgewidth"
				name="edgewidth"
				bind:value={edgeWidth}
				min={0}
				max={2}
				step={0.1}
			/>
			{edgeWidth}
		</div>
		<button on:click={redraw}>Redraw</button>
	</div>
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
		fill-opacity: 0.9;
	}

	:global(.annotation-note-label, .annotation-note-title) {
		fill: black;
		font-size: 0.8em;
	}

	:global(.annotation path) {
		stroke: #e8336d;
		fill: none;
	}

	.controls {
		opacity: 0.4;
		position: absolute;
		bottom: 2rem;
		right: 2rem;
		width: 400px;
		height: 300px;
		background: white;
		border: 1px solid rgb(173, 169, 169);
		border-radius: 1rem;
		transition: opacity 0.2s;
		padding: 0.5rem;
	}

	.controls:hover {
		opacity: 1;
	}

	.nodesize-range {
		display: flex;
		align-items: center;
	}
</style>
