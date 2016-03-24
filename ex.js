'use strict';
const fs = require('fs');

fs.readFile(process.argv[2] || 'source', function (err, data) {
  if (err) throw err;
  var kancolle = JSON.parse(data);

  var shipKey = '',
      nameList = '';

  var idPool = {};
  var shipGraph = kancolle.api_data.api_mst_shipgraph;

  for (let i = 0; i < shipGraph.length; i++) {
    shipKey += shipGraph[i].api_filename + '\n';
    idPool[shipGraph[i].api_id] = shipGraph[i].api_filename;
  };

  var shipNameList = kancolle.api_data.api_mst_ship;
  for (let i = 0; i < shipNameList.length; i++) {
    nameList += idPool[shipNameList[i].api_id] + ',' + shipNameList[i].api_id + ',' + shipNameList[i].api_name + ',' + shipNameList[i].api_yomi + '\n';
  };

  fs.writeFile(process.argv[3] || 'list/apikey', shipKey, function (err) {
    if (err) throw err;
    fs.writeFile(process.argv[4] || 'list/shipname', nameList, function (err) {
      if (err) throw err;
      console.log('done');
    });
  });
});
