#!/usr/bin/python

import sys
import packer

# Takes map name (without extension and full path) as argument. Output goes to ../resources/converted.

packer.pack_bsp('maps/' + sys.argv[1] + '.bsp', '../resources/baseoa/', '../resources/converted/maps/' + sys.argv[1] + '.zip')
