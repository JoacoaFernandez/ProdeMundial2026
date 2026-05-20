// Maps FIFA 3-letter codes to ISO 3166-1 alpha-2 for flagcdn.com
const ISO2: Record<string, string> = {
  // CONMEBOL
  ARG: 'ar', BRA: 'br', URU: 'uy', COL: 'co', PER: 'pe',
  CHI: 'cl', VEN: 've', ECU: 'ec', PAR: 'py', BOL: 'bo',
  // CONCACAF
  USA: 'us', MEX: 'mx', CAN: 'ca', CRC: 'cr', HON: 'hn',
  PAN: 'pa', JAM: 'jm', HAI: 'ht', CUB: 'cu', TRI: 'tt',
  CUW: 'cw',
  // UEFA
  ESP: 'es', FRA: 'fr', GER: 'de', POR: 'pt', ENG: 'gb-eng',
  ITA: 'it', NED: 'nl', BEL: 'be', CRO: 'hr', SRB: 'rs',
  AUT: 'at', SUI: 'ch', POL: 'pl', CZE: 'cz', SVK: 'sk',
  TUR: 'tr', ROU: 'ro', SCO: 'gb-sct', WAL: 'gb-wls',
  UKR: 'ua', DEN: 'dk', NOR: 'no', SWE: 'se', GRE: 'gr',
  HUN: 'hu', SVN: 'si', ALB: 'al', MNE: 'me', BIH: 'ba',
  // CAF
  MAR: 'ma', SEN: 'sn', NGA: 'ng', CMR: 'cm', GHA: 'gh',
  EGY: 'eg', MLI: 'ml', TUN: 'tn', CIV: 'ci', ALG: 'dz',
  ZAF: 'za', CPV: 'cv', COD: 'cd',
  // AFC
  JPN: 'jp', KOR: 'kr', KSA: 'sa', IRN: 'ir', AUS: 'au',
  NZL: 'nz', IDN: 'id', CHN: 'cn', IND: 'in', THA: 'th',
  IRQ: 'iq', UAE: 'ae', JOR: 'jo', QAT: 'qa', UZB: 'uz',
}

export function getFlagUrl(code: string, size: 40 | 80 | 160 = 40): string {
  const iso = ISO2[code]
  if (!iso) return ''
  return `https://flagcdn.com/w${size}/${iso}.png`
}
