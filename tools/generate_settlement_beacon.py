import struct, zlib, math, os
W=H=128
palette={
 'bg':(10,14,28),'grid':(20,31,54),'blue':(38,105,255),'cyan':(54,224,224),
 'green':(62,220,128),'gold':(255,201,77),'orange':(255,132,64),'white':(236,244,255),
 'purple':(141,88,255),'dark':(5,8,16),'red':(242,80,92)
}
img=[[palette['bg'] for _ in range(W)] for __ in range(H)]

def rect(x0,y0,x1,y1,c):
    for y in range(max(0,y0),min(H,y1)):
        for x in range(max(0,x0),min(W,x1)):
            img[y][x]=c

def line(x0,y0,x1,y1,c):
    dx=abs(x1-x0); dy=-abs(y1-y0); sx=1 if x0<x1 else -1; sy=1 if y0<y1 else -1; err=dx+dy
    x,y=x0,y0
    while True:
        if 0<=x<W and 0<=y<H: img[y][x]=c
        if x==x1 and y==y1: break
        e2=2*err
        if e2>=dy: err+=dy; x+=sx
        if e2<=dx: err+=dx; y+=sy

def circle(cx,cy,r,c,fill=True):
    for y in range(cy-r,cy+r+1):
        for x in range(cx-r,cx+r+1):
            d=(x-cx)**2+(y-cy)**2
            if fill and d<=r*r or (not fill and r*r-2*r<=d<=r*r+2*r):
                if 0<=x<W and 0<=y<H: img[y][x]=c

# background grid
for x in range(0,W,8):
    for y in range(H):
        if y%2==0: img[y][x]=palette['grid']
for y in range(0,H,8):
    for x in range(W):
        if x%2==0: img[y][x]=palette['grid']

# payout rail base
rect(18,88,110,100,palette['dark'])
rect(20,90,108,98,palette['blue'])
for x in range(24,105,12):
    rect(x,91,x+6,97,palette['cyan'] if (x//12)%2 else palette['green'])

# central beacon tower
rect(57,44,71,90,palette['purple'])
rect(53,52,75,60,palette['blue'])
rect(55,62,73,70,palette['cyan'])
rect(59,72,69,88,palette['gold'])
rect(50,88,78,96,palette['orange'])

# settlement coin halo
circle(64,39,17,palette['gold'],False)
circle(64,39,10,palette['orange'],True)
rect(61,31,67,47,palette['white'])
rect(57,36,71,42,palette['white'])

# four review nodes connected to beacon
nodes=[(27,34,palette['green']),(101,34,palette['cyan']),(30,70,palette['gold']),(98,70,palette['purple'])]
for x,y,c in nodes:
    line(x,y,64,58,palette['blue'])
    rect(x-8,y-6,x+8,y+6,palette['dark'])
    rect(x-6,y-4,x+6,y+4,c)
    rect(x-2,y-2,x+2,y+2,palette['white'])

# tiny approval ticks and alerts
line(22,112,32,122,palette['green']); line(32,122,48,104,palette['green'])
rect(82,108,88,120,palette['red']); rect(82,122,88,126,palette['red'])

# stars / activity pixels
for i in range(36):
    x=(i*37+13)%W; y=(i*19+7)%H
    if y<28 or x<14 or x>114:
        img[y][x]=palette['white'] if i%3==0 else palette['cyan']

# nearest-neighbor upscale-like chunky border
rect(0,0,W,2,palette['blue']); rect(0,H-2,W,H,palette['blue']); rect(0,0,2,H,palette['blue']); rect(W-2,0,W,H,palette['blue'])

raw=b''.join(b'\x00'+bytes([v for px in row for v in px]) for row in img)
def chunk(t,d):
    return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',W,H,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
out='assets/pixel-art/settlement_beacon.png'
os.makedirs(os.path.dirname(out),exist_ok=True)
open(out,'wb').write(png)
print(out)
