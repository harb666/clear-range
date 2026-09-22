/**
 * Literature sources underpinning the default PK parameter priors in
 * `parameters.ts`. These are the well-established, widely-cited studies in
 * forensic cannabinoid pharmacokinetics that the MVP's parameter *ranges*
 * are informed by. Point values in this codebase are illustrative,
 * order-of-magnitude-correct approximations of the published data, not a
 * digitised re-extraction of individual-subject datasets — see
 * `modelRegistry.ts` for how this is meant to be replaced once a validated
 * dataset exists.
 */
export interface Citation {
  id: string;
  citation: string;
  relevance: string;
}

export const CITATIONS: Citation[] = [
  {
    id: "huestis1992",
    citation:
      "Huestis MA, Henningfield JE, Cone EJ (1992). Blood cannabinoids I: absorption of THC and formation of 11-OH-THC and THCCOOH during and after smoking marijuana. Journal of Analytical Toxicology 16(5):276-282.",
    relevance:
      "Foundational dose-controlled smoking study; source for peak concentration ranges and the rapid distribution-phase decline after smoking.",
  },
  {
    id: "toennes2008",
    citation:
      "Toennes SW, Ramaekers JG, Theunissen EL, Moeller MR, Kauert GF (2008). Comparison of cannabinoid pharmacokinetics in occasional and heavy users smoking a marijuana or placebo joint. Journal of Analytical Toxicology 32(7):470-477.",
    relevance:
      "Directly compares occasional vs. heavy/frequent users smoking a standardised dose; primary basis for the occasional/moderate/frequent split in this model.",
  },
  {
    id: "karschner2009",
    citation:
      "Karschner EL, Schwilke EW, Lowe RH, Darwin WD, Pope HG, Herning R, Cadet JL, Huestis MA (2009). Do Delta9-tetrahydrocannabinol concentrations indicate recent use in chronic cannabis users? Addiction 104(12):2041-2048.",
    relevance:
      "Shows chronic/frequent users retain measurable blood THC for a materially longer terminal phase than occasional users; basis for the slower kSlow assigned to the 'frequent' use-pattern category.",
  },
  {
    id: "newmeyer2016",
    citation:
      "Newmeyer MN, Swortwood MJ, Barnes AJ, Abulseoud OA, Scheidweiler KB, Huestis MA (2016). Free and glucuronide whole blood cannabinoids' pharmacokinetics after controlled smoked, vaporized, and oral cannabis administration in frequent and occasional cannabis users. Clinical Chemistry 62(12):1579-1592.",
    relevance:
      "Head-to-head comparison of smoked, vaporised and oral routes in the same participants; basis for the route-dependent absorption (ka, lag) and relative Cmax assumptions.",
  },
  {
    id: "schwope2012",
    citation:
      "Schwope DM, Karschner EL, Gorelick DA, Huestis MA (2012). Identification of recent cannabis use: whole-blood and plasma free and glucuronidated cannabinoid pharmacokinetics following controlled smoked cannabis administration. Clinical Chemistry 58(10):1541-1551.",
    relevance:
      "Whole-blood THC decline kinetics after controlled smoking; supports the fast/slow biexponential decline structure used post-peak.",
  },
  {
    id: "grotenhermen2003",
    citation:
      "Grotenhermen F (2003). Pharmacokinetics and pharmacodynamics of cannabinoids. Clinical Pharmacokinetics 42(4):327-360.",
    relevance:
      "Review synthesising THC absorption, distribution and elimination across routes; used as a general cross-check on parameter plausibility ranges.",
  },
  {
    id: "desrosiers2014",
    citation:
      "Desrosiers NA, Himes SK, Scheidweiler KB, Concheiro-Guisan M, Gorelick DA, Huestis MA (2014). Phase I and II cannabinoid disposition in blood and plasma of occasional and frequent smokers following controlled smoked cannabis. Clinical Chemistry 60(4):631-643.",
    relevance:
      "Further supports occasional-vs-frequent divergence in blood THC disposition used to parameterise use-pattern categories.",
  },
];
