#!/usr/bin/env python3
"""Corrección 0.5: rival exclusivamente a la derecha. Se ejecuta tras ui-v04.patch."""
from pathlib import Path
import sys

root=Path(sys.argv[1])
def change(path, old, new):
    file=root/path
    content=file.read_text(encoding="utf-8")
    if content.count(old)!=1:
        raise RuntimeError("Parche inesperado: "+str(path)+" coincidencias="+str(content.count(old)))
    file.write_text(content.replace(old,new),encoding="utf-8")

s="app/src/main/java/com/triopvp/aliado/CaptureService.java"
change(s,"    private long lastOpponentSeen=0;",
       "    private long lastOpponentSeen=0;\n    private int unknownReadings=0;")
change(s, """            // El nombre puede aparecer a la derecha o al centro segun dispositivo/version.
            // Abarcamos la zona superior sin incluir los controles inferiores del jugador.
            int cropX=(int)(width*0.03f), cropY=(int)(height*0.04f);
            int cropWidth=Math.max(1,width-cropX-(int)(width*0.03f));
            int cropHeight=Math.max(1,(int)(height*0.41f));
            return Bitmap.createBitmap(full,cropX,cropY,cropWidth,Math.min(cropHeight,height-cropY));""",
"""            // Leer solo HUD superior derecho: izquierda es nuestro Pokemon.
            // Si no hay rival reconocible NO adivinar con otra zona.
            int cropX=(int)(width*0.52f), cropY=(int)(height*0.025f);
            int cropWidth=Math.max(1,(int)(width*0.46f));
            int cropHeight=Math.max(1,(int)(height*0.22f));
            return Bitmap.createBitmap(full,cropX,cropY,
                Math.min(cropWidth,width-cropX),Math.min(cropHeight,height-cropY));""")
change(s, """        if(rival==null){
            consecutive=0;pendingName="";
            if(!shownName.isEmpty()&&now-lastOpponentSeen>14000){
                shownName="";
                mainHandler.post(()->{if(!closed&&overlay!=null)
                    overlay.update("Trío PvP · sin nombre rival visible","Última lectura antigua; no cambies solo por esta sugerencia");});
            }
            return;
        }
        lastOpponentSeen=now;""",
"""        if(rival==null){
            consecutive=0;pendingName="";
            if(++unknownReadings>=3 && (!shownName.isEmpty() || unknownReadings==3)){
                shownName="";
                mainHandler.post(()->{if(!closed&&overlay!=null)
                    overlay.update("Rival no identificado",
                        "No recomiendo cambios hasta reconocer al rival");});
            }
            return;
        }
        unknownReadings=0;
        lastOpponentSeen=now;""")
change("app/build.gradle","versionCode 3\n        versionName '0.4.0-alpha'",
       "versionCode 5\n        versionName '0.5.0-alpha'")
p=root/"app/src/main/assets/dex.tsv"
d=p.read_text(encoding="utf-8")
if "Toxtricity|" in d: raise RuntimeError("Toxtricity duplicado")
p.write_text(d+"Toxtricity|electric|poison|electric|poison|electric\n",encoding="utf-8")
change("scripts/check-project.py","==91","==92")
change("scripts/check-project.py","91 entradas","92 entradas")
change("app/src/main/java/com/triopvp/aliado/MainActivity.java","ALPHA 0.4","ALPHA 0.5")
change("app/src/main/java/com/triopvp/aliado/MainActivity.java",
       "Catálogo inicial: 91 Pokémon y variantes.",
       "Catálogo inicial: 92 Pokémon y variantes; los faltantes se muestran como no identificados.")
change("tests/CoreTests.java",
       '        check(dex.recognize("RIVAL SIN NOMBRE") == null,"No inventar detecciones");',
       '''        check(dex.recognize("RIVAL SIN NOMBRE") == null,"No inventar detecciones");
        check(dex.byName("Toxtricity") != null,"Toxtricity presente en catálogo");
        check(dex.byName("Toxtricity").types.equals(Arrays.asList("electric","poison")),
            "Toxtricity es eléctrico/veneno");
        check("Toxtricity".equals(dex.recognize("PC 1470 Toxtricity").name),
            "Detectar Toxtricity en HUD derecho");''')
print("Parche 0.5 aplicado: HUD derecho, Toxtricity, límite de antigüedad.")
