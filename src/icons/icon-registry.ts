import type { IconRegistry } from '../types/icon';
import { sc2IconFiles } from './sc2-icon-files';

const assetBase = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

function publicPath(path: string): string {
  return `${assetBase}${path.replace(/^\/+/, '')}`;
}

const baseIcons: Record<string, string> = {
  sun: publicPath('icons/sun.png'),
  pea: publicPath('icons/pea.png'),
  wallnut: publicPath('icons/wallnut.png'),
};

const sc2PublicPath = publicPath('icons/sc2/');
const categoryPrefixes = new Set(['ability', 'building', 'techupgrade', 'unit', 'upgrade']);
const racePrefixes = new Set(['kerrigan', 'nova', 'protoss', 'spearofadun', 'stukov', 'terran', 'zerg']);
const mainRacePrefixes = new Set(['protoss', 'terran', 'zerg']);

const compoundAliases: Record<string, string> = {
  airarmorlevel1: 'air-armor-level-1',
  airarmorlevel2: 'air-armor-level-2',
  airarmorlevel3: 'air-armor-level-3',
  airattacks: 'air-attacks',
  airweaponslevel1: 'air-weapons-level-1',
  airweaponslevel2: 'air-weapons-level-2',
  airweaponslevel3: 'air-weapons-level-3',
  banelingnest: 'baneling-nest',
  battlecruiser: 'battle-cruiser',
  broodlord: 'brood-lord',
  buildingarmor: 'building-armor',
  calldownextrasupplies: 'calldown-extra-supplies',
  commandcenter: 'command-center',
  combatshield: 'combat-shield',
  cyberneticscore: 'cybernetics-core',
  darkshrine: 'dark-shrine',
  darktemplar: 'dark-templar',
  electricfield: 'electric-field',
  emergencythrusters: 'emergency-thrusters',
  engineeringbay: 'engineering-bay',
  evolutionchamber: 'evolution-chamber',
  fleetbeacon: 'fleet-beacon',
  flyercarapace: 'flyer-carapace',
  fusioncore: 'fusion-core',
  ghostacademy: 'ghost-academy',
  greaterspire: 'greater-spire',
  groundarmorlevel1: 'ground-armor-level-1',
  groundarmorlevel2: 'ground-armor-level-2',
  groundarmorlevel3: 'ground-armor-level-3',
  groundcarapace: 'ground-carapace',
  groundweaponslevel1: 'ground-weapons-level-1',
  groundweaponslevel2: 'ground-weapons-level-2',
  groundweaponslevel3: 'ground-weapons-level-3',
  hellionbattlemode: 'hellion-battle-mode',
  hightemplar: 'high-templar',
  hydraliskden: 'hydralisk-den',
  infantryarmorlevel1: 'infantry-armor-level-1',
  infantryarmorlevel2: 'infantry-armor-level-2',
  infantryarmorlevel3: 'infantry-armor-level-3',
  infantryweaponslevel1: 'infantry-weapons-level-1',
  infantryweaponslevel2: 'infantry-weapons-level-2',
  infantryweaponslevel3: 'infantry-weapons-level-3',
  infestationpit: 'infestation-pit',
  lurkerden: 'lurker-den',
  meleeattacks: 'melee-attacks',
  microbial: 'microbial',
  missileattacks: 'missile-attacks',
  missileturret: 'missile-turret',
  neuralparasite: 'neural-parasite',
  nydusnetwork: 'nydus-network',
  nydusworm: 'nydus-worm',
  pathogenglands: 'pathogen-glands',
  photoncannon: 'photon-cannon',
  planetaryfortress: 'planetary-fortress',
  psistorm: 'psi-storm',
  punishergrenade: 'punisher-grenade',
  roachwarren: 'roach-warren',
  roboticsfacility: 'robotics-facility',
  roboticssupportbay: 'robotics-support-bay',
  sensordome: 'sensor-dome',
  shieldbattery: 'shield-battery',
  shieldslevel1: 'shields-level-1',
  shieldslevel2: 'shields-level-2',
  shieldslevel3: 'shields-level-3',
  siegetank: 'siege-tank',
  spawningpool: 'spawning-pool',
  spinecrawler: 'spine-crawler',
  sporecrawler: 'spore-crawler',
  supplydepot: 'supply-depot',
  swarmhost: 'swarm-host',
  techlab: 'tech-lab',
  templararchives: 'templar-archives',
  twilightcouncil: 'twilight-council',
  ultraliskcavern: 'ultralisk-cavern',
  vehicleplatinglevel1: 'vehicle-plating-level-1',
  vehicleplatinglevel2: 'vehicle-plating-level-2',
  vehicleplatinglevel3: 'vehicle-plating-level-3',
  vehicleweaponslevel1: 'vehicle-weapons-level-1',
  vehicleweaponslevel2: 'vehicle-weapons-level-2',
  vehicleweaponslevel3: 'vehicle-weapons-level-3',
  vikingfighter: 'viking-fighter',
  warpprism: 'warp-prism',
  warpgate: 'warp-gate',
  widowmine: 'widow-mine',
  yamatogun: 'yamato-gun',
};

