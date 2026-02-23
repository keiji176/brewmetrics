export interface GlossaryTerm {
  id: string;
  term: string;
  category?: string;
  short: string;
  explanation: string;
  tip?: string;
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    id: "cupping",
    term: "Cupping",
    short: "A standardized way to taste and score coffee.",
    explanation:
      "Cupping is a professional tasting method where coffee is brewed in small cups, then evaluators smell the grounds, break the crust, and slurp the coffee to taste. Scores are given for aroma, flavor, acidity, body, and more. It helps roasteries compare batches and keep quality consistent. Judges often use cupping to grade specialty coffee.",
    tip: "Think of it like a wine tasting, but for coffee.",
  },
  {
    id: "grind-size",
    term: "Grind Size",
    short: "How coarse or fine the coffee particles are.",
    explanation:
      "Grind size affects how quickly water extracts flavor from the coffee. Finer grinds have more surface area, so they extract faster; coarser grinds extract slower. Espresso usually uses fine grind, while French press uses coarse. If your coffee tastes sour or weak, adjusting grind size (and/or brew time) often fixes it.",
    tip: "Finer = stronger extraction. Coarser = weaker extraction.",
  },
  {
    id: "extraction",
    term: "Extraction",
    short: "The process of pulling flavor from coffee grounds into the cup.",
    explanation:
      "Extraction is what happens when hot water passes through coffee grounds and dissolves soluble compounds. Under-extraction (too little) can taste sour or thin; over-extraction (too much) can taste bitter or harsh. Good extraction is balanced and is influenced by grind size, water temperature, brew time, and agitation.",
    tip: "Target roughly 18–22% of the coffee mass extracted for a balanced cup.",
  },
  {
    id: "acidity",
    term: "Acidity",
    short: "A bright, tangy quality in coffee (not the same as sour or stomach acid).",
    explanation:
      "In coffee, acidity refers to pleasant, wine-like brightness—think citrus or apple. It’s a positive trait in specialty coffee. It’s different from sourness (which usually means under-extraction) or from stomach acid. Descriptors include 'bright', 'lively', 'citric', or 'malic'.",
    tip: "Often higher in light roasts and certain origins (e.g. Kenya, Ethiopia).",
  },
  {
    id: "body",
    term: "Body",
    short: "How the coffee feels in your mouth—light, medium, or heavy.",
    explanation:
      "Body describes the weight and texture of coffee on the palate. It can be light (tea-like), medium (smooth), or full (syrupy, creamy). It’s not about strength or caffeine; it’s about mouthfeel. Factors include roast level, origin, and brew method.",
    tip: "French press and espresso often have more body than pour-over.",
  },
  {
    id: "roast-profile",
    term: "Roast Profile",
    short: "How the beans were roasted: time and temperature.",
    explanation:
      "A roast profile is the path of temperature over time during roasting. Light roasts keep more origin flavor and acidity; dark roasts develop more bitterness and body. Roasters track time and temperature to repeat or improve a profile and to match a desired flavor.",
    tip: "Light = more origin character. Dark = more roast flavor.",
  },
  {
    id: "first-crack",
    term: "First Crack",
    short: "The popping sound when coffee beans expand during roasting.",
    explanation:
      "During roasting, moisture inside the bean turns to steam and the bean structure cracks—you hear a sound like popcorn. This is 'first crack.' It usually marks the start of a 'light' to 'medium' roast. Many specialty roasters use first crack as a reference point for when to drop the roast.",
    tip: "Second crack (later) is a sign of a darker roast.",
  },
  {
    id: "origin",
    term: "Origin",
    short: "Where the coffee was grown (country, region, or farm).",
    explanation:
      "Origin greatly affects flavor. Different countries and regions have different soil, altitude, and climate, which influence taste. For example, Ethiopian coffees are often floral and fruity; Colombian can be nutty and balanced. Single-origin means one place; blends mix several origins.",
    tip: "Labels like 'Ethiopia Yirgacheffe' or 'Colombia Huila' tell you the origin.",
  },
  {
    id: "bloom",
    term: "Bloom",
    short: "The quick release of gas when hot water first hits fresh grounds.",
    explanation:
      "When you add hot water to freshly ground coffee, CO₂ escapes and the grounds often bubble or 'bloom.' Letting the coffee bloom for 30–45 seconds before continuing the brew can improve extraction. It’s a sign of fresh coffee; stale coffee blooms little.",
    tip: "Used in pour-over and other manual methods.",
  },
  {
    id: "aftertaste",
    term: "Aftertaste",
    short: "The flavor that remains in your mouth after swallowing.",
    explanation:
      "Aftertaste (or finish) is the lingering taste once you’ve swallowed the coffee. It can be short and clean or long and complex. In cupping, aftertaste is often scored separately. A pleasant, lasting aftertaste is a mark of high-quality coffee.",
    tip: "Good aftertaste is often described as clean, sweet, or lingering.",
  },
];
