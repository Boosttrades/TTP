import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GLView } from 'expo-gl';
import * as ExpoTHREE from 'expo-three';
import * as THREE from 'three';

export default function App() {
  const mounted = useRef(true);
  const [status, setStatus] = useState('Preparing offline city…');
  const [error, setError] = useState('');

  useEffect(() => () => { mounted.current = false; }, []);

  const onContextCreate = async (gl) => {
    let renderer;
    let frame = null;
    let alive = true;
    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x9db4c2);
      scene.fog = new THREE.Fog(0x9db4c2, 35, 125);
      const camera = new THREE.PerspectiveCamera(65, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 300);
      camera.position.set(0, 3.2, 6);
      camera.lookAt(0, 1, 0);
      renderer = new ExpoTHREE.Renderer({ gl, antialias: false });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setPixelRatio(1);
      scene.add(new THREE.HemisphereLight(0xe5f2ff, 0x49505a, 2));
      const sun = new THREE.DirectionalLight(0xfff0d4, 2.2);
      sun.position.set(15, 28, 10);
      scene.add(sun);

      // The model is bundled with the app so runtime loading needs no network.
      const modelAsset = require('./assets/dense_tightly_packed_city.glb');
      const loaded = await ExpoTHREE.loadAsync(modelAsset);
      if (!mounted.current || !alive) {
        renderer.dispose?.();
        return;
      }
      const root = loaded.scene || loaded;
      root.position.set(0, 0, 0);
      scene.add(root);
      setStatus('City loaded. Preparing mobile gameplay controls.');

      const render = () => {
        if (!alive || !mounted.current) return;
        frame = requestAnimationFrame(render);
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      render();
    } catch (e) {
      console.error('Expo 3D startup failed:', e);
      if (mounted.current) {
        setError(String(e?.message || e || 'Unknown rendering error'));
        setStatus('Could not start the 3D scene.');
      }
    }
    return () => {
      alive = false;
      if (frame) cancelAnimationFrame(frame);
      renderer?.dispose?.();
    };
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <GLView style={styles.canvas} onContextCreate={onContextCreate} />
      <View pointerEvents="none" style={styles.overlay}>
        {!error && status.startsWith('Preparing') ? <ActivityIndicator color="#ffffff" /> : null}
        <Text style={styles.status}>{status}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101820' },
  canvas: { flex: 1 },
  overlay: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'center', gap: 6 },
  status: { color: '#ffffff', backgroundColor: '#101820cc', overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, textAlign: 'center' },
  error: { color: '#ffd4d4', backgroundColor: '#632d2dee', padding: 8, borderRadius: 8, textAlign: 'center' }
});
