# checks for dependencies (textures, shaders, models) in given bsp file

import struct

LUMPS_NUMBERS = {
    'Entities' : 0,
    'Textures' : 1,
    'Planes' : 2,
    'Nodes' : 3,
    'Leafs' : 4,
    'Leaffaces' : 5,
    'Leafbrushes' : 6,
    'Models' : 7,
    'Brushes' : 8,
    'Brushsides' : 9,
    'Vertexes' : 10,
    'Meshverts' : 11,
    'Effects' : 12,
    'Faces' : 13,
    'Lightmaps' : 14,
    'Lightvols' : 15,
    'Visdata' : 16
}

def get_bsp_deps(bsp_path):
    with open(bsp_path, 'rb') as bsp:
        check_header(bsp)
        lumps = parse_dir(bsp)
        return (parse_entities(bsp, lumps[LUMPS_NUMBERS['Entities']]),
                parse_textures(bsp, lumps[LUMPS_NUMBERS['Textures']]),
                parse_textures(bsp, lumps[LUMPS_NUMBERS['Effects']])) # effects have the same format as textures

def check_header(bsp):
    if bsp.read(4) != 'IBSP':
        raise Exception('Not bsp file')

def parse_dir(bsp):
    bsp.seek(8)
    lumps = []
    for i in range(0,16):
        lumps.append(struct.unpack('ii', bsp.read(8)))
    return lumps # lumps are in format (offset, length)

def parse_entities(bsp, lump):
    bsp.seek(lump[0])
    entities = bsp.read(lump[1]).strip('\x00{}').split('}\n{')
    
    def get_class_name(entity_str):
        entity = entity_str.split('"')
        return entity[entity.index('classname') + 2]

    entities = set(map(get_class_name, entities))
    return entities

def parse_textures(bsp, lump):
    LUMP_SIZE = 68
    bsp.seek(lump[0])
    textures = []
    for i in range(1, lump[1] / LUMP_SIZE):
        textures.append(bsp.read(64).strip('\x00'))
        bsp.read(8) # skip flags
    return textures

