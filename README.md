# ClusterViz

A cluster vizualization library that can render hundreds of thousands of nodes. Based on [this excellent article](https://blog.scottlogic.com/2020/05/01/rendering-one-million-points-with-d3.html)

You should have a look at the [demo](https://clusterviz.onrender.com/).

The nodes are loading very slowly in the demo because of my hosting plan, it should be much faster locally

## Getting started

To install, run

```
npm install cluster-viz -S
yarn add cluster-viz
```

Look in the demo folder for an example of how to use.

Basically the steps are as follows.
Initialize your ClusterViz instance

```ts
const viz = new ClusterViz({
	elementId: '#myChart',
	createAnnotation: (node) => ({
		note: {
			label: node.label
			bgPadding: 15,
			title: node.title
		},
		dx: 20,
		dy: 20
	}),
	nodeColor: (node) => {
		return `rgb(10, 10, 10)`;
	},
	nodeSize: 1,
	annotationType: 'annotationLabel'
});
```

After that, you can add nodes to your viz

```ts
viz.addNodes([
    {
        // x and y should be between -1 and 1
        x: 0,
        y: 0,
        label: "Some label",
        title: "Some title"
    },
    ...
])
```

To render the clusters, run

```ts
viz.draw();
```

You can do this either every time you add new nodes or at the end, or whenever really, it is your choice.

To add colors to your cluster view, run

```ts
viz.registerColor();
// After that, draw again
viz.draw();
```

This should **only** be done when all nodes have been loaded, as this can be somewhat expensive.

Also, remember to have a `<div id="myChart">` somewhere.

## Running the demo app

In the root, run

```
yarn && yarn build
```

then cd into the demo folder and run

```
yarn
```

and then

```
yarn dev
```

will start the demo app [locally](http://localhost:8080)
