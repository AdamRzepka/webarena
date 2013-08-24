// This file was autogenerated by closure/build/depswriter.py.
// Please do not edit.
goog.addDependency('../../js/base/base.js', ['base', 'base.GeometryData', 'base.LightningType', 'base.Mesh', 'base.Model', 'base.ModelInstance'], ['base.Mat4', 'base.Vec3', 'goog.asserts']);
goog.addDependency('../../js/base/bsp.js', ['base.Bsp'], ['base', 'goog.asserts']);
goog.addDependency('../../js/base/iinputhandler.js', ['base.IInputHandler'], []);
goog.addDependency('../../js/base/irendererscene.js', ['base.IRendererScene'], []);
goog.addDependency('../../js/base/map.js', ['base.Map'], ['base', 'base.Bsp']);
goog.addDependency('../../js/base/mat3.js', ['base.Mat3'], []);
goog.addDependency('../../js/base/mat4.js', ['base.Mat4'], ['base.Mat3', 'base.Vec3']);
goog.addDependency('../../js/base/material.js', ['base.Material', 'base.ShaderScript'], []);
goog.addDependency('../../js/base/pool.js', ['base.Pool'], ['goog.asserts']);
goog.addDependency('../../js/base/quat4.js', ['base.Quat4'], ['base.Mat3', 'base.Mat4', 'base.Vec3']);
goog.addDependency('../../js/base/vec3.js', ['base.Vec3', 'base.Vec4'], ['base.Pool']);
goog.addDependency('../../js/base/workers/broker.js', ['base.workers.Broker', 'base.workers.FakeBroker', 'base.workers.IBroker'], ['goog.array', 'goog.asserts']);
goog.addDependency('../../js/files/binaryfile.js', ['files.BinaryFile'], []);
goog.addDependency('../../js/files/bsp.js', ['files.bsp'], ['base', 'base.Bsp', 'base.Map', 'base.Mat4', 'base.Vec3', 'files.BinaryFile']);
goog.addDependency('../../js/files/md3.js', ['files.md3'], ['base', 'files.BinaryFile', 'goog.asserts']);
goog.addDependency('../../js/files/resourceManager.js', ['files.ResourceManager'], ['files.zipjs', 'goog.debug.Logger']);
goog.addDependency('../../js/files/shaderscriptloader.js', ['files.ShaderScriptLoader'], ['base.ShaderScript']);
goog.addDependency('../../js/files/zipjs/zip.js', ['files.zipjs'], []);
goog.addDependency('../../js/flags.js', ['flags'], []);
goog.addDependency('../../js/game/charactercontroller.js', ['game.CharacterController'], ['base.Bsp', 'base.Vec3', 'game.InputBuffer', 'game.Player', 'game.globals']);
goog.addDependency('../../js/game/entity.js', ['game.Entity'], ['base.Vec3']);
goog.addDependency('../../js/game/freecamera.js', ['game.FreeCamera'], ['base.Mat4', 'base.Vec3', 'game.InputBuffer']);
goog.addDependency('../../js/game/game.js', ['game'], ['base', 'base.IRendererScene', 'base.Mat3', 'base.workers.Broker', 'files.ResourceManager', 'files.ShaderScriptLoader', 'files.bsp', 'files.md3', 'flags', 'game.CharacterController', 'game.FreeCamera', 'game.InputBuffer', 'game.InputHandler', 'game.ModelManager', 'game.Player', 'game.globals', 'network.Synchronizer']);
goog.addDependency('../../js/game/globals.js', ['game.globals'], []);
goog.addDependency('../../js/game/inputbuffer.js', ['game.InputBuffer'], ['game.InputState', 'goog.array']);
goog.addDependency('../../js/game/inputhandler.js', ['game.InputHandler'], ['base.IInputHandler', 'game.InputState', 'goog.array']);
goog.addDependency('../../js/game/inputstate.js', ['game.InputState'], ['goog.array']);
goog.addDependency('../../js/game/modelmanager.js', ['game.ModelManager'], ['base.IRendererScene', 'base.ModelInstance', 'files.ResourceManager', 'files.md3', 'goog.debug.Logger']);
goog.addDependency('../../js/game/player.js', ['game.Player'], ['base', 'base.Mat4', 'base.Vec3', 'files.ResourceManager', 'game.ModelManager']);
goog.addDependency('../../js/network/snapshot.js', ['network.ArrayBuffer', 'network.ObjectBuffer', 'network.Snapshot'], []);
goog.addDependency('../../js/network/synchronizer.js', ['network.ISynchronizable', 'network.Synchronizer'], ['goog.asserts', 'network.Snapshot']);
goog.addDependency('../../js/renderer/billboard.js', ['renderer.billboard'], ['base.Mesh', 'base.Model', 'renderer', 'renderer.Renderer']);
goog.addDependency('../../js/renderer/common.js', ['renderer', 'renderer.Material', 'renderer.MeshInstance', 'renderer.Shader', 'renderer.ShaderProgram', 'renderer.Stage', 'renderer.State'], ['base.Material', 'goog.webgl']);
goog.addDependency('../../js/renderer/line.js', ['renderer.line'], ['base.Mat4', 'base.Mesh', 'base.Model', 'base.Vec3', 'renderer', 'renderer.Renderer']);
goog.addDependency('../../js/renderer/materialmanager.js', ['renderer.MaterialManager'], ['base.Mat4', 'base.Material', 'goog.debug.Logger', 'goog.debug.Logger.Level', 'renderer.Material', 'renderer.Shader', 'renderer.ShaderProgram', 'renderer.Stage']);
goog.addDependency('../../js/renderer/renderer.js', ['renderer.Renderer'], ['base', 'base.Mat4', 'base.Vec3', 'goog.debug.Logger', 'goog.debug.Logger.Level', 'renderer.Material', 'renderer.MaterialManager', 'renderer.Shader', 'renderer.ShaderProgram', 'renderer.Stage', 'renderer.State']);
goog.addDependency('../../js/renderer/scene.js', ['renderer.Scene'], ['base', 'base.IRendererScene', 'base.Mat4', 'base.Vec3', 'goog.debug.Logger', 'renderer.Renderer', 'renderer.Sky', 'renderer.billboard', 'renderer.line']);
goog.addDependency('../../js/renderer/sky.js', ['renderer.Sky'], ['base.Mat4', 'goog.asserts', 'renderer', 'renderer.State']);
