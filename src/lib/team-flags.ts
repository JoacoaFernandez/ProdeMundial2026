const FLAGS: Record<string, string> = {
  ARG: '🇦🇷', BRA: '🇧🇷', URU: '🇺🇾', COL: '🇨🇴', PER: '🇵🇪',
  CHI: '🇨🇱', VEN: '🇻🇪', ECU: '🇪🇨', PAR: '🇵🇾', BOL: '🇧🇴',
  USA: '🇺🇸', MEX: '🇲🇽', CAN: '🇨🇦', CRC: '🇨🇷', HON: '🇭🇳',
  PAN: '🇵🇦',
  ESP: '🇪🇸', FRA: '🇫🇷', GER: '🇩🇪', POR: '🇵🇹', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  ITA: '🇮🇹', NED: '🇳🇱', BEL: '🇧🇪', CRO: '🇭🇷', SRB: '🇷🇸',
  AUT: '🇦🇹', SUI: '🇨🇭', POL: '🇵🇱', CZE: '🇨🇿', SVK: '🇸🇰',
  TUR: '🇹🇷', ROU: '🇷🇴',
  MAR: '🇲🇦', SEN: '🇸🇳', NGA: '🇳🇬', CMR: '🇨🇲', GHA: '🇬🇭',
  EGY: '🇪🇬', MLI: '🇲🇱', TUN: '🇹🇳',
  JPN: '🇯🇵', KOR: '🇰🇷', KSA: '🇸🇦', IRN: '🇮🇷', AUS: '🇦🇺',
  NZL: '🇳🇿', IDN: '🇮🇩',
}

export function getTeamFlag(code: string): string {
  return FLAGS[code] ?? '🏳️'
}
