'use strict';
const fs = require('fs-extra');

var kancolle = require('./' + (process.argv[3] || 'kancolle.json'));
var dbAddr = process.argv[4] || 'kancolle.db.json';
var srcAddr = process.argv[2] ? process.argv[2].replace(/\/\/*\//g, '/') : 'resource';
var locked = 0;

const copy = (addr, path, time, callback) => {
  fs.copy(addr, path, (err) => {
    if (err) throw err;
    fs.utimes(path, time, time, (err) => {
      if (err) throw err;
      callback();
    });
  });
};

const ending = () => {
  fs.writeFile(dbAddr, JSON.stringify(kancolle), (err) => {
    if (err) throw err;
    console.log('done');
    console.log('locked: ' + locked);
  });
};

kancolle.ship.forEach((ship, ship_num) => {
  ship.version.forEach((i, ship_id) => {
    locked++;
    let name = i.sha.slice(0, 7) + i.updated_at + '.swf',
        path = srcAddr + '/ship/' + ship.name + '/image';

    if (i.path[0] !== path) {
      copy(i.path[0] + '/' + i.path[1], path + '/' + name, i.updated_at, () => {
        kancolle.ship[ship_num].version[ship_id].path = [path, name];
        locked--;
        if (locked === 0) {
          ending();
        };
      });
    };
  });

  ship.voice.forEach((voice, voice_id) => {
    voice.version.forEach((i, voice_num) => {
      locked++;
      let name = i.sha.slice(0, 7) + i.updated_at + '.mp3',
          path = srcAddr + '/ship/' + ship.name + '/voice/' + voice.name;

      if (i.path[0] !== path) {
        copy(i.path[0] + '/' + i.path[1], path + '/' + name, i.updated_at, () => {
          kancolle.ship[ship_num].voice[voice_id].version[voice_num].path = [path, name];
          locked--;
          if (locked === 0) {
            ending();
          };
        });
      };
    });
  });
});

kancolle.bgm.forEach((bgm, bgm_num) => {
  bgm.version.forEach((i, bgm_id) => {
    locked++;
    let name = i.sha.slice(0, 7) + i.updated_at + '.swf',
        path = srcAddr + '/bgm/' + bgm.name;

    if (i.path[0] !== path) {
      copy(i.path[0] + '/' + i.path[1], path + '/' + name, i.updated_at, () => {
        kancolle.bgm[bgm_num].version[bgm_id].path = [path, name];
        locked--;
        if (locked === 0) {
          ending();
        };
      });
    };
  });
});

kancolle.core.forEach((core, core_num) => {
  core.version.forEach((i, core_id) => {
    locked++;
    let name = i.sha.slice(0, 7) + i.updated_at + '.swf',
        path = srcAddr + '/core/' + core.name;

    if (i.path[0] !== path) {
      copy(i.path[0] + '/' + i.path[1], path + '/' + name, i.updated_at, () => {
        kancolle.core[core_num].version[core_id].path = [path, name];
        locked--;
        if (locked === 0) {
          ending();
        };
      });
    };
  });
});
