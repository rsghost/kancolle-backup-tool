#!/bin/bash
time=$(date "+%m%d")
header="--header=User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36"
filename="../../../list/apikey"
backupdir="backup/"
dir=$backupdir"ship/"
addr=$dir"ship"$time

if [ ! -d $backupdir ]; then
  mkdir $backupdir
fi

if [ ! -d $dir ]; then
  mkdir $dir
fi

if [ ! -d $addr ]; then
  mkdir $addr
fi

cd $addr

exec < $filename
while read Line
do
  echo "on " $Line
  wget "${header}" http://125.6.189.135/kcs/resources/swf/ships/${Line}.swf
  if [ "$?" -ne "0" ]; then
    echo ${Line}.swf" ERROR!"
    rm ${Line}.swf
  fi
  sleep 0.1
done
