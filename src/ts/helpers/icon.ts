import * as icons from './icons';

const customIcons: { [type: string]: icons.IconCreator } = {};

export function getIcon(type: string): icons.IconCreator {
  const defaultIcon = icons[type];
  if (defaultIcon) {
    return defaultIcon;
  }

  const customIcon = customIcons[type];
  if (customIcon) {
    return customIcon;
  }

  return icons.javascript;
}

export function addIconFromPath(
  type: string,
  path: string,
  className?: string,
  customize?: (element: SVGElement) => void
): void {
  const iconCreator = icons.makeIconCreator(path, className || `icon-${type}`, customize);
  customIcons[type] = iconCreator;
}
