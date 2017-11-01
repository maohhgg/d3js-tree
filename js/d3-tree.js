var i = 0,
    duration = 750,
    treemap,
    root,
    treeData,
    LeafHeight = 35,
    DepthWidth = 350,
    circleRadius = 10,
    maxDepthLength = 0,
    maxLeafLength = 0,
    zoomLevel = 8,
    lineHeigth = 8;

// Set the dimensions and margins of the diagram
var width = window.screen.availWidth,
    height = window.screen.availHeight;

var color = d3.scaleOrdinal(d3.schemeCategory20);

var zoom = d3.zoom()
    .scaleExtent([1 / zoomLevel, zoomLevel])
    .on('zoom', zoomed);

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height)
    .call(zoom);

var g = svg.append('g');

var uri = 'https://goodday.ddns.net/Leaf/public/tree/api/5466ee572bcbc75830d044e66ab429bc';
// var uri = 'flare.json'
d3.json(uri, function (error, flare) {
    if (error) throw error;
    treeData = flare;

    root = d3.hierarchy(treeData, function (d) {
        return d.children;
    });
    root.x0 = height / 2;
    root.y0 = 0;

    var n = 0;
    root.c = color(n);
    root.data.children = null;
    root.data.node = 0;

    root.children.forEach(function (element) {
        n++;
        collapse(element, color(n));
    }, this);
    update(root);
    centerNode(root);
});

function visit(parent, vistFn, childrenFn) {
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

function collapse(d, c) {
    d.c = c;
    if (d.children) {
        d._children = d.children
        d.children.forEach(function (element) {
            collapse(element, c);
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
    conHeight = conHeight < height ? height - 200 : conHeight;
    treemap = d3.tree().size([conHeight, maxDepthLength * DepthWidth])



    var treeData = treemap(root);

    var nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);


    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = g.selectAll('g.node')
        .data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', function (d) {
            return 'translate(' + source.y0 + ',' + (source.x0 - lineHeigth / 2) + ')';
        })
        .on('click', click)
        .on('contextmenu', d3.contextMenu(menu));

    var text = nodeEnter.append('text')
        .attr('y', -lineHeigth)
        .attr('x', function (d) {
            return d.data.name.length * 0.25;
        })
        .attr('id', function (d) {
            return 'text' + d.id;
        })
        .text(function (d) {
            return d.data.name;
        });

    nodeEnter.append('rect')
        .attr('class', 'node')
        .attr('id', function (d) {
            return 'rect' + d.id;
        })
        .attr('width', function (d) {
            return nodeEnter.select('#text' + d.id).node().getBBox().width + (lineHeigth * 2);
        })
        .attr('x', function (d) {
            return -(lineHeigth / 2);
        })
        .attr('rx', function (d) {
            return lineHeigth / 2;
        })
        .attr('ry', function (d) {
            return lineHeigth / 2;
        })
        .attr('height', lineHeigth)
        .style('fill', function (d) {
            return d.c;
        });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr('transform', function (d) {
            return 'translate(' + d.y + ',' + (d.x - lineHeigth / 2) + ')';
        });


    nodeUpdate.select('text').transition().duration(duration)
        .text(function (d) {
            return d.data.name;
        });

    nodeUpdate.select('rect').transition().duration(duration)
        .attr('width', function (d) {
            return nodeUpdate.select('#text' + d.id).node().getBBox().width + (lineHeigth * 2);
        })


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', function (d) {
            return 'translate(' + source.y + ',' + (source.x - lineHeigth / 2) + ')';
        })
        .remove();

    nodeExit.select('rect')
        .attr('width', 0);
    //     .attr('fill-opacity', 0);

    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = g.selectAll('path.link')
        .data(links, function (d) {
            return d.id;
        });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .style('stroke', function (d) {
            return d.c;
        })
        .attr('d', function (d) {
            var o = {
                x: source.x0,
                y: source.y0 + d3.select('#text' + source.id).node().getBBox().width
            }
            return diagonal(o, o)
        });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function (d) {
            var o = {
                x: d.parent.x,
                y: d.parent.y + d3.select('#text' + d.parent.id).node().getBBox().width
            }
            return diagonal(d, o)
        });

    // Remove any exiting links
    var linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
            var o = {
                x: source.x,
                y: source.y + d3.select('#text' + source.id).node().getBBox().width
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
    var t = d3.zoomTransform(d3.select('svg').node());
    var scale = t.k;
    var translate = [x * scale + width * 0.45, y * scale + height * 0.45];

    svg.transition()
        .duration(duration)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

function zoomed() {
    g.attr('transform', d3.event.transform);
}

function dragged(d) {
    d3.select(this).attr('cx', d.x = d3.event.x).attr('cy', d.y = d3.event.y);
}

// Toggle children on click.
function toggleNode(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
}

function click(d) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    toggleNode(d);
    centerNode(d);
    if (d.data.node == 1) {
        var p = ajax('https://goodday.ddns.net/Leaf/public/tree/api/node/' + d.data.id);

        // loading();  加载动画

        p.then(function (text) {

            d.data.node = 0;
            for(var i=0;i<text.length;i++){
                text[i] = d3.hierarchy(text[i]);
                text[i].c = d.c;
                text[i].depth = d.depth + 1;
                text[i].parent = d;
            }
            d.children = text;
            console.log(d);
            update(d);
            // loadext(); 停止加载动画
        }).catch(function (status) {

        });
    } else {
        update(d);
    }

}



function ajax(url) {
    return new Promise(function (resolve, reject) {
        d3.json(url, function (error, json) {
            if (error)
                reject(error);
            else
                resolve(json);
        });
    });
}


var menu = [{
        title: 'New Node',
        action: function (elm, d, i) {
            if (d._children && d._children != null) {
                toggleNode(d);
            }
            var node = d3.hierarchy({
                'name': 'new'
            });
            node.parent = d;
            node.depth = (d.depth + 1);
            node.c = (d.depth == 0 ? color(d.children.length + 1) : d.c);
            // node.c = d.c;

            if (d.children == null) {
                d.children = new Array(node);
            } else {
                d.children.splice(d.children.length, 0, node);
            }

            d3.input(node, d3.select('#text' + d.id).node());
            update(d);
        }
    },
    {
        title: 'edit',
        action: function (elm, d, i) {
            d3.input(d, elm);
            update(d);
        }
    },
    {
        title: 'Remove Node',
        action: function (elm, d, i) {
            if (d.parent) {
                // find child and remove it
                for (var n = 0; n < d.parent.children.length; n++) {
                    if (d.parent.children[n].data.name === d.data.name) {
                        d.parent.children.splice(n, 1);
                        break;
                    }
                }
                if (d.parent.children.length == 0) {
                    d.parent.children = null;
                }
            }
            update(d);
        }
    }
];