export function getLayoutTemplate(screenType: string): string {
  switch (screenType.toLowerCase()) {
    case 'scenario':
      return 'Branching layout with avatars, choice buttons, and visual feedback.';
    case 'drag-and-drop':
      return 'Grid layout with draggable icons and drop zones.';
    case 'click-and-reveal':
      return '2x3 icon grid; click to open modals with info.';
    default:
      return 'Centered visual and text with consistent AMP branding.';
  }
}
