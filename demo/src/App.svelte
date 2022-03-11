<script lang="ts">
	import { ClusterViz } from '../../dist/index';
	import { onMount } from 'svelte';

	let nodeSize = 1;

	type CustomData = {
		lang: string;
		year: number;
		title: string;
		author: string;
	};

	let count = 0;
	let viz: ClusterViz;

	function loadData(viz: ClusterViz) {
		// create a web worker that streams the chart data
		const streamingLoaderWorker = new Worker('./streaming-tsv-parser.js');
		streamingLoaderWorker.onmessage = ({ data: { items, totalBytes, finished } }) => {
			const rows = items
				.map((d) => ({
					x: Number(d.x) / 50,
					y: Number(d.y) / 50,
					data: {
						year: Number(d.date),
						lang: d.language,
						title: d.title,
						author: d.first_author_name
					}
				}))
				.filter((d) => !!d.data.year);

			count += rows.length;

			viz.addNodes(rows);

			if (finished) {
				viz.registerColor();
			}
			viz.draw();
		};
		streamingLoaderWorker.postMessage('./data.tsv');
	}

	onMount(() => {
		draw();
	});

	function draw() {
		if (viz) {
			viz.drop();
			count = 0;
		}

		viz = new ClusterViz<CustomData>({
			elementId: '#chart',
			createAnnotation: (node) => ({
				note: {
					label: `
						${node.data.author}\n
						${node.data.lang}\n
						${node.data.year}`,
					bgPadding: 15,
					title: node.data.title
				},
				dx: 20,
				dy: 20
			}),
			nodeColor: (node) => {
				let h = (Math.round(((node.data.year - 1850) / 150) * 100) + 0) % 255;
				return `hsl(${h}, 80%, 50%)`;
			},
			nodeSize,
			annotationType: 'annotationLabel'
		});
		loadData(viz);
	}

	function redraw() {
		draw();
	}
</script>

<main>
	<div class="node-count">Nodes: {count}</div>
	<div id="chart" />

	<div class="controls">
		<label for="nodesize">Node Size</label>
		<div class="nodesize-range">
			<input type="range" id="nodesize" name="nodesize" bind:value={nodeSize} min={1} max={100} />
			{nodeSize}
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

	.node-count {
		position: absolute;
		top: 2rem;
		left: 2rem;
	}
</style>
