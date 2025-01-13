export function getSeatSelector(type: string, number: number): string {
  switch (type) {
    case "BED":
      return `#highlight_${number}, #highlight_${number} + path`;
    default:
      return `#seat_${number}_shape`;
  }
}

export function getSeatId(event: MouseEvent) {
  if (!(event.target instanceof Element)) {
    return null;
  }

  let target = event.target;
  let seat: string | null = null;
  while (target !== document.body) {
    if (seat) {
      const wagon = target.getAttribute("data-wagon");
      if (wagon) {
        return [parseInt(wagon), parseInt(seat)];
      }
    } else if (target.id.startsWith("seat_")) {
      seat = target.id.slice(5);
    } else if (target.id.startsWith("bed_")) {
      seat = target.id.slice(4);
    }
    target = target.parentElement!;
  }
  return null;
}
