#!/bin/bash

# Generates deps.js as in google closure library for entire project.
# Used for debugging js files.

closure/build/depswriter.py --root_with_prefix="../project/js ../../js" > ../project/deps.js
