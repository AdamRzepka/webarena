#!/bin/bash

cd ../project/
ctags-exuberant -e -R --languages="js" --verbose=yes -f TAGS
