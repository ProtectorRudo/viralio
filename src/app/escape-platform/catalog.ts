export type RoomCategory = "terror" | "misterio" | "emociones";
export type RoomTheme = "case" | "theatre" | "garden" | "ward";
export type EscapeExperience = {
  slug: string;
  title: string;
  subtitle: string;
  category: RoomCategory;
  categoryLabel: string;
  theme: RoomTheme;
  cover: string;
  photoCredit: string;
  duration: string;
  difficulty: string;
  intensity: {
    difficulty: 1 | 2 | 3 | 4 | 5;
    scares: 1 | 2 | 3 | 4 | 5;
    surprise: 1 | 2 | 3 | 4 | 5;
    tension: 1 | 2 | 3 | 4 | 5;
  };
  mode: string;
  tagline: string;
  synopsis: string;
  story: string[];
  playUrl: string;
  featured?: boolean;
};
export const experiences: readonly EscapeExperience[] = [
  {
    slug: "caso-m",
    title: "CASO M",
    subtitle: "Operación Rescate",
    category: "terror",
    categoryLabel: "Suspenso psicológico",
    theme: "case",
    cover: "https://images.unsplash.com/photo-1769527819369-8ee7d4e73f4a?auto=format&fit=crop&w=1600&q=80",
    photoCredit: "Fotografía de Ed Stone / Unsplash · Arte de referencia",
    duration: "3 min + 1 adicional",
    difficulty: "Intermedia",
    intensity: { difficulty: 3, scares: 3, surprise: 3, tension: 4 },
    mode: "Individual",
    tagline: "Alguien desapareció. El reloj ya está corriendo.",
    synopsis: "Una habitación cerrada. Tres evidencias. Seis cifras. Y la certeza de que alguien podría regresar antes de que encuentres la salida.",
    story: ["Una desaparición te conduce a un lugar que no debería existir.", "Explorá la habitación, reuní las evidencias y abrí el candado antes de que el tiempo se termine.", "Pero prestá atención: la habitación también te está observando."],
    playUrl: "https://tehiceesto.com/escape-play/caso-m/"
  },
  {
    slug: "la-ultima-funcion",
    title: "LA ÚLTIMA FUNCIÓN",
    subtitle: "Teatro Belladonna",
    category: "terror",
    categoryLabel: "Terror paranormal",
    theme: "theatre",
    cover: "https://images.unsplash.com/photo-1713514116766-d9be318edaf8?auto=format&fit=crop&w=1600&q=80",
    photoCredit: "Fotografía de Richard Heinen / Unsplash · Arte de referencia",
    duration: "7 min + 1 adicional",
    difficulty: "Intermedia",
    intensity: { difficulty: 3, scares: 4, surprise: 4, tension: 4 },
    mode: "Individual",
    tagline: "La función terminó en 1968. Tu entrada acaba de llegar.",
    synopsis: "Ochenta y tres espectadores desaparecieron del teatro Belladonna. Nadie volvió a entrar. Hasta esta noche.",
    story: ["El teatro Belladonna cerró sus puertas en 1968, cuando 83 personas desaparecieron en plena función.", "Encontrá tu butaca, devolvé la luz al escenario y descifrá el misterio de la última proyección.", "El Acomodador no quiere que nadie abandone el teatro."],
    playUrl: "https://la-ultima-funcion.vercel.app/",
    featured: true
  },
  {
    slug: "la-ultima-campanada",
    title: "LA ÚLTIMA CAMPANADA",
    subtitle: "El jardín de los secretos",
    category: "emociones",
    categoryLabel: "Misterio romántico",
    theme: "garden",
    cover: "https://images.unsplash.com/photo-1496098868818-75736fc02eeb?auto=format&fit=crop&w=1600&q=80",
    photoCredit: "Fotografía de Annie Spratt / Unsplash · Arte de referencia",
    duration: "9 min + desenlace",
    difficulty: "Intermedia",
    intensity: { difficulty: 3, scares: 1, surprise: 5, tension: 3 },
    mode: "Individual",
    tagline: "Hay secretos que sólo florecen a tiempo.",
    synopsis: "Un jardín que empieza a marchitarse, una carta sellada y una cuenta regresiva. Descubrí qué historia se esconde entre las flores.",
    story: ["Un jardín detenido en el tiempo guarda una última carta.", "Investigá cada rincón, seguí las pistas y encontrá el camino hacia una revelación personal.", "Cada campanada cambia lo que está en juego."],
    playUrl: "https://la-ultima-campanada-desafio-v6.vercel.app/"
  },
  {
    slug: "aislamiento-15",
    title: "AISLAMIENTO 15",
    subtitle: "Hospital de contención",
    category: "terror",
    categoryLabel: "Terror psicológico · Supervivencia",
    theme: "ward",
    cover: "/aislamiento-15/cover.svg",
    photoCredit: "Portada ilustrada original de Viralio",
    duration: "15 minutos",
    difficulty: "Desafiante",
    intensity: { difficulty: 4, scares: 5, surprise: 4, tension: 5 },
    mode: "Individual · Primera persona",
    tagline: "Tenés quince minutos para salir del hospital. Algo quiere salir con vos.",
    synopsis: "Tres sectores de un hospital sellado, un protocolo irreversible y una anomalía capaz de imitar voces humanas. Escapá antes del último minuto.",
    story: ["Despertás en una instalación médica donde los altavoces anuncian la activación del Protocolo 015.", "Investigá Urgencias, restablecé la presión en Aislamiento y descubrí quién intenta engañarte desde Contención.", "El enemigo está dentro del edificio. Cada error consume segundos reales."],
    playUrl: "https://protectorrudo.github.io/aislamiento-15/"
  },
]; 
export const collections = [
 {slug:"terror",name:"Terror y suspenso",detail:"No todo lo que escuchás está en tu imaginación.",count:"terror"},
 {slug:"misterio",name:"Misterios e investigación",detail:"Seguí las pistas. Cuestioná cada respuesta.",count:"misterio"},
 {slug:"aventura",name:"Aventuras",detail:"Explorá nuevos mundos y superá lo imposible.",count:"aventura"},
 {slug:"emociones",name:"Emociones y sorpresas",detail:"Historias para sentir, compartir y regalar.",count:"emociones"}
] as const;
export function getExperience(slug: string) { return experiences.find((room) => room.slug === slug); }
