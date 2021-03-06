// This file was autogenerated by ../../../tools/closure/build/depswriter.py.
// Please do not edit.
goog.addDependency('../../../js/base/base.js', ['base', 'base.GeometryData', 'base.LightningType', 'base.Mesh', 'base.Model', 'base.ModelInstance'], ['base.Mat4', 'base.Vec3', 'goog.asserts']);
goog.addDependency('../../../js/base/broker.js', ['base.Broker', 'base.FakeBroker', 'base.IBroker'], ['goog.array', 'goog.asserts', 'goog.async.Deferred', 'goog.async.DeferredList', 'goog.net.jsloader']);
goog.addDependency('../../../js/base/bsp.js', ['base.Bsp'], ['base', 'goog.asserts']);
goog.addDependency('../../../js/base/events.js', ['base.events'], []);
goog.addDependency('../../../js/base/inputstate.js', ['base.InputState'], ['goog.array']);
goog.addDependency('../../../js/base/irendererscene.js', ['base.IRendererScene'], []);
goog.addDependency('../../../js/base/jobspool.js', ['base.JobsPool'], ['base.Broker', 'goog.structs.Queue']);
goog.addDependency('../../../js/base/map.js', ['base.Map'], ['base', 'base.Bsp']);
goog.addDependency('../../../js/base/mat3.js', ['base.Mat3'], []);
goog.addDependency('../../../js/base/mat4.js', ['base.Mat4'], ['base.Mat3', 'base.Vec3']);
goog.addDependency('../../../js/base/material.js', ['base.Material', 'base.ShaderScript'], []);
goog.addDependency('../../../js/base/math.js', ['base.math'], ['base.Vec3']);
goog.addDependency('../../../js/base/pool.js', ['base.Pool'], ['goog.asserts']);
goog.addDependency('../../../js/base/quat4.js', ['base.Quat4'], ['base.Mat3', 'base.Mat4', 'base.Vec3']);
goog.addDependency('../../../js/base/vec3.js', ['base.Vec3', 'base.Vec4'], ['base.Pool']);
goog.addDependency('../../../js/files/binaryfile.js', ['files.BinaryFile'], []);
goog.addDependency('../../../js/files/bsp.js', ['files.bsp'], ['base', 'base.Bsp', 'base.Map', 'base.Mat4', 'base.Vec3', 'files.BinaryFile']);
goog.addDependency('../../../js/files/md3.js', ['files.md3'], ['base', 'files.BinaryFile', 'goog.asserts']);
goog.addDependency('../../../js/files/resourceManager.js', ['files.ResourceManager'], ['base', 'base.JobsPool', 'files.ShaderScriptLoader', 'files.zipjs', 'goog.array', 'goog.async.Deferred', 'goog.async.DeferredList', 'goog.debug.Logger']);
goog.addDependency('../../../js/files/shaderscriptloader.js', ['files.ShaderScriptLoader'], ['base.ShaderScript']);
goog.addDependency('../../../js/files/zipjs/zip.js', ['files.zipjs'], []);
goog.addDependency('../../../js/flags.js', ['flags'], []);
goog.addDependency('../../../js/game/charactercontroller.js', ['game.CharacterController'], ['base.Bsp', 'base.Vec3', 'game.InputBuffer', 'game.MachineGun', 'game.ModelManager', 'game.Player', 'game.Weapon', 'game.globals', 'network']);
goog.addDependency('../../../js/game/dummyrendererscene.js', ['game.DummyRendererScene'], ['base.IRendererScene']);
goog.addDependency('../../../js/game/entity.js', ['game.Entity'], ['base.Vec3']);
goog.addDependency('../../../js/game/freecamera.js', ['game.FreeCamera'], ['base.Mat4', 'base.Vec3', 'game.InputBuffer', 'network']);
goog.addDependency('../../../js/game/game.js', ['game'], ['base', 'base.Broker', 'base.IRendererScene', 'base.Map', 'base.Mat3', 'base.events', 'flags', 'game.CharacterController', 'game.DummyRendererScene', 'game.FreeCamera', 'game.InputBuffer', 'game.ModelManager', 'game.Player', 'game.Scene', 'game.globals', 'network', 'network.Client', 'network.Server']);
goog.addDependency('../../../js/game/globals.js', ['game.globals'], []);
goog.addDependency('../../../js/game/inputbuffer.js', ['game.InputBuffer'], ['base.InputState', 'goog.array']);
goog.addDependency('../../../js/game/modelmanager.js', ['game.ModelManager'], ['base.IRendererScene', 'base.ModelInstance', 'goog.debug.Logger']);
goog.addDependency('../../../js/game/player.js', ['game.Player'], ['base', 'base.Mat4', 'base.Vec3', 'base.math', 'game.ModelManager', 'network']);
goog.addDependency('../../../js/game/scene.js', ['game.Scene'], ['base.IRendererScene', 'game.CharacterController', 'game.InputBuffer', 'game.MachineGun', 'game.Player', 'goog.asserts', 'network', 'network.ClassInfo']);
goog.addDependency('../../../js/game/weapon.js', ['game.MachineGun', 'game.Weapon'], ['base', 'base.Mat4', 'network']);
goog.addDependency('../../../js/network/classinfo.js', ['network.ClassInfo', 'network.ClassInfoBuilder', 'network.ClassInfoManager'], ['goog.asserts', 'network']);
goog.addDependency('../../../js/network/client.js', ['network.Client'], ['base.IBroker', 'base.events', 'goog.debug.Logger', 'network', 'network.ObjectWriter', 'network.Serializer', 'network.Snapshot']);
goog.addDependency('../../../js/network/network.js', ['network', 'network.Flags', 'network.ISynchronizable', 'network.ISynchronizer', 'network.Type'], []);
goog.addDependency('../../../js/network/objectreader.js', ['network.ObjectReader'], ['goog.asserts', 'network', 'network.ClassInfo', 'network.ClassInfoManager', 'network.Snapshot']);
goog.addDependency('../../../js/network/objectwriter.js', ['network.ObjectWriter'], ['goog.asserts', 'network', 'network.ClassInfo', 'network.ClassInfoManager', 'network.Snapshot']);
goog.addDependency('../../../js/network/serializer.js', ['network.Serializer'], ['network', 'network.ClassInfo', 'network.Snapshot']);
goog.addDependency('../../../js/network/server.js', ['network.Server'], ['base.IBroker', 'base.events', 'goog.debug.Logger', 'network', 'network.ObjectReader', 'network.Serializer', 'network.Snapshot']);
goog.addDependency('../../../js/network/snapshot.js', ['network.ObjectBuffer', 'network.Snapshot'], ['goog.array', 'goog.asserts']);
goog.addDependency('../../../js/network/tests/common.js', ['network.tests.common'], ['goog.testing.jsunit', 'network', 'network.ClassInfo']);
goog.addDependency('../../../js/renderer/billboard.js', ['renderer.billboard'], ['base.Mesh', 'base.Model', 'renderer', 'renderer.Renderer']);
goog.addDependency('../../../js/renderer/common.js', ['renderer', 'renderer.Material', 'renderer.MeshInstance', 'renderer.Shader', 'renderer.ShaderProgram', 'renderer.Stage', 'renderer.State'], ['base.Material', 'goog.webgl']);
goog.addDependency('../../../js/renderer/line.js', ['renderer.line'], ['base.Mat4', 'base.Mesh', 'base.Model', 'base.Vec3', 'renderer', 'renderer.Renderer']);
goog.addDependency('../../../js/renderer/materialmanager.js', ['renderer.MaterialManager'], ['base.Mat4', 'base.Material', 'goog.debug.Logger', 'goog.debug.Logger.Level', 'renderer.Material', 'renderer.Shader', 'renderer.ShaderProgram', 'renderer.Stage']);
goog.addDependency('../../../js/renderer/renderer.js', ['renderer.Renderer'], ['base', 'base.Mat4', 'base.Vec3', 'goog.debug.Logger', 'goog.debug.Logger.Level', 'renderer.Material', 'renderer.MaterialManager', 'renderer.Shader', 'renderer.ShaderProgram', 'renderer.Stage', 'renderer.State']);
goog.addDependency('../../../js/renderer/scene.js', ['renderer.Scene'], ['base', 'base.IRendererScene', 'base.Mat4', 'base.Vec3', 'goog.debug.Logger', 'renderer.Renderer', 'renderer.Sky', 'renderer.billboard', 'renderer.line']);
goog.addDependency('../../../js/renderer/sky.js', ['renderer.Sky'], ['base.Mat4', 'goog.asserts', 'renderer', 'renderer.State']);
goog.addDependency('../../../js/system/client.js', ['system.Client'], ['base.Broker', 'base.events', 'files.ResourceManager', 'flags', 'goog.asserts', 'goog.async.Deferred', 'goog.async.DeferredList', 'goog.debug.Logger', 'goog.object', 'renderer.Scene', 'system.ISocket', 'system.InputHandler', 'system.RTCSocket', 'system.common']);
goog.addDependency('../../../js/system/common.js', ['system.common'], []);
goog.addDependency('../../../js/system/game.js', ['system.Game'], ['files.ResourceManager', 'system.Client', 'system.Server']);
goog.addDependency('../../../js/system/inputhandler.js', ['system.InputHandler'], ['base.InputState', 'goog.array']);
goog.addDependency('../../../js/system/isocket.js', ['system.ISocket'], []);
goog.addDependency('../../../js/system/rtcsocket.js', ['system.RTCSocket'], ['goog.asserts', 'goog.debug.Logger', 'system.ISocket']);
goog.addDependency('../../../js/system/server.js', ['system.Server'], ['base.Broker', 'base.events', 'files.ResourceManager', 'goog.asserts', 'goog.async.Deferred', 'goog.async.DeferredList', 'goog.debug.Logger', 'system.ISocket', 'system.RTCSocket', 'system.common']);
goog.addDependency('../../../js/system/system.js', ['system'], []);
