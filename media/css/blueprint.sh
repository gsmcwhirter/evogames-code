#!/bin/bash

mydir=`dirname $0`
if cd $mydir
then
    echo "Generating Blueprint..."
    lessc evogames.less evogames.css
    ruby ../../../blueprint-1.0/lib/compress.rb -p evogames --settings_file=blueprint.settings.yml -o .
else
    echo "Blueprint failed."
fi
