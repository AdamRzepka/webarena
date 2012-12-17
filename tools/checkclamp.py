#!/usr/bin/python

import os
import re
def checkclamps(dir):
    usedmap = []
    usedclamp = []
    files = filter(lambda f: f.find('.shader') != -1, os.listdir(dir))
#    print files
    for filename in files:
#    filename = files[0]
        with open(dir + '/' + filename) as f:
            data = f.read().lower()
            #print data
            usedmap.extend(map(lambda t: (t, filename),
                               re.findall('\s+map\s+(.*\.jpg|.*\.tga|.*\.jpeg)', data)))
            usedclamp.extend(map(lambda t: (t, filename),
                                 re.findall('clampmap\s+(.*\.jpg|.*\.tga|.*\.jpeg)', data)))
#    print 'map', usedmap
#    print 'clamp', usedclamp

    
    for um in set(usedmap):
        for uc in set(usedclamp):
            if um[0] == uc[0]:
                print 'Found collision:', um, uc
            


if __name__ == "__main__":
    import sys
    dir = sys.argv[1]
    checkclamps(dir)
