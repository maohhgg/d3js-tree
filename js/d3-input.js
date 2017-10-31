d3.input = function (d,elm) {
    elmd = elm.getBBox();
    // create the div element that will hold the context menu
    d3.selectAll('.receiver').data([1])
        .enter()
        .append('div')
        .attr('contenteditable',true)
        .attr('class', 'receiver');

    var svgtransfom = d3.zoomTransform(d3.select("svg").node())

    d3.input.dispatcher = d3.dispatch('focus');



    // display context menu
    var receiver = d3.select('.receiver')
        .style('min-width',(elmd.width * svgtransfom.k + 5)+ 'px')
        .html(d.data.name)
        .style('display', 'block');
    console.log(receiver);

    if(svgtransfom.k != 1){
        receiver
        .style('width',((elmd.width + 4)*svgtransfom.k)+'px')
        .style('font-size',(14 * svgtransfom.k)+'px');     
    }

    if(d.children == null){
        receiver.style('left', ((d.y - elmd.y + 2)* svgtransfom.k + svgtransfom.x ) + 'px')
        .style('top', ((d.x - elmd.x + 2)* svgtransfom.k + svgtransfom.y ) + 'px');
    } else {
        receiver.style('left', (((d.y + elmd.x -2)* svgtransfom.k + svgtransfom.x) ) + 'px')
        .style('top', (((d.x + elmd.y - 2)* svgtransfom.k + svgtransfom.y)) + 'px');
    }

    var re = document.getElementsByClassName("receiver")[0].focus();
    receiver.attr('class',"receiver input")
        .on("blur",function(){
            d.data.name = this.innerHTML;
            this.className = "receiver";
            update(d);
        });

    d3.event.preventDefault();
    d3.event.stopPropagation();
};