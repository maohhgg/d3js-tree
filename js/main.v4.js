var i = 0,
    duration = 750,
    treemap,
    root,
    treeData,
    LeafHeight = 35,
    DepthWidth = 350,
    circleRadius = 9,
    maxDepthLength = 0,
    maxLeafLength = 0,
    zoomLevel = 8;

// Set the dimensions and margins of the diagram
var margin = {
        top: 20,
        right: 90,
        bottom: 30,
        left: 90
    },
    width = window.screen.availWidth - margin.left - margin.right,
    height = window.screen.availHeight - margin.top - margin.bottom;

var color = d3.scaleOrdinal(d3.schemeCategory20);

var zoom = d3.zoom()
    .scaleExtent([1 / zoomLevel, zoomLevel])
    .on("zoom", zoomed);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .call(zoom);

var g = svg.append("g");


d3.json("flare.json", function (error, flare) {
    if (error) throw error;
    treeData = flare;

    root = d3.hierarchy(treeData, function (d) {
        return d.children;
    });
    root.x0 = height / 2;
    root.y0 = 0;

    var n = 0;
    root.c = color(n);

    root.children.forEach(function(element) {
        n++;
        collapse(element,color(n));
    }, this);

    update(root);
    centerNode(root);
});

function visit(parent, vistFn,childrenFn) {
    if (!parent) return;
    
    vistFn(parent);

    var children = childrenFn(parent);
    if (children) {
        var count = children.length;
        for (var i = 0; i < count; i++) {
            visit(children[i], vistFn, childrenFn);
        }
    } else {
        maxLeafLength++;
    }
}

function collapse(d,c) {
    d.c = c;
    if (d.children) {
        d._children = d.children
        d.children.forEach(function(element) {
            collapse(element,c);
        }, this);
        d.children = null
    }
}

function update(source) {
    maxDepthLength = maxLeafLength = 0;

    visit(root, function (d) {
        maxDepthLength = Math.max(d.depth, maxDepthLength)
    }, function (d) {
        return d.children && d.children.length > 0 ? d.children : null;
    });

    var conHeight = maxLeafLength * LeafHeight;
    conHeight =  conHeight < height ? height - 200 : conHeight;
    treemap = d3.tree().size([conHeight , maxDepthLength * DepthWidth])


    // Assigns the x and y position for the nodes
    var treeData = treemap(root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

    // // Normalize for fixed-depth.
    // nodes.forEach(function (d) {
    //     d.y = d.depth * 200
    // });

    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = g.selectAll('g.node')
        .data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", function (d) {
            return d._children ? "lightsteelblue" : "#fff";
        });

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr("dy", function (d) {
            return d.children && !d._children? "-1em" : ".35em";
        })
        .attr("x", function (d) {
            return d.children ? 0 : 13;
        })
        .attr("text-anchor", function (d) {
            return d.children ? "middle" : "start";
        })
        .text(function (d) {
            return d.data.name;
        });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.node').transition().duration(duration)
        .attr('r', circleRadius)
        .style("fill", function (d) {
            return d._children ? d.c : "#efefef";
        })
        .style("fill-opacity", function (d) {
            return d._children ? 0.8 : 1;
        })
        .style("stroke", function(d){
            return d.c;
        })
        .attr('cursor', 'pointer');

    nodeUpdate.select('text').transition().duration(duration)
        .attr("dy", function (d) {
            return d.children && !d._children? "-1em" : ".35em";
        })
        .attr("x", function (d) {
            return d.children ? 0 : 14;
        })
        .attr("text-anchor", function (d) {
            return d.children ? "middle" : "start";
        });
        


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = g.selectAll('path.link')
        .data(links, function (d) {
            return d.id;
        });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .style("stroke", function(d){
            return d.c;
        })
        .attr('d', function (d) {
            var o = {
                x: source.x0,
                y: source.y0
            }
            return diagonal(o, o)
        });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function (d) {
            return diagonal(d, d.parent)
        });

    // Remove any exiting links
    var linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
            var o = {
                x: source.x,
                y: source.y
            }
            return diagonal(o, o)
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {

        path = `M ${s.y} ${s.x}
          C ${(s.y + d.y) / 2} ${s.x},
            ${(s.y + d.y) / 2} ${d.x},
            ${d.y} ${d.x}`

        return path
    }
}

function centerNode(source) {
    
    var x = -source.y,
        y = -source.x;
    var t = d3.zoomTransform(d3.select("svg").node());
    var scale = t.k;
    var translate = [x * scale + width * 0.45, y * scale + height * 0.45];

    svg.transition()
        .duration(duration)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

function zoomed() {
    g.attr("transform", d3.event.transform);
}

function dragged(d) {
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}

// Toggle children on click.
function click(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);
    centerNode(d);
}