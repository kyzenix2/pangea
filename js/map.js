/* Equal Earth map of the five chains. Drag to spin, scroll to move through time. */
(function () {
  const DEG = Math.PI / 180;
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const BURY = -60.01 * DEG;

  function projectLat(lat) {
    const theta = Math.asin(0.8660254 * Math.sin(lat));
    const n = theta * theta;
    const t = n * n * n;
    const xk =
      (1.1547005 * Math.cos(theta)) /
      (0.034164 * t * n + 7 * 0.000893 * t - 3 * 0.081106 * n + 1.340264);
    const yk = theta * (1.340264 + n * (-0.081106 + n * n * (0.000893 + 0.003796 * n)));
    return [xk, yk];
  }

  function wrap(lon) {
    lon %= TAU;
    if (lon > Math.PI) lon -= TAU;
    if (lon < -Math.PI) lon += TAU;
    return lon;
  }

  function rotate(axis, angle, out) {
    const [x, y, z] = axis;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const k = 1 - c;
    out[0] = c + x * x * k;
    out[1] = x * y * k - z * s;
    out[2] = x * z * k + y * s;
    out[3] = y * x * k + z * s;
    out[4] = c + y * y * k;
    out[5] = y * z * k - x * s;
    out[6] = z * x * k - y * s;
    out[7] = z * y * k + x * s;
    out[8] = c + z * z * k;
  }

  function seaDots() {
    const lon = [];
    const kx = [];
    const ky = [];
    let row = 0;
    for (let lat = -77; lat <= 84; lat += 1.25, row++) {
      const count = Math.max(1, Math.round((360 * Math.cos(lat * DEG)) / 1.25));
      const [xk, yk] = projectLat(lat * DEG);
      for (let i = 0; i < count; i++) {
        lon.push((-180 + (i + (row % 2) * 0.5) * (360 / count)) * DEG);
        kx.push(xk);
        ky.push(yk);
      }
    }
    return { lon: Float32Array.from(lon), kx: Float32Array.from(kx), ky: Float32Array.from(ky) };
  }

  function parseDots(buffer) {
    const view = new DataView(buffer);
    if (view.getUint32(0, true) !== 0x31444750) throw new Error("not a dot map");
    const pieceCount = view.getUint32(4, true);
    const count = view.getUint32(8, true);
    let offset = 16;
    const pieces = [];
    for (let i = 0; i < pieceCount; i++, offset += 20) {
      pieces.push({
        ax: [view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)],
        ang: view.getFloat32(offset + 12, true),
        chain: Math.round(view.getFloat32(offset + 16, true)),
        from: count,
        to: 0,
        seen: 0,
      });
    }
    const v = new Float32Array(3 * count);
    const lon = new Float32Array(count);
    const kx = new Float32Array(count);
    const ky = new Float32Array(count);
    const tx = new Float32Array(count);
    const ty = new Float32Array(count);
    const buried = new Uint8Array(count);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < count; i++, offset += 8) {
      const lat = (view.getInt16(offset, true) / 100) * DEG;
      const lng = (view.getInt16(offset + 2, true) / 100) * DEG;
      v[3 * i] = Math.cos(lat) * Math.sin(lng);
      v[3 * i + 1] = Math.sin(lat);
      v[3 * i + 2] = Math.cos(lat) * Math.cos(lng);
      lon[i] = lng;
      const projected = projectLat(lat);
      kx[i] = projected[0];
      ky[i] = projected[1];
      tx[i] = view.getInt16(offset + 4, true) / 8000;
      ty[i] = view.getInt16(offset + 6, true) / 8000;
      buried[i] = lat < BURY ? 1 : 0;
      minX = Math.min(minX, tx[i]);
      maxX = Math.max(maxX, tx[i]);
      minY = Math.min(minY, ty[i]);
      maxY = Math.max(maxY, ty[i]);
    }
    for (let i = 0; i < count; i++) {
      const piece = pieces[view.getUint8(offset + i)];
      piece.from = Math.min(piece.from, i);
      piece.to = Math.max(piece.to, i + 1);
      if (!buried[i]) piece.seen++;
    }
    return { pieces, count, v, lon, kx, ky, tx, ty, buried, w: maxX - minX, h: maxY - minY };
  }

  function inkFor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#17131c" : "#ffffff";
  }

  function mountMap(canvas, options) {
    const colors = options.colors;
    const labels = options.labels || [];
    const dotted = options.dotted !== false;
    const still = options.still || false;
    const spin = still ? 0 : options.spin || 0;
    const seaField = seaDots();
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");

    const read = (name, fallback) => getComputedStyle(canvas).getPropertyValue(name).trim() || fallback;
    let sea = read("--sea", "#e3ded6");
    let ink = read("--ink", "#17131c");
    let paper = read("--paper", "#f8f6f2");

    let map = null;
    let dead = false;
    fetch(options.url)
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(String(res.status)))))
      .then((buf) => {
        if (!dead) map = parseDots(buf);
      })
      .catch(() => {});

    let shown = 0;
    let target = 0;
    let lastShown = -1;
    let playing = !still;
    let dir = 1;
    let pause = 1.8;
    let idle = 0;
    let rotation = 10;
    let momentum = 0;
    let dragging = false;
    let pointer = null;
    let hover = -1;
    let pinned = -1;
    let lastKey = "";
    let started = 0;
    let fade = 0;
    let lastFrame = 0;
    let fontFamily = "";
    let labelCache = null;
    const matrix = new Float64Array(9);
    let stats = new Float64Array(0);
    let frame = 0;

    function fit(width, height) {
      const globe = Math.min(width / 5.4132, (0.98 * height) / 2.635);
      const flat = map ? Math.max(1, Math.min((0.96 * height) / map.h, (0.9 * width) / map.w)) : globe;
      return { cx: width / 2, cy: height / 2, globe, flat };
    }

    function stopPlay() {
      playing = false;
      idle = 0;
    }

    function draw(now) {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
      lastFrame = now;

      if (map) {
        if (!started) started = now;
        fade = still ? 1 : clamp((now - started) / 900);
        if (playing) {
          if (pause > 0) pause -= dt;
          else {
            target = clamp(target + (dir * dt * (0.3 + 1.4 * Math.sin(Math.PI * target))) / 9);
            if (target >= 1 || target <= 0) {
              pause = target >= 1 ? 4 : 2.5;
              dir = -dir;
            }
          }
        } else if (!still && !dragging && (idle += dt) > 8) {
          playing = true;
          pause = 0;
          if (target >= 1) dir = -1;
          else if (target <= 0) dir = 1;
        }
      }

      shown += (target - shown) * Math.min(1, 7 * dt);
      if (Math.abs(target - shown) < 1e-4) shown = target;

      if (!dragging) {
        const morph = ease(clamp((shown - 0.35) / 0.65));
        rotation += (dt * spin + momentum) * (1 - morph);
        momentum *= 0.93;
        if (Math.abs(momentum) < 0.001) momentum = 0;
      }

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height || !map) {
        publish();
        return;
      }

      const progress = shown;
      const morph = ease(clamp((progress - 0.35) / 0.65));
      const active = pinned >= 0 ? pinned : hover;
      const key = [width, height, dpr, progress, morph < 1 ? rotation : 0, fade, pointer && pointer.x, pointer && pointer.y, pinned, hover, 1].join("|");
      if (key === lastKey) {
        publish();
        return;
      }
      lastKey = key;

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const { cx, cy, globe, flat } = fit(width, height);
      const spinRad = rotation * DEG;
      const turned = (lon) => wrap(lon - spinRad);

      if (dotted) {
        const size = Math.max(1, 0.0079 * globe);
        ctx.beginPath();
        for (let i = 0; i < seaField.lon.length; i++) {
          const x = cx + globe * seaField.kx[i] * turned(seaField.lon[i]);
          ctx.rect(x - size / 2, cy - globe * seaField.ky[i] - size / 2, size, size);
        }
        ctx.globalAlpha = fade;
        ctx.fillStyle = sea;
        ctx.fill();
      } else if (morph < 1) {
        ctx.beginPath();
        for (let i = 0; i <= 96; i++) {
          const lat = ((i <= 48 ? i : 96 - i) / 48) * 180 - 90;
          const [xk, yk] = projectLat(lat * DEG);
          const x = cx + (i <= 48 ? 1 : -1) * globe * xk * Math.PI;
          if (i) ctx.lineTo(x, cy - globe * yk);
          else ctx.moveTo(x, cy - globe * yk);
        }
        ctx.closePath();
        ctx.globalAlpha = fade * (1 - morph);
        ctx.fillStyle = sea;
        ctx.fill();
      }

      const hit = pointer && !dragging ? { x: pointer.x, y: pointer.y } : null;
      let nearest = -1;
      let best = (0.05 * globe) ** 2;
      const radius = Math.max(0.9, globe * 0.0105 + (flat * 0.0105 - globe * 0.0105) * morph);
      const spread = Math.min(1, 1.25 * progress);

      if (stats.length !== 8 * map.pieces.length) stats = new Float64Array(8 * map.pieces.length);
      stats.fill(0);
      for (let i = 0; i < map.pieces.length; i++) {
        stats[8 * i + 3] = Infinity;
        stats[8 * i + 4] = -Infinity;
      }

      let slot = -8;
      for (const piece of map.pieces) {
        slot += 8;
        rotate(piece.ax, piece.ang * spread, matrix);
        const alpha = fade * (active >= 0 && active !== piece.chain ? 0.22 : 1);
        const buriedPath = morph > 0 && morph < 1 ? new Path2D() : null;
        ctx.beginPath();
        for (let i = piece.from; i < piece.to; i++) {
          if (map.buried[i] && morph === 0) continue;
          let x = 0;
          let y = 0;
          if (morph < 1) {
            if (spread === 0) {
              x = cx + globe * map.kx[i] * turned(map.lon[i]);
              y = cy - globe * map.ky[i];
            } else {
              const vx = map.v[3 * i];
              const vy = map.v[3 * i + 1];
              const vz = map.v[3 * i + 2];
              const rx = matrix[0] * vx + matrix[1] * vy + matrix[2] * vz;
              const ry = matrix[3] * vx + matrix[4] * vy + matrix[5] * vz;
              const rz = matrix[6] * vx + matrix[7] * vy + matrix[8] * vz;
              const projected = projectLat(Math.asin(clamp(ry, -1, 1)));
              x = cx + globe * projected[0] * turned(Math.atan2(rx, rz));
              y = cy - globe * projected[1];
            }
          }
          if (morph > 0) {
            x += (cx + map.tx[i] * flat - x) * morph;
            y += (cy + map.ty[i] * flat - y) * morph;
          }
          if (!map.buried[i]) {
            stats[slot] += x;
            stats[slot + 1] += y;
            stats[slot + 2]++;
            if (x < stats[slot + 3]) stats[slot + 3] = x;
            if (x > stats[slot + 4]) stats[slot + 4] = x;
            if (x >= cx) {
              stats[slot + 5] += x;
              stats[slot + 6] += y;
              stats[slot + 7]++;
            }
          }
          if (x < -radius || x > width + radius) continue;
          if (hit) {
            const dist = (x - hit.x) ** 2 + (y - hit.y) ** 2;
            if (dist < best) {
              best = dist;
              nearest = piece.chain;
            }
          }
          if (map.buried[i] && buriedPath) {
            buriedPath.moveTo(x + radius, y);
            buriedPath.arc(x, y, radius, 0, TAU);
          } else {
            ctx.moveTo(x + radius, y);
            ctx.arc(x, y, radius, 0, TAU);
          }
        }
        ctx.fillStyle = colors[piece.chain] || "#888";
        ctx.globalAlpha = alpha;
        ctx.fill();
        if (buriedPath) {
          ctx.globalAlpha = alpha * morph;
          ctx.fill(buriedPath);
        }
      }

      if (!labelCache) {
        labelCache = [];
        labels.forEach((text, chain) => {
          let bestPiece = -1;
          map.pieces.forEach((piece, index) => {
            if (piece.chain === chain && (bestPiece < 0 || piece.seen > map.pieces[bestPiece].seen)) bestPiece = index;
          });
          if (bestPiece >= 0) labelCache.push({ piece: bestPiece, text, chain });
        });
      }

      if (labelCache.length) {
        if (!fontFamily) fontFamily = getComputedStyle(canvas).fontFamily;
        const size = Math.round(clamp(0.125 * globe, 11, 14) + 2 * morph);
        ctx.font = `700 ${size}px ${fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const label of labelCache) {
          const base = 8 * label.piece;
          if (!stats[base + 2]) continue;
          let x = stats[base] / stats[base + 2];
          let y = stats[base + 1] / stats[base + 2];
          if (stats[base + 4] - stats[base + 3] > 2.7066 * globe * 1.2) {
            const east = stats[base + 7];
            const west = stats[base + 2] - east;
            if (east >= west) {
              x = stats[base + 5] / east;
              y = stats[base + 6] / east;
            } else {
              x = (stats[base] - stats[base + 5]) / west;
              y = (stats[base + 1] - stats[base + 6]) / west;
            }
          }
          const alpha = fade * (active >= 0 && active !== label.chain ? 0.22 : 1);
          if (alpha <= 0) continue;
          ctx.globalAlpha = alpha;
          if (dotted) {
            ctx.lineJoin = "round";
            ctx.lineWidth = 5;
            ctx.strokeStyle = paper;
            ctx.strokeText(label.text, x, y);
            ctx.fillStyle = ink;
          } else {
            ctx.fillStyle = inkFor(colors[label.chain] || "#888");
          }
          ctx.fillText(label.text, x, y);
        }
      }

      ctx.globalAlpha = 1;
      const nextHover = hit && !dragging ? nearest : -1;
      if (nextHover !== hover) {
        hover = nextHover;
        if (options.onHover) options.onHover(hover);
      }
      publish();
    }

    function publish() {
      if (Math.abs(shown - lastShown) > 0.0012 || (shown !== lastShown && shown === target)) {
        lastShown = shown;
        if (options.onDrift) options.onDrift(shown);
      }
    }

    function localPoint(event) {
      const box = canvas.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    }

    let lastPoint = { x: 0, y: 0 };

    function onDown(event) {
      dragging = true;
      stopPlay();
      lastPoint = localPoint(event);
      momentum = 0;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    }

    function onMove(event) {
      const point = localPoint(event);
      pointer = event.pointerType === "touch" ? null : point;
      if (!dragging) return;
      stopPlay();
      const { globe } = fit(canvas.clientWidth, canvas.clientHeight);
      const degreesPerPixel = 360 / (2.7066 * globe * 2);
      rotation -= (point.x - lastPoint.x) * degreesPerPixel;
      momentum = -(point.x - lastPoint.x) * degreesPerPixel * 0.5;
      target = clamp(target + (point.y - lastPoint.y) * 0.0025);
      lastPoint = point;
    }

    function onUp(event) {
      dragging = false;
      canvas.releasePointerCapture?.(event.pointerId);
      canvas.style.cursor = "grab";
    }

    function onLeave() {
      pointer = null;
    }

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(draw);

    return {
      set(value) {
        stopPlay();
        target = clamp(value);
      },
      nudge(delta) {
        stopPlay();
        target = clamp(target + delta);
      },
      highlight(chain) {
        pinned = chain;
        lastKey = "";
      },
      retheme() {
        sea = read("--sea", "#e3ded6");
        ink = read("--ink", "#17131c");
        paper = read("--paper", "#f8f6f2");
        lastKey = "";
      },
      destroy() {
        dead = true;
        cancelAnimationFrame(frame);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        canvas.removeEventListener("pointerleave", onLeave);
      },
    };
  }

  window.mountPangeaMap = mountMap;
})();
