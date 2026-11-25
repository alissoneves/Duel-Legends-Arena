import json
from PIL import Image, ImageDraw, ImageFont
R='/home/claude/duel-legends-arena/insta/'
F='/home/claude/brand/assets/PixelifySans-Medium.ttf'
f=lambda s: ImageFont.truetype(F,s)
C=json.load(open(R+'calendario.json'))
def ctext(d,y,t,fn,fill,sh=(0,0,0)):
    w=d.textlength(t,font=fn); d.text(((1080-w)/2+5,y+5),t,font=fn,fill=sh); d.text(((1080-w)/2,y),t,font=fn,fill=fill)
for dia in C:
    a,b=dia['09:00'],dia['18:00']
    im=Image.new('RGB',(1080,1920),(11,12,20)); d=ImageDraw.Draw(im)
    for y in range(1920):
        k=abs(y-960)/960; c=int(30*(1-k)); d.line([(0,y),(1080,y)],fill=(11+c,12+c//2,20+c))
    ctext(d,300,'QUEM VENCERIA?',f(112),(252,209,56))
    for i,e in enumerate((a,b)):
        card=Image.open(R+'lenda_%03d.jpg'%e['n']).convert('RGB').resize((505,631),Image.LANCZOS)
        x=25+i*525; d.rectangle([x-6,474,x+511,1111],fill=(252,209,56) if i==0 else (120,170,255)); im.paste(card,(x,480))
    d.ellipse([465,720,615,870],fill=(225,60,60),outline=(255,255,255),width=6)
    ctext(d,748,'VS',f(84),(255,255,255))
    ctext(d,1190,f"{a['nome']}  ou  {b['nome']}",f(54 if len(a['nome']+b['nome'])<26 else 42),(255,255,255))
    ctext(d,1300,'RESPONDA ESTE STORY',f(70),(252,209,56))
    ctext(d,1395,'e diga quem leva essa!',f(52),(200,205,230))
    ctext(d,1560,'Jogue grátis no navegador: link na bio',f(40),(150,160,200))
    im.save(R+'story_%s.jpg'%dia['dia'],quality=90)
print(len(C))
