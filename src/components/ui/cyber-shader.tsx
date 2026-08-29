'use client';

import React, { useEffect, useRef } from 'react';

export function CyberShader({ className = 'fixed inset-0 w-full h-full pointer-events-none -z-10' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    syncSize();

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return;

    const vs = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `
precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

vec3 teal = vec3(0.0, 0.674, 0.674);
vec3 dark = vec3(0.054, 0.054, 0.054);
vec3 graphite = vec3(0.274, 0.270, 0.270);

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;
    
    vec2 grid = fract(uv * 20.0 - u_time * 0.05);
    float gridLine = smoothstep(0.0, 0.02, grid.x) * smoothstep(1.0, 0.98, grid.x) *
                     smoothstep(0.0, 0.02, grid.y) * smoothstep(1.0, 0.98, grid.y);
    
    float nodes = 0.0;
    for(int i = 0; i < 8; i++) {
        float t = u_time * 0.2 + float(i) * 1.5;
        vec2 pos = vec2(
            0.5 + 0.3 * cos(t * 0.7 + float(i)),
            0.5 + 0.2 * sin(t * 1.1 + float(i))
        );
        float d = length(uv - pos);
        float size = 0.005 + 0.002 * sin(u_time * 3.0 + float(i));
        nodes += smoothstep(size, 0.0, d) * 0.8;
        
        for(int j = 0; j < 3; j++) {
            float t2 = u_time * 0.15 + float(j) * 2.1;
            vec2 pos2 = vec2(
                0.5 + 0.35 * sin(t2 * 0.8 + float(j)),
                0.5 + 0.25 * cos(t2 * 1.2 + float(j))
            );
            float d2 = length(uv - pos2);
            float line = smoothstep(0.002, 0.0, abs(d - d2 + 0.05 * sin(u_time)));
            nodes += line * 0.1 * smoothstep(0.2, 0.0, d);
        }
    }
    
    float mouseDist = length(uv - mouse);
    float glow = smoothstep(0.15, 0.0, mouseDist) * 0.2;
    
    vec3 color = dark;
    color = mix(color, graphite * 0.3, 1.0 - gridLine);
    color += teal * nodes;
    color += teal * glow;
    
    float scanline = sin(uv.y * 400.0 + u_time * 5.0) * 0.02;
    color += scanline;

    gl_FragColor = vec4(color, 1.0);
}`;

    function compileShader(type: number, src: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      return shader;
    }

    const vertShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mousePos.x = nx * canvas.width;
        mousePos.y = ny * canvas.height;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    function render(t: number) {
      if (!canvas || !gl) return;
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mousePos.x, mousePos.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
