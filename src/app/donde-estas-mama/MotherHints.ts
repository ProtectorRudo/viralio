/** Progressive, optional hints. Never display an outright solution by default.
 * Each objective has its own three-stage ladder, independent of the others.
 */
export type MotherHintStep=
  |"find-key"|"take-key"|"door1"
  |"photo"|"books"|"door2"
  |"gears"|"music"|"wardrobe";

export const MOTHER_HINTS:Readonly<Record<MotherHintStep,readonly [string,string,string]>>={
  "find-key":[
    "Algunas cosas importantes quedan guardadas en lugares muy cotidianos.",
    "Entre las pertenencias del chico hay un recuerdo de su rutina. Interpretalo, no busques una flecha.",
    "Pensá dónde termina su día. Revisá la ropa de cama, no el perchero."
  ],
  "take-key":[
    "Algo cambió cuando moviste lo que había sobre el colchón.",
    "Ahora hay un pequeño objeto metálico que antes no se veía.",
    "Mirá donde estaba la almohada y recogé lo que apareció."
  ],
  "door1":[
    "Lo que encontraste tiene un uso evidente, aunque todavía no lo utilizaste.",
    "El siguiente paso está en el límite de esta habitación.",
    "Probá abrir la puerta con la llave que guardaste."
  ],
  "photo":[
    "Un recuerdo roto puede mentir incluso cuando parece estar derecho.",
    "Las partes de la imagen no están en sus lugares originales. Mirá si coinciden los bordes.",
    "Seleccioná dos partes para intercambiarlas y girá cada una hasta reconstruir la imagen completa."
  ],
  "books":[
    "La inscripción habla de cuatro momentos, pero los tomos no están numerados.",
    "Relacioná cada imagen del poema con un color que exista en los lomos.",
    "Las hojas recuerdan al verde y el corazón al rojo. Después pensá en la luz del sol y el cielo."
  ],
  "door2":[
    "La habitación acaba de cambiar, aunque no haya ocurrido frente a tus ojos.",
    "Escuchaste un cierre destrabarse cerca del fondo.",
    "Volvé a intentar abrir la puerta que te impedía avanzar."
  ],
  "gears":[
    "Una máquina no puede funcionar si sus piezas están dispersas.",
    "Lo que necesitás no está sobre la mesa principal. Investigá los muebles que guardan cosas.",
    "Revisá los juguetes, la mesa de luz y los compartimientos del estante."
  ],
  "music":[
    "La melodía necesita que las tres ruedas trabajen juntas.",
    "No todos los engranajes tienen el mismo tamaño: el mecanismo sigue un orden.",
    "Empezá con el engranaje grande, seguí con el mediano y terminá con el pequeño."
  ],
  "wardrobe":[
    "El sonido de una melodía vino acompañado de otro ruido más lejano.",
    "La música soltó un pestillo en la habitación.",
    "Probá abrir el armario del fondo."
  ]
};

export function nextMotherHint(step:MotherHintStep,shown:number):
  {tier:1|2|3;text:string;nextShown:number}{
  const count=Math.max(0,Math.min(2,Math.floor(Number.isFinite(shown)?shown:0)));
  const tier=(count+1) as 1|2|3;
  return {tier,text:MOTHER_HINTS[step][count],nextShown:tier};
}
