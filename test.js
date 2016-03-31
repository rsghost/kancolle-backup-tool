'use strict';
var kancolle = require('./' + (process.argv[2] || 'kancolle.json'));
var test = require('./' + (process.argv[3] || 'kancolle.db.json'));

const swap = (keyPool, value) => {
  let tmp = swap;
  keyPool.forEach((key, i) => {
    if (!tmp[key]) {
      tmp[key] = {};
    };

    if (++i === keyPool.length) {
      tmp[key] = value;
    } else {
      tmp = tmp[key];
    };
  });
};

const chk = (keyPool, value) => {
  let tmp = swap;
  keyPool.forEach((key, i) => {
    if (!tmp[key]) {
      console.log('key not found');
      console.log(tmp);
    };

    if (++i === keyPool.length) {
      if (tmp[key].sha !== value.sha) {
        console.log('value key not match');
        console.log(tmp[key]);
        console.log(value);
      };
    } else {
      tmp = tmp[key];
    };
  });
};

kancolle.ship.forEach((i) => {
  i.version.forEach((j) => {
    swap(['ship', i.name, 'image', j.sha], {
      path: j.path,
      size: j.size,
      md5: j.md5,
      sha: j.sha,
      updated_at: j.updated_at
    });
  });

  i.voice.forEach((j) => {
    j.version.forEach((k) => {
      swap(['ship', i.name, 'voice', j.name, k.sha], {
        path: k.path,
        size: k.size,
        md5: k.md5,
        sha: k.sha,
        updated_at: k.updated_at
      });
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
    });
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
    });
  });
});

test.ship.forEach((i) => {
  i.version.forEach((j) => {
    chk(['ship', i.name, 'image', j.sha], {
      path: j.path,
      size: j.size,
      md5: j.md5,
      sha: j.sha,
      updated_at: j.updated_at
    });
  });

  i.voice.forEach((j) => {
    j.version.forEach((k) => {
      chk(['ship', i.name, 'voice', j.name, k.sha], {
        path: k.path,
        size: k.size,
        md5: k.md5,
        sha: k.sha,
        updated_at: k.updated_at
      });
    });
  });
});

test.core.forEach((i) => {
  i.version.forEach((j) => {
    chk(['core', i.name, j.sha], {
      path: j.path,
      size: j.size,
      md5: j.md5,
      sha: j.sha,
      updated_at: j.updated_at
    });
  });
});

test.bgm.forEach((i) => {
  i.version.forEach((j) => {
    chk(['bgm', i.name, j.sha], {
      path: j.path,
      size: j.size,
      md5: j.md5,
      sha: j.sha,
      updated_at: j.updated_at
    });
  });
});
