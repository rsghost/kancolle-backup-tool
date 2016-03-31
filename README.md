# kancolle backup tools
backup tools for kantai collection


## make ship apikey list
`node repl.js [api_start2 res]`
* `api_start2 res` /kcsapi/api\_start2 response

## backup
`bash ship.sh`

`bash voice.sh` **2016/3/11 after update is NOT supported**

`bash bgm.sh`

`bash core.sh`

## make diff tree json
`node chk.js [backup dir]`

## export backup data
`node exp.js [kancolle.json] [export address]`

## testing
`node test.js [kancolle.json] [kancolle.db.json]`
