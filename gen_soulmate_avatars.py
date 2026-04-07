#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成灵魂伴侣头像图片
12星座 × 男女 = 24张 PNG 图片
尺寸: 200x200px，文件 < 30KB
"""

import os
import math
import struct
import zlib

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images', 'soulmate')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 12星座配置 (key, 中文名, 星座主色)
ZODIACS = [
    ('aries',       '白羊座',  (255, 107, 107)),
    ('taurus',      '金牛座',  (86, 197, 150)),
    ('gemini',      '双子座',  (255, 193, 68)),
    ('cancer',      '巨蟹座',  (135, 206, 235)),
    ('leo',         '狮子座',  (255, 165, 0)),
    ('virgo',       '处女座',  (147, 197, 253)),
    ('libra',       '天秤座',  (253, 186, 220)),
    ('scorpio',     '天蝎座',  (139, 92, 246)),
    ('sagittarius', '射手座',  (251, 113, 133)),
    ('capricorn',   '摩羯座',  (100, 116, 139)),
    ('aquarius',    '水瓶座',  (56, 189, 248)),
    ('pisces',      '双鱼座',  (167, 139, 250)),
]

# 男生背景渐变（上-下）
MALE_GRADIENTS = [
    ((59, 130, 246), (147, 197, 253)),
    ((16, 185, 129), (110, 231, 183)),
    ((245, 158, 11), (252, 211, 77)),
    ((99, 102, 241), (165, 180, 252)),
    ((239, 68, 68),  (252, 165, 165)),
    ((20, 184, 166), (94, 234, 212)),
    ((168, 85, 247), (216, 180, 254)),
    ((234, 179, 8),  (253, 224, 71)),
    ((236, 72, 153), (249, 168, 212)),
    ((71, 85, 105),  (148, 163, 184)),
    ((6, 182, 212),  (103, 232, 249)),
    ((124, 58, 237), (196, 181, 253)),
]

# 女生背景渐变
FEMALE_GRADIENTS = [
    ((244, 114, 182), (249, 168, 212)),
    ((251, 146, 60),  (253, 186, 116)),
    ((167, 139, 250), (196, 181, 253)),
    ((236, 72, 153),  (244, 114, 182)),
    ((245, 158, 11),  (252, 211, 77)),
    ((16, 185, 129),  (110, 231, 183)),
    ((99, 102, 241),  (165, 180, 252)),
    ((251, 113, 133), (253, 164, 175)),
    ((52, 211, 153),  (110, 231, 183)),
    ((192, 132, 252), (233, 213, 255)),
    ((56, 189, 248),  (125, 211, 252)),
    ((248, 113, 113), (252, 165, 165)),
]


def clamp(v, lo=0, hi=255):
    return max(lo, min(hi, v))


def lerp(a, b, t):
    return int(a + (b - a) * t)


def lerp_color(c1, c2, t):
    return (lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t))


class Canvas:
    def __init__(self, w, h):
        self.w = w
        self.h = h
        self.buf = bytearray(w * h * 4)  # RGBA flat buffer

    def _idx(self, x, y):
        return (y * self.w + x) * 4

    def get(self, x, y):
        i = self._idx(x, y)
        return self.buf[i], self.buf[i+1], self.buf[i+2], self.buf[i+3]

    def put(self, x, y, r, g, b, a=255):
        if 0 <= x < self.w and 0 <= y < self.h:
            i = self._idx(x, y)
            self.buf[i:i+4] = bytes([clamp(r), clamp(g), clamp(b), clamp(a)])

    def blend(self, x, y, r, g, b, a=255):
        if 0 <= x < self.w and 0 <= y < self.h:
            i = self._idx(x, y)
            bg_r, bg_g, bg_b, bg_a = self.buf[i], self.buf[i+1], self.buf[i+2], self.buf[i+3]
            fa = a / 255.0
            self.buf[i]   = clamp(int(bg_r * (1 - fa) + r * fa))
            self.buf[i+1] = clamp(int(bg_g * (1 - fa) + g * fa))
            self.buf[i+2] = clamp(int(bg_b * (1 - fa) + b * fa))
            self.buf[i+3] = clamp(int(bg_a + a * (1 - bg_a / 255.0)))

    def fill_bg_gradient(self, c1, c2):
        for y in range(self.h):
            t = y / (self.h - 1)
            c = lerp_color(c1, c2, t)
            for x in range(self.w):
                self.put(x, y, c[0], c[1], c[2])

    def circle(self, cx, cy, r, col, alpha=255):
        r2 = r * r
        for dy in range(-r-1, r+2):
            for dx in range(-r-1, r+2):
                d2 = dx*dx + dy*dy
                d = math.sqrt(d2)
                if d <= r:
                    self.blend(cx+dx, cy+dy, col[0], col[1], col[2], alpha)
                elif d <= r + 1.0:
                    aa = int((r + 1 - d) * alpha)
                    self.blend(cx+dx, cy+dy, col[0], col[1], col[2], aa)

    def ellipse(self, cx, cy, rx, ry, col, alpha=255):
        for dy in range(-ry-1, ry+2):
            for dx in range(-rx-1, rx+2):
                fx = dx / max(rx, 1)
                fy = dy / max(ry, 1)
                d = math.sqrt(fx*fx + fy*fy)
                if d <= 1.0:
                    self.blend(cx+dx, cy+dy, col[0], col[1], col[2], alpha)
                elif d <= 1.0 + 1.0/max(rx, ry):
                    aa = int((1.0 + 1.0/max(rx, ry) - d) * max(rx, ry) * alpha / 2)
                    self.blend(cx+dx, cy+dy, col[0], col[1], col[2], clamp(aa))

    def rect(self, x, y, w, h, col, alpha=255):
        for dy in range(h):
            for dx in range(w):
                self.blend(x+dx, y+dy, col[0], col[1], col[2], alpha)

    def line(self, x0, y0, x1, y1, col, alpha=255, thickness=1):
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        while True:
            for t in range(thickness):
                self.blend(x0 + t, y0, col[0], col[1], col[2], alpha)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy

    def to_png(self):
        w, h = self.w, self.h
        raw_rows = []
        for y in range(h):
            row_bytes = bytearray([0])  # filter None
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


# 肤色常量
SKIN = (255, 218, 185)
HAIR_DARK = (55, 30, 10)
HAIR_MED = (80, 45, 15)
WHITE = (255, 255, 255)


def draw_male(c, bg1, bg2, accent):
    W, H = c.w, c.h
    cx, cy = W // 2, int(H * 0.42)

    # 衬衫/身体
    body_col = lerp_color(bg1, (50, 60, 90), 0.6)
    c.ellipse(cx, int(H * 0.80), int(W * 0.36), int(H * 0.22), body_col)
    # 领带/装饰
    c.ellipse(cx, int(H * 0.72), int(W * 0.06), int(H * 0.06), accent)

    # 脖子
    c.rect(cx - int(W*0.06), int(H*0.58), int(W*0.12), int(H*0.09), SKIN)

    # 头发（底层）
    c.circle(cx, cy - int(H*0.05), int(W*0.25), HAIR_DARK)
    # 头发两鬓
    c.ellipse(cx - int(W*0.18), cy, int(W*0.05), int(H*0.14), HAIR_DARK)
    c.ellipse(cx + int(W*0.18), cy, int(W*0.05), int(H*0.14), HAIR_DARK)

    # 脸
    c.ellipse(cx, cy, int(W*0.20), int(H*0.23), SKIN)

    # 短刘海
    c.ellipse(cx, cy - int(H*0.21), int(W*0.21), int(H*0.06), HAIR_DARK)

    # 眉毛
    for side in [-1, 1]:
        bx = cx + side * int(W*0.08)
        for i in range(-int(W*0.055), int(W*0.055)+1):
            c.blend(bx+i, cy - int(H*0.10), 55, 35, 15, 230)
            c.blend(bx+i, cy - int(H*0.10)+1, 55, 35, 15, 180)

    # 眼睛
    eye_y = cy - int(H * 0.04)
    for side in [-1, 1]:
        ex = cx + side * int(W * 0.085)
        c.ellipse(ex, eye_y, int(W*0.055), int(H*0.030), (35, 22, 12))
        c.circle(ex - 1, eye_y - 2, 3, WHITE)
        c.circle(ex - 1, eye_y - 2, 1, (35, 22, 12))

    # 嘴（微笑）
    for i in range(-5, 6):
        my = cy + int(H*0.11) + (1 if abs(i) >= 4 else 0)
        c.blend(cx+i, my, 160, 70, 80, 210)

    # 星座装饰点
    c.circle(cx + int(W*0.16), cy - int(H*0.22), 5, accent, 200)
    c.circle(cx - int(W*0.16), cy - int(H*0.22), 5, accent, 140)


def draw_female(c, bg1, bg2, accent):
    W, H = c.w, c.h
    cx, cy = W // 2, int(H * 0.40)

    # 裙子/身体
    body_col = lerp_color(bg2, (200, 140, 180), 0.5)
    c.ellipse(cx, int(H * 0.80), int(W * 0.30), int(H * 0.24), body_col)

    # 脖子
    c.rect(cx - int(W*0.055), int(H*0.58), int(W*0.11), int(H*0.09), SKIN)

    # 长发（底层，两侧）
    c.ellipse(cx, cy + int(H*0.12), int(W*0.28), int(H*0.38), HAIR_MED)
    # 头发顶部
    c.circle(cx, cy - int(H*0.08), int(W*0.27), HAIR_MED)

    # 脸
    c.ellipse(cx, cy, int(W*0.19), int(H*0.22), SKIN)

    # 刘海
    c.ellipse(cx, cy - int(H*0.19), int(W*0.19), int(H*0.07), HAIR_MED)
    c.ellipse(cx - int(W*0.15), cy - int(H*0.14), int(W*0.07), int(H*0.08), HAIR_MED)
    c.ellipse(cx + int(W*0.15), cy - int(H*0.14), int(W*0.07), int(H*0.08), HAIR_MED)

    # 眼睛（杏仁形，稍大）
    eye_y = cy - int(H * 0.04)
    for side in [-1, 1]:
        ex = cx + side * int(W * 0.077)
        c.ellipse(ex, eye_y, int(W*0.052), int(H*0.033), (40, 25, 15))
        c.circle(ex - 1, eye_y - 2, 3, WHITE)
        c.circle(ex - 1, eye_y - 2, 1, (40, 25, 15))

    # 腮红
    for side in [-1, 1]:
        bx = cx + side * int(W * 0.13)
        c.ellipse(bx, cy + int(H*0.05), int(W*0.07), int(H*0.04), (255, 150, 150), 70)

    # 嘴（微笑，樱桃色）
    for i in range(-5, 6):
        my = cy + int(H*0.105) + (1 if abs(i) >= 4 else 0)
        c.blend(cx+i, my, 210, 80, 100, 220)

    # 发卡装饰
    c.circle(cx + int(W*0.14), cy - int(H*0.21), 6, accent, 230)
    c.circle(cx + int(W*0.14), cy - int(H*0.21), 3, WHITE, 200)


def generate_avatar(zodiac_key, gender, grad, accent_col, out_path):
    W, H = 200, 200
    c = Canvas(W, H)
    bg1, bg2 = grad

    # 渐变背景
    c.fill_bg_gradient(bg1, bg2)

    # 背景装饰（轻淡圆圈）
    for dx, dy in [(-72, -72), (72, -72), (-72, 72), (72, 72)]:
        c.circle(W//2 + dx, H//2 + dy, 14, WHITE, 35)

    # 星座装饰（左上圆点）
    c.circle(24, 24, 14, accent_col, 170)
    c.circle(24, 24, 7, WHITE, 120)

    if gender == 'male':
        draw_male(c, bg1, bg2, accent_col)
    else:
        draw_female(c, bg1, bg2, accent_col)

    with open(out_path, 'wb') as f:
        f.write(c.to_png())


def main():
    print(f'输出目录: {OUTPUT_DIR}')
    count = 0
    total_size = 0

    for i, (key, name, accent) in enumerate(ZODIACS):
        # 男生头像
        mp = os.path.join(OUTPUT_DIR, f'{key}_male.png')
        generate_avatar(key, 'male', MALE_GRADIENTS[i], accent, mp)
        sz = os.path.getsize(mp)
        total_size += sz
        print(f'  {name} 男 → {key}_male.png  {sz//1024}KB')
        count += 1

        # 女生头像
        fp = os.path.join(OUTPUT_DIR, f'{key}_female.png')
        generate_avatar(key, 'female', FEMALE_GRADIENTS[i], accent, fp)
        sz = os.path.getsize(fp)
        total_size += sz
        print(f'  {name} 女 → {key}_female.png  {sz//1024}KB')
        count += 1

    print(f'\n✅ 共生成 {count} 张图片')
    print(f'   总大小: {total_size//1024}KB ({total_size//1024//count}KB/张)')


if __name__ == '__main__':
    main()
