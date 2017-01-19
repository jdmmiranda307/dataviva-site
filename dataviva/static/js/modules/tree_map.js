var tree_map = document.getElementById('tree_map')
    lang = document.documentElement.lang,
    squares = tree_map.getAttribute('squares'),
    group = tree_map.getAttribute('group'),
    depths = tree_map.getAttribute('depths').split('+'),
    dataset = tree_map.getAttribute('dataset'),
    filters = tree_map.getAttribute('filters'),
    urls = ['http://api.staging.dataviva.info/metadata/' + squares,
            'http://api.staging.dataviva.info/metadata/' + (group == 'section' ? 'product_section' : group),
            'http://api.staging.dataviva.info/' + dataset + '/year/' + squares + '/' + group + '?' + filters
    ];


dictionary['state'] = (lang == "en") ? "State" : "Estado"
dictionary['municipality'] = (lang == "en") ? "Municipality" : "Municipio"

var buildData = function(responseApi, squaresMetadata, groupMetadata) {

    var getAttrByName = function(item, attr) {
        var index = headers.indexOf(attr);
        return item[index];
    }

    var data = [];
    var headers = responseApi.headers;

    responseApi.data.forEach(function(item) {
        var dataItem = {};

        headers.forEach(function(header){
            dataItem[header] = getAttrByName(item, header);
        });

        data.push(dataItem);
    });

    for (var i = data.length - 1; i >= 0; i--) {
        try {
            data[i][squares] = squaresMetadata[data[i][squares]]['name_' + lang];
            if (group == 'section')
                data[i]['icon'] = '/static/img/icons/' + group + '/section_' + data[i][group] + '.png';
            data[i][group] = groupMetadata[data[i][group]]['name_' + lang];
        } catch (e) {
            data.splice(i, 1);
        }
    }

    return data;
}

var loadViz = function(data) {

    var depthSelectorHelper = function(array, element) {
        var newArray = array.slice(0);
        newArray.splice(newArray.indexOf(element), 1);
        newArray.splice(0, 0, element);
        newArray.forEach(function(item, index){
            newArray[index] = {[dictionary[item]] : item} 
        })
        return newArray;
    };

    var viz = d3plus.viz()
        .container('#tree_map')
        .data(data)
        .type('tree_map')
        .id(depths)
        .size('value')
        .depth(depths.length-1)
        .color(group)
        .labels({'align': 'left', 'valign': 'top'})
        .background('transparent')
        .ui([
            {
                'method' : 'size',
                'label': dictionary['value'],
                'value' : [{[dictionary['value']]: 'value'}, {'KG': 'kg'}]
            },
            {
                'method': function(value) {
                    viz.depth(depths.indexOf(value))
                        .draw();
                },
                'default': depths.indexOf(squares),
                'type': 'drop',
                'label': dictionary['depth'],
                'value': depthSelectorHelper(depths, squares)
            }
        ])
        .format({
            'text': function(text) {
                return text == 'value' || text == 'share' ? dictionary[text] : text;
            }
        })
        .icon({'value': 'icon', 'style': 'knockout'})
        .legend({'size': 60, 'filters': true, 'order': {'sort': 'desc', 'value': 'size'})
        .time('year')
        .draw();
};

var loading = dataviva.ui.loading('.loading').text(dictionary['loading']);

$(document).ready(function() {
    ajaxQueue(
        urls, 
        function(responses){
            var squaresMetadata = responses[0],
                groupMetadata = responses[1],
                data = buildData(responses[2], squaresMetadata, groupMetadata);

            loading.hide();
            loadViz(data);
        })
});