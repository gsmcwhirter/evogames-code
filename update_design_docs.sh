#!/bin/bash

if [ -z $1 ]
then
	echo "You must supply a database"
	exit
fi

cd couchapps
for directory in *
do
	echo -n "${directory}"

	if [ "${directory}" == "." ]
	then
		echo "... skipping ."
		continue
	fi

	if [ "${directory}" == ".." ]
	then
		echo "... skipping .."
		continue
	fi

	if [ -d ./${directory} ]
	then
		echo "... processing"
		couchapp push ${directory} $1
	else
		echo "... skipping non-directory"
		continue
	fi
done
