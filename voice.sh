#!/bin/bash
time=$(date "+%m%d")
header="--header=User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36"
filename="../../../list/apikey"
backupdir="backup/"
dir=$backupdir"voice/"
addr=$dir"voice"$time
nu=70

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
  mkdir kc$Line
  for ((i=1; i<=$nu; i=i+1))
  do
    wget "${header}" http://125.6.189.135/kcs/sound/kc$Line/$i.mp3 -O kc$Line/$i.mp3
    if [ "$?" -ne "0" ]; then
      echo $Line"/"$i" ERROR!"
      rm kc$Line"/"$i.mp3
    fi
    sleep 0.5
  done
done
