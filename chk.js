'use strict';
const crypto = require('crypto'),
      fs = require('fs'),
      walk = require('walk');

const hash = function (path, callback) {
  let stream = fs.createReadStream(path),
      md5sum = crypto.createHash('md5'),
      shasum = crypto.createHash('sha512');

  stream.on('data', (chunk) => {
    md5sum.update(chunk, 'utf8');
    shasum.update(chunk, 'utf8');
  });

  stream.on('end', () => {
    callback({
      md5: md5sum.digest('hex'),
      sha: shasum.digest('hex'),
    });
  });
};

const pickup = function (stats) {
  if (stats.name.match(/\w*\.swf/)) {
    if (stats.path[0].match(/bgm\d{4}/) || stats.path[0].match(/sound_/)) {
      // bgm
      let name = stats.name;

      if (!swap.bgm[name]) {
        swap.bgm[name] = {};
        swap.bgm[name][stats.sha] = stats;
      } else if (!swap.bgm[name][stats.sha]) {
        swap.bgm[name][stats.sha] = stats;
      };
    } else if (stats.path[0].match(/core\d{4}/) || stats.path[0].match(/\/GAMESWF\//)) {
      // core
      let name = stats.name;

      if (!swap.core[name]) {
        swap.core[name] = {};
        swap.core[name][stats.sha] = stats;
      } else if (!swap.core[name][stats.sha]) {
        swap.core[name][stats.sha] = stats;
      };
    } else if (stats.path[0].match(/swf\d{4}/) || stats.path[0].match(/\/SWF\//)) {
      let name;
      if (stats.name.match(/\/\d{1,3}\.swf/)) {
        // old ship
        if (stats.path[0].match(/\/SWF_(\d{8})/)[1] < 20140131 && mistPool[stats.name.match(/^\d*/)[0]]) {
          name = mistPool[stats.name.match(/^\d*/)[0]].ship_eng_name;
        } else if (specialPool[stats.name.match(/^\d*/)[0]]) {
          name = specialPool[stats.name.match(/^\d*/)[0]].ship_eng_name;
        } else {
          name = idPool[stats.name.match(/^\d*/)[0]].api_key + '.swf';
        };
      } else {
        // ship
        name = stats.name;
      };

      if (!swap.ship[name]) {
        swap.ship[name] = { ship: {}, voice: {} };
        swap.ship[name].ship[stats.sha] = stats;
      } else if (!swap.ship[name].ship[stats.sha]) {
        swap.ship[name].ship[stats.sha] = stats;
      };
    };
  } else if (stats.name.match(/\w*\.mp3/)) {
    let name;
    if (stats.path[0].match(/\/MP3\//)) {
      // old voice
      let id = stats.path[0].match(/MP3_\d{8}\/(\d{1,4})/)[1];
      if (stats.path[0].match(/\/MP3_(\d{8})/)[1] < 20140131 && mistPool[id]) {
        name = mistPool[id].ship_eng_name;
      } else if (specialPool[id]) {
        name = specialPool[id].ship_eng_name;
      } else {
        name = idPool[id].api_key + '.swf';
      };
    } else {
      // voice
      name = stats.path[0].match(/kc[a-z]{12}/)[0].slice(2);
    };


    if (!swap.ship[name]) {
      swap.ship[name] = { ship: {}, voice: {} };
      swap.ship[name].voice[stats.name] = {};
      swap.ship[name].voice[stats.name][stats.sha] = stats;
    } else if (!swap.ship[name].voice[stats.name]) {
      swap.ship[name].voice[stats.name] = {};
      swap.ship[name].voice[stats.name][stats.sha] = stats;
    } else if (!swap.ship[name].voice[stats.name][stats.sha]) {
      swap.ship[name].voice[stats.name][stats.sha] = stats;
    };
  };
};

const backupAddr = process.argv[2] || 'backup';
const dbAddr = process.argv[3] || 'kancolle.json';

var kancolle = {},
    swap = { ship: {}, core: {}, bgm: {} },
    keyPool = {},
    idPool = {},
    mistPool = {},
    specialPool = {},
    totalSize = 0;
var walker;

fs.readFile('list/shipname', (err, nameList) => {
  if (err) throw err;
  fs.readFile('list/mist', (err, mistList) => {
    if (err) throw err;
    fs.readFile('list/special', (err, specialList) => {
      if (err) throw err;

      specialList = specialList.toString();
      specialList.split('\n').forEach((name) => {
        name = name.split(',');
        if (name[0]) {
          keyPool[name[0]] = {
            ship_name: [name[2] || '', name[3] || ''],
            ship_id: name[1] || ''
          };

          specialPool[name[1]] = {
            ship_eng_name: name[0],
            ship_name: [name[2] || '', name[3] || ''],
            ship_id: name[1]
          };
        };
      });

      mistList = mistList.toString();
      mistList.split('\n').forEach((name) => {
        name = name.split(',');
        if (name[0]) {
          keyPool[name[0]] = {
            ship_name: [name[2] || '', name[3] || ''],
            ship_id: name[1] || ''
          };

          mistPool[name[1]] = {
            ship_eng_name: name[0],
            ship_name: [name[2] || '', name[3] || ''],
            ship_id: name[1]
          };
        };
      });

      nameList = nameList.toString();
      nameList.split('\n').forEach((name) => {
        name = name.split(',');
        if (name[0]) {
          keyPool[name[0]] = {
            ship_name: [name[2] || '', name[3] || ''],
            ship_id: name[1] || ''
          };

          idPool[name[1]] = {
            api_key: name[0]
          };
        };
      });

      fs.readFile(dbAddr, (err, data) => {
        let kan = {};
        try {
          kan = JSON.parse(data);
        } catch (e) {
          console.log('file not found');
        };

        kancolle.ship = kan.ship || [];
        kancolle.core = kan.core || [];
        kancolle.bgm = kan.bgm || [];

        kancolle.ship.forEach((i) => {
          swap.ship[i.name] = { ship: {}, voice: {} };
          i.version.forEach((j) => {
            swap.ship[i.name].ship[j.sha] = {
              path: j.path,
              size: j.size,
              md5: j.md5,
              sha: j.sha,
              updated_at: j.updated_at
            };
          });

          i.voice.forEach((j) => {
            swap.ship[i.name].voice[j.name] = {};

            j.version.forEach((k) => {
              swap.ship[i.name].voice[j.name][k.sha] = {
                path: k.path,
                size: k.size,
                md5: k.md5,
                sha: k.sha,
                updated_at: j.updated_at
              };
            });
          });
        });

        kancolle.core.forEach((i) => {
          swap.core[i.name] = {};
          i.version.forEach((j) => {
            swap.core[i.name][j.sha] = {
              path: j.path,
              size: j.size,
              md5: j.md5,
              sha: j.sha,
              updated_at: j.updated_at
            };
          });
        });

        kancolle.bgm.forEach((i) => {
          swap.bgm[i.name] = {};
          i.version.forEach((j) => {
            swap.bgm[i.name][j.sha] = {
              path: j.path,
              size: j.size,
              md5: j.md5,
              sha: j.sha,
              updated_at: j.updated_at
            };
          });
        });

        walker = walk.walk(backupAddr);

        walker.on('file', (root, fileStats, next) => {
          let path = root + '/' + fileStats.name;
          if (fileStats.name.match(/\w*\.\w{3}/)) {
            console.log(path);
            hash(path, (hashData) => {
              pickup({
                path: [root.replace(/\/\/*\//g, '/'), fileStats.name],
                name: fileStats.name,
                size: fileStats.size,
                md5: hashData.md5,
                sha: hashData.sha,
                updated_at: fileStats.mtime.getTime()
              });
            });
          };
          next();
        });

        walker.on('end', () => {
          kancolle = { ship: [], core: [], bgm: [] };
          for (let i in swap.ship) {
            let ship = {
              name: i,
              api_key: i.match('[a-z]{12}') ? i.match('[a-z]{12}')[0] : null,
              version: [],
              voice: []
            };

            ship.ship_name = keyPool[ship.api_key] ? keyPool[ship.api_key].ship_name : [null, null];
            ship.ship_id = keyPool[ship.api_key] ? keyPool[ship.api_key].ship_id : null;

            for (let j in swap.ship[i].ship) {
              ship.version.push(swap.ship[i].ship[j]);
              totalSize += swap.ship[i].ship[j].size;
            };

            for (let j in swap.ship[i].voice) {
              let voice = {
                name: j,
                version: []
              };

              for (let k in swap.ship[i].voice[j]) {
                voice.version.push(swap.ship[i].voice[j][k]);
                totalSize += swap.ship[i].voice[j][k].size;
              };

              ship.voice.push(voice);
            };

            kancolle.ship.push(ship);
          };

          for (let i in swap.core) {
            let core = {
              name: i,
              version: []
            };

            for (let j in swap.core[i]) {
              core.version.push(swap.core[i][j]);
              totalSize += swap.core[i][j].size;
            };

            kancolle.core.push(core);
          };

          for (let i in swap.bgm) {
            let bgm = {
              name: i,
              version: []
            };

            for (let j in swap.bgm[i]) {
              bgm.version.push(swap.bgm[i][j]);
              totalSize += swap.bgm[i][j].size;
            };

            kancolle.bgm.push(bgm);
          };

          fs.writeFile(dbAddr, JSON.stringify(kancolle), (err) => {
            if (err) throw err;
            console.log('done');
            console.log('total: ' + totalSize / 1048576 + ' mb');
          });
        });
      });
    });
  });
});
