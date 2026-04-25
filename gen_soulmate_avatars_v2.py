#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成精美星座配对头像 v2 - 插画风格
12星座 × 男女 = 24张 PNG 图片
尺寸: 400x400px，风格：扁平插画风，高颜值
"""

import os
import math
import struct
import zlib
import random

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'soulmate')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 12星座配置 (key, 中文名, 主色, 辅色, 强调色)
ZODIACS = [
    ('aries',       '白羊座',  (255, 82,  82),  (255, 155, 80),  (255, 220, 180)),
    ('taurus',      '金牛座',  (68,  190, 140),  (92,  210, 100),  (200, 240, 200)),
    ('gemini',      '双子座',  (255, 200, 60),   (255, 160, 60),  (255, 240, 180)),
    ('cancer',      '巨蟹座',  (100, 190, 230),  (140, 210, 255), (210, 240, 255)),
    ('leo',         '狮子座',  (255, 165, 0),    (255, 200, 50),  (255, 235, 180)),
    ('virgo',       '处女座',  (130, 160, 240),  (170, 200, 255), (220, 230, 255)),
    ('libra',       '天秤座',  (240, 150, 200),  (255, 180, 220), (255, 220, 240)),
    ('scorpio',     '天蝎座',  (120, 70,  200),  (160, 100, 240), (210, 180, 255)),
    ('sagittarius', '射手座',  (240, 80,  120),  (255, 130, 100), (255, 200, 190)),
    ('capricorn',   '摩羯座',  (80,  110, 140),  (110, 150, 180), (200, 220, 240)),
    ('aquarius',    '水瓶座',  (40,  175, 220),  (80,  210, 255), (200, 240, 255)),
    ('pisces',      '双鱼座',  (150, 100, 220),  (180, 140, 255), (225, 210, 255)),
]

def clamp(v, lo=0, hi=255):
    return max(lo, min(hi, int(v)))

def lerp(a, b, t):
    return a + (b - a) * t

def lerp_color(c1, c2, t):
    return (clamp(lerp(c1[0], c2[0], t)),
            clamp(lerp(c1[1], c2[1], t)),
            clamp(lerp(c1[2], c2[2], t)))

def alpha_blend(bg, fg, alpha):
    """Alpha blend fg onto bg"""
    a = alpha / 255.0
    return (clamp(bg[0] * (1-a) + fg[0] * a),
            clamp(bg[1] * (1-a) + fg[1] * a),
            clamp(bg[2] * (1-a) + fg[2] * a))


class Canvas:
    def __init__(self, w, h):
        self.w = w
        self.h = h
        self.buf = bytearray(w * h * 4)

    def _idx(self, x, y):
        return (y * self.w + x) * 4

    def get_pixel(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            i = self._idx(x, y)
            return tuple(self.buf[i:i+4])
        return (0, 0, 0, 0)

    def put(self, x, y, r, g, b, a=255):
        if 0 <= x < self.w and 0 <= y < self.h:
            i = self._idx(x, y)
            if a == 255:
                self.buf[i:i+4] = bytes([clamp(r), clamp(g), clamp(b), 255])
            else:
                bg = self.buf[i:i+3]
                fa = a / 255.0
                self.buf[i]   = clamp(bg[0] * (1-fa) + r * fa)
                self.buf[i+1] = clamp(bg[1] * (1-fa) + g * fa)
                self.buf[i+2] = clamp(bg[2] * (1-fa) + b * fa)
                self.buf[i+3] = 255

    def fill_radial_gradient(self, cx, cy, r_inner, r_outer, c_inner, c_outer):
        """Fill radial gradient from center"""
        for y in range(self.h):
            for x in range(self.w):
                dx = x - cx
                dy = y - cy
                d = math.sqrt(dx*dx + dy*dy)
                if d <= r_outer:
                    if d <= r_inner:
                        t = 0.0
                    else:
                        t = (d - r_inner) / (r_outer - r_inner)
                    t = min(1.0, max(0.0, t))
                    c = lerp_color(c_inner, c_outer, t)
                    self.put(x, y, c[0], c[1], c[2])

    def fill_bg_gradient(self, c1, c2, angle_deg=160):
        """Fill diagonal gradient background"""
        angle = math.radians(angle_deg)
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)
        for y in range(self.h):
            for x in range(self.w):
                # Project onto gradient direction
                t = (x * cos_a + y * sin_a) / (self.w * abs(cos_a) + self.h * abs(sin_a))
                t = max(0.0, min(1.0, t))
                c = lerp_color(c1, c2, t)
                self.put(x, y, c[0], c[1], c[2])

    def circle(self, cx, cy, r, col, alpha=255, aa=True):
        """Draw filled circle with anti-aliasing"""
        for dy in range(-r-2, r+3):
            for dx in range(-r-2, r+3):
                d = math.sqrt(dx*dx + dy*dy)
                if d <= r:
                    self.put(cx+dx, cy+dy, col[0], col[1], col[2], alpha)
                elif aa and d <= r + 1.5:
                    aa_alpha = int((r + 1.5 - d) / 1.5 * alpha)
                    self.put(cx+dx, cy+dy, col[0], col[1], col[2], aa_alpha)

    def ellipse(self, cx, cy, rx, ry, col, alpha=255, aa=True):
        """Draw filled ellipse with anti-aliasing"""
        for dy in range(-ry-2, ry+3):
            for dx in range(-rx-2, rx+3):
                fx = dx / max(rx, 0.5)
                fy = dy / max(ry, 0.5)
                d = math.sqrt(fx*fx + fy*fy)
                if d <= 1.0:
                    self.put(cx+dx, cy+dy, col[0], col[1], col[2], alpha)
                elif aa:
                    edge = 1.0 + 1.5/max(rx, ry)
                    if d <= edge:
                        aa_alpha = int((edge - d) / (edge - 1.0) * alpha)
                        self.put(cx+dx, cy+dy, col[0], col[1], col[2], aa_alpha)

    def ring(self, cx, cy, r_outer, r_inner, col, alpha=255):
        """Draw a ring (donut shape)"""
        for dy in range(-r_outer-2, r_outer+3):
            for dx in range(-r_outer-2, r_outer+3):
                d = math.sqrt(dx*dx + dy*dy)
                if r_inner <= d <= r_outer:
                    self.put(cx+dx, cy+dy, col[0], col[1], col[2], alpha)
                elif d < r_inner and d > r_inner - 1.5:
                    aa_alpha = int((d - (r_inner - 1.5)) / 1.5 * alpha)
                    self.put(cx+dx, cy+dy, col[0], col[1], col[2], aa_alpha)
                elif d > r_outer and d < r_outer + 1.5:
                    aa_alpha = int((r_outer + 1.5 - d) / 1.5 * alpha)
                    self.put(cx+dx, cy+dy, col[0], col[1], col[2], aa_alpha)

    def arc_dots(self, cx, cy, radius, start_angle, end_angle, n_dots, col, dot_r=3, alpha=200):
        """Draw dots along an arc"""
        for i in range(n_dots):
            angle = start_angle + (end_angle - start_angle) * i / max(n_dots-1, 1)
            x = cx + int(radius * math.cos(angle))
            y = cy + int(radius * math.sin(angle))
            self.circle(x, y, dot_r, col, alpha)

    def rounded_rect(self, x, y, w, h, corner_r, col, alpha=255):
        """Draw rounded rectangle"""
        # Main body
        self.rect(x + corner_r, y, w - 2*corner_r, h, col, alpha)
        self.rect(x, y + corner_r, w, h - 2*corner_r, col, alpha)
        # Corners
        for cx, cy in [(x+corner_r, y+corner_r), (x+w-corner_r, y+corner_r),
                       (x+corner_r, y+h-corner_r), (x+w-corner_r, y+h-corner_r)]:
            self.circle(cx, cy, corner_r, col, alpha)

    def rect(self, x, y, w, h, col, alpha=255):
        """Draw filled rectangle"""
        for dy in range(h):
            for dx in range(w):
                self.put(x+dx, y+dy, col[0], col[1], col[2], alpha)

    def star(self, cx, cy, outer_r, inner_r, n_points, col, alpha=255):
        """Draw a star polygon"""
        points = []
        for i in range(n_points * 2):
            angle = math.pi * i / n_points - math.pi / 2
            r = outer_r if i % 2 == 0 else inner_r
            points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
        # Fill using scan line
        min_y = int(min(p[1] for p in points))
        max_y = int(max(p[1] for p in points)) + 1
        for scan_y in range(max_y - min_y + 1):
            y = min_y + scan_y
            intersections = []
            n = len(points)
            for i in range(n):
                x0, y0 = points[i]
                x1, y1 = points[(i+1) % n]
                if (y0 <= y < y1) or (y1 <= y < y0):
                    if abs(y1 - y0) > 0.001:
                        x = x0 + (y - y0) * (x1 - x0) / (y1 - y0)
                        intersections.append(x)
            intersections.sort()
            for j in range(0, len(intersections)-1, 2):
                x_start = int(intersections[j])
                x_end = int(intersections[j+1])
                for x in range(x_start, x_end+1):
                    self.put(x, y, col[0], col[1], col[2], alpha)

    def constellation_pattern(self, cx, cy, radius, col, n_stars=6, seed=42):
        """Draw a subtle constellation pattern"""
        rng = random.Random(seed)
        star_positions = []
        for _ in range(n_stars):
            angle = rng.uniform(0, 2 * math.pi)
            dist = rng.uniform(0.3, 0.9) * radius
            sx = cx + int(dist * math.cos(angle))
            sy = cy + int(dist * math.sin(angle))
            star_positions.append((sx, sy))
            self.circle(sx, sy, rng.randint(2, 4), col, 180)

        # Connect some stars with thin lines
        for i in range(min(len(star_positions)-1, 4)):
            x0, y0 = star_positions[i]
            x1, y1 = star_positions[(i+1) % len(star_positions)]
            self._thin_line(x0, y0, x1, y1, col, 80)

    def _thin_line(self, x0, y0, x1, y1, col, alpha):
        """Draw a thin line"""
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        while True:
            self.put(x0, y0, col[0], col[1], col[2], alpha)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy

    def glow(self, cx, cy, r, col, max_alpha=120, layers=5):
        """Draw a glow effect"""
        for i in range(layers, 0, -1):
            current_r = r + (layers - i) * 8
            current_alpha = int(max_alpha * (i / layers) * 0.4)
            self.circle(cx, cy, current_r, col, current_alpha)

    def to_png(self):
        w, h = self.w, self.h
        raw_rows = []
        for y in range(h):
            row_bytes = bytearray([0])
            for x in range(w):
                i = (y * w + x) * 4
                row_bytes.extend(self.buf[i:i+4])
            raw_rows.append(bytes(row_bytes))
        raw_data = b''.join(raw_rows)
        compressed = zlib.compress(raw_data, 6)

        def chunk(tag, data):
            payload = tag + data
            return struct.pack('>I', len(data)) + payload + struct.pack('>I', zlib.crc32(payload) & 0xffffffff)

        ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
        return (b'\x89PNG\r\n\x1a\n'
                + chunk(b'IHDR', ihdr)
                + chunk(b'IDAT', compressed)
                + chunk(b'IEND', b''))


# ===== Skin & Hair colors =====
SKIN_LIGHT = (255, 218, 185)
SKIN_WARM  = (255, 200, 168)
SKIN_COOL  = (248, 212, 192)
HAIR_BLACK = (45, 28, 18)
HAIR_DARK  = (65, 42, 28)
HAIR_BROWN = (95, 58, 32)
HAIR_AMBER = (140, 80, 30)
WHITE      = (255, 255, 255)
RED_LIPS   = (210, 70, 90)
PINK_LIPS  = (230, 110, 120)
LIP_MALE   = (185, 80, 80)


def draw_female_face(c, W, H, cx, cy, hair_col, accent, skin=SKIN_LIGHT):
    """Draw an attractive female face"""
    # -- Long flowing hair (back layer) --
    hair_back_col = lerp_color(hair_col, (20, 10, 5), 0.3)
    c.ellipse(cx, cy + int(H*0.18), int(W*0.30), int(H*0.42), hair_back_col)

    # -- Neck --
    neck_shadow = lerp_color(skin, (180, 130, 100), 0.2)
    c.rect(cx - int(W*0.055), int(H*0.60), int(W*0.11), int(H*0.10), neck_shadow)
    c.rect(cx - int(W*0.048), int(H*0.60), int(W*0.096), int(H*0.10), skin)

    # -- Shoulders/body --
    body_col = lerp_color(accent, (240, 230, 250), 0.6)
    c.ellipse(cx, int(H*0.82), int(W*0.33), int(H*0.20), body_col)
    # Collar highlights
    collar = lerp_color(body_col, WHITE, 0.3)
    c.ellipse(cx, int(H*0.72), int(W*0.10), int(H*0.06), collar)

    # -- Face shape (slightly tapered jaw) --
    c.ellipse(cx, cy, int(W*0.195), int(H*0.245), skin)
    # Jaw taper
    jaw_col = lerp_color(skin, (235, 195, 160), 0.15)
    c.ellipse(cx, cy + int(H*0.085), int(W*0.16), int(H*0.14), jaw_col)

    # -- Hair top (front layer) --
    # Side parts
    c.ellipse(cx - int(W*0.13), cy - int(H*0.14), int(W*0.10), int(H*0.10), hair_col)
    c.ellipse(cx + int(W*0.13), cy - int(H*0.14), int(W*0.10), int(H*0.10), hair_col)
    # Top crown
    c.ellipse(cx, cy - int(H*0.20), int(W*0.20), int(H*0.09), hair_col)
    c.circle(cx, cy - int(H*0.23), int(W*0.17), hair_col)
    # Highlight on hair
    hair_highlight = lerp_color(hair_col, WHITE, 0.35)
    c.ellipse(cx - int(W*0.04), cy - int(H*0.25), int(W*0.07), int(H*0.04), hair_highlight, alpha=160)

    # -- Eyebrows (arched, feminine) --
    eyebrow_col = lerp_color(hair_col, (30, 15, 5), 0.4)
    for side in [-1, 1]:
        bx = cx + side * int(W*0.078)
        # Arch shape: higher in middle
        for i in range(-int(W*0.048), int(W*0.048)+1):
            arch_offset = int(2 * (1 - (i / (W*0.048))**2))
            ey = cy - int(H*0.105) - arch_offset
            c.put(bx+i, ey,   eyebrow_col[0], eyebrow_col[1], eyebrow_col[2], 230)
            c.put(bx+i, ey+1, eyebrow_col[0], eyebrow_col[1], eyebrow_col[2], 160)

    # -- Eyes (larger, more expressive) --
    eye_y = cy - int(H*0.055)
    for side in [-1, 1]:
        ex = cx + side * int(W*0.079)
        # Eye white
        c.ellipse(ex, eye_y, int(W*0.060), int(H*0.035), (248, 248, 255))
        # Iris (colored)
        iris_col = lerp_color(accent, (40, 30, 20), 0.3)
        c.circle(ex, eye_y, int(W*0.038), iris_col)
        # Pupil
        c.circle(ex, eye_y, int(W*0.020), (20, 12, 8))
        # Eye shine
        c.circle(ex - int(W*0.015), eye_y - int(H*0.012), int(W*0.012), WHITE, 240)
        c.circle(ex + int(W*0.010), eye_y + int(H*0.005), int(W*0.006), WHITE, 180)
        # Upper lash
        lash_col = (30, 18, 12)
        for i in range(-int(W*0.058), int(W*0.058)+1):
            c.put(ex+i, eye_y - int(H*0.033), lash_col[0], lash_col[1], lash_col[2], 200)
            c.put(ex+i, eye_y - int(H*0.034), lash_col[0], lash_col[1], lash_col[2], 140)

    # -- Nose (subtle, feminine) --
    nose_col = lerp_color(skin, (210, 155, 120), 0.3)
    c.ellipse(cx - int(W*0.022), cy + int(H*0.040), int(W*0.018), int(H*0.012), nose_col, 150)
    c.ellipse(cx + int(W*0.022), cy + int(H*0.040), int(W*0.018), int(H*0.012), nose_col, 150)

    # -- Blush (cheeks) --
    blush_col = lerp_color(accent, (255, 160, 160), 0.5)
    for side in [-1, 1]:
        bx = cx + side * int(W*0.128)
        c.ellipse(bx, cy + int(H*0.045), int(W*0.072), int(H*0.042), blush_col, 80)

    # -- Lips (full, feminine) --
    # Upper lip
    c.ellipse(cx, cy + int(H*0.098), int(W*0.055), int(H*0.016), RED_LIPS)
    # Lower lip
    c.ellipse(cx, cy + int(H*0.115), int(W*0.052), int(H*0.018), lerp_color(RED_LIPS, (255,180,180), 0.3))
    # Lip line
    for i in range(-int(W*0.045), int(W*0.045)+1):
        c.put(cx+i, cy+int(H*0.097), RED_LIPS[0]-20, RED_LIPS[1]-20, RED_LIPS[2]-20, 160)
    # Lip shine
    c.ellipse(cx - int(W*0.01), cy + int(H*0.112), int(W*0.025), int(H*0.008), WHITE, 100)

    # -- Hair accessories (using accent color) --
    # Small decorative pin
    c.circle(cx + int(W*0.15), cy - int(H*0.20), int(W*0.022), accent, 220)
    c.circle(cx + int(W*0.15), cy - int(H*0.20), int(W*0.010), WHITE, 200)
    # Small star decoration
    c.star(cx - int(W*0.12), cy - int(H*0.24), int(W*0.018), int(W*0.008), 5, accent, 200)


def draw_male_face(c, W, H, cx, cy, hair_col, accent, skin=SKIN_WARM):
    """Draw an attractive male face"""
    # -- Hair (back, slightly messy) --
    hair_back = lerp_color(hair_col, (15, 8, 3), 0.3)
    c.circle(cx, cy - int(H*0.08), int(W*0.22), hair_back)
    c.ellipse(cx - int(W*0.16), cy - int(H*0.03), int(W*0.06), int(H*0.14), hair_back)
    c.ellipse(cx + int(W*0.16), cy - int(H*0.03), int(W*0.06), int(H*0.14), hair_back)

    # -- Neck (slightly wider) --
    neck_shadow = lerp_color(skin, (170, 120, 90), 0.2)
    c.rect(cx - int(W*0.068), int(H*0.60), int(W*0.136), int(H*0.10), neck_shadow)
    c.rect(cx - int(W*0.058), int(H*0.60), int(W*0.116), int(H*0.10), skin)

    # -- Shoulders/body (wider, more squared) --
    body_col = lerp_color(accent, (50, 60, 90), 0.7)
    c.ellipse(cx, int(H*0.82), int(W*0.38), int(H*0.20), body_col)
    # Shirt collar
    collar_light = lerp_color(body_col, WHITE, 0.4)
    c.ellipse(cx - int(W*0.04), int(H*0.70), int(W*0.05), int(H*0.05), collar_light)
    c.ellipse(cx + int(W*0.04), int(H*0.70), int(W*0.05), int(H*0.05), collar_light)
    # Tie/accent
    c.ellipse(cx, int(H*0.74), int(W*0.035), int(H*0.055), accent)

    # -- Face shape (stronger jaw) --
    c.ellipse(cx, cy, int(W*0.20), int(H*0.245), skin)
    # Jaw slightly wider/squarer
    jaw_col = lerp_color(skin, (220, 180, 150), 0.15)
    c.ellipse(cx, cy + int(H*0.095), int(W*0.185), int(H*0.12), jaw_col)

    # -- Hair (front, styled) --
    # Main top
    c.ellipse(cx, cy - int(H*0.22), int(W*0.20), int(H*0.08), hair_col)
    c.circle(cx, cy - int(H*0.22), int(W*0.17), hair_col)
    # Side sweep
    c.ellipse(cx - int(W*0.11), cy - int(H*0.19), int(W*0.09), int(H*0.06), hair_col)
    # Highlight
    hair_highlight = lerp_color(hair_col, WHITE, 0.3)
    c.ellipse(cx + int(W*0.03), cy - int(H*0.26), int(W*0.06), int(H*0.035), hair_highlight, alpha=140)

    # -- Eyebrows (straighter, thicker, masculine) --
    eyebrow_col = lerp_color(hair_col, (25, 12, 4), 0.4)
    for side in [-1, 1]:
        bx = cx + side * int(W*0.082)
        for i in range(-int(W*0.058), int(W*0.058)+1):
            slight_arch = int(0.5 * (1 - abs(i) / (W*0.058)))
            ey = cy - int(H*0.098) - slight_arch
            c.put(bx+i, ey,   eyebrow_col[0], eyebrow_col[1], eyebrow_col[2], 240)
            c.put(bx+i, ey+1, eyebrow_col[0], eyebrow_col[1], eyebrow_col[2], 180)
            c.put(bx+i, ey+2, eyebrow_col[0], eyebrow_col[1], eyebrow_col[2], 80)

    # -- Eyes (slightly narrower, intense) --
    eye_y = cy - int(H*0.052)
    for side in [-1, 1]:
        ex = cx + side * int(W*0.082)
        # Eye white
        c.ellipse(ex, eye_y, int(W*0.058), int(H*0.032), (248, 248, 255))
        # Iris
        iris_col = lerp_color(accent, (30, 22, 15), 0.4)
        c.circle(ex, eye_y, int(W*0.036), iris_col)
        # Pupil
        c.circle(ex, eye_y, int(W*0.018), (18, 10, 6))
        # Shine
        c.circle(ex - int(W*0.013), eye_y - int(H*0.010), int(W*0.010), WHITE, 230)
        c.circle(ex + int(W*0.008), eye_y + int(H*0.004), int(W*0.005), WHITE, 160)
        # Lash (lighter for male)
        lash_col = (40, 25, 15)
        for i in range(-int(W*0.055), int(W*0.055)+1):
            c.put(ex+i, eye_y - int(H*0.030), lash_col[0], lash_col[1], lash_col[2], 180)

    # -- Nose (more prominent) --
    nose_shadow = lerp_color(skin, (195, 140, 105), 0.35)
    c.ellipse(cx, cy + int(H*0.045), int(W*0.015), int(H*0.035), nose_shadow, 120)
    c.ellipse(cx - int(W*0.026), cy + int(H*0.052), int(W*0.020), int(H*0.014), nose_shadow, 160)
    c.ellipse(cx + int(W*0.026), cy + int(H*0.052), int(W*0.020), int(H*0.014), nose_shadow, 160)

    # -- Subtle cheekbone shadow --
    cheek_shadow = lerp_color(skin, (200, 148, 115), 0.25)
    for side in [-1, 1]:
        bx = cx + side * int(W*0.145)
        c.ellipse(bx, cy + int(H*0.035), int(W*0.062), int(H*0.035), cheek_shadow, 60)

    # -- Lips (thinner, more closed for male) --
    c.ellipse(cx, cy + int(H*0.099), int(W*0.052), int(H*0.014), LIP_MALE)
    c.ellipse(cx, cy + int(H*0.113), int(W*0.048), int(H*0.014), lerp_color(LIP_MALE, (230, 170, 150), 0.4))
    for i in range(-int(W*0.042), int(W*0.042)+1):
        c.put(cx+i, cy+int(H*0.098), LIP_MALE[0]-15, LIP_MALE[1]-15, LIP_MALE[2]-15, 150)

    # -- Accent decoration --
    c.circle(cx + int(W*0.17), cy - int(H*0.22), int(W*0.018), accent, 200)
    c.circle(cx + int(W*0.17), cy - int(H*0.22), int(W*0.008), WHITE, 180)


def draw_zodiac_decoration(c, W, H, zodiac_key, primary, accent, gender):
    """Draw zodiac-specific decorative elements around the portrait"""
    cx, cy = W//2, H//2

    # Background constellation
    c.constellation_pattern(cx, cy, W*0.45, lerp_color(accent, WHITE, 0.7), seed=hash(zodiac_key) % 9999)

    # Zodiac-specific top decoration
    deco = {
        'aries':       lambda: [c.arc_dots(cx, cy-int(H*0.42), int(W*0.12), -1.0, 1.0, 5, accent, 4)],
        'taurus':      lambda: [c.circle(cx-int(W*0.12), cy-int(H*0.42), 6, accent, 180), c.circle(cx+int(W*0.12), cy-int(H*0.42), 6, accent, 180)],
        'gemini':      lambda: [c.star(cx-int(W*0.10), cy-int(H*0.40), 8, 4, 5, accent, 200), c.star(cx+int(W*0.10), cy-int(H*0.40), 8, 4, 5, accent, 200)],
        'cancer':      lambda: [c.arc_dots(cx, cy-int(H*0.40), int(W*0.16), -1.8, 1.8, 7, accent, 3)],
        'leo':         lambda: [c.star(cx, cy-int(H*0.42), 12, 5, 5, accent, 220)],
        'virgo':       lambda: [c.arc_dots(cx, cy-int(H*0.41), int(W*0.14), -2.0, 2.0, 6, accent, 3)],
        'libra':       lambda: [c.ring(cx, cy-int(H*0.41), 14, 10, accent, 160)],
        'scorpio':     lambda: [c.star(cx, cy-int(H*0.41), 10, 4, 8, accent, 200)],
        'sagittarius': lambda: [c.arc_dots(cx, cy-int(H*0.42), int(W*0.12), -0.8, 0.8, 4, accent, 4)],
        'capricorn':   lambda: [c.star(cx-int(W*0.08), cy-int(H*0.41), 8, 3, 4, accent, 180), c.star(cx+int(W*0.08), cy-int(H*0.41), 8, 3, 4, accent, 180)],
        'aquarius':    lambda: [c.arc_dots(cx, cy-int(H*0.43), int(W*0.18), -2.5, 2.5, 9, accent, 3)],
        'pisces':      lambda: [c.star(cx-int(W*0.12), cy-int(H*0.40), 9, 4, 6, accent, 190), c.star(cx+int(W*0.12), cy-int(H*0.40), 9, 4, 6, accent, 190)],
    }
    if zodiac_key in deco:
        deco[zodiac_key]()

    # Bottom small stars
    for i, (dx, dy) in enumerate([(-int(W*0.30), int(H*0.38)), (int(W*0.30), int(H*0.38)),
                                   (-int(W*0.38), int(H*0.20)), (int(W*0.38), int(H*0.20))]):
        star_col = lerp_color(primary, WHITE, 0.5)
        c.star(cx+dx, cy+dy, 7, 3, 5, star_col, 160 - i*15)


def generate_avatar(zodiac_key, gender, primary, secondary, accent, out_path, idx):
    W, H = 400, 400
    c = Canvas(W, H)
    cx, cy = W // 2, H // 2

    # ===== STEP 1: Background gradient =====
    bg_dark = lerp_color(primary, (20, 15, 35), 0.75)
    bg_light = lerp_color(secondary, (245, 240, 255), 0.55)
    c.fill_bg_gradient(bg_dark, bg_light, 145)

    # ===== STEP 2: Soft glow behind face =====
    glow_col = lerp_color(primary, WHITE, 0.5)
    c.glow(cx, cy, int(W*0.22), glow_col, max_alpha=100, layers=6)

    # ===== STEP 3: Inner circle frame =====
    # Shadow ring
    c.ring(cx, cy, int(W*0.455), int(W*0.415), (0, 0, 0), 60)
    # Colored ring
    c.ring(cx, cy, int(W*0.44), int(W*0.42), primary, 200)
    # Bright inner ring
    c.ring(cx, cy, int(W*0.42), int(W*0.415), lerp_color(primary, WHITE, 0.5), 180)

    # ===== STEP 4: Zodiac decorations =====
    draw_zodiac_decoration(c, W, H, zodiac_key, primary, accent, gender)

    # ===== STEP 5: Face portrait =====
    face_cy = int(H * 0.44)
    hair_options = [HAIR_BLACK, HAIR_DARK, HAIR_BROWN, HAIR_AMBER]
    hair_col = hair_options[(idx * 3 + (0 if gender == 'female' else 1)) % len(hair_options)]

    if gender == 'female':
        draw_female_face(c, W, H, cx, face_cy, hair_col, accent)
    else:
        draw_male_face(c, W, H, cx, face_cy, hair_col, accent)

    # ===== STEP 6: Outer corner decorations =====
    corner_col = lerp_color(primary, WHITE, 0.6)
    for cx2, cy2 in [(int(W*0.10), int(H*0.10)), (int(W*0.90), int(H*0.10)),
                      (int(W*0.10), int(H*0.90)), (int(W*0.90), int(H*0.90))]:
        c.star(cx2, cy2, 10, 4, 5, corner_col, 160)

    with open(out_path, 'wb') as f:
        f.write(c.to_png())


def main():
    print(f'输出目录: {OUTPUT_DIR}')
    count = 0
    total_size = 0

    for i, (key, name, primary, secondary, accent) in enumerate(ZODIACS):
        # 女生头像
        fp = os.path.join(OUTPUT_DIR, f'{key}_female.png')
        generate_avatar(key, 'female', primary, secondary, accent, fp, i)
        sz = os.path.getsize(fp)
        total_size += sz
        print(f'  {name} 女 → {key}_female.png  {sz//1024}KB')
        count += 1

        # 男生头像
        mp = os.path.join(OUTPUT_DIR, f'{key}_male.png')
        generate_avatar(key, 'male', primary, secondary, accent, mp, i)
        sz = os.path.getsize(mp)
        total_size += sz
        print(f'  {name} 男 → {key}_male.png  {sz//1024}KB')
        count += 1

    print(f'\nDone! Generated {count} images')
    print(f'   Total: {total_size//1024}KB, avg {total_size//1024//count}KB each')


if __name__ == '__main__':
    main()
