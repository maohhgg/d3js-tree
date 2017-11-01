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
        .style('min-width',(elmd.width * svgtransfom.k)+ 'px')
        .html(d.data.name)
        .style('display', 'block');
    console.log(receiver);

    if(svgtransfom.k != 1){
        receiver
        .style('width',((elmd.width)*svgtransfom.k)+'px')
        .style('font-size',(17 * svgtransfom.k)+'px');     
    }
    console.log(d);
    receiver.style('left', ((d.y - 1)* svgtransfom.k + svgtransfom.x ) + 'px')
    .style('top', ((d.x - elmd.x - 35)* svgtransfom.k + svgtransfom.y ) + 'px');



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