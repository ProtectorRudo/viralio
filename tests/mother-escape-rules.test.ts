import {describe,expect,it} from "vitest";
import {
  BOOK_SEQUENCE,GEAR_SEQUENCE,rotatePhotoPiece,swapPhotoTiles,photoComplete,
  enterOrderedItem,timeRemaining,dueMotherBeats
} from "../src/app/donde-estas-mama/MotherRules";

describe("Día de la Madre — acertijos deterministas",()=>{
  it("solo resuelve la foto al combinar posiciones correctas Y orientaciones",()=>{
    let pieces=[1,3,2,1],order=[1,0,3,2];
    for(let i=0;i<pieces.length;i++)while(pieces[i]!==0)pieces=rotatePhotoPiece(pieces,i);
    expect(photoComplete(pieces,order)).toBe(false);
    order=swapPhotoTiles(order,0,1);
    order=swapPhotoTiles(order,2,3);
    expect(order).toEqual([0,1,2,3]);
    expect(photoComplete(pieces,order)).toBe(true);
    expect(photoComplete([0,0,0],order)).toBe(false);
    expect(swapPhotoTiles(order,0,15)).toEqual(order);
  });
  it("exige cuatro interpretaciones de símbolos, no el viejo código de tres libros",()=>{
    const wrong=enterOrderedItem([], "azul",BOOK_SEQUENCE);
    expect(wrong).toEqual({next:[],error:true,complete:false});
    const a=enterOrderedItem([],"verde",BOOK_SEQUENCE);
    const b=enterOrderedItem(a.next,"rojo",BOOK_SEQUENCE);
    const c=enterOrderedItem(b.next,"dorado",BOOK_SEQUENCE);
    expect(c.complete).toBe(false);
    const d=enterOrderedItem(c.next,"azul",BOOK_SEQUENCE);
    expect(d.complete).toBe(true);
  });
  it("solo acepta las tres ruedas grandes a pequeñas",()=>{
    const wrong=enterOrderedItem([],"pequeño",GEAR_SEQUENCE);
    expect(wrong.error).toBe(true);
    const a=enterOrderedItem([],"grande",GEAR_SEQUENCE);
    const b=enterOrderedItem(a.next,"mediano",GEAR_SEQUENCE);
    const c=enterOrderedItem(b.next,"pequeño",GEAR_SEQUENCE);
    expect(c.next).toEqual(["grande","mediano","pequeño"]);
    expect(c.complete).toBe(true);
  });
  it("mantiene 300 segundos sin otorgar tiempo extra",()=>{
    expect(timeRemaining(300000,0)).toBe(300);
    expect(timeRemaining(300000,239000)).toBe(61);
    expect(timeRemaining(300000,300001)).toBe(0);
  });
  it("despacha los sustos una sola vez, incluso con saltos del temporizador",()=>{
    const seen=new Set([12,50]);
    expect(dueMotherBeats(171,seen).map(b=>b.at)).toEqual([105,170]);
    seen.add(105);seen.add(170);
    expect(dueMotherBeats(171,seen)).toEqual([]);
    expect(dueMotherBeats(300,seen).map(b=>b.at)).toEqual([240,280]);
  });
});
