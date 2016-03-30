'use strict';
const crypto = require('crypto'),
      fs = require('fs'),
      walk = require('walk');

const backupAddr = process.argv[2] || 'backup';
const dbAddr = process.argv[3] || 'kancolle.json';

var kancolle = {};

var status = {
  locked: 0,
  end: false
};

var map = {
  key: {},
  id: {},
  mist: {},
  special: {}
};

var num = {
  all: 0,
  origin: 0,
  input: 0,
  output: 0,
  size: 0
};

const hash = (path, callback) => {
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

const pickup = (stats, callback) => {
  let addInputNum = () => {
    num.input++;
  };

  let statsInfo = {
    path: stats.path,
    size: stats.size,
    md5: stats.md5,
    sha: stats.sha,
    updated_at: stats.updated_at
  };

  if (stats.name.match(/\.swf$/)) {
    if (stats.path[0].match(/\/bgm\//) || stats.name.match(/sound_|bgset/)) {
      // bgm
      swap(['bgm', stats.name, stats.sha], statsInfo, addInputNum);
    } else if (stats.path[0].match(/\/(core|GAMESWF)\//)) {
      // core
      swap(['core', stats.name, stats.sha], statsInfo, addInputNum);
    } else if (stats.path[0].match(/\/(ship|swf|SWF)\//)) {
      let shipname;
      if (stats.path[0].match(/\/SWF\//)) {
        // old ship
        let id = stats.name.match(/^\d*/)[0];
        if (stats.path[0].match(/SWF_(\d{8})/)[1] < 20140131 && map.mist[id]) {
          shipname = map.mist[id].ship_eng_name;
        } else if (map.special[id]) {
          shipname = map.special[id].ship_eng_name;
        } else {
          shipname = map.id[id].api_key + '.swf';
        };
      } else {
        // ship
        shipname = stats.name;
      };

      swap(['ship', shipname, 'image', stats.sha], statsInfo, addInputNum);
    };
  } else if (stats.name.match(/\.mp3$/)) {
    let shipname;
    if (stats.path[0].match(/\/MP3\//)) {
      // old voice
      let id = stats.path[0].match(/MP3_\d{8}\/(\d*)/)[1];
      if (stats.path[0].match(/MP3_(\d{8})/)[1] < 20140131 && map.mist[id]) {
        shipname = map.mist[id].ship_eng_name;
      } else if (map.special[id]) {
        shipname = map.special[id].ship_eng_name;
      } else {
        shipname = map.id[id].api_key + '.swf';
      };
    } else {
      // voice
      shipname = stats.path[0].match(/kc([a-z]{12})/)[1] + '.swf';
    };

    swap(['ship', shipname, 'voice', stats.name, stats.sha], statsInfo, addInputNum);
  };

  callback();
};

const swap = (keyPool, value, callback) => {
  let tmp = swap;
  keyPool.forEach((key, i) => {
    if (!tmp[key]) {
      tmp[key] = {};
    };

    if (++i === keyPool.length) {
      if (tmp[key].sha) {
        if (tmp[key].md5 !== value.md5) {
          throw new Error('collisions found');
        } else if (tmp[key].updated_at > value.updated_at) {
          tmp[key] = value;
        };
      } else {
        tmp[key] = value;
      };
      callback();
    } else {
      tmp = tmp[key];
    };
  });
};

const ending = () => {
  for (let i in swap.ship) {
    let ship = {
      name: i,
      api_key: i.match(/[a-z]{12}/) ? i.match(/[a-z]{12}/)[0] : null,
      version: [],
      voice: []
    };

    let id = ship.api_key || ship.name;
    ship.ship_name = map.key[id] ? map.key[id].ship_name : [null, null];
    ship.ship_id = map.key[id] ? map.key[id].ship_id : null;

    for (let j in swap.ship[i].image) {
      ship.version.push(swap.ship[i].image[j]);
      num.size += swap.ship[i].image[j].size;
      num.output++;
    };

    for (let j in swap.ship[i].voice) {
      let voice = {
        name: j,
        version: []
      };

      for (let k in swap.ship[i].voice[j]) {
        voice.version.push(swap.ship[i].voice[j][k]);
        num.size+= swap.ship[i].voice[j][k].size;
        num.output++;
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
      num.size += swap.core[i][j].size;
      num.output++;
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
      num.size += swap.bgm[i][j].size;
      num.output++;
    };

    kancolle.bgm.push(bgm);
  };

  fs.writeFile(dbAddr, JSON.stringify(kancolle), (err) => {
    if (err) throw err;
    console.log('done');
    console.log('total file: ' + num.all);
    console.log('total size: ' + num.size);
    console.log('origin: ' + num.origin);
    console.log('input: ' + num.input);
    console.log('output: ' + num.output);
  });
};

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
          map.key[name[0]] = {
            ship_name: [name[2] || '', name[3] || ''],
            ship_id: name[1] || ''
          };

          map.special[name[1]] = {
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
          map.key[name[0]] = {
            ship_name: [name[2] || '', name[3] || ''],
            ship_id: name[1] || ''
          };

          map.mist[name[1]] = {
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
          map.key[name[0]] = {
            ship_name: [name[2] || '', name[3] || ''],
            ship_id: name[1] || ''
          };

          map.id[name[1]] = {
            api_key: name[0]
          };
        };
      });

      let kan = {};
      try {
        kan = require('./' + dbAddr);
      } catch (e) {
        console.log('origin db not found');
      };

      kancolle.ship = kan.ship || [];
      kancolle.core = kan.core || [];
      kancolle.bgm = kan.bgm || [];

      let addOriginNum = () => {
        num.origin++;
      };

      kancolle.ship.forEach((i) => {
        i.version.forEach((j) => {
          swap(['ship', i.name, 'image', j.sha], {
            path: j.path,
            size: j.size,
            md5: j.md5,
            sha: j.sha,
            updated_at: j.updated_at
          }, addOriginNum);
        });

        i.voice.forEach((j) => {
          j.version.forEach((k) => {
            swap(['ship', i.name, 'voice', j.name, k.sha], {
              path: k.path,
              size: k.size,
              md5: k.md5,
              sha: k.sha,
              updated_at: k.updated_at
            }, addOriginNum);
          });
        });
      });

      kancolle.core.forEach((i) => {
        i.version.forEach((j) => {
          swap(['core', i.name, j.sha], {
            path: j.path,
            size: j.size,
            md5: j.md5,
            sha: j.sha,
            updated_at: j.updated_at
          }, addOriginNum);
        });
      });

      kancolle.bgm.forEach((i) => {
        i.version.forEach((j) => {
          swap(['bgm', i.name, j.sha], {
            path: j.path,
            size: j.size,
            md5: j.md5,
            sha: j.sha,
            updated_at: j.updated_at
          }, addOriginNum);
        });
      });

      kancolle = { ship: [], core: [], bgm: [] };

      let walker = walk.walk(backupAddr);

      walker.on('file', (root, fileStats, next) => {
        if (fileStats.name.match(/^.*\.(swf|mp3)/)) {
          num.all++;
          status.locked++;
          root = root.replace(/\/\/*\//g, '/');
          let path = root + '/' + fileStats.name;
          console.log('locked: ' + status.locked + ', path: ' + path);

          hash(path, (hashData) => {
            pickup({
              path: [root, fileStats.name],
              name: fileStats.name.match(/^.*\.(swf|mp3)/)[0],
              size: fileStats.size,
              md5: hashData.md5,
              sha: hashData.sha,
              updated_at: fileStats.mtime.getTime()
            }, () => {
              status.locked--;
              if (status.end && status.locked === 0) {
                ending();
              };
            });
          });
        } else {
          console.log('data not matched: ' + root + '/' + fileStats.name);
        };
        next();
      });

      walker.on('end', () => {
        status.end = true;
      });
    });
  });
});
