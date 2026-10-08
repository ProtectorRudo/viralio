export type PremiumMoment = {
  light: {
    kicker: string;
    title: string;
    secret: string;
    hint: string;
  };
  hold: {
    kicker: string;
    prompt: string;
    reveal: string;
    symbol: string;
  };
};

export const premiumMoments: Record<string, PremiumMoment> = {
  pareja: {
    light: {
      kicker: "Hay recuerdos que vuelven con otra luz",
      title: "Encontrá ese instante.",
      secret: "No recuerdo exactamente qué dijimos. Sí recuerdo que no quería que terminara.",
      hint: "Mové la luz y tocá para dejarlo aparecer",
    },
    hold: {
      kicker: "Antes de la última parte",
      prompt: "Mantené el corazón",
      reveal: "Entre todas las versiones de mi vida, quiero que estés en las que todavía no llegaron.",
      symbol: "♥",
    },
  },
  cumpleanos: {
    light: {
      kicker: "Otra vuelta al sol",
      title: "Mirá todo lo que iluminaste.",
      secret: "No son solamente los años. Son todas las personas que fuiste juntando en el camino.",
      hint: "Buscá la frase escondida en la luz",
    },
    hold: {
      kicker: "Un deseo que no entra en una vela",
      prompt: "Mantené la estrella",
      reveal: "Que este año te encuentre exactamente donde te haga bien quedarte.",
      symbol: "✦",
    },
  },
  hijos: {
    light: {
      kicker: "Un instante que un día va a parecer enorme",
      title: "Guardamos esto también.",
      secret: "Hubo una época en la que tu mano entraba entera dentro de la nuestra.",
      hint: "Tocá la luz para guardar el momento",
    },
    hold: {
      kicker: "Una promesa para cuando crezcas",
      prompt: "Mantené el sol",
      reveal: "No importa cuánto crezcas: siempre va a existir una versión nuestra recordando lo chiquito que eras acá.",
      symbol: "☼",
    },
  },
  abuelos: {
    light: {
      kicker: "La memoria también tiene luz",
      title: "Acercate un poco.",
      secret: "Una casa puede vaciarse y aun así seguir llena de voces.",
      hint: "Mové la luz sobre el recuerdo",
    },
    hold: {
      kicker: "Lo que queda después de tantos años",
      prompt: "Mantené este instante",
      reveal: "Lo que nos enseñaste ya vive en la forma en que nosotros queremos a otros.",
      symbol: "⌛",
    },
  },
  aniversario: {
    light: {
      kicker: "Un capítulo que todavía respira",
      title: "Volvé a ese día.",
      secret: "No hubo música de película. Sólo un día común que terminó volviéndose parte de nosotros.",
      hint: "Tocá para volver a enfocarlo",
    },
    hold: {
      kicker: "El próximo capítulo",
      prompt: "Mantené el infinito",
      reveal: "No quiero repetir los años. Quiero seguir estrenándolos con vos.",
      symbol: "∞",
    },
  },
  propuesta: {
    light: {
      kicker: "Antes de la pregunta",
      title: "Hubo un momento.",
      secret: "La primera vez que imaginé un futuro, sin querer ya te había puesto adentro.",
      hint: "Encontrá lo que estaba escondido",
    },
    hold: {
      kicker: "No lo sueltes todavía",
      prompt: "Mantené el símbolo",
      reveal: "No busco una promesa perfecta. Busco elegirte incluso cuando la vida cambie de forma.",
      symbol: "◇",
    },
  },
  "mama-papa": {
    light: {
      kicker: "Hay cosas que de chicos no vemos",
      title: "Ahora se entienden distinto.",
      secret: "Mucho de lo que parecía fácil era alguien haciendo esfuerzo en silencio.",
      hint: "Iluminá lo que antes no veíamos",
    },
    hold: {
      kicker: "Una palabra que a veces llega tarde",
      prompt: "Mantené el corazón",
      reveal: "Hoy entiendo que muchas veces también estabas aprendiendo. Gracias por igual hacernos sentir seguros.",
      symbol: "♥",
    },
  },
  amistad: {
    light: {
      kicker: "Archivo estrictamente confidencial",
      title: "Esto queda entre nosotros.",
      secret: "Las mejores historias nuestras empiezan con: «esto no se lo contamos a nadie».",
      hint: "Buscá la prueba con la luz",
    },
    hold: {
      kicker: "Promesa poco solemne",
      prompt: "Mantené la estrella",
      reveal: "No importa cuántos días tardemos en responder: seguís siendo de las primeras personas a las que quiero contarle algo.",
      symbol: "✹",
    },
  },
};
