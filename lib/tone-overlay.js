const RULES={
  none:{label:'None',rule:'No secondary tone overlay. Preserve the primary genre and creator direction as-is.'},
  comedy:{label:'Comedy',rule:'Add visual comedy through contrast, deadpan feline reactions, timing, escalation and a memorable payoff. Keep AvoMiez natural and avoid forced dialogue.'},
  horror:{label:'Horror',rule:'Add dread, ominous visual progression, threatening reveals, unsettling sound design, shadows, suspense and a strong horror payoff while keeping action readable.'},
  'horror-splatter':{label:'Horror / Splatter',rule:'Add fictional cinematic horror-splatter energy: threatening buildup, sharp impact beats, practical-effects-style blood or splatter, monster damage or macabre aftermath when appropriate. Keep effects story-serving and do not default to graphically harming AvoMiez.'},
  'dark-comedy':{label:'Dark Comedy',rule:'Blend macabre or threatening situations with dry absurdity, deadpan feline behavior and precise comedic timing. Keep the danger visually legible rather than cartoonish.'},
  emotional:{label:'Emotional',rule:'Add a concise emotional motive, relationship beat, vulnerability or protective payoff without slowing the opening hook.'},
  epic:{label:'Epic',rule:'Add larger-than-life scale, heroic framing, powerful escalation, premium lighting, strong musical or sound-design rises and a triumphant or awe-heavy payoff.'},
  romantic:{label:'Romantic',rule:'Add visual chemistry, tenderness, elegant proximity, meaningful looks or gestures and a satisfying romantic beat while preserving the primary genre.'},
  suspense:{label:'Suspense',rule:'Build uncertainty through withheld information, controlled reveals, tension in camera movement, sound cues and a delayed payoff or twist.'},
  'creepy-cute':{label:'Creepy Cute',rule:'Combine adorable feline charm and visually pleasing composition with subtly uncanny details, eerie timing, strange background behavior or an unsettling reveal.'},
  absurd:{label:'Absurd / Surreal',rule:'Introduce coherent surrealism, unexpected object logic, strange scale or visual non sequiturs while preserving a clear hook and readable story progression.'},
  chaotic:{label:'Chaotic',rule:'Increase controlled visual chaos, rapid escalation, surprising interactions and kinetic energy without making the action unreadable or breaking character consistency.'},
  wholesome:{label:'Wholesome',rule:'Add warmth, kindness, protective behavior, charming reactions and a feel-good payoff while keeping the original genre structure.'},
  noir:{label:'Noir',rule:'Add moody contrast, mystery, restrained tension, elegant shadows, deliberate camera movement and cool detective-like atmosphere without losing the primary genre.'},
  custom:{label:'Custom',rule:'Apply the creator custom tone note as the secondary creative flavor while preserving the primary genre.'}
};
const STRENGTH={light:'LIGHT blend: use the overlay as a subtle accent in roughly 20–30% of the beats.',medium:'MEDIUM blend: make the overlay clearly recognizable across the hook, mid-beat and payoff without replacing the primary genre.',strong:'STRONG blend: make the overlay a dominant secondary flavor across pacing, lighting, reactions, sound design and payoff while the primary genre remains structurally intact.'};
const EXPRESSION={
  'social-safe':'SOCIAL-SAFE expression: keep imagery broadly suitable for mainstream short-form platforms. If horror/splatter is selected, prefer implication, shadows, off-screen impact, stylized stains/splashes and non-graphic practical-effects cues over explicit anatomy.',
  balanced:'BALANCED expression: allow clear genre effects and moderate fictional intensity, but keep any gore brief, non-sexual, non-gratuitous and subordinate to story clarity.',
  'cinematic-intense':'CINEMATIC-INTENSE expression: push lighting, sound, impact, tension and fictional genre effects harder. If horror/splatter is selected, stronger practical-effects-style blood/splatter or monster gore may appear, but keep it coherent, non-sexual and story-serving.'
};

export function normalizeToneOverlay(input={}){
  const raw=typeof input==='string'?{name:input}:input||{};
  const name=RULES[String(raw.name||'none').toLowerCase()]?String(raw.name||'none').toLowerCase():'none';
  const strength=STRENGTH[String(raw.strength||'medium').toLowerCase()]?String(raw.strength||'medium').toLowerCase():'medium';
  const expression=EXPRESSION[String(raw.expression||'balanced').toLowerCase()]?String(raw.expression||'balanced').toLowerCase():'balanced';
  const note=String(raw.note||'').trim().slice(0,700);
  return{name,strength,expression,note,label:RULES[name].label};
}

export function toneOverlayText(input={}){
  const t=normalizeToneOverlay(input);
  if(t.name==='none')return'SECONDARY TONE OVERLAY: none. Do not invent an extra genre layer.';
  const custom=t.note?` CREATOR TONE NOTE: ${t.note}`:'';
  return`SECONDARY TONE OVERLAY: ${t.label}. This is an ADDITIVE creative layer that can be blended with ANY primary genre/style; never replace the primary genre, story logic, reference roles or character identity. ${STRENGTH[t.strength]} ${EXPRESSION[t.expression]} ${RULES[t.name].rule}${custom}`;
}
