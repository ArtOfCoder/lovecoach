"""生成小程序 TabBar 图标 - 现代风格优化版"""
from PIL import Image, ImageDraw, ImageFilter
import os
import math

OUT = r"c:\Users\Administrator\WorkBuddy\20260328223626\lovecoach-miniapp\images"
os.makedirs(OUT, exist_ok=True)

# 颜色配置 - 现代配色
GRAY      = (138, 138, 160)     # 普通态 - 柔和的灰色
PINK      = (255, 107, 138)     # 选中态 - 主色调
PINK_LIGHT = (255, 140, 160)    # 选中态渐变
BG        = (0, 0, 0, 0)        # 透明背景

SIZE = 81   # 微信建议 81×81 px（@3x: 243×243）

def make_icon(name: str, draw_fn, color, size=SIZE, active=False):
    """创建图标，支持渐变效果"""
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)
    
    # 如果是选中态，添加渐变背景
    if active:
        # 绘制渐变圆形背景
        for i in range(size//2, 0, -1):
            ratio = i / (size//2)
            r = int(PINK[0] * (1 - ratio * 0.3))
            g = int(PINK[1] * (1 - ratio * 0.2))
            b = int(PINK[2] * (1 - ratio * 0.1))
            d.ellipse([size//2 - i, size//2 - i, size//2 + i, size//2 + i], 
                     fill=(r, g, b, int(30 * ratio)))
    
    draw_fn(d, color, size, active)
    img.save(os.path.join(OUT, name))

def home_fn(d, c, s, active=False):
    """首页 - 现代房子图标"""
    cx, cy = s // 2, s // 2
    house_w, house_h = 44, 36
    x1, y1 = cx - house_w//2, cy - house_h//2 + 4
    x2, y2 = x1 + house_w, y1 + house_h
    
    # 房子主体 - 圆角矩形
    d.rounded_rectangle([x1, y1+8, x2, y2], radius=6, fill=c)
    
    # 屋顶 - 三角形
    roof_pts = [(cx, y1-10), (x2+4, y1+8), (x1-4, y1+8)]
    d.polygon(roof_pts, fill=c)
    
    # 门
    d.rounded_rectangle([cx-6, y1+20, cx+6, y2], radius=3, fill=(255,255,255,180) if active else (248,248,252,200))
    
    # 窗户
    d.rounded_rectangle([x1+6, y1+14, x1+16, y1+24], radius=2, fill=(255,255,255,180) if active else (248,248,252,200))

def course_fn(d, c, s, active=False):
    """课程 - 书本图标"""
    cx, cy = s // 2, s // 2
    w, h = 40, 32
    x1, y1 = cx - w//2, cy - h//2
    x2, y2 = x1 + w, y1 + h
    
    # 书本主体
    d.rounded_rectangle([x1, y1, x2, y2], radius=4, fill=c)
    
    # 书页
    page_color = (255,255,255,180) if active else (248,248,252,200)
    d.rounded_rectangle([x1+4, y1+4, cx-2, y2-4], radius=2, fill=page_color)
    d.rounded_rectangle([cx+2, y1+4, x2-4, y2-4], radius=2, fill=page_color)
    
    # 书脊
    d.line([(cx, y1+4), (cx, y2-4)], fill=c, width=2)
    
    # 书签
    bookmark_pts = [(cx+8, y1+2), (cx+14, y1+2), (cx+11, y1+10)]
    d.polygon(bookmark_pts, fill=(255,200,100,230) if active else c)

def ai_fn(d, c, s, active=False):
    """AI - 智能助手图标"""
    cx, cy = s // 2, s // 2
    
    # 头部 - 圆角矩形
    head_w, head_h = 38, 32
    x1, y1 = cx - head_w//2, cy - head_h//2 - 2
    d.rounded_rectangle([x1, y1, x1+head_w, y1+head_h], radius=12, fill=c)
    
    # 眼睛 - 圆形
    eye_color = (255,255,255,200) if active else (248,248,252,200)
    d.ellipse([cx-10, y1+10, cx-4, y1+16], fill=eye_color)
    d.ellipse([cx+4, y1+10, cx+10, y1+16], fill=eye_color)
    
    # 天线
    d.line([(cx-8, y1), (cx-12, y1-8)], fill=c, width=3)
    d.line([(cx+8, y1), (cx+12, y1-8)], fill=c, width=3)
    d.ellipse([cx-14, y1-12, cx-10, y1-8], fill=c)
    d.ellipse([cx+10, y1-12, cx+14, y1-8], fill=c)
    
    # 身体/底座
    d.rounded_rectangle([cx-14, y1+head_h-2, cx+14, y1+head_h+10], radius=6, fill=c)
    
    # 胸前的AI标志
    d.rounded_rectangle([cx-6, y1+head_h+1, cx+6, y1+head_h+7], radius=2, 
                       fill=(255,255,255,150) if active else (248,248,252,150))

def topic_fn(d, c, s, active=False):
    """话题 - 对话气泡"""
    cx, cy = s // 2, s // 2
    
    # 主气泡
    bubble_w, bubble_h = 44, 34
    x1, y1 = cx - bubble_w//2, cy - bubble_h//2 - 2
    d.rounded_rectangle([x1, y1, x1+bubble_w, y1+bubble_h], radius=10, fill=c)
    
    # 气泡尾巴
    tail_pts = [(x1+12, y1+bubble_h-2), (x1+6, y1+bubble_h+10), (x1+20, y1+bubble_h-2)]
    d.polygon(tail_pts, fill=c)
    
    # 内部线条（对话效果）
    line_color = (255,255,255,180) if active else (248,248,252,200)
    d.rounded_rectangle([x1+8, y1+10, x1+bubble_w-8, y1+14], radius=2, fill=line_color)
    d.rounded_rectangle([x1+8, y1+18, x1+bubble_w-16, y1+22], radius=2, fill=line_color)
    
    # 小气泡装饰
    d.ellipse([cx+16, cy+10, cx+24, cy+18], fill=(c[0], c[1], c[2], 150))

def me_fn(d, c, s, active=False):
    """我的 - 用户头像"""
    cx, cy = s // 2, s // 2
    
    # 头部圆形
    head_r = 12
    d.ellipse([cx-head_r, cy-head_r-6, cx+head_r, cy+head_r-6], fill=c)
    
    # 身体/肩膀
    shoulder_w, shoulder_h = 36, 20
    x1, y1 = cx - shoulder_w//2, cy + 4
    
    # 绘制肩膀弧线
    d.pieslice([x1, y1, x1+shoulder_w, y1+shoulder_h*2], 
               start=0, end=180, fill=c)
    
    # 领口
    neck_color = (255,255,255,180) if active else (248,248,252,200)
    d.arc([cx-8, cy+2, cx+8, cy+14], start=0, end=180, fill=neck_color, width=2)

icons = [
    ("tab-home.png",          home_fn,   GRAY, False),
    ("tab-home-active.png",   home_fn,   (255,255,255), True),
    ("tab-course.png",        course_fn, GRAY, False),
    ("tab-course-active.png", course_fn, (255,255,255), True),
    ("tab-ai.png",            ai_fn,     GRAY, False),
    ("tab-ai-active.png",     ai_fn,     (255,255,255), True),
    ("tab-topic.png",         topic_fn,  GRAY, False),
    ("tab-topic-active.png",  topic_fn,  (255,255,255), True),
    ("tab-me.png",            me_fn,     GRAY, False),
    ("tab-me.png-active.png", me_fn,     (255,255,255), True),
]

for name, fn, color, active in icons:
    make_icon(name, fn, color, active=active)
    print(f"OK: {name}")

print("Done! All modern icons generated.")
