import zipfile
import os
import Image
import bsp
import math

def check_file_exists(path):
     try:
         open(path, 'r')
         return True
     except IOError:
         return False

#is power of 2
def is_po2(x):
    return math.modf(math.log(x, 2))[0] == 0

def find_nearest_po2(x):
    return math.trunc(math.pow(2, math.modf(math.log(x, 2))[1] + 1))
         
def transform_image(path, out):
    print 'Converting texture', path
    im = Image.open(path)
    x,y = im.size

    resize = False
    if not is_po2(x):
        x = find_nearest_po2(x)
        resize = True
    if not is_po2(y):
        y = find_nearest_po2(y)
        resize = True

    if resize:
        print 'Found NPOT texture. Resizing to', x, y
        im = im.resize((x, y), Image.ANTIALIAS)

    if path != out or resize:
        im.save(out)

def pack_files(files, baseoa, zipname):
    baseoa = baseoa + '/' #just in case
    with zipfile.ZipFile(zipname, 'w', zipfile.ZIP_DEFLATED) as archive:
        for f in files:
            base, ext = os.path.splitext(f)
            if ext == '.tga':
                if check_file_exists(baseoa + f):
                    transform_image(baseoa + f, baseoa + base + '.png')
                    f = base + '.png'
                else:
                    f = base +'.jpg'
                    if check_file_exists(baseoa + f):
                        transform_image(baseoa +f, baseoa + f)
                    else:
                        print 'Warning: texture not found:', base
                        continue
            else:
                if not check_file_exists(baseoa + f):
                    print 'Warning: file not found:', f
                    continue

            archive.write(baseoa + f, f)

def pack_bsp(bsp_file, baseoa, zipname):
    print 'Packing', bsp_file
    pack_files(bsp.get_files_for_bsp(bsp_file, baseoa), baseoa, zipname)

def pack_player(player_dir, baseoa, zipname):
    pass
                
