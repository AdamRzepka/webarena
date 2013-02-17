#!/usr/bin/python

import sys
import packer

# Takes player name (without extension and full path) as argument. Output goes to ../resources/converted/players/.

packer.pack_player('models/players/' + sys.argv[1] + '/', '../resources/baseoa/', '../resources/converted/players/' + sys.argv[1] + '.zip')