const specialAliases: Record<string, string[]> = {
  'icon-gas-protoss-nobg': ['gas', 'protoss-gas'],
  'icon-gas-terran-nobg': ['terran-gas'],
  'icon-mineral-nobg': ['mineral', 'minerals'],
  'sc-2-ui-userprofile-ladders-race-icon-protoss': ['protoss'],
  'sc-2-ui-userprofile-ladders-race-icon-terran': ['terran'],
  'sc-2-ui-userprofile-ladders-race-icon-zerg': ['zerg'],
};

function normalizeAlias(value: string): string {
  return value
    .replace(/\.[^.]+$/, '')
    .replace(/_/g, '-')
    .replace(/([a-z])([0-9])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function expandCompoundSegments(value: string): string {
  return normalizeAlias(value)
    .split('-')
    .map((segment) => compoundAliases[segment] ?? segment)
    .join('-');
}

function aliasVariants(alias: string): string[] {
  const variants = new Set([alias]);

  if (alias.endsWith('-color')) {
    variants.add(alias.slice(0, -'-color'.length));
  }

  if (alias.endsWith('-nobg')) {
    variants.add(alias.slice(0, -'-nobg'.length));
  }

  return [...variants];
}

function addIconAlias(iconMap: Record<string, string>, alias: string, url: string): void {
  if (alias && !(alias in iconMap)) {
    iconMap[alias] = url;
  }
}

function addIconAliasVariants(iconMap: Record<string, string>, alias: string, url: string): void {
  aliasVariants(alias).forEach((variant) => addIconAlias(iconMap, variant, url));
}

function buildSc2IconMap(): Record<string, string> {
  const iconMap: Record<string, string> = {};

  sc2IconFiles.forEach((fileName) => {
    const url = `${sc2PublicPath}${fileName}`;
    const exactName = normalizeAlias(fileName);
    const withoutButtonPrefix = exactName.replace(/^btn-/, '');

    addIconAlias(iconMap, exactName, url);
    addIconAlias(iconMap, withoutButtonPrefix, url);

    specialAliases[exactName]?.forEach((alias) => addIconAlias(iconMap, alias, url));

    const segments = withoutButtonPrefix.split('-');
    const category = categoryPrefixes.has(segments[0]) ? segments.shift() : null;
    const race = racePrefixes.has(segments[0]) ? segments.shift() : null;
    const itemName = expandCompoundSegments(segments.join('-'));

    if (!itemName) {
      return;
    }

    if (race) {
      addIconAliasVariants(iconMap, `${race}-${itemName}`, url);
      if (category) {
        addIconAliasVariants(iconMap, `${category}-${race}-${itemName}`, url);
      }
    }

    if (race && !mainRacePrefixes.has(race)) {
      return;
    }

    addIconAliasVariants(iconMap, itemName, url);
    if (category) {
      addIconAliasVariants(iconMap, `${category}-${itemName}`, url);
    }
  });

  return iconMap;
}

const icons: Record<string, string> = {
  ...baseIcons,
  ...buildSc2IconMap(),
};

function hasIcon(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(icons, name);
}

export const iconRegistry: IconRegistry = {
  has(name) {
    return hasIcon(name);
  },

  getUrl(name) {
    return hasIcon(name) ? icons[name] : null;
  },

  list() {
    return Object.keys(icons).sort();
  },
};
