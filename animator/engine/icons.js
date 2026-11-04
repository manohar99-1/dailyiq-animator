/* Generic line icons on a 24x24 grid (stroke style). Deliberately generic: no brand logos. */
window.ICONS = {
  search:  '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
  mail:    '<rect x="3" y="5" width="18" height="14" rx="2.2"/><path d="M3.5 7.5L12 13.5l8.5-6"/>',
  map:     '<path d="M12 21s-6.5-5.4-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
  play:    '<rect x="3" y="5" width="18" height="14" rx="4.5"/><path d="M10.2 9.2l5 2.8-5 2.8z" fill="currentColor"/>',
  video:   '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  phone:   '<rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M10.5 18.5h3"/>',
  laptop:  '<rect x="5" y="5" width="14" height="10" rx="1.6"/><path d="M2.5 18.5h19"/>',
  cab:     '<path d="M4 15v-3.6l2-4.4h12l2 4.4V15"/><path d="M3 15h18v3H3z"/><circle cx="7.5" cy="18.2" r="1.7" fill="currentColor"/><circle cx="16.5" cy="18.2" r="1.7" fill="currentColor"/><path d="M4.5 11.4h15"/>',
  car:     '<path d="M4 15v-3.6l2-4.4h12l2 4.4V15"/><path d="M3 15h18v3H3z"/><circle cx="7.5" cy="18.2" r="1.7" fill="currentColor"/><circle cx="16.5" cy="18.2" r="1.7" fill="currentColor"/><path d="M4.5 11.4h15"/>',
  truck:   '<rect x="2" y="7" width="12" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  shop:    '<path d="M3 9l2-5h14l2 5z"/><path d="M5 9v11h14V9"/><path d="M10 20v-5h4v5"/>',
  bell:    '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.6 2H4.4z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  cloud:   '<path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.6 4.2 4.2 0 0 0 7 18z"/>',
  server:  '<rect x="4" y="3.5" width="16" height="7" rx="1.6"/><rect x="4" y="13.5" width="16" height="7" rx="1.6"/><circle cx="7.5" cy="7" r=".9" fill="currentColor"/><circle cx="7.5" cy="17" r=".9" fill="currentColor"/>',
  database:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  lock:    '<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.7" r="1.1" fill="currentColor"/>',
  wifi:    '<path d="M3 9.5a13 13 0 0 1 18 0"/><path d="M6 13a8.5 8.5 0 0 1 12 0"/><path d="M9 16.5a4 4 0 0 1 6 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>',
  globe:   '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.5v3"/><rect x="5.5" y="9.5" width="8" height="5" fill="currentColor"/>',
  chip:    '<rect x="7" y="7" width="10" height="10" rx="1.6"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  robot:   '<rect x="5" y="8" width="14" height="10" rx="3"/><circle cx="9.5" cy="13" r="1.2" fill="currentColor"/><circle cx="14.5" cy="13" r="1.2" fill="currentColor"/><path d="M12 8V4.5"/><circle cx="12" cy="3.7" r="1"/>',
  shield:  '<path d="M12 3l7 3v5c0 5-3.2 8.2-7 10-3.8-1.8-7-5-7-10V6z"/><path d="M9 12l2.2 2.2L15.2 9.8"/>',
  user:    '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-4 3.2-6 7-6s7 2 7 6"/>',
  users:   '<circle cx="9" cy="8.5" r="3"/><path d="M3 19c0-3.4 2.7-5 6-5s6 1.6 6 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16 14.2c3 0 5 1.4 5 4.3"/>',
  cart:    '<path d="M3 4h3l2.5 11h9.5l2-8H7"/><circle cx="10" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  bag:     '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  bank:    '<path d="M3 9l9-5 9 5z"/><path d="M5.5 10.5v7M10 10.5v7M14.5 10.5v7M18.5 10.5v7M3 20h18"/>',
  qr:      '<rect x="3" y="3" width="6.5" height="6.5" rx="1"/><rect x="14.5" y="3" width="6.5" height="6.5" rx="1"/><rect x="3" y="14.5" width="6.5" height="6.5" rx="1"/><path d="M14.5 14.5h3v3h-3zM19 19h2v2h-2zM19 14.5h2M14.5 19.5v1.5"/>',
  rupee:   '<path d="M7 5h10M7 9.5h10M8.5 5c4.5 0 6.5 1.6 6.5 4.5S13 14 8.5 14H8l8 6"/>',
  money:   '<circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M9.3 9.3c0-1.2 1.2-2 2.7-2s2.7.8 2.7 2-1.2 1.8-2.7 2-2.7.8-2.7 2 1.2 2 2.7 2 2.7-.8 2.7-2"/>',
  bolt:    '<path d="M13 2.5L5.5 13.5h6L10.5 21.5l8-11.5h-6z"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  calendar:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  fire:    '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2 0 2 1 3 2 3 0-3 0-6 1-8.8z"/>',
  heart:   '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  star:    '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  camera:  '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8.5 7l1.2-2.5h4.6L15.5 7"/>',
  music:   '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
  chat:    '<path d="M4 5h16v11H10l-4 4v-4H4z"/>',
  thumb:   '<path d="M3 10.5h4V21H3z"/><path d="M7 11l4-7c1.6 0 2.6 1.2 2.2 2.8L12.6 9.5H19a2 2 0 0 1 2 2.3l-1.2 6.6A2 2 0 0 1 17.8 20H7"/>',
  home:    '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  code:    '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 5l-4 14"/>',
  plane:   '<path d="M2.5 12L21 4l-4 17-5-6-4.5 2.5 1-5.5z"/>',
  gear:    '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" stroke-dasharray="3.2 2.6"/>',
  warning: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/>',
  check:   '<path d="M5 12.5l4.5 4.5L19 7"/>',
  x:       '<path d="M6 6l12 12M18 6L6 18"/>',
  question:'<path d="M9 9.2a3 3 0 1 1 4.6 2.5c-1 .7-1.6 1.2-1.6 2.5"/><circle cx="12" cy="18" r=".9" fill="currentColor"/>',
  power:   '<path d="M12 3v8"/><path d="M6.5 6.5a8 8 0 1 0 11 0"/>',
  link:    '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
};
window.ICON_ALIASES = {
  email:'mail', gmail:'mail', maps:'map', location:'map', pin:'map', youtube:'play', tv:'video', film:'video', mobile:'phone', smartphone:'phone',
  computer:'laptop', pc:'laptop', taxi:'cab', auto:'car', vehicle:'car', fastag:'car', toll:'car', lorry:'truck', delivery:'truck', store:'shop', market:'shop',
  notification:'bell', alert:'bell', storage:'cloud', internet:'globe', web:'globe', world:'globe', power:'power', ai:'robot', bot:'robot', processor:'chip', cpu:'chip',
  memory:'chip', ram:'chip', security:'shield', safe:'shield', person:'user', people:'users', team:'users', cart:'cart', shopping:'cart', payment:'rupee',
  upi:'rupee', cash:'money', coin:'money', price:'money', energy:'bolt', electric:'bolt', time:'clock', date:'calendar', diwali:'fire', cracker:'fire', crackers:'fire',
  firework:'fire', fireworks:'fire', love:'heart', like:'thumb', comment:'chat', message:'chat', sms:'chat', house:'home', app:'phone', programming:'code',
  rocket:'plane', flight:'plane', settings:'gear', cog:'gear', danger:'warning', ok:'check', yes:'check', no:'x', cross:'x', unknown:'question', network:'wifi', signal:'wifi',
  link:'link', chain:'link', db:'database', data:'database', bank:'bank', money:'money', camera:'camera', music:'music', star:'star', lock:'lock'
};
window.iconMarkup = function (name) {
  name = String(name || '').toLowerCase().trim();
  if (window.ICONS[name]) return window.ICONS[name];
  if (window.ICON_ALIASES[name] && window.ICONS[window.ICON_ALIASES[name]]) return window.ICONS[window.ICON_ALIASES[name]];
  return null;
};
