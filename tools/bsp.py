# checks for dependencies (textures, shaders, models) in given bsp file
# TODO: sounds

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

def get_files_for_bsp(bsp, baseoa):
    deps = get_bsp_deps(baseoa + '/' + bsp)
    deps[1].extend(deps[2])
    shaders_deps = get_files_for_shaders(deps[1], baseoa)

    files = [bsp]
    files.extend(shaders_deps[0])
    files.extend(shaders_deps[1])
    files.extend(map(lambda t: t + '.tga', shaders_deps[2]))
    return files
    

def get_bsp_deps(bsp_path):
    try:
        with open(bsp_path, 'rb') as bsp:
            check_bsp_header(bsp)
            lumps = parse_dir(bsp)
            return (parse_entities(bsp, lumps[LUMPS_NUMBERS['Entities']]),
                    parse_textures(bsp, lumps[LUMPS_NUMBERS['Textures']]),
                    parse_textures(bsp, lumps[LUMPS_NUMBERS['Effects']])) # effects have the same format as textures
    except IOError:
        print 'Failed to open file', bsp_path        

def check_bsp_header(bsp):
    if bsp.read(4) != 'IBSP':
        raise Exception('Not bsp file')

def parse_dir(bsp):
    bsp.seek(8)
    lumps = []
    for i in range(0,17):
        lumps.append(struct.unpack('ii', bsp.read(8)))
    return lumps # lumps are in format (offset, length)

def parse_entities(bsp, lump):
    bsp.seek(lump[0])
    entities = bsp.read(lump[1]).strip('\x00{}').split('}\n{')
    
    def get_class_name(entity_str):
        entity = entity_str.split('"')
        return entity[entity.index('classname') + 2]

    entities = list(set(map(get_class_name, entities)))

    entities = filter((lambda e: e.find('weapon') != -1 or e.find('ammo') != -1
                       or e.find('item') != -1 or e.find('misc_model') != -1),
                      entities)
    return entities

def parse_textures(bsp, lump):
    LUMP_SIZE = 72
    bsp.seek(lump[0])
    textures = []
    for i in range(0, lump[1] / LUMP_SIZE):
        textures.append(bsp.read(64).strip('\x00'))
        bsp.read(8) # skip flags
    return textures


import os

# Returns list of files (script file, textures) needed by shaders with given names
def get_files_for_shaders(shaders, baseoa):
    scripts = os.listdir(baseoa + '/scripts')
    textures_dep = []
    scripts_dep = []
    shaders_found = set()
    
    for script_path in scripts:
        shaders_dep = parse_shader_file(baseoa + '/scripts/' + script_path)
        for shader in shaders:
            if shader in shaders_dep:
#                print 'Shader', shader, 'found in script', script_path
                shaders_found.add(shader)
                if shaders_dep[shader] != []:
                    scripts_dep.append('scripts/' + script_path)
                    textures_dep.extend(shaders_dep[shader])
                    
    not_found = set(shaders).difference(shaders_found)    
    for s in not_found:
        print 'Warning: Shader', s, 'not found in any script.'
        
    return (list(set(scripts_dep)), list(set(textures_dep)), list(set(not_found))) #unique

def parse_shader_file(script_path):
    shaders = {}

    with open(script_path, 'r') as script:
        line = script.readline()
        shader_name = ''
        textures = []
        state = 'global'
        while line != '':
            line = line.strip()
            if line[:2] == '//' or line == '\n':
                pass
            elif state == 'global':
                if line == '{':
                    state = 'shader'
                else:
                    shader_name = line
            elif state == 'shader':
                if line == '{':
                    state = 'stage'
                elif line == '}':
                    shaders[shader_name] = textures
                    textures = []
                    state = 'global'
            elif state == 'stage':
                if line[:3] == 'map' and line.find('$lightmap') == -1:
                    textures.append(line[4:])
                if line == '}':
                    state = 'shader'

            line = script.readline()
            
    return shaders


# md3 dependencies (scripts and textures)
def get_md3_deps(md3_path):
    try:
        with open(md3_path, 'rb') as md3:
            check_md3_header(md3)
            md3.seek(76) # seek to numbers and offsets
            header = struct.unpack('iiiiiii', md3.read(28))
            surface_num = header[2]
            surface_offset = header[6]
            print 'In header', surface_num, surface_offset
            shaders = []
            md3.seek(surface_offset)
            for i in range(0, surface_num):
                shaders.extend(check_md3_surface(md3))
    except IOError:
        print 'Failed to open file', md3_path

    return shaders
        
        
def check_md3_header(md3):
    md3.seek(0)
    if md3.read(4) != 'IDP3':
        raise Exception('Not md3 file')

def check_md3_surface(md3):
    start_offset = md3.tell()
#    print 'In surface', s_offset
    md3.seek(72, os.SEEK_CUR) # seek to numbers and offsets
    surface_header = struct.unpack('iiiiiiiii', md3.read(36))
    shaders_num = surface_header[1]
    shaders_offset = surface_header[5]
    
    print 'In surface', shaders_num, shaders_offset
    
    md3.seek(start_offset + shaders_offset)
    shaders = []
    for i in range(0, shaders_num):
        shaders.append((md3.read(64).strip('\x00'), struct.unpack('i', md3.read(4))[0]))

    md3.seek(start_offset + surface_header[8]) # seek to the end of the surface
    return shaders

    
    
def check_model_skins(md3_dir):
    try:
        skin_files = filter(lambda n: n[-5:] == '.skin', os.listdir(md3_dir))
        skins = []
        for skin_path in skin_files:
            shaders = []
            with open(md3_dir + '/' + skin_path, 'r') as f:
                line = f.readline().strip()
                while (line.find(',') != -1):
                    shaders.append(line[line.find(',') + 1:])
                    line = f.readline().strip()
                skins.append((skin_path, shaders))
        return skins
    except OSError:
        print 'Directory', md3_dir, 'not found'
    
    
def get_files_for_player(player_dir, baseoa):
    models = ['lower', 'upper', 'head']
    
